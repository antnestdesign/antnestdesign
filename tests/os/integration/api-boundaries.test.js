// @vitest-environment node
import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";
import { TEST_ESTIMATE_ID, TEST_PACKAGE_ID, TEST_USER_ID, testProfile } from "../fixtures/estimates.js";
import { regressionTest } from "../helpers/known-failure.js";
import { jsonResponse, mutations, requestLog, setMockHandler } from "../helpers/network.js";

function apiRequest(path, options = {}) {
  return new NextRequest(`https://os.invalid/api/os${path}`, {
    method: options.method || "GET",
    headers: options.anonymous ? {} : { Authorization: "Bearer test-only-access-token", "Content-Type": "application/json" },
    ...(options.method && options.method !== "GET" ? { body: JSON.stringify(options.body || {}) } : {}),
  });
}

function syntheticPackage() {
  return {
    id: TEST_PACKAGE_ID, estimate_id: TEST_ESTIMATE_ID, package_version: 1, status: "CONTRACTED",
    contract_no: "AND-2026-01-001", source_hash: "synthetic-private-hash",
    created_by: TEST_USER_ID, confirmed_by: TEST_USER_ID, notes: "SYNTHETIC_PRIVATE_NOTE",
    contract_info: { total_amount: 130000, project_name: "SYNTHETIC_API_PROJECT", internalMemo: "PRIVATE" },
    estimate_snapshot: {
      total_price: 130000, costTotal: 100000, marginRate: 30,
      internalDetails: [{ cost: 100000 }], internalSummary: { directCost: 100000 },
      customer_quote: { total: 130000, groups: [] }, quote_items: [],
    },
    parties_info: {}, site_manager: {}, spec_snapshot: [], clause_snapshot: {}, payment_schedule: [],
    contract_document_versions: [{
      id: "50000000-0000-4000-8000-000000000001", document_type: "QUOTE",
      generation_status: "FINAL", package_version: 1,
      content_hash: "synthetic-private-document-hash", created_by: TEST_USER_ID,
      content_json: { document_type: "QUOTE", generated_sections: { total: 130000, groups: [] } },
    }],
  };
}

async function serverAs(profile, { invalidAuth = false, packages = [syntheticPackage()], mutationHandler = null } = {}) {
  vi.resetModules();
  setMockHandler(({ url, method }) => {
    if (method !== "GET") return mutationHandler?.({ url, method }) || null;
    if (url.pathname === "/auth/v1/user") {
      return invalidAuth ? jsonResponse({ error: "synthetic invalid token" }, 401)
        : jsonResponse({ id: TEST_USER_ID, email: "synthetic@example.invalid" });
    }
    if (url.pathname === "/rest/v1/profiles") return jsonResponse([profile]);
    if (url.pathname === "/rest/v1/contract_issued_sources") return jsonResponse([]);
    if (url.pathname === "/rest/v1/contract_package_snapshots") return jsonResponse(packages);
    return null;
  });
  return import("../../../app/api/os/_lib/server.ts");
}

test("P0-2 shared server guard rejects missing Bearer before DB access", async () => {
  const server = await serverAs(testProfile());
  await expect(server.requireAdmin(apiRequest("/users", { anonymous: true }))).rejects.toMatchObject({ status: 401 });
  expect(requestLog.requests).toEqual([]);
});

test("P0-2 real protected GET route returns 401 to anonymous callers", async () => {
  await serverAs(testProfile());
  const route = await import("../../../app/api/os/users/route.ts");
  const response = await route.GET(apiRequest("/users", { anonymous: true }));
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "로그인이 필요합니다." });
  expect(requestLog.requests).toEqual([]);
});

test("P0-2 rejected Auth token returns 401 before profile access", async () => {
  const server = await serverAs(testProfile(), { invalidAuth: true });
  await expect(server.getUserContext(apiRequest("/me"))).rejects.toMatchObject({ status: 401 });
  expect(requestLog.requests).toHaveLength(1);
});

test("P0-2 active admin passes the admin guard after server role lookup", async () => {
  const server = await serverAs(testProfile());
  const context = await server.requireAdmin(apiRequest("/users"));
  expect(context.profile.role).toBe("admin");
  expect(requestLog.requests.map(({ url }) => url.pathname)).toEqual(["/auth/v1/user", "/rest/v1/profiles"]);
});

test.each(["staff", "manager"])("P0-2 %s cannot enter admin-only user API", async (role) => {
  await serverAs(testProfile(role));
  const route = await import("../../../app/api/os/users/route.ts");
  expect((await route.GET(apiRequest("/users"))).status).toBe(403);
  expect(mutations()).toEqual([]);
});

test("P0-2 inactive profile is rejected even with a valid Auth result", async () => {
  const server = await serverAs(testProfile("admin", { is_active: false }));
  await expect(server.getUserContext(apiRequest("/me"))).rejects.toMatchObject({ status: 403 });
});

test("P0-2 active manager can obtain their own read context", async () => {
  const server = await serverAs(testProfile("manager"));
  expect((await server.getUserContext(apiRequest("/me"))).profile.role).toBe("manager");
});

test("P0-2 staff package API strips costs, notes, hashes and actor IDs", async () => {
  await serverAs(testProfile("staff"));
  const route = await import("../../../app/api/os/contract-packages/[id]/route.ts");
  const response = await route.GET(apiRequest(`/contract-packages/${TEST_PACKAGE_ID}?estimateId=${TEST_ESTIMATE_ID}`), {
    params: Promise.resolve({ id: TEST_PACKAGE_ID }),
  });
  expect(response.status).toBe(200);
  const projected = await response.json();
  expect(projected.estimate_snapshot.customer_quote.total).toBe(130000);
  const forbidden = ["source_hash", "content_hash", "created_by", "confirmed_by", "notes", "costTotal", "marginRate", "internalDetails", "internalSummary", "internalMemo"];
  function keysOf(value) {
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).flatMap(([key, child]) => [key, ...keysOf(child)]);
  }
  expect(keysOf(projected).filter((key) => forbidden.includes(key))).toEqual([]);
});

test("P0-2 staff full contract list is rejected without estimate scope", async () => {
  await serverAs(testProfile("staff"));
  const route = await import("../../../app/api/os/contract-packages/route.ts");
  expect((await route.GET(apiRequest("/contract-packages"))).status).toBe(400);
  expect(requestLog.requests.some(({ url }) => url.pathname === "/rest/v1/contract_package_snapshots")).toBe(false);
});

test("P0-2 staff cannot pair a package with a different estimate ID", async () => {
  await serverAs(testProfile("staff"));
  const route = await import("../../../app/api/os/contract-packages/[id]/route.ts");
  const differentId = "10000000-0000-4000-8000-000000000002";
  const response = await route.GET(apiRequest(`/contract-packages/${TEST_PACKAGE_ID}?estimateId=${differentId}`), {
    params: Promise.resolve({ id: TEST_PACKAGE_ID }),
  });
  expect(response.status).toBe(404);
});

test("P0-2 nonexistent package returns 404", async () => {
  await serverAs(testProfile(), { packages: [] });
  const route = await import("../../../app/api/os/contract-packages/[id]/route.ts");
  expect((await route.GET(apiRequest(`/contract-packages/${TEST_PACKAGE_ID}`), {
    params: Promise.resolve({ id: TEST_PACKAGE_ID }),
  })).status).toBe(404);
});

test("P0-2 manager cannot save contract options", async () => {
  await serverAs(testProfile("manager"));
  const route = await import("../../../app/api/os/contract-options/route.ts");
  expect((await route.PUT(apiRequest("/contract-options", { method: "PUT" }))).status).toBe(403);
  expect(mutations()).toEqual([]);
});

test.each(["staff", "manager"])("P0-2 %s cannot confirm a contract", async (role) => {
  await serverAs(testProfile(role));
  const route = await import("../../../app/api/os/contract-packages/[id]/confirm/route.ts");
  expect((await route.POST(apiRequest(`/contract-packages/${TEST_PACKAGE_ID}/confirm`, { method: "POST" }), {
    params: Promise.resolve({ id: TEST_PACKAGE_ID }),
  })).status).toBe(403);
  expect(mutations()).toEqual([]);
});

test("P0-2 manager cannot create a stored contract package", async () => {
  await serverAs(testProfile("manager"));
  const route = await import("../../../app/api/os/contract-packages/route.ts");
  expect((await route.POST(apiRequest("/contract-packages", { method: "POST" }))).status).toBe(403);
  expect(mutations()).toEqual([]);
});

regressionTest("KF-007", "password-change-required account must not reach unrelated admin API", async () => {
  await serverAs(testProfile("admin", { must_change_password: true }));
  const route = await import("../../../app/api/os/users/route.ts");
  const response = await route.GET(apiRequest("/users"));
  expect(requestLog.requests[0].url.pathname).toBe("/auth/v1/user");
  return { response };
}, async ({ response }) => {
  expect(response.status, "H10: password change gate must apply on the server").toBe(403);
  expect(await response.json()).toEqual({ error: "비밀번호 변경 후 이용해 주세요." });
  expect(mutations()).toEqual([]);
});

test.each(["staff", "manager"])("password-change-required %s is blocked by the common context", async (role) => {
  const server = await serverAs(testProfile(role, { must_change_password: true }));
  await expect(server.getUserContext(apiRequest("/me"))).rejects.toMatchObject({
    status: 403, message: "비밀번호 변경 후 이용해 주세요.",
  });
  expect(mutations()).toEqual([]);
});

test("password-change-required admin cannot query contract packages", async () => {
  await serverAs(testProfile("admin", { must_change_password: true }));
  const route = await import("../../../app/api/os/contract-packages/route.ts");
  const response = await route.GET(apiRequest("/contract-packages"));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "비밀번호 변경 후 이용해 주세요." });
  expect(requestLog.requests.some(({ url }) => url.pathname === "/rest/v1/contract_package_snapshots")).toBe(false);
});

test("password-change-required admin cannot mutate cost items", async () => {
  await serverAs(testProfile("admin", { must_change_password: true }));
  const route = await import("../../../app/api/os/cost-items/route.ts");
  const response = await route.POST(apiRequest("/cost-items", { method: "POST" }));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "비밀번호 변경 후 이용해 주세요." });
  expect(mutations()).toEqual([]);
});

test("password-change-required account can still query its own status", async () => {
  await serverAs(testProfile("admin", { must_change_password: true }));
  const route = await import("../../../app/api/os/me/route.ts");
  const response = await route.GET(apiRequest("/me"));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ id: TEST_USER_ID, must_change_password: true });
  expect(mutations()).toEqual([]);
});

test("password-change-required account can complete the existing password endpoint", async () => {
  await serverAs(testProfile("admin", { must_change_password: true }), {
    mutationHandler: ({ url, method }) => {
      if (url.pathname === `/auth/v1/admin/users/${TEST_USER_ID}` && method === "PUT") return jsonResponse({ id: TEST_USER_ID });
      if (url.pathname === "/rest/v1/profiles" && method === "PATCH") return jsonResponse(null);
      if (url.pathname === "/rest/v1/os_audit_logs" && method === "POST") return jsonResponse(null);
      return null;
    },
  });
  const route = await import("../../../app/api/os/auth/change-password/route.ts");
  const response = await route.POST(apiRequest("/auth/change-password", {
    method: "POST", body: { newPassword: "Synthetic-only-123" },
  }));
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
  expect(mutations().map(({ method }) => method)).toEqual(["PUT", "PATCH", "POST"]);
  expect(mutations()[1].body).toEqual({ must_change_password: false });
});
