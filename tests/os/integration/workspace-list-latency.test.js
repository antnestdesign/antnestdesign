import { expect, test, vi } from "vitest";
import { latestEstimate, testProfile, testSession } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs } from "../helpers/os-harness.js";
import { clearRequestLog, jsonResponse, requestLog } from "../helpers/network.js";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test("login and list navigation with fixed endpoint latency", async () => {
  const estimate = latestEstimate();
  const db = createEstimateDatabase(estimate);
  const profile = testProfile("admin");
  const original = db.handle;
  const project = { id: "40000000-0000-4000-8000-000000000002", project_name: "Synthetic contract", status: "계약" };
  let authMs;
  let loginStart;
  db.handle = async request => {
    const path = request.url.pathname;
    await wait(60);
    if (path === "/auth/v1/token") {
      authMs = performance.now() - loginStart;
      return jsonResponse(testSession(profile.role));
    }
    if (path === "/api/os/projects") return jsonResponse([project]);
    if (path === "/api/os/estimate-items" && request.url.searchParams.get("view")==="state") return jsonResponse({mode:"OFF"});
    return original(request);
  };
  await mountOs(db);
  db.profile = profile;
  const seen = (path, view = null) => requestLog.requests.some(({url}) =>
    url.pathname === path && (!view || url.searchParams.get("view") === view));
  async function measure(start, done) {
    const began = performance.now();
    start();
    await vi.waitFor(() => expect(done()).toBe(true), { interval: 5, timeout: 5000 });
    return Math.round(performance.now() - began);
  }
  loginStart = performance.now();
  const login = await measure(
    () => document.getElementById("loginForm").dispatchEvent(new Event("submit", {bubbles:true,cancelable:true})),
    () => document.getElementById("loginScreen").hidden,
  );
  const baseline = process.env.AND_OS_LATENCY_BASELINE === "1";
  if (!baseline) {
    expect(seen("/api/os/estimates")).toBe(false);
    expect(seen("/api/os/contract-packages")).toBe(false);
    expect(seen("/api/os/audit-logs")).toBe(false);
  }
  const clickTab = id => document.querySelector(`[data-tab="${id}"]`).click();
  const listRow = () => document.getElementById("savedEstimateRows").textContent.includes(estimate.projectName);
  clearRequestLog();
  const quotes = await measure(() => clickTab("quote"), listRow);
  if (!baseline) expect(seen("/api/os/estimates", "contracts")).toBe(false);
  clearRequestLog();
  const contracts = await measure(() => clickTab("admin"), () =>
    listRow() && document.getElementById("contractProjectRows").textContent.includes(project.project_name));
  expect(seen("/api/os/estimates", "contracts")).toBe(true);
  const contractsAgain = await measure(() => clickTab("admin"), () =>
    listRow() && document.getElementById("contractProjectRows").textContent.includes(project.project_name));
  const quotesAgain = await measure(() => clickTab("quote"), listRow);
  console.info("WORKSPACE_TIMINGS_MS", JSON.stringify({
    auth: Math.round(authMs), login, afterAuth: Math.round(login - authMs), quotes, contracts, quotesAgain, contractsAgain,
  }));
});
