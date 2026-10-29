import { escapeHtml as esc } from "./utils.js";
import { EDITOR_TRADES } from "./detailed-editor.js";
import { selectedSpaceIds } from "./detailed-measurement.js";
const money = value => `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;
const date = value => value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "발행 전";
export function renderDetailedVersion(doc) {
  const c = doc.context, e = doc.editor, s = e.summary, company = doc.company;
  const states = { undecided: "미정", included: "포함", excluded: "제외" };
  return `<article class="contract-print-page detailed-issued-document"><header class="contract-print-header"><p class="document-brand">${esc(company.brand)}</p><p>공사 견적서${doc.version ? "" : " · 발행 전 검토"}</p><h1>${esc(c.project_name)}</h1>
    <dl><div><dt>견적번호·버전</dt><dd>${doc.version ? `${esc(doc.quoteNumber)} · V${doc.version}` : "미발행"}</dd></div><div><dt>발행일</dt><dd>${esc(date(doc.issuedAt))}</dd></div><div><dt>고객명</dt><dd>${esc(c.client_name)}</dd></div><div><dt>현장 주소</dt><dd>${esc(c.address)}</dd></div><div><dt>연락처</dt><dd>${esc(c.phone || "-")}</dd></div></dl></header>
    <div class="detailed-issued-total"><span>최종 공급대가</span><strong>${money(s.total)}</strong><span>부가세 포함</span></div>
    <table class="contract-print-table detailed-issued-table"><colgroup><col style="width:25%"><col style="width:29%"><col style="width:8%"><col style="width:8%"><col style="width:15%"><col style="width:15%"></colgroup><thead><tr><th>공사항목</th><th>공간·규격</th><th>수량</th><th>단위</th><th>판매단가</th><th>판매금액</th></tr></thead>
    ${EDITOR_TRADES.map(([trade, label]) => {
      const rows = e.items.filter(i => i.trade === trade && !i.excluded);
      if (!rows.length) return "";
      const group = s.groups.find(g => g.trade === trade);
      return `<tbody class="document-trade"><tr class="contract-subtotal-row"><td colspan="5">${esc(label)} · 소계</td><td class="document-number">${money(group.total)}</td></tr>${rows.map(i => `<tr${i.memo ? ' class="detailed-issued-noted"' : ""}><td>${esc(i.name)}</td><td>${esc(selectedSpaceIds(i).map(id => e.spaces.find(space => space.id === id)?.name).filter(Boolean).join(", ") || "공통")}${i.spec ? `<br>${esc(i.spec)}` : ""}</td><td class="document-number">${Number(i.quantity).toLocaleString("ko-KR", { maximumFractionDigits: 6 })}</td><td>${esc(i.unit)}</td><td class="document-number">${money(i.saleUnitPrice)}</td><td class="document-number">${money(i.amount)}</td></tr>${i.memo ? `<tr><td colspan="6">비고: ${esc(i.memo)}</td></tr>` : ""}`).join("")}</tbody>`;
    }).join("")}</table>
    <div class="detailed-issued-closing"><section class="contract-print-section detailed-issued-summary"><h2>견적 합계</h2><dl>${[["공정 합계", s.subtotal], ["추가금액", e.addition], ["할인금액", -e.discount], ["최종 견적 단위조정", s.rounding], ["공급가액", s.supply], ["부가세", s.vat], ["최종 공급대가", s.total]].map(([label, amount]) => `<div><dt>${label}</dt><dd>${money(amount)}</dd></div>`).join("")}</dl></section>
    <section class="contract-print-section"><h2>별도 견적 범위</h2><p>창호: ${states[e.separateQuotes.windows]} · 냉난방기: ${states[e.separateQuotes.hvac]}</p></section>
    <footer class="detailed-issued-company"><strong>${esc(company.name)}</strong><p>대표 ${esc(company.representative)} · 사업자등록번호 ${esc(company.businessNumber)}</p><p>${esc(company.address)}</p><p>TEL ${esc(company.phone)} · ${esc(company.email)}</p></footer></div></article>`;
}

export function printDetailedVersion(doc, window) {
  const base = window.location.origin;
  const popup = window.open(`${base}/os-app/detailed-version-output.html`, "_blank", "width=1000,height=850");
  if (!popup) throw new Error("출력 창이 차단됐습니다. 이 사이트의 출력 팝업을 허용한 뒤 다시 시도해 주세요.");
  const deliver = event => {
    if (event.origin !== base || event.source !== popup || event.data?.type !== "detailed-output-ready") return;
    popup.postMessage({ type: "detailed-output-document", document: doc }, base);
    window.removeEventListener("message", deliver); window.clearTimeout(timeout);
  };
  window.addEventListener("message", deliver);
  const timeout = window.setTimeout(() => window.removeEventListener("message", deliver), 30000);
  return popup;
}
