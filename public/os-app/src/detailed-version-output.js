import { renderDetailedVersion } from "./detailed-version-print.js";
const button = document.getElementById("issuedPrintButton"), status = document.getElementById("issuedOutputStatus");
const parent = window.opener;
window.addEventListener("message", async function receive(event) {
  if (!parent || event.source !== parent || event.origin !== window.location.origin || event.data?.type !== "detailed-output-document") return;
  window.removeEventListener("message", receive);
  try {
    const doc = event.data.document;
    document.getElementById("printQuoteSheet").innerHTML = renderDetailedVersion(doc);
    document.title = `${doc.quoteNumber || "발행 전 견적"}${doc.version ? `_V${doc.version}` : ""}`;
    window.opener = null;
    await document.fonts.ready;
    button.disabled = false; status.textContent = "";
  } catch { status.textContent = "문서를 준비하지 못했습니다. 출력 창을 닫고 다시 시도해 주세요."; }
});
button.addEventListener("click", () => window.print());
if (parent) parent.postMessage({ type: "detailed-output-ready" }, window.location.origin);
else status.textContent = "견적의 출력 버튼에서 문서를 열어 주세요.";
