import { readFileSync } from "node:fs";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { mountPreliminaryEstimateView, PRELIMINARY_TRADES } from "../../../public/os-app/src/preliminary-estimate-view.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { readEstimateForm, collectEstimateFormValues } from "../../../public/os-app/src/estimate-form.js";
import { buildEstimateState } from "../../../public/os-app/src/estimate-state.js";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { latestEstimate } from "../fixtures/estimates.js";

const html = readFileSync("public/os-app/index.html", "utf8");
let view;
let restore;
let elements;
beforeEach(() => {
  document.open(); document.write(html); document.close();
  elements = Object.fromEntries([...document.querySelectorAll("[id]")].map(node => [node.id, node]));
  restore = createEstimateRestore({ document, elements, excludedInputById: {} });
  restore.ensureEstimateStatusControl();
  restore.ensureSaveButtons();
});
afterEach(() => view?.destroy());
function mount(estimate = latestEstimate()) {
  view = mountPreliminaryEstimateView({ document, getContext: () => ({ estimate, editingId: estimate.id }), onPrint: vi.fn() });
  return view;
}
function inputs() { return [...document.querySelectorAll("#client input, #client select, #client textarea")]; }
function values() { return inputs().map(node => ({ id: node.id, attributes: node.getAttributeNames().map(name => [name, node.getAttribute(name)]), value: node.value, checked: node.checked, disabled: node.disabled })); }

test("all 145 original controls retain identity, attributes, values, disabled state and unique IDs", () => {
  const original = inputs();
  const before = values().sort((a, b) => a.id.localeCompare(b.id));
  expect(original).toHaveLength(145);
  mount();
  expect(inputs()).toHaveLength(145);
  expect(new Set(inputs().map(node => node.id)).size).toBe(145);
  for (const node of original) expect(document.getElementById(node.id)).toBe(node);
  expect(values().sort((a, b) => a.id.localeCompare(b.id))).toStrictEqual(before);
  expect(document.querySelectorAll(".preliminary-trade")).toHaveLength(9);
  const count = [11, 9, 10, 6, 2, 4, 17, 65, 7];
  PRELIMINARY_TRADES.forEach((trade, index) => {
    expect(document.getElementById(`preliminary-${trade.id}`).querySelectorAll("input, select, textarea")).toHaveLength(count[index]);
  });
});

test("one accessible detail at a time; navigation dispatches no input/change and preserves all data", () => {
  const inputEvent = vi.fn();
  document.getElementById("client").addEventListener("input", inputEvent);
  document.getElementById("client").addEventListener("change", inputEvent);
  const before = values();
  mount();
  expect([...document.querySelectorAll(".preliminary-trade-detail")].every(node => node.hidden)).toBe(true);
  for (const trade of PRELIMINARY_TRADES) {
    const panel = document.getElementById(`preliminary-${trade.id}`);
    const button = document.getElementById(`${panel.id}-button`);
    button.click();
    expect(button.getAttribute("aria-controls")).toBe(panel.id);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect([...document.querySelectorAll(".preliminary-trade-detail")].filter(node => !node.hidden)).toEqual([panel]);
  }
  document.querySelector('[aria-expanded="true"].preliminary-detail-button').click();
  expect(inputEvent).not.toHaveBeenCalled();
  expect(values().sort((a, b) => a.id.localeCompare(b.id))).toStrictEqual(before.sort((a, b) => a.id.localeCompare(b.id)));
});

test("section locks and sub-block locks keep values when deselected, reselected, opened or closed", () => {
  mount();
  for (const trade of PRELIMINARY_TRADES) {
    const toggle = elements[trade.id];
    const panel = document.getElementById(`preliminary-${trade.id}`);
    const before = [...panel.querySelectorAll("input, select")].map(node => [node.id, node.value, node.checked]);
    toggle.checked = false;
    restore.syncSectionLocks(); restore.syncBlockLocks();
    expect([...panel.querySelectorAll("input, select")].every(node => node.disabled)).toBe(true);
    toggle.checked = true;
    restore.syncSectionLocks(); restore.syncBlockLocks();
    expect([...panel.querySelectorAll("input, select")].map(node => [node.id, node.value, node.checked])).toStrictEqual(before);
    expect(toggle.disabled).toBe(false);
  }
});

const cases = [
  ["기본", {}],
  ...PRELIMINARY_TRADES.map(trade => [trade.label, { [trade.id]: true }]),
  ["복수 공정", Object.fromEntries(PRELIMINARY_TRADES.map(trade => [trade.id, true]))],
  ["욕실 1개", { sectionBathroomEnabled: true, bathroomUnits: "1" }],
  ["욕실 2개", { sectionBathroomEnabled: true, bathroomUnits: "2" }],
  ["주방 직접금액", { sectionFurnitureEnabled: true, kitchenEnabled: true, kitchenCustomAppliancePrice: "789123", baseEnabled: true, lowerCabinetM: "4000" }],
  ["배관 청소", { sectionFinishEnabled: true, existingPipeCleaningEnabled: true }],
];
for (const [name, overrides] of cases) test(`${name}: form/state, full calculation, costs, profit and persisted inputs are exact before/after layout`, () => {
  for (const [id, value] of Object.entries(overrides)) {
    const node = elements[id];
    if (node.type === "checkbox") node.checked = value;
    else node.value = value;
  }
  const read = () => {
    const raw = readEstimateForm(elements);
    const state = buildEstimateState(raw);
    return { raw, state, calculation: createEstimateCalculation().calculate(state), payload: collectEstimateFormValues(elements, {}) };
  };
  const before = read();
  mount();
  for (const button of document.querySelectorAll(".preliminary-detail-button")) button.click();
  expect(read()).toStrictEqual(before);
});

test("trade customer amounts read the displayed quote only, map door/misc once and never expose internal fields", () => {
  const estimate = latestEstimate();
  estimate.customerQuote.groups.push({ label: "도어/창호", total: 456000 }, { label: "마감", total: 123000 }, { label: "필름", total: 10000 });
  mount(estimate);
  const money = id => document.querySelector(`[data-trade='${id}'] .preliminary-trade-amount`).textContent;
  expect(money("sectionCarpentryEnabled")).toBe("846,000원");
  expect(money("sectionFinishEnabled")).toBe("253,000원");
  const sum = [...document.querySelectorAll(".preliminary-trade-amount")].reduce((total, node) => total + Number(node.textContent.replace(/\D/g, "")), 0);
  expect(sum).toBe(estimate.customerQuote.groups.reduce((total, group) => total + group.total, 0));
  expect(document.querySelector(".preliminary-overview").textContent).not.toMatch(/internal|원가|이익|마진/);
});

test("existing save nodes/listeners and print command are reused, no document renderer is duplicated", () => {
  const save = document.getElementById("saveEstimateButton");
  const action = vi.fn();
  save.addEventListener("click", action);
  const print = vi.fn();
  view = mountPreliminaryEstimateView({ document, getContext: () => ({}), onPrint: print });
  document.getElementById("saveEstimateButton").click();
  document.querySelector(".preliminary-actions button:last-child").click();
  expect(action).toHaveBeenCalledOnce();
  expect(print).toHaveBeenCalledOnce();
  expect(document.querySelectorAll("#clientTotal")).toHaveLength(1);
  expect(document.querySelectorAll("#saveStatus")).toHaveLength(1);
});

test("presentation never calculates, saves, normalizes values or registers duplicate controls", () => {
  const source = readFileSync("public/os-app/src/preliminary-estimate-view.js", "utf8");
  expect(source).not.toMatch(/\b(calculate|refresh|fetch|saveEstimate|updateEstimate|normalizeIntegerInput)\s*\(/);
  mount();
  expect(mountPreliminaryEstimateView({ document, getContext: () => ({}), onPrint() {} })).toBeNull();
  expect(inputs()).toHaveLength(145);
});

test("summary does not report a disabled demolition sub-option or an unused floor grade", () => {
  elements.sectionDemolitionEnabled.checked = true;
  elements.demolitionFurnitureEnabled.checked = true;
  elements.demolitionFloorEnabled.checked = false;
  elements.demolitionFloorMaterial.selectedOptions[0].textContent = "UNSELECTED_FLOOR";
  elements.sectionFlooringEnabled.checked = true;
  elements.flooringMaterialType.value = "wood";
  elements.flooringSheetGrade.selectedOptions[0].textContent = "UNUSED_SHEET_GRADE";
  restore.syncSectionLocks();
  mount();
  expect(document.querySelector('[data-trade="sectionDemolitionEnabled"] .preliminary-trade-summary').textContent).not.toContain("UNSELECTED_FLOOR");
  expect(document.querySelector('[data-trade="sectionFlooringEnabled"] .preliminary-trade-summary').textContent).not.toContain("UNUSED_SHEET_GRADE");
});

test("unchecked saved trades remain part of quote, with explicit source and no reference-price claim", () => {
  const estimate = latestEstimate();
  const before = JSON.stringify(estimate);
  view = mountPreliminaryEstimateView({ document, getContext: () => ({ estimate, editingId: estimate.id, storedSnapshot: true }), onPrint() {} });
  const electrical = document.querySelector('[data-trade="sectionElectricalEnabled"]');
  expect(electrical.querySelector(".preliminary-trade-amount").textContent).toBe("260,000원");
  expect(electrical.querySelector(".preliminary-amount-source").hidden).toBe(false);
  expect(electrical.querySelector(".preliminary-amount-source").textContent).toBe("저장 금액 포함");
  expect(electrical.querySelector(".preliminary-trade-summary").textContent).toBe("입력 미선택");
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("저장 견적 총액");
  expect(document.querySelector(".preliminary-source-notice").hidden).toBe(false);
  expect(document.querySelector(".preliminary-source-notice").textContent).toContain("고객 출력은 저장 견적 기준");
  expect(document.querySelector(".preliminary-overview").textContent).not.toContain("참고금액");
  expect(JSON.stringify(estimate)).toBe(before);
});

test("consistent selection has no source mismatch notice; empty exclusion placeholder hides but real exclusions remain", () => {
  const estimate = latestEstimate();
  for (const trade of PRELIMINARY_TRADES) elements[trade.id].checked = true;
  mount(estimate);
  expect(document.querySelector(".preliminary-source-notice").hidden).toBe(true);
  expect(document.querySelector(".excluded-work").hidden).toBe(true);
  document.querySelector(".excluded-work").insertAdjacentHTML("beforeend", "<ul><li>합성 별도 공사</li></ul>");
  view.update();
  expect(document.querySelector(".excluded-work").hidden).toBe(false);
  expect(document.querySelector(".excluded-work li").textContent).toBe("합성 별도 공사");
});

test("demolition furniture summary means furniture removal, without changing the input label or data", () => {
  elements.sectionDemolitionEnabled.checked = true;
  elements.demolitionFurnitureEnabled.checked = true;
  restore.syncSectionLocks();
  mount();
  expect(document.querySelector('[data-trade="sectionDemolitionEnabled"] .preliminary-trade-summary').textContent).toContain("가구 철거");
  expect(elements.demolitionFurnitureEnabled.closest("label").querySelector("span").textContent).toBe("가구");
});
