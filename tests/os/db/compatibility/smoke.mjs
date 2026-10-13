import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ESTIMATE_A, COST_ID } from "../fixtures.mjs";
import { ESTIMATE_INPUT_SCHEMA, PRIVATE_ESTIMATE_INPUTS } from "../../../../public/os-app/src/estimate-inputs.js";
import { ORIGIN } from "../rebuild/stack.mjs";

const phase = process.argv[2];
assert(["baseline", "canonical"].includes(phase));
assert.equal(process.env.AND_OS_DB_REBUILD, "1"); assert.equal(process.env.SUPABASE_URL, ORIGIN);
const accounts = JSON.parse(process.env.AND_OS_DB_ACCOUNTS);
const report = { phase, apiMock: false, roles: [], checks: [], result: "PENDING" };
async function api(path, role = "admin-active", method = "GET", body) {
  const r = await fetch(`http://127.0.0.1:3044/api/os${path}`, { method, redirect: "error", signal: AbortSignal.timeout(30000), headers: {
    "Content-Type": "application/json", Authorization: `Bearer ${accounts[role].token}`,
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, data: await r.json() };
}
async function rest(path, role = "admin-active", method = "GET", body, service = false) {
  const r = await fetch(`${ORIGIN}/rest/v1/${path}`, { method, redirect: "error", signal: AbortSignal.timeout(20000), headers: {
    apikey: process.env.AND_OS_DB_ANON, Authorization: `Bearer ${service ? process.env.AND_OS_DB_SERVICE : accounts[role].token}`,
    "Content-Type": "application/json", Prefer: "return=representation",
  }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await r.text(); return { status: r.status, data: text ? JSON.parse(text) : null };
}
function safe(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!/^(cost|costTotal|cost_total|costPrice|cost_price|margin|marginRate|margin_rate|profit|internalDetails|internalSummary|internalMemo|costSnapshot|supplierData|unitPrice|correction|targetMargin|manualAdjustment|.*Correction|created_by|confirmed_by|source_hash|content_hash)$/i.test(key), `Unsafe staff field: ${key}`);
    safe(child);
  }
  assert(!JSON.stringify(value).includes("SYNTHETIC_PRIVATE"));
}
function inputs(role) {
  return { ...Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).filter(([id]) => !PRIVATE_ESTIMATE_INPUTS.includes(id))
    .map(([id, s]) => [id, s.type === "checkbox" ? false : s.value])),
  projectName: `SYSTEM_COMPAT_${phase}_${role}`, areaPyeong: "33", existingPipeCleaningEnabled: true };
}
try {
  const original = await rest(`estimates?id=eq.${ESTIMATE_A}&select=*`, undefined, "GET", undefined, true);
  let adminEstimateId;
  for (const role of ["admin-active", "manager-active", "staff-active"]) {
    assert.equal((await api("/me", role)).status, 200);
    const list = await api("/estimates", role); assert.equal(list.status, 200);
    assert(list.data.some((r) => r.id === ESTIMATE_A)); if (role === "staff-active") safe(list.data);
    const old = await api(`/estimates/${ESTIMATE_A}`, role); assert.equal(old.status, 200);
    if (role === "staff-active") safe(old.data);
    const created = await api("/estimates", role, "POST", { inputs: inputs(role), address: "SYNTHETIC SITE" });
    assert.equal(created.status, 201); if (role === "staff-active") safe(created.data);
    const id = created.data.id; if (role === "admin-active") adminEstimateId = id;
    const updated = await api(`/estimates/${id}`, role, "PATCH", { inputs: { ...inputs(role), clientName: "Synthetic edited client" } });
    assert.equal(updated.status, 200); if (role === "staff-active") safe(updated.data);
    const reread = await api(`/estimates/${id}`, role); assert.equal(reread.status, 200);
    if (role === "staff-active") safe(reread.data);
    const preview = await api("/contract-packages/preview", role, "POST", { estimate_id: id });
    assert.equal(preview.status, role === "manager-active" ? 403 : 200);
    if (role !== "manager-active") {
      assert.deepEqual(preview.data.documents.map((d) => d.document_type), ["CONTRACT", "QUOTE", "SPEC"]);
      if (role === "staff-active") safe(preview.data);
    }
    if (role !== "admin-active") assert.equal((await api(`/contract-packages/${ESTIMATE_A}/confirm`, role, "POST", {})).status, 403);
    for (const endpoint of ["/users", "/audit-logs"]) assert.equal((await api(endpoint, role)).status, role === "admin-active" ? 200 : 403);
    const cost = await rest("cost_items?select=*", role); assert.equal(cost.status, 200);
    if (role === "staff-active") assert.equal(cost.data.length, 0);
    else assert(cost.data.some((r) => r.id === COST_ID));
    if (role === "manager-active") {
      const deleted = await rest(`estimates?id=eq.${id}`, role, "DELETE");
      if (phase === "baseline") { assert.equal(deleted.status, 200); assert.equal(deleted.data.length, 1); }
      else assert([401, 403].includes(deleted.status) || (deleted.status === 200 && deleted.data.length === 0));
      report.managerRawDelete = phase === "baseline" ? "OLD_POLICY_ALLOWS_SYNTHETIC_DELETE" : "DENIED";
    }
    report.roles.push({ role, login: "PASS", list: "PASS", create: "PASS", update: "PASS", reread: "PASS",
      preview: role === "manager-active" ? "DENIED" : "PASS", internalBrowserProjection: role === "staff-active" ? "SAFE" : "INTERNAL_ALLOWED" });
  }
  assert.deepEqual(await rest(`estimates?id=eq.${ESTIMATE_A}&select=*`, undefined, "GET", undefined, true), original);
  report.checks.push("old estimate read has no row mutation");
  for (const role of ["admin-inactive", "staff-inactive", "admin-must-change-password", "staff-must-change-password"])
    assert.equal((await api("/estimates", role)).status, 403);
  report.checks.push("inactive and forced-password API fail closed on both schemas");
  assert.equal((await api("/estimates", "staff-active", "POST", { inputs: inputs("staff-active"), costTotal: 1 })).status, 400);
  report.checks.push("staff internal-field injection denied");
  const raw = await rest(`estimates?id=eq.${ESTIMATE_A}&select=*`, "staff-active");
  assert.equal(raw.status, 200);
  if (phase === "baseline") { assert.equal(raw.data.length, 1); assert(JSON.stringify(raw.data).includes("SYNTHETIC_PRIVATE")); }
  else assert.equal(raw.data.length, 0);
  report.staffRawRest = phase === "baseline" ? "PREEXISTING_BROAD_RLS" : "DENIED";
  assert.equal((await rest("rpc/save_cost_item_draft", "admin-active", "POST", { p_cost_item_id: COST_ID, p_draft_cost_price: 120000 })).status, 200);
  const draft = await rest(`cost_items?id=eq.${COST_ID}&select=cost_price,draft_cost_price`);
  assert.equal(Number(draft.data[0].cost_price), 100000); assert.equal(Number(draft.data[0].draft_cost_price), 120000);
  assert.equal((await rest("rpc/cancel_cost_item_draft", "admin-active", "POST", { p_cost_item_id: COST_ID })).status, 200);
  report.checks.push("published price unchanged through draft/cancel RPC");
  const option = await api("/contract-options", "admin-active", "PUT", { estimate_id: adminEstimateId,
    contract_info: { contract_date: "2026-10-14", start_date: "2026-11-01", planned_completion_date: "2026-12-01" } });
  assert.equal(option.status, 200);
  const pkg = await api("/contract-packages", "admin-active", "POST", { estimate_id: adminEstimateId }); assert.equal(pkg.status, 201);
  const confirm = await api(`/contract-packages/${pkg.data.id}/confirm`, "admin-active", "POST", {}); assert.equal(confirm.status, 200);
  assert.equal(confirm.data.status, "CONTRACTED");
  assert(confirm.data.contract_document_versions.every((d) => d.generation_status === "FINAL" && d.locked_at));
  report.checks.push("actual admin package + three FINAL documents on both schemas");
  report.result = "PASS";
} finally {
  writeFileSync(resolve(import.meta.dirname, `artifacts/latest-${phase}.json`), JSON.stringify(report, null, 2) + "\n");
}
console.log(`Latest app / ${phase}: admin, manager, staff HTTP workflows PASS; safe API uses existing tables.`);
