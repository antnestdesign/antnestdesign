import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { assertContainer, sql, ORIGIN, ROOT, WORKDIR } from "./stack.mjs";
import { estimatePayload, ESTIMATE_A, ACCOUNT_PASSWORD } from "../fixtures.mjs";
import { ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS } from "../../../../public/os-app/src/estimate-inputs.js";

assertContainer();
assert.equal(process.env.AND_OS_DB_REBUILD, "1"); assert.equal(process.env.SUPABASE_URL, ORIGIN);
const label = process.argv[2];
assert(["ON", "READ_ONLY", "OFF", "MISSING", "INVALID"].includes(label));
const mode = label === "ON" || label === "READ_ONLY" ? label : "OFF";
const accounts = JSON.parse(process.env.AND_OS_DB_ACCOUNTS);
const roles = ["admin-active", "manager-active", "staff-active"];
const report = { label, actualServerMode: null, syntheticOnly: true, checks: [], result: "PENDING" };
const artifact = name => resolve(WORKDIR, "artifacts", name);
async function api(path, role = "staff-active", method = "GET", body) {
  const r = await fetch(`http://127.0.0.1:3044/api/os${path}`, { method, redirect: "error", signal: AbortSignal.timeout(30000),
    headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${accounts[role].token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
async function rest(path, method = "GET", body) {
  const r = await fetch(`${ORIGIN}/rest/v1/${path}`, { method, redirect: "error", signal: AbortSignal.timeout(30000),
    headers: { "Content-Type": "application/json", apikey: process.env.AND_OS_DB_SERVICE, Authorization: `Bearer ${process.env.AND_OS_DB_SERVICE}`, Prefer: "return=representation" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
async function check(name, action) { await action(); report.checks.push(name); }
function digest() {
  const tables = ["customers", "projects", "estimates", "project_preliminary_estimates", "detailed_estimates", "detailed_estimate_drafts", "detailed_estimate_references", "detailed_estimate_events", "cost_items", "contract_package_snapshots", "contract_document_versions"];
  return sql(`SELECT jsonb_build_object(${tables.map(t => `'${t}',(SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb)::text) FROM public.${t} t)`).join(",")});`);
}
let fixture;
try {
  const capability = await api("/features/project-foundation"); assert.equal(capability.status, 200);
  report.actualServerMode = capability.data.mode; assert.equal(capability.data.mode, mode, "Actual server process did not adopt mode");
  if (mode === "ON") {
    const sourceId = randomUUID();
    assert.equal((await rest("estimates", "POST", { ...estimatePayload(sourceId), id: sourceId, project_name: "SYSTEM_5B_MODE_SOURCE" })).status, 201);
    const p = await api("/detailed-estimates/from-preliminary/preview", "staff-active", "POST", { estimate_id: sourceId }); assert.equal(p.status, 200);
    const created = await api("/detailed-estimates/from-preliminary", "staff-active", "POST", { estimate_id: sourceId, confirmation: p.data.confirmation,
      selection: { mode: "new", project_name: "SYSTEM_5B_MODE_PROJECT", customer_mode: "undecided" }, title: "SYSTEM_MODE_DRAFT", request_id: randomUUID() });
    assert.equal(created.status, 201);
    const save = { expected_revision: 1, request_id: randomUUID(), context: { area_pyeong: 0, customer_undecided: false } };
    assert.equal((await api(`/detailed-estimates/${created.data.id}/draft`, "staff-active", "PATCH", save)).status, 200);
    const legacyId = randomUUID(); assert.equal((await rest("projects", "POST", { id: legacyId, project_name: "SYSTEM_5B_MODE_LEGACY" })).status, 201);
    fixture = { sourceId, projectId: created.data.project_id, headId: created.data.id, legacyId, save };
    writeFileSync(artifact("feature-mode-fixture.json"), JSON.stringify(fixture));
    report.checks.push("ON creates project/draft and saves revision; fixture contains IDs only, no credentials");
  } else fixture = JSON.parse(readFileSync(artifact("feature-mode-fixture.json"), "utf8"));
  const before = digest();
  const reads = [["/projects"], ["/projects/customers"], [`/projects/${fixture.projectId}`],
    ["/detailed-estimates/from-preliminary/preview", "POST", { estimate_id: fixture.sourceId }],
    [`/detailed-estimates/${fixture.headId}`], [`/detailed-estimates/${fixture.headId}/events`]];
  const writes = [["/projects", "POST", {}], [`/projects/${fixture.legacyId}/adopt`, "POST", {}],
    ["/detailed-estimates/from-preliminary", "POST", {}], [`/detailed-estimates/${fixture.headId}/draft`, "PATCH", fixture.save]];
  for (const role of roles) {
    for (const [path, method = "GET", body] of reads) await check(`${role} ${method} ${path.replace(/[0-9a-f-]{36}/g, "[id]")} ${mode}`, async () => {
      const r = await api(path, role, method, body); assert.equal(r.status, mode === "OFF" ? 503 : 200);
      if (mode === "OFF") assert.equal(r.data.code, "FOUNDATION_OFF");
    });
    if (mode !== "ON") for (const [path, method, body] of writes) await check(`${role} ${method} denied including prior request retry`, async () => {
      const r = await api(path, role, method, body); assert.equal(r.status, mode === "OFF" ? 503 : 423);
      assert.equal(r.data.code, mode === "OFF" ? "FOUNDATION_OFF" : "FOUNDATION_READ_ONLY");
    });
    if (mode === "READ_ONLY") await check(`${role} unmanaged project access preserves role policy`, async () => {
      assert.equal((await api(`/projects/${fixture.legacyId}`, role)).status, role === "staff-active" ? 403 : 200);
    });
  }
  await check("blocked/read operations leave all business digests unchanged", async () => assert.equal(digest(), before));
  await check("unauthenticated capability denied", async () => assert.equal((await api("/features/project-foundation", null)).status, 401));
  await check("query cannot override server feature state", async () => assert.equal((await api("/features/project-foundation?mode=ON")).data.mode, mode));

  if (mode === "OFF" && label === "OFF") for (const role of roles) await check(`${role} OFF leaves legacy estimate update and contract workflow available`, async () => {
    const old = await api(`/estimates/${ESTIMATE_A}`, role); assert.equal(old.status, 200);
    const inputs = Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).filter(([id]) => !PRIVATE_ESTIMATE_INPUTS.includes(id))
      .map(([id, s]) => [id, s.type === "checkbox" ? false : s.value]));
    Object.assign(inputs, { projectName: `SYSTEM_MODE_LEGACY_${role}`, areaPyeong: "33", existingPipeCleaningEnabled: true });
    const created = await api("/estimates", role, "POST", { inputs }); assert.equal(created.status, 201);
    const saved = await api(`/estimates/${created.data.id}`, role, "PATCH", { inputs: { ...inputs, clientName: "SYNTHETIC MODE EDIT" } }); assert.equal(saved.status, 200);
    const loaded = await api(`/estimates/${created.data.id}`, role); assert.equal(loaded.status, 200);
    const preview = await api("/contract-packages/preview", role, "POST", { estimate_id: created.data.id });
    assert.equal(preview.status, role === "manager-active" ? 403 : 200);
    if (role === "admin-active") {
      assert.equal((await api("/contract-options", role, "PUT", { estimate_id: created.data.id, contract_info: { contract_date: "2026-10-19", start_date: "2026-11-01", planned_completion_date: "2026-12-01" } })).status, 200);
      const pkg = await api("/contract-packages", role, "POST", { estimate_id: created.data.id }); assert.equal(pkg.status, 201);
      assert.equal((await api(`/contract-packages/${pkg.data.id}/confirm`, role, "POST", {})).data.status, "CONTRACTED");
    }
  });

  const bundled = createRequire(resolve(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/__ui_test__.cjs"));
  const { chromium } = bundled("playwright"); const browser = await chromium.launch({ channel: "msedge", headless: true });
  const storage = readFileSync(resolve(ROOT, "public/os-app/src/storage.js"), "utf8")
    .replace(/const SUPABASE_URL = "[^"]+";/, `const SUPABASE_URL = ${JSON.stringify(ORIGIN)};`)
    .replace(/const SUPABASE_KEY = "[^"]+";/, `const SUPABASE_KEY = ${JSON.stringify(process.env.AND_OS_DB_ANON)};`);
  assert(!storage.includes(".supabase.co"));
  try {
    for (const role of roles) await check(`${role} browser ${mode} controls and customer output`, async () => {
      const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 375, height: 812 } });
      const errors = []; let hosted = 0;
      await context.route("**/*", route => {
        const u = new URL(route.request().url());
        if (u.origin === "http://127.0.0.1:3044" && u.pathname === "/os-app/src/storage.js") return route.fulfill({ contentType: "application/javascript", body: storage });
        if (![ORIGIN, "http://127.0.0.1:3044"].includes(u.origin)) { hosted++; return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage(); page.on("pageerror", e => errors.push(e.message)); page.on("dialog", d => d.dismiss());
      await page.addInitScript(() => { window.print = () => window.dispatchEvent(new Event("afterprint")); });
      await page.goto("http://127.0.0.1:3044/os-app/index.html", { waitUntil: "networkidle" });
      await page.locator("#loginEmail").fill(accounts[role].email); await page.locator("#loginPassword").fill(ACCOUNT_PASSWORD);
      await page.locator("#loginForm button[type=submit]").click(); await page.locator("#appShell.app-locked").waitFor({ state: "detached", timeout: 30000 });
      if (mode === "OFF") {
        await page.waitForFunction(() => document.getElementById("startDetailedEstimateButton")?.hidden);
        assert.equal(await page.locator("#startDetailedEstimateButton").isVisible(), false);
      }
      else {
        await page.locator("#startDetailedEstimateButton").waitFor({ state: "visible" });
        if (mode === "READ_ONLY") {
          await page.locator("#startDetailedEstimateButton").click();
          await page.locator("#detailedProjectSelect").selectOption(fixture.projectId);
          await page.locator("#openDetailedDraftButton").click();
          await page.locator("#detailedProjectName").waitFor({ state: "visible" });
          assert(await page.locator("#detailedProjectName").isDisabled()); assert.equal(await page.locator("#saveDetailedDraftButton").count(), 0);
          assert.equal(await page.locator("#createDetailedDraftButton,#adoptDetailedProjectButton").count(), 0);
          await page.locator("[data-detailed-close]").click();
        }
      }
      await page.locator("#projectSearchResults").selectOption(ESTIMATE_A); await page.locator("#loadProjectButton").click();
      await page.waitForFunction(() => document.getElementById("quoteTotal")?.textContent === "3,770,000원");
      await page.locator(".preliminary-actions button:last-child").click();
      assert((await page.locator("#printQuoteSheet").innerText()).includes("3,770,000원"));
      assert(!/직접원가|마진율/.test(await page.locator("#printQuoteSheet").innerText()));
      assert.deepEqual(errors, []); assert.equal(hosted, 0); assert.equal(await page.locator("#client input,#client select,#client textarea").count(), 145);
      await context.close();
    });
  } finally { await browser.close(); }
  report.result = "PASS";
} finally {
  writeFileSync(artifact(`feature-mode-${label}.json`), JSON.stringify(report, null, 2));
}
console.log(`Feature process ${label} => ${mode}: ${report.checks.length} checks PASS (synthetic only).`);
