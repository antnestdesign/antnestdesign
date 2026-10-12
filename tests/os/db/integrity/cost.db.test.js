import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, expect, test } from "vitest";
import { ROOT } from "../runtime.mjs";
import { admin, COST_ID, ESTIMATE_A, costState, draft, executeSql, publish, request, resetIntegrity } from "./helpers.mjs";

beforeEach(resetIntegrity);
const EXTRA = "40000000-0000-4000-8000-000000000003";
const PENDING = "40000000-0000-4000-8000-000000000004";
const operating = (row) => [row.cost_price, row.default_margin_rate, row.is_active];

function extraCosts() {
  executeSql(`select set_config('request.and_os_cost_rpc','on',true);
    insert into public.cost_items(id,item_code,item_name,category,unit,cost_price,default_margin_rate,is_active,is_pending_new,draft_cost_price)
    values ('${EXTRA}','TEST_2B2_COST_ITEM','Synthetic extra','TEST','unit',200000,0.3,true,false,210000),
    ('${PENDING}','TEST_2B2_PENDING','Synthetic pending','TEST','unit',300000,0.3,false,true,310000);`);
}

test("COST-01 draft stores only draft policy and actual local actor", async () => {
  const before = await costState();
  expect((await draft()).status).toBe(200);
  const after = await costState();
  const row = after.cost_items.find((item) => item.id === COST_ID);
  expect(operating(row)).toEqual(operating(before.cost_items[0]));
  expect([row.draft_cost_price,row.draft_margin_rate,row.draft_is_active]).toEqual([120000,0.4,false]);
  expect(row.draft_updated_at).toBeTruthy(); expect(row.draft_updated_by).toBe(admin.id);
  expect(after.cost_item_history).toEqual(before.cost_item_history);
  expect(after.cost_publish_log).toEqual(before.cost_publish_log);
  const unchanged = await request("/rest/v1/rpc/save_cost_item_draft",{account:"admin-active",method:"POST",body:{
    p_cost_item_id:COST_ID,p_draft_cost_price:100000,p_draft_margin_rate:0.3,p_draft_is_active:true,
  }});
  expect(unchanged.status).toBe(200);
  expect([unchanged.data.draft_cost_price,unchanged.data.draft_margin_rate,unchanged.data.draft_is_active,
    unchanged.data.draft_updated_at,unchanged.data.draft_updated_by]).toEqual([null,null,null,null,null]);
  await draft();
  const cleared = await request("/rest/v1/rpc/save_cost_item_draft",{account:"admin-active",method:"POST",body:{p_cost_item_id:COST_ID}});
  expect(cleared.status).toBe(200);
  expect([cleared.data.draft_cost_price,cleared.data.draft_margin_rate,cleared.data.draft_is_active,
    cleared.data.draft_updated_at,cleared.data.draft_updated_by]).toEqual([null,null,null,null,null]);
});

test("COST-02 existing draft cancel clears drafts, not operating values", async () => {
  expect((await draft()).status).toBe(200);
  const before = await costState();
  const result = await request("/rest/v1/rpc/cancel_cost_item_draft", { account: "admin-active", method: "POST", body: { p_cost_item_id: COST_ID } });
  expect(result.status).toBe(200);
  const after = await costState();
  expect(operating(after.cost_items[0])).toEqual(operating(before.cost_items[0]));
  expect([after.cost_items[0].draft_cost_price,after.cost_items[0].draft_margin_rate,after.cost_items[0].draft_is_active]).toEqual([null,null,null]);
  expect(after.cost_item_history).toEqual(before.cost_item_history);
});

test("COST-03 pending-new cancel deletes only the pending fixture", async () => {
  extraCosts();
  const result = await request("/rest/v1/rpc/cancel_cost_item_draft", { account: "admin-active", method: "POST", body: { p_cost_item_id: PENDING } });
  expect(result.status).toBe(200);
  const after = await costState();
  expect(after.cost_items.find((row) => row.id === PENDING)).toBeUndefined();
  expect(after.cost_items.find((row) => row.id === COST_ID)).toBeDefined();
  expect(after.cost_items.find((row) => row.id === EXTRA)).toBeDefined();
});

test("COST-04 cancel-all count includes pending deletion and existing draft clears", async () => {
  extraCosts(); await draft();
  const before = await costState();
  const result = await request("/rest/v1/rpc/cancel_all_cost_drafts", { account: "admin-active", method: "POST", body: {} });
  expect(result.status).toBe(200); expect(result.data).toBe(3);
  const after = await costState();
  expect(after.cost_items).toHaveLength(2);
  for (const row of after.cost_items) {
    expect(operating(row)).toEqual(operating(before.cost_items.find((old) => old.id === row.id)));
    expect([row.draft_cost_price,row.draft_margin_rate,row.draft_is_active]).toEqual([null,null,null]);
  }
});

test("COST-05 publish atomically updates values/history/log/version/actor", async () => {
  await draft();
  const before = await costState();
  const result = await publish();
  expect(result.status).toBe(200);
  expect(result.data[0].changed_item_count).toBe(1);
  const after = await costState();
  expect(operating(after.cost_items[0])).toEqual([120000,0.4,false]);
  expect([after.cost_items[0].draft_cost_price,after.cost_items[0].draft_margin_rate,after.cost_items[0].draft_is_active]).toEqual([null,null,null]);
  expect(after.cost_item_history).toHaveLength(before.cost_item_history.length+1);
  expect(after.cost_publish_log).toHaveLength(before.cost_publish_log.length+1);
  const history = after.cost_item_history[0], log = after.cost_publish_log[0];
  expect([history.old_cost_price,history.new_cost_price]).toEqual([100000,120000]);
  expect([history.old_margin_rate,history.new_margin_rate]).toEqual([0.3,0.4]);
  expect([history.old_is_active,history.new_is_active]).toEqual([true,false]);
  expect(history.changed_by).toBe(admin.id); expect(log.published_by).toBe(admin.id);
  expect(history.cost_version).toBe(result.data[0].version); expect(log.version).toBe(history.cost_version);
  expect(log.changed_item_count).toBe(1);
});

test("COST-06 publish-log failure rolls back operating/history/draft/version log", async () => {
  await draft();
  executeSql(`create or replace function public.test_integrity_fail() returns trigger language plpgsql as $$
    begin raise exception 'SYNTHETIC_INJECTED_FAILURE'; end $$;
    create trigger test_integrity_publish_failure before insert on public.cost_publish_log
    for each row execute function public.test_integrity_fail();`);
  const before = await costState();
  const result = await publish();
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("SYNTHETIC_INJECTED_FAILURE");
  expect(await costState()).toEqual(before);
});

test("COST-07 guard flag exists before the first actual history INSERT", async () => {
  executeSql(`create or replace function public.test_integrity_history_check() returns trigger language plpgsql as $$
    begin if current_setting('request.and_os_cost_rpc',true) is distinct from 'on' then
      raise exception 'SYNTHETIC_HISTORY_FLAG_MISSING'; end if; return new; end $$;
    create trigger test_integrity_history_gate before insert on public.cost_item_history
    for each row execute function public.test_integrity_history_check();`);
  await draft(); expect((await publish()).status).toBe(200);
  const body = JSON.parse(executeSql("select to_json(prosrc) from pg_proc where oid='public.publish_cost_drafts(text,text)'::regprocedure;"));
  const source = readFileSync(resolve(ROOT,"supabase/rfc_cost_draft_rpc_hardening_hotfix.sql"),"utf8");
  const match = source.match(/create or replace function public\.publish_cost_drafts\([\s\S]*?as \$\$([\s\S]*?)\$\$;/);
  expect(match).not.toBeNull();
  expect(body.replaceAll("\r\n","\n").trim()).toBe(match[1].replaceAll("\r\n","\n").trim());
  expect(body.indexOf("set_config('request.and_os_cost_rpc'")).toBeLessThan(body.indexOf("insert into public.cost_item_history"));
  console.info("Tracked publish body SHA256",createHash("sha256").update(body).digest("hex"));
});

test("COST-08 repeat publish with no drafts explicitly refuses without extra logs/history", async () => {
  await draft(); expect((await publish()).status).toBe(200);
  const before = await costState();
  const result = await publish();
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("no draft cost changes");
  expect(await costState()).toEqual(before);
});

test("COST-09 old estimate snapshot is unchanged while current cost read advances", async () => {
  const before = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`,{service:true});
  await draft(); expect((await publish()).status).toBe(200);
  const after = await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`,{service:true});
  expect(after.data).toEqual(before.data);
  expect(after.data[0].estimate_data.customerQuote).toEqual(before.data[0].estimate_data.customerQuote);
  expect(after.data[0].estimate_data.internalDetails).toEqual(before.data[0].estimate_data.internalDetails);
  expect(after.data[0].estimate_data.costSnapshot).toEqual(before.data[0].estimate_data.costSnapshot);
  const current = await request(`/rest/v1/cost_items?id=eq.${COST_ID}&select=cost_price`,{account:"admin-active"});
  expect(current.data[0].cost_price).toBe(120000);
});

test("COST-CANONICAL version allocator matches call contract and advances without duplicate logs", async () => {
  await draft();
  const first = await publish();
  expect(first.status).toBe(200);
  await draft(130000);
  const second = await publish();
  expect(second.status).toBe(200);
  const a = first.data[0].version, b = second.data[0].version;
  expect(a).toMatch(/^\d{4}\.\d{2}\.\d{2}-\d{3}$/);
  expect(b).not.toBe(a);
  if (a.slice(0,10) === b.slice(0,10)) expect(Number(b.slice(-3))).toBe(Number(a.slice(-3))+1);
  const denied = await request("/rest/v1/rpc/next_cost_publish_version",{account:"admin-active",method:"POST",body:{}});
  expect(denied.status).toBeGreaterThanOrEqual(400);
  const state = await costState();
  expect(state.cost_publish_log).toHaveLength(2);
  expect(state.cost_item_history).toHaveLength(2);
  const signature = executeSql("select pg_get_function_identity_arguments(oid) || ' -> ' || pg_get_function_result(oid) from pg_proc where oid='public.save_cost_item_draft(uuid,numeric,numeric,boolean)'::regprocedure;");
  expect(signature).toBe("p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean -> cost_items");
});

test("COST-CANONICAL invalid draft rolls back and preserves operating/history/log values", async () => {
  const before = await costState();
  expect((await draft(-1)).status).toBeGreaterThanOrEqual(400);
  expect((await request("/rest/v1/rpc/save_cost_item_draft",{account:"admin-active",method:"POST",body:{
    p_cost_item_id:COST_ID,p_draft_margin_rate:1,
  }})).status).toBeGreaterThanOrEqual(400);
  expect(await costState()).toEqual(before);
});

test("COST-CANONICAL version rollback workflow restores history values through draft then publish", async () => {
  await draft(); expect((await publish()).status).toBe(200);
  const before = await costState();
  const history = before.cost_item_history[0];
  const restored = await request("/rest/v1/rpc/save_cost_item_draft",{account:"admin-active",method:"POST",body:{
    p_cost_item_id:COST_ID,p_draft_cost_price:history.old_cost_price,
    p_draft_margin_rate:history.old_margin_rate,p_draft_is_active:history.old_is_active,
  }});
  expect(restored.status).toBe(200);
  expect(operating((await costState()).cost_items[0])).toEqual(operating(before.cost_items[0]));
  expect((await publish()).status).toBe(200);
  const after = await costState();
  expect(operating(after.cost_items[0])).toEqual([100000,0.3,true]);
  expect(after.cost_item_history).toHaveLength(2);
  expect(after.cost_publish_log).toHaveLength(2);
  expect(after.cost_item_history.find((row)=>row.id===history.id)).toEqual(history);
});
