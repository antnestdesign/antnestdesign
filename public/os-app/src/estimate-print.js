import { won } from "./utils.js";

export function createEstimatePrint({ document, customerWon, formatDateTime, printGroupLabels }) {
function renderPrintQuote(quote) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !quote) return;
  sheet.innerHTML = `
    <header>
      <p>공사 견적서</p>
      <h1>${quote.projectName}</h1>
      <dl>
        <div><dt>평형</dt><dd>${quote.areaPyeong}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(quote.savedAt)}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>금액</th></tr>
      </thead>
      <tbody>
        ${quote.groups.map((group) => `
          <tr>
            <td>${printGroupLabels[group.label] || `${group.label}공사`}</td>
            <td>${group.totalText}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <footer>
      <div><span>총 공사금액</span><strong>${quote.totalText}</strong></div>
      <p>※ 부가세 별도 금액입니다.</p>
      <p>※ 현장 실측 및 최종 자재 선택에 따라 공사금액은 조정될 수 있습니다.</p>
    </footer>
    <section class="and-print-footer" aria-label="ANTNEST DESIGN company information">
      <div class="and-print-footer-grid">
        <div class="and-print-footer-brand">
          <img src="/logo.png" alt="ANTNEST DESIGN" />
          <p>Architecture of Everyday Life</p>
        </div>
        <div>
          <p class="and-print-footer-title">Company</p>
          <p>AND · ANTNEST DESIGN</p>
          <p>주식회사 앤트네스트디자인</p>
          <p>대표자 이민영</p>
          <p>사업자등록번호 149-85-03105</p>
        </div>
        <div>
          <p class="and-print-footer-title">Contact</p>
          <p>TEL 032.321.6722</p>
          <p>FAX 032.321.6895</p>
          <p>antnestdesign@naver.com</p>
        </div>
        <div class="and-print-footer-address">
          <p class="and-print-footer-title">Address</p>
          <p>인천 서구 중봉대로 612번길 10-20</p>
          <p>506호 (청라동, 청라프라자1)</p>
        </div>
      </div>
      <div class="and-print-footer-bottom">
        <div>
          <span>개인정보처리방침</span>
          <span>© 2026 ANTNEST DESIGN</span>
        </div>
        <p>Interior · Architecture · Construction Management</p>
      </div>
    </section>
  `;
}

function renderAdminDetailPrint(estimate) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  const details = estimate.internalDetails || [];
  sheet.innerHTML = `
    <header>
      <p>상세견적</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>항목</th><th>입력</th><th>산출</th><th>단가</th><th>직접원가</th><th>고객가</th><th>마진</th></tr>
      </thead>
      <tbody>
        ${details.map((item) => `
          <tr>
            <td>${item.item}</td>
            <td>${item.input}</td>
            <td>${item.quantity}</td>
            <td>${won(item.unitPrice)}</td>
            <td>${won(item.cost)}</td>
            <td>${customerWon(item.revenue)}</td>
            <td>${won(item.customerRevenue - item.cost)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <footer>
      <div><span>고객용 총액</span><strong>${customerWon(estimate.total || 0)}</strong></div>
      <div><span>내부 원가</span><strong>${won(estimate.costTotal || 0)}</strong></div>
    </footer>
  `;
}

function renderAdminInternalPrint(estimate, model) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  const { groups, totals: { totalCustomer, totalCost, totalProfit, totalMarginRate } } = model;
  sheet.innerHTML = `
    <header>
      <p>내부견적</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>고객용</th><th>내부용</th><th>마진</th><th>마진율</th></tr>
      </thead>
      <tbody>
        ${groups.map((group) => `
          <tr>
            <td>${group.label}</td>
            <td>${customerWon(group.customer)}</td>
            <td>${won(group.cost)}</td>
            <td>${won(group.profit)}</td>
            <td>${(group.marginRate * 100).toFixed(1)}%</td>
          </tr>
        `).join("")}
        <tr>
          <td>총계</td>
          <td>${customerWon(totalCustomer)}</td>
          <td>${won(totalCost)}</td>
          <td>${won(totalProfit)}</td>
          <td>${(totalMarginRate * 100).toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function renderPurchaseOrderPrint(estimate, items) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  sheet.innerHTML = `
    <header>
      <p>발주내역서</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>품목</th><th>사양</th><th>수량</th><th>예상 원가</th></tr>
      </thead>
      <tbody>
        ${items.length ? items.map((item) => `
          <tr>
            <td>${item.process}</td>
            <td>${item.item}</td>
            <td>${item.spec}</td>
            <td>${item.quantity}</td>
            <td>${won(item.budget)}</td>
          </tr>
        `).join("") : `<tr><td colspan="5">발주 필요 품목이 없습니다.</td></tr>`}
      </tbody>
    </table>
    <footer>
      <div><span>발주 품목</span><strong>${items.length}개</strong></div>
      <div><span>예상 원가</span><strong>${won(items.reduce((sum, item) => sum + item.budget, 0))}</strong></div>
    </footer>
  `;
}

function hasPrintTarget() { return Boolean(document.getElementById("printQuoteSheet")); }
return { renderPrintQuote, renderAdminDetailPrint, renderAdminInternalPrint, renderPurchaseOrderPrint, hasPrintTarget };
}
