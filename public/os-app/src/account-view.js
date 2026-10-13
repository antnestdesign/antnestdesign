import { escapeHtml } from "./utils.js";

export function roleLabel(role) {
  return { admin: "관리자", manager: "매니저", staff: "직원" }[role] || "직원";
}

export function createAccountView({ document, osUsers, osUsersLoaded, osUserActionBusy, editingUserId, resettingUserId, canManageUsers, formatDateTime }) {
function passwordStatusLabel(user) {
  return user.must_change_password ? "변경 필요" : "변경 완료";
}

function setUserManagementStatus(message, type = "") {
  const node = document.getElementById("userManagementStatus");
  if (!node) return;
  node.textContent = message || "";
  node.dataset.status = type;
}

function renderUserManagementRows() {
  const tbody = document.getElementById("userManagementRows");
  if (!tbody) return;
  if (!osUsersLoaded) {
    tbody.innerHTML = `<tr><td colspan="8">사용자 목록을 불러오는 중입니다.</td></tr>`;
    return;
  }
  if (!osUsers.length) {
    tbody.innerHTML = `<tr><td colspan="8">등록된 사용자가 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = osUsers.map((user) => `
    <tr>
      <td>${escapeHtml(user.name || "-")}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td>${roleLabel(user.role)}</td>
      <td>${user.is_active ? "활성" : "비활성"}</td>
      <td>${passwordStatusLabel(user)}</td>
      <td>${user.created_at ? formatDateTime(user.created_at) : "-"}</td>
      <td>${user.updated_at ? formatDateTime(user.updated_at) : "-"}</td>
      <td class="user-action-cell">
        <button type="button" data-user-action="edit" data-user-id="${user.id}">수정</button>
        <button type="button" data-user-action="reset-password" data-user-id="${user.id}">초기 비밀번호 재설정</button>
      </td>
    </tr>
  `).join("");
}

function renderUserEditPanel() {
  const panel = document.getElementById("userEditPanel");
  if (!panel) return;
  if (!editingUserId) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  const user = osUsers.find((item) => item.id === editingUserId);
  if (!user) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h3>사용자 수정</h3>
      <p>마지막 활성 관리자는 비활성화하거나 역할을 낮출 수 없고, 본인 계정은 직접 비활성화할 수 없습니다.</p>
    </div>
    <form id="userEditForm" class="user-management-form">
      <label>이름<input id="editUserName" type="text" value="${escapeHtml(user.name || "")}" autocomplete="off"></label>
      <label>역할<select id="editUserRole">
        <option value="admin" ${user.role === "admin" ? "selected" : ""}>관리자</option>
        <option value="manager" ${user.role === "manager" ? "selected" : ""}>매니저</option>
        <option value="staff" ${user.role === "staff" ? "selected" : ""}>직원</option>
      </select></label>
      <label>상태<select id="editUserActive">
        <option value="true" ${user.is_active ? "selected" : ""}>활성</option>
        <option value="false" ${!user.is_active ? "selected" : ""}>비활성</option>
      </select></label>
      <div class="admin-action-row">
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>수정 저장</button>
        <button type="button" data-user-action="cancel-edit">취소</button>
      </div>
    </form>
  `;
}

function renderUserResetPanel() {
  const panel = document.getElementById("userPasswordPanel");
  if (!panel) return;
  if (!resettingUserId) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  const user = osUsers.find((item) => item.id === resettingUserId);
  if (!user) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h3>초기 비밀번호 재설정</h3>
      <p>${escapeHtml(user.name || user.email || "사용자")}의 초기 비밀번호를 재설정합니다. 비밀번호 값은 다시 표시되지 않습니다.</p>
    </div>
    <form id="userPasswordForm" class="user-management-form">
      <label>새 초기 비밀번호<input id="resetUserPassword" type="password" autocomplete="new-password"></label>
      <label>새 초기 비밀번호 확인<input id="resetUserPasswordConfirm" type="password" autocomplete="new-password"></label>
      <div class="admin-action-row">
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>비밀번호 재설정</button>
        <button type="button" data-user-action="cancel-reset">취소</button>
      </div>
    </form>
  `;
}

function renderUserManagement() {
  if (!canManageUsers()) return;
  renderUserManagementRows();
  renderUserEditPanel();
  renderUserResetPanel();
}

function ensureUserManagementShell() {
  if (!canManageUsers()) return;
  const system = document.getElementById("system");
  if (!system || document.getElementById("userManagementCard")) return;
  const section = document.createElement("section");
  section.className = "internal-card user-management-card";
  section.id = "userManagementCard";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>사용자 관리</h2>
      <p>AND OS 사용자를 생성하고 역할과 활성 상태를 관리합니다.</p>
    </div>
    <div class="user-management-layout">
      <form id="userCreateForm" class="user-management-form">
        <h3>사용자 생성</h3>
        <label>이름<input id="newUserName" type="text" autocomplete="off"></label>
        <label>이메일<input id="newUserEmail" type="email" autocomplete="off"></label>
        <label>초기 비밀번호<input id="newUserPassword" type="password" autocomplete="new-password"></label>
        <label>초기 비밀번호 확인<input id="newUserPasswordConfirm" type="password" autocomplete="new-password"></label>
        <label>역할<select id="newUserRole">
          <option value="staff">직원</option>
          <option value="manager">매니저</option>
          <option value="admin">관리자</option>
        </select></label>
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>사용자 생성</button>
      </form>
      <div class="user-management-panels">
        <div id="userEditPanel" class="user-subpanel" hidden></div>
        <div id="userPasswordPanel" class="user-subpanel" hidden></div>
      </div>
    </div>
    <p id="userManagementStatus" class="status-text"></p>
    <div class="table-wrap user-management-table-wrap">
      <table class="user-management-table">
        <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>비밀번호</th><th>생성일</th><th>수정일</th><th>작업</th></tr></thead>
        <tbody id="userManagementRows"></tbody>
      </table>
    </div>
  `;
  document.querySelector(".system-log-card")?.insertAdjacentElement("afterend", section);
  renderUserManagement();
}
return { setUserManagementStatus, renderUserManagementRows, renderUserEditPanel, renderUserResetPanel, renderUserManagement, ensureUserManagementShell };
}
