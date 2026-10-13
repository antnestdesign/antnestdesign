import { isEstimateInputExcluded } from "./estimate-input.js";

export function createEstimateRestore({ document, elements: el, excludedInputById }) {
function ensureEstimateStatusControl() {
  if (!document.getElementById("estimateStatus")) {
    const grid = document.querySelector(".project-info-grid");
    if (grid) {
      const label = document.createElement("label");
      label.innerHTML = `
        상태
        <select id="estimateStatus">
          <option value="견적">견적</option>
          <option value="계약">계약</option>
          <option value="착공">착공</option>
          <option value="준공">준공</option>
        </select>
      `;
      grid.appendChild(label);
      el.estimateStatus = label.querySelector("#estimateStatus");
    }
  }
}

function ensureSaveButtons() {
  const updateButton = document.getElementById("saveEstimateButton");
  if (!updateButton) return;
  updateButton.textContent = "견적 수정";
  if (document.getElementById("saveAsNewEstimateButton")) return;
  const newButton = document.createElement("button");
  newButton.id = "saveAsNewEstimateButton";
  newButton.className = "secondary-action";
  newButton.type = "button";
  newButton.textContent = "새 견적으로 저장";
  updateButton.insertAdjacentElement("afterend", newButton);
}

function ensureAdminStandardCheckLists() {
  const separate = document.getElementById("adminStandardSeparateItems");
  const grid = separate?.closest(".standard-check-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div>
      <h3>선택 항목</h3>
      <ul id="adminStandardSelectedItems"></ul>
    </div>
    <div>
      <h3>미선택 항목</h3>
      <ul id="adminStandardUnselectedItems"></ul>
    </div>
    <div>
      <h3>별도 확인</h3>
      <ul id="adminStandardSeparateItems"></ul>
    </div>
  `;
}

function ensureCostSnapshotPanel() {
  const adminPanel = document.getElementById("admin");
  const savedList = document.getElementById("savedEstimateRows")?.closest(".internal-card");
  if (!adminPanel || !savedList || document.getElementById("costSnapshotPanel")) return;
  const section = document.createElement("section");
  section.id = "costSnapshotPanel";
  section.className = "internal-card admin-only";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>원가 기준</h2>
      <p>저장 당시 원가 기준과 현재 원가 상태를 비교합니다.</p>
    </div>
    <dl class="metric-list admin-metric-list">
      <div><dt>원가 적용 기준</dt><dd id="costBasisLabel">저장된 견적 없음</dd></div>
      <div><dt>견적 저장일</dt><dd id="costBasisSavedAt">-</dd></div>
      <div><dt>저장 원가 기준 시각</dt><dd id="costSnapshotCapturedAt">-</dd></div>
      <div><dt>원가 관리 최신 수정일</dt><dd id="costDbLatestUpdatedAt">-</dd></div>
      <div><dt>현재 원가 상태</dt><dd id="costSnapshotStatus">-</dd></div>
    </dl>
    <div class="admin-action-row">
      <button id="compareCostSnapshotButton" type="button" disabled>현재 원가와 비교</button>
      <span id="costCompareStatus" class="status-text"></span>
    </div>
    <div id="costComparisonPanel" class="table-wrap" hidden></div>
  `;
  savedList.insertAdjacentElement("afterend", section);
}

function restoreInputValues(inputs = {}) {
  const hadFractionalTargetMargin = Number(inputs.targetMargin) > 0 && Number(inputs.targetMargin) <= 1;
  const nextInputs = { ...inputs };
  if (!Object.prototype.hasOwnProperty.call(nextInputs, "wallpaperPublicMaterialGrade") && nextInputs.wallpaperMaterialGrade) {
    nextInputs.wallpaperPublicMaterialGrade = nextInputs.wallpaperMaterialGrade;
  }
  if (!Object.prototype.hasOwnProperty.call(nextInputs, "wallpaperPublicWallLengthM") && nextInputs.wallpaperWallLengthM != null) {
    nextInputs.wallpaperPublicWallLengthM = nextInputs.wallpaperWallLengthM;
  }
  if (!Object.prototype.hasOwnProperty.call(nextInputs, "wallpaperRoomMaterialGrade")) {
    nextInputs.wallpaperRoomMaterialGrade = "besti";
  }
  for (const [id, value] of Object.entries(nextInputs)) {
    if (isEstimateInputExcluded(id, excludedInputById)) continue;
    const input = el[id];
    if (!input) continue;
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value;
    }
  }
  if (el.targetMargin && Number(el.targetMargin.value) > 0 && Number(el.targetMargin.value) <= 1) {
    el.targetMargin.value = String(Number(el.targetMargin.value) * 100);
  }
  if (!Object.prototype.hasOwnProperty.call(inputs, "bathroomFixtureGrade") && el.bathroomFixtureGrade) {
    el.bathroomFixtureGrade.value = "standard";
  }
  if (!Object.prototype.hasOwnProperty.call(inputs, "bathroomPlumbingRelocationEnabled") && el.bathroomPlumbingRelocationEnabled) {
    el.bathroomPlumbingRelocationEnabled.checked = Boolean(
      inputs.sectionBathroomEnabled ||
      inputs.bathroomEnabled ||
      Number(inputs.bathroomUnits || 0) > 0
    );
  }
  syncSectionLocks();
  syncBlockLocks();
  return { hadFractionalTargetMargin };
}

function getSectionContentNodes(toggle) {
  const heading = toggle.closest?.(".section-heading");
  const nodes = [];
  let node = heading?.nextElementSibling;
  while (node && !node.classList?.contains("section-heading")) {
    nodes.push(node);
    node = node.nextElementSibling;
  }
  return nodes;
}

function syncSectionLocks() {
  document.querySelectorAll(".section-toggle input[type='checkbox']").forEach((toggle) => {
    for (const node of getSectionContentNodes(toggle)) {
      node.querySelectorAll("input, select, textarea, button").forEach((control) => {
        control.disabled = !toggle.checked;
      });
    }
  });
}

function syncBlockLocks() {
  document.querySelectorAll(".furniture-block > label.check-title input[type='checkbox']").forEach((toggle) => {
    const block = toggle.closest?.(".furniture-block");
    if (!block) return;
    const disabled = toggle.disabled || !toggle.checked;
    block.querySelectorAll("input, select, textarea, button").forEach((control) => {
      if (control === toggle) return;
      control.disabled = disabled;
    });
  });
}

function guardCheckboxLabelClicks() {
  document.querySelectorAll("label.inline-check, label.check-title, label.section-toggle").forEach((label) => {
    label.addEventListener("click", (event) => {
      if (event.target?.matches?.("input[type='checkbox'], input[type='radio']")) return;
      event.preventDefault();
    });
  });
}

function restoreEstimateForm(estimate) {
  restoreInputValues(estimate.inputs);
  el.projectName.value = estimate.projectName || "";
  el.areaPyeong.value = estimate.areaPyeong ?? "";
  el.clientName.value = estimate.clientName || "";
  el.clientPhone.value = estimate.phone || estimate.clientPhone || "";
  if (el.estimateStatus) el.estimateStatus.value = estimate.status || "견적";
}

return { ensureEstimateStatusControl, ensureSaveButtons, ensureAdminStandardCheckLists, ensureCostSnapshotPanel, restoreInputValues, syncSectionLocks, syncBlockLocks, guardCheckboxLabelClicks, restoreEstimateForm };
}
