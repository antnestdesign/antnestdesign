import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import { expect, test, vi } from "vitest";
import { createEstimateCalculation, COST_ITEM_DEFINITIONS } from "../../../public/os-app/src/calculator/estimate-core.js";
import { isEstimateInputExcluded } from "../../../public/os-app/src/estimate-input.js";
import { latestEstimate, testProfile, TEST_ADDRESS } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs, flushAsyncWork } from "../helpers/os-harness.js";

const golden = JSON.parse(readFileSync(resolve("tests/os/fixtures/estimate-state-characterization.json"), "utf8"));
async function mountWithCapturedElements(database, profile) {
  const elements = {};
  const lookup = document.getElementById.bind(document);
  const spy = vi.spyOn(document, "getElementById").mockImplementation((id) => {
    const element = lookup(id);
    if (element && golden.initial.ids.includes(id) && !elements[id]) elements[id] = element;
    return element;
  });
  try {
    return { ...await mountOs(database, profile), elements };
  } finally {
    spy.mockRestore();
  }
}
function oldStateForCurrentForm(elements) {
  const context = vm.createContext({
    el: Object.fromEntries(golden.initial.ids.map((id) => [id, elements[id] || null])),
    COST_ITEM_BY_INPUT: Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.inputId, item])),
    isEstimateInputExcluded, syncSectionLocks() {}, syncBlockLocks() {},
    bathroomRates: structuredClone(golden.initial.rates.bathroom),
    kitchenRates: structuredClone(golden.initial.rates.kitchen),
    doorRates: structuredClone(golden.initial.rates.door),
    finishMaterialRates: structuredClone(golden.initial.rates.finishMaterial),
    miscRates: structuredClone(golden.initial.rates.misc),
  });
  vm.runInContext(golden.originalSource + "\nconst state = readState(); globalThis.reference = { state, inputs: { ...collectInputValues(), ...effectiveEstimateInputOverrides(state) }, config: { rates, flooringSheetGradeOptions, flooringWoodGradeOptions, pipeCleaningAmount: PIPE_CLEANING_AMOUNT } };", context);
  return structuredClone(context.reference);
}

test("composed form/state result reaches the existing admin snapshot, update payload and reload unchanged", async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const { main, storage, elements } = await mountWithCapturedElements(database, testProfile());
  main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  await flushAsyncWork();
  const input = document.getElementById("demolitionFurnitureM");
  input.value = "1500";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  const old = oldStateForCurrentForm(elements);
  const oldCalculation = createEstimateCalculation(old.config).calculate(old.state);
  const calculation = main.calculateForCurrentEstimate();
  expect(calculation.state).toStrictEqual(old.state);
  expect(calculation).toStrictEqual(oldCalculation);
  const expectedSnapshot = main.buildEstimateSnapshot(oldCalculation, { address: TEST_ADDRESS, costSnapshot: fixture.costSnapshot });
  expect(expectedSnapshot.inputs).toStrictEqual(old.inputs);
  await main.handleSaveEstimate("update");
  await flushAsyncWork();
  const mutation = database.mutations.find((entry) => entry.method === "PATCH");
  expect(mutation).toBeDefined();
  const saved = mutation.body.estimate_data;
  expect(saved.inputs).toStrictEqual(old.inputs);
  expect(saved.address).toBe(TEST_ADDRESS);
  expect(saved.costSnapshot).toStrictEqual(fixture.costSnapshot);
  expect(saved.internalDetails).toStrictEqual(expectedSnapshot.internalDetails);
  expect(saved.internalSummary).toStrictEqual(expectedSnapshot.internalSummary);
  expect(saved.customerQuote.groups).toStrictEqual(expectedSnapshot.customerQuote.groups);
  for (const key of ["total", "totalText", "costTotal", "marginRate", "status", "projectName", "areaPyeong", "clientName", "phone"]) expect(saved[key]).toStrictEqual(expectedSnapshot[key]);
  expect(saved.clientPhone).toBe(expectedSnapshot.phone);
  expect(Object.keys(saved).sort()).toEqual([...Object.keys(expectedSnapshot), "id", "clientPhone"].sort());
  const restored = await storage.getEstimate(fixture.id);
  main.loadEstimateIntoUi(restored);
  await flushAsyncWork();
  expect(main.calculateForCurrentEstimate().state).toStrictEqual(old.state);
  expect(restored.inputs).toStrictEqual(saved.inputs);
  expect(restored.internalDetails).toStrictEqual(saved.internalDetails);
  expect(restored.customerQuote.groups).toStrictEqual(saved.customerQuote.groups);
  expect(document.getElementById("clientTotal").textContent).toBe(saved.totalText);
});

test("staff form composition remains inputs-only; normalization is not a server privilege grant", async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const { main, storage, elements } = await mountWithCapturedElements(database, testProfile("staff"));
  main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  await flushAsyncWork();
  elements.targetMargin.value = "99";
  elements.manualAdjustment.value = "1234567";
  const pipe = document.getElementById("existingPipeCleaningEnabled");
  pipe.checked = true;
  pipe.dispatchEvent(new Event("change", { bubbles: true }));
  await flushAsyncWork();
  await main.handleSaveEstimate("update");
  await flushAsyncWork();
  const mutation = database.mutations.find((entry) => entry.method === "PATCH");
  expect(mutation).toBeDefined();
  expect(Object.keys(mutation.body).sort()).toEqual(["address", "inputs"]);
  expect(mutation.body.inputs.existingPipeCleaningEnabled).toBe(true);
  for (const key of ["targetMargin", "manualAdjustment", "costTotal", "internalDetails", "costSnapshot", "marginRate"]) expect(mutation.body.inputs).not.toHaveProperty(key);
  const restored = await storage.getEstimate(fixture.id);
  for (const key of ["costTotal", "internalDetails", "internalSummary", "costSnapshot", "marginRate"]) expect(restored).not.toHaveProperty(key);
});
