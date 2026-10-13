import { JSDOM } from "jsdom";

const text = node => node?.textContent.replace(/\s+/g, " ").trim() || "";
const pairs = (node, selector) => [...node.querySelectorAll(selector)].map(row => [text(row.querySelector("dt")), text(row.querySelector("dd"))]);
const rows = node => [...node.querySelectorAll("table tr")].map(row => [...row.children].map(text));

export function contractDocumentSemantics(html) {
  const dom = new JSDOM(`<body>${html || ""}</body>`);
  const documents = [...dom.window.document.querySelectorAll(".contract-print-page")].map(article => {
    const title = text(article.querySelector("h1"));
    return {
      title,
      identity: pairs(article, "header dl > div"),
      overview: pairs(article, ".contract-print-grid > div").filter(([label]) => !["고객", "연락처"].includes(label)),
      tables: rows(article),
      terms: [...article.querySelectorAll(".contract-fixed-terms p")].map(text),
      signatures: [...article.querySelectorAll(".contract-print-signature > div")].map(text),
      total: text(article.querySelector("footer:not(.contract-print-footer)")),
      paragraphs: [...article.querySelectorAll(".contract-print-section > p")].map(text),
    };
  });
  dom.window.close();
  return documents;
}

export function customerEstimateSemantics(html) {
  const dom = new JSDOM(`<body>${html || ""}</body>`);
  const document = dom.window.document;
  const allRows = [...document.querySelectorAll("table tbody tr")];
  const groups = allRows.filter(row => row.classList.contains("contract-subtotal-row") || row.children.length === 2)
    .map(row => [text(row.firstElementChild), text(row.lastElementChild)]);
  const result = { project: text(document.querySelector("header h1")), identity: pairs(document, "header dl > div"), groups,
    total: text(document.querySelector("footer")), company: text(document.querySelector(".and-print-footer")) };
  dom.window.close();
  return result;
}

export function normalizeContractPrintResult(result) {
  const copy = structuredClone(result);
  for (const key of ["contract", "quote", "spec"]) if (typeof copy[key] === "string") copy[key] = contractDocumentSemantics(copy[key]);
  if (typeof copy.dom?.printQuoteSheet === "string") copy.dom.printQuoteSheet = contractDocumentSemantics(copy.dom.printQuoteSheet);
  return copy;
}

export function normalizeEstimatePrintResult(result) {
  const copy = structuredClone(result);
  if (typeof copy.customerPrint === "string") copy.customerPrint = customerEstimateSemantics(copy.customerPrint);
  const target = copy.targets?.printQuoteSheet;
  if (target?.html?.includes("and-print-footer")) target.html = customerEstimateSemantics(target.html);
  return copy;
}
