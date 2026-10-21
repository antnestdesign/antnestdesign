import { afterAll, expect, test } from "vitest";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { dbRuntime, executeSql } from "../runtime.mjs";
import { estimatePayload } from "../fixtures.mjs";

const { accounts, request } = dbRuntime();
const sources = [], looseProjects = [];
async function http(path, role = "staff-active", method = "GET", body) {
  const response = await fetch(`http://127.0.0.1:3044/api/os${path}`, { method, redirect: "error",
    headers: { "Content-Type": "application/json", ...(role ? { Authorization: `Bearer ${accounts[role].token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
async function source(overrides = {}) {
  const id = randomUUID(), row = { ...estimatePayload(id), project_name: "SYSTEM_5B_SOURCE", ...overrides };
  const saved = await request("/rest/v1/estimates", { service: true, method: "POST", body: { ...row, id } });
  expect(saved.status).toBe(201); sources.push(id); return saved.data[0];
}
async function preview(s, role = "staff-active") {
  const r = await http("/detailed-estimates/from-preliminary/preview", role, "POST", { estimate_id: s.id });
  expect(r.status).toBe(200); return r.data;
}
function body(s, p, selection = { mode: "new", project_name: "SYSTEM_5B_PROJECT", customer_mode: "new", client_name: "SYNTHETIC", phone: "", area_pyeong: 0, address: "" }) {
  return { estimate_id: s.id, confirmation: p.confirmation, selection, title: "SYSTEM_5B_DRAFT", request_id: randomUUID() };
}
async function start(role = "staff-active") {
  const s = await source(), p = await preview(s, role), b = body(s, p);
  const r = await http("/detailed-estimates/from-preliminary", role, "POST", b);
  expect(r.status, JSON.stringify(r.data)).toBe(201); return { s, p, b, result: r.data, role };
}
function safe(data) {
  if (!data || typeof data !== "object") return;
  for (const [key, value] of Object.entries(data)) {
    expect(key).not.toMatch(/cost|margin|profit|internal|supplier|fingerprint|hash|actor_id|created_by|request_id|targetMargin/i);
    safe(value);
  }
}

for (const role of ["admin-active", "manager-active", "staff-active"]) {
  test(`5B1 ${role} atomic start, exact immutable source and false/zero/empty draft round trip`, async () => {
    const x = await start(role);
    const before = (await request(`/rest/v1/estimates?id=eq.${x.s.id}&select=*`, { service: true })).data;
    expect(before).toEqual([x.s]);
    const loaded = await http(`/detailed-estimates/${x.result.id}`, role);
    expect(loaded.status).toBe(200); safe(loaded.data);
    expect(loaded.data.reference.snapshot.customerQuote.groups).toHaveLength(x.s.estimate_data.customerQuote.groups.length);
    const changed = await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", {
      expected_revision: 1, request_id: randomUUID(), context: { area_pyeong: 0, client_name: "", customer_undecided: false } });
    expect(changed.status).toBe(200); expect(changed.data.revision).toBe(2);
    const reloaded = await http(`/detailed-estimates/${x.result.id}`, role);
    expect(reloaded.data.context).toMatchObject({ area_pyeong: 0, client_name: "", customer_undecided: false });
    const stale = await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", { expected_revision: 1, request_id: randomUUID(), context: {} });
    expect(stale.status).toBe(409);
    expect((await request(`/rest/v1/estimates?id=eq.${x.s.id}&select=*`, { service: true })).data).toEqual(before);
    const events = await http(`/detailed-estimates/${x.result.id}/events`, role); safe(events.data); expect(events.data).toHaveLength(2);
    expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", { expected_revision: 2, request_id: randomUUID(), context: { cost: 1 } })).status).toBe(400);
  });
}
test("5B1 missing input stays missing; explicit false/zero and stored/current discrepancy are preserved", async () => {
  const s = await source();
  await request(`/rest/v1/estimates?id=eq.${s.id}`, { service: true, method: "PATCH", body: {
    estimate_data: { ...s.estimate_data, inputs: { sectionDemolitionEnabled: false, areaPyeong: 0, clientName: "", targetMargin: 30 }, total: 1 }, total_price: 3770000 } });
  const p = await preview(s); safe(p);
  expect(p.snapshot.inputs).toEqual({ sectionDemolitionEnabled: false, areaPyeong: 0, clientName: "" });
  expect(p.snapshot.header.total_price).toBe(3770000);
  expect(p.snapshot.customerQuote.total).toBe(s.estimate_data.customerQuote.total);
  expect(p.notice).toContain("재계산");
});
test("5B1 retry returns one head; same key different content conflicts; independent request creates a second head", async () => {
  const x = await start();
  expect((await http("/detailed-estimates/from-preliminary", x.role, "POST", x.b)).data).toEqual(x.result);
  expect((await http("/detailed-estimates/from-preliminary", x.role, "POST", { ...x.b, title: "different" })).status).toBe(409);
  const project = await http(`/projects/${x.result.project_id}`);
  const b = body(x.s, x.p, { mode: "existing", project_id: x.result.project_id, confirmation: project.data.confirmation, confirmed: true });
  const second = await http("/detailed-estimates/from-preliminary", x.role, "POST", b);
  expect(second.status).toBe(201); expect(second.data.id).not.toBe(x.result.id);
});
test("5B1 changed source confirmation and project-ID substitution are rejected", async () => {
  const x = await start();
  await request(`/rest/v1/estimates?id=eq.${x.s.id}`, { service: true, method: "PATCH", body: { client_name: "CHANGED" } });
  expect((await http("/detailed-estimates/from-preliminary", x.role, "POST", { ...x.b, request_id: randomUUID() })).status).toBe(409);
  const p = await http(`/projects/${x.result.project_id}`);
  const b = body(x.s, await preview(x.s), { mode: "existing", project_id: randomUUID(), confirmation: p.data.confirmation, confirmed: true });
  expect((await http("/detailed-estimates/from-preliminary", x.role, "POST", b)).status).toBe(409);
});
test("5B1 project/customer edits after confirmation conflict without source mutation", async () => {
  const x = await start(), s = await source(), p = await preview(s);
  const selected = await http(`/projects/${x.result.project_id}`);
  await request(`/rest/v1/projects?id=eq.${x.result.project_id}`, { service: true, method: "PATCH", body: { address: "CHANGED SITE" } });
  const b = body(s, p, { mode: "existing", project_id: x.result.project_id, confirmation: selected.data.confirmation, confirmed: true });
  expect((await http("/detailed-estimates/from-preliminary", "staff-active", "POST", b)).status).toBe(409);
});
test("5B1 legacy project explicit adoption and staff visibility preserve original columns", async () => {
  const pid = randomUUID(); looseProjects.push(pid);
  await request("/rest/v1/projects", { service: true, method: "POST", body: { id: pid, project_name: "SYSTEM_5B_LEGACY", memo: "SYNTHETIC_PRIVATE" } });
  expect((await http("/projects")).data.some(p => p.id === pid)).toBe(false);
  expect((await http(`/projects/${pid}`)).status).toBe(403);
  const p = await http(`/projects/${pid}`, "manager-active"); safe(p.data);
  expect((await http(`/projects/${pid}/adopt`, "staff-active", "POST", { confirmation: p.data.confirmation, request_id: randomUUID() })).status).toBe(403);
  const adopted = await http(`/projects/${pid}/adopt`, "manager-active", "POST", { confirmation: p.data.confirmation, request_id: randomUUID() });
  expect(adopted.status).toBe(200);
  expect((await http(`/projects/${pid}`)).status).toBe(200);
  const row = (await request(`/rest/v1/projects?id=eq.${pid}`, { service: true })).data[0];
  expect(row.project_name).toBe("SYSTEM_5B_LEGACY"); expect(row.memo).toBe("SYNTHETIC_PRIVATE");
});
test("5B1 legacy FK conflict and referenced deletion deny; unreferenced admin deletion survives", async () => {
  const x = await start(), other = await start();
  expect((await request(`/rest/v1/estimates?id=eq.${x.s.id}`, { account: "admin-active", method: "DELETE" })).status).toBe(409);
  const conflict = await request(`/rest/v1/estimates?id=eq.${x.s.id}`, { account: "admin-active", method: "PATCH", body: { project_id: other.result.project_id } });
  expect(conflict.status).toBeGreaterThanOrEqual(400);
  const s = await source();
  expect((await request(`/rest/v1/estimates?id=eq.${s.id}`, { account: "admin-active", method: "DELETE" })).status).toBe(200);
  await request(`/rest/v1/estimates?id=eq.${s.id}`, { service: true, method: "PATCH", body: { project_id: other.result.project_id } });
});
test("5B1 reference and event immutable even to raw service DML", async () => {
  const x = await start();
  for (const table of ["detailed_estimate_references", "detailed_estimate_events"]) {
    const before = await request(`/rest/v1/${table}?detailed_estimate_id=eq.${x.result.id}`, { service: true });
    expect(before.data.length).toBe(1);
    for (const method of ["PATCH", "DELETE"]) expect((await request(`/rest/v1/${table}?detailed_estimate_id=eq.${x.result.id}`, {
      service: true, method, ...(method === "PATCH" ? { body: table.endsWith("references") ? { source_public_hash: "changed" } : { action: "save" } } : {}) })).status).toBe(403);
    expect((await request(`/rest/v1/${table}?detailed_estimate_id=eq.${x.result.id}`, { service: true })).data).toEqual(before.data);
  }
});
for (const table of ["project_preliminary_estimates", "detailed_estimates", "detailed_estimate_drafts", "detailed_estimate_references", "detailed_estimate_events"]) {
  test(`5B1 ${table} service cannot bypass row immutability using TRUNCATE`, () => {
    expect(executeSql(`SELECT has_table_privilege('service_role','public.${table}','TRUNCATE')`)).toBe("f");
  });
  for (const role of [null, "admin-active", "manager-active", "staff-active"]) {
    for (const method of ["GET", "POST", "PATCH", "DELETE"]) test(`5B1 raw ${table} ${role || "anon"} ${method} denied`, async () => {
      const key = table === "project_preliminary_estimates" ? "estimate_id" : table === "detailed_estimate_drafts" ? "detailed_estimate_id" : "id";
      const response = await request(`/rest/v1/${table}${method === "DELETE" ? `?${key}=eq.${randomUUID()}` : ""}`, { account: role, method, ...(method === "PATCH" || method === "POST" ? { body: {} } : {}) });
      expect([401, 403]).toContain(response.status);
    });
  }
}
for (const role of [null, "admin-inactive", "staff-inactive", "manager-must-change-password", "staff-must-change-password"]) {
  test(`5B1 invalid account ${role || "anonymous"} fails closed before reads`, async () => {
    expect((await http("/projects", role)).status).toBe(role ? 403 : 401);
  });
}
test("5B1 authenticated raw command EXECUTE and unknown actor service RPC denied", async () => {
  expect((await request("/rest/v1/rpc/and_os_5b_command", { account: "staff-active", method: "POST", body: { p_actor: accounts["admin-active"].id, p_action: "projects" } })).status).toBe(403);
  for (const actor of [null, randomUUID(), accounts["staff-inactive"].id]) expect((await request("/rest/v1/rpc/and_os_5b_command", { service: true, method: "POST", body: { p_actor: actor, p_action: "projects" } })).status).toBe(403);
});
test("5B1 failing late title constraint rolls back customer/project/link/head and event", async () => {
  const s = await source(), p = await request("/rest/v1/rpc/and_os_5b_command", { service: true, method: "POST", body: { p_actor: accounts["staff-active"].id, p_action: "preview", p_feature_mode: "ON", p_payload: { estimate_id: s.id } } });
  const counts = () => executeSql("SELECT (SELECT count(*) FROM customers)||','||(SELECT count(*) FROM projects)||','||(SELECT count(*) FROM project_preliminary_estimates)||','||(SELECT count(*) FROM detailed_estimates)||','||(SELECT count(*) FROM detailed_estimate_events)");
  const before = counts();
  const failure = await request("/rest/v1/rpc/and_os_5b_command", { service: true, method: "POST", body: { p_actor: accounts["staff-active"].id, p_action: "start", p_feature_mode: "ON", p_request_id: randomUUID(), p_payload: {
    estimate_id: s.id, source_fingerprint: p.data.fingerprint, title: "", selection: { mode: "new", project_name: "SYSTEM_5B_FAIL", customer_mode: "new", client_name: "SYNTHETIC" } } } });
  expect(failure.status).toBeGreaterThanOrEqual(400); expect(counts()).toBe(before);
});

test("5B1 concurrent same request creates exactly one result", async () => {
  const s = await source(), p = await preview(s), b = body(s, p);
  const [a, c] = await Promise.all([http("/detailed-estimates/from-preliminary", "staff-active", "POST", b), http("/detailed-estimates/from-preliminary", "staff-active", "POST", b)]);
  expect(a.status).toBe(201); expect(c.status).toBe(201); expect(a.data).toEqual(c.data);
});
test("5B1 concurrent competing project links have one winner without orphan projects", async () => {
  const s = await source(), p = await preview(s), a = body(s, p), b = body(s, p);
  const before = Number(executeSql("SELECT count(*) FROM public.projects"));
  const results = await Promise.all([http("/detailed-estimates/from-preliminary", "staff-active", "POST", a), http("/detailed-estimates/from-preliminary", "staff-active", "POST", b)]);
  expect(results.map(r => r.status).sort()).toEqual([201, 409]);
  expect(Number(executeSql("SELECT count(*) FROM public.projects"))).toBe(before + 1);
});
test("5B1 concurrent draft save permits exactly one revision winner", async () => {
  const x = await start();
  const results = await Promise.all(["A", "B"].map(client_name => http(`/detailed-estimates/${x.result.id}/draft`, "staff-active", "PATCH", {
    expected_revision: 1, request_id: randomUUID(), context: { client_name } })));
  expect(results.map(r => r.status).sort()).toEqual([200, 409]);
  const saved = await http(`/detailed-estimates/${x.result.id}`); expect(saved.data.revision).toBe(2);
});
test("5B1 immutable reference survives source edits and existing FK blocks a new project", async () => {
  const x = await start();
  const original = (await http(`/detailed-estimates/${x.result.id}`)).data.reference;
  await request(`/rest/v1/estimates?id=eq.${x.s.id}`, { service: true, method: "PATCH", body: { project_name: "SOURCE LATER EDIT" } });
  expect((await http(`/detailed-estimates/${x.result.id}`)).data.reference).toEqual(original);
  const s = await source({ project_id: x.result.project_id }), p = await preview(s);
  expect((await http("/detailed-estimates/from-preliminary", "staff-active", "POST", body(s, p))).status).toBe(409);
});

async function projectMarkers(x) {
  return (await request(`/rest/v1/projects?id=eq.${x.result.project_id}&select=os_managed_at,os_managed_by`, { service: true })).data[0];
}
async function markProject(x, body) {
  expect((await request(`/rest/v1/projects?id=eq.${x.result.project_id}`, { service: true, method: "PATCH", body })).status).toBe(200);
}
function storedHead(id) {
  return executeSql(`SELECT jsonb_build_object('head',(SELECT to_jsonb(h) FROM detailed_estimates h WHERE id='${id}'),
    'draft',(SELECT to_jsonb(d) FROM detailed_estimate_drafts d WHERE detailed_estimate_id='${id}'),
    'reference',(SELECT to_jsonb(r) FROM detailed_estimate_references r WHERE detailed_estimate_id='${id}'),
    'events',(SELECT jsonb_agg(to_jsonb(e) ORDER BY id) FROM detailed_estimate_events e WHERE detailed_estimate_id='${id}'));`);
}
for (const role of ["admin-active", "manager-active", "staff-active"]) {
  test(`5B1 ${role} revoked project denies GET, save and successful-request replay without mutation; restore recovers`, async () => {
    const x = await start(role), markers = await projectMarkers(x);
    const b = { expected_revision: 1, request_id: randomUUID(), context: { client_name: "SYNTHETIC SAVED" } };
    expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", b)).status).toBe(200);
    const before = storedHead(x.result.id);
    try {
      await markProject(x, { os_managed_at: null, os_managed_by: null });
      expect((await http(`/detailed-estimates/${x.result.id}`, role)).status).toBe(403);
      expect((await http(`/detailed-estimates/${x.result.id}/events`, role)).status).toBe(403);
      expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", { ...b, expected_revision: 2, request_id: randomUUID() })).status).toBe(403);
      expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", b)).status).toBe(403);
      expect((await http("/detailed-estimates/from-preliminary", role, "POST", x.b)).status).toBe(403);
      expect(storedHead(x.result.id)).toBe(before);
    } finally { await markProject(x, markers); }
    expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", b)).data.revision).toBe(2);
    expect(storedHead(x.result.id)).toBe(before);
    expect((await http(`/detailed-estimates/${x.result.id}/draft`, role, "PATCH", { ...b, expected_revision: 2, request_id: randomUUID() })).data.revision).toBe(3);
  });
}

test("5B1 replay rechecks current role and account state before returning prior success", async () => {
  const pid = randomUUID(); looseProjects.push(pid);
  await request("/rest/v1/projects", { service: true, method: "POST", body: { id: pid, project_name: "SYSTEM_5B_REPLAY" } });
  const actor = accounts["manager-active"].id, selected = await http(`/projects/${pid}`, "manager-active");
  const b = { confirmation: selected.data.confirmation, request_id: randomUUID() };
  expect((await http(`/projects/${pid}/adopt`, "manager-active", "POST", b)).status).toBe(200);
  try {
    expect((await request(`/rest/v1/profiles?id=eq.${actor}`, { service: true, method: "PATCH", body: { role: "staff" } })).status).toBe(200);
    expect((await http(`/projects/${pid}/adopt`, "manager-active", "POST", b)).status).toBe(403);
    expect((await request(`/rest/v1/profiles?id=eq.${actor}`, { service: true, method: "PATCH", body: { role: "manager", is_active: false } })).status).toBe(200);
    expect((await http(`/projects/${pid}/adopt`, "manager-active", "POST", b)).status).toBe(403);
  } finally { await request(`/rest/v1/profiles?id=eq.${actor}`, { service: true, method: "PATCH", body: { role: "manager", is_active: true } }); }
});

test.each([undefined, null, "", "OFF", "invalid"])("5B1 direct service RPC feature mode %s fails closed without writes", async mode => {
  const before = executeSql("SELECT count(*) FROM detailed_estimate_events");
  const r = await request("/rest/v1/rpc/and_os_5b_command", { service: true, method: "POST", body: {
    p_actor: accounts["staff-active"].id, p_action: "create-project", p_request_id: randomUUID(),
    ...(mode !== undefined ? { p_feature_mode: mode } : {}), p_payload: {} } });
  expect(r.data.code).toBe("P5F01"); expect(executeSql("SELECT count(*) FROM detailed_estimate_events")).toBe(before);
});
test.each(["create-project", "adopt-project", "start", "save"])("5B1 READ_ONLY RPC rejects %s before replay or payload evaluation", async action => {
  const before = executeSql("SELECT count(*) FROM detailed_estimate_events");
  const r = await request("/rest/v1/rpc/and_os_5b_command", { service: true, method: "POST", body: {
    p_actor: accounts["staff-active"].id, p_action: action, p_feature_mode: "READ_ONLY", p_request_id: randomUUID(), p_payload: {} } });
  expect(r.data.code).toBe("P5F02"); expect(executeSql("SELECT count(*) FROM detailed_estimate_events")).toBe(before);
});

async function holdTransaction(body) {
  const child = spawn("docker", ["exec", "-i", "supabase_db_and-os-migration-rebuild-test", "psql", "-U", "postgres", "-d", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1"], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
  let out = "", err = "";
  const done = new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => code === 0 ? resolve() : reject(new Error(`Owned lock transaction failed: ${err}`))); });
  const ready = new Promise((resolve, reject) => {
    child.stdout.on("data", b => { out += b; if (out.includes("LOCK_HELD")) resolve(); });
    child.once("exit", () => { if (!out.includes("LOCK_HELD")) reject(new Error("Owned lock transaction did not acquire lock")); });
  });
  child.stderr.on("data", b => { err += b; });
  child.stdin.end(`BEGIN;\n${body}\n\\echo LOCK_HELD\nSELECT pg_sleep(2.5);\nCOMMIT;\n`);
  await ready; return { done };
}
test("5B1 revocation-first blocks save until commit, then denies without changing draft or events", async () => {
  const x = await start(), markers = await projectMarkers(x), before = storedHead(x.result.id);
  const held = await holdTransaction(`UPDATE projects SET os_managed_at=NULL,os_managed_by=NULL WHERE id='${x.result.project_id}';`);
  try {
    const started = Date.now();
    const r = await http(`/detailed-estimates/${x.result.id}/draft`, x.role, "PATCH", { expected_revision: 1, request_id: randomUUID(), context: {} });
    expect(r.status).toBe(403); expect(Date.now() - started).toBeGreaterThan(1000); await held.done;
    expect(storedHead(x.result.id)).toBe(before);
  } finally { await held.done; await markProject(x, markers); }
});
test("5B1 save-first holds project lock through commit; revocation waits and later writes deny", async () => {
  const x = await start(), markers = await projectMarkers(x), requestId = randomUUID();
  const held = await holdTransaction(`SELECT and_os_5b_command('${accounts[x.role].id}','save',
    '{"id":"${x.result.id}","expected_revision":1,"context":{}}'::jsonb,'${requestId}','ON');`);
  try {
    const started = Date.now(); await markProject(x, { os_managed_at: null, os_managed_by: null });
    expect(Date.now() - started).toBeGreaterThan(1000); await held.done;
    const before = storedHead(x.result.id);
    expect((await http(`/detailed-estimates/${x.result.id}/draft`, x.role, "PATCH", { expected_revision: 2, request_id: randomUUID(), context: {} })).status).toBe(403);
    expect(storedHead(x.result.id)).toBe(before);
  } finally { await held.done; await markProject(x, markers); }
});

afterAll(() => {
  // Owned PG17 fixtures only. Guards are restored in the same transaction; catalog rechecked by runner.
  const tables = ["detailed_estimate_events", "detailed_estimate_references", "detailed_estimate_drafts", "detailed_estimates", "project_preliminary_estimates"];
  executeSql(tables.map(t => `ALTER TABLE public.${t} DISABLE TRIGGER USER;`).join("\n") + "\n" +
    tables.map(t => `DELETE FROM public.${t};`).join("\n") + "\n" +
    tables.map(t => `ALTER TABLE public.${t} ENABLE TRIGGER USER;`).join("\n") + "\n" +
    `DELETE FROM public.projects WHERE project_name LIKE 'SYSTEM_5B_%'; DELETE FROM public.customers WHERE name='SYNTHETIC';` +
    (sources.length ? `DELETE FROM public.estimates WHERE id IN (${sources.map(id => `'${id}'`).join(",")});` : ""));
});
