import { beforeEach, expect, test, vi } from "vitest";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { describeSiteRows, parseSiteCostConfig } from "../../../app/api/os/_lib/calculation/site-costs.js";
import { mountSiteCostView } from "../../../public/os-app/src/site-cost-view.js";
import { SYSTEM_TRADE_ORDER, systemCategoryLabel } from "../../../public/os-app/src/cost-view-model.js";
const mock = vi.hoisted(()=>({fetch:vi.fn()}));
vi.mock("../../../app/api/os/_lib/server",()=>({ApiError:class extends Error {constructor(status,message){super(message);this.status=status;}},supabaseFetch:(...args)=>mock.fetch(...args),errorResponse:e=>Response.json({error:e.message},{status:e.status||500})}));
import { calculatePrivilegedEstimate, calculateStaffEstimate, validateStaffBody, projectStaffEstimate, estimateRowPayload } from "../../../app/api/os/estimates/_lib/estimates.js";
const values = { WOOD_LABOR_WORKER:300000, WOOD_MACHINE_DAY:150000, WOOD_DRYWALL_SHEET:3500, WOOD_STUD_BUNDLE:22000, WOOD_MDF_SHEET:12500, WOOD_PLYWOOD_SHEET:30000 };
const prices = Object.fromEntries(Object.entries(values).map(([code,price])=>[code,{price,source:"합성 DB",standardPrice:price}]));
const input = { projectName:"SYSTEM_WOOD", sectionCarpentryEnabled:true,carpentryCostMode:"assembly-v1",carpentryCofferType:"new",carpentryCofferUnits:"2" };
const calculate = (inputs=input,p=prices) => {const core=createEstimateCalculation({carpentryPrices:p}),result=core.calculate(core.readState(inputs));return {...result,rows:describeSiteRows(result.details)};};
const ctx = role=>({authUser:{id:"synthetic-user"},profile:{role,email:"synthetic@example.invalid"}});
beforeEach(()=>{mock.fetch.mockReset();mock.fetch.mockResolvedValue(Object.entries(values).map(([item_code,cost_price])=>({item_code,cost_price,category:"목공",unit:"장",is_active:true})));});
test.each(["new","change"])("%s coffer two sites has exact specified BOM and no extra common overhead",type=>{
  const r=calculate({...input,carpentryCofferType:type});
  expect(r.rows.map(r=>[r.code,r.quantity])).toEqual([["WOOD_LABOR_WORKER",4],["WOOD_MACHINE_DAY",4],["WOOD_DRYWALL_SHEET",20],["WOOD_STUD_BUNDLE",8],["WOOD_MDF_SHEET",8]]);
  expect(r.directCost).toBe(2146000);expect(r.rows.some(r=>/부자재|양중/.test(r.name))).toBe(false);
});
test("curtain and drop use fractional labor/equipment/studs without rounding to a full day",()=>{
  const r=calculate({...input,carpentryCofferType:"none",carpentryCurtainBoxUnits:"1",carpentryDropCeilingUnits:"1"});
  expect(r.rows.filter(r=>r.work==="curtain").map(r=>r.quantity)).toEqual([1,1,.5,1]);
  expect(r.rows.filter(r=>r.work==="drop").map(r=>r.quantity)).toEqual([.5,.5,.5,3]);expect(r.directCost).toBe(737500);
});
test("fan installation is approved 100000 per site; no invented reinforcement materials",()=>{
  const r=calculate({...input,carpentryCofferType:"none",carpentryCeilingFanUnits:"2"});expect(r.directCost).toBe(200000);expect(r.rows).toHaveLength(1);expect(r.rows[0].source).toContain("별도");
});

test.each([500,1000,2500,4201])("T3 %s mm reuses furniture line price without labor or equipment",mm=>{
  const core=createEstimateCalculation({rateValues:{rateT3LightingUnit:52000}});
  const r=core.calculate(core.readState({sectionCarpentryEnabled:true,carpentryIndirectT3Mm:String(mm),carpentryIndirectLightUnits:"3"}));
  expect(r.details).toHaveLength(1);expect(r.details[0]).toMatchObject({item:"목공 간접조명(T3)",unitPrice:52000,cost:mm/1000*52000,quantity:`${mm/1000}라인`});
  expect(r.details[0].input).toContain(`${mm}mm`);
  const expected=[];core.addT3Detail(expected,{group:"carpentry",label:"목공",units:mm/1000,margin:r.state.targetMargin,corrections:r.state.corrections});
  expect(r.details[0].revenue).toBe(expected[0].revenue);
});

test("T3 is gated by carpentry; old counts still reproduce the historical quote until a length is entered",()=>{
  const old={sectionCarpentryEnabled:true,carpentryIndirectLightUnits:"3"};
  expect(calculate({...old,carpentryIndirectT3Mm:"0"})).toEqual(calculate(old));
  expect(calculate({carpentryIndirectT3Mm:"2000"}).details).toEqual([]);
});
test("only drywall can use 3500 fallback; other missing parts remain unpriced",()=>{
  const r=calculate(input,{});expect(r.rows.find(r=>r.code==="WOOD_DRYWALL_SHEET")).toMatchObject({price:3500,source:"승인된 기본값"});
  expect(r.rows.filter(r=>r.missing)).toHaveLength(4);expect(r.rows.find(r=>r.code==="WOOD_STUD_BUNDLE").price).toBeNull();
});

test("missing material prices do not discard manual quantities or invent a unit price",()=>{
  const row=calculate(input,{}).rows.find(r=>r.code==="WOOD_STUD_BUNDLE");
  const siteCostConfig=JSON.stringify({version:1,rows:{[row.key]:{quantity:9,basis:row.basis}}});
  expect(calculate({...input,siteCostConfig},{}).rows.find(r=>r.key===row.key)).toMatchObject({quantity:9,price:null,missing:true,manualQuantity:true,stale:false});
  expect(calculate({...input,carpentryCofferUnits:"3",siteCostConfig},{}).rows.find(r=>r.key===row.key)).toMatchObject({quantity:9,price:null,missing:true,stale:true});
});
test("site quantity/price persist and quantity change keeps manual amount until explicit decision",()=>{
  const base=calculate(),row=base.rows.find(r=>r.code==="WOOD_DRYWALL_SHEET");
  const config={version:1,rows:{[row.key]:{quantity:23,price:3800,basis:row.basis}}};
  const modified=calculate({...input,siteCostConfig:JSON.stringify(config)}),changed=modified.rows.find(r=>r.key===row.key);
  expect(changed).toMatchObject({quantity:23,price:3800,amount:87400,manualQuantity:true,manualPrice:true,stale:false});
  const next=calculate({...input,carpentryCofferUnits:"3",siteCostConfig:JSON.stringify(config)}).rows.find(r=>r.key===row.key);
  expect(next).toMatchObject({baseQuantity:30,quantity:23,price:3800,stale:true});
  config.rows[row.key].basis=next.basis;expect(calculate({...input,carpentryCofferUnits:"3",siteCostConfig:JSON.stringify(config)}).rows.find(r=>r.key===row.key).stale).toBe(false);
  delete config.rows[row.key].quantity;delete config.rows[row.key].basis;
  expect(calculate({...input,carpentryCofferUnits:"3",siteCostConfig:JSON.stringify(config)}).rows.find(r=>r.key===row.key)).toMatchObject({quantity:30,price:3800});
  config.rows={};expect(calculate({...input,siteCostConfig:JSON.stringify(config)}).directCost).toBe(base.directCost);
});
test("generic non-carpentry site edit preserves its base quantity and standard input price",()=>{
  const source={projectName:"SYSTEM_GENERIC",sectionDemolitionEnabled:true,demolitionFloorEnabled:true,areaPyeong:"10"},base=calculate(source),row=base.rows[0];
  const result=calculate({...source,siteCostConfig:JSON.stringify({version:1,rows:{[row.key]:{quantity:12,price:32000,basis:row.basis}}})});
  expect(result.rows[0]).toMatchObject({baseQuantity:10,basePrice:30000,quantity:12,price:32000,stale:false});expect(result.directCost).toBe(384000);expect(calculate(source).directCost).toBe(300000);
});
test("manual worker days also apply to equipment; contradictory overrides are rejected",()=>{
  const base=calculate(),worker=base.rows.find(r=>r.code==="WOOD_LABOR_WORKER"),machine=base.rows.find(r=>r.code==="WOOD_MACHINE_DAY"),rows={[worker.key]:{quantity:5,basis:worker.basis}};
  const r=calculate({...input,siteCostConfig:JSON.stringify({version:1,rows})});expect(r.rows.filter(r=>[worker.key,machine.key].includes(r.key)).map(r=>r.quantity)).toEqual([5,5]);
  rows[machine.key]={quantity:4,basis:machine.basis};expect(()=>calculate({...input,siteCostConfig:JSON.stringify({version:1,rows})})).toThrow(/동일한 품수/);
});
test.each(['{"version":1,"rows":{"x":{"quantity":-1}}}','{"version":1,"rows":{"x":{"price":1e999}}}','{"version":1,"rows":{"x":{"quantity":2}}}','{"version":1,"rows":{"x":{"role":"admin"}}}'])("invalid or forged override fails: %s",text=>expect(()=>parseSiteCostConfig(text)).toThrow());
test("staff cannot forge policy/config or see nested cost breakdown; new staff estimate uses server mode",async()=>{
  expect(()=>validateStaffBody({inputs:{siteCostConfig:"{}"}})).toThrow();expect(()=>validateStaffBody({inputs:{carpentryCostMode:"legacy"}})).toThrow();
  const snapshot=await calculateStaffEstimate(validateStaffBody({inputs:{projectName:"SYSTEM_STAFF_WOOD",sectionCarpentryEnabled:true,carpentryCofferType:"new",carpentryCofferUnits:"2"}}),ctx("staff"));
  expect(snapshot.costTotal).toBe(2146000);expect(snapshot.inputs.carpentryCostMode).toBe("assembly-v1");
  const publicRow=projectStaffEstimate({...estimateRowPayload(snapshot),id:"20000000-0000-4000-8000-000000000001"});
  expect(JSON.stringify(publicRow)).not.toMatch(/siteCostConfig|carpentryCostMode|costBreakdown|cost|profit|margin|internal|3500|300000/);
});
test.each(["admin","manager"])("%s site overrides roundtrip without changing standards or old snapshot",async role=>{
  const created=await calculatePrivilegedEstimate({inputs:input},ctx(role));const row=created.costRows.find(r=>r.code==="WOOD_DRYWALL_SHEET"),config=JSON.stringify({version:1,rows:{[row.key]:{quantity:21,price:3800,basis:row.basis}}});
  const source={...estimateRowPayload(created.snapshot),id:"20000000-0000-4000-8000-000000000001"},before=JSON.stringify(source);
  mock.fetch.mockImplementation(async path=>path.startsWith("/rest/v1/estimates")?[source]:Object.entries(values).map(([item_code,cost_price])=>({item_code,cost_price,is_active:true})));
  const saved=await calculatePrivilegedEstimate({estimateId:source.id,inputs:{...input,siteCostConfig:config}},ctx(role));
  expect(saved.snapshot.inputs.siteCostConfig).toBe(config);expect(saved.costRows.find(r=>r.key===row.key)).toMatchObject({quantity:21,price:3800});expect(JSON.stringify(source)).toBe(before);
  expect(mock.fetch.mock.calls.every(([,options])=>!options?.method||options.method==="GET")).toBe(true);
});
test('a master inactive at capture stays unpriced on later recalculation',async()=>{
 const rows=Object.entries(values).map(([item_code,cost_price])=>({item_code,cost_price,category:'목공',unit:'장',is_active:item_code!=='WOOD_LABOR_WORKER'}));
 mock.fetch.mockResolvedValue(rows);const created=await calculatePrivilegedEstimate({inputs:input},ctx('admin'));
 expect(created.costRows.find(r=>r.code==='WOOD_LABOR_WORKER').missing).toBe(true);
 const saved={...estimateRowPayload(created.snapshot),id:'20000000-0000-4000-8000-000000000001'};
 mock.fetch.mockImplementation(async path=>path.startsWith('/rest/v1/estimates')?[saved]:rows);
 const next=await calculatePrivilegedEstimate({estimateId:saved.id,inputs:{carpentryCofferUnits:'3'}},ctx('admin'));
 expect(next.costRows.find(r=>r.code==='WOOD_LABOR_WORKER').missing).toBe(true);
});

test("existing stored estimates without mode retain legacy amount and original frozen snapshot",async()=>{
  const old={...input,carpentryCostMode:"legacy"},saved=(await calculatePrivilegedEstimate({inputs:old},ctx("admin"))).snapshot;delete saved.inputs.carpentryCostMode;
  const row={...estimateRowPayload(saved),id:"20000000-0000-4000-8000-000000000001"},before=JSON.stringify(saved);
  mock.fetch.mockImplementation(async path=>path.startsWith("/rest/v1/estimates")?[row]:Object.entries(values).map(([item_code,cost_price])=>({item_code,cost_price})));
  const read=await calculatePrivilegedEstimate({estimateId:row.id,inputs:{projectName:old.projectName}},ctx("admin"));expect(read.snapshot.total).toBe(saved.total);expect(read.snapshot.internalDetails).toEqual(saved.internalDetails);expect(JSON.stringify(saved)).toBe(before);
});
test("nine cost trade groups separate wallpaper/film and reuse categories without creating masters",()=>{
  expect(SYSTEM_TRADE_ORDER).toEqual(["철거","전기·조명","욕실·타일","도배","필름","바닥","목공","가구","마감·기타"]);expect(systemCategoryLabel("상판")).toBe("가구");expect(systemCategoryLabel("인허가")).toBe("철거");
});
test("site UI has local edit/reset actions, and removing permission purges all private rows",()=>{
  document.body.innerHTML='<section id="preliminary-sectionCarpentryEnabled"></section>';let allowed=true,config="";
  const changed=vi.fn(),view=mountSiteCostView({document,canView:()=>allowed,canStandardEdit:()=>false,readConfig:()=>config,writeConfig:v=>config=v,changed,openStandard:vi.fn()});
  view.render(calculate().rows);const node=document.querySelector('[data-site-field="quantity"]');node.value="5";node.dispatchEvent(new Event("change",{bubbles:true}));expect(changed).toHaveBeenCalled();expect(Object.values(parseSiteCostConfig(config).rows).map(r=>r.quantity)).toEqual([5,5]);
  allowed=false;view.render(calculate().rows);expect(document.querySelectorAll('[data-site-key]')).toHaveLength(0);expect(document.body.textContent).not.toContain("300,000");
});
