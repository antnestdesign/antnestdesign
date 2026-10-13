// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parse } from "espree";
import { expect, describe, test } from "vitest";
import { createEstimateCalculation } from "../../../public/os-app/src/calculator/estimate-core.js";
import { buildEstimateInternalViewModel, buildStoredInternalSummaryModel, buildInternalRowsModel } from "../../../public/os-app/src/estimate-view-model.js";
import { estimateViewCases, exerciseViewCase, snapshotView, viewCaseEstimate } from "../fixtures/estimate-view-cases.js";
import { createViewRuntime, viewGolden } from "../helpers/estimate-view-runtime.js";

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
describe("Phase 3D exact OLD/NEW DOM and HTML characterization at 17a5c29", () => {
  for (const entry of estimateViewCases) {
    test(`${entry.name}: HTML, controls, disabled/readOnly, totals and empty state`, () => {
      const old = createViewRuntime(entry, true);
      const current = createViewRuntime(entry);
      const expected = viewGolden.cases.find((item) => item.name === entry.name).result;
      const before = structuredClone(current.estimate);
      freeze(current.estimate);
      freeze(current.result);
      for (const evidence of [old, current]) {
        const returns = exerciseViewCase(evidence.runtime, entry, evidence.estimate, evidence.result);
        const snapshot = snapshotView(evidence.document, evidence.elements, structuredClone(returns));
        expect(snapshot).toStrictEqual(expected);
      }
      expect(current.estimate).toStrictEqual(before);
      // Re-rendering is deterministic and never appends stale quote/internal rows.
      const repeated = exerciseViewCase(current.runtime, entry, current.estimate, current.result);
      expect(snapshotView(current.document, current.elements, structuredClone(repeated))).toStrictEqual(expected);
      old.dom.window.close(); current.dom.window.close();
    });
  }
});

test("view models reuse summary/diagnostics and never alter persisted pipe or other trade amounts", () => {
  const core = createEstimateCalculation();
  const estimate = freeze(viewCaseEstimate({ pipe: true }));
  const before = structuredClone(estimate);
  const options = { groupLabels: viewGolden.config.quoteGroupLabels, groupOrder: viewGolden.config.quoteGroupOrder, markupRate: core.markupRate, canViewInternal: true, pipeCleaningItemName: "기존 배관 청소", pipeCleaningAmount: 300000 };
  const model = buildEstimateInternalViewModel(estimate, options);
  expect(model.diagnostics).toEqual([]);
  expect(model.totals.totalCustomer).toBe(4070000);
  expect(model.totals.totalCost).toBe(3200000);
  expect(model.totals.totalProfit).toBe(870000);
  const pipe = model.groups.flatMap((group) => group.details).find((detail) => detail.item === "기존 배관 청소");
  expect(pipe.view).toEqual({ cost: 300000, customer: 300000, profit: 0, marginRate: 0 });
  expect(buildInternalRowsModel(estimate.internalDetails).at(-1).viewProfit).toBe(0);
  expect(buildStoredInternalSummaryModel(estimate, options)).toEqual({ directCost: 3200000, customerRevenue: 4070000, profit: 870000, marginRate: 27.19 });
  expect(buildEstimateInternalViewModel(estimate, options)).toStrictEqual(model);
  expect(estimate).toStrictEqual(before);
});

test("legacy diagnostics are internal-only and absent when the presentation permission is false", () => {
  const core = createEstimateCalculation();
  const estimate = freeze(viewCaseEstimate({ pipe: true, gap: true }));
  const options = { groupLabels: viewGolden.config.quoteGroupLabels, groupOrder: viewGolden.config.quoteGroupOrder, markupRate: core.markupRate, pipeCleaningItemName: "기존 배관 청소", pipeCleaningAmount: 300000 };
  expect(buildEstimateInternalViewModel(estimate, { ...options, canViewInternal: true }).diagnostics[0].title).toBe("구버전 견적 원가 누락");
  expect(buildEstimateInternalViewModel(estimate, { ...options, canViewInternal: false }).diagnostics).toEqual([]);
});

test("checkbox label guard retains preventDefault and normal direct checkbox interaction", () => {
  for (const original of [true, false]) {
    const evidence = createViewRuntime({ name: "guard", kind: "setup" }, original);
    evidence.runtime.guardCheckboxLabelClicks();
    const label = evidence.document.querySelector("label.section-toggle");
    const checkbox = label.querySelector("input");
    const initial = checkbox.checked;
    const event = new evidence.dom.window.MouseEvent("click", { bubbles: true, cancelable: true });
    label.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(checkbox.checked).toBe(initial);
    checkbox.click();
    expect(checkbox.checked).toBe(!initial);
    evidence.dom.window.close();
  }
});

test("absent internal targets retain the old early return before parsing any unsafe/legacy details", () => {
  for (const original of [true, false]) {
    const evidence = createViewRuntime({ role: "staff", safe: true }, original);
    for (const id of ["internalDetailRows", "adminInternalDetailRows", "adminQuoteRows", "adminQuoteGroupTotals"]) evidence.document.getElementById(id)?.remove();
    expect(() => evidence.runtime.renderInternalRows(undefined)).not.toThrow();
    expect(() => evidence.runtime.renderAdminMarginTable({ internalDetails: { legacy: true } })).not.toThrow();
    evidence.dom.window.close();
  }
});

test("view/restore/print import safely without browser globals and never import storage, server or main", () => {
  const modules = ["estimate-view-model.js", "estimate-restore.js", "estimate-view.js", "estimate-print.js"];
  for (const name of modules) {
    const source = readFileSync(new URL(`../../../public/os-app/src/${name}`, import.meta.url), "utf8");
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module" });
    expect(ast.body.filter((node) => node.type === "ImportDeclaration").map((node) => node.source.value).join(" ")).not.toMatch(/main|storage|app\/api|supabase/);
    expect(source).not.toMatch(/\b(fetch|localStorage|sessionStorage|window\.print|createContractPackage|publishCostDrafts)\b/);
  }
  const urls = modules.map((name) => new URL(`../../../public/os-app/src/${name}`, import.meta.url).href);
  const script = `delete globalThis.window; delete globalThis.document; globalThis.fetch = () => { throw new Error('network forbidden'); }; for (const url of ${JSON.stringify(urls)}) await import(url);`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
  expect(result.status, result.stderr).toBe(0);
});
