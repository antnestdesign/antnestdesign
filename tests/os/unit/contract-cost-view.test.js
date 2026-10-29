// @vitest-environment node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { beforeAll, afterAll, describe, expect, test, vi } from "vitest";
import { contractViewCases, costViewCases } from "../fixtures/contract-cost-view-cases.js";
import { createContractCostRuntime, exerciseContractCost, contractCostGolden, currentFunctionSource } from "../helpers/contract-cost-view-runtime.js";
import { CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { normalizeContractPaymentSchedule } from "../../../public/os-app/src/contract-view-model.js";
import { normalizeContractPrintResult } from "../helpers/document-semantics.js";
beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z")); });
afterAll(() => vi.useRealTimers());

function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
describe("Phase 3E contract and cost exact characterization at 5bdc7c9", () => {
  for (const [kind, cases] of [["contract", contractViewCases], ["cost", costViewCases]]) for (const entry of cases) {
    test(`${entry.name}: OLD/NEW HTML, readonly/disabled/hidden, filter and snapshot identity`, () => {
      const expected = contractCostGolden.cases.find((item) => item.kind === kind && item.name === entry.name).result;
      for (const original of [true, false]) {
        const evidence = createContractCostRuntime(kind, entry, original);
        const before = structuredClone(evidence.fixture);
        freeze(evidence.fixture);
        const actual = structuredClone(exerciseContractCost(evidence, kind, entry));
        // Phase 3G changes print markup, not stored document fields or non-print DOM.
        expect(kind === "contract" ? normalizeContractPrintResult(actual) : actual)
          .toStrictEqual(kind === "contract" ? normalizeContractPrintResult(expected) : expected);
        expect(evidence.fixture).toStrictEqual(before);
        evidence.dom.window.close();
      }
    });
  }
});

test("48 terms, saved payment zero/label/ratio/amount/due basis, contractor and generated sections remain authoritative", () => {
  expect(CONTRACT_FIXED_TERM_LINES).toStrictEqual(contractCostGolden.configs.CONTRACT_FIXED_TERM_LINES);
  expect(CONTRACT_FIXED_TERM_LINES.filter((line) => /^제\d+조/.test(line))).toHaveLength(48);
  const saved = { totalAmount: 1001, paymentSchedule: [{ label: "", ratio: 0, amount: 0, due_basis: "" }, { label: "SAVED", ratio: 35, amount: 123, due_basis: "SAVED BASIS" }] };
  const schedule = normalizeContractPaymentSchedule(freeze(saved));
  expect(schedule[0]).toEqual(saved.paymentSchedule[0]);
  expect(schedule[1]).toEqual(saved.paymentSchedule[1]);
  const evidence = createContractCostRuntime("contract", { generated: true, payment: true });
  const output = exerciseContractCost(evidence, "contract", { generated: true, payment: true }).contract;
  expect(output).toContain("SAVED DOCUMENT CONTRACTOR");
  expect(output).toContain("SAVED DOCUMENT PROJECT");
  expect(output).toContain("SAVED LABEL");
  expect(output).toContain("SAVED BASIS");
  expect(output).toContain("35%");
  expect(output).toContain("123,456원");
  evidence.dom.window.close();
});

test("legacy mutation functions stay exact except explicit issued-source orchestration adapters", () => {
  const adapters = new Set(["saveContractOptionsFromForm", "previewContractPackageFromForm", "createContractPackageFromForm", "refreshContractPackagePanel", "loadContractPackageToPreview"]);
  for (const [name, source] of Object.entries(contractCostGolden.protectedSources)) {
    if (adapters.has(name)) { expect(currentFunctionSource(name), name).toContain("contractSourceView"); continue; }
    expect(currentFunctionSource(name), name).toBe(source);
  }
});

test("stored finalized document clauses and contractor never follow current template or package edits", () => {
  const evidence = createContractCostRuntime("contract", { generated: true, status: "CONTRACTED" });
  const { snapshot, documents } = evidence.fixture.preview;
  const original = evidence.runtime.renderContractPrintDocument(snapshot, documents);
  const line = CONTRACT_FIXED_TERM_LINES[1];
  try {
    CONTRACT_FIXED_TERM_LINES[1] = "SYNTHETIC_CURRENT_TEMPLATE_MUST_NOT_REPLACE_SAVED";
    snapshot.parties_info.contractor.company_name = "SYNTHETIC_CURRENT_COMPANY_MUST_NOT_REPLACE_SAVED";
    const updated = evidence.runtime.renderContractPrintDocument(snapshot, documents);
    expect(updated).toBe(original);
    expect(updated).not.toMatch(/CURRENT_TEMPLATE_MUST_NOT|CURRENT_COMPANY_MUST_NOT/);
  } finally {
    CONTRACT_FIXED_TERM_LINES[1] = line;
    evidence.dom.window.close();
  }
});

test("staff preview filters internal fields without modifying the original package evidence", () => {
  const evidence = createContractCostRuntime("contract", { role: "staff" });
  const before = structuredClone(evidence.fixture.preview);
  exerciseContractCost(evidence, "contract", { role: "staff" });
  const preview = evidence.document.getElementById("contractDocumentPreview").textContent;
  expect(preview).toContain("합성 공개 정보");
  expect(preview).not.toMatch(/SYNTHETIC_INTERNAL|SYNTHETIC_HASH|SYNTHETIC_ACTOR|costTotal|internalDetails/);
  expect(evidence.fixture.preview).toStrictEqual(before);
  evidence.dom.window.close();
});

test("new modules have no storage/RPC/network/main imports and import safely without browser globals", () => {
  const modules = ["contract-view-model.js", "contract-view.js", "contract-print.js", "cost-view-model.js", "cost-view.js"];
  for (const name of modules) {
    const source = readFileSync(new URL(`../../../public/os-app/src/${name}`, import.meta.url), "utf8");
    expect(source).not.toMatch(/from ["'][^"']*(main|storage|app\/api)|\b(fetch|supabase|localStorage|sessionStorage|confirmContractPackage|publishCostDrafts)\b/);
  }
  const urls = modules.map((name) => new URL(`../../../public/os-app/src/${name}`, import.meta.url).href);
  const script = `delete globalThis.window; delete globalThis.document; globalThis.fetch = () => { throw Error('network forbidden'); }; for (const url of ${JSON.stringify(urls)}) await import(url);`;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", timeout: 10000 });
  expect(result.status, result.stderr).toBe(0);
});
