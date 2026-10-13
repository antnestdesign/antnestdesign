import { won, rateNumber, escapeHtml } from "./utils.js";
import { COST_CALCULATION_BASIS_OPTIONS, COST_ROUNDING_OPTIONS, percentText, draftValue, hasDraft, marginDistribution } from "./cost-view-model.js";

export function createCostView({ document, model, permissions, costItemFilters, expandedSystemCostCategory, systemCostHistory, systemPublishLogs, costItemEditorMode, costItemActionBusy, formatDateTime, onOpenSystem, onRenderSystem }) {
  const { changedCostItems, systemCategories, rowsBySystemFilter, systemTradeSubcategories } = model;
  const canViewSystem = () => permissions.view;
  const canEditCost = () => permissions.edit;
  const canPublishCost = () => permissions.publish;
function ensureSystemManagementShell() {
  if (!canViewSystem()) return;
  const tabs = document.querySelector(".tabs");
  if (tabs && !document.querySelector('[data-tab="system"]')) {
    const button = document.createElement("button");
    button.className = "tab-button system-tab-button";
    button.dataset.tab = "system";
    button.type = "button";
    button.textContent = "시스템 관리";
    tabs.appendChild(button);
    button.addEventListener("click", onOpenSystem);
  }
  if (!document.getElementById("system")) {
    const section = document.createElement("section");
    section.className = "tab-panel system-panel";
    section.id = "system";
    section.innerHTML = `
      <section class="internal-card system-status-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>시스템 현황</h2>
          <p>원가 관리, 변경 예정값, 배포, 견적 저장 상태를 확인합니다.</p>
        </div>
        <dl class="metric-list system-metric-list" id="systemStatusMetrics"></dl>
      </section>
      <section class="internal-card system-cost-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>원가 관리</h2>
          <p>운영값과 변경 예정값을 분리해 확인합니다.</p>
        </div>
        <div id="systemBulkMarginPanel" class="system-operation-panel"></div>
        <div id="systemCostItemTools" class="system-operation-panel"></div>
        <div id="systemCostItemEditor" class="system-operation-panel" hidden></div>
        <div id="systemCostAccordion" class="system-cost-accordion"></div>
      </section>
      <section class="internal-card system-publish-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>배포 준비</h2>
          <p>변경 예정 품목을 확인한 뒤 관리자만 배포할 수 있습니다.</p>
        </div>
        <div id="systemPublishSummary" class="system-publish-summary"></div>
        <div id="systemCategoryCancelPanel" class="system-operation-panel"></div>
        <div class="table-wrap"><table><thead><tr><th>품목</th><th>운영값</th><th>변경 예정값</th><th>차이</th><th class="admin-system-only">취소</th></tr></thead><tbody id="systemDraftRows"></tbody></table></div>
        <div id="systemPublishActions" class="admin-action-row system-publish-actions"></div>
        <p id="systemStatusText" class="status-text"></p>
      </section>
      <section class="internal-card system-history-card">
        <div class="section-heading compact-heading no-side-padding"><h2>변경 이력</h2><p>배포 단위 품목 변경 내역입니다.</p></div>
        <div class="table-wrap"><table><thead><tr><th>버전</th><th>품목</th><th>이전 값</th><th>변경 값</th><th>활성 변경</th><th>사유</th><th>변경자</th><th>변경일</th></tr></thead><tbody id="systemHistoryRows"></tbody></table></div>
      </section>
      <section class="internal-card system-log-card">
        <div class="section-heading compact-heading no-side-padding"><h2>배포 기록</h2><p>배포 단위 이력입니다.</p></div>
        <div id="systemRollbackPanel" class="system-operation-panel"></div>
        <div class="table-wrap"><table><thead><tr><th>버전</th><th>변경 품목 수</th><th>사유</th><th>배포자</th><th>배포일시</th><th class="admin-system-only">원복</th></tr></thead><tbody id="systemPublishLogRows"></tbody></table></div>
      </section>
    `;
    document.querySelector(".tab-panel#admin")?.insertAdjacentElement("afterend", section);
  }
  onRenderSystem();
}

function removeSystemManagementShell() {
  document.querySelector('[data-tab="system"]')?.remove();
  document.getElementById("system")?.remove();
}

function setSystemStatus(message) {
  const node = document.getElementById("systemStatusText");
  if (node) node.textContent = message;
}

function renderSystemStatus() {
  const box = document.getElementById("systemStatusMetrics");
  if (!box) return;
  const metrics = model.metrics();
  box.innerHTML = metrics.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function renderBulkMarginPanel() {
  const panel = document.getElementById("systemBulkMarginPanel");
  if (!panel) return;
  const categories = systemCategories();
  const activeRows = rowsBySystemFilter({ activeMode: "active" });
  if (!canEditCost()) {
    panel.innerHTML = `
      <div class="system-readonly-note">
        <strong>마진 일괄 변경</strong>
        <span>매니저는 원가와 변경 예정값을 조회만 할 수 있습니다.</span>
      </div>`;
    return;
  }
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>마진 일괄 변경</h3>
      <p>운영값은 즉시 바뀌지 않고 변경 예정 마진율만 생성됩니다.</p>
    </div>
    <div class="system-bulk-grid">
      <label>적용 범위
        <select id="bulkMarginScope">
          <option value="all">전체 품목</option>
          <option value="category">공정별</option>
        </select>
      </label>
      <label>공정
        <select id="bulkMarginCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>대상 상태
        <select id="bulkMarginActiveMode">
          <option value="active" selected>활성 품목만</option>
          <option value="all">전체 품목</option>
        </select>
      </label>
      <label>변경 마진율(%)
        <input id="bulkMarginRate" type="number" min="0" max="99" step="0.1" value="30">
      </label>
      <label>기존 변경 예정값
        <select id="bulkMarginDraftPolicy">
          <option value="keep" selected>유지</option>
          <option value="overwrite">덮어쓰기</option>
        </select>
      </label>
      <button type="button" data-system-action="bulk-margin-preview">대상 확인</button>
      <button type="button" data-system-action="bulk-margin-apply">변경 예정값으로 일괄 적용</button>
    </div>
    <p id="bulkMarginPreview" class="status-text">
      기본 대상: 활성 품목 ${activeRows.length}개 / 현재 마진율 분포 ${marginDistribution(activeRows)}
    </p>`;
}

function renderCategoryCancelPanel() {
  const panel = document.getElementById("systemCategoryCancelPanel");
  if (!panel) return;
  if (!canEditCost()) {
    panel.innerHTML = "";
    return;
  }
  const categories = systemCategories();
  panel.innerHTML = `
    <div class="system-category-cancel">
      <label>공정별 임시저장 취소
        <select id="cancelDraftCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <button type="button" data-system-action="cancel-category-drafts">선택 공정 임시저장 취소</button>
    </div>`;
}

function renderCostItemTools() {
  const panel = document.getElementById("systemCostItemTools");
  if (!panel) return;
  const subcategories = systemTradeSubcategories(expandedSystemCostCategory);
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>품목 검색·필터</h3>
      <p>품목 수가 늘어나도 코드, 이름, 분류, 상태로 빠르게 찾습니다.</p>
    </div>
    <div class="system-bulk-grid cost-item-filter-grid">
      <label>검색
        <input id="costItemSearch" type="search" value="${escapeHtml(costItemFilters.keyword)}" placeholder="품목명 또는 코드">
      </label>
      <label>중분류
        <select id="costItemSubcategoryFilter">
          <option value="">전체</option>
          ${subcategories.map((item) => `<option value="${escapeHtml(item)}" ${costItemFilters.subcategory === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>활성 상태
        <select id="costItemActiveFilter">
          <option value="all" ${costItemFilters.active === "all" ? "selected" : ""}>전체</option>
          <option value="active" ${costItemFilters.active === "active" ? "selected" : ""}>활성</option>
          <option value="inactive" ${costItemFilters.active === "inactive" ? "selected" : ""}>비활성</option>
        </select>
      </label>
      <label>운영 상태
        <select id="costItemStateFilter">
          <option value="all" ${costItemFilters.state === "all" ? "selected" : ""}>전체</option>
          <option value="draft" ${costItemFilters.state === "draft" ? "selected" : ""}>변경 예정</option>
          <option value="pending" ${costItemFilters.state === "pending" ? "selected" : ""}>신규 배포 대기</option>
          <option value="published" ${costItemFilters.state === "published" ? "selected" : ""}>운영 품목</option>
        </select>
      </label>
      <label>정렬
        <select id="costItemSortFilter">
          <option value="sort" ${costItemFilters.sort === "sort" ? "selected" : ""}>정렬 순서</option>
          <option value="updated" ${costItemFilters.sort === "updated" ? "selected" : ""}>최근 수정순</option>
        </select>
      </label>
      ${canEditCost() ? `<button type="button" data-system-action="cost-item-create-open">+ 품목 추가</button>` : ""}
    </div>`;
}

function renderCostItemEditor() {
  const panel = document.getElementById("systemCostItemEditor");
  if (!panel) return;
  if (!canEditCost() || !costItemEditorMode) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  const { isEdit, isClone, defaults, categories, subcategories } = model.editor();
  panel.hidden = false;
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>${isEdit ? "신규 품목 수정" : isClone ? "품목 복제" : "품목 추가"}</h3>
      <p>신규 품목은 배포 전까지 운영 견적 계산에 사용되지 않습니다.</p>
    </div>
    <form id="costItemForm" class="cost-item-form">
      <div class="cost-item-form-grid">
        <label>품목 코드
          <input id="costItemCode" type="text" value="${escapeHtml(defaults.item_code)}" ${isEdit ? "readonly" : ""} placeholder="SYSTEM_TEST_MATERIAL_ITEM">
        </label>
        <label>품목명
          <input id="costItemName" type="text" value="${escapeHtml(defaults.item_name)}">
        </label>
        <label>대분류
          <select id="costItemCategory">
            ${categories.map((item) => `<option value="${escapeHtml(item)}" ${defaults.category === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label>중분류
          <select id="costItemSubcategory">
            ${subcategories.map((item) => `<option value="${escapeHtml(item)}" ${defaults.subcategory === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label>단위
          <input id="costItemUnit" type="text" value="${escapeHtml(defaults.unit)}">
        </label>
        <label>계산 기준
          <select id="costItemCalculationBasis">
            ${COST_CALCULATION_BASIS_OPTIONS.map(([value, label]) => `<option value="${escapeHtml(value)}" ${defaults.calculation_basis === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
        <label>기본 원가
          <input id="costItemCostPrice" type="number" min="0" step="1000" value="${defaults.cost_price}">
        </label>
        <label>기본 마진율(%)
          <input id="costItemMarginRate" type="number" min="0" max="99" step="0.1" value="${(rateNumber(defaults.default_margin_rate) * 100).toFixed(1)}">
        </label>
        <label>활성 상태
          <select id="costItemActive">
            <option value="true" ${defaults.is_active ? "selected" : ""}>활성</option>
            <option value="false" ${!defaults.is_active ? "selected" : ""}>비활성</option>
          </select>
        </label>
        <label>정렬 순서
          <input id="costItemSortOrder" type="number" min="0" step="1" value="${defaults.sort_order}">
        </label>
        <label>계산 배수
          <input id="costItemMultiplier" type="number" min="0" step="0.01" value="${defaults.calculation_multiplier}">
        </label>
        <label>최소 수량
          <input id="costItemMinQuantity" type="number" min="0" step="0.01" value="${defaults.min_quantity}">
        </label>
        <label>수량 올림 방식
          <select id="costItemRounding">
            ${COST_ROUNDING_OPTIONS.map(([value, label]) => `<option value="${value}" ${defaults.rounding_method === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>고객 표시명
          <input id="costItemCustomerName" type="text" value="${escapeHtml(defaults.customer_name)}">
        </label>
        <label>내부 설명
          <input id="costItemMemo" type="text" value="${escapeHtml(defaults.memo)}">
        </label>
        <label>발주 표시명
          <input id="costItemOrderName" type="text" value="${escapeHtml(defaults.order_name)}">
        </label>
      </div>
      <div class="cost-item-checks">
        <label class="inline-check"><input id="costItemCustomerQuote" type="checkbox" ${defaults.include_in_customer_quote ? "checked" : ""}><span>고객 견적 표시</span></label>
        <label class="inline-check"><input id="costItemInternalQuote" type="checkbox" ${defaults.include_in_internal_quote ? "checked" : ""}><span>내부 견적 표시</span></label>
        <label class="inline-check"><input id="costItemOrderSheet" type="checkbox" ${defaults.include_in_order_sheet ? "checked" : ""}><span>발주내역 표시</span></label>
        <label class="inline-check"><input id="costItemMaterial" type="checkbox" ${defaults.is_material ? "checked" : ""}><span>자재</span></label>
        <label class="inline-check"><input id="costItemLabor" type="checkbox" ${defaults.is_labor ? "checked" : ""}><span>인건비</span></label>
        <label class="inline-check"><input id="costItemService" type="checkbox" ${defaults.is_service ? "checked" : ""}><span>기타/서비스</span></label>
      </div>
      <p class="status-text">새 입력 필드가 필요한 품목은 배포 전 “견적 입력 화면 연결 필요” 상태를 확인하세요.</p>
      <div class="admin-action-row">
        <button type="submit" ${costItemActionBusy ? "disabled" : ""}>${isEdit ? "수정 임시저장" : isClone ? "복제 임시저장" : "신규 임시저장"}</button>
        <button type="button" data-system-action="cost-item-editor-close">취소</button>
      </div>
    </form>`;
}

function systemCostRowHtml(row) {
    const dirty = hasDraft(row);
    const draftCost = row.draft_cost_price ?? "";
    const draftMargin = row.draft_margin_rate ?? 0.3;
    const draftActive = draftValue(row, "active");
    const draftCostCell = canEditCost()
      ? `<input class="system-draft-input" data-system-field="cost" data-item-code="${row.item_code}" type="number" step="1000" min="0" value="${draftCost}">`
      : (row.draft_cost_price !== null && row.draft_cost_price !== undefined ? won(row.draft_cost_price) : "-");
    const draftMarginCell = canEditCost()
      ? `<input class="system-draft-input system-margin-input" data-system-field="margin" data-item-code="${row.item_code}" type="number" step="0.1" min="0" max="99" value="${(rateNumber(draftMargin) * 100).toFixed(1)}">`
      : (row.draft_margin_rate !== null && row.draft_margin_rate !== undefined ? percentText(row.draft_margin_rate) : "-");
    const draftActiveCell = canEditCost()
      ? `<select class="system-draft-input" data-system-field="active" data-item-code="${row.item_code}"><option value="true" ${draftActive ? "selected" : ""}>활성</option><option value="false" ${!draftActive ? "selected" : ""}>비활성</option></select>`
      : (draftActive ? "활성" : "비활성");
    const actionCell = canEditCost()
      ? `<button type="button" data-system-action="save-draft" data-item-code="${row.item_code}">임시저장</button>`
      : "";
    const stateLabel = row.is_pending_new ? "신규 배포 대기" : dirty ? "변경 예정" : "운영";
    const managementActions = canEditCost()
      ? `<div class="cost-item-row-actions">
          <button type="button" data-system-action="cost-item-clone-open" data-item-code="${row.item_code}">복제</button>
          ${row.is_pending_new ? `<button type="button" data-system-action="cost-item-edit-open" data-item-code="${row.item_code}">수정</button>` : ""}
          <button type="button" data-system-action="deactivate-draft" data-item-code="${row.item_code}">${row.is_active ? "비활성화 예정" : "재활성화 예정"}</button>
        </div>`
      : "";
    return `
      <tr class="${dirty ? "system-dirty-row" : ""} ${row.is_pending_new ? "system-pending-row" : ""}">
        <td>${escapeHtml(row.item_name || row.itemCode)}</td>
        <td>${escapeHtml(row.subcategory || "-")}</td>
        <td>${escapeHtml(row.unit || "-")}</td>
        <td>${won(row.cost_price)}</td>
        <td>${draftCostCell}</td>
        <td>${percentText(row.default_margin_rate)}</td>
        <td>${draftMarginCell}</td>
        <td class="admin-system-only">${actionCell}</td>
        <td>${row.is_active ? "활성" : "비활성"}</td>
        <td>${draftActiveCell}</td>
        <td>${stateLabel}</td>
        <td>${row.updated_at ? formatDateTime(row.updated_at) : "-"}</td>
        <td class="admin-system-only">${managementActions}</td>
      </tr>`;
}

function renderSystemCostRows(prepared) {
  const panel = document.getElementById("systemCostAccordion");
  if (!panel) return;
  const groups = prepared.groups;
  if (!groups.length) {
    panel.innerHTML = `<div class="system-empty-state">조건에 맞는 원가 품목이 없습니다.</div>`;
    return;
  }
  panel.innerHTML = groups.map(({ tradeLabel, rows, isOpen, meta }) => {
    return `
      <section class="system-cost-group ${isOpen ? "is-open" : ""}">
        <button class="system-cost-group-header" type="button" data-system-cost-category="${escapeHtml(tradeLabel)}" aria-expanded="${isOpen ? "true" : "false"}">
          <span>
            <strong>${escapeHtml(tradeLabel)}</strong>
            <small>${escapeHtml(meta)}</small>
          </span>
          <span class="system-cost-toggle">${isOpen ? "접기" : "펼치기"}</span>
        </button>
        ${isOpen ? `
          <div class="table-wrap system-cost-wrap">
            <table class="system-cost-table">
              <thead><tr>
                <th>품목명</th><th>세부분류</th><th>단위</th><th>운영<br>원가</th><th>변경 예정<br>원가</th><th>운영<br>마진율</th><th>변경 예정<br>마진율(%)</th><th class="admin-system-only">임시<br>저장</th><th>운영<br>상태</th><th>변경 예정<br>상태</th><th>상태</th><th>최근 수정일</th><th class="admin-system-only">작업</th>
              </tr></thead>
              <tbody>${rows.map(systemCostRowHtml).join("")}</tbody>
            </table>
          </div>` : ""}
      </section>`;
  }).join("");
}

function draftChangeText(row) {
  const parts = [];
  if (row.draft_cost_price !== null && row.draft_cost_price !== undefined) parts.push(`단가 ${won(row.cost_price)} → ${won(row.draft_cost_price)}`);
  if (row.draft_margin_rate !== null && row.draft_margin_rate !== undefined) parts.push(`마진 ${percentText(row.default_margin_rate)} → ${percentText(row.draft_margin_rate)}`);
  if (row.draft_is_active !== null && row.draft_is_active !== undefined) parts.push(`활성 ${row.is_active ? "활성" : "비활성"} → ${row.draft_is_active ? "활성" : "비활성"}`);
  return parts.join(" / ") || "-";
}

function renderSystemDraftRows() {
  const tbody = document.getElementById("systemDraftRows");
  const summary = document.getElementById("systemPublishSummary");
  const actions = document.getElementById("systemPublishActions");
  if (!tbody || !summary || !actions) return;
  const rows = changedCostItems();
  summary.innerHTML = `<strong>변경 예정 품목 수: ${rows.length.toLocaleString("ko-KR")}개</strong>`;
  tbody.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.item_name || row.item_code)}</td>
      <td>${won(row.cost_price)} / ${percentText(row.default_margin_rate)} / ${row.is_active ? "활성" : "비활성"}</td>
      <td>${won(draftValue(row, "cost"))} / ${percentText(draftValue(row, "margin"))} / ${draftValue(row, "active") ? "활성" : "비활성"}</td>
      <td>${escapeHtml(draftChangeText(row))}</td>
      <td class="admin-system-only">${canEditCost() ? `<button type="button" data-system-action="cancel-draft" data-item-code="${row.item_code}">임시저장 취소</button>` : ""}</td>
    </tr>
  `).join("") : `<tr><td colspan="5">배포 대기 중인 변경 예정값이 없습니다.</td></tr>`;
  actions.innerHTML = canPublishCost() ? `
    <label class="system-publish-reason">배포 사유<input id="systemPublishReason" type="text" maxlength="500" placeholder="사유를 입력하세요"></label>
    <button type="button" data-system-action="publish" ${rows.length ? "" : "disabled"}>배포</button>
    <button type="button" data-system-action="cancel-all-drafts" ${rows.length ? "" : "disabled"}>전체 임시저장 취소</button>
  ` : "";
}

function renderSystemHistoryRows() {
  const tbody = document.getElementById("systemHistoryRows");
  if (!tbody) return;
  tbody.innerHTML = systemCostHistory.length ? systemCostHistory.map((row) => {
    const item = row.cost_items || {};
    return `<tr>
      <td>${escapeHtml(row.cost_version || "-")}</td>
      <td>${escapeHtml(item.item_name || item.item_code || row.cost_item_id || "-")}</td>
      <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)}</td>
      <td>${won(row.new_cost_price)} / ${percentText(row.new_margin_rate)}</td>
      <td>${row.old_is_active === row.new_is_active ? "-" : `${row.old_is_active ? "활성" : "비활성"} → ${row.new_is_active ? "활성" : "비활성"}`}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
      <td>${escapeHtml(row.changed_by || "-")}</td>
      <td>${row.changed_at ? formatDateTime(row.changed_at) : "-"}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="8">변경 이력이 없습니다.</td></tr>`;
}

function renderSystemPublishLogRows() {
  const tbody = document.getElementById("systemPublishLogRows");
  if (!tbody) return;
  tbody.innerHTML = systemPublishLogs.length ? systemPublishLogs.map((row) => `
    <tr>
      <td>${escapeHtml(row.version || "-")}</td>
      <td>${Number(row.changed_item_count || 0).toLocaleString("ko-KR")}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
      <td>${escapeHtml(row.published_by || "-")}</td>
      <td>${row.published_at ? formatDateTime(row.published_at) : "-"}</td>
      <td class="admin-system-only">${canEditCost() ? `<button type="button" data-system-action="rollback-view" data-version="${escapeHtml(row.version || "")}">변경 내역 보기</button>` : ""}</td>
    </tr>
  `).join("") : `<tr><td colspan="6">배포 기록이 없습니다.</td></tr>`;
}

function renderRollbackPanel(version = "") {
  const panel = document.getElementById("systemRollbackPanel");
  if (!panel) return;
  if (!canEditCost()) {
    panel.innerHTML = "";
    return;
  }
  if (!version) {
    panel.innerHTML = `<p class="status-text">배포 기록에서 변경 내역을 선택하면 원복 예정값을 검토할 수 있습니다.</p>`;
    return;
  }
  const { log, rows, categories, reviewed, conflictCount } = model.rollback(version);
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>원복 검토: ${escapeHtml(version)}</h3>
      <p>이전 값을 새 변경 예정값으로 생성합니다. 운영값은 배포 전까지 바뀌지 않습니다.</p>
    </div>
    <dl class="system-rollback-meta">
      <div><dt>원본 사유</dt><dd>${escapeHtml(log?.reason || "-")}</dd></div>
      <div><dt>원본 배포자</dt><dd>${escapeHtml(log?.published_by || "-")}</dd></div>
      <div><dt>원본 배포일</dt><dd>${log?.published_at ? formatDateTime(log.published_at) : "-"}</dd></div>
      <div><dt>대상 품목</dt><dd>${rows.length}개 / 충돌 ${conflictCount}개</dd></div>
    </dl>
    <div class="system-bulk-grid">
      <label>원복 단위
        <select id="rollbackScope">
          <option value="version">버전 전체</option>
          <option value="category">공정별</option>
          <option value="item">특정 품목</option>
        </select>
      </label>
      <label>공정
        <select id="rollbackCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>품목
        <select id="rollbackItemCode">
          ${reviewed.map(({ item }) => `<option value="${escapeHtml(item.item_code || "")}">${escapeHtml(item.item_name || item.item_code || "-")}</option>`).join("")}
        </select>
      </label>
      <label class="inline-check"><input id="rollbackForceConflicts" type="checkbox"><span>충돌 품목도 변경 예정값 생성</span></label>
      <button type="button" data-system-action="rollback-create" data-version="${escapeHtml(version)}">원복 예정값 생성</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>품목</th><th>원본 변경 전</th><th>원본 변경 후</th><th>현재 운영값</th><th>원복 예정값</th><th>충돌</th></tr></thead><tbody>
      ${reviewed.map(({ row, item, current, conflict }) => `
        <tr class="${conflict ? "system-conflict-row" : ""}">
          <td>${escapeHtml(item.item_name || item.item_code || "-")}</td>
          <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)} / ${row.old_is_active ? "활성" : "비활성"}</td>
          <td>${won(row.new_cost_price)} / ${percentText(row.new_margin_rate)} / ${row.new_is_active ? "활성" : "비활성"}</td>
          <td>${current ? `${won(current.cost_price)} / ${percentText(current.default_margin_rate)} / ${current.is_active ? "활성" : "비활성"}` : "품목 없음"}</td>
          <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)} / ${row.old_is_active ? "활성" : "비활성"}</td>
          <td>${conflict ? "충돌" : "-"}</td>
        </tr>
      `).join("")}
    </tbody></table></div>`;
}

function hasAccordionTarget() { return Boolean(document.getElementById("systemCostAccordion")); }
function applyRolePresentation() { document.getElementById("system")?.classList.toggle("system-readonly", !canEditCost()); }
return { ensureSystemManagementShell, removeSystemManagementShell, setSystemStatus, renderSystemStatus, renderBulkMarginPanel, renderCategoryCancelPanel, renderCostItemTools, renderCostItemEditor, renderSystemCostRows, renderSystemDraftRows, renderSystemHistoryRows, renderSystemPublishLogRows, renderRollbackPanel, hasAccordionTarget, applyRolePresentation };
}
