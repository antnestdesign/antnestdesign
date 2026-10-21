import { createServer, request as proxyRequest } from "node:http";
import { connect, createServer as portServer } from "node:net";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertContainer, settings, cleanEnv, command, ROOT, WORKDIR, ORIGIN } from "./stack.mjs";

assertContainer();
const s = settings();
await new Promise((done, reject) => {
  const probe = portServer(); probe.once("error", reject);
  probe.listen(3044, "127.0.0.1", () => probe.close(done));
});
const storage = readFileSync(resolve(ROOT, "public/os-app/src/storage.js"), "utf8")
  .replace(/const SUPABASE_URL = "[^"]+";/, `const SUPABASE_URL = ${JSON.stringify(ORIGIN)};`)
  .replace(/const SUPABASE_KEY = "[^"]+";/, `const SUPABASE_KEY = ${JSON.stringify(s.ANON_KEY)};`);
if (storage.includes(".supabase.co") || storage.includes("sb_publishable_")) throw new Error("Hosted browser configuration rejected");
const allowed = path => /^\/(?:os(?:\?|$)|os-app\/|api\/os\/|_next\/)/.test(path || "");
const server = createServer((req, res) => {
  if (!allowed(req.url)) { res.writeHead(404); res.end(); return; }
  if (req.url.split("?")[0] === "/os-app/src/storage.js") {
    res.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-store" }); res.end(storage); return;
  }
  const upstream = proxyRequest({ hostname: "127.0.0.1", port: 3044, path: req.url, method: req.method, headers: req.headers }, response => {
    res.writeHead(response.statusCode, { ...response.headers, "Cache-Control": "no-store" }); response.pipe(res);
  });
  upstream.on("error", () => { if (!res.headersSent) res.writeHead(503); res.end("Local preview is starting."); });
  req.pipe(upstream);
});
server.on("upgrade", (req, socket, head) => {
  if (!req.url?.startsWith("/_next/")) { socket.destroy(); return; }
  const upstream = connect(3044, "127.0.0.1", () => {
    upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${req.rawHeaders.reduce((s, v, i) => s + v + (i % 2 ? "\r\n" : ": "), "")}\r\n`);
    if (head.length) upstream.write(head);
    socket.pipe(upstream); upstream.pipe(socket);
  });
  upstream.on("error", () => socket.destroy()); socket.on("error", () => upstream.destroy());
});
await new Promise((done, reject) => { server.once("error", reject); server.listen(3052, "127.0.0.1", done); });
const child = spawn(process.execPath, [resolve(ROOT, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", "3044"], {
  cwd: ROOT, windowsHide: true, stdio: "ignore", env: { ...cleanEnv(), AND_OS_DB_REBUILD: "1", AND_OS_DB_TEST: "1",
    AND_OS_PROJECT_FOUNDATION_MODE: process.env.AND_OS_PROJECT_FOUNDATION_MODE || "OFF",
    SUPABASE_URL: ORIGIN, NEXT_PUBLIC_SUPABASE_URL: ORIGIN, SUPABASE_SERVICE_ROLE_KEY: s.SERVICE_ROLE_KEY,
    SUPABASE_SERVICE_KEY: "", NEXT_TELEMETRY_DISABLED: "1", NODE_OPTIONS: `--import=${pathToFileURL(resolve(WORKDIR, "network-guard.mjs")).href}` },
});
const stop = () => {
  server.close();
  if (child.exitCode === null) command("taskkill", ["/PID", String(child.pid), "/T", "/F"]);
};
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });
child.once("exit", () => { server.close(); });
console.log("Isolated preview: http://127.0.0.1:3052/os (synthetic local DB only)");
