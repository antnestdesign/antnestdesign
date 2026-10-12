import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ACCOUNTS, ACCOUNT_PASSWORD, profileSql } from "./fixtures.mjs";
import { createLocalFetch, TEST_ORIGIN } from "./guard.mjs";
import { dbFile, executeSql, resetFixtures, ROOT } from "./runtime.mjs";

const workdir = resolve(ROOT, "tests/os/db");
const staffMode = process.argv.includes("--staff");
const integrityMode = process.argv.includes("--integrity") || staffMode;
function command(exe, args, options = {}) {
  return spawnSync(exe, args, { encoding: "utf8", windowsHide: true, timeout: 30000, ...options });
}
function supabaseCommand(args, options = {}) {
  const packageDir = resolve(ROOT, "node_modules/supabase");
  let metadata;
  try { metadata = JSON.parse(readFileSync(resolve(packageDir, "package.json"), "utf8")); } catch {
    return { status: null, stdout: "" };
  }
  const entry = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.supabase;
  if (!entry) return { status: null, stdout: "" };
  const env = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => !key.startsWith("SUPABASE_") && !key.startsWith("NEXT_PUBLIC_SUPABASE_")));
  env.SUPABASE_HOME = resolve(workdir, ".supabase");
  return command(process.execPath, [resolve(packageDir, entry), ...args], { ...options, cwd: workdir, env });
}
const cli = supabaseCommand(["--version"]);
if (cli.status !== 0) {
  console.log("BLOCKED — LOCAL SUPABASE REQUIRED: project-local CLI missing or not executable. No DB requests made.");
  process.exit(2);
}
const docker = command("docker", ["version", "--format", "{{.Server.Version}}"]);
if (docker.status !== 0) {
  console.log("BLOCKED — DOCKER DAEMON NOT RUNNING: Docker command/daemon unavailable. No stack start or DB requests made.");
  process.exit(2);
}
if (!/^2\./.test(cli.stdout.trim())) {
  console.log("BLOCKED — LOCAL SUPABASE REQUIRED: Docker-based Supabase CLI v2 required; unverified runtime is not used.");
  process.exit(2);
}
if (process.argv.includes("--start")) {
  const result = supabaseCommand(["start", "--workdir", workdir], { timeout: 600000 });
  // CLI output can contain local credentials; never echo it.
  console.log(result.status === 0 ? "Dedicated local test stack started." : "Local stack start failed; no credentials printed.");
  process.exit(result.status === 0 ? 0 : 2);
}

const status = supabaseCommand(["status", "--workdir", workdir, "-o", "json"]);
if (status.status !== 0) {
  console.log("BLOCKED — LOCAL SUPABASE REQUIRED: run npm run test:db:start first.");
  process.exit(2);
}
let settings;
try { settings = JSON.parse(status.stdout); } catch {
  console.log("BLOCKED: unsupported local CLI status format; no connection attempted.");
  process.exit(2);
}
if (settings.API_URL !== TEST_ORIGIN || !settings.ANON_KEY || !settings.SERVICE_ROLE_KEY) {
  console.log("BLOCKED: local test origin/keys mismatch; hosted or alternate endpoints are not accepted.");
  process.exit(2);
}

const localFetch = createLocalFetch(globalThis.fetch);
const createdUsers = [];
async function auth(path, body, token = settings.SERVICE_ROLE_KEY, method = "POST") {
  if (method === "DELETE" && body === undefined) body = { should_soft_delete: false };
  let response;
  for (let attempt = 0; attempt < (method === "DELETE" ? 2 : 1); attempt += 1) {
    try {
      response = await localFetch(`${TEST_ORIGIN}/auth/v1/${path}`, {
        method, headers: { apikey: settings.ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Connection: "close" },
        signal: AbortSignal.timeout(15000),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      break;
    } catch (error) {
      const code = error.cause?.code || error.name;
      if (method === "DELETE" && attempt === 0 && ["UND_ERR_SOCKET", "ECONNRESET", "EPIPE"].includes(code)) {
        // Only idempotent deletion of our exact fixture UUID is retried.
        console.log(`Local fixture DELETE transient ${code}; retry once.`);
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));
        continue;
      }
      throw new Error(`Local Auth ${method} transport failed (${code}); no credential dump`);
    }
  }
  if (method === "DELETE" && response.status === 404) return null;
  if (!response.ok) throw new Error(`Local Auth fixture operation failed (${response.status}); no response/credential dump`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

let exitCode = 1;
let schemaReady = false;
try {
  executeSql(dbFile("bootstrap.sql"));
  const source = readFileSync(resolve(ROOT, "supabase/cost_items.sql"), "utf8");
  const seedStart = source.indexOf("insert into public.cost_items (");
  if (seedStart < 0) throw new Error("Repository cost DDL boundary changed; refusing partial extraction");
  // Original role helpers and cost DDL/policies, without catalog price seeds.
  executeSql(source.slice(0, seedStart));
  // Exact captured functions/schema/ACL first; no operating prices or row data.
  executeSql(dbFile("production/cost-schema.CAPTURED.sql"));
  const captured = JSON.parse(readFileSync(resolve(ROOT, "docs/db-baseline/AND_OS_PROD_COST_SCHEMA_2026-10-12.json"), "utf8"));
  const names = captured.functions.map((row) => {
    if (!/^[a-z_0-9]+$/.test(row.name)) throw new Error("Unexpected captured function name");
    return `'${row.name}'`;
  }).join(",");
  const installed = JSON.parse(executeSql(`select jsonb_agg(jsonb_build_object(
    'name',p.proname,'identity_arguments',pg_get_function_identity_arguments(p.oid),
    'arguments',pg_get_function_arguments(p.oid),'return_type',pg_get_function_result(p.oid),
    'definition',pg_get_functiondef(p.oid),'security_definer',p.prosecdef,'proconfig',p.proconfig,
    'volatility',p.provolatile,'acl',coalesce(p.proacl,acldefault('f',p.proowner))))
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (${names});`));
  const normalizeDefinition = (value) => value.replaceAll("\r\n", "\n").split("\n").map((line) => line.trim()).join("\n").trim();
  for (const original of captured.functions) {
    const local = installed.find((row) => row.name === original.name && row.identity_arguments === original.identity_arguments);
    if (!local || normalizeDefinition(local.definition) !== normalizeDefinition(original.definition)
      || ["arguments", "return_type", "security_definer", "volatility", "proconfig"].some((key) => JSON.stringify(local[key]) !== JSON.stringify(original[key]))
      || JSON.stringify([...local.acl].sort()) !== JSON.stringify([...original.effective_acl].sort())) {
      throw new Error(`Captured source replay mismatch: ${original.name}; no fixture suite started`);
    }
  }
  console.log(`Captured production definitions/signatures/function ACL verified locally: ${captured.functions.length}; no production RPC execution.`);
  executeSql(dbFile("patches/cost-rpc.PROPOSED_CANONICAL.sql"));
  executeSql(readFileSync(resolve(ROOT, "supabase/rfc_cost_draft_rpc_hardening_hotfix.sql"), "utf8"));
  executeSql(readFileSync(resolve(ROOT, "supabase/rfc_006_contract_documents.sql"), "utf8"));
  executeSql(dbFile("patches/contract-manifest-lock.PROPOSED.sql"));
  if (integrityMode) executeSql(readFileSync(resolve(ROOT, "supabase/rfc_003f_audit_log.sql"), "utf8"));
  schemaReady = true;
  if (integrityMode) executeSql(dbFile("integrity/reset.sql"));
  executeSql(dbFile("reset.sql"));

  const existing = await auth("admin/users?page=1&per_page=1000", undefined, settings.SERVICE_ROLE_KEY, "GET");
  for (const user of existing.users || []) {
    if (ACCOUNTS.some(({ email }) => email === user.email)) {
      // Only our exact synthetic fixture accounts may be replaced.
      await auth(`admin/users/${user.id}`, undefined, settings.SERVICE_ROLE_KEY, "DELETE");
    }
  }
  const accounts = {};
  for (const account of ACCOUNTS) {
    const result = await auth("admin/users", { email: account.email, password: ACCOUNT_PASSWORD, email_confirm: true });
    const id = result.id || result.user?.id;
    if (!id) throw new Error("Local Auth fixture UUID missing");
    createdUsers.push(id);
    executeSql(profileSql(account, id));
    const session = await auth("token?grant_type=password", { email: account.email, password: ACCOUNT_PASSWORD }, settings.ANON_KEY);
    if (!session.access_token) throw new Error("Local fixture JWT missing");
    accounts[account.label] = { ...account, id, token: session.access_token };
  }

  // Probe repository helper definitions before applying the test candidate.
  executeSql("notify pgrst, 'reload schema';");
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
  for (const label of ["admin-inactive", "admin-must-change-password"]) {
    const response = await localFetch(`${TEST_ORIGIN}/rest/v1/rpc/current_and_os_role`, {
      method: "POST", headers: { apikey: settings.ANON_KEY, Authorization: `Bearer ${accounts[label].token}`, "Content-Type": "application/json", Connection: "close" }, body: "{}",
    });
    if (!response.ok) throw new Error("Repository helper probe failed");
    const role = await response.json();
    console.log(`Repository helper probe ${label}: ${role === "admin" ? "ACCOUNT-STATE GAP OBSERVED" : "not admin"}`);
  }

  executeSql(dbFile("patches/role-boundaries.PROPOSED.sql"));
  executeSql("notify pgrst, 'reload schema';");
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 1000));
  const env = { ...process.env, AND_OS_DB_TEST: "1", AND_OS_DB_ANON: settings.ANON_KEY,
    AND_OS_DB_SERVICE: settings.SERVICE_ROLE_KEY, AND_OS_DB_ACCOUNTS: JSON.stringify(accounts),
    SUPABASE_URL: TEST_ORIGIN, NEXT_PUBLIC_SUPABASE_URL: TEST_ORIGIN,
    SUPABASE_SERVICE_ROLE_KEY: settings.SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY: "",
  };
  for (let run = 1; run <= 2; run += 1) {
    if (integrityMode) executeSql(dbFile("integrity/reset.sql"));
    resetFixtures();
    console.log(`Isolated candidate DB ${staffMode ? "staff runtime" : integrityMode ? "integrity" : "security"} run ${run}/2 (not production policies).`);
    const result = command(process.execPath, [resolve(ROOT, "node_modules/vitest/vitest.mjs"), "run", "--config", staffMode ? "vitest.staff.config.mjs" : integrityMode ? "vitest.integrity.config.mjs" : "vitest.db.config.mjs"], {
      cwd: ROOT, env, stdio: "inherit", timeout: 180000,
    });
    if (result.status !== 0) throw new Error("DB security suite failed; candidate is not verified");
  }
  exitCode = 0;
} catch (error) {
  console.error(error.message);
} finally {
  try {
    if (schemaReady) {
      if (integrityMode) executeSql(dbFile("integrity/reset.sql"));
      executeSql(dbFile("reset.sql"));
    }
    for (const id of createdUsers) await auth(`admin/users/${id}`, undefined, settings.SERVICE_ROLE_KEY, "DELETE");
  } catch (error) {
    console.error(`Test fixture cleanup failed: ${error.message}`);
    exitCode = 1;
  }
}
process.exit(exitCode);
