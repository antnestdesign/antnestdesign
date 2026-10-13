// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { parse } from "espree";
import { analyze } from "eslint-scope";
import { JSDOM } from "jsdom";
import { describe, expect, test, vi } from "vitest";
import { costSnapshotMap } from "../../../public/os-app/src/cost-snapshot.js";
import { createEstimateView } from "../../../public/os-app/src/estimate-view.js";
import { rateNumber, won } from "../../../public/os-app/src/utils.js";
import { storedEstimateSummary, buildEstimateDiagnostics } from "../../../public/os-app/src/estimate-summary.js";
import { costSnapshotCases, snapshotConsumerCases, decodeSnapshotValue } from "../fixtures/cost-snapshot-cases.js";

const moduleUrl = new URL("../../../public/os-app/src/cost-snapshot.js", import.meta.url);
const mainUrl = new URL("../../../public/os-app/src/main.js", import.meta.url);
const golden = JSON.parse(readFileSync(new URL("../fixtures/cost-snapshot-characterization.json", import.meta.url), "utf8"));

function freeze(value, seen = new Set()) {
  if (value && typeof value === "object" && !seen.has(value)) {
    seen.add(value);
    Object.values(value).forEach((entry) => freeze(entry, seen));
    Object.freeze(value);
  }
  return value;
}

describe("Phase 3B-5 full Map characterization at 73be975", () => {
  for (const [name, factory] of costSnapshotCases) {
    test(`${name}: exact entries/errors, original value identity and immutable deterministic input`, () => {
      const expected = golden.cases.find((entry) => entry.name === name);
      expect(expected).toBeDefined();
      const snapshot = factory();
      const before = structuredClone(snapshot);
      freeze(snapshot);
      let first;
      for (let repeat = 0; repeat < 2; repeat += 1) {
        if (expected.error) {
          expect(() => costSnapshotMap(snapshot)).toThrow(TypeError);
          expect(expected.error).toBe("TypeError");
        } else {
          const map = costSnapshotMap(snapshot);
          expect(map).toBeInstanceOf(Map);
          const entries = [...map];
          expect(entries).toStrictEqual(decodeSnapshotValue(expected.entries));
          entries.forEach(([key, value], index) => {
            expect(value).toBe(snapshot.items[expected.valueIndices[index]]);
            expect(map.get(key)).toBe(value);
            if (key && typeof key === "object") expect(key).toBe(value.itemCode);
          });
          if (first) {
            expect(map).not.toBe(first);
            expect([...map]).toStrictEqual([...first]);
          }
          first = map;
        }
      }
      expect(snapshot).toStrictEqual(before);
    });
  }
});

describe("key, value, duplicate and ownership semantics", () => {
  test("duplicate code has last value and first insertion position", () => {
    const a1 = { itemCode: "A", costPrice: 1 };
    const b = { itemCode: "B", costPrice: 2 };
    const a2 = { itemCode: "A", costPrice: 3 };
    const map = costSnapshotMap(freeze({ items: [a1, b, a2] }));
    expect([...map.keys()]).toEqual(["A", "B"]);
    expect(map.get("A")).toBe(a2);
    expect(map.get("B")).toBe(b);
  });

  test("values include all original fields and nested references, not cloned or normalized prices", () => {
    const item = freeze({ itemCode: "A", costPrice: "10.5", nested: { tags: ["test"] }, unknown: false });
    const map = costSnapshotMap({ items: [item] });
    expect(map.get("A")).toBe(item);
    expect(map.get("A").nested).toBe(item.nested);
    expect(map.get("A").nested.tags).toBe(item.nested.tags);
    expect(map.get("A").costPrice).toBe("10.5");
  });

  test("a newly allocated Map can change its structure without changing the snapshot array", () => {
    const item = freeze({ itemCode: "A", costPrice: 1 });
    const snapshot = freeze({ items: [item] });
    const map = costSnapshotMap(snapshot);
    map.delete("A");
    map.set("B", { itemCode: "B" });
    expect(snapshot.items).toEqual([item]);
    expect(costSnapshotMap(snapshot).get("A")).toBe(item);
  });

  test("native Map SameValueZero is preserved without key stringification", () => {
    const rows = freeze([{ itemCode: 1 }, { itemCode: "1" }, { itemCode: NaN, marker: 1 }, { itemCode: NaN, marker: 2 }, { itemCode: -0 }, { itemCode: 0, marker: 3 }]);
    const map = costSnapshotMap({ items: rows });
    expect(map.size).toBe(4);
    expect(map.get(1)).toBe(rows[0]);
    expect(map.get("1")).toBe(rows[1]);
    expect(map.get(NaN)).toBe(rows[3]);
    expect(map.get(-0)).toBe(rows[5]);
    expect(Object.is([...map.keys()].at(-1), 0)).toBe(true);
  });

  test("object and Symbol keys retain identity rather than JSON/composite matching", () => {
    const a = Object.freeze({ marker: 1 });
    const b = Object.freeze({ marker: 1 });
    const symbol = Symbol("synthetic");
    const rows = Object.freeze([{ itemCode: a }, { itemCode: b }, { itemCode: symbol }]);
    const map = costSnapshotMap({ items: rows });
    expect(map.size).toBe(3);
    expect(map.get(a)).toBe(rows[0]);
    expect(map.get(b)).toBe(rows[1]);
    expect(map.get({ marker: 1 })).toBeUndefined();
    expect(map.get(symbol)).toBe(rows[2]);
  });

  test("missing code collapses to undefined and alternative legacy fields are not consulted", () => {
    const rows = freeze([{ item_code: "A" }, { inputId: "B" }, { id: "C" }]);
    const map = costSnapshotMap({ items: rows });
    expect(map.size).toBe(1);
    expect(map.get(undefined)).toBe(rows[2]);
    expect(map.has("A")).toBe(false);
    expect(map.has("B")).toBe(false);
    expect(map.has("C")).toBe(false);
  });

  test("internal summary and diagnostic models remain exact after lookup", () => {
    const estimate = freeze({ customerQuote: { total: 300000 }, costTotal: 300000, internalDetails: [{ group: "misc", item: "기존 배관 청소", cost: 300000, customerRevenue: 300000 }], costSnapshot: { items: [{ itemCode: "SYNTHETIC", costPrice: 300000 }] } });
    const options = { groupLabels: { misc: "기타" }, groupOrder: ["기타"] };
    const pipe = { pipeCleaningItemName: "기존 배관 청소", pipeCleaningAmount: 300000 };
    const before = storedEstimateSummary(estimate, options);
    expect(before).toEqual({ customerTotal: 300000, directCost: 300000, profit: 0, marginRate: 0, detailCount: 1, detailCustomerTotal: 300000, detailCostTotal: 300000, customerDiff: 0, costDiff: 0 });
    expect(costSnapshotMap(estimate.costSnapshot).get("SYNTHETIC")).toBe(estimate.costSnapshot.items[0]);
    expect(storedEstimateSummary(estimate, options)).toEqual(before);
    expect(buildEstimateDiagnostics(estimate, before, pipe)).toEqual([]);
  });
});

describe("existing privileged snapshot consumers", () => {
  for (const expected of golden.consumers) {
    test(`${expected.name}: changed flag, missing-item diagnostic and comparison HTML retain original output`, () => {
      const fixture = freeze(structuredClone(snapshotConsumerCases.find((entry) => entry.name === expected.name)));
      const before = structuredClone(fixture);
      const source = readFileSync(mainUrl, "utf8");
      const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
      const names = ["costSnapshotChanged", "requiredMissingSnapshotItems", "renderCostSnapshotComparison"];
      const nodes = ast.body.filter((node) => node.type === "FunctionDeclaration" && names.includes(node.id.name));
      expect(nodes).toHaveLength(3);
      const dom = new JSDOM('<section id="costComparisonPanel" hidden></section><p id="costCompareStatus"></p>');
      const lookup = vi.fn(costSnapshotMap);
      const calculate = vi.fn(() => ({ costTotal: fixture.currentCost }));
      try {
        const consumer = vm.runInNewContext([
          ...nodes.map((node) => source.slice(...node.range)),
          "({ costSnapshotChanged, requiredMissingSnapshotItems, renderCostSnapshotComparison })",
        ].join("\n"), { document: dom.window.document, won, rateNumber, costSnapshotMap: lookup,
          estimateView: createEstimateView({ document: dom.window.document }),
          originalCostItems: new Map(fixture.current.map((item) => [item.itemCode, item])),
          currentCostItems: () => fixture.current, calculate, buildEstimateSnapshot: (value) => value });
        expect(consumer.costSnapshotChanged(fixture.snapshot)).toBe(expected.changed);
        expect([...consumer.requiredMissingSnapshotItems(fixture.snapshot, { wallpaperMaterialEnabled: true })]).toEqual(expected.missing);
        expect([...consumer.requiredMissingSnapshotItems(fixture.snapshot, { wallpaperMaterialEnabled: false })]).toEqual([]);
        consumer.renderCostSnapshotComparison({ costSnapshot: fixture.snapshot, costTotal: fixture.savedCost });
        const panel = dom.window.document.getElementById("costComparisonPanel");
        expect(panel.innerHTML).toBe(expected.html);
        expect(panel.hidden).toBe(expected.hidden);
        expect(dom.window.document.getElementById("costCompareStatus").textContent).toBe(expected.status);
        expect(calculate).toHaveBeenCalledTimes(fixture.snapshot?.items?.length ? 1 : 0);
        expect(fixture).toStrictEqual(before);
      } finally {
        dom.window.close();
      }
    });
  }
});

describe("pure lookup and staff security boundaries", () => {
  test("fresh Node import needs no browser, network, storage, core or app state", () => {
    const script = `
      import assert from "node:assert/strict";
      for (const name of ["window", "document", "localStorage", "sessionStorage", "el", "originalCostItems", "loadedEstimateBaseline"])
        assert.equal(typeof globalThis[name], "undefined", name);
      globalThis.fetch = () => { throw new Error("Network forbidden"); };
      const { costSnapshotMap } = await import(${JSON.stringify(moduleUrl.href)});
      const item = Object.freeze({ itemCode: "A", costPrice: 0 });
      assert.equal(costSnapshotMap({ items: [item] }).get("A"), item);
      assert.equal(costSnapshotMap(null).size, 0);
      assert.equal(costSnapshotMap(undefined).size, 0);
      console.log("cost snapshot import PASS");
    `;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout.trim()).toBe("cost snapshot import PASS");
  });

  test("one canonical definition, zero imports/state leakage and unchanged four callers", () => {
    const source = readFileSync(moduleUrl, "utf8");
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
    expect(ast.body).toHaveLength(1);
    expect(ast.body[0].declaration.id.name).toBe("costSnapshotMap");
    const scope = analyze(ast, { ecmaVersion: 2022, sourceType: "module" });
    expect([...new Set(scope.globalScope.through.map((reference) => reference.identifier.name))]).toEqual(["Map"]);
    expect(source).not.toMatch(/\b(document|window|localStorage|sessionStorage|fetch|supabase|storage|originalCostItems|loadedEstimateBaseline|currentProfile)\b|\bel\./);
    const main = readFileSync(mainUrl, "utf8");
    const mainAst = parse(main, { ecmaVersion: "latest", sourceType: "module" });
    expect(mainAst.body.filter((node) => node.type === "FunctionDeclaration" && node.id.name === "costSnapshotMap")).toEqual([]);
    expect(mainAst.body.filter((node) => node.type === "ImportDeclaration" && node.source.value === "./cost-snapshot.js")).toHaveLength(1);
    expect(main.match(/costSnapshotMap\(/g)).toHaveLength(4);
    const server = readFileSync(new URL("../../../app/api/os/estimates/_lib/estimates.js", import.meta.url), "utf8");
    expect(server).not.toMatch(/costSnapshotMap|cost-snapshot\.js/);
    expect(main.replaceAll("\r\n", "\n")).toContain('if (currentProfile?.role === "staff") {\n    renderStaffEstimate();\n    return;');
  });
});
