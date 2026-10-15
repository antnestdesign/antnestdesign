import { JSDOM } from "jsdom";
import { createContractPrint } from "../../../public/os-app/src/contract-print.js";
import { createEstimatePrint } from "../../../public/os-app/src/estimate-print.js";
import { won } from "../../../public/os-app/src/utils.js";

export function renderDocumentCase(entry, fixture) {
  const dom = new JSDOM('<section id="printQuoteSheet" class="print-quote-sheet"></section>');
  const document = dom.window.document;
  const formatDateTime = () => "2026. 1. 1.";
  if (["ESTIMATE", "ESTIMATE_SUMMARY"].includes(entry.type)) {
    const print = createEstimatePrint({ document, customerWon: won, formatDateTime, printGroupLabels: {} });
    if (entry.type === "ESTIMATE_SUMMARY") print.renderCustomerSummaryPrint(fixture.quote);
    else print.renderPrintQuote(fixture.quote);
  }
  else createContractPrint({ document, formatDateTime }).renderContractPrintSheet(entry.type, fixture.snapshot, fixture.documents);
  const html = document.getElementById("printQuoteSheet").outerHTML;
  dom.window.close();
  return html;
}
