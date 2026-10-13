import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { ACCOUNTS, ACCOUNT_PASSWORD, profileSql, seedSql } from "../fixtures.mjs";
import { assertContainer, cli, cleanEnv, command, CONTAINER, forgetContainer, ORIGIN, ROOT, settings, sql, STACK, WORKDIR } from "../rebuild/stack.mjs";

const artifacts = resolve(import.meta.dirname, "artifacts"); mkdirSync(artifacts, { recursive: true });
const copied = resolve(WORKDIR, "supabase/migrations");
const canonical = resolve(ROOT, "supabase/migrations");
const files = readdirSync(canonical).filter((name) => name.endsWith(".sql")).sort();
assert.equal(files.length, 5);
assert.equal(files[0], "20261013000000_prod_baseline.sql");
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const migrationHashes = Object.fromEntries(files.map((name) => [name, digest(readFileSync(resolve(canonical, name)))]));
const report = { stack: STACK, origin: ORIGIN, oldCommit: "522cbb8", latestCommit: "bdbe95f", productionChanges: false,
  linked: false, apiMock: false, matrix: {}, timingsSeconds: {}, migrationHashes, result: "PENDING" };
const captureSql = readFileSync(resolve(ROOT, "scripts/db/capture-app-catalog.sql"), "utf8");
const PYTHON = process.env.AND_OS_PDF_PYTHON || "C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const parserEnv = { ...cleanEnv(), PYTHONDONTWRITEBYTECODE: "1", PYTHONPATH: "C:/Users/user/Documents/Codex/phase4-sql-tools" };
function save(name, value) { writeFileSync(resolve(artifacts, name), JSON.stringify(value, null, 2) + "\n"); }
async function timed(label, action) {
  const start = performance.now(); try { return await action(); }
  finally { report.timingsSeconds[label] = Math.round((performance.now() - start) / 10) / 100; save("report.json", report); }
}
function compare(label, final = false) {
  const file = resolve(artifacts, `${label}.json`); save(`${label}.json`, JSON.parse(sql(captureSql)));
  const r = command(PYTHON, [resolve(ROOT, "scripts/db/compare-rebuilt-catalog.py"), file, ...(final ? ["--final"] : [])], { cwd: ROOT, env: parserEnv });
  assert.equal(r.status, 0, `Catalog comparison failed: ${label}`); return JSON.parse(r.stdout);
}
function apply() { assert.equal(cli(["migration", "up", "--local"], 120000).status, 0, "Canonical migration replay failed; no manual repair allowed"); }
function childScript(file, env, args = [], timeout = 180000) {
  const r = command(process.execPath, [file, ...args], { env, cwd: ROOT, stdio: "inherit", timeout });
  assert.equal(r.status, 0, `${file.split(/[\\/]/).pop()} failed`);
}
function rowHashes() {
  const tables = JSON.parse(readFileSync(resolve(ROOT, "docs/db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json"), "utf8")).tables;
  return Object.fromEntries(tables.map((t) => [t.name, digest(sql(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) FROM public."${t.name}" t;`))]));
}
async function startApp(env) {
  try { await fetch("http://127.0.0.1:3044/os", { signal: AbortSignal.timeout(700) }); throw new Error("App port already occupied; do not reuse unknown server"); }
  catch (e) { if (e.message.startsWith("App port")) throw e; }
  const child = spawn(process.execPath, [resolve(ROOT, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3044"],
    { cwd: ROOT, env: { ...env, NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: `--import=${pathToFileURL(resolve(WORKDIR, "network-guard.mjs")).href}` }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", () => {}); child.stderr.on("data", () => {});
  for (let n = 0; n < 90; n++) {
    if (child.exitCode !== null) throw new Error("Owned app server exited before readiness");
    try { if ((await fetch("http://127.0.0.1:3044/os", { signal: AbortSignal.timeout(1000), redirect: "error" })).ok) return child; } catch { /* readiness */ }
    await new Promise((done) => setTimeout(done, 1000));
  }
  await stopApp(child); throw new Error("Owned app readiness timeout");
}
async function stopApp(child) {
  if (child?.exitCode === null) {
    const closed = once(child, "exit");
    if (process.platform === "win32") command("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
    else child.kill("SIGTERM");
    await closed;
  }
}
let app;
try {
  console.log("Fresh owned PG17 baseline; no Production connection or copied business rows.");
  if (command("docker", ["inspect", CONTAINER]).status === 0) { assertContainer(); assert.equal(cli(["stop", "--no-backup"], 120000).status, 0); }
  forgetContainer();
  assert(!command("docker", ["volume", "ls", "--format", "{{.Name}}"] ).stdout.split(/\r?\n/).some((v) => v.includes(STACK)));
  mkdirSync(copied, { recursive: true });
  for (const name of readdirSync(copied)) { assert(files.includes(name), "Unknown generated copy"); rmSync(resolve(copied, name)); }
  assert.equal(cli(["start"], 600000).status, 0, "Owned stack start failed; credential output suppressed");
  report.container = assertContainer().id; report.version = sql("SELECT current_setting('server_version');");
  const blank = JSON.parse(sql(captureSql)); assert.equal(blank.tables.length, 0); assert.equal(blank.functions.length, 0);
  copyFileSync(resolve(canonical, files[0]), resolve(copied, files[0])); apply();
  report.oldCatalog = compare("old-baseline");
  const s = settings(), accounts = {};
  for (const a of ACCOUNTS) {
    const headers = { apikey: s.ANON_KEY, Authorization: `Bearer ${s.SERVICE_ROLE_KEY}`, "Content-Type": "application/json" };
    const r = await fetch(`${ORIGIN}/auth/v1/admin/users`, { method: "POST", redirect: "error", headers, body: JSON.stringify({ email: a.email, password: ACCOUNT_PASSWORD, email_confirm: true }) });
    assert.equal(r.status, 200, "Local synthetic account creation failed"); const u = await r.json(); const id = u.id || u.user?.id;
    sql(profileSql(a, id), true);
    const auth = await fetch(`${ORIGIN}/auth/v1/token?grant_type=password`, { method: "POST", redirect: "error", headers: { apikey: s.ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: a.email, password: ACCOUNT_PASSWORD }) });
    assert.equal(auth.status, 200); const session = await auth.json(); accounts[a.label] = { ...a, id, token: session.access_token };
  }
  sql(`SELECT set_config('request.and_os_cost_rpc','on',true);\n${seedSql()}`, true);
  const env = { ...cleanEnv(), AND_OS_DB_TEST: "1", AND_OS_DB_REBUILD: "1", AND_OS_DB_ANON: s.ANON_KEY,
    AND_OS_DB_SERVICE: s.SERVICE_ROLE_KEY, AND_OS_DB_ACCOUNTS: JSON.stringify(accounts),
    SUPABASE_URL: ORIGIN, NEXT_PUBLIC_SUPABASE_URL: ORIGIN, SUPABASE_SERVICE_ROLE_KEY: s.SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY: "" };
  app = await timed("latestAppStartSimulation", () => startApp(env));
  await timed("oldClientBaselineReference", () => childScript(resolve(import.meta.dirname, "old-client.mjs"), env, ["baseline"]));
  report.matrix.A = JSON.parse(readFileSync(resolve(artifacts, "old-client-baseline.json"), "utf8"));
  await timed("latestOldDbSmoke", () => {
    childScript(resolve(import.meta.dirname, "smoke.mjs"), env, ["baseline"]);
    childScript(resolve(WORKDIR, "ui-smoke.mjs"), env);
    copyFileSync(resolve(WORKDIR, "artifacts/ui-report.json"), resolve(artifacts, "latest-ui-baseline.json"));
  });
  report.matrix.C = JSON.parse(readFileSync(resolve(artifacts, "latest-baseline.json"), "utf8"));
  report.oldUi = JSON.parse(readFileSync(resolve(artifacts, "latest-ui-baseline.json"), "utf8"));
  assert.equal(compare("old-after-app").fingerprint, report.oldCatalog.fingerprint);
  const before = rowHashes();
  await timed("forwardMigrations", () => {
    for (const name of files.slice(1)) copyFileSync(resolve(canonical, name), resolve(copied, name));
    apply(); sql("NOTIFY pgrst,'reload schema';");
  });
  const after = rowHashes(); assert.deepEqual(after, before); report.businessFixtureRowsUnchangedByMigration = true;
  report.fixtureTableHashes = after; report.newCatalog = compare("new-canonical", true);
  await new Promise((done) => setTimeout(done, 1000));
  await timed("latestNewDbSmoke", () => {
    childScript(resolve(import.meta.dirname, "smoke.mjs"), env, ["canonical"]);
    childScript(resolve(WORKDIR, "ui-smoke.mjs"), env);
    copyFileSync(resolve(WORKDIR, "artifacts/ui-report.json"), resolve(artifacts, "latest-ui-canonical.json"));
  });
  report.matrix.D = JSON.parse(readFileSync(resolve(artifacts, "latest-canonical.json"), "utf8"));
  report.newUi = JSON.parse(readFileSync(resolve(artifacts, "latest-ui-canonical.json"), "utf8"));
  await timed("oldClientNewDbFailure", () => childScript(resolve(import.meta.dirname, "old-client.mjs"), env, ["canonical"]));
  report.matrix.B = JSON.parse(readFileSync(resolve(artifacts, "old-client-canonical.json"), "utf8"));
  const ownedIds = JSON.parse(sql("SELECT coalesce(json_agg(id ORDER BY id),'[]'::json) FROM public.estimates WHERE project_name LIKE 'SYSTEM_COMPAT_%';"));
  assert.equal(ownedIds.length, 5, "Only this rehearsal's five remaining synthetic estimates may be cleaned");
  assert(ownedIds.every((id) => /^[0-9a-f-]{36}$/i.test(id)));
  const ids = ownedIds.map((id) => `'${id}'`).join(",");
  // Test-only fixture disposal, after preserving migration row/hash evidence.
  sql(`ALTER TABLE public.contract_package_snapshots DISABLE TRIGGER contract_package_state_guard;
    ALTER TABLE public.contract_document_versions DISABLE TRIGGER contract_document_lock_guard;
    DELETE FROM public.os_audit_logs WHERE target_id IN (SELECT id::text FROM public.contract_package_snapshots WHERE estimate_id IN (${ids}));
    DELETE FROM public.contract_document_versions WHERE package_id IN (SELECT id FROM public.contract_package_snapshots WHERE estimate_id IN (${ids}));
    DELETE FROM public.contract_package_snapshots WHERE estimate_id IN (${ids});
    DELETE FROM public.estimate_document_options WHERE estimate_id IN (${ids});
    DELETE FROM public.estimates WHERE id IN (${ids});
    ALTER TABLE public.contract_package_snapshots ENABLE TRIGGER contract_package_state_guard;
    ALTER TABLE public.contract_document_versions ENABLE TRIGGER contract_document_lock_guard;`, true);
  report.rehearsalFixturesCleaned = ownedIds.length;
  assert.equal(compare("after-rehearsal-cleanup", true).fingerprint, report.newCatalog.fingerprint);
  report.suites = [];
  await timed("canonicalExtendedSuites", () => {
    for (const [label, config] of [["Security", "vitest.db.config.mjs"], ["Integrity", "vitest.integrity.config.mjs"], ["Staff Boundary", "vitest.staff.config.mjs"]]) {
      const output = resolve(artifacts, `${label.replaceAll(" ", "-")}.json`);
      childScript(resolve(ROOT, "node_modules/vitest/vitest.mjs"), env, ["run", "--config", config, "--reporter=default", "--reporter=json", `--outputFile=${output}`], 600000);
      const r = JSON.parse(readFileSync(output, "utf8")); assert.equal(r.numFailedTests, 0); assert.equal(r.numPendingTests, 0);
      report.suites.push({ name: label, passed: r.numPassedTests, failed: r.numFailedTests, skipped: r.numPendingTests });
    }
  });
  process.env.AND_OS_DB_REBUILD = "1";
  sql(readFileSync(resolve(WORKDIR, "reset-integrity.sql"), "utf8"), true);
  assert.equal(compare("after-tests", true).fingerprint, report.newCatalog.fingerprint);
  for (const name of files) assert.equal(digest(readFileSync(resolve(canonical, name))), migrationHashes[name]);
  report.strategy = "APP_FIRST"; report.bridgeNeeded = false; report.result = "PASS";
  console.log("Isolated app-first rehearsal PASS; baseline and canonical workflows verified, old staff client failure reproduced.");
} catch (e) { report.result = "FAIL"; console.error(e.message.replace(/(?:eyJ|sb_secret_|sb_publishable_)[A-Za-z0-9._-]+/g, "[REDACTED]")); process.exitCode = 1; }
finally { await stopApp(app); save("report.json", report); }
