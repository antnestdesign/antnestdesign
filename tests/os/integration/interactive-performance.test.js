import { expect, test, vi } from "vitest";
import { latestEstimate, testProfile, testSession } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs } from "../helpers/os-harness.js";
import { clearRequestLog, jsonResponse, requestLog } from "../helpers/network.js";
import { projectStaffEstimate } from "../../../app/api/os/estimates/_lib/estimates.js";

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const baseline = process.env.AND_OS_INTERACTIVE_BASELINE === "1";
const byId = id => document.getElementById(id);
const calculationPosts = () => requestLog.requests.filter(req => req.method === "POST" &&
  req.url.pathname === "/api/os/estimates/calculate");

test("estimate typing batches calculations; an immediate action still uses the latest value", async () => {
  const db = createEstimateDatabase(latestEstimate());
  const original = db.handle;
  db.handle = async request => {
    if (request.url.pathname === "/api/os/estimate-items") return jsonResponse({ mode: "OFF" });
    return original(request);
  };
  const { main } = await mountOs(db, testProfile("admin"));
  const field = byId("projectName");
  for (let i = 1; i <= 12; i++) {
    field.value = "Synthetic performance " + i;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(12);
  }
  field.dispatchEvent(new Event("change", { bubbles: true }));
  await vi.waitFor(() => expect(calculationPosts().at(-1)?.body.inputs.projectName).toBe(field.value));
  console.info("TYPING_CALCULATION_POSTS", calculationPosts().length);
  if (!baseline) expect(calculationPosts()).toHaveLength(1);
  clearRequestLog();
  field.value = "Synthetic immediate action";
  field.dispatchEvent(new Event("input", { bubbles: true }));
  if (!baseline) expect(calculationPosts()).toHaveLength(0);
  const latest = await main.ensureServerCalculation();
  expect(latest.snapshot.projectName).toBe(field.value);
  await wait(220);
  expect(calculationPosts()).toHaveLength(1);
}, 20000);

test("login is independent of the optional catalog; lists retain every row", async () => {
  const db = createEstimateDatabase(latestEstimate());
  const original = db.handle;
  const profile = testProfile("admin");
  const template = projectStaffEstimate(db.row);
  const id = (kind, index) => kind + "-0000-4000-8000-" + String(index).padStart(12, "0");
  const projects = Array.from({ length: 250 }, (_, i) => ({
    id: id("40000000", i), project_name: "Synthetic contract " + i,
    customer: { name: "Synthetic customer" }, status: "계약",
  }));
  const estimates = projects.flatMap((p, i) => Array.from({ length: 2 }, (_, j) => ({
    ...template, id: id("20000000", i * 2 + j), projectName: "Synthetic quote " + (i * 2 + j), projectId: p.id,
  })));
  let releaseCatalog;
  const catalog = new Promise(resolve => { releaseCatalog = resolve; });
  let requested = false;
  db.handle = async request => {
    if (request.url.pathname === "/auth/v1/token") return jsonResponse(testSession(profile.role));
    if (request.url.pathname === "/api/os/estimate-items") { requested = true; await catalog; return jsonResponse({ mode: "OFF" }); }
    if (request.url.pathname === "/api/os/estimates" && request.method === "GET") return jsonResponse(estimates);
    if (request.url.pathname === "/api/os/projects") return jsonResponse(projects);
    return original(request);
  };
  await mountOs(db);
  db.profile = profile;
  const loginStarted = performance.now();
  byId("loginForm").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  try {
    await vi.waitFor(() => expect(requested).toBe(true));
    if (baseline) { await wait(350); releaseCatalog(); }
    await vi.waitFor(() => expect(byId("loginScreen").hidden).toBe(true), { timeout: 1500 });
  } finally { releaseCatalog(); }
  const loginMs = Math.round(performance.now() - loginStarted);
  const started = performance.now();
  document.querySelector('[data-tab="admin"]').click();
  await vi.waitFor(() => expect(byId("contractProjectRows").children).toHaveLength(projects.length));
  const contractsMs = Math.round(performance.now() - started);
  if (!baseline) expect(byId("savedEstimateRows").children.length).toBeLessThan(estimates.length);
  const quotesStarted = performance.now();
  document.querySelector('[data-tab="quote"]').click();
  await vi.waitFor(() => expect(byId("savedEstimateRows").children).toHaveLength(estimates.length));
  console.info("SYNTHETIC_WORKSPACE_MS", JSON.stringify({
    loginMs, contractsMs, quotesMs: Math.round(performance.now() - quotesStarted),
  }));
  const search = byId("contractProjectSearch");
  search.value = "Synthetic contract 249";
  search.dispatchEvent(new Event("input", { bubbles: true }));
  expect(byId("contractProjectRows").children).toHaveLength(1);
  expect(byId("contractProjectRows").textContent).toContain("Synthetic contract 249");
}, 20000);
