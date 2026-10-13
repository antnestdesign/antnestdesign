import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { ACCOUNT_PASSWORD, ESTIMATE_A } from "../fixtures.mjs";
import { internalEstimate } from "../../fixtures/estimates.js";
import { command, ORIGIN, ROOT } from "../rebuild/stack.mjs";

const phase = process.argv[2];
assert(["baseline", "canonical"].includes(phase));
assert.equal(process.env.AND_OS_DB_REBUILD, "1");
assert.equal(process.env.SUPABASE_URL, ORIGIN);
const account = JSON.parse(process.env.AND_OS_DB_ACCOUNTS)["staff-active"];
const source = command("git", ["show", "522cbb8:public/os-app/src/storage.js"], { cwd: ROOT });
assert.equal(source.status, 0);
const storage = source.stdout.replace(/const SUPABASE_URL = "[^"]+";/, `const SUPABASE_URL = ${JSON.stringify(ORIGIN)};`)
  .replace(/const SUPABASE_KEY = "[^"]+";/, `const SUPABASE_KEY = ${JSON.stringify(process.env.AND_OS_DB_ANON)};`);
assert(!storage.includes(".supabase.co") && !storage.includes("sb_publishable_"));
const bundled = createRequire(resolve(homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/__compat__.cjs"));
const { chromium } = bundled("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const responses = [];
const networkErrors = [];
const consoleErrors = [];
async function full() {
  const r = await fetch(`${ORIGIN}/rest/v1/estimates?select=*&order=id`, { redirect: "error", headers: {
    apikey: process.env.AND_OS_DB_SERVICE, Authorization: `Bearer ${process.env.AND_OS_DB_SERVICE}`,
  } });
  assert.equal(r.status, 200); return r.json();
}
try {
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:3044" && url.pathname === "/os-app/src/storage.js")
      return route.fulfill({ contentType: "application/javascript", body: storage });
    if (![ORIGIN, "http://127.0.0.1:3044"].includes(url.origin)) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().replace(/(?:eyJ|sb_secret_|sb_publishable_)[A-Za-z0-9._-]+/g, "[REDACTED]")); });
  page.on("requestfailed", (r) => networkErrors.push({ method: r.method(), path: new URL(r.url()).pathname, error: r.failure()?.errorText }));
  page.on("response", (r) => {
    if (new URL(r.url()).pathname === "/rest/v1/estimates") responses.push({ method: r.request().method(), status: r.status() });
  });
  const before = await full();
  // Use a real loopback response so Chromium retains its address-space identity.
  await page.goto("http://127.0.0.1:3044/privacy");
  const attempt = internalEstimate(); attempt.projectName = "SYSTEM_COMPAT_OLD_BLOCKED";
  const result = await page.evaluate(async ({ email, password, phase, attempt, id }) => {
    const client = await import("/os-app/src/storage.js");
    await client.signIn(email, password);
    const rows = await client.loadEstimates();
    let saveError = "";
    if (phase === "canonical") {
      try { await client.saveEstimate(attempt); } catch (e) { saveError = e.message; }
    }
    return { rows: rows.length, foundSavedEstimate: rows.some((r) => r.id === id),
      legacyRawInternalExposure: JSON.stringify(rows).includes("SYNTHETIC_PRIVATE"), saveError };
  }, { email: account.email, password: ACCOUNT_PASSWORD, phase, attempt, id: ESTIMATE_A });
  assert.deepEqual(await full(), before);
  if (phase === "baseline") { assert(result.foundSavedEstimate); assert(result.legacyRawInternalExposure); }
  else { assert.equal(result.rows, 0); assert.match(result.saveError, /403/); assert(responses.some((r) => r.method === "POST" && r.status === 403)); }
  writeFileSync(resolve(import.meta.dirname, `artifacts/old-client-${phase}.json`), JSON.stringify({
    phase, oldCommit: "522cbb8", scope: "actual old storage module in Chromium; not a full old backend deployment",
    login: "PASS", ...result, responses, savedRowsUnchanged: true,
    verdict: phase === "baseline" ? "REFERENCE_CONFIRMED" : "EXPECTED_STAFF_FAILURE_REPRODUCED",
  }, null, 2) + "\n");
  console.log(`Old staff storage / ${phase}: ${phase === "baseline" ? "reference confirmed" : "empty read + HTTP 403 write reproduced"}; synthetic rows unchanged.`);
} catch (e) {
  console.error(JSON.stringify({ phase, networkErrors, consoleErrors, responses })); throw e;
} finally { await browser.close(); }
