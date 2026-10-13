import { won, escapeHtml } from "./utils.js";

export function createContractView({ document, model, permissions, selectedEstimate, formatDateTime }) {
  const { contractPreviewState, contractPackagesState, allContractPackagesState, contractSelectedDocumentType, contractDocumentLabel, contractPackageSummary } = model;
  const canViewContractPackage = () => permissions.view;
  const canEditContractPackageOptions = () => permissions.edit;
  const canCreateContractPackage = () => permissions.create;
  const isStaff = () => permissions.staff;
  const selectedContractEstimate = () => selectedEstimate;
function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function ensureContractPackagePanel() {
  if (!canViewContractPackage()) return;
  const adminPanel = document.getElementById("admin");
  const savedList = document.getElementById("savedEstimateRows")?.closest(".internal-card");
  if (!adminPanel || !savedList || document.getElementById("contractPackagePanel")) return;
  const section = document.createElement("section");
  section.id = "contractPackagePanel";
  section.className = "internal-card contract-package-card";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>계약 패키지</h2>
      <p>저장 견적을 기준으로 계약서, 견적서, 공사사양서 미리보기를 생성합니다.</p>
    </div>
    <div id="contractPackageEmpty" class="contract-empty">
      저장된 견적을 열면 계약 기본정보와 계약 옵션을 입력할 수 있습니다.
    </div>
    <section id="contractPackageListPanel" class="contract-panel" hidden>
      <div class="contract-panel-heading">
        <h3>저장된 계약 목록</h3>
        <p>계약번호, 프로젝트명, 고객명, 연락처, 주소로 검색하고 저장된 문서를 다시 출력합니다.</p>
      </div>
      <div class="contract-list-search">
        <input id="contractPackageSearchInput" type="search" placeholder="계약번호, 프로젝트명, 고객명, 연락처, 주소 검색">
        <button id="contractPackageSearchButton" type="button">검색</button>
      </div>
      <div class="table-wrap">
        <table class="contract-package-table contract-package-search-table">
          <thead>
            <tr>
              <th>계약번호</th><th>프로젝트</th><th>고객</th><th>연락처</th><th>현장 주소</th>
              <th>계약일</th><th>계약금액</th><th>공사 유형</th><th>상태</th><th>수정일</th><th>작업</th>
            </tr>
          </thead>
          <tbody id="allContractPackageRows"></tbody>
        </table>
      </div>
    </section>
    <div id="contractPackageWorkspace" hidden>
      <div class="contract-package-toolbar">
        <div>
          <strong id="contractEstimateTitle">-</strong>
          <span id="contractEstimateMeta">-</span>
        </div>
        <span id="contractPackageStatus" class="status-text"></span>
      </div>
      <form id="contractOptionsForm" class="contract-options-form">
        <section class="contract-panel">
          <div class="contract-panel-heading">
            <h3>기본정보</h3>
            <p>현장 주소와 평형은 기존 저장 견적에서 읽어옵니다.</p>
          </div>
          <div class="contract-form-grid">
            <label>계약번호<input id="contractNo" type="text" readonly placeholder="자동 생성"></label>
            <label>계약일<input id="contractDate" data-contract-field="contract_date" type="date"></label>
            <label>공사 유형<input id="constructionType" data-contract-field="construction_type" type="text" maxlength="80" placeholder="예: 주거 인테리어"></label>
            <label>공사현장 주소<input id="contractSiteAddress" type="text" readonly></label>
            <label>평형<input id="contractAreaPyeong" type="text" readonly></label>
            <label>면적(㎡)<input id="contractAreaM2" type="text" readonly></label>
            <label>착공일<input id="contractStartDate" data-contract-field="start_date" type="date"></label>
            <label>준공예정일<input id="contractCompletionDate" data-contract-field="planned_completion_date" type="date"></label>
          </div>
        </section>
        <section class="contract-panel">
          <div class="contract-panel-heading">
            <h3>고객정보</h3>
            <p>고객명과 연락처는 저장 견적에서 읽고, 계약용 주소와 이메일만 별도로 저장합니다.</p>
          </div>
          <div class="contract-form-grid">
            <label>고객명<input id="contractCustomerName" type="text" readonly></label>
            <label>연락처<input id="contractCustomerPhone" type="text" readonly></label>
            <label>고객 주소<input id="customerAddress" data-contract-field="customer_address" type="text" maxlength="200"></label>
            <label>이메일<input id="customerEmail" data-contract-field="customer_email" type="email" maxlength="120"></label>
          </div>
        </section>
        <section class="contract-panel">
          <div class="contract-panel-heading">
            <h3>공사담당자</h3>
            <p>이번 단계에서는 직접 입력한 담당자 정보가 문서 미리보기에 연동됩니다.</p>
          </div>
          <div class="contract-form-grid">
            <label>성명<input id="siteManagerName" data-contract-field="site_manager_name" type="text" maxlength="80"></label>
            <label>직책<input id="siteManagerTitle" data-contract-field="site_manager_title" type="text" maxlength="80"></label>
            <label>연락처<input id="siteManagerPhone" data-contract-field="site_manager_phone" type="tel" maxlength="30"></label>
          </div>
        </section>
        <section class="contract-panel">
          <div class="contract-panel-heading">
            <h3>계약 옵션</h3>
            <p>체크 여부는 계약 조건과 제외사항 판단에 사용됩니다.</p>
          </div>
          <div class="contract-check-grid">
            <label><input id="residentConsentIncluded" data-contract-check="resident_consent_included" type="checkbox">관리사무소 신고·입주민 동의 포함</label>
            <label><input id="permitFilingIncluded" data-contract-check="permit_filing_included" type="checkbox">인허가 신고 포함</label>
            <label><input id="existingFinishProtectionIncluded" data-contract-check="existing_finish_protection_included" type="checkbox">마감재 보양 포함</label>
          </div>
        </section>
        <div id="contractWriteActions" class="admin-action-row contract-actions">
          <button id="saveContractOptionsButton" type="button">계약 옵션 저장</button>
          <button id="createContractPackageButton" type="button">계약 확정 및 저장</button>
          <button id="previewContractPackageButton" type="button">3종 문서 미리보기</button>
        </div>
        <p id="contractReadonlyNote" class="system-readonly-note" hidden><span>매니저는 계약 정보를 조회만 할 수 있습니다.</span></p>
      </form>
      <section class="contract-panel">
        <div class="contract-panel-heading">
          <h3>품목별 공사사양</h3>
          <p>견적 포함 품목에 연결된 표준사양만 미리보기에 표시됩니다.</p>
        </div>
        <div id="contractSpecSnapshot" class="contract-spec-list">미리보기를 생성하면 품목별 공사사양이 표시됩니다.</div>
      </section>
      <section class="contract-panel">
        <div class="contract-panel-heading">
          <h3>3종 문서 미리보기</h3>
          <p>이번 단계에서는 DOCX/PDF 대신 JSON 스냅샷을 읽기 쉬운 형태로 표시합니다.</p>
        </div>
        <div class="contract-document-tabs">
          <button type="button" data-contract-doc="CONTRACT" class="active">계약서</button>
          <button type="button" data-contract-doc="QUOTE">견적서</button>
          <button type="button" data-contract-doc="SPEC">공사사양서</button>
        </div>
        <div class="admin-action-row contract-print-actions">
          <button type="button" data-contract-print="CONTRACT">계약서 인쇄/PDF</button>
          <button type="button" data-contract-print="QUOTE">견적서 인쇄/PDF</button>
          <button type="button" data-contract-print="SPEC">공사사양서 인쇄/PDF</button>
          <button type="button" data-contract-print="ALL">3종 일괄 인쇄/PDF</button>
        </div>
        <div id="contractDocumentPreview" class="contract-document-preview">미리보기를 생성해 주세요.</div>
      </section>
    </div>
  `;
  savedList.insertAdjacentElement("afterend", section);
}

function contractStatus(message, type = "") {
  const node = document.getElementById("contractPackageStatus");
  if (!node) return;
  node.textContent = message || "";
  node.dataset.status = type;
}

function setContractField(id, value) {
  const node = document.getElementById(id);
  if (node) node.value = value ?? "";
}

function setContractChecked(id, checked) {
  const node = document.getElementById(id);
  if (node) node.checked = checked === true;
}

function renderContractOptionsForm(estimate) {
  const editable = canEditContractPackageOptions();
  for (const field of model.optionFields(estimate)) {
    if (field.type === "checked") setContractChecked(field.id, field.value);
    else setContractField(field.id, field.value);
  }
  document.querySelectorAll("#contractOptionsForm input, #contractOptionsForm select, #contractOptionsForm textarea").forEach((node) => {
    if (node.readOnly) return;
    node.disabled = !editable;
  });
  const actions = document.getElementById("contractWriteActions");
  if (actions) actions.hidden = !editable;
  const createButton = document.getElementById("createContractPackageButton");
  if (createButton) createButton.hidden = !canCreateContractPackage();
  const readonly = document.getElementById("contractReadonlyNote");
  if (readonly) readonly.hidden = editable;
}

function renderContractPackages() {
  const tbody = document.getElementById("contractPackageRows");
  if (!tbody) return;
  tbody.innerHTML = contractPackagesState.length
    ? contractPackagesState.map((item) => `
      <tr>
        <td>${escapeHtml(item.contract_no || "-")}</td>
        <td>${escapeHtml(item.package_version || "-")}</td>
        <td>${escapeHtml(item.status || "-")}</td>
        <td>${formatDateTime(item.created_at)}</td>
        <td>${Array.isArray(item.contract_document_versions) ? item.contract_document_versions.length : 0}종</td>
        <td><button type="button" class="small-action" data-contract-package-load="${escapeHtml(item.id)}">불러오기</button></td>
      </tr>
    `).join("")
    : `<tr><td colspan="6">생성된 계약 패키지가 없습니다.</td></tr>`;
}

function renderAllContractPackages() {
  const panel = document.getElementById("contractPackageListPanel");
  const tbody = document.getElementById("allContractPackageRows");
  if (panel) panel.hidden = !canViewContractPackage() || isStaff();
  if (!tbody) return;
  tbody.innerHTML = allContractPackagesState.length
    ? allContractPackagesState.map((item) => {
      const summary = contractPackageSummary(item);
      return `
        <tr>
          <td>${escapeHtml(summary.contractNo)}</td>
          <td>${escapeHtml(summary.projectName)}</td>
          <td>${escapeHtml(summary.customerName)}</td>
          <td>${escapeHtml(summary.customerPhone)}</td>
          <td>${escapeHtml(summary.siteAddress)}</td>
          <td>${escapeHtml(summary.contractDate)}</td>
          <td>${won(Number(summary.totalAmount) || 0)}</td>
          <td>${escapeHtml(summary.constructionType)}</td>
          <td>${escapeHtml(summary.status)}</td>
          <td>${formatDateTime(summary.updatedAt)}</td>
          <td><button type="button" class="small-action" data-contract-package-load="${escapeHtml(item.id)}">불러오기</button></td>
        </tr>
      `;
    }).join("")
    : `<tr><td colspan="11">저장된 계약 패키지가 없습니다.</td></tr>`;
}

function sanitizeContractPreviewValue(key, value) {
  if (isStaff() && /(^id$|_id$|hash|created_by|confirmed_by|source_hash|content_hash|internal|cost|margin)/i.test(key)) {
    return undefined;
  }
  return value;
}

function renderJsonHtml(value, depth = 0, keyName = "") {
  const safe = sanitizeContractPreviewValue(keyName, value);
  if (safe === undefined) return "";
  if (Array.isArray(safe)) {
    if (!safe.length) return `<span class="contract-empty-value">없음</span>`;
    return `<ol class="contract-json-list">${safe.map((item) => `<li>${renderJsonHtml(item, depth + 1, keyName)}</li>`).join("")}</ol>`;
  }
  if (safe && typeof safe === "object") {
    const rows = Object.entries(safe)
      .map(([key, item]) => {
        const rendered = renderJsonHtml(item, depth + 1, key);
        return rendered ? `<div class="contract-json-row"><dt>${escapeHtml(key)}</dt><dd>${rendered}</dd></div>` : "";
      })
      .filter(Boolean)
      .join("");
    return rows ? `<dl class="contract-json-object">${rows}</dl>` : `<span class="contract-empty-value">없음</span>`;
  }
  if (safe == null || safe === "") return `<span class="contract-empty-value">-</span>`;
  if (typeof safe === "number") return escapeHtml(safe.toLocaleString("ko-KR"));
  return escapeHtml(safe);
}

function renderContractSpecSnapshot() {
  const node = document.getElementById("contractSpecSnapshot");
  if (!node) return;
  const specs = Array.isArray(contractPreviewState?.snapshot?.spec_snapshot)
    ? contractPreviewState.snapshot.spec_snapshot
    : [];
  node.innerHTML = specs.length
    ? `<div class="table-wrap"><table class="contract-spec-table"><thead><tr><th>공정</th><th>견적 품목</th><th>표준사양</th><th>제품급</th><th>버전</th></tr></thead><tbody>${specs.map((spec) => `
      <tr>
        <td>${escapeHtml(spec.work_category || "-")}</td>
        <td>${escapeHtml(spec.item_name || "-")}</td>
        <td>${escapeHtml(spec.standard_item_name || "-")}</td>
        <td>${escapeHtml(spec.selected_grade || "-")}</td>
        <td>${escapeHtml(spec.spec_version || "-")}</td>
      </tr>
    `).join("")}</tbody></table></div>`
    : "미리보기를 생성하면 품목별 공사사양이 표시됩니다.";
}

function renderContractDocumentPreview() {
  const node = document.getElementById("contractDocumentPreview");
  if (!node) return;
  const documents = Array.isArray(contractPreviewState?.documents) ? contractPreviewState.documents : [];
  const previewDocument = documents.find((item) => item.document_type === contractSelectedDocumentType);
  if (!previewDocument) {
    node.innerHTML = "미리보기를 생성해 주세요.";
    return;
  }
  node.innerHTML = `
    <div class="contract-document-heading">
      <strong>${contractDocumentLabel(previewDocument.document_type)}</strong>
      <span>${escapeHtml(previewDocument.generation_status || "GENERATED")}</span>
    </div>
    ${renderJsonHtml(previewDocument.content_json || {})}
  `;
}

function renderContractPreview() {
  document.querySelectorAll("[data-contract-doc]").forEach((button) => {
    button.classList.toggle("active", button.dataset.contractDoc === contractSelectedDocumentType);
  });
  renderContractSpecSnapshot();
  renderContractDocumentPreview();
}

function renderContractPackagePanel(estimate = selectedContractEstimate()) {
  ensureContractPackagePanel();
  const empty = document.getElementById("contractPackageEmpty");
  const workspace = document.getElementById("contractPackageWorkspace");
  renderAllContractPackages();
  if (!empty || !workspace) return;
  if (!estimate?.id) {
    empty.hidden = false;
    workspace.hidden = true;
    return;
  }
  empty.hidden = true;
  workspace.hidden = false;
  setText("contractEstimateTitle", estimate.projectName || "저장 견적");
  setText("contractEstimateMeta", `${estimate.clientName || "고객명 없음"} · ${estimate.areaPyeong || "-"}평 · ${estimate.totalText || "-"}`);
  renderContractOptionsForm(estimate);
  renderContractPackages();
  renderContractPreview();
}
return { ensureContractPackagePanel, contractStatus, renderContractOptionsForm, renderContractPackages, renderAllContractPackages, renderContractSpecSnapshot, renderContractDocumentPreview, renderContractPreview, renderContractPackagePanel };
}
