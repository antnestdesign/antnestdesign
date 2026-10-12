import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLocalFetch, TEST_CONTAINER, TEST_ORIGIN } from "./guard.mjs";
import { seedSql } from "./fixtures.mjs";

export const ROOT = resolve(import.meta.dirname, "../../..");

export function executeSql(source, transaction = true) {
  const result = spawnSync("docker", ["exec", "-i", TEST_CONTAINER,
    "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-Atq"], {
    input: transaction ? `begin;\n${source}\ncommit;` : source,
    encoding: "utf8", timeout: 30000, windowsHide: true,
  });
  if (result.status !== 0 || result.error) {
    const detail = result.stderr?.split("\n").find((line) => line.trim().startsWith("ERROR:"));
    throw new Error(`Isolated Test DB SQL failed; transaction not committed${detail ? ` (${detail.trim()})` : ""}`);
  }
  return result.stdout.trim();
}

export function dbFile(file) { return readFileSync(resolve(ROOT, "tests/os/db", file), "utf8"); }

export function resetFixtures() {
  executeSql(`${dbFile("reset.sql")}\n${seedSql()}`);
}

export function dbRuntime() {
  if (process.env.AND_OS_DB_TEST !== "1" || !process.env.AND_OS_DB_ANON || !process.env.AND_OS_DB_SERVICE) {
    throw new Error("BLOCKED — LOCAL SUPABASE REQUIRED: use npm run test:db");
  }
  const accounts = JSON.parse(process.env.AND_OS_DB_ACCOUNTS || "{}");
  const localFetch = createLocalFetch(globalThis.fetch);
  async function request(path, { method = "GET", body, account, service = false } = {}) {
    const key = service ? process.env.AND_OS_DB_SERVICE : process.env.AND_OS_DB_ANON;
    const token = service ? key : accounts[account]?.token || key;
    const response = await localFetch(`${TEST_ORIGIN}${path}`, {
      method, headers: { apikey: key, Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", Prefer: "return=representation" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  }
  return { accounts, request };
}
