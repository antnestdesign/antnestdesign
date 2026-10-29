import { beforeEach, afterEach, describe, expect, test, vi } from "vitest";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";
import { contractFixture } from "../fixtures/contract-cost-view-cases.js";
import { CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { createEstimateDatabase, mountOs, flushAsyncWork } from "../helpers/os-harness.js";
import { jsonResponse, requestLog } from "../helpers/network.js";

let addedListeners = [];
beforeEach(() => {
  addedListeners = [];
  for (const target of [document, window]) {
    const add = target.addEventListener.bind(target);
    vi.spyOn(target, "addEventListener").mockImplementation((type, listener, options) => {
      addedListeners.push({ target, type, listener, options });
      add(type, listener, options);
    });
  }
});
afterEach(() => {
  for (const { target, type, listener, options } of addedListeners) target.removeEventListener(type, listener, options);
});

describe("Phase 3E real contract/cost view and main action boundary", () => {
  for (const role of ["admin", "manager", "staff"]) test(`${role}: contract options/preview, confirm guard and cost read-only controls`, async () => {
    const estimate = latestEstimate();
    const database = createEstimateDatabase(estimate);
    const before = structuredClone(database.row);
    const handler = database.handle;
    const preview = contractFixture({ role }, CONTRACT_FIXED_TERM_LINES).preview;
    database.handle = (request) => request.url.pathname === "/api/os/contract-packages/preview" && request.method === "POST" ? jsonResponse(preview) : handler(request);
    const { main, storage } = await mountOs(database, testProfile(role));
    main.loadEstimateIntoUi(await storage.getEstimate(estimate.id));
    await flushAsyncWork();
    expect(document.getElementById("contractPackageWorkspace").hidden).toBe(false);
    expect(document.getElementById("siteManagerName").disabled).toBe(role === "manager");
    expect(document.getElementById("createContractPackageButton").hidden).toBe(role !== "admin");
    if (role !== "manager") {
      document.getElementById("previewContractPackageButton").click();
      await flushAsyncWork();
      expect(document.getElementById("contractDocumentPreview").textContent).toContain("합성 공개 정보");
      const request = requestLog.requests.find((request) => request.url.pathname === "/api/os/contract-packages/preview");
      expect(request).toBeDefined();
      expect(request.body.options.admin_tasks.resident_consent_included).toBe(false);
      document.querySelector('[data-contract-print="ALL"]').click();
      const print = document.getElementById("printQuoteSheet");
      expect(print.querySelectorAll(".contract-print-page")).toHaveLength(3);
      expect(print.textContent).toContain("제48조");
    }
    if (role === "staff") {
      expect(document.getElementById("contractDocumentPreview").textContent).not.toMatch(/SYNTHETIC_INTERNAL|SYNTHETIC_HASH|costTotal/);
      document.getElementById("createContractPackageButton").click();
      await flushAsyncWork();
      expect(document.getElementById("system")).toBeNull();
    } else {
      const tab = document.querySelector('[data-tab="system"]');
      expect(tab).not.toBeNull();
      tab.click();
      await flushAsyncWork();
      const group = document.querySelector("[data-system-cost-category]");
      group.click();
      await flushAsyncWork();
      expect(document.querySelector(".system-cost-table")).not.toBeNull();
      expect(document.querySelectorAll('[data-system-action="save-draft"]').length > 0).toBe(role === "admin");
      expect(document.getElementById("system").classList.contains("system-readonly")).toBe(role === "manager");
    }
    expect(database.mutations).toEqual([]);
    expect(database.row).toStrictEqual(before);
    expect(requestLog.requests.filter((request) => !["GET", "HEAD"].includes(request.method)).every((request) => request.url.pathname.endsWith("/preview") || request.url.pathname === "/api/os/estimates/calculate")).toBe(true);
  });
});
