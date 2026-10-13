import { afterEach, beforeEach, expect, test } from "vitest";
import { dbRuntime, dbFile, executeSql, resetFixtures } from "../runtime.mjs";
import { ESTIMATE_A } from "../fixtures.mjs";
import { ESTIMATE_INPUT_SCHEMA } from "../../../../public/os-app/src/estimate-inputs.js";
import { safeInputs } from "../../../../app/api/os/estimates/_lib/estimates.js";

const { accounts, request } = dbRuntime();
const created = new Set();
async function http(path, role="admin-active", method="GET", body) {
  const response = await fetch(`http://127.0.0.1:3044${path}`, { method, redirect:"error",
    headers:{"Content-Type":"application/json",...(role?{Authorization:`Bearer ${accounts[role].token}`}:{})},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}) });
  const text=await response.text();
  return { status:response.status, data:text?JSON.parse(text):null };
}
function noInternal(value) {
  if(!value||typeof value!=="object")return;
  for(const [key,child] of Object.entries(value)) {
    expect(key).not.toMatch(/^(cost|costTotal|cost_total|costSnapshot|margin|marginRate|margin_rate|profit|internalDetails|internalSummary|internalMemo)$/i);
    noInternal(child);
  }
}
function input() {
  const base=safeInputs(Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id,s])=>[id,s.type==="checkbox"?false:s.value])));
  return {...base,projectName:"SYSTEM_REBUILD_HTTP",areaPyeong:"33",existingPipeCleaningEnabled:true};
}
beforeEach(()=>{executeSql(dbFile("integrity/reset.sql"));resetFixtures();});
afterEach(async()=>{
  for(const id of created)await request(`/rest/v1/estimates?id=eq.${id}`,{service:true,method:"DELETE"});
  created.clear();executeSql(dbFile("integrity/reset.sql"));
});

for(const role of ["admin-active","manager-active","staff-active"]) {
  test(`REBUILD-HTTP ${role} authenticated estimate create/read/update and delete boundary`,async()=>{
    expect((await http("/api/os/me",role)).status).toBe(200);
    const saved=await http("/api/os/estimates",role,"POST",{inputs:input(),address:"SYNTHETIC SITE"});
    expect(saved.status).toBe(201);const id=saved.data.id;created.add(id);
    if(role==="staff-active")noInternal(saved.data);
    const read=await http(`/api/os/estimates/${id}`,role);expect(read.status).toBe(200);
    const changed=await http(`/api/os/estimates/${id}`,role,"PATCH",{inputs:{...input(),projectName:"SYSTEM_REBUILD_HTTP_EDIT"}});
    expect(changed.status).toBe(200);if(role==="staff-active")noInternal(changed.data);
    // Existing admin/manager client uses REST; the safe API has no DELETE route.
    expect((await http(`/api/os/estimates/${id}`,role,"DELETE")).status).toBe(405);
    const deleted=await request(`/rest/v1/estimates?id=eq.${id}`,{account:role,method:"DELETE"});
    if(role==="admin-active") { expect(deleted.status).toBe(200);expect(deleted.data).toHaveLength(1); }
    else expect([401,403].includes(deleted.status)||(deleted.status===200&&deleted.data.length===0)).toBe(true);
  });
  test(`REBUILD-HTTP ${role} options and three-document preview use rebuilt DB`,async()=>{
    const before=await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`,{service:true});
    const options=await http(`/api/os/contract-options?estimateId=${ESTIMATE_A}`,role);expect(options.status).toBe(200);
    const preview=await http("/api/os/contract-packages/preview",role,"POST",{estimate_id:ESTIMATE_A});
    if(role==="manager-active")expect(preview.status).toBe(403);
    else {
      expect(preview.status).toBe(200);expect(preview.data.documents.map((d)=>d.document_type)).toEqual(["CONTRACT","QUOTE","SPEC"]);
      if(role==="staff-active")noInternal(preview.data);
    }
    expect((await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`,{service:true})).data).toEqual(before.data);
    if(role!=="admin-active")expect((await http(`/api/os/contract-packages/${ESTIMATE_A}/confirm`,role,"POST",{})).status).toBe(403);
  });
  test(`REBUILD-HTTP ${role} cost/account/audit role boundary`,async()=>{
    const cost=await request("/rest/v1/cost_items?select=*",{account:role});
    expect(cost.status).toBe(200);expect(cost.data.length).toBe(role==="staff-active"?0:1);
    for(const path of ["/api/os/users","/api/os/audit-logs"])
      expect((await http(path,role)).status).toBe(role==="admin-active"?200:403);
  });
}

test("REBUILD-HTTP admin creates and confirms three immutable documents",async()=>{
  const options=await http("/api/os/contract-options","admin-active","PUT",{estimate_id:ESTIMATE_A,contract_info:{contract_date:"2026-10-13",start_date:"2026-11-01",planned_completion_date:"2026-12-01"}});
  expect(options.status).toBe(200);
  const pkg=await http("/api/os/contract-packages","admin-active","POST",{estimate_id:ESTIMATE_A});expect(pkg.status).toBe(201);
  const confirmed=await http(`/api/os/contract-packages/${pkg.data.id}/confirm`,"admin-active","POST",{});expect(confirmed.status).toBe(200);
  expect(confirmed.data.status).toBe("CONTRACTED");
  expect(confirmed.data.contract_document_versions.every((d)=>d.generation_status==="FINAL"&&d.locked_at)).toBe(true);
  expect((await http(`/api/os/contract-packages/${pkg.data.id}/confirm`,"admin-active","POST",{})).status).toBeGreaterThanOrEqual(400);
});

test("REBUILD-HTTP login sessions fail closed for inactive/password-change/anonymous",async()=>{
  expect((await http("/api/os/me",null)).status).toBe(401);
  for(const role of ["admin-inactive","admin-must-change-password","staff-inactive","staff-must-change-password"])
    expect((await http("/api/os/estimates",role)).status).toBe(403);
});
