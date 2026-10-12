// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "espree";
import { analyze } from "eslint-scope";
import { describe, expect, test } from "vitest";
import * as summaryModel from "../../../public/os-app/src/estimate-summary.js";

const moduleUrl = new URL("../../../public/os-app/src/estimate-summary.js", import.meta.url);
const golden = JSON.parse(readFileSync(new URL("../fixtures/estimate-summary-characterization.json", import.meta.url), "utf8"));
const names = ["buildAdminMarginGroups", "internalDetailCustomerAmount", "storedEstimateSummary", "hasPipeCleaningLegacyCostGap", "adjustmentEvidence", "findMatchingCostDetail", "buildEstimateDiagnostics"];
const groupOptions = { groupLabels: golden.groupLabels, groupOrder: golden.groupOrder };
const pipeOptions = { pipeCleaningItemName: "기존 배관 청소", pipeCleaningAmount: 300000 };

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function capture(value) {
  return value === undefined ? { defined: false } : JSON.parse(JSON.stringify({ defined: true, value }));
}

describe("Phase 3B-2 characterization captured before extraction at 531978c", () => {
  for (const fixture of golden.cases) {
    test.each(names)(`${fixture.name}: %s retains original output without mutation`, (name) => {
      const estimate = freeze(fixture.missing ? undefined : structuredClone(fixture.estimate));
      const summary = freeze(structuredClone(fixture.expected.storedEstimateSummary.value));
      const groups = freeze(structuredClone(groupOptions));
      const pipe = freeze({ ...pipeOptions, pipeCleaningAmount: fixture.pipeCleaningAmount ?? 300000 });
      const before = structuredClone({ estimate, summary, groups, pipe });
      const args = {
        buildAdminMarginGroups: [estimate, groups],
        internalDetailCustomerAmount: [estimate?.internalDetails?.[0]],
        storedEstimateSummary: [estimate, groups],
        hasPipeCleaningLegacyCostGap: [estimate, summary, pipe],
        adjustmentEvidence: [estimate],
        findMatchingCostDetail: [estimate, summary.costDiff],
        buildEstimateDiagnostics: [estimate, summary, pipe],
      };
      expect(capture(summaryModel[name](...args[name]))).toEqual(fixture.expected[name]);
      expect(capture(summaryModel[name](...args[name]))).toEqual(fixture.expected[name]);
      expect({ estimate, summary, groups, pipe }).toEqual(before);
    });
  }
});

describe("summary boundary contracts", () => {
  test.each([
    [undefined, 0], [null, 0], [{}, 0], [{ customerRevenue: 0, revenue: 5000 }, 0],
    [{ customerRevenue: 1.49 }, 1], [{ customerRevenue: 1.5 }, 2],
    [{ customerRevenue: -1.5 }, -1], [{ customerRevenue: -0.5 }, -0],
    [{ customerRevenue: 9007199254740991 }, 9007199254740991],
    [{ customerRevenue: "2000.5", revenue: 1999.9 }, 1000],
    [{ customerRevenue: null, revenue: 2999 }, 2000],
    [{ customerRevenue: NaN, revenue: "1999.9" }, 1000],
    [{ customerRevenue: Infinity, revenue: -0.5 }, -1000],
    [{ customerRevenue: -Infinity, revenue: "" }, 0],
    [{ revenue: "abc" }, 0], [{ revenue: Infinity }, Infinity],
  ])("internalDetailCustomerAmount(%j) freezes the fallback and rounding", (detail, expected) => {
    expect(summaryModel.internalDetailCustomerAmount(freeze(detail))).toBe(expected);
  });

  test("group options are explicit and do not leak between calls", () => {
    const estimate = freeze({ internalDetails: [
      { group: "a", cost: 10, customerRevenue: 13 },
      { group: "b", cost: 20, customerRevenue: 26 },
      { group: "unknown", cost: 1, customerRevenue: 2 },
    ] });
    const a = freeze({ groupLabels: { a: "A", b: "B" }, groupOrder: ["B", "A"] });
    const b = freeze({ groupLabels: { a: "공통", b: "공통" }, groupOrder: ["공통"] });
    expect(summaryModel.buildAdminMarginGroups(estimate, a).map((group) => group.label)).toEqual(["B", "A", "unknown"]);
    expect(summaryModel.buildAdminMarginGroups(estimate, b).map((group) => [group.label, group.count])).toEqual([["공통", 2], ["unknown", 1]]);
    expect(summaryModel.buildAdminMarginGroups(estimate, a).map((group) => group.label)).toEqual(["B", "A", "unknown"]);
  });

  test("each row is rounded before summing and the rate remains profit divided by cost", () => {
    const details = freeze([
      { group: "misc", cost: 0.5, customerRevenue: 1.5 },
      { group: "misc", cost: 0.5, customerRevenue: 1.5 },
    ]);
    const [group] = summaryModel.buildAdminMarginGroups({ internalDetails: details }, groupOptions);
    expect(group).toEqual({ label: "기타", cost: 2, customer: 4, count: 2, details, profit: 2, marginRate: 1 });
  });

  test("zero net groups are omitted but detailCount still counts their rows", () => {
    const estimate = freeze({ internalDetails: [
      { group: "misc", cost: 100, customerRevenue: 130 },
      { group: "misc", cost: -100, customerRevenue: -130 },
    ] });
    expect(summaryModel.buildAdminMarginGroups(estimate, groupOptions)).toEqual([]);
    expect(summaryModel.storedEstimateSummary(estimate, groupOptions)).toMatchObject({ detailCount: 2, detailCostTotal: 0, detailCustomerTotal: 0 });
  });

  test("zero or negative cost does not produce a new margin policy", () => {
    const groups = summaryModel.buildAdminMarginGroups({ internalDetails: [
      { group: "misc", cost: 0, customerRevenue: 300 },
      { group: "unknown", cost: -100, customerRevenue: 200 },
    ] }, groupOptions);
    expect(groups.map((group) => group.marginRate)).toEqual([0, 0]);
  });

  test("quote.total zero wins over stale totals, and summary fallback is unchanged", () => {
    expect(summaryModel.storedEstimateSummary({ customerQuote: { total: 0 }, total: 999, costTotal: 0, internalSummary: { customerRevenue: 123, directCost: 456 } }, groupOptions))
      .toMatchObject({ customerTotal: 0, directCost: 0, profit: 0, marginRate: 0 });
    expect(summaryModel.storedEstimateSummary({ internalSummary: { customerRevenue: "1300.5", directCost: "1000.5" } }, groupOptions))
      .toMatchObject({ customerTotal: 1301, directCost: 1001, profit: 300, marginRate: 300 / 1001 });
  });

  test("large totals remain unchanged without capping", () => {
    expect(summaryModel.storedEstimateSummary({ total: 9000000000000, costTotal: 6000000000000 }, groupOptions))
      .toMatchObject({ customerTotal: 9000000000000, directCost: 6000000000000, profit: 3000000000000, marginRate: 0.5 });
  });

  test("malformed non-array details keep their existing TypeError instead of normalization", () => {
    expect(() => summaryModel.buildAdminMarginGroups({ internalDetails: {} }, groupOptions)).toThrow(TypeError);
    expect(() => summaryModel.storedEstimateSummary({ internalDetails: {} }, groupOptions)).toThrow(TypeError);
    expect(() => summaryModel.hasPipeCleaningLegacyCostGap({ internalDetails: {} }, { costDiff: 0, customerDiff: 0 }, pipeOptions)).toThrow(TypeError);
    expect(() => summaryModel.findMatchingCostDetail({ internalDetails: {} }, 10)).toThrow(TypeError);
  });

  test.each(["", [], {}])("empty boundary %j keeps zero summary", (estimate) => {
    expect(summaryModel.storedEstimateSummary(estimate, groupOptions)).toEqual({ customerTotal: 0, directCost: 0, profit: 0, marginRate: 0, detailCount: 0, detailCustomerTotal: 0, detailCostTotal: 0, customerDiff: 0, costDiff: 0 });
  });

  test("findMatchingCostDetail returns the first exact rounded match without changing order", () => {
    const first = freeze({ item: "첫 항목", cost: 100.4 });
    const second = freeze({ item: "두 번째", cost: 100 });
    expect(summaryModel.findMatchingCostDetail({ internalDetails: [first, second] }, -100)).toBe(first);
    expect(summaryModel.findMatchingCostDetail({ internalDetails: [first, second] }, 99.9)).toBeUndefined();
  });

  test("adjustment evidence keeps explicit zero and first matching-row semantics", () => {
    expect(summaryModel.adjustmentEvidence({ inputs: { manualAdjustment: 0 }, manualAdjustment: -100 })).toBeNull();
    expect(summaryModel.adjustmentEvidence({ manualAdjustment: -0.5 })).toBeNull();
    expect(summaryModel.adjustmentEvidence({ customerQuote: { groups: [{ items: [{ name: "할인", amount: 0 }, { name: "절사", amount: 100 }] }] } }))
      .toEqual({ label: "할인", amount: 0 });
    expect(summaryModel.adjustmentEvidence({ customerQuote: { groups: [{ items: null }, { items: [{ name: "수동 보정", amount: "-100.5" }] }] } }))
      .toEqual({ label: "수동 보정", amount: 100 });
  });

  test("pipe diagnostic requires exact amount, zero customer difference and current amount context", () => {
    const estimate = freeze({ internalDetails: [{ item: "기존 배관 청소", cost: 300000, customerRevenue: 300000 }] });
    const summary = { customerDiff: 0, costDiff: 300000 };
    expect(summaryModel.hasPipeCleaningLegacyCostGap(estimate, summary, pipeOptions)).toBe(true);
    expect(summaryModel.hasPipeCleaningLegacyCostGap(estimate, { ...summary, customerDiff: 1 }, pipeOptions)).toBe(false);
    expect(summaryModel.hasPipeCleaningLegacyCostGap(estimate, { ...summary, costDiff: 299999 }, pipeOptions)).toBe(false);
    expect(summaryModel.hasPipeCleaningLegacyCostGap(estimate, summary, { ...pipeOptions, pipeCleaningAmount: 400000 })).toBe(false);
    expect(summaryModel.hasPipeCleaningLegacyCostGap(estimate, summary, pipeOptions)).toBe(true);
  });

  test("normal summary has no diagnostics", () => {
    expect(summaryModel.buildEstimateDiagnostics({}, { customerDiff: 0, costDiff: 0 }, pipeOptions)).toEqual([]);
  });

  test("diagnostic ordering and fixed wording remain unchanged", () => {
    const estimate = { manualAdjustment: -100, internalDetails: [{ item: "시험", cost: 5000, customerRevenue: 10000 }] };
    const result = summaryModel.buildEstimateDiagnostics(estimate, { customerDiff: 10000, costDiff: 5000 }, pipeOptions);
    expect(result.map((item) => item.title)).toEqual(["고객 견적 총액 조정", "직접원가 저장값 불일치"]);
    expect(result[0].cause).toBe("상세견적 합계에서 10,000원 할인이 적용되었습니다.");
    expect(result[1].causeLabel).toBe("추정 원인");
    expect(result[1].cause).toBe("시험 5,000원이 전체 costTotal에 반영되지 않았을 가능성이 있습니다.");
  });

  test("unknown negative customer gap keeps thousand-floor display rather than new rounding", () => {
    const result = summaryModel.buildEstimateDiagnostics({}, { customerDiff: -500, costDiff: 0 }, pipeOptions);
    expect(result[0]).toMatchObject({ title: "고객가 저장값 불일치", causeLabel: "추정 원인", impact: "차액: -1,000원" });
  });
});

describe("pure module dependency boundary", () => {
  test("fresh Node import and calls need no browser, application state or storage", () => {
    const script = `
      import assert from "node:assert/strict";
      const forbidden = ["window", "document", "localStorage", "sessionStorage", "el", "currentProfile", "activeQuoteEstimate"];
      for (const name of forbidden) assert.equal(typeof globalThis[name], "undefined", name);
      globalThis.fetch = () => { throw new Error("Network forbidden"); };
      const model = await import(${JSON.stringify(moduleUrl.href)});
      const options = { groupLabels: { misc: "기타" }, groupOrder: ["기타"] };
      const pipe = { pipeCleaningItemName: "기존 배관 청소", pipeCleaningAmount: 300000 };
      const estimate = { total: 300000, costTotal: 300000, internalDetails: [{ group: "misc", item: "기존 배관 청소", cost: 300000, customerRevenue: 300000 }] };
      const summary = model.storedEstimateSummary(estimate, options);
      assert.equal(model.buildAdminMarginGroups(estimate, options)[0].profit, 0);
      assert.equal(model.internalDetailCustomerAmount(estimate.internalDetails[0]), 300000);
      assert.equal(model.hasPipeCleaningLegacyCostGap(estimate, summary, pipe), false);
      assert.equal(model.adjustmentEvidence(estimate), null);
      assert.equal(model.findMatchingCostDetail(estimate, 300000).item, "기존 배관 청소");
      assert.deepEqual(model.buildEstimateDiagnostics(estimate, summary, pipe), []);
      for (const name of forbidden) assert.equal(typeof globalThis[name], "undefined", name);
      console.log("summary pure import PASS");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe("summary pure import PASS");
  });

  test("only utils/core imports, no leaked globals, and one canonical definition per function", () => {
    const source = readFileSync(moduleUrl, "utf8");
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
    const imports = ast.body.filter((node) => node.type === "ImportDeclaration").map((node) => node.source.value);
    expect(imports).toEqual(["./utils.js", "./calculator/estimate-core.js"]);
    const scope = analyze(ast, { ecmaVersion: 2022, sourceType: "module" });
    expect([...new Set(scope.globalScope.through.map((reference) => reference.identifier.name))].sort()).toEqual(["Array", "Map", "Math", "Number"]);
    expect(source).not.toMatch(/\b(document|window|localStorage|sessionStorage|fetch|supabase|storage|currentProfile|activeQuoteEstimate|loadedEstimateBaseline)\b|\bel\./);
    const definitions = ast.body.filter((node) => node.type === "ExportNamedDeclaration").map((node) => node.declaration.id.name);
    expect(definitions.sort()).toEqual([...names].sort());
    const main = parse(readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8"), { ecmaVersion: "latest", sourceType: "module" });
    expect(main.body.filter((node) => node.type === "FunctionDeclaration" && names.includes(node.id.name))).toEqual([]);
    const imported = main.body.find((node) => node.type === "ImportDeclaration" && node.source.value === "./estimate-summary.js");
    expect(imported.specifiers.map((node) => node.imported.name)).toEqual(["buildAdminMarginGroups", "internalDetailCustomerAmount", "storedEstimateSummary", "buildEstimateDiagnostics"]);
  });
});
