import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { latestEstimate, testProfile, testSession } from "../fixtures/estimates.js";
import { accountUsers, auditRows } from "../fixtures/shell-account-audit-cases.js";
import { createEstimateDatabase, mountOs, flushAsyncWork } from "../helpers/os-harness.js";
import { jsonResponse, requestLog } from "../helpers/network.js";

let listeners = [];
beforeEach(() => {
  listeners = [];
  for (const target of [document, window]) {
    const add = target.addEventListener.bind(target);
    vi.spyOn(target, "addEventListener").mockImplementation((type, listener, options) => {
      listeners.push({ target, type, listener, options });
      add(type, listener, options);
    });
  }
});
afterEach(() => { for (const { target, type, listener, options } of listeners) target.removeEventListener(type, listener, options); });

describe("Phase 3F actual app shell and account/audit controller integration", () => {
  for (const role of ["admin", "manager", "staff"]) test(`${role}: feature navigation and account/audit visibility preserve read-only data`, async () => {
    const estimate = latestEstimate();
    const database = createEstimateDatabase(estimate);
    const handler = database.handle;
    database.handle = request => {
      if (request.url.pathname === "/api/os/users" && request.method === "GET") return jsonResponse(accountUsers());
      if (request.url.pathname === "/api/os/audit-logs" && request.method === "GET") return jsonResponse(auditRows());
      return handler(request);
    };
    const before = structuredClone(database.row);
    const { main, storage } = await mountOs(database, testProfile(role));
    main.loadEstimateIntoUi(await storage.getEstimate(estimate.id));
    await flushAsyncWork();
    for (const tab of ["client", "quote", "admin"]) {
      document.querySelector(`[data-tab="${tab}"]`).click();
      await flushAsyncWork();
      expect(document.getElementById(tab).classList.contains("active")).toBe(true);
      expect(document.querySelectorAll(".tab-panel.active")).toHaveLength(1);
    }
    expect(document.getElementById("contractPackageWorkspace").hidden).toBe(false);
    if (role === "staff") {
      expect(document.getElementById("system")).toBeNull();
      expect(document.getElementById("internal")).toBeNull();
      expect(document.getElementById("userManagementCard")).toBeNull();
      expect(document.getElementById("auditLogCard")).toBeNull();
      expect(document.getElementById("admin").textContent).not.toContain("직접원가");
    } else {
      document.querySelector('[data-tab="system"]').click();
      await flushAsyncWork();
      expect(document.getElementById("system").classList.contains("active")).toBe(true);
      expect(document.getElementById("system").classList.contains("system-readonly")).toBe(role === "manager");
      expect(Boolean(document.getElementById("userManagementCard"))).toBe(role === "admin");
      expect(Boolean(document.getElementById("auditLogCard"))).toBe(role === "admin");
      if (role === "admin") {
        expect(document.getElementById("userManagementRows").textContent).toContain("합성 매니저");
        document.querySelector('[data-user-action="edit"]').click();
        expect(document.getElementById("userEditPanel").hidden).toBe(false);
        document.querySelector('[data-user-action="cancel-edit"]').click();
        expect(document.getElementById("userEditPanel").hidden).toBe(true);
        document.querySelector('[data-user-action="reset-password"]').click();
        expect(document.getElementById("userPasswordPanel").hidden).toBe(false);
        document.querySelector('[data-user-action="cancel-reset"]').click();
        expect(document.getElementById("userPasswordPanel").hidden).toBe(true);
        document.getElementById("auditActorFilter").value = "admin@example.invalid";
        document.getElementById("auditActionFilter").value = "USER_CREATED";
        document.getElementById("reloadAuditLogsButton").click();
        await flushAsyncWork();
        const request = requestLog.requests.findLast(r => r.url.pathname === "/api/os/audit-logs");
        expect(request.url.searchParams.get("actor")).toBe("admin@example.invalid");
        expect(request.url.searchParams.get("action")).toBe("USER_CREATED");
        expect(document.getElementById("auditLogRows").textContent).toContain("UNKNOWN_LEGACY");
        document.getElementById("printPurchaseOrderButton").click();
        expect(document.getElementById("printQuoteSheet").textContent).toContain("발주");
      } else expect(document.querySelector("[data-delete-estimate]")).toBeNull();
    }
    expect(database.mutations).toEqual([]);
    expect(database.row).toStrictEqual(before);
  });
});

for (const state of ["active", "password-required", "inactive", "profile-error", "login-error"]) test(`actual login bootstrap is fail-closed: ${state}`, async () => {
  const database = createEstimateDatabase(latestEstimate());
  const handler = database.handle;
  const profile = testProfile("admin", { is_active: state !== "inactive", must_change_password: state === "password-required" });
  database.handle = request => {
    if (request.url.pathname === "/auth/v1/token") return jsonResponse(state === "login-error" ? {} : testSession(), state === "login-error" ? 400 : 200);
    if (request.url.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
    if (request.url.pathname === "/api/os/me") return state === "profile-error" ? jsonResponse({ message: "합성 profile 실패" }, 403) : jsonResponse(profile);
    return handler(request);
  };
  await mountOs(database);
  expect(document.getElementById("appShell").classList.contains("app-locked")).toBe(true);
  expect(requestLog.requests).toHaveLength(0);
  document.getElementById("loginEmail").value = "synthetic@example.invalid";
  document.getElementById("loginPassword").value = "Synthetic123";
  document.getElementById("loginForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  for (let i = 0; i < 4; i++) await flushAsyncWork();
  expect(document.getElementById("appShell").classList.contains("app-locked")).toBe(state !== "active");
  expect(document.getElementById("passwordChangeScreen").hidden).toBe(state !== "password-required");
  const dataRequests = requestLog.requests.filter(r => ["/rest/v1/cost_items", "/rest/v1/estimates", "/api/os/users", "/api/os/contract-packages"].includes(r.url.pathname));
  expect(dataRequests.length > 0).toBe(state === "active");
  if (state === "inactive") expect(requestLog.requests.some(r => r.url.pathname === "/auth/v1/logout")).toBe(true);
  if (state === "password-required") expect(document.getElementById("loginScreen").hidden).toBe(true);
  expect(database.mutations).toEqual([]);
});
