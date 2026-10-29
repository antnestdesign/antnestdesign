import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
const state = vi.hoisted(() => ({ actor: "90000000-0000-4000-8000-000000000001", role: "staff", rpc: vi.fn() }));
vi.mock("../../../app/api/os/_lib/server", () => ({
  ApiError: class extends Error { constructor(status, message) { super(message); this.status = status; } },
  getUserContext: async () => ({ authUser: { id: state.actor }, profile: { role: state.role } }),
  requireServiceRoleKey: () => "synthetic-only-foundation-unit-key",
  supabaseFetch: (...args) => state.rpc(...args),
  json: (data, init) => Response.json(data, init),
  errorResponse: error => Response.json({ error: error.message }, { status: error.status || 500 }),
}));
import { context, handle } from "../../../app/api/os/projects/_lib/foundation.ts";
import { GET as featureState } from "../../../app/api/os/features/project-foundation/route.ts";
const estimateId = "90000000-0000-4000-8000-000000000010";
const projectId = "90000000-0000-4000-8000-000000000011";
const req = body => new Request("http://localhost/api/os", { method: "POST", body: JSON.stringify(body) });
const rpcValue = value => state.rpc.mockImplementation(async path => path.startsWith("/rest/v1/rpc/") ? value : []);
beforeEach(() => { vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", "ON"); state.actor = "90000000-0000-4000-8000-000000000001"; state.role = "staff"; state.rpc.mockReset(); });
afterEach(() => vi.unstubAllEnvs());

const actions = ["projects", "customers", "project", "preview", "get", "events", "create-project", "adopt-project", "start", "save"];
for (const mode of [undefined, "", "OFF", "wrong", "on"]) {
  test.each(actions)(`feature mode ${String(mode)} rejects %s before RPC`, async action => {
    vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", mode);
    const r = await handle(req({}), action, projectId);
    expect(r.status).toBe(503); expect((await r.json()).code).toBe("FOUNDATION_OFF"); expect(state.rpc).not.toHaveBeenCalled();
  });
}
test.each(["create-project", "adopt-project", "start", "save"])("READ_ONLY rejects %s before validation or RPC", async action => {
  vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", "READ_ONLY");
  const r = await handle(req({}), action, projectId);
  expect(r.status).toBe(423); expect((await r.json()).code).toBe("FOUNDATION_READ_ONLY"); expect(state.rpc).not.toHaveBeenCalled();
});
test.each(["projects", "customers", "project", "preview", "get", "events"])("READ_ONLY permits authenticated %s and forwards only server mode", async action => {
  vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", "READ_ONLY");
  rpcValue({ fingerprint: "public", snapshot: {}, project: {}, drafts: [], estimates: [] });
  expect((await handle(req({ estimate_id: estimateId }), action, projectId)).status).toBe(200);
  expect(JSON.parse(state.rpc.mock.calls[0][1].body).p_feature_mode).toBe("READ_ONLY");
});
test.each([undefined, "invalid", "OFF", "READ_ONLY", "ON"])("authenticated discovery is safe and no-store for %s", async mode => {
  vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", mode);
  const r = await featureState(req({}));
  expect(await r.json()).toEqual({ mode: mode === "ON" || mode === "READ_ONLY" ? mode : "OFF" });
  expect(r.headers.get("cache-control")).toBe("no-store"); expect(state.rpc).not.toHaveBeenCalled();
});
test("browser cannot override feature mode in payload", async () => {
  const r = await handle(req({ request_id: projectId, selection: {}, p_feature_mode: "ON" }), "create-project");
  expect(r.status).toBe(400); expect(state.rpc).not.toHaveBeenCalled();
});

test("preview confirmation is encrypted, not a public internal fingerprint", async () => {
  rpcValue({ snapshot: { header: {}, inputs: {} }, fingerprint: "SYNTHETIC_PRIVATE_FINGERPRINT" });
  const response = await handle(req({ estimate_id: estimateId }), "preview");
  const value = await response.json();
  expect(response.status).toBe(200); expect(value.fingerprint).toBeUndefined();
  expect(value.confirmation).not.toContain("SYNTHETIC_PRIVATE_FINGERPRINT");
  expect(JSON.stringify(value)).not.toContain("synthetic-only-foundation-unit-key");
});
test("confirmation cannot be replayed by another actor or on another source", async () => {
  rpcValue({ snapshot: {}, fingerprint: "public-reference" });
  const p = await (await handle(req({ estimate_id: estimateId }), "preview")).json();
  const body = { estimate_id: estimateId, confirmation: p.confirmation, request_id: projectId, title: "준비", selection: { mode: "new", project_name: "합성 현장", customer_mode: "undecided" } };
  state.actor = projectId; state.rpc.mockClear();
  expect((await handle(req(body), "start")).status).toBe(409); expect(state.rpc).not.toHaveBeenCalled();
  state.actor = "90000000-0000-4000-8000-000000000001";
  expect((await handle(req({ ...body, estimate_id: projectId }), "start")).status).toBe(409);
});
test("project confirmation is bound to exact project and explicit acceptance", async () => {
  state.rpc.mockResolvedValue({ project: { id: projectId }, drafts: [], estimates: [], fingerprint: "target-state" });
  const p = await (await handle(new Request("http://localhost/api/os"), "project", projectId)).json();
  state.rpc.mockClear();
  const result = await handle(req({ estimate_id: estimateId, confirmation: "unused", title: "준비", request_id: projectId,
    selection: { mode: "existing", project_id: estimateId, confirmation: p.confirmation, confirmed: true } }), "start");
  expect(result.status).toBe(409); expect(state.rpc).not.toHaveBeenCalled();
});
test("draft scalar validation distinguishes false, zero, empty and missing", () => {
  expect(context({ area_pyeong: 0, customer_undecided: false, client_name: "" })).toEqual({ area_pyeong: 0, customer_undecided: false, client_name: "" });
  expect(context({})).toEqual({});
  for (const bad of [{ cost: 1 }, { area_pyeong: -1 }, { area_pyeong: null }, { client_name: {} }, { customer_undecided: "false" }]) expect(() => context(bad)).toThrow();
});
test("private body and customer selection ambiguity fail before database command", async () => {
  const invalid = await handle(req({ selection: { mode: "new", project_name: "합성", customer_mode: "existing", customer_id: projectId, client_name: "다른 신규 고객" }, request_id: projectId }), "create-project");
  expect(invalid.status).toBe(400); expect(state.rpc).not.toHaveBeenCalled();
  expect((await handle(req({ cost: 1 }), "save", projectId)).status).toBe(400);
});
test("database errors never echo rejected rows or private detail", async () => {
  const { ApiError } = await import("../../../app/api/os/_lib/server");
  state.rpc.mockRejectedValue(new ApiError(400, JSON.stringify({ code: "23514", message: "constraint failed", details: "SYNTHETIC_PRIVATE_ROW" })));
  const response = await handle(new Request("http://localhost/api/os"), "projects");
  expect(response.status).toBe(409); expect(await response.text()).not.toContain("SYNTHETIC_PRIVATE");
});
test("frozen reference whitelist contains public calculation inputs, not UI-only estimate status", () => {
  const migration = readFileSync("supabase/migrations/20261019000000_project_detailed_foundation.sql", "utf8");
  const csv = migration.match(/'projectName,areaPyeong,[^']+'/)[0].slice(1, -1).split(",");
  expect(csv).toEqual(Object.keys(ESTIMATE_INPUT_SCHEMA).filter(id => !PRIVATE_ESTIMATE_INPUTS.includes(id) && id !== "estimateStatus"));
  expect(csv).not.toContain("estimateStatus");
  expect(ESTIMATE_INPUT_SCHEMA.estimateStatus).toMatchObject({ type: "select", value: "견적" });
});

test.each(["legacy", "foundation", "both"])("preview discovers established %s project connection without modifying source semantics", async kind => {
  state.rpc.mockImplementation(async path => {
    if (path.startsWith('/rest/v1/rpc/')) return { snapshot: { header: { total_price: 3770000 } }, fingerprint: 'unchanged-source' };
    if (path.startsWith('/rest/v1/estimates?')) return [{ project_id: kind === 'foundation' ? null : projectId }];
    if (path.startsWith('/rest/v1/project_preliminary_estimates?')) return kind === 'legacy' ? [] : [{ project_id: projectId }];
    return kind === 'legacy' ? [] : [{ project_id: projectId, detailed_estimate_id: estimateId }];
  });
  const r = await handle(req({ estimate_id: estimateId }), 'preview'); const body = await r.json();
  expect(r.status).toBe(200); expect(body.connection.project_id).toBe(projectId);
  expect(body.snapshot).toEqual({ header: { total_price: 3770000 } });
  expect(state.rpc.mock.calls.slice(1).every(([,o]) => o === undefined)).toBe(true);
  expect(JSON.stringify(body)).not.toContain('unchanged-source');
});

test("conflicting established links return safe 409 instead of proposing another project", async () => {
  state.rpc.mockImplementation(async path => path.startsWith('/rest/v1/rpc/') ? { snapshot: {}, fingerprint: 'private' }
    : path.startsWith('/rest/v1/estimates?') ? [{ project_id: projectId }]
    : path.startsWith('/rest/v1/project_preliminary_estimates?') ? [{ project_id: estimateId }] : []);
  const r = await handle(req({ estimate_id: estimateId }), 'preview');
  expect(r.status).toBe(409); expect((await r.json()).code).toBe('PROJECT_LINK_CONFLICT');
});
