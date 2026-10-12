import { afterEach, beforeEach, expect, test } from "vitest";
import { NextRequest } from "next/server";
import { dbRuntime, resetFixtures, executeSql, dbFile } from "../runtime.mjs";
import { ESTIMATE_A, ESTIMATE_NEW } from "../fixtures.mjs";
import { ESTIMATE_INPUT_SCHEMA } from "../../../../public/os-app/src/estimate-inputs.js";
import { safeInputs, staffInputIds } from "../../../../app/api/os/estimates/_lib/estimates.js";
import * as list from "../../../../app/api/os/estimates/route.ts";
import * as detail from "../../../../app/api/os/estimates/[id]/route.ts";
import * as preview from "../../../../app/api/os/estimates/preview/route.ts";

const { request, accounts } = dbRuntime();
const created = new Set();
const costFixtureId = "40000000-0000-4000-8000-000000000005";
function resetCostFixture(insert = false) {
  executeSql(`select set_config('request.and_os_cost_rpc','on',true);
    delete from public.cost_items where id='${costFixtureId}';
    ${insert ? `insert into public.cost_items(id,category,item_code,item_name,unit,cost_price,default_margin_rate,is_active)
      values('${costFixtureId}','가구','CABINET_LOWER','Synthetic lower cabinet','자',12345,0.3,true);` : ""}`);
}
const params = (id) => ({ params: Promise.resolve({ id }) });
const req = (method, body, role = "staff-active") => new NextRequest("https://os.invalid/api/os/estimates", {
  method, headers: { Authorization: `Bearer ${accounts[role].token}`, "Content-Type": "application/json" },
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});
const forbidden = /^(cost|costTotal|cost_total|costPrice|cost_price|margin|marginRate|margin_rate|defaultMarginRate|profit|internalDetails|internalSummary|internalMemo|costSnapshot|supplier|supplierData|unitPrice|correction|targetMargin|manualAdjustment|.*Correction)$/i;
function safe(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    expect(key, `staff response field ${key}`).not.toMatch(forbidden);
    safe(child);
  }
}
async function full(id = ESTIMATE_A) {
  const result = await request(`/rest/v1/estimates?id=eq.${id}&select=*`, { service: true });
  expect(result.status).toBe(200);
  return result.data[0];
}
async function getSafe(id = ESTIMATE_A) {
  const response = await detail.GET(req("GET"), params(id));
  expect(response.status).toBe(200);
  const data = await response.json(); safeEstimate(data); return data;
}
function exactKeys(value, keys) { expect(Object.keys(value).sort()).toEqual([...keys].sort()); }
function safeEstimate(data) {
  safe(data);
  exactKeys(data, ["id", "projectName", "clientName", "phone", "clientPhone", "address", "areaPyeong", "total", "totalText", "status", "savedAt", "updatedAt", "inputs", "customerQuote"]);
  exactKeys(data.inputs, staffInputIds);
  exactKeys(data.customerQuote, ["projectName", "clientName", "phone", "areaPyeong", "savedAt", "total", "totalText", "status", "groups"]);
  for (const group of data.customerQuote.groups) {
    exactKeys(group, ["label", "total", "totalText", "items"]);
    for (const item of group.items) exactKeys(item, ["name", "amount", "amountText"]);
  }
}
function newInputs() {
  const inputs = safeInputs(Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id, schema]) => [id, schema.type === "checkbox" ? false : schema.value])));
  return { ...inputs, projectName: "SYSTEM_DB_2B_STAFF_CREATE", areaPyeong: "33", sectionFurnitureEnabled: true,
    baseEnabled: true, lowerCabinetM: "3000", upperCabinetM: "0", tallCabinetM: "0", baseCountertopEnabled: false,
    baseEndPanels: "0", baseLightingUnits: "0", baseT3Units: "0", riceCabinetUnits: "0",
    generalWasteEnabled: false, existingPipeCleaningEnabled: false };
}

beforeEach(() => { executeSql(dbFile("integrity/reset.sql")); resetFixtures(); resetCostFixture(true); });
afterEach(async () => {
  for (const id of created) {
    await request(`/rest/v1/estimate_document_options?estimate_id=eq.${id}`, { service: true, method: "DELETE" });
    await request(`/rest/v1/estimates?id=eq.${id}`, { service: true, method: "DELETE" });
  }
  created.clear();
  resetCostFixture();
  executeSql(dbFile("integrity/reset.sql"));
});

test("STAFF-READ list/detail are recursive whitelist responses and do not reprice legacy", async () => {
  const before = await full();
  const response = await list.GET(req("GET"));
  expect(response.status).toBe(200);
  const rows = await response.json(); rows.forEach(safeEstimate);
  expect(rows).toHaveLength(2);
  const data = await getSafe();
  expect(data.totalText).toBe(before.estimate_data.totalText);
  expect(data.total).toBe(Number(before.total_price));
  expect(await full()).toEqual(before);
});

test("STAFF-CREATE server computes customer and internal snapshots, returns only safe projection", async () => {
  const response = await list.POST(req("POST", { inputs: newInputs(), address: "SYNTHETIC SITE" }));
  const data = await response.json(); if (data.id) created.add(data.id);
  expect(response.status).toBe(201); safeEstimate(data);
  const row = await full(data.id);
  expect(Number(row.cost_total)).toBeGreaterThan(0);
  expect(Number(row.cost_total)).toBe(123450);
  expect(Number(row.total_price)).toBe(160000);
  expect(row.estimate_data.internalDetails.length).toBeGreaterThan(0);
  expect(row.estimate_data.costSnapshot.source).toBe("supabase_cost_items");
  expect(Number(row.total_price)).toBe(data.total);
  expect(await getSafe(data.id)).toMatchObject({ id: data.id, total: data.total });
});

test("STAFF-UPDATE calculating inputs regenerate internal details, preserve protected author/snapshot/address", async () => {
  const before = await full(); const data = await getSafe();
  const response = await detail.PATCH(req("PATCH", { inputs: { ...data.inputs, demolitionFurnitureM: "4200" } }), params(ESTIMATE_A));
  expect(response.status).toBe(200); safe(await response.json());
  const after = await full();
  expect(after.estimate_data.internalDetails).not.toEqual(before.estimate_data.internalDetails);
  expect(after.estimate_data.costSnapshot).toEqual(before.estimate_data.costSnapshot);
  expect(after.estimate_data.author).toEqual(before.estimate_data.author);
  expect(after.address).toBe(before.address);
  expect(after.estimate_data.internalSummary.directCost).toBe(Number(after.cost_total));
  expect(after.estimate_data.internalSummary.customerRevenue).toBe(Number(after.total_price));
});

test("STAFF-UPDATE metadata/no-op save keeps legacy internal amounts and snapshots unchanged", async () => {
  const before = await full(); const data = await getSafe();
  const response = await detail.PATCH(req("PATCH", { inputs: { ...data.inputs, clientName: "Synthetic customer edit" } }), params(ESTIMATE_A));
  expect(response.status).toBe(200); safeEstimate(await response.json());
  const after = await full();
  for (const key of ["internalDetails", "internalSummary", "costSnapshot", "author"]) {
    expect(after.estimate_data[key]).toEqual(before.estimate_data[key]);
  }
  expect(Number(after.cost_total)).toBe(Number(before.cost_total));
  expect(Number(after.total_price)).toBe(Number(before.total_price));
  expect(after.client_name).toBe("Synthetic customer edit");
});

test("STAFF-PIPE pipe-only update preserves every other trade and is idempotent through save/reload", async () => {
  const before = await full(); const input = (await getSafe()).inputs;
  const toggle = async (enabled) => {
    const response = await detail.PATCH(req("PATCH", { inputs: { ...input, existingPipeCleaningEnabled: enabled } }), params(ESTIMATE_A));
    expect(response.status).toBe(200); safe(await response.json()); return full();
  };
  const on = await toggle(true), again = await toggle(true);
  expect(Number(on.cost_total)).toBe(Number(before.cost_total) + 300000);
  expect(Number(on.total_price)).toBe(Number(before.total_price) + 300000);
  expect(on.estimate_data.internalSummary.profit).toBe(before.estimate_data.internalSummary.profit);
  expect(Number(again.cost_total)).toBe(Number(on.cost_total));
  expect(on.estimate_data.internalDetails.filter((d) => d.item !== "기존 배관 청소")).toEqual(before.estimate_data.internalDetails);
  expect(on.estimate_data.customerQuote.groups.filter((g) => g.label !== "기타")).toEqual(before.estimate_data.customerQuote.groups.filter((g) => g.label !== "기타"));
  const off = await toggle(false);
  expect(Number(off.cost_total)).toBe(Number(before.cost_total));
  expect(Number(off.total_price)).toBe(Number(before.total_price));
  expect(off.estimate_data.internalDetails).toEqual(before.estimate_data.internalDetails);
});

test("STAFF-PIPE legacy disabled-section flags do not force unrelated repricing", async () => {
  const row = await full();
  row.estimate_data.inputs.sectionWallpaperEnabled = false;
  row.estimate_data.inputs.wallpaperBaseCoatEnabled = true;
  await request(`/rest/v1/estimates?id=eq.${ESTIMATE_A}`, { service: true, method: "PATCH", body: { estimate_data: row.estimate_data } });
  const inputs = (await getSafe()).inputs;
  const response = await detail.PATCH(req("PATCH", { inputs: { ...inputs, wallpaperBaseCoatEnabled: false, existingPipeCleaningEnabled: true } }), params(ESTIMATE_A));
  expect(response.status).toBe(200);
  const after = await full();
  expect(Number(after.total_price)).toBe(Number(row.total_price) + 300000);
  expect(Number(after.cost_total)).toBe(Number(row.cost_total) + 300000);
  expect(after.estimate_data.internalDetails.filter((d) => d.item !== "기존 배관 청소")).toEqual(row.estimate_data.internalDetails);
});

for (const injected of [{ cost_total: 1 }, { margin_rate: 999 }, { internalDetails: [{ cost: 1 }] },
  { costSnapshot: { items: [] } }, { customerQuote: { total: 1 } }, { profit: 999999 }]) {
  test(`STAFF-INJECTION rejects ${Object.keys(injected)[0]} in create and update`, async () => {
    const before = await full();
    for (const create of [true, false]) {
      const request = req(create ? "POST" : "PATCH", { inputs: newInputs(), ...injected });
      const response = create ? await list.POST(request) : await detail.PATCH(request, params(ESTIMATE_A));
      expect(response.status).toBe(400); safe(await response.json());
    }
    expect(await full()).toEqual(before);
  });
}

test("STAFF-INJECTION rejects nested protected input and malicious published rate", async () => {
  for (const injected of [{ targetMargin: "999" }, { rateLowerPerJa: "1" }, { baseEnabled: { cost: 1 } }]) {
    const response = await detail.PATCH(req("PATCH", { inputs: { ...newInputs(), ...injected } }), params(ESTIMATE_A));
    expect(response.status).toBe(400);
  }
});

test("STAFF-PREVIEW uses trusted calculation without writing any row", async () => {
  const before = await full(); const data = await getSafe();
  const response = await preview.POST(req("POST", { estimateId: ESTIMATE_A, inputs: { ...data.inputs, existingPipeCleaningEnabled: true } }));
  expect(response.status).toBe(200); const result = await response.json(); safe(result);
  expect(result.total).toBe(Number(before.total_price) + 300000);
  expect(await full()).toEqual(before);
});

for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
  test(`STAFF-BYPASS direct REST ${method} cannot expose/mutate estimates`, async () => {
    const before = await full();
    const response = await request(`/rest/v1/estimates${method === "POST" ? "" : `?id=eq.${ESTIMATE_A}&select=*`}`, {
      account: "staff-active", method, ...(method === "POST" ? { body: { id: ESTIMATE_NEW, project_name: "BYPASS" } }
        : method === "PATCH" ? { body: { cost_total: 1 } } : {}),
    });
    expect([401,403].includes(response.status) || (response.status === 200 && response.data.length === 0)).toBe(true);
    expect(await full()).toEqual(before);
  });
}

for (const role of ["admin-active", "manager-active"]) {
  test(`STAFF-REGRESSION ${role} retains full internal reads`, async () => {
    const response = await detail.GET(req("GET", undefined, role), params(ESTIMATE_A));
    expect(response.status).toBe(200);
    expect((await response.json()).estimate_data.internalDetails.length).toBeGreaterThan(0);
  });
}

test("STAFF-AUTH unauthenticated/inactive/password-change requests fail closed", async () => {
  const anonymous = await list.GET(new NextRequest("https://os.invalid/api/os/estimates"));
  expect(anonymous.status).toBe(401);
  for (const role of ["staff-inactive", "staff-must-change-password"]) {
    expect((await list.GET(req("GET", undefined, role))).status).toBe(403);
  }
  expect((await detail.GET(req("GET"), params("10000000-0000-4000-8000-999999999999"))).status).toBe(404);
});

test("STAFF-CONTRACT safe estimate remains usable for options and three-document preview, not confirm", async () => {
  const options = await import("../../../../app/api/os/contract-options/route.ts");
  const documents = await import("../../../../app/api/os/contract-packages/preview/route.ts");
  const confirm = await import("../../../../app/api/os/contract-packages/[id]/confirm/route.ts");
  const before = await full();
  const optionsRequest = new NextRequest(`https://os.invalid/api/os/contract-options?estimateId=${ESTIMATE_A}`, { headers: req("GET").headers });
  expect((await options.GET(optionsRequest)).status).toBe(200);
  const response = await documents.POST(req("POST", { estimate_id: ESTIMATE_A }));
  expect(response.status).toBe(200); const data = await response.json(); safe(data);
  expect(data.documents.map((d) => d.document_type)).toEqual(["CONTRACT", "QUOTE", "SPEC"]);
  expect(data.snapshot.estimate_snapshot.total_price).toBe(Number(before.total_price));
  expect((await confirm.POST(req("POST", {}), params("10000000-0000-4000-8000-999999999999"))).status).toBe(403);
  expect(await full()).toEqual(before);
});

test("STAFF-CONTRACT option write remains allowed and cannot change the source estimate", async () => {
  const route = await import("../../../../app/api/os/contract-options/route.ts");
  const before = await full();
  const response = await route.PUT(req("PUT", { estimate_id: ESTIMATE_A, admin_tasks: { resident_consent_included: false } }));
  expect(response.status).toBe(200); safe(await response.json());
  expect(await full()).toEqual(before);
});
