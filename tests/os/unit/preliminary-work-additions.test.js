import { beforeEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createEstimateCalculation, ESTIMATE_INPUT_SCHEMA as serverSchema } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { PRELIMINARY_WORK_INPUT_SCHEMA, ESTIMATE_INPUT_SCHEMA } from "../../../public/os-app/src/estimate-inputs.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { buildEstimateState } from "../../../public/os-app/src/estimate-state.js";
import { readEstimateForm } from "../../../public/os-app/src/estimate-form.js";
import { buildPreliminaryPlan } from "../../../public/os-app/src/detailed-preliminary.js";
import { workDefinitions, newWorkState } from "../../../public/os-app/src/detailed-work-review.js";
import {mountTradeRevisionInputs} from "../../../public/os-app/src/trade-revision-view.js";
import {mountBathroomTileInputs} from "../../../public/os-app/src/bathroom-tile-view.js";
import {createEstimatePrint} from "../../../public/os-app/src/estimate-print.js";
import {mountPreliminaryEstimateView} from "../../../public/os-app/src/preliminary-estimate-view.js";
import {mountSiteCostView} from "../../../public/os-app/src/site-cost-view.js";
import {mountEstimateItemBuilder} from "../../../public/os-app/src/estimate-item-builder.js";

const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock("../../../app/api/os/_lib/server", () => ({
  ApiError: class extends Error { constructor(status, message) { super(message); this.status = status; } },
  supabaseFetch: (...args) => mock.fetch(...args), errorResponse: e => Response.json({ error: e.message }, { status: e.status || 500 }),
}));
import { calculateStaffEstimate, calculatePrivilegedEstimate, validateStaffBody, projectStaffEstimate, estimateRowPayload } from "../../../app/api/os/estimates/_lib/estimates.js";
const actor = role => ({ authUser: { id: "synthetic-only" }, profile: { role, email: "synthetic@example.invalid" } });
const calc = inputs => { const core = createEstimateCalculation(); return core.calculate(core.readState(inputs)); };
const demo = { sectionDemolitionEnabled: true, demolitionBasicEnabled: true, demolitionBasicArea: "10" };
const wood = { sectionCarpentryEnabled: true, carpentryMoldingEnabled: true, carpentryBaseboardEnabled: true };
const elec = { sectionElectricalEnabled: true, electricalOutletMoveEnabled: true, electricalOutletMoveUnits: "3", electricalSwitchMoveEnabled: true, electricalSwitchMoveUnits: "2" };
const row = (r, name) => r.details.find(d => d.item === name);
beforeEach(() => mock.fetch.mockResolvedValue([{ item_code: "DEMO_CABINET_PER_JA", cost_price: 25000, unit: "자", default_margin_rate: .3, is_active: true }]));

test.each([["normal", 800000, 1040000], ["special", 1200000, 1560000]])("basic %s uses independent area and one markup", (type, cost, sale) => {
  const r = calc({ ...demo, areaPyeong: "45", demolitionBasicType: type });
  expect(r.directCost).toBe(cost); expect(r.customerRevenue).toBe(sale);
  expect(r.details).toHaveLength(1); expect(r.details[0].quantity).toBe("10평");
});
test("normal-special-normal switching and deselection do not erase retained inputs", () => {
  const core = createEstimateCalculation();
  for (const [type, cost] of [["normal", 800000], ["special", 1200000], ["normal", 800000]]) expect(core.calculate(core.readState({ ...demo, demolitionBasicType: type })).directCost).toBe(cost);
  expect(core.calculate(core.readState({ demolitionBasicEnabled: false })).directCost).toBe(0);
  expect(core.readState().demolitionBasicArea).toBe(10);
});
test.each([
  { demolitionFurnitureEnabled: true, demolitionFurnitureM: "3100" },
  { demolitionFloorEnabled: true, areaPyeong: "30" },
  { demolitionCeilingEnabled: true, areaPyeong: "30" },
  { demolitionFurnitureEnabled: true, demolitionFurnitureM: "3100", demolitionFloorEnabled: true, demolitionCeilingEnabled: true, areaPyeong: "30" },
])("existing demolition is additive, never replaced or deducted: %j", existing => {
  const before = calc({ sectionDemolitionEnabled: true, ...existing });
  const after = calc({ ...demo, ...existing });
  expect(after.directCost - before.directCost).toBe(800000);
  expect(after.details.filter(d => !d.item.startsWith("기본철거"))).toEqual(before.details);
});
test.each([[20, 0, 36000], [0, 30, 63000], [20, 30, 99000], [21.5, 31.2, 104220]])("materials %s/%s add once without changing labor", (m, b, extra) => {
  const before = calc(wood), after = calc({ ...wood, carpentryMoldingLengthM: String(m), carpentryBaseboardLengthM: String(b) });
  expect(after.directCost - before.directCost).toBe(extra);
  expect(after.details.filter(d => !/자재$/.test(d.item))).toEqual(before.details.filter(d => !/자재$/.test(d.item)));
  expect(after.details.filter(d => /^(천장몰딩|걸레받이) 자재$/.test(d.item)).reduce((n, d) => n + d.revenue, 0)).toBeCloseTo(extra * 1.3);
});
test("unchecked material inputs never add costs; no length is invented", () => {
  expect(calc({ sectionCarpentryEnabled: true, carpentryMoldingLengthM: "20", carpentryBaseboardLengthM: "30" }).directCost).toBe(0);
  expect(calc(wood).details.some(d => /^(천장몰딩|걸레받이) 자재$/.test(d.item))).toBe(false);
});
test.each([[true, false, 450000], [false, true, 300000], [true, true, 750000], [false, false, 0]])("independent outlet/switch %s/%s", (a, b, cost) => {
  const r = calc({ ...elec, electricalOutletMoveEnabled: a, electricalSwitchMoveEnabled: b });
  expect(r.directCost).toBe(cost); expect(r.customerRevenue).toBe(cost * 1.3);
});
test("moves coexist with standard installation without changing it", () => {
  const existing = { sectionElectricalEnabled: true, electricalEnabled: true, standardLightingEnabled: true, standardSwitchEnabled: true };
  const before = calc(existing), after = calc({ ...elec, ...existing });
  expect(after.directCost - before.directCost).toBe(750000);
  expect(after.details.filter(d => !d.item.endsWith("위치 이동"))).toEqual(before.details);
  expect(row(after, "콘센트 위치 이동").revenue).toBe(585000); expect(row(after, "스위치 위치 이동").revenue).toBe(390000);
});
test("section gates and invalid counts cannot generate unwanted work", () => {
  expect(calc({ ...demo, sectionDemolitionEnabled: false }).directCost).toBe(0);
  expect(calc({ ...elec, sectionElectricalEnabled: false }).directCost).toBe(0);
  expect(calc({ ...elec, electricalOutletMoveUnits: "-3", electricalSwitchMoveUnits: "2.9" }).directCost).toBe(300000);
  for (const value of ["-1", "Infinity", "not-a-number"]) expect(() => validateStaffBody({ inputs: { electricalOutletMoveUnits: value } })).toThrow();
});
test("new public fields match server schema and existing form event identity", () => {
  document.body.innerHTML = readFileSync("public/os-app/index.html", "utf8");
  const sync=mountTradeRevisionInputs(document);
  mountBathroomTileInputs(document);
  sync();
  const el = Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA).map(id => [id, document.getElementById(id)]));
  for (const [id, schema] of Object.entries(PRELIMINARY_WORK_INPUT_SCHEMA)) {
    expect(serverSchema[id]).toEqual(schema); expect(document.querySelectorAll(`[id="${id}"]`), id).toHaveLength(1);
  }
  el.sectionDemolitionEnabled.checked = true; el.demolitionBasicEnabled.checked = true; el.demolitionBasicArea.value = "10";
  expect(buildEstimateState(readEstimateForm(el), .3).demolitionBasicArea).toBe(10);
  const restore = createEstimateRestore({ document, elements: el, excludedInputById: {} });
  restore.restoreInputValues({ projectName: "OLD", sectionDemolitionEnabled: true });
  expect(el.demolitionBasicEnabled.checked).toBe(false); expect(el.demolitionBasicArea.value).toBe("0");
  restore.restoreInputValues({ ...demo, demolitionBasicType: "special", ...elec, ...wood, carpentryMoldingLengthM: "20" });
  expect(el.demolitionBasicType.value).toBe("special"); expect(el.carpentryMoldingLengthM.value).toBe("20000");
});

test("countertop fields sit under their own cabinet; only applicable dimensions and thickness are shown", () => {
  document.body.innerHTML=readFileSync("public/os-app/index.html","utf8");
  const sync=mountTradeRevisionInputs(document), get=id=>document.getElementById(id);
  const hidden=id=>Boolean(get(id).closest("[hidden]"));
  for(const id of ["sectionFurnitureEnabled","baseEnabled","baseCountertopEnabled","homebarEnabled","sectionBathroomEnabled"])get(id).checked=true;
  get("lowerCabinetM").value="3200";
  sync();
  expect(document.body.textContent).not.toContain("상판 규격·운반");
  expect(hidden("countertopTransport")).toBe(true);
  expect(hidden("baseCounterWidthMm")).toBe(true);
  expect(get("homebarM").closest("label").textContent).toContain("상하부장 길이");
  expect(hidden("homebarTallLengthMm")).toBe(false);
  expect(hidden("dryVanityLengthMm")).toBe(true);
  get("baseCounterCustomSize").click();
  get("baseCountertop").value="khanstone";
  get("dryVanityEnabled").checked=true;
  get("dryVanityLengthMm").value="900";
  get("dryVanityCountertop").value="ceramic";
  sync();
  expect(hidden("baseCounterWidthMm")).toBe(false);
  expect(get("baseCounterWidthMm").value).toBe("3200");
  expect(get("baseCounterWidthMm").closest(".furniture-block")).toBe(get("baseEnabled").closest(".furniture-block"));
  expect(hidden("baseCounterThickness")).toBe(false);
  expect(hidden("dryVanityLengthMm")).toBe(false);
  expect(hidden("dryVanityCounterThickness")).toBe(true);
  get("dryVanityCountertop").value="khanstone";
  sync();
  expect(hidden("dryVanityCounterThickness")).toBe(false);
});

test("dry vanity stays last in the expanded bathroom panel when trade tools load", async()=>{
  document.body.innerHTML=readFileSync("public/os-app/index.html","utf8");
  const syncTrade=mountTradeRevisionInputs(document),syncTile=mountBathroomTileInputs(document);
  document.getElementById("sectionBathroomEnabled").checked=true;
  document.getElementById("bathroomUnits").value="1";
  syncTrade();syncTile();
  const view=mountPreliminaryEstimateView({document,getContext:()=>({}),onPrint:()=>{}});
  document.getElementById("preliminary-sectionBathroomEnabled-button").click();
  const panel=document.getElementById("preliminary-sectionBathroomEnabled");
  const dry=document.getElementById("dryVanityEnabled").closest(".furniture-block");
  expect(panel.hidden).toBe(false);
  expect(panel.lastElementChild).toBe(dry);
  const siteCost=mountSiteCostView({document,canView:()=>true,canStandardEdit:()=>false});
  siteCost.render([]);
  const builder=mountEstimateItemBuilder({document,request:async action=>action==="state"?{mode:"ON"}:[],role:()=>"admin"});
  await builder.loadCatalog();
  for(const selector of [".bathroom-tile-rooms","[data-site-cost-trade]","[data-item-quote]","[data-manual-works]"]){
    expect(panel.querySelector(selector)?.hidden,selector).toBe(false);
  }
  expect(panel.lastElementChild).toBe(dry);
  view.destroy();
});

test("cabinet and dry vanity choices survive save projection and appear in both customer prints", async()=>{
  const inputs={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,baseCountertop:"khanstone",
    lowerCabinetM:"2200",baseCounterThickness:"20",homebarEnabled:true,homebarM:"1400",homebarTallLengthMm:"900",
    sectionBathroomEnabled:true,dryVanityEnabled:true,dryVanityCabinetType:"foam",dryVanityLengthMm:"900",dryVanityCountertop:"himacs"};
  const {snapshot}=await calculatePrivilegedEstimate({inputs},actor("admin"));
  const row=JSON.parse(JSON.stringify({...estimateRowPayload(snapshot),id:"20000000-0000-4000-8000-000000000004"}));
  const restored=projectStaffEstimate(row);
  expect(restored.inputs).toMatchObject(inputs);
  expect(restored.total).toBe(snapshot.total);
  expect(restored.customerQuote.groups.flatMap(g=>g.items).filter(i=>i.name==="양중비용 별도"))
    .toEqual([{name:"양중비용 별도",amount:0,amountText:"현장별 별도"}]);
  const reread=await calculateStaffEstimate(validateStaffBody({inputs:{projectName:"입력 검증"}}),actor("staff"),row);
  expect(reread.total).toBe(snapshot.total);
  document.body.innerHTML='<div id="printQuoteSheet"></div>';
  const print=createEstimatePrint({document,customerWon:String,formatDateTime:String,printGroupLabels:{}});
  for(const action of [print.renderPrintQuote,print.renderCustomerSummaryPrint]){
    action(restored.customerQuote);
    expect(document.getElementById("printQuoteSheet").textContent).toContain("양중비용 별도");
  }
});

test("previous V2 cabinet quotes stay on their original rate and explicit dimensions after an edit",async()=>{
  const inputs={tradeFormulaVersion:"v2",countertopLayoutMode:"legacy",baseCounterCustomSize:true,
    sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,baseCountertop:"khanstone",
    lowerCabinetM:"2500",baseCounterWidthMm:"3000",baseCounterDepthMm:"700",countertopTransport:true,countertopLadder:true};
  const {snapshot}=await calculatePrivilegedEstimate({inputs},actor("admin"));
  const row=JSON.parse(JSON.stringify({...estimateRowPayload(snapshot),id:"20000000-0000-4000-8000-000000000005"}));
  delete row.estimate_data.inputs.countertopLayoutMode;
  delete row.estimate_data.inputs.baseCounterCustomSize;
  const reopened=projectStaffEstimate(row);
  expect(reopened.inputs).toMatchObject({countertopLayoutMode:"legacy",baseCounterCustomSize:true,baseCounterWidthMm:"3000"});
  const next=await calculateStaffEstimate(validateStaffBody({inputs:{lowerCabinetM:"2700"}}),actor("staff"),row);
  const lines=next.internalDetails;
  expect(lines.find(d=>d.item.startsWith("상하부장 상판"))).toMatchObject({cost:960000,unitPrice:320000});
  expect(lines.find(d=>d.item==="상판 운반비").cost).toBe(300000);
  expect(lines.find(d=>d.item==="상판 사다리차").cost).toBe(120000);
});

test("revised saved inputs and discounts survive reload; legacy version cannot be changed",async()=>{
  const inputs={projectName:"Synthetic trade revision",tradeFormulaVersion:"v2",sectionWallpaperEnabled:true,areaPyeong:"34",wallpaperRoomPyeong:"15",sectionFinishEnabled:true,carrySelected:true,carryFloor:"2",carryNoElevator:true,managementCost:"100000",managementDiscount:"50000"};
  const {snapshot}=await calculatePrivilegedEstimate({inputs},actor("admin"));
  const raw=JSON.parse(JSON.stringify({...estimateRowPayload(snapshot),id:"20000000-0000-4000-8000-000000000001"}));
  const reopened=projectStaffEstimate(raw);
  expect(reopened.inputs).toMatchObject({tradeFormulaVersion:"v2",wallpaperRoomPyeong:"15",carrySelected:true});
  expect(reopened.total).toBe(snapshot.total);
  expect(reopened).not.toHaveProperty("internalDetails");
  const again=await calculateStaffEstimate(validateStaffBody({inputs:{projectName:inputs.projectName}}),actor("staff"),raw);
  expect(again.total).toBe(snapshot.total);
  expect(again.internalDetails).toEqual(snapshot.internalDetails);
  expect(Number(again.inputs.managementDiscount)).toBe(50000);
  expect(Number(again.inputs.managementCost)).toBe(100000);
  const legacy=structuredClone(raw);
  delete legacy.estimate_data.inputs.tradeFormulaVersion;
  expect(projectStaffEstimate(legacy).inputs.tradeFormulaVersion).toBe("legacy");
  await expect(calculateStaffEstimate(validateStaffBody({inputs:{tradeFormulaVersion:"v2"}}),actor("staff"),legacy)).rejects.toThrow(/산식 버전/);
  await expect(calculatePrivilegedEstimate({inputs:{...inputs,wallpaperRoomPyeong:"35"}},actor("admin"))).rejects.toThrow(/전체 분양평수/);
  expect(()=>validateStaffBody({inputs:{wallpaperRoomPyeong:"-1"}})).toThrow();
});
test("missing-master work remains explicit review evidence, no false standard or sale copy", () => {
  const reference = { inputs: { ...demo, ...wood, ...elec, carpentryMoldingLengthM: "20", carpentryBaseboardLengthM: "30", demolitionFurnitureEnabled: true, demolitionFurnitureM: "3100", demolitionFloorEnabled: true, demolitionFloorMaterial: "wood", demolitionCeilingEnabled: true, areaPyeong: "30" } };
  const frozen = JSON.stringify(reference), plan = buildPreliminaryPlan(reference, "source");
  for (const name of ["기본철거(일반)", "천장몰딩 자재", "걸레받이 자재", "콘센트 위치 이동", "스위치 위치 이동"]) {
    const review = plan.reviews.find(r => r.label === name); expect(review).toBeTruthy(); expect(review.standardIds).toBeUndefined();
  }
  expect(plan.rows.map(r => r.standardId)).toEqual(expect.arrayContaining(["std-DEMO_CABINET_PER_JA", "std-DEMO_FLOOR_WOOD", "std-DEMO_CEILING_PER_PYEONG"]));
  const editor = { items: [], spaces: [], workReview: undefined };
  const state = newWorkState(reference, "source", editor);
  expect(state.tasks.find(t => t.evidence.demolitionBasicArea).evidence.demolitionBasicArea).toBe("10");
  expect(state.tasks.find(t => t.evidence.carpentryMoldingLengthM).evidence.carpentryMoldingLengthM).toBe("20");
  expect(workDefinitions(reference, "source", editor).filter(t => t.label.endsWith("위치 이동"))).toHaveLength(2);
  expect(JSON.stringify(reference)).toBe(frozen); expect(JSON.stringify(plan)).not.toMatch(/80000|120000|150000|1040000|1\.3/);
});
test.each(["admin", "manager", "staff"])("%s save/reopen preserves new inputs and public output", async role => {
  const inputs = { ...demo, ...elec, ...wood, carpentryMoldingLengthM: "20", carpentryBaseboardLengthM: "30", projectName: "SYSTEM_WORK_ADDITIONS" };
  const saved = role === "staff" ? await calculateStaffEstimate(validateStaffBody({ inputs }), actor(role)) : (await calculatePrivilegedEstimate({ inputs }, actor(role))).snapshot;
  const before = JSON.stringify(saved), existing = { ...estimateRowPayload(saved), id: "20000000-0000-4000-8000-000000000001" };
  const again = await calculateStaffEstimate(validateStaffBody({ inputs: { projectName: inputs.projectName } }), actor("staff"), existing);
  expect(again.total).toBe(saved.total); expect(again.internalDetails).toEqual(saved.internalDetails); expect(again.inputs).toEqual(saved.inputs);
  expect(JSON.stringify(saved)).toBe(before);
  const publicRow = projectStaffEstimate(existing), json = JSON.stringify(publicRow);
  expect(json).not.toMatch(/cost|profit|margin|internal|unitPrice|defaultMargin/i);
  for (const name of ["기본철거", "콘센트 위치 이동", "스위치 위치 이동", "천장몰딩", "걸레받이"]) expect(json).toContain(name);
});
test("legacy saved amount and internal snapshot remain unchanged on reopen", async () => {
  const saved = await calculateStaffEstimate(validateStaffBody({ inputs: { projectName: "SYSTEM_OLD", ...wood } }), actor("staff"));
  for (const id of Object.keys(PRELIMINARY_WORK_INPUT_SCHEMA)) delete saved.inputs[id];
  const original = structuredClone(saved), row = { ...estimateRowPayload(saved), id: "20000000-0000-4000-8000-000000000001" };
  const next = await calculateStaffEstimate(validateStaffBody({ inputs: { projectName: "SYSTEM_OLD" } }), actor("staff"), row);
  expect(next.total).toBe(saved.total); expect(next.internalDetails).toEqual(saved.internalDetails); expect(saved).toEqual(original);
});
test("legacy reference RPC omissions are explicit unresolved work, not silently successful import", () => {
  const reference = { inputs: { sectionDemolitionEnabled: true, demolitionFurnitureEnabled: true, demolitionFurnitureM: "300" }, customerQuote: { groups: [{ label: "철거", total: 1040000, items: [{ name: "기본철거(특수)", amount: 1040000 }] }] } };
  const plan = buildPreliminaryPlan(reference, "source");
  expect(plan.reviews.find(r => r.label === "기본철거(특수)")).toMatchObject({ inputs: [], reason: expect.stringContaining("전달되지 않았습니다") });
  expect(plan.rows).toHaveLength(1); expect(plan.rows[0].standardId).toBe("std-DEMO_CABINET_PER_JA");
});
