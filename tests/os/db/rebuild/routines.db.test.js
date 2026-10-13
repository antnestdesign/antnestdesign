import { expect, test } from "vitest";
import { dbRuntime, executeSql } from "../runtime.mjs";

const { accounts, request }=dbRuntime();
const functions=JSON.parse(executeSql(`SELECT jsonb_agg(jsonb_build_object('name',p.proname,'owner',pg_get_userbyid(p.proowner),'config',p.proconfig,
  'anon',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),
  'service',has_function_privilege('service_role',p.oid,'EXECUTE'),
  'public',EXISTS(SELECT 1 FROM aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE')) ORDER BY p.proname)
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef
  AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e');`));
expect(functions).toHaveLength(15);
for(const f of functions) {
  test(`REBUILD-DEFINER ${f.name} runtime owner/path/ACL`,()=>{
    expect(f.owner).toBe("postgres");expect(f.config).toContain("search_path=public");expect(f.public).toBe(false);expect(f.anon).toBe(false);
    const serviceOnly=["create_contract_package_snapshot","confirm_contract_package_snapshot","create_contract_change_order","approve_contract_change_order","next_cost_publish_version"];
    expect(f.authenticated).toBe(f.name!=="and_os_require_cost_rpc_mutation"&&!serviceOnly.includes(f.name));
    expect(f.service).toBe(f.name!=="and_os_require_cost_rpc_mutation");
  });
}
test("REBUILD-TRIGGERS profile/time helpers resolve through actual fixture UPDATE",()=>{
  const row=JSON.parse(executeSql(`UPDATE public.profiles SET name=name WHERE id='${accounts["admin-active"].id}';
    SELECT jsonb_build_object('updated',updated_at IS NOT NULL,'now',public.and_os_now() IS NOT NULL) FROM public.profiles WHERE id='${accounts["admin-active"].id}';`));
  expect(row).toEqual({updated:true,now:true});
});
test("REBUILD-ACTOR missing profile fails closed before package payload resolution",async()=>{
  const r=await request("/rest/v1/rpc/create_contract_package_snapshot",{service:true,method:"POST",body:{p_actor_user_id:"60000000-0000-4000-8000-000000000001",p_payload:{}}});
  expect(r.status).toBeGreaterThanOrEqual(400);expect(r.data.message).toContain("not allowed");
});
