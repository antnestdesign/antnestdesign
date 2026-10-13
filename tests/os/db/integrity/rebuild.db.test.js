import { spawn } from "node:child_process";
import { afterEach, beforeEach, expect, test } from "vitest";
import { assertContainer, CONTAINER } from "../rebuild/stack.mjs";
import { admin, COST_ID, costState, draft, executeSql, publish, request, resetIntegrity } from "./helpers.mjs";

beforeEach(resetIntegrity);
afterEach(()=>executeSql("SELECT set_config('request.and_os_cost_rpc','on',true); DELETE FROM public.cost_publish_log WHERE reason='SYSTEM_REBUILD_LIMIT'; DELETE FROM public.cost_items WHERE item_code='SYSTEM_REBUILD_PENDING';"));

test("REBUILD-COST pending create/update/validate/cancel resolve exact Production row type",async()=>{
  const values={p_item_code:"SYSTEM_REBUILD_PENDING",p_category:"TEST",p_subcategory:"SERVICE",p_item_name:"SYNTHETIC PENDING",p_unit:"unit",
    p_calculation_basis:"manual_input",p_cost_price:100000,p_margin_rate:0.3,p_is_active:true,p_sort_order:999};
  expect((await request("/rest/v1/rpc/validate_and_os_cost_item_code",{account:"admin-active",method:"POST",body:{p_item_code:values.p_item_code}})).status).toBe(200);
  const created=await request("/rest/v1/rpc/create_cost_item_pending",{account:"admin-active",method:"POST",body:values});expect(created.status).toBe(200);
  expect(created.data.is_pending_new).toBe(true);
  const changed=await request("/rest/v1/rpc/update_cost_item_pending",{account:"admin-active",method:"POST",body:{...values,p_cost_item_id:created.data.id,p_cost_price:120000,p_is_active:false}});
  expect(changed.status).toBe(200);expect(changed.data.cost_price).toBe(120000);
  expect(changed.data.is_pending_new).toBe(true);expect(changed.data.is_active).toBe(false);expect(changed.data.draft_is_active).toBe(false);
  expect((await costState()).cost_items.find((row)=>row.id===COST_ID).cost_price).toBe(100000);
  expect((await request("/rest/v1/rpc/cancel_cost_item_draft",{account:"admin-active",method:"POST",body:{p_cost_item_id:created.data.id}})).status).toBe(200);
});

for(const value of ["NaN","Infinity","-Infinity"]) {
  test(`REBUILD-COST finite numeric boundary ${value}`,async()=>{
    const before=await costState();
    const rejected=await request("/rest/v1/rpc/save_cost_item_draft",{account:"admin-active",method:"POST",body:{p_cost_item_id:COST_ID,p_draft_cost_price:value}});
    expect(rejected.status).toBeGreaterThanOrEqual(400);expect(rejected.data.message).toContain("invalid draft cost price");
    expect(await costState()).toEqual(before);
  });
}

test("REBUILD-COST concurrent draft saves serialize without corrupting operating values",async()=>{
  const results=await Promise.all([draft(120000),draft(130000)]);expect(results.every((r)=>r.status===200)).toBe(true);
  const state=await costState();expect(state.cost_items[0].cost_price).toBe(100000);
  expect([120000,130000]).toContain(state.cost_items[0].draft_cost_price);expect(state.cost_item_history).toHaveLength(0);
});

test("REBUILD-COST draft waits on actual PostgreSQL row lock",async()=>{
  assertContainer();
  const child=spawn("docker",["exec","-i",CONTAINER,"psql","-U","postgres","-d","postgres","-Atq","-v","ON_ERROR_STOP=1"],{windowsHide:true,stdio:["pipe","pipe","pipe"]});
  let text="";
  const ready=new Promise((done,reject)=>{child.stdout.on("data",(chunk)=>{text+=chunk.toString();if(text.includes("LOCK_READY"))done();});child.on("error",reject);});
  const exited=new Promise((done)=>child.on("exit",done));
  child.stdin.end(`BEGIN; SELECT id FROM public.cost_items WHERE id='${COST_ID}' FOR UPDATE; SELECT 'LOCK_READY'; SELECT pg_sleep(1.5); COMMIT;`);
  try { await ready;const start=Date.now();expect((await draft()).status).toBe(200);expect(Date.now()-start).toBeGreaterThan(500); }
  finally { await exited; }
});

test("REBUILD-COST concurrent publish has one atomic winner and no duplicate version",async()=>{
  await draft();const result=await Promise.all([publish(),publish()]);expect(result.filter((r)=>r.status===200)).toHaveLength(1);
  expect(result.filter((r)=>r.status>=400)).toHaveLength(1);
  const state=await costState();expect(state.cost_publish_log).toHaveLength(1);expect(state.cost_item_history).toHaveLength(1);
  expect(state.cost_publish_log[0].version).toBe(state.cost_item_history[0].cost_version);
});

test("REBUILD-COST daily version cap rejects and rolls back without consuming draft",async()=>{
  await draft();executeSql(`SELECT set_config('request.and_os_cost_rpc','on',true);
    INSERT INTO public.cost_publish_log(version,reason,changed_item_count,published_by)
    VALUES(to_char(timezone('Asia/Seoul',now()),'YYYY.MM.DD')||'-999','SYSTEM_REBUILD_LIMIT',1,'${admin.id}');`);
  const before=await costState();const result=await publish();expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("daily publish version limit reached");expect(await costState()).toEqual(before);
});
