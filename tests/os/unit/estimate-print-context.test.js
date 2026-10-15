// @vitest-environment node
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { expect, test } from "vitest";
import { createEstimatePrint } from "../../../public/os-app/src/estimate-print.js";
import { won } from "../../../public/os-app/src/utils.js";
import { latestEstimate } from "../fixtures/estimates.js";
import { documentCases, documentFixture } from "../document-output/fixtures.js";
import { createViewRuntime } from "../helpers/estimate-view-runtime.js";

const golden = JSON.parse(readFileSync(new URL("../fixtures/estimate-view-characterization.json", import.meta.url), "utf8"));
const formatDateTime = () => "2026. 1. 1.";
function printer() {
  const dom = new JSDOM('<section id="printQuoteSheet"></section>');
  const document = dom.window.document;
  return { dom, document, print: createEstimatePrint({ document, customerWon: won, formatDateTime, printGroupLabels: golden.config.printGroupLabels }) };
}
function freeze(value) {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

test("management detailed/internal outputs remain exact OLD/NEW HTML", () => {
  const entry = { name: "print context", kind: "print", role: "admin", pipe: true };
  const old = createViewRuntime(entry, true);
  const current = createViewRuntime(entry);
  for (const method of ["renderAdminDetailPrint", "renderAdminInternalPrint", "renderPurchaseOrderPrint"]) {
    old.runtime[method](old.estimate);
    current.runtime[method](freeze(current.estimate));
    expect(current.document.getElementById("printQuoteSheet").innerHTML).toBe(old.document.getElementById("printQuoteSheet").innerHTML);
  }
  old.dom.window.close(); current.dom.window.close();
});

test("default customer detail renderer is unchanged and summary preserves header/footer", () => {
  const { dom, document, print } = printer();
  const quote = freeze(latestEstimate().customerQuote);
  print.renderPrintQuote(quote);
  const detailed = document.getElementById("printQuoteSheet").innerHTML;
  expect(document.querySelectorAll("thead th")).toHaveLength(3);
  for (const item of quote.groups.flatMap(g => g.items)) expect(document.body.textContent).toContain(item.name);
  const before = [...document.querySelectorAll("header, footer, .and-print-footer")].map(node => node.outerHTML);
  print.renderCustomerSummaryPrint(quote);
  expect([...document.querySelectorAll("header, footer, .and-print-footer")].map(node => node.outerHTML)).toEqual(before);
  expect(document.querySelectorAll("thead th")).toHaveLength(2);
  print.renderPrintQuote(quote);
  expect(document.getElementById("printQuoteSheet").innerHTML).toBe(detailed);
  dom.window.close();
});

for (const entry of documentCases.filter(item => item.type === "ESTIMATE_SUMMARY")) test(`${entry.name}: existing group/item/quote amounts exact, no detail/private fields`, () => {
  const fixture = documentFixture(entry);
  const quote = fixture.quote;
  Object.assign(quote, { costTotal: "PRIVATE_COST_SENTINEL", internalDetails: ["PRIVATE_DETAILS_SENTINEL"], marginRate: "PRIVATE_MARGIN_SENTINEL", profit: "PRIVATE_PROFIT_SENTINEL", costSnapshot: "PRIVATE_SNAPSHOT_SENTINEL", source_hash: "PRIVATE_HASH_SENTINEL", id: "PRIVATE_ID_SENTINEL" });
  for (const group of quote.groups) for (const item of group.items) Object.assign(item, { unit: "PRIVATE_UNIT_SENTINEL", quantity: "PRIVATE_QTY_SENTINEL", unitPrice: "PRIVATE_PRICE_SENTINEL", spec: "PRIVATE_SPEC_SENTINEL" });
  const before = JSON.stringify(quote);
  freeze(quote);
  const { dom, document, print } = printer();
  print.renderCustomerSummaryPrint(quote);
  const rows = [...document.querySelectorAll("tbody tr")];
  expect(rows).toHaveLength(quote.groups.length);
  let total = 0;
  rows.forEach((row, index) => {
    const group = quote.groups[index];
    expect(group.items.reduce((sum, item) => sum + item.amount, 0)).toBe(group.total);
    expect(row.children).toHaveLength(2);
    expect(row.firstElementChild.textContent).toBe(`${group.label}공사`);
    expect(row.lastElementChild.textContent).toBe(group.totalText);
    total += Number(row.lastElementChild.textContent.replace(/[^0-9-]/g, ""));
  });
  expect(total).toBe(quote.total);
  expect(document.querySelector("footer strong").textContent).toBe(quote.totalText);
  for (const group of quote.groups) for (const item of group.items) expect(document.body.textContent).not.toContain(item.name);
  expect(document.body.textContent).not.toMatch(/PRIVATE_\w+_SENTINEL|internalDetails|costSnapshot|source_hash|marginRate/);
  expect(JSON.stringify(quote)).toBe(before);
  dom.window.close();
});

test("existing zero/empty trades, negative adjustment and order are preserved without inventing rows", () => {
  const { dom, document, print } = printer();
  const groups = [
    { label: "필름", items: [{ name: "합성 필름", amount: 500000 }], total: 500000 },
    { label: "기타", items: [{ name: "합성 할인", amount: -10000 }, { name: "기존 배관 청소", amount: 300000 }], total: 290000 },
    { label: "도어/창호", items: [{ name: "별도 실측", amount: 0, amountText: "별도 실측 후 견적" }], total: 0 },
    { label: "빈 기존 공정", items: [], total: 0 },
  ];
  const quote = freeze({ projectName: "합성", areaPyeong: 33, savedAt: "2026-01-01", groups, total: 790000, totalText: "790,000원" });
  print.renderCustomerSummaryPrint(quote);
  expect([...document.querySelectorAll("tbody tr")].map(row => [...row.children].map(cell => cell.textContent)))
    .toEqual([["필름공사", "500,000원"], ["기타공사", "290,000원"], ["도어·창호공사", "0원"], ["빈 기존 공정공사", "0원"]]);
  print.renderCustomerSummaryPrint({ ...quote, groups: [] });
  expect(document.querySelectorAll("tbody tr")).toHaveLength(1);
  expect(document.querySelector("tbody td").colSpan).toBe(2);
  expect(document.querySelector("tbody").textContent).toContain("표시할 견적 항목이 없습니다.");
  dom.window.close();
});

test("management print entry stays detailed, customer and staff shortcuts select summary explicitly", () => {
  const source = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
  const section = (name, next) => source.slice(source.indexOf(`function ${name}(`), source.indexOf(`function ${next}(`));
  expect(section("onPrintQuoteClick", "onInternalPrintClick")).toContain("renderCustomerSummaryPrint(");
  expect(section("onInternalPrintClick", "onSystemActionClick")).toContain("renderAdminDetailPrint(estimate)");
  expect(section("onInternalPrintClick", "onSystemActionClick")).not.toContain("renderCustomerSummaryPrint");
  expect(source.slice(source.indexOf("function onStaffQuoteAction("), source.indexOf("function bootstrap("))).toContain("renderCustomerSummaryPrint(");
  // The original detailed renderer remains callable without any new context.
  const context = vm.createContext({ document: { getElementById: () => null } });
  vm.runInContext(golden.sources.renderAdminDetailPrint, context);
  expect(() => context.renderAdminDetailPrint(null)).not.toThrow();
});
