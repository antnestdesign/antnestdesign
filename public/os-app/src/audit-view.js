import { escapeHtml } from "./utils.js";
import { roleLabel } from "./account-view.js";

export function createAuditView({ document, osAuditLogs, osAuditLogsLoaded, canManageUsers, formatDateTime }) {
function auditActionLabel(action) {
  return {
    USER_CREATED: "사용자 생성",
    USER_NAME_UPDATED: "사용자 이름 변경",
    USER_ROLE_UPDATED: "사용자 역할 변경",
    USER_ACTIVATED: "사용자 활성화",
    USER_DEACTIVATED: "사용자 비활성화",
    INITIAL_PASSWORD_RESET: "초기 비밀번호 재설정",
    PASSWORD_CHANGE_COMPLETED: "최초 비밀번호 변경 완료",
  }[action] || action || "-";
}

function renderAuditLogRows() {
  const tbody = document.getElementById("auditLogRows");
  if (!tbody) return;
  if (!osAuditLogsLoaded) {
    tbody.innerHTML = `<tr><td colspan="7">감사 기록을 불러오는 중입니다.</td></tr>`;
    return;
  }
  if (!osAuditLogs.length) {
    tbody.innerHTML = `<tr><td colspan="7">표시할 감사 기록이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = osAuditLogs.map((row) => `
    <tr>
      <td>${row.created_at ? formatDateTime(row.created_at) : "-"}</td>
      <td>${escapeHtml(row.actor_name || row.actor_email || "-")}</td>
      <td>${row.actor_role ? roleLabel(row.actor_role) : "-"}</td>
      <td>${escapeHtml(auditActionLabel(row.action))}</td>
      <td>${escapeHtml(row.target_label || row.target_id || row.target_type || "-")}</td>
      <td>${escapeHtml(row.result || "-")}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
    </tr>
  `).join("");
}

function ensureAuditLogShell() {
  if (!canManageUsers()) return;
  const system = document.getElementById("system");
  if (!system || document.getElementById("auditLogCard")) return;
  const section = document.createElement("section");
  section.className = "internal-card audit-log-card";
  section.id = "auditLogCard";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>감사 기록</h2>
      <p>중요 작업을 누가 언제 수행했는지 확인합니다.</p>
    </div>
    <div class="control-grid audit-filter-grid">
      <label>작업 유형
        <select id="auditActionFilter">
          <option value="">전체</option>
          <option value="USER_CREATED">사용자 생성</option>
          <option value="USER_NAME_UPDATED">사용자 이름 변경</option>
          <option value="USER_ROLE_UPDATED">사용자 역할 변경</option>
          <option value="USER_ACTIVATED">사용자 활성화</option>
          <option value="USER_DEACTIVATED">사용자 비활성화</option>
          <option value="INITIAL_PASSWORD_RESET">초기 비밀번호 재설정</option>
          <option value="PASSWORD_CHANGE_COMPLETED">최초 비밀번호 변경 완료</option>
        </select>
      </label>
      <label>수행자
        <input id="auditActorFilter" type="search" placeholder="이메일 검색">
      </label>
      <button id="reloadAuditLogsButton" type="button">조회</button>
    </div>
    <p id="auditLogStatus" class="status-text"></p>
    <div class="table-wrap audit-log-table-wrap">
      <table class="audit-log-table">
        <thead><tr><th>일시</th><th>수행자</th><th>역할</th><th>작업</th><th>대상</th><th>결과</th><th>사유</th></tr></thead>
        <tbody id="auditLogRows"></tbody>
      </table>
    </div>
  `;
  document.getElementById("userManagementCard")?.insertAdjacentElement("afterend", section);
  renderAuditLogRows();
}

function setAuditLogStatus(message, type = "") {
  const node = document.getElementById("auditLogStatus");
  if (!node) return;
  node.textContent = message || "";
  node.dataset.status = type;
}
return { renderAuditLogRows, ensureAuditLogShell, setAuditLogStatus };
}
