import { won, escapeHtml } from "./utils.js";

export function createEstimateView({ document, customerWon, formatDateTime, quoteGroupLabels, quoteGroupOrder }) {
function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function renderQuoteRows(lines, details, total) {
  const quoteRows = document.getElementById("quoteRows");
  quoteRows.innerHTML = "";

  const grouped = new Map();
  for (const item of details.filter((detail) => detail.revenue > 0)) {
    const label = quoteGroupLabels[item.group] || item.group;
    if (!grouped.has(label)) grouped.set(label, { total: 0, items: [] });
    grouped.get(label).total += item.revenue;
    grouped.get(label).items.push(item);
  }

  for (const label of quoteGroupOrder) {
    const group = grouped.get(label);
    if (!group) continue;
    const headerRow = document.createElement("tr");
    headerRow.className = "quote-group-row";
    headerRow.innerHTML = `
      <td>${label}</td>
      <td>공정 합계</td>
      <td>${customerWon(group.total)}</td>
    `;
    quoteRows.appendChild(headerRow);

    for (const item of group.items) {
      const row = document.createElement("tr");
      row.className = "quote-item-row";
      row.innerHTML = `
        <td></td>
        <td>${item.item} · ${item.quantity}</td>
        <td>${customerWon(item.revenue)}</td>
      `;
      quoteRows.appendChild(row);
    }
  }

  for (const item of lines.filter((line) => line.amountText)) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.process}</td>
      <td>${item.description}</td>
      <td>${item.amountText}</td>
    `;
    quoteRows.appendChild(row);
  }

  for (const item of lines.filter((line) => line.process === "상담 보정" && line.revenue !== 0)) {
    const row = document.createElement("tr");
    row.className = "quote-group-row";
    row.innerHTML = `
      <td>${item.process}</td>
      <td>${item.description}</td>
      <td>${customerWon(item.revenue)}</td>
    `;
    quoteRows.appendChild(row);
  }

  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총 금액</td>
    <td>총 공사금액</td>
    <td>${customerWon(total)}</td>
  `;
  quoteRows.appendChild(totalRow);
}

function renderInternalRows(details) {
  const tbody = document.getElementById("internalDetailRows");
  const adminTbody = document.getElementById("adminInternalDetailRows");
  if (!tbody && !adminTbody) return;
  if (tbody) tbody.innerHTML = "";
  if (adminTbody) adminTbody.innerHTML = "";
  for (const item of details) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.item}</td>
      <td>${item.input}</td>
      <td>${item.quantity}</td>
      <td>${won(item.unitPrice)}</td>
      <td>${won(item.cost)}</td>
      <td>${(item.correction * 100).toFixed(1)}%</td>
      <td>${customerWon(item.revenue)}</td>
      <td>${won(item.viewProfit)}</td>
    `;
    if (tbody) tbody.appendChild(row);
    if (adminTbody) adminTbody.appendChild(row.cloneNode(true));
  }
}

function renderWarnings(warnings) {
  const box = document.getElementById("internalWarnings");
  if (!box) return;
  box.innerHTML = "";
  for (const warning of warnings) {
    const item = document.createElement("div");
    item.className = `warning-item${warning.includes("정상") ? " ok" : ""}`;
    item.textContent = warning;
    box.appendChild(item);
  }
}

function renderCustomerQuoteTable(quote, rows, groupTotals) {
  rows.innerHTML = "";
  groupTotals.innerHTML = "";
  if (!quote) {
    return;
  }
  for (const group of quote.groups) {
    const headerRow = document.createElement("tr");
    headerRow.className = "quote-group-row";
    headerRow.innerHTML = `
      <td>${group.label}</td>
      <td>공정 합계</td>
      <td>${group.totalText}</td>
    `;
    rows.appendChild(headerRow);

    for (const item of group.items) {
      const row = document.createElement("tr");
      row.className = "quote-item-row";
      row.innerHTML = `
        <td></td>
        <td>${item.name}</td>
        <td>${item.amountText}</td>
      `;
      rows.appendChild(row);
    }
  }

  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총 금액</td>
    <td>총 공사금액</td>
    <td>${quote.totalText}</td>
  `;
  rows.appendChild(totalRow);

  groupTotals.innerHTML = quote.groups.map((group) => `
    <div>
      <span>${group.label}</span>
      <strong>${group.totalText}</strong>
    </div>
  `).join("");
}

function renderEstimateDiagnostics(diagnostics) {
  if (!diagnostics.length) return "";
  return `
    <div class="admin-estimate-diagnostics">
      ${diagnostics.map((item) => `
        <article class="admin-estimate-diagnostic">
          <h4>${escapeHtml(item.title)}</h4>
          <p><strong>${escapeHtml(item.causeLabel)}:</strong> ${escapeHtml(item.cause)}</p>
          <p><strong>영향:</strong> ${escapeHtml(item.impact)}</p>
          <p><strong>권장 조치:</strong> ${escapeHtml(item.action)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAdminEstimateDetailPanel(model, expandedTradeKey) {
  if (!model) return `<div class="admin-estimate-detail-error">내부견적 상세를 불러오지 못했습니다.</div>`;
  const { summary, groups } = model;
  const diagnostics = renderEstimateDiagnostics(model.diagnostics);
  return `
    <div class="admin-estimate-detail-panel">
      <div class="admin-estimate-summary-grid">
        <div><span>고객 견적 총액</span><strong>${customerWon(summary.customerTotal)}</strong></div>
        <div><span>직접원가 합계</span><strong>${won(summary.directCost)}</strong></div>
        <div><span>예상 이익</span><strong>${won(summary.profit)}</strong></div>
        <div><span>전체 마진율</span><strong>${(summary.marginRate * 100).toFixed(1)}%</strong></div>
        <div><span>상세 항목 수</span><strong>${summary.detailCount}개</strong></div>
      </div>
      ${diagnostics}
      <div class="admin-trade-accordion">
        ${groups.length ? groups.map((group, index) => renderAdminTradeGroup(group, index, expandedTradeKey)).join("") : `<div class="system-empty-state">표시할 내부견적 상세가 없습니다.</div>`}
      </div>
    </div>
  `;
}

function renderAdminTradeGroup(group, index, expandedTradeKey) {
  const key = String(index);
  const open = expandedTradeKey === key;
  const details = Array.isArray(group.details) ? group.details : [];
  return `
    <section class="admin-trade-group${open ? " is-open" : ""}">
      <button class="admin-trade-header" type="button" data-toggle-internal-trade="${key}">
        <span>
          <strong>${escapeHtml(group.label)}</strong>
          <small>${group.count}개 항목 · 고객가 ${customerWon(group.customer)} · 직접원가 ${won(group.cost)} · 이익 ${won(group.profit)} · 마진율 ${(group.marginRate * 100).toFixed(1)}%</small>
        </span>
        <span class="system-cost-toggle">${open ? "접기" : "펼치기"}</span>
      </button>
      ${open ? `
        <div class="admin-trade-detail table-wrap">
          <table>
            <thead>
              <tr>
                <th>항목</th>
                <th>입력값</th>
                <th>산출량</th>
                <th>단위 원가</th>
                <th>직접원가</th>
                <th>보정률</th>
                <th>고객가</th>
                <th>이익</th>
                <th>마진율</th>
              </tr>
            </thead>
            <tbody>
              ${details.map((detail) => {
                const { customer, cost, profit, marginRate } = detail.view;
                return `
                  <tr>
                    <td>${escapeHtml(detail.item || "-")}</td>
                    <td>${escapeHtml(detail.input || "-")}</td>
                    <td>${escapeHtml(String(detail.quantity ?? "-"))}</td>
                    <td>${won(Number(detail.unitPrice) || 0)}</td>
                    <td>${won(cost)}</td>
                    <td>${((Number(detail.correction) || 0) * 100).toFixed(1)}%</td>
                    <td>${customerWon(customer)}</td>
                    <td>${won(profit)}</td>
                    <td>${(marginRate * 100).toFixed(1)}%</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      ` : ""}
    </section>
  `;
}

function renderAdminMarginTable(model) {
  const rows = document.getElementById("adminQuoteRows");
  const groupTotals = document.getElementById("adminQuoteGroupTotals");
  if (!rows || !groupTotals) return;
  rows.innerHTML = "";
  groupTotals.innerHTML = "";

  const groups = model?.groups || [];
  if (!groups.length) {
    rows.innerHTML = `<tr><td colspan="5">표시할 상세견적이 없습니다.</td></tr>`;
    groupTotals.innerHTML = `<div><span>공정별 마진</span><strong>없음</strong></div>`;
    return;
  }

  for (const group of groups) {
    const row = document.createElement("tr");
    row.className = "admin-margin-row";
    row.innerHTML = `
      <td>${group.label}</td>
      <td>${customerWon(group.customer)}</td>
      <td>${won(group.cost)}</td>
      <td>${won(group.profit)}</td>
      <td>${(group.marginRate * 100).toFixed(1)}%</td>
    `;
    rows.appendChild(row);
  }

  const { totalCustomer, totalCost, totalProfit, totalMarginRate } = model.totals;
  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총계</td>
    <td>${customerWon(totalCustomer)}</td>
    <td>${won(totalCost)}</td>
    <td>${won(totalProfit)}</td>
    <td>${(totalMarginRate * 100).toFixed(1)}%</td>
  `;
  rows.appendChild(totalRow);

  groupTotals.innerHTML = `
    <div><span>고객용 총액</span><strong>${customerWon(totalCustomer)}</strong></div>
    <div><span>내부 원가</span><strong>${won(totalCost)}</strong></div>
    <div><span>총 마진</span><strong>${won(totalProfit)}</strong></div>
    <div><span>마진율</span><strong>${(totalMarginRate * 100).toFixed(1)}%</strong></div>
  `;
}

function renderStoredInternalSummary(model) {
  if (!model) return;
  const { directCost, customerRevenue, profit, marginRate } = model;
  setText("internalCost", won(directCost));
  setText("internalRevenue", customerWon(customerRevenue));
  setText("internalProfit", won(profit));
  setText("internalMargin", `${Number(marginRate).toFixed(1)}%`);
  setText("adminInternalCost", won(directCost));
  setText("adminInternalRevenue", customerWon(customerRevenue));
  setText("adminInternalProfit", won(profit));
  setText("adminInternalMargin", `${Number(marginRate).toFixed(1)}%`);
}

function renderCostSnapshotInfo(estimate, { currentLatest, snapshotChanged, hasCurrentItems }) {
  const snapshot = estimate?.costSnapshot;
  setText("costBasisLabel", estimate ? (snapshot ? "저장 당시 원가" : "기존 저장 계산 결과") : "저장된 견적 없음");
  setText("costBasisSavedAt", estimate?.savedAt ? formatDateTime(estimate.savedAt) : "-");
  setText("costSnapshotCapturedAt", snapshot?.capturedAt ? formatDateTime(snapshot.capturedAt) : "저장 원가 기준 없음");
  setText("costDbLatestUpdatedAt", currentLatest ? formatDateTime(currentLatest) : "-");
  const compareButton = document.getElementById("compareCostSnapshotButton");
  const comparePanel = document.getElementById("costComparisonPanel");
  const status = document.getElementById("costCompareStatus");
  if (comparePanel) {
    comparePanel.hidden = true;
    comparePanel.innerHTML = "";
  }
  if (status) status.textContent = "";
  if (!estimate) {
    setText("costSnapshotStatus", "-");
    if (compareButton) compareButton.disabled = true;
    return;
  }
  if (!snapshot?.items?.length) {
    setText("costSnapshotStatus", "저장 원가 기준 없음");
    if (compareButton) compareButton.disabled = true;
    return;
  }
  setText("costSnapshotStatus", snapshotChanged ? "저장 이후 변경됨" : "저장 당시와 동일");
  if (compareButton) compareButton.disabled = !hasCurrentItems;
}

function renderAdminProcessTotals(quote) {
  const box = document.getElementById("adminProcessTotals");
  if (!box) return;
  box.innerHTML = quote?.groups?.length
    ? quote.groups.map((group) => `
      <div>
        <span>${group.label}</span>
        <strong>${group.totalText}</strong>
      </div>
    `).join("")
    : "<div><span>공정별 합계</span><strong>없음</strong></div>";
}

function renderStandardCheck(state) {
  const checks = [
    ["욕실", state.bathroomEnabled || state.bathroomUnits > 0],
    ["주방 부속/기기", state.kitchenEnabled || state.kitchenSinkBowlUnits + state.kitchenFaucetUnits + state.kitchenHoodUnits > 0 || state.kitchenCustomAppliancePrice > 0 || state.kitchenStandardInstallEnabled],
    ["일반 폐기물", state.generalWasteEnabled],
    ["세대 내 보양", state.interiorProtectionEnabled],
    ["입주청소", state.moveInCleaningEnabled],
    ["기존 배관 청소", state.existingPipeCleaningEnabled],
    ["중문", state.middleDoorUnits > 0],
    ["일반도어", state.standardDoorUnits > 0],
    ["슬라이딩도어", state.slidingDoorUnits > 0],
    ["도배", state.wallpaperEnabled],
    ["필름", state.filmEnabled],
    ["바닥", state.flooringEnabled || state.flooringArea > 0],
    ["마감", state.siliconeEnabled || state.elasticEnabled || state.elasticExtraRooms > 0],
    ["도어/창호", state.middleDoorUnits > 0 || state.standardDoorUnits > 0 || state.slidingDoorUnits > 0 || state.windowNoticeEnabled],
  ];
  const selected = checks.filter(([, enabled]) => enabled).map(([label]) => label);
  const unselected = checks.filter(([, enabled]) => !enabled).map(([label]) => label);
  const separate = state.windowNoticeEnabled ? ["창호: 별도 실측 후 견적"] : [];
  const renderList = (id, items) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = items.length
      ? items.map((item) => `<li>${item}</li>`).join("")
      : "<li>없음</li>";
  };
  renderList("standardSelectedItems", selected);
  renderList("standardUnselectedItems", unselected);
  renderList("standardSeparateItems", separate);
  renderList("adminStandardSelectedItems", selected);
  renderList("adminStandardUnselectedItems", unselected);
  renderList("adminStandardSeparateItems", separate);
}

function hasAdminMarginTargets() {
  return Boolean(document.getElementById("adminQuoteRows") && document.getElementById("adminQuoteGroupTotals"));
}

function hasInternalRowTargets() {
  return Boolean(document.getElementById("internalDetailRows") || document.getElementById("adminInternalDetailRows"));
}

function hasPurchaseOrderTargets() {
  return Boolean(document.getElementById("purchaseOrderRows") && document.getElementById("purchaseOrderSummary"));
}

function hasCostComparisonTarget() { return Boolean(document.getElementById("costComparisonPanel")); }

function renderCostSnapshotComparison(model) {
  const panel = document.getElementById("costComparisonPanel");
  const status = document.getElementById("costCompareStatus");
  if (!model || !panel) {
    if (status) status.textContent = "원가 스냅샷이 없어 비교할 수 없습니다.";
    return;
  }
  const { rows, savedDirectCost, currentDirectCost, directDiff } = model;
  panel.hidden = false;
  panel.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>항목명</th>
          <th>저장 당시 단가</th>
          <th>현재 단가</th>
          <th>증감액</th>
          <th>증감률</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((item) => `
          <tr>
            <td>${item.itemName}</td>
            <td>${won(item.savedPrice)}</td>
            <td>${won(item.costPrice)}</td>
            <td>${won(item.diff)}</td>
            <td>${(item.diffRate * 100).toFixed(1)}%</td>
          </tr>
        `).join("") : `<tr><td colspan="5">현재 원가와 저장 당시 원가가 동일합니다.</td></tr>`}
      </tbody>
    </table>
    <div class="quote-total-list">
      <div><span>저장 당시 직접원가</span><strong>${won(savedDirectCost)}</strong></div>
      <div><span>현재 원가 적용 예상 직접원가</span><strong>${won(currentDirectCost)}</strong></div>
      <div><span>예상 증감액</span><strong>${won(directDiff)}</strong></div>
    </div>
  `;
  if (status) status.textContent = "비교 완료";
}

function renderPurchaseOrder(items) {
  const rows = document.getElementById("purchaseOrderRows");
  const summary = document.getElementById("purchaseOrderSummary");
  if (!rows || !summary) return;
  rows.innerHTML = items.length
    ? items.map((item) => `
      <tr>
        <td>${item.process}</td>
        <td>${item.item}</td>
        <td>${item.spec}</td>
        <td>${item.quantity}</td>
        <td>${won(item.budget)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">발주 필요 품목이 없습니다.</td></tr>`;
  summary.innerHTML = `
    <div><span>발주 품목</span><strong>${items.length}개</strong></div>
    <div><span>예상 원가</span><strong>${won(items.reduce((sum, item) => sum + item.budget, 0))}</strong></div>
  `;
}

function renderCustomerQuote(estimate) {
  const quote = estimate?.customerQuote;
  const rows = document.getElementById("quoteRows");
  const groupTotals = document.getElementById("quoteGroupTotals");
  if (!quote) {
    setText("quoteProject", "저장된 견적이 없습니다");
    setText("quoteArea", "-");
    setText("quoteDate", "-");
    setText("quoteTotal", "0원");
    renderCustomerQuoteTable(null, rows, groupTotals);
    return;
  }
  setText("quoteProject", quote.projectName);
  setText("quoteArea", `${quote.areaPyeong}평`);
  setText("quoteDate", formatDateTime(quote.savedAt));
  setText("quoteTotal", quote.totalText);
  renderCustomerQuoteTable(quote, rows, groupTotals);
}

function renderInputSummary(model) {
  for (const [id, text] of Object.entries(model.inputSummary)) setText(id, text);
  setText("clientTotal", customerWon(model.displayRevenue));
}

function renderCalculatedInternalSummary(model) {
  const { displayCost, displayRevenue, displayProfit, displayMarginRate, discountRoom, marginStatus } = model;
  setText("internalCost", won(displayCost));
  setText("internalRevenue", customerWon(displayRevenue));
  setText("internalProfit", won(displayProfit));
  setText("internalMargin", `${displayMarginRate.toFixed(1)}%`);
  setText("discountRoom", customerWon(discountRoom));
  setText("marginStatus", marginStatus);
  setText("adminInternalCost", won(displayCost));
  setText("adminInternalRevenue", customerWon(displayRevenue));
  setText("adminInternalProfit", won(displayProfit));
  setText("adminInternalMargin", `${displayMarginRate.toFixed(1)}%`);
  setText("adminDiscountRoom", customerWon(discountRoom));
  setText("adminMarginStatus", marginStatus);
}

return { renderQuoteRows, renderInternalRows, renderWarnings, renderAdminEstimateDetailPanel, renderAdminMarginTable, renderStoredInternalSummary, renderCostSnapshotInfo, renderAdminProcessTotals, renderStandardCheck, renderPurchaseOrder, renderCustomerQuote, renderInputSummary, renderCalculatedInternalSummary, hasAdminMarginTargets, hasInternalRowTargets, hasPurchaseOrderTargets, hasCostComparisonTarget, renderCostSnapshotComparison };
}
