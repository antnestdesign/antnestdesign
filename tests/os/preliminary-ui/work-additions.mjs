import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { assertContainer, settings, ORIGIN, sql } from "../db/rebuild/stack.mjs";
import { ACCOUNTS, ACCOUNT_PASSWORD } from "../db/fixtures.mjs";
const APP = process.env.AND_OS_PRELIMINARY_TEST_ORIGIN || "http://127.0.0.1:3097", out = join(homedir(), "Documents/Codex/2026-07-06/new-chat/outputs/preliminary-work");
assert.ok(["http://127.0.0.1:3097", "http://127.0.0.1:3099"].includes(APP));
assertContainer(); assert.equal(ORIGIN, "http://127.0.0.1:56321"); mkdirSync(out, { recursive: true });
const config = settings(), tokens = {}, ids = [], heads = [];
const read = query => sql(`BEGIN READ ONLY; SET LOCAL statement_timeout='5s'; ${query}; ROLLBACK;`);
const protectedHash = () => read("SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.cost_items t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.detailed_estimate_versions t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.contract_document_versions t");
const originalHash = protectedHash();
const oldEstimates = read("SELECT id::text, md5(to_jsonb(t)::text) FROM public.estimates t ORDER BY id");
let checks = 0, page, browser;
const check = (value, label) => { assert.ok(value, label); checks++; };
const safe = value => { if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) { assert.doesNotMatch(key, /cost|profit|margin|internal|supplier|hash/i); safe(child); } };
async function api(path, role, method = "GET", body) {
  const r = await fetch(`${APP}/api/os${path}`, { method, headers: { Authorization: `Bearer ${tokens[role]}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
async function trade(key) {
  await page.locator(`#section${key}Enabled`).check();
  const button = page.locator(`[data-trade="section${key}Enabled"] .preliminary-detail-button`);
  if (await button.getAttribute("aria-expanded") === "false") await button.click();
}
async function settled() { await page.waitForFunction(() => !/계산 중/.test(document.querySelector("#saveStatus")?.textContent || "") && Number(document.querySelector("#clientTotal")?.textContent.replace(/[^0-9]/g, "")) > 0); }
async function savedRow(id) { return JSON.parse(read(`SELECT to_jsonb(t) FROM public.estimates t WHERE id='${id}'`)); }
try {
  for (const role of ["admin-active", "manager-active", "staff-active"]) {
    const a = ACCOUNTS.find(a => a.label === role), r = await fetch(`${ORIGIN}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: config.ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: a.email, password: ACCOUNT_PASSWORD }) });
    assert.equal(r.status, 200); tokens[role] = (await r.json()).access_token;
  }
  const require = createRequire(join(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/work-additions.cjs"));
  browser = await require("playwright").chromium.launch({ channel: "msedge", headless: true });
  for (const [role, width] of [["admin-active", 1440], ["manager-active", 1440], ["staff-active", 375], ["staff-active", 360]]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    await context.route("**/*", route => [APP, ORIGIN].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
    page = await context.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    page.on("dialog", d => d.accept());
    const staffResponses = [];
    if (role === "staff-active") page.on("response", async r => {
      if (new URL(r.url()).pathname.startsWith("/api/os/") && r.ok()) { try { staffResponses.push(await r.json()); } catch { /* no body */ } }
    });
    await page.addInitScript(() => { window.print = () => { document.body.dataset.printRequested = "yes"; }; });
    await page.goto(`${APP}/os-app/index.html`);
    const account = ACCOUNTS.find(a => a.label === role);
    await page.locator("#loginEmail").fill(account.email); await page.locator("#loginPassword").fill(ACCOUNT_PASSWORD); await page.locator("#loginForm button[type=submit]").click();
    await page.locator("#appShell:not(.app-locked)").waitFor();
    check(await page.locator('#standardT3M').inputValue() === "20000", "legacy default T3 20m appears as 20000mm");
    const name = `SYSTEM_WORK_${role}_${width}_${Date.now()}`;
    await page.locator("#projectName").fill(name); await page.locator("#areaPyeong").fill("30");
    await trade("Demolition");
    await page.locator("#demolitionBasicEnabled").check(); await page.locator("#demolitionBasicArea").fill("10"); await page.locator("#demolitionBasicType").selectOption("special");
    await page.locator("#demolitionFurnitureEnabled").check(); await page.locator("#demolitionFurnitureM").fill("3100");
    await page.locator("#demolitionFloorEnabled").check(); await page.locator("#demolitionCeilingEnabled").check();
    await page.locator("#demolitionBasicType").selectOption("normal");
    await settled();
    check(await page.locator("#demolitionFurnitureM").inputValue() === "3100", "type switch retains independent furniture");
    await page.screenshot({ path: join(out, `${role}-${width}-demolition.png`), fullPage: false });
    await trade("Electrical");
    for (const part of ["Outlet", "Switch"]) await page.locator(`#electrical${part}MoveEnabled`).check();
    await page.locator("#electricalOutletMoveUnits").fill("3"); await page.locator("#electricalSwitchMoveUnits").fill("2");
    await page.locator("#electricalSwitchMoveUnits").blur(); await settled();
    await page.screenshot({ path: join(out, `${role}-${width}-electrical.png`), fullPage: false });
    await trade("Carpentry");
    await page.locator("#carpentryMoldingEnabled").check(); await page.locator("#carpentryMoldingLengthM").fill("20000");
    await page.locator("#carpentryBaseboardEnabled").check(); await page.locator("#carpentryBaseboardLengthM").fill("30000");
    await page.locator("#carpentryBaseboardLengthM").blur(); await settled();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${role} ${width} no page overflow`);
    await page.screenshot({ path: join(out, `${role}-${width}-carpentry.png`), fullPage: false });
    const saving = page.waitForResponse(r => r.request().method() === "POST" && ["/api/os/estimates", "/rest/v1/estimates"].includes(new URL(r.url()).pathname));
    await page.locator("#saveAsNewEstimateButton").click(); const response = await saving; check(response.status() === 201, "actual UI save succeeds");
    const result = await response.json(), id = Array.isArray(result) ? result[0].id : result.id; ids.push(id);
    const saved = await savedRow(id), data = saved.estimate_data;
    check(data.inputs.demolitionBasicArea === "10" && data.inputs.demolitionBasicType === "normal", "basic type and area stored");
    const details = data.internalDetails, find = name => details.find(d => d.item === name);
    for (const [label, cost, sale] of [["기본철거(일반)", 800000, 1040000], ["콘센트 위치 이동", 450000, 585000], ["스위치 위치 이동", 300000, 390000], ["천장몰딩 자재", 36000, 46800], ["걸레받이 자재", 63000, 81900]]) {
      check(find(label)?.cost === cost && find(label)?.revenue === sale, `${label} server calculation and snapshot`);
    }
    check(details.some(d => d.item.includes("가구 철거")) && details.some(d => d.item.includes("천장철거")) && details.some(d => d.item.includes("마루")), "existing demolition survives");
    await page.waitForFunction(() => /저장 완료/.test(document.querySelector("#saveStatus")?.textContent || ""));
    await page.locator("#printQuoteButton").click();
    await page.waitForFunction(() => document.body.dataset.printRequested === "yes");
    check(await page.locator("body").getAttribute("data-print-requested") === "yes", "print command reaches browser");
    const print = await page.locator("#printQuoteSheet").textContent();
    const quote = await page.locator("#customerQuoteSheet").textContent();
    for (const label of ["기본철거", "콘센트 위치 이동", "스위치 위치 이동", "천장몰딩", "걸레받이"]) check(quote.includes(label), `${label} in customer detail output`);
    check(!/원가|가산율|마진|이익/.test(print), "customer output excludes private policy");
    await page.locator('[data-tab="client"]').click();
    await page.locator("#projectSearch").fill(name); await page.locator(`#projectSearchResults option[value="${id}"]`).waitFor({ state: "attached" });
    await page.locator("#projectSearchResults").selectOption(id); await page.locator("#loadProjectButton").click();
    await page.waitForFunction(() => document.querySelector("#saveStatus")?.textContent === "저장 당시 계산 결과를 표시 중입니다.");
    for (const [field, value] of [["demolitionBasicArea", "10"], ["demolitionBasicType", "normal"], ["carpentryMoldingLengthM", "20000"], ["carpentryBaseboardLengthM", "30000"], ["electricalOutletMoveUnits", "3"], ["electricalSwitchMoveUnits", "2"]]) check(await page.locator(`#${field}`).inputValue() === value, `${field} reload`);
    check(await page.locator("#clientTotal").textContent() === data.totalText, "saved total reused, not silently recalculated");
    await page.locator("#startDetailedEstimateButton").click();
    const starting = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/os/detailed-estimates/from-preliminary");
    await page.locator("#createDetailedDraftButton").click(); const started = await starting; check(started.status() === 201, "new detailed draft UI start");
    const head = (await started.json()).id; heads.push(head);
    await page.waitForFunction(() => /작성본을 불러왔습니다/.test(document.querySelector("#detailedStatus")?.textContent || ""));
    const editor = await api(`/detailed-estimates/${head}/editor`, role); check(editor.status === 200, "draft readable");
    if (role === "staff-active") safe(editor.data);
    const reference = JSON.parse(read(`SELECT reference_public_json FROM public.detailed_estimate_references WHERE detailed_estimate_id='${head}'`));
    check(reference.inputs.demolitionBasicArea === undefined && reference.inputs.carpentryMoldingLengthM === undefined, "confirmed immutable reference legacy whitelist limitation");
    const { buildPreliminaryPlan } = await import("../../../public/os-app/src/detailed-preliminary.js");
    const reviews = buildPreliminaryPlan(reference, id).reviews;
    for (const label of ["기본철거(일반)", "콘센트 위치 이동", "스위치 위치 이동", "천장몰딩 자재", "걸레받이 자재"]) check(reviews.some(r => r.label === label && r.reason.includes("전달되지 않았습니다")), `${label} remains explicit review instead of silent loss`);
    await page.locator('[data-detailed-close]').click();
    const after = await savedRow(id); check(JSON.stringify(after.estimate_data) === JSON.stringify(data), "reference creation and navigation never reprice original");
    if (role === "staff-active") {
      for (const body of staffResponses) safe(body);
      check(!/직접원가|목표.*이익률/.test(await page.locator("#client").innerText()), "staff live work has no internal price policy");
      check((await api("/estimates/calculate", role)).status === 403, "staff private defaults denied");
    }
    check(errors.length === 0, "no browser errors");
    await context.close();
  }
  check(protectedHash() === originalHash, "cost master issued versions and contracts immutable");
  const existingAfter = read(`SELECT id::text, md5(to_jsonb(t)::text) FROM public.estimates t WHERE id NOT IN (${ids.map(id => `'${id}'`).join(",")}) ORDER BY id`);
  check(existingAfter === oldEstimates, "all prior synthetic estimates preserved");
  console.log(JSON.stringify({ result: "PASS_WITH_KNOWN_REFERENCE_LIMITATION", checks, viewports: [1440, 375, 360], savedSyntheticEstimates: ids.length, syntheticDrafts: heads.length, referenceQuantityImport: "BLOCKED_BY_EXISTING_DB_WHITELIST", screenshots: out, productionAccess: 0 }));
} catch (error) {
  if (page) await page.screenshot({ path: join(out, "failure.png"), fullPage: true }).catch(() => {});
  throw error;
} finally { await browser?.close(); }
