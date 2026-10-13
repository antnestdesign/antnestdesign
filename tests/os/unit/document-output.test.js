// @vitest-environment node
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { JSDOM } from "jsdom";
import { describe, expect, test } from "vitest";
import { createContractPrint, CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { createEstimatePrint } from "../../../public/os-app/src/estimate-print.js";
import { won } from "../../../public/os-app/src/utils.js";
import { documentCases, documentFixture } from "../document-output/fixtures.js";
import { createContractCostRuntime, contractCostGolden } from "../helpers/contract-cost-view-runtime.js";
import { contractDocumentSemantics, customerEstimateSemantics } from "../helpers/document-semantics.js";

const oldView = JSON.parse(readFileSync(new URL("../fixtures/estimate-view-characterization.json", import.meta.url), "utf8"));
const hash = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }

describe("Phase 3G customer print semantics survive layout changes", () => {
  for (const entry of documentCases) test(`${entry.name}: OLD/NEW amounts, rows, parties, payments, clauses and specs`, () => {
    const fixture = freeze(documentFixture(entry));
    const before = hash(fixture);
    const e = createContractCostRuntime("contract", {}, true);
    const document = e.document;
    const current = createContractPrint({ document, formatDateTime: e.runtime.formatDateTime });
    for (const [method, type] of [["renderContractPrintDocument", "CONTRACT"], ["renderContractQuotePrint", "QUOTE"], ["renderContractSpecPrint", "SPEC"]]) {
      if (![type, "ALL"].includes(entry.type)) continue;
      expect(contractDocumentSemantics(current[method](fixture.snapshot, fixture.documents)))
        .toStrictEqual(contractDocumentSemantics(e.runtime[method](fixture.snapshot, fixture.documents)));
    }
    if (entry.type === "ESTIMATE") {
      const old = vm.createContext({ document, customerWon: won, printGroupLabels: {}, formatDateTime: e.runtime.formatDateTime });
      vm.runInContext(oldView.sources.renderPrintQuote, old);
      old.renderPrintQuote(fixture.quote);
      const previous = document.getElementById("printQuoteSheet").innerHTML;
      createEstimatePrint({ document, customerWon: won, formatDateTime: e.runtime.formatDateTime, printGroupLabels: {} }).renderPrintQuote(fixture.quote);
      const output = document.getElementById("printQuoteSheet");
      expect(customerEstimateSemantics(output.innerHTML)).toStrictEqual(customerEstimateSemantics(previous));
      for (const group of fixture.quote.groups) for (const item of group.items) expect(output.textContent).toContain(item.name);
    }
    expect(hash(fixture)).toBe(before);
    e.dom.window.close();
  });
});

for (const role of ["admin", "manager", "staff"]) test(`${role}: customer documents never enumerate private snapshot fields`, () => {
  const fixture = documentFixture({ count: 3 });
  Object.assign(fixture.snapshot, { internalDetails: [{ cost: "PRIVATE_COST_SENTINEL" }], costSnapshot: { supplier: "PRIVATE_SUPPLIER_SENTINEL" }, profit: "PRIVATE_PROFIT_SENTINEL" });
  const dom = new JSDOM('<section id="printQuoteSheet"></section>');
  const print = createContractPrint({ document: dom.window.document, formatDateTime: () => "2026. 1. 1." });
  print.renderContractPrintSheet("ALL", freeze(fixture.snapshot), freeze(fixture.documents));
  expect(dom.window.document.body.textContent).not.toMatch(/PRIVATE_\w+_SENTINEL|costTotal|internalDetails|internalSummary|costSnapshot|source_hash|created_by/);
  expect(dom.window.document.querySelectorAll("article")).toHaveLength(3);
  expect(dom.window.document.body.textContent).toContain("제48조");
  dom.window.close();
});

test("48 fixed clauses and saved payment/contractor source of truth remain unchanged", () => {
  expect(CONTRACT_FIXED_TERM_LINES).toStrictEqual(contractCostGolden.configs.CONTRACT_FIXED_TERM_LINES);
  const fixture = documentFixture({ count: 3 });
  fixture.snapshot.parties_info.contractor.company_name = "NOT_THE_SAVED_CONTRACTOR";
  const dom = new JSDOM('<section id="printQuoteSheet"></section>');
  const html = createContractPrint({ document: dom.window.document, formatDateTime: () => "2026. 1. 1." }).renderContractPrintDocument(fixture.snapshot, fixture.documents);
  expect(html).toContain("SAVED DOCUMENT CONTRACTOR");
  expect(html).not.toContain("NOT_THE_SAVED_CONTRACTOR");
  expect(contractDocumentSemantics(html)[0].terms.filter(line => /^제\d+조/.test(line))).toHaveLength(48);
  dom.window.close();
});

test("long text is escaped as data, and document style stays scoped to print", () => {
  const fixture = documentFixture({ count: 3 });
  fixture.quote.projectName = '<script>PRIVATE_XSS_SENTINEL</script>';
  fixture.quote.groups[0].items[0].name = '<img onerror="bad()">';
  const dom = new JSDOM('<section id="printQuoteSheet"></section>');
  createEstimatePrint({ document: dom.window.document, customerWon: won, formatDateTime: () => "2026. 1. 1.", printGroupLabels: {} }).renderPrintQuote(fixture.quote);
  expect(dom.window.document.querySelector("script")).toBeNull();
  expect(dom.window.document.querySelector("[onerror]")).toBeNull();
  expect(dom.window.document.body.textContent).toContain(fixture.quote.projectName);
  const css = readFileSync(new URL("../../../public/os-app/document-print.css", import.meta.url), "utf8");
  expect(css).toContain("@media print"); expect(css).toContain("@bottom-right");
  expect(css).toContain("counter(page)"); expect(css).toContain("table-header-group");
  expect(css).not.toContain("counter(contract-page)");
  dom.window.close();
});

test("legacy null contractor keeps existing document fallbacks without breaking print", () => {
  const fixture = documentFixture({ count: 3 });
  fixture.snapshot.parties_info.contractor = null;
  const dom = new JSDOM('<section id="printQuoteSheet"></section>');
  const print = createContractPrint({ document: dom.window.document, formatDateTime: () => "2026. 1. 1." });
  expect(() => print.renderContractPrintSheet("ALL", freeze(fixture.snapshot), [])).not.toThrow();
  expect(dom.window.document.querySelectorAll("article")).toHaveLength(3);
  expect(dom.window.document.body.textContent).toContain("ANTNEST DESIGN");
  dom.window.close();
});
