import { beforeEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { createEstimateCalculation, ESTIMATE_INPUT_SCHEMA as serverSchema } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { PRELIMINARY_WORK_INPUT_SCHEMA, ESTIMATE_INPUT_SCHEMA } from "../../../public/os-app/src/estimate-inputs.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { buildEstimateState } from "../../../public/os-app/src/estimate-state.js";
import { readEstimateForm } from "../../../public/os-app/src/estimate-form.js";
import { buildPreliminaryPlan } from "../../../public/os-app/src/detailed-preliminary.js";
import { workDefinitions, newWorkState } from "../../../public/os-app/src/detailed-work-review.js";

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
  const el = Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA).map(id => [id, document.getElementById(id)]));
  for (const [id, schema] of Object.entries(PRELIMINARY_WORK_INPUT_SCHEMA)) {
    expect(serverSchema[id]).toEqual(schema); expect(document.querySelectorAll(`[id="${id}"]`)).toHaveLength(1);
  }
  el.sectionDemolitionEnabled.checked = true; el.demolitionBasicEnabled.checked = true; el.demolitionBasicArea.value = "10";
  expect(buildEstimateState(readEstimateForm(el), .3).demolitionBasicArea).toBe(10);
  const restore = createEstimateRestore({ document, elements: el, excludedInputById: {} });
  restore.restoreInputValues({ projectName: "OLD", sectionDemolitionEnabled: true });
  expect(el.demolitionBasicEnabled.checked).toBe(false); expect(el.demolitionBasicArea.value).toBe("0");
  restore.restoreInputValues({ ...demo, demolitionBasicType: "special", ...elec, ...wood, carpentryMoldingLengthM: "20" });
  expect(el.demolitionBasicType.value).toBe("special"); expect(el.carpentryMoldingLengthM.value).toBe("20000");
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
