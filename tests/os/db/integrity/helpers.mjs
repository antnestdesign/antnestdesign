import { expect } from "vitest";
import { NextRequest } from "next/server";
import { dbRuntime, dbFile, executeSql, resetFixtures } from "../runtime.mjs";
import { ESTIMATE_A, COST_ID } from "../fixtures.mjs";

export const { request, accounts } = dbRuntime();
export { COST_ID, ESTIMATE_A, executeSql };
export const admin = accounts["admin-active"];
export const contractLib = await import("../../../../app/api/os/contract-packages/_lib/contracts.ts");

export function resetIntegrity() {
  executeSql(dbFile("integrity/reset.sql"));
  resetFixtures();
}

export function apiRequest(path, body) {
  return new NextRequest(`https://os.invalid/api/os${path}`, {
    method: "POST", headers: { Authorization: `Bearer ${admin.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function createApiPackage(options = {}) {
  const route = await import("../../../../app/api/os/contract-packages/route.ts");
  const response = await route.POST(apiRequest("/contract-packages", { estimate_id: ESTIMATE_A, options: {
    contract_info: { contract_date: "2026-10-12", start_date: "2026-11-01", planned_completion_date: "2026-12-01" },
    contractor_info: { company_name: "SYNTHETIC CONTRACTOR" }, ...options,
  } }));
  expect(response.status, "real create API must succeed").toBe(201);
  return response.json();
}

export async function rpc(name, body) {
  return request(`/rest/v1/rpc/${name}`, { method: "POST", service: true, body });
}
export async function confirm(pkg) {
  const result = await rpc("confirm_contract_package_snapshot", { p_package_id: pkg.id, p_actor_user_id: admin.id });
  expect(result.status).toBe(200);
  return result.data;
}

export async function readPackage(id) {
  const result = await request(`/rest/v1/contract_package_snapshots?id=eq.${id}&select=*,contract_document_versions(*)`, { service: true });
  expect(result.status).toBe(200);
  return result.data[0];
}

export async function contractState() {
  const result = {};
  for (const table of ["contract_package_snapshots", "contract_document_versions", "change_orders", "change_order_approvals"]) {
    const response = await request(`/rest/v1/${table}?select=*&order=id`, { service: true });
    expect(response.status).toBe(200);
    result[table] = response.data;
  }
  return result;
}

export function payload(snapshot) {
  return {
    ...snapshot, parties_info: snapshot.parties || snapshot.parties_info,
    documents: contractLib.buildContractDocuments(snapshot),
  };
}

export async function snapshotForRpc() {
  const options = contractLib.normalizeContractOptions({ contract_no: "AND-2026-10-001" });
  return contractLib.buildContractPackageSnapshot(ESTIMATE_A, options, options.contract_no);
}

export async function pendingChange(pkg, delta = 130000) {
  const pending = structuredClone(pkg);
  delete pending.contract_document_versions;
  pending.parties = pending.parties_info;
  pending.contract_info.total_amount += delta;
  pending.estimate_snapshot.total_price += delta;
  const money = (amount) => `${amount.toLocaleString("ko-KR")}원`;
  const quote = pending.estimate_snapshot.customer_quote;
  quote.total += delta;
  quote.totalText = money(quote.total);
  pending.estimate_snapshot.total_text = money(pending.estimate_snapshot.total_price);
  quote.groups[0].total += delta;
  quote.groups[0].totalText = money(quote.groups[0].total);
  quote.groups[0].items[0].amount += delta;
  quote.groups[0].items[0].amountText = money(quote.groups[0].items[0].amount);
  pending.estimate_snapshot.quote_items[0].sales_amount += delta;
  pending.estimate_snapshot.quote_items[0].sales_amount_text = money(pending.estimate_snapshot.quote_items[0].sales_amount);
  const result = await rpc("create_contract_change_order", {
    p_actor_user_id: admin.id,
    p_payload: { package_id: pkg.id, title: "SYSTEM_INTEGRITY_CHANGE", amount_delta: delta,
      pending_snapshot: pending, pending_source_hash: contractLib.hashJson(pending),
      documents: contractLib.buildContractDocuments(pending) },
  });
  expect(result.status).toBe(200);
  return result.data;
}

export function approvalPayload(change) {
  return { customer_name: "Synthetic customer", approval_method: "Synthetic signature",
    customer_signed_at: "2026-10-12", evidence_file_id: "SYNTHETIC_EVIDENCE_001",
    approved_document_hash: change.package_manifest_hash,
    approved_package_version: change.pending_package.package_version };
}

export async function approve(change, approval = approvalPayload(change)) {
  return rpc("approve_contract_change_order", { p_actor_user_id: admin.id,
    p_change_order_id: change.id, p_payload: approval });
}

export async function costState() {
  const result = {};
  for (const table of ["cost_items", "cost_item_history", "cost_publish_log"]) {
    const response = await request(`/rest/v1/${table}?select=*&order=id`, { service: true });
    expect(response.status).toBe(200);
    result[table] = response.data;
  }
  return result;
}
export async function draft(amount = 120000) {
  return request("/rest/v1/rpc/save_cost_item_draft", { account: "admin-active", method: "POST",
    body: { p_cost_item_id: COST_ID, p_draft_cost_price: amount, p_draft_margin_rate: 0.4, p_draft_is_active: false } });
}
export async function publish() {
  return request("/rest/v1/rpc/publish_cost_drafts", { account: "admin-active", method: "POST",
    body: { p_reason: "SYSTEM_DB_2B_PERMISSION_TEST", p_memo: "Integrity fixture" } });
}
