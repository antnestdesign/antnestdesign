import { beforeEach, expect, test } from "vitest";
import { NextRequest } from "next/server";
import { ACCOUNTS, COST_ID, ESTIMATE_A, ESTIMATE_B, ESTIMATE_NEW, estimatePayload } from "./fixtures.mjs";
import { dbRuntime, executeSql, resetFixtures } from "./runtime.mjs";

const { request, accounts } = dbRuntime();
const active = (account) => account.is_active && !account.must_change_password;
const fullEstimateAccess = (account) => active(account) && ["admin", "manager"].includes(account.role);
const adminAccess = (account) => active(account) && account.role === "admin";

beforeEach(() => resetFixtures());

function expectDenied(result) {
  expect([401, 403].includes(result.status) || (result.status === 200 && Array.isArray(result.data) && result.data.length === 0)).toBe(true);
}

async function originalEstimate() {
  const response = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`, { service: true });
  expect(response.status).toBe(200);
  return response.data[0];
}

for (const account of ACCOUNTS) {
  test(`[DB-E-${account.label}-SELECT] estimates row visibility`, async () => {
    const response = await request("/rest/v1/estimates?select=*&order=id", { account: account.label });
    if (fullEstimateAccess(account)) {
      expect(response.status).toBe(200);
      expect(response.data.map(({ id }) => id)).toEqual([ESTIMATE_A, ESTIMATE_B]);
      expect(response.data[0].estimate_data.internalDetails.length).toBeGreaterThan(0);
    } else expectDenied(response);
  });

  test(`[DB-E-${account.label}-INSERT] estimate creation boundary`, async () => {
    const response = await request("/rest/v1/estimates", {
      account: account.label, method: "POST", body: estimatePayload(ESTIMATE_NEW),
    });
    if (fullEstimateAccess(account)) {
      expect(response.status).toBe(201);
      expect(response.data[0].id).toBe(ESTIMATE_NEW);
    } else expectDenied(response);
    const persisted = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_NEW}&select=id`, { service: true });
    expect(persisted.data).toHaveLength(fullEstimateAccess(account) ? 1 : 0);
  });

  test(`[DB-E-${account.label}-UPDATE] allowed business field update`, async () => {
    const before = await originalEstimate();
    const response = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}`, {
      account: account.label, method: "PATCH", body: { project_name: "SYSTEM_DB_2B_EDIT", phone: "000-0000-0002" },
    });
    if (fullEstimateAccess(account)) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    } else expectDenied(response);
    const after = await originalEstimate();
    expect(after.project_name).toBe(fullEstimateAccess(account) ? "SYSTEM_DB_2B_EDIT" : before.project_name);
    expect(after.estimate_data).toEqual(before.estimate_data);
    expect(after.cost_total).toBe(before.cost_total);
  });

  test(`[DB-E-${account.label}-DELETE] only active normal admin can delete`, async () => {
    const response = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}`, { account: account.label, method: "DELETE" });
    if (adminAccess(account)) {
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(1);
    } else expectDenied(response);
    const persisted = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=id`, { service: true });
    expect(persisted.data).toHaveLength(adminAccess(account) ? 0 : 1);
  });

  test(`[DB-C-${account.label}] cost read and direct write grants`, async () => {
    const before = await request(`/rest/v1/cost_items?id=eq.${COST_ID}&select=*`, { service: true });
    const read = await request("/rest/v1/cost_items?select=*", { account: account.label });
    if (fullEstimateAccess(account)) {
      expect(read.status).toBe(200);
      expect(read.data).toHaveLength(1);
    } else expectDenied(read);
    for (const [method, body] of [
      ["POST", { item_code: "SYSTEM_DB_2B_REJECT", category: "TEST", item_name: "Denied", unit: "unit", cost_price: 1 }],
      ["PATCH", { cost_price: 1 }], ["DELETE", undefined],
    ]) {
      const response = await request(`/rest/v1/cost_items${method === "POST" ? "" : `?id=eq.${COST_ID}`}`, { account: account.label, method, body });
      expectDenied(response);
    }
    const after = await request(`/rest/v1/cost_items?id=eq.${COST_ID}&select=*`, { service: true });
    expect(after.data).toEqual(before.data);
  });

  for (const rpc of ["save_cost_item_draft", "cancel_cost_item_draft", "publish_cost_drafts"]) {
    test(`[DB-R-${account.label}-${rpc}] RPC internal role check`, async () => {
      executeSql(`select set_config('request.and_os_cost_rpc','on',true);
        update public.cost_items set draft_cost_price=110000 where id='${COST_ID}';`);
      const body = rpc === "publish_cost_drafts" ? { p_reason: "SYSTEM_DB_2B_PERMISSION_TEST", p_memo: null }
        : rpc === "save_cost_item_draft" ? { p_cost_item_id: COST_ID, p_draft_cost_price: 120000, p_draft_margin_rate: 0.3, p_draft_is_active: true }
        : { p_cost_item_id: COST_ID };
      const before = await request(`/rest/v1/cost_items?id=eq.${COST_ID}&select=*`, { service: true });
      const response = await request(`/rest/v1/rpc/${rpc}`, { account: account.label, method: "POST", body });
      if (adminAccess(account)) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.data.message).toContain("AND OS admin permission required");
        const after = await request(`/rest/v1/cost_items?id=eq.${COST_ID}&select=*`, { service: true });
        expect(after.data).toEqual(before.data);
      }
    });
  }

  test(`[DB-S-${account.label}] safe view caller filter and nested whitelist`, async () => {
    const response = await request("/rest/v1/staff_estimates_view?select=*&order=id", { account: account.label });
    if (active(account) && account.role === "staff") {
      expect(response.status).toBe(200);
      expect(response.data.map(({ id }) => id)).toEqual([ESTIMATE_A, ESTIMATE_B]);
      const serialized = JSON.stringify(response.data);
      for (const key of ["cost_total", "margin_rate", "costTotal", "marginRate", "internalDetails", "internalSummary", "costSnapshot", "internalMemo", '"cost"', "SYNTHETIC_PRIVATE"]) {
        expect(serialized).not.toContain(key);
      }
      expect(response.data[0].estimate_data.customerQuote.total).toBe(3770000);
      expect(response.data[0].estimate_data.inputs.existingPipeCleaningEnabled).toBe(false);
    } else expectDenied(response);
  });

  test(`[DB-N-${account.label}] real Auth/profile Next context matches account state`, async () => {
    const role = await request("/rest/v1/rpc/current_and_os_role", { account: account.label, method: "POST", body: {} });
    expect(role.status).toBe(200);
    expect(role.data).toBe(active(account) ? account.role : "");
    const server = await import("../../../app/api/os/_lib/server.ts");
    const req = new NextRequest("https://os.invalid/api/os/contract-packages", {
      headers: { Authorization: `Bearer ${accounts[account.label].token}` },
    });
    if (active(account)) {
      const context = await server.getUserContext(req);
      expect(context.profile.id).toBe(accounts[account.label].id);
      expect(context.profile.role).toBe(account.role);
    } else await expect(server.getUserContext(req)).rejects.toMatchObject({ status: 403 });
  });

  if (!adminAccess(account)) {
    test(`[DB-N-${account.label}-CONFIRM] real Next contract confirm is forbidden`, async () => {
      const route = await import("../../../app/api/os/contract-packages/[id]/confirm/route.ts");
      const response = await route.POST(new NextRequest("https://os.invalid/api/os/contract-packages/id/confirm", {
        method: "POST", headers: { Authorization: `Bearer ${accounts[account.label].token}` },
      }), { params: Promise.resolve({ id: ESTIMATE_A }) });
      expect(response.status).toBe(403);
    });
  }

  test(`[DB-R-${account.label}-CONFIRM] direct contract RPC EXECUTE denied`, async () => {
    const response = await request("/rest/v1/rpc/confirm_contract_package_snapshot", {
      account: account.label, method: "POST", body: { p_package_id: ESTIMATE_A, p_actor_user_id: accounts[account.label].id },
    });
    expect(response.status).toBe(403);
  });
}

test("DB-S-TAMPER staff direct internal JSON replacement is rejected and existing internals survive", async () => {
  const before = await originalEstimate();
  const response = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}`, {
    account: "staff-active", method: "PATCH", body: { estimate_data: { inputs: { clientName: "Tamper" }, internalDetails: [], costSnapshot: {} }, cost_total: 0 },
  });
  expectDenied(response);
  expect(await originalEstimate()).toEqual(before);
});

test("DB-ANON anonymous estimates and cost RPC access denied", async () => {
  expectDenied(await request("/rest/v1/estimates?select=*"));
  const response = await request("/rest/v1/rpc/cancel_cost_item_draft", { method: "POST", body: { p_cost_item_id: COST_ID } });
  expect([401, 403]).toContain(response.status);
});

test("DB-META table grants and estimates RLS are distinct controls", () => {
  const result = JSON.parse(executeSql(`select jsonb_build_object(
    'estimate_update',has_table_privilege('authenticated','public.estimates','UPDATE'),
    'estimate_delete',has_table_privilege('authenticated','public.estimates','DELETE'),
    'estimate_rls',(select relrowsecurity from pg_class where oid='public.estimates'::regclass),
    'cost_direct_update',has_table_privilege('authenticated','public.cost_items','UPDATE'),
    'safe_view_select',has_table_privilege('authenticated','public.staff_estimates_view','SELECT'));`));
  expect(result).toEqual({ estimate_update: true, estimate_delete: true, estimate_rls: true, cost_direct_update: false, safe_view_select: true });
});

test("DB-META RPC definer/search_path/EXECUTE privileges", () => {
  const result = JSON.parse(executeSql(`select jsonb_build_object(
    'cost_definer',(select prosecdef from pg_proc where oid='public.cancel_cost_item_draft(uuid)'::regprocedure),
    'cost_path',(select proconfig from pg_proc where oid='public.cancel_cost_item_draft(uuid)'::regprocedure),
    'anon_cost',has_function_privilege('anon','public.cancel_cost_item_draft(uuid)','EXECUTE'),
    'authenticated_cost',has_function_privilege('authenticated','public.cancel_cost_item_draft(uuid)','EXECUTE'),
    'authenticated_confirm',has_function_privilege('authenticated','public.confirm_contract_package_snapshot(uuid,uuid)','EXECUTE'),
    'service_confirm',has_function_privilege('service_role','public.confirm_contract_package_snapshot(uuid,uuid)','EXECUTE'));`));
  expect(result.cost_definer).toBe(true);
  expect(result.cost_path).toContain("search_path=public");
  expect(result.anon_cost).toBe(false);
  expect(result.authenticated_cost).toBe(true);
  expect(result.authenticated_confirm).toBe(false);
  expect(result.service_confirm).toBe(true);
});
