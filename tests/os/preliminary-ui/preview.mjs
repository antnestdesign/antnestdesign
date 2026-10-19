import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { latestEstimate, estimateRow, testProfile, testSession } from "../fixtures/estimates.js";
import { customerQuoteProjection } from "../../../public/os-app/src/customer-quote.js";
import { staffEstimateInputs, ESTIMATE_INPUT_SCHEMA } from "../../../public/os-app/src/estimate-inputs.js";
import { createEstimateCalculation } from "../../../public/os-app/src/calculator/estimate-core.js";

const root = resolve(fileURLToPath(new URL("../../../public", import.meta.url)));
const roles = ["admin", "manager", "staff"];
function projectStaffEstimate(row) {
  const estimate = row.estimate_data;
  return { id: row.id, projectName: row.project_name, clientName: row.client_name, phone: row.phone,
    address: row.address, areaPyeong: row.area_pyeong, status: row.status, savedAt: row.created_at,
    total: row.total_price, totalText: estimate.totalText,
    inputs: staffEstimateInputs({ ...Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id, field]) => [id, field.value])), ...estimate.inputs }),
    customerQuote: customerQuoteProjection(estimate.customerQuote) };
}
// A loopback-only, in-memory fixture server. No environment files or database connections.
export async function startPreview(port = 0) {
  const databases = Object.fromEntries(roles.map(role => [role, estimateRow(latestEstimate())]));
  const writes = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    const send = (value, status = 200) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify(value));
    };
    const role = roles.find(role => req.headers.authorization === `Bearer test-only-${role}`) || "admin";
    const row = databases[role];
    try {
      if (url.pathname === "/os" || url.pathname === "/") {
        res.writeHead(302, { location: `/os-app/index.html${url.search}` });
        return res.end();
      }
      if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rest/")) {
        let body = "";
        for await (const chunk of req) body += chunk;
        const input = body ? JSON.parse(body) : null;
        if (["POST", "PATCH", "DELETE"].includes(req.method)) writes.push({ method: req.method, path: url.pathname, role });
        if (url.pathname === "/api/os/me") return send(testProfile(role));
        if (url.pathname === "/rest/v1/estimates") {
          if (req.method === "HEAD") { res.writeHead(200, { "content-range": "0-0/1" }); return res.end(); }
          if (req.method === "PATCH") Object.assign(row, input);
          return send([row]);
        }
        if (url.pathname === "/api/os/estimates/preview") {
          const estimate = createEstimateCalculation().applyExistingPipeCleaningAdjustment(row.estimate_data, input.inputs.existingPipeCleaningEnabled);
          return send(projectStaffEstimate({ ...row, estimate_data: estimate, total_price: estimate.total }));
        }
        if (url.pathname === "/api/os/estimates") return send([projectStaffEstimate(row)]);
        if (url.pathname === `/api/os/estimates/${row.id}`) return send(projectStaffEstimate(row));
        if (url.pathname === "/api/os/contract-options") return send({ estimate_id: row.id });
        if (url.pathname === "/rest/v1/cost_items") return send([{ id: "40000000-0000-4000-8000-000000000001", item_code: "DEMO_CABINET_PER_JA", item_name: "합성 가구 철거", category: "철거", unit: "자", cost_price: 25000, default_margin_rate: 0.3, is_active: true, is_pending_new: false, sort_order: 1, draft_cost_price: null, draft_margin_rate: null, draft_is_active: null }]);
        if (["/api/os/contract-packages", "/api/os/users", "/api/os/audit-logs", "/rest/v1/cost_item_history", "/rest/v1/cost_publish_log"].includes(url.pathname)) return send([]);
        return send({ error: "Unregistered synthetic request" }, 404);
      }
      const pathname = decodeURIComponent(url.pathname);
      const path = resolve(root, `.${pathname}`);
      const within = relative(root, path);
      if (within.startsWith("..") || /(^|[/\\])\./.test(within)) return send({}, 404);
      let content = await readFile(path);
      const type = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" }[extname(path)] || "application/octet-stream";
      if (path.endsWith("storage.js")) content = content.toString("utf8")
        .replace(/const SUPABASE_URL = "[^"]+";/, "const SUPABASE_URL = location.origin;")
        .replace(/const SUPABASE_KEY = "[^"]+";/, 'const SUPABASE_KEY = "synthetic-public-key";');
      if (path.endsWith("index.html")) {
        const previewRole = roles.includes(url.searchParams.get("role")) ? url.searchParams.get("role") : "admin";
        const session = { ...testSession(previewRole), access_token: `test-only-${previewRole}` };
        content = content.toString("utf8").replace("<head>", `<head><script>sessionStorage.setItem("and-os.auth-session", ${JSON.stringify(JSON.stringify(session))});window.print=()=>{document.body.dataset.syntheticPrint="ready";};</script>`);
      }
      res.writeHead(200, { "content-type": `${type}; charset=utf-8`, "cache-control": "no-store", "content-security-policy": "connect-src 'self'; frame-src 'self'" });
      res.end(content);
    } catch { send({ error: "Synthetic preview resource unavailable" }, 404); }
  });
  await new Promise(done => server.listen(port, "127.0.0.1", done));
  return { server, origin: `http://127.0.0.1:${server.address().port}`, writes,
    close: () => new Promise(done => server.close(done)) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { origin } = await startPreview(Number(process.env.AND_OS_PREVIEW_PORT) || 3051);
  console.log(`Synthetic UI preview: ${origin}/os (in-memory only; no Production connection)`);
}
