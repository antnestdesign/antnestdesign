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
  expect(hidden("dryVanityLengthMm")).toBe(false);
  expect(get("dryVanityLengthMm").disabled).toBe(true);
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
  expect(hidden("dryVanityCounterThickness")).toBe(false);
  expect(get("dryVanityCounterThickness").disabled).toBe(true);
  get("dryVanityCountertop").value="khanstone";
  sync();
  expect(hidden("dryVanityCounterThickness")).toBe(false);
  expect(get("dryVanityCounterThickness").disabled).toBe(false);
});

test("cabinet checkboxes leave fields visible and preserve quantities when switched off",()=>{
  document.body.innerHTML=readFileSync("public/os-app/index.html","utf8");
  const sync=mountTradeRevisionInputs(document),get=id=>document.getElementById(id);
  for(const id of ["sectionFurnitureEnabled","sectionBathroomEnabled"])get(id).checked=true;
  const elements=Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA).map(id=>[id,get(id)]));
  const restore=createEstimateRestore({document,elements,excludedInputById:{}});
  const change=()=>{restore.syncSectionLocks();restore.syncBlockLocks();sync();};
  change();
  for(const [toggleId,fieldId] of [["furnitureDoorsToggle","furnitureTallDoors"],["vanityToggle","vanityMm"],["dryVanityEnabled","dryVanityLengthMm"]]){
    const toggle=get(toggleId),field=get(fieldId);
    expect(field.closest("[hidden]")).toBeNull();
    expect(field.disabled).toBe(true);
    toggle.click();change();
    expect(field.disabled).toBe(false);
    field.value="2";
    toggle.click();change();
    expect(field.value).toBe("2");
    expect(field.disabled).toBe(true);
    expect(field.closest("[hidden]")).toBeNull();
    toggle.click();change();
    expect(field.value).toBe("2");
    expect(field.disabled).toBe(false);
  }
  expect(get("carpentryCostMode").type).toBe("hidden");
  expect(get("carpentryCostMode").value).toBe("assembly-v1");
  expect(document.body.textContent).not.toMatch(/목공 산정 기준|공사별 물량 산출/);
  const base=get("carpentryBaseboardLengthM").closest(".carpentry-trim-row");
  expect(base.contains(get("carpentryBaseboardEnabled"))).toBe(true);
  expect(base.previousElementSibling.contains(get("carpentryMoldingEnabled"))).toBe(true);
});

test("dry vanity is the last bathroom input, directly above site costs", async()=>{
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
  expect(dry.nextElementSibling).toBe(panel.querySelector("[data-site-cost-trade]"));
  const tileFields=[...panel.querySelectorAll(".bathroom-tile-grid [data-tile-field]")].map(field=>field.dataset.tileField);
  expect(tileFields.slice(0,4)).toEqual(["wallLengthMm","wallTile","floorArea","floorTile"]);
  view.destroy();
});

test("new input layout pairs film controls, keeps floor grades on switch and groups molding with doors",()=>{
  document.body.innerHTML=readFileSync("public/os-app/index.html","utf8");
  const sync=mountTradeRevisionInputs(document),get=id=>document.getElementById(id);
  const elements=Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA).map(id=>[id,get(id)]));
  const restore=createEstimateRestore({document,elements,excludedInputById:{}});
  const change=()=>{restore.syncSectionLocks();restore.syncBlockLocks();sync();};
  const pair=get("filmOneSideMm").closest(".trade-field-pair");
  expect([...pair.querySelectorAll("input")].map(field=>field.id)).toEqual(["filmOneSideMm","filmBothSidesMm"]);
  expect(get("filmMaterialLengthM").closest("fieldset").querySelector("legend").textContent).toBe("필름 자재");
  get("sectionFlooringEnabled").checked=true;
  const material=get("flooringMaterialType"),sheet=get("flooringSheetGrade"),wood=get("flooringWoodGrade");
  sheet.value="t45";wood.value="standard";
  change();
  expect(sheet.closest("label").hidden).toBe(true);
  expect(wood.disabled).toBe(false);
  material.value="sheet";change();
  expect(sheet.disabled).toBe(false);
  expect(wood.closest("label").hidden).toBe(true);
  expect(sheet.value).toBe("t45");
  material.value="wood";change();
  expect(wood.value).toBe("standard");
  const doors=get("furnitureDoorsToggle").closest(".furniture-block");
  expect(doors.contains(get("furnitureMoldingMm"))).toBe(true);
  expect(doors.nextElementSibling.contains(get("sectionFinishEnabled"))).toBe(true);
  expect(get("dryVanityCountertop").value).toBe("epPanel");
  restore.restoreInputValues({sectionBathroomEnabled:true,dryVanityEnabled:true,dryVanityLengthMm:"900"});
  expect(get("dryVanityCountertop").value).toBe("none");
});

test("new dry vanity defaults to EP but an older snapshot without the material is not repriced",async()=>{
  const inputs={sectionBathroomEnabled:true,dryVanityEnabled:true,dryVanityLengthMm:"900"};
  const {snapshot}=await calculatePrivilegedEstimate({inputs},actor("admin"));
  expect(snapshot.inputs.dryVanityCountertop).toBe("epPanel");
  expect(snapshot.internalDetails.some(line=>line.item==="건식세면대 상판(EP판)")).toBe(true);
  const {snapshot:old}=await calculatePrivilegedEstimate({inputs:{...inputs,dryVanityCountertop:"none"}},actor("admin"));
  delete old.inputs.dryVanityCountertop;
  const row=JSON.parse(JSON.stringify({...estimateRowPayload(old),id:"20000000-0000-4000-8000-000000000004"}));
  expect(projectStaffEstimate(row).inputs.dryVanityCountertop).toBe("none");
  const edited=await calculateStaffEstimate(validateStaffBody({inputs:{projectName:"입력 검증"}}),actor("staff"),row);
  expect(edited.total).toBe(old.total);
});

test("the expansion partition field stays visible with either demolition scope and hydrates safe legacy values",()=>{
  document.body.innerHTML=readFileSync("public/os-app/index.html","utf8");
  const sync=mountTradeRevisionInputs(document),get=id=>document.getElementById(id);
  const elements=Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA).map(id=>[id,get(id)]));
  const restore=createEstimateRestore({document,elements,excludedInputById:{}});
  const legacy={sectionDemolitionEnabled:true,tradeFormulaVersion:"v2",demoPartitionMm:"1700"};
  const field=get("expansionPartitionMm");
  expect(field.closest("fieldset").querySelector("legend").textContent).toBe("확장 공사");
  expect(get("demoPartitionMm").type).toBe("hidden");
  for(const [mode,length] of [["full","0"],["partial","1700"]]){
    restore.restoreInputValues({...legacy,demolitionMode:mode});sync();
    expect(field.value).toBe(length);
    expect(field.disabled).toBe(false);
    expect(field.closest("[hidden]")).toBeNull();
  }
  get("demolitionMode").value="full";sync();
  expect(field.value).toBe("1700");
});

test("partition removal is preserved after API save and re-read, including older partial snapshots",async()=>{
  const inputs={sectionDemolitionEnabled:true,demolitionMode:"full",expansionPartitionMm:"2500"};
  const {snapshot}=await calculatePrivilegedEstimate({inputs},actor("admin"));
  const asRow=snap=>JSON.parse(JSON.stringify({...estimateRowPayload(snap),id:"20000000-0000-4000-8000-000000000004"}));
  const reread=projectStaffEstimate(asRow(snapshot));
  expect(reread.inputs.expansionPartitionMm).toBe("2500");
  expect(reread.total).toBe(325000);
  expect(reread.customerQuote.groups.flatMap(group=>group.items).filter(item=>item.name==="가벽철거")).toHaveLength(1);
  const {snapshot:old}=await calculatePrivilegedEstimate({inputs:{sectionDemolitionEnabled:true,demolitionMode:"partial",demoPartitionMm:"1500"}},actor("admin"));
  delete old.inputs.expansionPartitionMm;
  expect(projectStaffEstimate(asRow(old)).inputs.expansionPartitionMm).toBe("1500");
  const moved=await calculateStaffEstimate(validateStaffBody({inputs:{demolitionMode:"full",expansionPartitionMm:"1500"}}),actor("staff"),asRow(old));
  expect(moved.total).toBe(old.total);
  const cleared=await calculateStaffEstimate(validateStaffBody({inputs:{expansionPartitionMm:""}}),actor("staff"),asRow(old));
  expect(cleared.total).toBe(0);
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
