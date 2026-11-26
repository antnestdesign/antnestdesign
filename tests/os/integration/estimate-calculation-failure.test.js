import { beforeEach, expect, test, vi } from "vitest";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";
import { createEstimateDatabase, flushAsyncWork, mountOs } from "../helpers/os-harness.js";
import { jsonResponse, mutations } from "../helpers/network.js";

beforeEach(() => window.history.replaceState(null, "", "/"));

test.each(["admin", "staff"])("%s: failed calculation hides stale figures and recovers without saving them", async role => {
  const saved = { ...latestEstimate(), canEdit: true, canConfirm: role === "admin", revision: 1 };
  const db = createEstimateDatabase(saved);
  const original = db.handle;
  const path = role === "admin" ? "/api/os/estimates/calculate" : "/api/os/estimates/preview";
  let failure = false;
  let recoveredTotal;
  db.handle = async request => {
    if (request.method === "GET") {
      if (request.url.pathname === "/api/os/projects") return jsonResponse([]);
      if (request.url.pathname === "/api/os/estimate-items") return jsonResponse({ mode: "OFF" });
      if (request.url.pathname.endsWith("/confirmations")) return jsonResponse({ versions: [], projectCandidates: [], issues: [], fingerprint: "synthetic" });
    }
    if (request.method === "POST" && request.url.pathname === path && failure) return jsonResponse({ error: "계산 요청 오류" }, 400);
    const response = await original(request);
    if (request.method === "POST" && request.url.pathname === path && response?.ok) {
      const result = await response.clone().json();
      recoveredTotal = (result.snapshot || result).totalText;
      if (role === "staff" && request.body.inputs.demolitionFurnitureM === "3000") {
        recoveredTotal = "4,160,000원";
        return jsonResponse({ ...result, total: 4160000, totalText: recoveredTotal,
          customerQuote: { ...result.customerQuote, total: 4160000, totalText: recoveredTotal } });
      }
    }
    return response;
  };
  const { main } = await mountOs(db, testProfile(role));
  main.loadEstimateIntoUi(saved);
  await flushAsyncWork();
  const total = document.getElementById("clientTotal");
  const tradeTotal = document.querySelector('[data-trade="sectionBathroomEnabled"] .preliminary-trade-amount');
  const input = document.getElementById("demolitionFurnitureM");
  const change = value => { input.value = value; input.dispatchEvent(new Event("input", { bubbles:true })); };
  expect(total.textContent).toBe(saved.totalText);
  failure = true;
  change("2200");
  await vi.waitFor(() => {
    expect(total.textContent).toBe("—");
    expect(tradeTotal.textContent).toBe("—");
    expect(document.getElementById("quoteTotal").textContent).toBe("—");
    expect(document.getElementById("saveStatus").textContent).toContain("계산 요청 오류");
  });
  if (role === "admin") {
    const confirm = document.querySelector("[data-estimate-confirm]");
    expect(confirm.disabled).toBe(true);
    expect(document.querySelector("[data-estimate-contract]").disabled).toBe(true);
    confirm.dispatchEvent(new MouseEvent("click", { bubbles:true }));
  }
  document.querySelector("[data-customer-detail-print]").click();
  await main.handleSaveEstimate("update");
  expect(window.print).not.toHaveBeenCalled();
  expect(mutations()).toEqual([]);
  failure = false;
  recoveredTotal = undefined;
  change("3000");
  await vi.waitFor(() => {
    expect(recoveredTotal).toBeTruthy();
    expect(total.textContent).toBe(recoveredTotal);
    expect(total.textContent).not.toBe(saved.totalText);
    if (role === "admin") expect(document.querySelector("[data-estimate-confirm]").disabled).toBe(false);
  });
  expect(mutations()).toEqual([]);
});
