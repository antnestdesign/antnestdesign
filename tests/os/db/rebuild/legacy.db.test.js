import { beforeEach, expect, test } from "vitest";
import { dbRuntime, executeSql, resetFixtures } from "../runtime.mjs";
import { REBUILD_MODE } from "../guard.mjs";
import { ESTIMATE_A } from "../fixtures.mjs";

if (!REBUILD_MODE) throw new Error("PG17 rebuilt DB required; no substitute schema");
const { request, accounts } = dbRuntime();
const ids = { customers: "50000000-0000-4000-8000-000000000001", projects: "50000000-0000-4000-8000-000000000002", estimate_items: "50000000-0000-4000-8000-000000000003" };
beforeEach(() => {
  resetFixtures();
  executeSql(`DELETE FROM public.estimate_items WHERE id='${ids.estimate_items}';
    DELETE FROM public.projects WHERE id='${ids.projects}'; DELETE FROM public.customers WHERE id='${ids.customers}';
    INSERT INTO public.customers(id,name,memo) VALUES('${ids.customers}','SYNTHETIC LEGACY','PRIVATE SYNTHETIC');
    INSERT INTO public.projects(id,project_name,customer_id) VALUES('${ids.projects}','SYNTHETIC LEGACY','${ids.customers}');
    INSERT INTO public.estimate_items(id,estimate_id,item_name,cost) VALUES('${ids.estimate_items}','${ESTIMATE_A}','SYNTHETIC LEGACY',543210);`);
});

for (const table of Object.keys(ids)) {
  for (const account of [null, "staff-active", "manager-active", "admin-active"]) {
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
      test(`REBUILD-LEGACY ${table} ${account || "anon"} ${method}`, async () => {
        const before = await request(`/rest/v1/${table}?select=*&id=eq.${ids[table]}`, { service: true });
        const body = table === "customers" ? { name: "INJECTED" } : table === "projects" ? { project_name: "INJECTED" } : { item_name: "INJECTED", cost: 1 };
        const result = await request(`/rest/v1/${table}${method === "POST" ? "" : `?id=eq.${ids[table]}&select=*`}`, { account, method, ...(method === "POST" || method === "PATCH" ? { body } : {}) });
        const permitted = method === "GET" && ["manager-active", "admin-active"].includes(account);
        if (permitted) { expect(result.status).toBe(200); expect(result.data).toEqual(before.data); }
        else expect([401,403].includes(result.status) || (method === "GET" && result.status === 200 && result.data.length === 0)).toBe(true);
        expect((await request(`/rest/v1/${table}?select=*&id=eq.${ids[table]}`, { service: true })).data).toEqual(before.data);
      });
    }
  }
  test(`REBUILD-LEGACY ${table} GRANT+RLS controls are intentional`, () => {
    const row = JSON.parse(executeSql(`SELECT jsonb_build_object('select',has_table_privilege('authenticated','public.${table}','SELECT'),
      'insert',has_table_privilege('authenticated','public.${table}','INSERT'),'update',has_table_privilege('authenticated','public.${table}','UPDATE'),
      'delete',has_table_privilege('authenticated','public.${table}','DELETE'),'anon',has_table_privilege('anon','public.${table}','SELECT'),
      'rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.${table}'::regclass),
      'policies',(SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='${table}'))`));
    expect(row).toEqual({ select:true, insert:false, update:false, delete:false, anon:false, rls:true, policies:1 });
  });
}

for (const account of ["admin-inactive", "admin-must-change-password", "staff-must-change-password"]) {
  for (const [rpc, args] of [
    ["create_contract_package_snapshot", { p_payload:{} }],
    ["confirm_contract_package_snapshot", { p_package_id: ESTIMATE_A }],
    ["create_contract_change_order", { p_payload:{} }],
    ["approve_contract_change_order", { p_change_order_id: ESTIMATE_A, p_payload:{} }],
  ]) {
    test(`REBUILD-ACTOR ${account} ${rpc} rejects before payload/target resolution`, async () => {
      const result = await request(`/rest/v1/rpc/${rpc}`, { service:true, method:"POST", body:{ p_actor_user_id:accounts[account].id, ...args } });
      expect(result.status).toBeGreaterThanOrEqual(400);
      expect(result.data.message).toMatch(/not allowed|only for admin/);
    });
  }
}
