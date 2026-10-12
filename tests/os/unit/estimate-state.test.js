// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { parse } from "espree";
import { describe, expect, test } from "vitest";
import { readEstimateForm, collectEstimateFormValues, syncEstimateFormRates, normalizeIntegerInput } from "../../../public/os-app/src/estimate-form.js";
import { buildEstimateState, composeEstimateInputs, effectiveEstimateInputOverrides, buildEstimateRateUpdates, ESTIMATE_RATE_BINDINGS } from "../../../public/os-app/src/estimate-state.js";
import { canonicalInputValues, isEstimateInputExcluded } from "../../../public/os-app/src/estimate-input.js";
import { COST_ITEM_DEFINITIONS, createEstimateCalculation } from "../../../public/os-app/src/calculator/estimate-core.js";
import { costSnapshotMap } from "../../../public/os-app/src/cost-snapshot.js";
import { rateNumber } from "../../../public/os-app/src/utils.js";
import { estimateStateCases, createCaseElements, setElementValues, decodeStateValue } from "../fixtures/estimate-state-cases.js";

const golden = JSON.parse(readFileSync(new URL("../fixtures/estimate-state-characterization.json", import.meta.url), "utf8"));
const excluded = Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.inputId, item]));
const mainSource = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
const mainAst = parse(mainSource, { ecmaVersion: "latest", sourceType: "module", range: true });
function mainFunction(name) {
  const node = mainAst.body.find((node) => node.id?.name === name);
  if (!node) throw new Error(`Missing main function ${name}`);
  return mainSource.slice(...node.range);
}
function createOld(elements, loaded = false) {
  const context = vm.createContext({
    el: elements, COST_ITEM_BY_INPUT: excluded, isEstimateInputExcluded,
    bathroomRates: structuredClone(golden.initial.rates.bathroom),
    kitchenRates: structuredClone(golden.initial.rates.kitchen),
    doorRates: structuredClone(golden.initial.rates.door),
    finishMaterialRates: structuredClone(golden.initial.rates.finishMaterial),
    miscRates: structuredClone(golden.initial.rates.misc),
    loadedEstimateBaseline: loaded ? { id: "synthetic", estimate: {} } : null,
    syncSectionLocks() {}, syncBlockLocks() {},
  });
  vm.runInContext(golden.originalSource + "\nglobalThis.old = { readState, collectInputValues, restoreInputValues, effectiveEstimateInputOverrides, context: () => ({ rates, flooringSheetGradeOptions, flooringWoodGradeOptions, pipeCleaningAmount: PIPE_CLEANING_AMOUNT }) };", context);
  return context.old;
}
function newContext() {
  const context = structuredClone(golden.initial);
  delete context.ids;
  return context;
}
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

describe("Phase 3C OLD vs NEW full-state characterization at bf22db7", () => {
  for (const entry of estimateStateCases) {
    test(`${entry.name}: state, full rate context, persisted inputs and canonical result`, () => {
      const oldForm = createCaseElements(entry, golden.initial.ids);
      const newForm = createCaseElements(entry, golden.initial.ids);
      const old = createOld(oldForm.elements, entry.loaded);
      const context = newContext();
      if (entry.restoreInputs) {
        old.restoreInputValues(entry.restoreInputs);
        createOld(newForm.elements).restoreInputValues(entry.restoreInputs);
      }
      const expectedReads = golden.cases.find((item) => item.name === entry.name).reads;
      for (const [index, step] of (entry.steps || [{}]).entries()) {
        setElementValues(oldForm.elements, step);
        setElementValues(newForm.elements, step);
        const expected = decodeStateValue(expectedReads[index]);
        const readNew = () => {
          syncEstimateFormRates(newForm.elements, context);
          const raw = readEstimateForm(newForm.elements);
          const before = structuredClone(raw);
          const state = buildEstimateState(freeze(raw));
          expect(raw).toStrictEqual(before);
          return state;
        };
        if (expected.error) {
          expect(() => old.readState()).toThrow();
          expect(readNew).toThrow(TypeError);
        } else {
          const oldState = structuredClone(old.readState());
          const state = readNew();
          const inputs = composeEstimateInputs(collectEstimateFormValues(newForm.elements, excluded), state);
          const result = { state, ...structuredClone(context), inputs, canonical: canonicalInputValues(inputs, excluded) };
          expect(state).toStrictEqual(oldState);
          expect(result).toStrictEqual(expected);
          expect(structuredClone(old.context())).toStrictEqual(context);
          expect(inputs).toStrictEqual(structuredClone({ ...old.collectInputValues(), ...old.effectiveEstimateInputOverrides(oldState) }));
          expect(Object.keys(state)).toEqual(Object.keys(oldState));
          // The shared core consumes the same typed state; it is not re-normalized as schema input.
          const oldCalculation = createEstimateCalculation(structuredClone(old.context())).calculate(oldState);
          const newCalculation = createEstimateCalculation(structuredClone(context)).calculate(state);
          expect(newCalculation).toStrictEqual(oldCalculation);
        }
      }
      oldForm.dom.window.close();
      newForm.dom.window.close();
    });
  }
});

test("actual main orchestration synchronizes rates before form reads without DOM writes or identity replacement", () => {
  const { dom, elements } = createCaseElements({ values: { rateLowerPerJa: "123456.75" } }, golden.initial.ids);
  const context = newContext();
  const ratesIdentity = context.rates;
  const nestedIdentity = context.rates.standardLighting;
  const sheetIdentity = context.flooringSheetGradeOptions.t20;
  const before = collectEstimateFormValues(elements, {});
  const trace = [];
  const area = elements.areaPyeong;
  elements.areaPyeong = { get value() {
    trace.push(context.rates.lowerPerJa);
    return area.value;
  } };
  const sandbox = vm.createContext({ el: elements, ...context, syncEstimateFormRates, readEstimateForm, buildEstimateState, PIPE_CLEANING_AMOUNT: context.pipeCleaningAmount });
  vm.runInContext(mainFunction("updateRatesFromAdmin") + "\n" + mainFunction("readState") + "\nglobalThis.result = readState();", sandbox);
  expect(trace).toEqual([123456.75]);
  expect(context.rates).toBe(ratesIdentity);
  expect(context.rates.standardLighting).toBe(nestedIdentity);
  expect(context.flooringSheetGradeOptions.t20).toBe(sheetIdentity);
  elements.areaPyeong = area;
  expect(collectEstimateFormValues(elements, {})).toStrictEqual(before);
  dom.window.close();
});

test("rate resolver is pure, retains zero/empty fallback and preserves fractional values without rounding", () => {
  const context = freeze(newContext());
  const before = structuredClone(context);
  const raw = freeze(ESTIMATE_RATE_BINDINGS.map((_, index) => index % 3 === 0 ? "0" : index % 3 === 1 ? "" : "17.125"));
  const updates = buildEstimateRateUpdates(raw, context);
  updates.forEach(({ target, path, value }, index) => {
    expect(value).toBe(index % 3 === 2 ? 17.125 : path.reduce((object, key) => object[key], context[target]));
  });
  expect(buildEstimateRateUpdates(raw, context)).toStrictEqual(updates);
  expect(context).toStrictEqual(before);
});

test("calculation factory creation still precedes readState, including primitive pipe-rate timing", () => {
  const entry = { checked: { sectionFinishEnabled: true, existingPipeCleaningEnabled: true }, values: { rateExistingPipeCleaning: "300123.25", rateLowerPerJa: "123456.75" } };
  const oldForm = createCaseElements(entry, golden.initial.ids);
  const newForm = createCaseElements(entry, golden.initial.ids);
  const old = createOld(oldForm.elements);
  const context = newContext();
  const factories = [];
  const sandbox = vm.createContext({ ...context, el: newForm.elements, PIPE_CLEANING_AMOUNT: context.pipeCleaningAmount, syncEstimateFormRates, readEstimateForm, buildEstimateState, createEstimateCalculation: (options) => {
    factories.push(options.pipeCleaningAmount);
    return createEstimateCalculation(options);
  } });
  vm.runInContext(["currentCalculationCore", "updateRatesFromAdmin", "readState", "calculate"].map(mainFunction).join("\n") + "\nglobalThis.run = calculate;", sandbox);
  for (let repeat = 0; repeat < 2; repeat += 1) {
    const oldCore = createEstimateCalculation(old.context());
    const oldResult = oldCore.calculate(structuredClone(old.readState()));
    expect(sandbox.run()).toStrictEqual(oldResult);
  }
  expect(factories).toEqual([300000, 300123.25]);
  expect(sandbox.PIPE_CLEANING_AMOUNT).toBe(300123.25);
  oldForm.dom.window.close();
  newForm.dom.window.close();
});

test("form/state dependency direction is explicit and state has no DOM/storage/core reverse dependency", () => {
  const stateSource = readFileSync(new URL("../../../public/os-app/src/estimate-state.js", import.meta.url), "utf8");
  const stateAst = parse(stateSource, { ecmaVersion: "latest", sourceType: "module" });
  expect(stateAst.body.filter((node) => node.type === "ImportDeclaration")).toEqual([]);
  expect(stateSource).not.toMatch(/\b(document|window|localStorage|sessionStorage|fetch|supabase|currentProfile|activeQuoteEstimate|loadedEstimateBaseline)\b|\bel\./);
  expect(mainFunction("readState")).toBe("function readState() {\n  updateRatesFromAdmin();\n  return buildEstimateState(readEstimateForm(el));\n}");
  expect(mainFunction("calculate")).toBe("function calculate() { return currentCalculationCore().calculate(readState()); }");
  expect(mainFunction("currentInputKey")).toContain("canonicalInputValues(currentEstimateInputValues(), COST_ITEM_BY_INPUT)");
});

test("actual saved-cost adapter uses estimate-specific prices and restores operating prices even on failure", () => {
  for (const shouldThrow of [false, true]) {
    const { dom, elements } = createCaseElements({ values: { rateLowerPerJa: "123456.75" } }, golden.initial.ids);
    const context = newContext();
    const calls = [];
    const sandbox = vm.createContext({
      ...context, el: elements, PIPE_CLEANING_AMOUNT: context.pipeCleaningAmount,
      COST_ITEM_DEFINITIONS, costSnapshotMap, rateNumber,
      loadedEstimateBaseline: { estimate: { costSnapshot: { items: [{ itemCode: "CABINET_LOWER", costPrice: 654321.25 }] } } },
      shouldUseLoadedCostSnapshot: () => true,
      snapshotCalculationMissingItems: [],
      requiredMissingSnapshotItems: () => [],
      syncEstimateFormRates, readEstimateForm, buildEstimateState,
      currentCalculationCore: () => ({ calculate(state) {
        calls.push({ state, price: context.rates.lowerPerJa });
        if (shouldThrow) throw new Error("synthetic calculation failure");
        return { state };
      } }),
    });
    vm.runInContext(["updateRatesFromAdmin", "readState", "calculate", "calculateForCurrentEstimate"].map(mainFunction).join("\n") + "\nglobalThis.run = calculateForCurrentEstimate;", sandbox);
    if (shouldThrow) expect(() => sandbox.run()).toThrow("synthetic calculation failure");
    else expect(sandbox.run().state).toStrictEqual(buildEstimateState(readEstimateForm(elements)));
    expect(calls).toHaveLength(1);
    expect(calls[0].price).toBe(654321.25);
    expect(elements.rateLowerPerJa.value).toBe("123456.75");
    expect(context.rates.lowerPerJa).toBe(123456.75);
    dom.window.close();
  }
});

test("form reader preserves primitive types and normalizer keeps integer/default/gating meanings separate", () => {
  const { dom, elements } = createCaseElements({ allChecked: true, values: { bathroomUnits: "2.9", kitchenCustomAppliancePrice: "0.5", baseLightingUnits: "-3", targetMargin: "0", carpentryCeilingHeight: "0" } }, golden.initial.ids);
  const raw = readEstimateForm(elements);
  expect(raw.values.bathroomUnits).toBe("2.9");
  expect(raw.checked.sectionBathroomEnabled).toBe(true);
  const state = buildEstimateState(freeze(raw));
  expect(state.bathroomUnits).toBe(2);
  expect(state.baseLightingUnits).toBe(0);
  expect(state.targetMargin).toBe(0.3);
  expect(state.carpentryCeilingHeight).toBe(2400);
  expect(state.kitchenCustomAppliancePrice).toBe(0.5);
  const inputs = composeEstimateInputs(collectEstimateFormValues(elements, excluded), state);
  expect(inputs.bathroomUnits).toBe("2.9");
  expect(effectiveEstimateInputOverrides(state).existingPipeCleaningEnabled).toBe(true);
  expect(inputs).not.toHaveProperty("rateLowerPerJa");
  dom.window.close();
});

test("integer DOM write stays in the explicit event adapter, never in read/normalization", () => {
  const input = { id: "units", value: "8.9", max: "5" };
  normalizeIntegerInput(input, ["units"]);
  expect(input.value).toBe("5");
  input.value = "";
  normalizeIntegerInput(input, ["units"]);
  expect(input.value).toBe("");
  input.value = "-2.9";
  normalizeIntegerInput(input, ["units"]);
  expect(input.value).toBe("0");
  input.value = "8.9";
  normalizeIntegerInput(input, []);
  expect(input.value).toBe("8.9");
});

test("new modules import in fresh Node without browser, storage or network globals", () => {
  const urls = ["estimate-form.js", "estimate-state.js"].map((name) => new URL(`../../../public/os-app/src/${name}`, import.meta.url).href);
  const script = `delete globalThis.window; delete globalThis.document; globalThis.fetch = () => { throw new Error('network forbidden'); }; for (const url of ${JSON.stringify(urls)}) await import(url);`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
  expect(result.status, result.stderr).toBe(0);
});
