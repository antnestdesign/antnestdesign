import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { cleanEnv, command, ORIGIN, ROOT, WORKDIR } from "../rebuild/stack.mjs";

const sentinel = "SYSTEM_COMPAT_PRIVATE_SERVER_SENTINEL";
const env = { ...cleanEnv(), AND_OS_DB_REBUILD: "1", SUPABASE_URL: ORIGIN, NEXT_PUBLIC_SUPABASE_URL: ORIGIN,
  SUPABASE_SERVICE_ROLE_KEY: sentinel, SUPABASE_SERVICE_KEY: "", NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: `--import=${pathToFileURL(resolve(WORKDIR, "network-guard.mjs")).href}` };
const result = command(process.execPath, [resolve(ROOT, "node_modules/next/dist/bin/next"), "build"],
  { cwd: ROOT, env, stdio: "inherit", timeout: 600000 });
assert.equal(result.status, 0, "Isolated production build failed");
let scanned = 0;
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) scan(path);
    else {
      scanned++;
      assert(!readFileSync(path).includes(Buffer.from(sentinel)), "Server credential sentinel leaked into client artifact");
    }
  }
}
scan(resolve(ROOT, ".next/static"));
scan(resolve(ROOT, "public/os-app"));
writeFileSync(resolve(import.meta.dirname, "artifacts/bundle-boundary.json"), JSON.stringify({
  result: "PASS", build: "PASS", clientFilesScanned: scanned, serverSentinelExposure: 0,
  productionCredentialsLoaded: false, hostedFetchAllowed: false, realProductionEnvValuesInspected: false,
}, null, 2) + "\n");
console.log(`Client bundle boundary PASS: ${scanned} files; server-only canary absent.`);
