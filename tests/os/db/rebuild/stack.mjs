import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dirname, "../../../..");
export const WORKDIR = resolve(import.meta.dirname);
export const STACK = "and-os-migration-rebuild-test";
export const CONTAINER = `supabase_db_${STACK}`;
export const ORIGIN = "http://127.0.0.1:56321";

export function cleanEnv() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/SUPABASE|DATABASE|^PG|^VERCEL|^NEXT_PUBLIC/.test(key)));
}

export function command(exe, args, options = {}) {
  return spawnSync(exe, args, { encoding: "utf8", windowsHide: true, timeout: 30000, ...options });
}

export function cli(args, timeout = 30000) {
  if (existsSync(resolve(WORKDIR, "supabase/.temp/project-ref"))) throw new Error("Hosted project link prohibited");
  const config = readFileSync(resolve(WORKDIR, "supabase/config.toml"), "utf8");
  if (!config.includes(`project_id = "${STACK}"`) || !config.includes("major_version = 17")) throw new Error("Stack config mismatch");
  const meta = JSON.parse(readFileSync(resolve(ROOT, "node_modules/supabase/package.json"), "utf8"));
  const entry = typeof meta.bin === "string" ? meta.bin : meta.bin.supabase;
  const env = { ...cleanEnv(), SUPABASE_HOME: resolve(WORKDIR, ".supabase") };
  return command(process.execPath, [resolve(ROOT, "node_modules/supabase", entry), ...args, "--workdir", WORKDIR], { env, cwd: WORKDIR, timeout });
}

let validatedContainer;
export function assertContainer() {
  const result = command("docker", ["inspect", CONTAINER]);
  if (result.status !== 0) throw new Error("Dedicated rebuild container missing");
  const [container] = JSON.parse(result.stdout);
  if (container.Name !== `/${CONTAINER}` || !container.Config.Image.includes("supabase/postgres:17.")
    || container.HostConfig.PortBindings["5432/tcp"]?.[0]?.HostPort !== "56322") throw new Error("Not the owned PG17 rebuild container");
  const volumes = container.Mounts.filter((m) => m.Type === "volume").map((m) => m.Name);
  if (!volumes.some((name) => name.includes(STACK))) throw new Error("Owned volume identity missing");
  if (validatedContainer && validatedContainer !== container.Id) throw new Error("Container changed during verification");
  validatedContainer = container.Id;
  return { id: container.Id, image: container.Config.Image, volumes };
}

export function forgetContainer() { validatedContainer = undefined; }

export function sql(source, transaction = false) {
  assertContainer();
  const result = command("docker", ["exec", "-i", CONTAINER, "psql", "-U", "postgres", "-d", "postgres", "-Atq", "-v", "ON_ERROR_STOP=1"],
    { input: transaction ? `BEGIN; SET LOCAL and_os.test_stack='${STACK}';\n${source}\nCOMMIT;` : source });
  if (result.status !== 0) throw new Error(result.stderr.split("\n").filter((line) => /ERROR:|DETAIL:|HINT:/.test(line)).join("\n") || "Owned rebuild SQL failed");
  return result.stdout.trim();
}

export function settings() {
  assertContainer();
  const result = cli(["status", "-o", "json"]);
  if (result.status !== 0) throw new Error("Local CLI status unavailable");
  const value = JSON.parse(result.stdout);
  if (value.API_URL !== ORIGIN || !value.ANON_KEY || !value.SERVICE_ROLE_KEY) throw new Error("Local origin/key mismatch");
  return value; // In memory only; never log or persist credentials.
}
