import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { vi } from "vitest";
import { clone, estimateRow, testProfile, testSession } from "../fixtures/estimates.js";
import { clearRequestLog, jsonResponse, setMockHandler } from "./network.js";
import { projectStaffEstimate, privateEstimateDefaults, calculatePrivilegedEstimate } from "../../../app/api/os/estimates/_lib/estimates.js";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";

const html = readFileSync(resolve("public/os-app/index.html"), "utf8");

export function createEstimateDatabase(estimate, packages = []) {
  const database = {
    row: estimateRow(estimate),
    packages: clone(packages),
    mutations: [],
  };
  database.handle = async ({ url, method, body }) => {
    if(url.pathname==='/api/os/estimates/calculate'){
      if(!['admin','manager'].includes(database.profile?.role))return jsonResponse({error:'권한이 없습니다.'},403);
      if(method==='GET')return jsonResponse({defaults:privateEstimateDefaults()});
      return jsonResponse(await calculatePrivilegedEstimate(body,{authUser:{id:database.profile.id},profile:database.profile}));
    }
    if (url.pathname === "/api/os/estimates" && method === "GET") return jsonResponse(database.row ? [projectStaffEstimate(database.row)] : []);
    if (url.pathname === `/api/os/estimates/${database.row?.id}` && method === "GET") return jsonResponse(projectStaffEstimate(database.row));
    if (method === "POST" && url.pathname === "/api/os/estimates/preview") {
      const full = createEstimateCalculation().applyExistingPipeCleaningAdjustment(database.row.estimate_data, body.inputs.existingPipeCleaningEnabled);
      return jsonResponse(projectStaffEstimate({ ...database.row, total_price: full.total, estimate_data: full }));
    }
    if (method === "PATCH" && url.pathname === `/api/os/estimates/${database.row?.id}`) {
      const full = createEstimateCalculation().applyExistingPipeCleaningAdjustment(database.row.estimate_data, body.inputs.existingPipeCleaningEnabled);
      database.row = { ...database.row, total_price: full.total, cost_total: full.costTotal, estimate_data: full };
      database.mutations.push({ method, body: clone(body) });
      return jsonResponse(projectStaffEstimate(database.row));
    }
    if (url.pathname === "/rest/v1/estimates") {
      if (method === "GET") return jsonResponse(database.row ? [clone(database.row)] : []);
      if (method === "HEAD") return new Response(null, { headers: { "content-range": "0-0/1" } });
      if (method === "PATCH") {
        database.mutations.push({ method, body: clone(body) });
        database.row = { ...database.row, ...clone(body) };
        return jsonResponse([clone(database.row)]);
      }
      if (method === "DELETE") {
        database.mutations.push({ method });
        database.row = null;
        return new Response(null, { status: 204 });
      }
    }
    if (method !== "GET") return null;
    if (url.pathname === "/api/os/features/project-foundation") return jsonResponse({ mode: "OFF" });
    if (url.pathname === "/api/os/me") return jsonResponse(database.profile || testProfile());
    if (url.pathname === "/rest/v1/cost_items") {
      return jsonResponse([{
        id: "40000000-0000-4000-8000-000000000001", item_code: "DEMO_CABINET_PER_JA",
        item_name: "합성 가구 철거", category: "철거", unit: "자", cost_price: 25000,
        default_margin_rate: 0.3, is_active: true, is_pending_new: false, sort_order: 1,
        draft_cost_price: null, draft_margin_rate: null, draft_is_active: null,
      }]);
    }
    if (["/rest/v1/cost_item_history", "/rest/v1/cost_publish_log", "/api/os/users", "/api/os/audit-logs"].includes(url.pathname)) {
      return jsonResponse([]);
    }
    if (url.pathname === "/api/os/contract-options") {
      return jsonResponse({ estimate_id: database.row?.id || null });
    }
    if (url.pathname === "/api/os/contract-packages") return jsonResponse(clone(database.packages));
    return null;
  };
  return database;
}

export async function mountOs(database, profile = null) {
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','synthetic-network-mock-only');
  vi.resetModules();
  sessionStorage.clear();
  document.open();
  document.write(html);
  document.close();
  database.profile = profile;
  setMockHandler(database.handle);
  const main = await import("../../../public/os-app/src/main.js");
  const storage = await import("../../../public/os-app/src/storage.js");
  if (profile) {
    sessionStorage.setItem("and-os.auth-session", JSON.stringify(testSession(profile.role)));
    storage.loadStoredSession();
    await storage.loadCurrentOsUser();
    await main.enterAuthenticatedApp(profile);
    if (["admin", "manager"].includes(profile.role)) await main.ensureServerCalculation();
  }
  await flushAsyncWork();
  clearRequestLog();
  return { main, storage };
}

export async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}
