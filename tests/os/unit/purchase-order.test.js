// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { parse } from "espree";
import { analyze } from "eslint-scope";
import { JSDOM } from "jsdom";
import { describe, expect, test, vi } from "vitest";
import { purchaseOrderItems } from "../../../public/os-app/src/purchase-order.js";
import { createEstimateView } from "../../../public/os-app/src/estimate-view.js";
import { createEstimatePrint } from "../../../public/os-app/src/estimate-print.js";
import { won } from "../../../public/os-app/src/utils.js";
import { purchaseOrderCases, decodePurchaseValue } from "../fixtures/purchase-order-cases.js";

const moduleUrl = new URL("../../../public/os-app/src/purchase-order.js", import.meta.url);
const mainUrl = new URL("../../../public/os-app/src/main.js", import.meta.url);
const golden = JSON.parse(readFileSync(new URL("../fixtures/purchase-order-characterization.json", import.meta.url), "utf8"));
const labels = Object.freeze(golden.groupLabels);
const shape = ["process", "item", "spec", "quantity", "budget"];

function freeze(value, seen = new Set()) {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Object.values(value).forEach((entry) => freeze(entry, seen));
    Object.freeze(value);
  }
  return value;
}

describe("Phase 3B-4 full-output golden capture at 14e8b37", () => {
  for (const [name, factory] of purchaseOrderCases) {
    test(`${name}: preserves the full model or original error without mutation`, () => {
      const expected = golden.cases.find((entry) => entry.name === name);
      expect(expected).toBeDefined();
      const estimate = factory();
      const before = structuredClone(estimate);
      const labelBefore = structuredClone(labels);
      freeze(estimate);
      for (let repeat = 0; repeat < 2; repeat += 1) {
        if (expected.error) {
          expect(() => purchaseOrderItems(estimate, labels)).toThrow(TypeError);
          expect(expected.error).toBe("TypeError");
        } else {
          const result = purchaseOrderItems(estimate, labels);
          expect(result).toStrictEqual(decodePurchaseValue(expected.output));
          for (const row of result) expect(Object.keys(row)).toEqual(shape);
        }
      }
      expect(estimate).toStrictEqual(before);
      expect(labels).toStrictEqual(labelBefore);
    });
  }
});

describe("classification, ordering and numeric branch contracts", () => {
  test("all 15 allowed groups qualify and other actual/custom groups do not", () => {
    for (const group of golden.policy.orderGroups) {
      const row = freeze({ group, item: "MDF", input: "시험", quantity: "1장", cost: 1 });
      expect(purchaseOrderItems({ internalDetails: [row] }, labels)).toStrictEqual([
        { process: labels[group] || group || "기타", item: "MDF", spec: "시험", quantity: "1장", budget: 1 },
      ]);
    }
    for (const group of ["electrical", "demolition", "door", "tile", "silicone", "elastic", "misc", "custom", "", null, undefined])
      expect(purchaseOrderItems({ internalDetails: [{ group, item: "MDF" }] }, labels)).toEqual([]);
  });

  test("all 40 material keywords are detected in each of the three existing text fields", () => {
    for (const keyword of golden.policy.materialKeywords) {
      for (const field of ["item", "input", "quantity"]) {
        const row = freeze({ group: "base", item: "시험", input: "시험", quantity: "시험", cost: 1, [field]: keyword });
        expect(purchaseOrderItems({ internalDetails: [row] }, labels)).toStrictEqual([
          { process: "가구", item: row.item, spec: row.input, quantity: row.quantity, budget: 1 },
        ]);
      }
    }
  });

  test("each of the 13 exclusion keywords overrides material matches in all three text fields", () => {
    for (const keyword of golden.policy.excludedKeywords) {
      for (const field of ["item", "input", "quantity"]) {
        const row = freeze({ group: "base", item: "자재", input: "MDF", quantity: "합판", cost: 1, [field]: keyword });
        expect(purchaseOrderItems({ internalDetails: [row] }, labels)).toEqual([]);
      }
    }
  });

  test("matching remains case-sensitive substring matching, without flags or quantity thresholds", () => {
    expect(purchaseOrderItems({ internalDetails: [{ group: "base", item: "mdf", input: "시험", quantity: 1 }] }, labels)).toEqual([]);
    const row = freeze({ group: "base", item: "prefixMDFsuffix", input: "시험", quantity: 0, cost: 0, is_active: false, include_in_order_sheet: false });
    expect(purchaseOrderItems({ internalDetails: [row] }, labels)).toStrictEqual([
      { process: "가구", item: "prefixMDFsuffix", spec: "시험", quantity: 0, budget: 0 },
    ]);
  });

  test("input order and duplicate rows are retained without grouping, sorting or aggregation", () => {
    const a = freeze({ group: "wallpaper", item: "벽지", input: "A", quantity: "1롤", cost: 10 });
    const b = freeze({ group: "base", item: "하부장", input: "B", quantity: "2자", cost: 20 });
    const result = purchaseOrderItems({ internalDetails: [a, b, a] }, labels);
    expect(result.map((row) => row.spec)).toEqual(["A", "B", "A"]);
    expect(result.map((row) => row.budget)).toEqual([10, 20, 10]);
    expect(result[0]).not.toBe(result[2]);
    expect(purchaseOrderItems({ internalDetails: [b, a] }, labels).map((row) => row.spec)).toEqual(["B", "A"]);
  });

  test("quantity and budget are raw copies; no unit price, customer amount, VAT or total calculation", () => {
    for (const [quantity, cost] of [["3.5", 12.5], [0, 0], [-1.5, -100.5], ["2식", "100.5"], [undefined, undefined], [null, null], [NaN, Infinity], [-0, -0], [1n, 123n], [1000000000, 9000000000000]]) {
      const detail = { group: "wallpaper", item: "벽지", input: "시험", quantity, cost, unitPrice: 999999, total: 111, customerRevenue: 222, vat: 333 };
      const [row] = purchaseOrderItems({ internalDetails: [detail] }, labels);
      expect(row.quantity).toBe(quantity);
      expect(row.budget).toBe(cost);
      expect(Object.keys(row)).toEqual(shape);
    }
  });

  test("label policy is explicit, immutable and uncached; falsy labels retain the original group fallback", () => {
    const source = freeze({ internalDetails: [{ group: "base", item: "MDF", input: "시험", quantity: 1, cost: 1 }] });
    const a = Object.freeze({ base: "A" });
    const b = Object.freeze({ base: "B" });
    expect(purchaseOrderItems(source, a)[0].process).toBe("A");
    expect(purchaseOrderItems(source, b)[0].process).toBe("B");
    expect(purchaseOrderItems(source, a)[0].process).toBe("A");
    expect(purchaseOrderItems(source, { base: "" })[0].process).toBe("base");
    expect(purchaseOrderItems(source, {})[0].process).toBe("base");
  });

  test("costSnapshot and customerQuote cannot replace a missing or different detail cost", () => {
    const source = freeze({ internalDetails: [{ group: "base", item: "MDF", quantity: "1장" }], costSnapshot: { items: [{ costPrice: 999999 }] }, customerQuote: { total: 888888 } });
    expect(purchaseOrderItems(source, labels)[0]).toStrictEqual({ process: "가구", item: "MDF", spec: undefined, quantity: "1장", budget: undefined });
    expect(purchaseOrderItems({ costSnapshot: source.costSnapshot }, labels)).toEqual([]);
  });
});

describe("existing main rendering consumers", () => {
  for (const expected of golden.rendering) {
    test(`${expected.name}: screen and print HTML exactly match the pre-extraction renderer`, () => {
      const source = readFileSync(mainUrl, "utf8");
      const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
      const config = ast.body.find((node) => node.type === "VariableDeclaration" && node.declarations.some((entry) => entry.id.name === "quoteGroupLabels"));
      const names = ["renderPurchaseOrder", "renderPurchaseOrderPrint", "formatDateTime"];
      const nodes = ast.body.filter((node) => node.type === "FunctionDeclaration" && names.includes(node.id.name));
      expect(nodes).toHaveLength(3);
      const estimate = freeze(purchaseOrderCases.find(([name]) => name === expected.name)[1]());
      const fallback = vi.fn(() => estimate);
      const transform = vi.fn(purchaseOrderItems);
      const dom = new JSDOM('<table><tbody id="purchaseOrderRows"></tbody></table><div id="purchaseOrderSummary"></div><section id="printQuoteSheet"></section>');
      try {
        const consumer = vm.runInNewContext([
          source.slice(...config.range), ...nodes.map((node) => source.slice(...node.range)),
          "const estimateView = createEstimateView({ document, quoteGroupLabels, formatDateTime });",
          "const estimatePrint = createEstimatePrint({ document, formatDateTime });",
          "({ renderPurchaseOrder, renderPurchaseOrderPrint })",
        ].join("\n"), { document: dom.window.document, won, purchaseOrderItems: transform, currentEstimateForPrint: fallback, createEstimateView, createEstimatePrint });
        consumer.renderPurchaseOrder(estimate);
        consumer.renderPurchaseOrderPrint(estimate);
        expect(dom.window.document.getElementById("purchaseOrderRows").innerHTML).toBe(expected.rows);
        expect(dom.window.document.getElementById("purchaseOrderSummary").innerHTML).toBe(expected.summary);
        expect(dom.window.document.getElementById("printQuoteSheet").innerHTML).toBe(expected.print);
        expect(transform).toHaveBeenCalledTimes(2);
        expect(fallback).not.toHaveBeenCalled();
        consumer.renderPurchaseOrder(null);
        expect(fallback).toHaveBeenCalledTimes(1);
        expect(dom.window.document.getElementById("purchaseOrderRows").innerHTML).toBe(expected.rows);
      } finally {
        dom.window.close();
      }
    });
  }
});

describe("pure transformation boundary", () => {
  test("fresh Node import and transformation require no browser, network, core, storage or application globals", () => {
    const script = `
      import assert from "node:assert/strict";
      for (const name of ["window", "document", "localStorage", "sessionStorage", "el", "quoteGroupLabels", "activeQuoteEstimate"])
        assert.equal(typeof globalThis[name], "undefined", name);
      globalThis.fetch = () => { throw new Error("Network forbidden"); };
      const { purchaseOrderItems } = await import(${JSON.stringify(moduleUrl.href)});
      assert.deepEqual(purchaseOrderItems(null, {}), []);
      assert.deepEqual(purchaseOrderItems({ internalDetails: [{ group: "base", item: "MDF", input: "test", quantity: 0, cost: 0 }] }, { base: "trade" }), [{ process: "trade", item: "MDF", spec: "test", quantity: 0, budget: 0 }]);
      console.log("purchase transformation import PASS");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe("purchase transformation import PASS");
  });

  test("canonical definition, unchanged policy arrays, no imports or global leaks, two explicit consumer calls", () => {
    const source = readFileSync(moduleUrl, "utf8");
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
    expect(ast.body).toHaveLength(1);
    const declaration = ast.body[0].declaration;
    expect(declaration.id.name).toBe("purchaseOrderItems");
    const scope = analyze(ast, { ecmaVersion: 2022, sourceType: "module" });
    expect([...new Set(scope.globalScope.through.map((reference) => reference.identifier.name))]).toEqual(["Set"]);
    expect(source).not.toMatch(/\b(document|window|localStorage|sessionStorage|fetch|supabase|storage|quoteGroupLabels|activeQuoteEstimate|costSnapshot)\b|\bel\./);
    const policy = Object.fromEntries(declaration.body.body.filter((node) => node.type === "VariableDeclaration").map((node) => {
      const entry = node.declarations[0];
      const elements = entry.init.type === "NewExpression" ? entry.init.arguments[0].elements : entry.init.elements;
      return [entry.id.name, elements.map((element) => element.value)];
    }));
    expect(policy).toStrictEqual(golden.policy);
    const main = readFileSync(mainUrl, "utf8");
    const mainAst = parse(main, { ecmaVersion: "latest", sourceType: "module" });
    expect(mainAst.body.filter((node) => node.type === "FunctionDeclaration" && node.id.name === "purchaseOrderItems")).toEqual([]);
    const imported = mainAst.body.find((node) => node.type === "ImportDeclaration" && node.source.value === "./purchase-order.js");
    expect(imported.specifiers.map((node) => [node.imported.name, node.local.name])).toEqual([["purchaseOrderItems", "purchaseOrderItems"]]);
    expect(main).toContain("purchaseOrderItems(estimate || currentEstimateForPrint(), quoteGroupLabels)");
    expect(main).toContain("purchaseOrderItems(estimate, quoteGroupLabels)");
  });
});
