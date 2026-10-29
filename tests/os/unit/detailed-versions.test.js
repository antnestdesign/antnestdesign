import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { calculateEditor, emptyEditor } from "../../../app/api/os/projects/_lib/editor-model.ts";
import { renderDetailedVersion } from "../../../public/os-app/src/detailed-version-print.js";
const state = vi.hoisted(() => ({ role: "manager", actor: "90000000-0000-4000-8000-000000000001", rpc: vi.fn() }));
vi.mock("../../../app/api/os/_lib/server", () => ({
  ApiError: class extends Error { constructor(status, message) { super(message); this.status = status; } },
  getUserContext: async () => ({ authUser: { id: state.actor }, profile: { role: state.role } }),
  requireServiceRoleKey: () => "synthetic-only-issue-test",
  supabaseFetch: (...args) => state.rpc(...args), json: (data, init) => Response.json(data, init),
  errorResponse: error => Response.json({ error: error.message }, { status: error.status || 500 }),
}));
import { ISSUE_COMPANY, validateIssuable, versionsRoute } from "../../../app/api/os/projects/_lib/versions.ts";
const head = "90000000-0000-4000-8000-000000000010", requestId = "90000000-0000-4000-8000-000000000011";
function fixture() {
  const e = emptyEditor(); e.items = [{ id: "item-1", trade: "furniture", spaceId: e.spaces[0].id, name: "합성 가구", spec: "규격", unit: "식", quantity: 2.5, saleUnitPrice: 100001, memo: "비고", masterCode: "", kind: "quantity", basis: "manual", parentId: "", excluded: false }];
  e.addition = 500; e.discount = 200;
  const result = calculateEditor(e, undefined, [], "admin", { items: { "item-1": { costUnit: 75000 } } });
  return { editor: result.publicEditor, internal: result.internal, context: { project_name: "합성 현장", client_name: "합성 고객", address: "합성 주소", phone: "", customer_undecided: false }, revision: 2 };
}
const req = (body, method = "POST") => new Request("http://localhost/api/os/versions", { method, ...(method === "GET" ? {} : { body: JSON.stringify(body) }) });
beforeEach(() => {
  vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", "ON"); state.role = "manager"; state.actor = "90000000-0000-4000-8000-000000000001";
  state.rpc.mockReset().mockImplementation(async (path, options) => {
    if (path.includes("detailed_estimate_references?")) return [{ reference_public_json: { inputs: { sectionWallpaperEnabled: false }, customerQuote: { groups: [] } }, source_estimate_id: head }];
    if (path.endsWith("and_os_5b_editor")) return fixture();
    const args = JSON.parse(options.body);
    if (args.p_action === "preview") return { document: { company: ISSUE_COMPANY, ...fixture() }, fingerprint: "a".repeat(64), revision: 2 };
    return { id: requestId, version: 1, quoteNumber: "AND-Q-2026-000001", company: ISSUE_COMPANY, ...fixture() };
  });
});
afterEach(() => vi.unstubAllEnvs());
test("issue uses saved amount and single supply adjustment, never looks up current masters", async () => {
  const r = await versionsRoute(req({ expected_revision: 2 }), head, "preview"), prepared = await r.json();
  expect(r.status).toBe(200); expect(prepared.document.editor.summary).toMatchObject({ supply: 250000, vat: 25000, total: 275000 });
  expect(prepared.confirmation).not.toContain("a".repeat(64)); expect(state.rpc.mock.calls.some(([p]) => p.includes("cost_items"))).toBe(false);
  const issued = await versionsRoute(req({ expected_revision: 2, confirmation: prepared.confirmation, confirmed: true, request_id: requestId }), head, "issue");
  expect(issued.status).toBe(201); expect(JSON.parse(state.rpc.mock.calls.at(-1)[1].body)).toMatchObject({ p_mode: "ON", p_revision: 2, p_request_id: requestId, p_fingerprint: "a".repeat(64) });
});
test.each(["staff", null, "other"])("%s cannot preview or publish", async role => {
  state.role = role;
  expect((await versionsRoute(req({}), head, "issue")).status).toBe(403);
  expect((await versionsRoute(req({}), head, "preview")).status).toBe(403); expect(state.rpc).not.toHaveBeenCalled();
});
test.each([undefined, "OFF", "bad", "READ_ONLY"])("%s blocks publication before DB", async mode => {
  vi.stubEnv("AND_OS_PROJECT_FOUNDATION_MODE", mode);
  expect((await versionsRoute(req({}), head, "issue")).status).toBe(mode === "READ_ONLY" ? 423 : 503); expect(state.rpc).not.toHaveBeenCalled();
});
test.each(["project_name", "client_name", "address"])("missing %s is actionable", field => {
  const f = fixture(); f.context[field] = ""; expect(() => validateIssuable(f)).toThrow(/입력/);
});
test("unknown customer, zero price, and tampered totals reject without mutation", () => {
  const f = fixture(), before = JSON.stringify(f); validateIssuable(f); expect(JSON.stringify(f)).toBe(before);
  f.context.customer_undecided = true; expect(() => validateIssuable(f)).toThrow(/고객 미정/);
  const bad = fixture(); bad.editor.summary.total++; expect(() => validateIssuable(bad)).toThrow(/합계/);
  const zero = fixture(); zero.editor.items[0].saleUnitPrice = 0; expect(() => validateIssuable(zero)).toThrow();
});
test("publication confirmation is bound to actor, head and saved revision", async () => {
  const prepared = await (await versionsRoute(req({ expected_revision: 2 }), head, "preview")).json();
  const body = { expected_revision: 2, confirmation: prepared.confirmation, confirmed: true, request_id: requestId };
  state.actor = requestId;
  expect((await versionsRoute(req(body), head, "issue")).status).toBe(409);
  state.actor = "90000000-0000-4000-8000-000000000001";
  expect((await versionsRoute(req({ ...body, expected_revision: 3 }), head, "issue")).status).toBe(409);
  expect((await versionsRoute(req({ ...body, confirmed: false }), head, "issue")).status).toBe(400);
});
test("customer renderer is deterministic, escaped and ignores all private objects", () => {
  const f = fixture(), doc = { ...f, company: ISSUE_COMPANY, id: head, version: 1, quoteNumber: "AND-Q-2026-000001", issuedAt: "2026-10-21T01:00:00Z", issuedBy: "합성 발행자" };
  doc.internal.supplier = "PRIVATE_SENTINEL"; doc.editor.items[0].cost = 987654321; doc.editor.items[0].name = "<img src=x onerror=alert(1)>";
  const before = JSON.stringify(doc), html = renderDetailedVersion(doc);
  expect(renderDetailedVersion(doc)).toBe(html); expect(JSON.stringify(doc)).toBe(before);
  expect(html).toContain("275,000원"); expect(html).toContain("250,000원"); expect(html).toContain("25,000원"); expect(html).toContain("V1");
  expect(html).not.toMatch(/PRIVATE_SENTINEL|987654321|internal|costUnit|targetMargin|onerror=alert\(1\)>/);
  expect(html).toContain("&lt;img"); expect(html).toContain("창호: 미정");
});
