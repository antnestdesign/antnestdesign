import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "espree";
import { JSDOM } from "jsdom";
import { escapeHtml } from "../../../public/os-app/src/utils.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { accountUsers, auditRows } from "../fixtures/shell-account-audit-cases.js";

const html = readFileSync(new URL("../../../public/os-app/index.html", import.meta.url), "utf8");
const functionMaps = new Map();
export function functionSource(source, name) {
  if (!functionMaps.has(source)) {
    const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
    functionMaps.set(source, new Map(ast.body.filter(node => node.type === "FunctionDeclaration").map(node => [node.id.name, source.slice(...node.range).replaceAll("\r\n", "\n")])));
  }
  return functionMaps.get(source).get(name) || null;
}

export async function shellAccountAuditRuntime(golden, entry, original = false) {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const trace = [];
  const state = { users: entry.state === "empty" ? [] : accountUsers(), logs: entry.state === "empty" ? [] : auditRows() };
  const role = entry.role || "admin";
  const context = vm.createContext({ document, window: dom.window, Node: dom.window.Node, escapeHtml, Date,
    osUsers: state.users, osUsersLoaded: !["loading", "error"].includes(entry.state), osUserActionBusy: entry.state?.startsWith("busy"),
    editingUserId: entry.state?.includes("edit") ? (entry.state.startsWith("missing") ? "missing" : "synthetic-manager") : null,
    resettingUserId: entry.state?.includes("reset") ? (entry.state.startsWith("missing") ? "missing" : "synthetic-staff") : null,
    osAuditLogs: state.logs, osAuditLogsLoaded: !["loading", "error"].includes(entry.state),
    currentProfile: { email: `${role}@example.invalid`, role }, staffAdminShellApplied: false,
    canManageUsers: () => role === "admin", isAdmin: () => role === "admin", isManager: () => role === "manager", isStaff: () => role === "staff",
    getAuthSession: () => entry.session ? { synthetic: true } : null,
    removeSystemManagementShell: () => { trace.push("remove-system"); document.getElementById("system")?.remove(); },
    removePrivilegedManagementShell: () => { trace.push("remove-privileged"); document.getElementById("userManagementCard")?.remove(); document.getElementById("auditLogCard")?.remove(); },
    ensureSystemManagementShell: () => trace.push("ensure-system"), ensureContractPackagePanel: () => trace.push("ensure-contract"),
    submitOwnPasswordChange: () => trace.push("change-password"), leavePasswordChangeFlow: async () => trace.push("leave-password"),
    setText: (id, value) => { const node = document.getElementById(id); if (node) node.textContent = value; },
    formatDateTime: value => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)),
  });
  const restore = createEstimateRestore({ document, elements: Object.fromEntries(golden.ids.map(id => [id, document.getElementById(id)])), excludedInputById: {} });
  for (const name of ["ensureEstimateStatusControl", "ensureSaveButtons", "ensureAdminStandardCheckLists", "ensureCostSnapshotPanel"]) context[name] = () => restore[name]();
  const system = document.createElement("section"); system.id = "system";
  system.innerHTML = '<section class="system-log-card"></section>';
  document.getElementById("admin").after(system);
  if (!original) {
    const { createAccountView, roleLabel } = await import("../../../public/os-app/src/account-view.js");
    const { createAuditView } = await import("../../../public/os-app/src/audit-view.js");
    const { createUiShell } = await import("../../../public/os-app/src/ui-shell.js");
    Object.assign(context, { createAccountView, roleLabel, createAuditView, createUiShell });
  }
  const current = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
  const scripts = original ? Object.values(golden.sources) : [...Object.keys(golden.sources), "currentAccountView", "currentAuditView", "handlePasswordChangeLogout"].map(name => functionSource(current, name)).filter(Boolean);
  if (!original) scripts.push(`const uiShell = createUiShell({ document, Node, ensureEstimateStatusControl, ensureSaveButtons, ensureAdminStandardCheckLists, ensureCostSnapshotPanel });`);
  const exposed = Object.keys(golden.sources).filter(name => original || functionSource(current, name));
  vm.runInContext(scripts.join("\n") + `\nglobalThis.runtime = { ${original ? "" : "...uiShell, ...currentAccountView(), ...currentAuditView(),"} ${exposed.join(",")} };`, context);
  return { dom, document, context, trace, state, runtime: context.runtime };
}

export function exerciseShellAccountAudit(evidence, entry) {
  const { document, runtime: r, context, trace } = evidence;
  if (entry.kind === "account") {
    r.ensureUserManagementShell(); r.renderUserManagement();
    if (entry.state === "error") r.setUserManagementStatus("합성 조회 실패", "error");
    if (entry.state === "cancel") { context.editingUserId = "synthetic-manager"; r.renderUserManagement(); context.editingUserId = null; r.renderUserManagement(); }
  }
  if (entry.kind === "audit") {
    r.ensureUserManagementShell(); r.ensureAuditLogShell();
    if (entry.state === "error") r.setAuditLogStatus("합성 감사 조회 실패", "error");
  }
  if (entry.kind === "navigation") { for (const tab of ["client", "quote", "admin", entry.tab]) r.activateTab(tab); }
  if (entry.kind === "shell") { r.activateTab("internal"); r.applyAccessControl(); r.applyAccessControl(); }
  if (entry.kind === "password") { r.bindPasswordChangeShell(); r.setPasswordChangeRequired(entry.required); document.getElementById("newOwnPassword").value = "synthetic"; r.clearPasswordChangeInputs(); }
  if (entry.kind === "labels") { r.repairStaticKoreanLabels(); r.removeDuplicateManagementCriteriaBlock(); r.removeLegacyAdminEstimatePanels(); }
  if (entry.kind === "authenticated") { r.ensurePasswordChangeShell(); r.setAuthenticated(entry.authenticated); }
  if (entry.kind === "missing") { document.getElementById("admin").remove(); document.getElementById("system").remove(); r.ensureUserManagementShell(); r.ensureAuditLogShell(); r.renderUserManagement(); r.renderAuditLogRows(); r.activateTab("missing"); }
  const ids = entry.kind === "labels" ? ["appShell"] : ["userManagementCard", "auditLogCard", "passwordChangeScreen", "admin", "currentUserLabel"];
  return {
    dom: Object.fromEntries(ids.map(id => [id, document.getElementById(id)?.outerHTML || null])),
    tabs: [...document.querySelectorAll(".tab-button, .tab-panel")].map(node => ({ id: node.id, tab: node.dataset.tab, className: node.className })),
    controls: [...document.querySelectorAll("#userManagementCard input, #userManagementCard select, #userManagementCard button, #passwordChangeScreen input")].map(node => ({ id: node.id, value: node.value, disabled: node.disabled, hidden: node.hidden, checked: Boolean(node.checked) })),
    locked: document.getElementById("appShell").className, loginHidden: document.getElementById("loginScreen").hidden,
    role: document.body.dataset.role, staffApplied: context.staffAdminShellApplied, trace: [...trace],
  };
}
