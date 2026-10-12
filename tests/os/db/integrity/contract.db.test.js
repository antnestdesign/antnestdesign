import { createHash } from "node:crypto";
import { beforeEach, expect, test } from "vitest";
import { admin, apiRequest, approvalPayload, approve, confirm, contractLib, contractState,
  createApiPackage, executeSql, payload, pendingChange, readPackage, resetIntegrity, rpc, snapshotForRpc } from "./helpers.mjs";

beforeEach(resetIntegrity);
const sha = (text) => createHash("sha256").update(text).digest("hex");
const literal = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;

test("CON-01 actual Next create and RPC yield READY package and three hashed documents", async () => {
  const pkg = await createApiPackage();
  expect(pkg.status).toBe("READY");
  expect(pkg.package_version).toBe(1);
  expect(pkg.contract_no).toMatch(/^AND-\d{4}-\d{2}-\d{3}$/);
  expect(pkg.source_hash).toMatch(/^[0-9a-f]{64}$/);
  const docs = pkg.contract_document_versions.sort((a,b) => a.document_type.localeCompare(b.document_type));
  expect(docs.map((doc) => doc.document_type)).toEqual(["CONTRACT", "QUOTE", "SPEC"]);
  for (const doc of docs) expect(doc.content_hash).toBe(contractLib.hashJson(doc.content_json));
  expect(pkg.package_manifest_hash).toBe(sha(docs.map((doc) => `${doc.document_type}:${doc.content_hash}`).join("|")));
  const rebuilt = await contractLib.buildContractPackageSnapshot(pkg.estimate_id, undefined, pkg.contract_no);
  expect(pkg.source_hash).toBe(rebuilt.source_hash);
});

test("CON-02 missing third document rolls back package and any inserted documents", async () => {
  const snapshot = await snapshotForRpc();
  const data = payload(snapshot);
  data.documents.pop();
  const before = await contractState();
  const result = await rpc("create_contract_package_snapshot", { p_actor_user_id: admin.id, p_payload: data });
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("all three");
  expect(await contractState()).toEqual(before);
});

test("CON-03 failure during document INSERT leaves no partial package", async () => {
  executeSql(`create or replace function public.test_integrity_fail() returns trigger language plpgsql as $$
    begin raise exception 'SYNTHETIC_INJECTED_FAILURE'; end $$;
    create trigger test_integrity_document_failure before insert on public.contract_document_versions
    for each row when (new.document_type='QUOTE') execute function public.test_integrity_fail();`);
  const before = await contractState();
  const result = await rpc("create_contract_package_snapshot", { p_actor_user_id: admin.id, p_payload: payload(await snapshotForRpc()) });
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("SYNTHETIC_INJECTED_FAILURE");
  expect(await contractState()).toEqual(before);
});

test("CON-04 confirm freezes three documents without changing hashes/version", async () => {
  const pkg = await createApiPackage();
  const locked = await confirm(pkg);
  expect(locked.status).toBe("CONTRACTED");
  expect(locked.confirmed_at).toBeTruthy();
  expect(locked.package_version).toBe(pkg.package_version);
  expect(locked.package_manifest_hash).toBe(pkg.package_manifest_hash);
  for (const doc of locked.contract_document_versions) {
    expect(doc.generation_status).toBe("FINAL");
    expect(doc.locked_at).toBeTruthy();
    expect(doc.content_hash).toBe(pkg.contract_document_versions.find((old) => old.id === doc.id).content_hash);
  }
});

test("CON-05 duplicate confirm explicitly refuses and does not create versions", async () => {
  const locked = await confirm(await createApiPackage());
  const before = await contractState();
  const result = await rpc("confirm_contract_package_snapshot", { p_actor_user_id: admin.id, p_package_id: locked.id });
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.data.message).toContain("only READY");
  expect(await contractState()).toEqual(before);
});

test("CON-06 concurrent confirm leaves exactly one confirmed version", async () => {
  const pkg = await createApiPackage();
  const results = await Promise.all([0,1].map(() => rpc("confirm_contract_package_snapshot", { p_actor_user_id: admin.id, p_package_id: pkg.id })));
  expect(results.filter((result) => result.status === 200)).toHaveLength(1);
  const state = await contractState();
  expect(state.contract_package_snapshots).toHaveLength(1);
  expect(state.contract_document_versions).toHaveLength(3);
  expect(state.contract_package_snapshots[0].contract_no).toBe(pkg.contract_no);
});

test("CON-07 actual confirm API failure rolls back and same READY id/no succeeds on retry", async () => {
  const pkg = await createApiPackage();
  executeSql(`create or replace function public.test_integrity_fail() returns trigger language plpgsql as $$
    begin raise exception 'SYNTHETIC_INJECTED_FAILURE'; end $$;
    create trigger test_integrity_document_failure before update on public.contract_document_versions
    for each row when (new.generation_status='FINAL') execute function public.test_integrity_fail();`);
  const before = await contractState();
  const route = await import("../../../../app/api/os/contract-packages/[id]/confirm/route.ts");
  const failed = await route.POST(apiRequest(`/contract-packages/${pkg.id}/confirm`, {}), { params: Promise.resolve({ id: pkg.id }) });
  expect(failed.status).toBeGreaterThanOrEqual(400);
  expect(await contractState()).toEqual(before);
  executeSql("drop trigger test_integrity_document_failure on public.contract_document_versions;");
  const retry = await route.POST(apiRequest(`/contract-packages/${pkg.id}/confirm`, {}), { params: Promise.resolve({ id: pkg.id }) });
  expect(retry.status).toBe(200);
  const locked = await retry.json();
  expect(locked.id).toBe(pkg.id);
  expect(locked.contract_no).toBe(pkg.contract_no);
  expect(locked.package_version).toBe(pkg.package_version);
  expect((await contractState()).contract_document_versions).toHaveLength(3);
});

test("CON-08 API create retry returns 409 and keeps reserved number/package", async () => {
  const pkg = await createApiPackage();
  const before = await contractState();
  const route = await import("../../../../app/api/os/contract-packages/route.ts");
  const result = await route.POST(apiRequest("/contract-packages", { estimate_id: pkg.estimate_id }));
  expect(result.status).toBe(409);
  expect(await contractState()).toEqual(before);
});

for (const field of ["contract_info", "parties_info", "site_manager", "estimate_snapshot", "document_options_snapshot",
  "spec_snapshot", "clause_snapshot", "payment_schedule", "source_hash", "template_version", "rule_version", "estimate_revision"]) {
  test(`CON-LOCK package ${field} is protected even against direct owner SQL`, async () => {
    const pkg = await confirm(await createApiPackage());
    expect(pkg).toHaveProperty(field);
    const value = Array.isArray(pkg[field]) ? [{ synthetic_change: true }]
      : typeof pkg[field] === "object" ? { synthetic_change: true } : "SYNTHETIC_CHANGE";
    const sqlValue = typeof value === "object" ? literal(value) : `'${value}'`;
    expect(() => executeSql(`update public.contract_package_snapshots set ${field}=${sqlValue} where id='${pkg.id}';`)).toThrow();
    expect((await readPackage(pkg.id))[field]).toEqual(pkg[field]);
  });
}
for (const field of ["content_json", "content_hash", "generation_status", "locked_at"]) {
  test(`CON-LOCK FINAL document ${field} cannot be changed`, async () => {
    const pkg = await confirm(await createApiPackage());
    const doc = pkg.contract_document_versions[0];
    const value = field === "content_json" ? `'{}'::jsonb` : field === "locked_at" ? "null" : "'SYNTHETIC_CHANGE'";
    expect(() => executeSql(`update public.contract_document_versions set ${field}=${value} where id='${doc.id}';`)).toThrow();
    expect((await readPackage(pkg.id)).contract_document_versions.find((row) => row.id === doc.id)).toEqual(doc);
  });
}
test("CON-LOCK confirmed package and FINAL document deletion are denied", async () => {
  const pkg = await confirm(await createApiPackage());
  expect(() => executeSql(`delete from public.contract_package_snapshots where id='${pkg.id}';`)).toThrow();
  expect(() => executeSql(`delete from public.contract_document_versions where id='${pkg.contract_document_versions[0].id}';`)).toThrow();
  expect((await readPackage(pkg.id)).contract_document_versions).toHaveLength(3);
});

test("CON-META confirmed metadata is not completely locked (not a snapshot guarantee)", async () => {
  const pkg = await confirm(await createApiPackage());
  executeSql(`update public.contract_package_snapshots set confirmed_at='2026-10-12T00:00:00Z' where id='${pkg.id}';`);
  const next = await readPackage(pkg.id);
  expect(next.confirmed_at).toBe("2026-10-12T00:00:00+00:00");
  expect(next.source_hash).toBe(pkg.source_hash);
  expect(next.contract_info).toEqual(pkg.contract_info);
});

test("CON-HASH canonical key order is stable and data changes alter source/document hashes", async () => {
  const snapshot = await snapshotForRpc();
  const reordered = Object.fromEntries(Object.entries(snapshot).reverse());
  expect(contractLib.hashJson(reordered)).toBe(contractLib.hashJson(snapshot));
  const changed = structuredClone(snapshot);
  changed.contract_info.total_amount += 1;
  expect(contractLib.hashJson(changed)).not.toBe(contractLib.hashJson(snapshot));
  expect(contractLib.buildContractDocuments(changed)[0].content_hash).not.toBe(contractLib.buildContractDocuments(snapshot)[0].content_hash);
});

test("FIXED KF-009 confirmed manifest hash cannot change", async () => {
  const pkg = await confirm(await createApiPackage());
  expect(() => executeSql(`update public.contract_package_snapshots set package_manifest_hash='${"f".repeat(64)}' where id='${pkg.id}';`)).toThrow();
  const changed = await readPackage(pkg.id);
  expect(changed.package_manifest_hash).toBe(pkg.package_manifest_hash);
});

test("CON-HASH candidate protects monetary metadata and CHANGE_PENDING original", async () => {
  const pkg = await confirm(await createApiPackage());
  for (const field of ["original_contract_amount", "prior_approved_change_total", "amount_delta", "revised_contract_amount"]) {
    expect(() => executeSql(`update public.contract_package_snapshots set ${field}=coalesce(${field},0)+1 where id='${pkg.id}';`)).toThrow(/locked contract integrity fields/);
  }
  await pendingChange(pkg);
  expect(() => executeSql(`update public.contract_package_snapshots set package_manifest_hash='${"e".repeat(64)}' where id='${pkg.id}';`)).toThrow();
  expect(() => executeSql(`update public.contract_package_snapshots set contract_info='{}'::jsonb where id='${pkg.id}';`)).toThrow();
  expect((await readPackage(pkg.id)).package_manifest_hash).toBe(pkg.package_manifest_hash);
});

test("CHANGE-01 pending successor keeps original amount and supplies 3 documents", async () => {
  const original = await confirm(await createApiPackage());
  const change = await pendingChange(original);
  expect((await readPackage(original.id)).status).toBe("CHANGE_PENDING");
  expect(change.status).toBe("CHANGE_PENDING");
  expect(change.amount_delta).toBe(130000);
  expect(change.pending_package.status).toBe("READY");
  expect(change.pending_package.package_version).toBe(original.package_version + 1);
  expect(change.pending_package.original_contract_amount).toBe(3770000);
  expect(change.pending_package.revised_contract_amount).toBe(3900000);
  expect(change.pending_package.estimate_snapshot.customer_quote.groups.reduce((sum,group)=>sum+group.total,0)).toBe(3900000);
  expect(change.pending_package.contract_document_versions).toHaveLength(3);
});

for (const field of ["customer_name", "approval_method", "customer_signed_at", "evidence_file_id", "approved_document_hash", "approved_package_version"]) {
  test(`CHANGE-DENY missing ${field} rolls back approval`, async () => {
    const change = await pendingChange(await confirm(await createApiPackage()));
    const approval = approvalPayload(change);
    delete approval[field];
    const before = await contractState();
    const result = await approve(change, approval);
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.data.message).toContain("evidence is required");
    expect(await contractState()).toEqual(before);
  });
}
for (const field of ["approved_document_hash", "approved_package_version"]) {
  test(`CHANGE-DENY wrong ${field} cannot approve`, async () => {
    const change = await pendingChange(await confirm(await createApiPackage()));
    const before = await contractState();
    const result = await approve(change, { ...approvalPayload(change), [field]: field.endsWith("hash") ? "wrong-hash" : 999 });
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.data.message).toContain("does not match");
    expect(await contractState()).toEqual(before);
  });
}

test("CHANGE-02 approval supersedes original, contracts successor and freezes evidence", async () => {
  const original = await confirm(await createApiPackage());
  const change = await pendingChange(original);
  const approved = await approve(change);
  expect(approved.status).toBe(200);
  expect(approved.data.status).toBe("APPROVED");
  expect((await readPackage(original.id)).status).toBe("SUPERSEDED");
  expect(approved.data.pending_package.status).toBe("CONTRACTED");
  for (const doc of approved.data.pending_package.contract_document_versions) {
    expect(doc.generation_status).toBe("FINAL"); expect(doc.locked_at).toBeTruthy();
  }
  const approval = approved.data.change_order_approvals[0];
  for (const [table,id] of [["change_orders", change.id], ["change_order_approvals", approval.id]]) {
    expect(() => executeSql(`update public.${table} set created_at=now() where id='${id}';`)).toThrow();
    expect(() => executeSql(`delete from public.${table} where id='${id}';`)).toThrow();
  }
  const before = await contractState();
  expect((await approve(change)).status).toBeGreaterThanOrEqual(400);
  expect(await contractState()).toEqual(before);
});
