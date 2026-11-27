import { beforeEach, expect, test, vi } from "vitest";

const state = vi.hoisted(() => ({
  id: "90000000-0000-4000-8000-000000000001", role: "admin", active: true,
  db: vi.fn(), checkContract: vi.fn(), readIssued: vi.fn(), issuedLinks: vi.fn(),
}));
vi.mock("../../../app/api/os/_lib/server", () => ({
  ApiError: class extends Error { constructor(status, message) { super(message); this.status = status; } },
  getUserContext: async () => ({ authUser: { id: state.id }, profile: { role: state.role } }),
  json: (value, init) => Response.json(value, init),
  errorResponse: error => Response.json({ error: error.message }, { status: error.status || 500 }),
  supabaseFetch: (...args) => state.db(...args),
}));
vi.mock("../../../app/api/os/contract-packages/_lib/confirmed-source", () => ({
  confirmedContractAccess: (...args) => state.checkContract(...args),
}));
vi.mock("../../../app/api/os/contract-packages/_lib/issued-access", () => ({
  issuedLinks: (...args) => state.issuedLinks(...args),
  readIssuedPackage: (...args) => state.readIssued(...args),
}));
import { GET as estimates } from "../../../app/api/os/estimates/route.ts";
import { GET as packages } from "../../../app/api/os/contract-packages/route.ts";
import { ApiError } from "../../../app/api/os/_lib/server";

const request = suffix => new Request("https://os.invalid/api/os/" + suffix);
let estimateRows, packageRows;
beforeEach(() => {
  state.role = "admin"; state.active = true;
  state.checkContract.mockReset(); state.readIssued.mockReset(); state.issuedLinks.mockReset().mockResolvedValue([]);
  estimateRows = [{ id: "estimate1", project_name: "Synthetic estimate", total_price: 341000,
    creator_id: state.id, creator_role: "staff", creator_name: "Synthetic author", revision: 5,
    confirmation_state: "draft", estimate_data: { internalDetails: [{ cost: 341 }] } }];
  packageRows = [{ id: "package1", status: "CONTRACTED", estimate_id: "estimate1", contract_no: "X-001",
    info_project_name: "Synthetic site", estimate_customer_phone: "01000000000", info_total_amount: 341000,
    contract_document_versions: [{ content_json: { memo: "PRIVATE_DOCUMENT" } }] }];
  state.db.mockReset().mockImplementation(async path => {
    if (path.startsWith("/rest/v1/profiles")) return [{
      id: state.id, role: state.role, is_active: state.active, must_change_password: false,
    }];
    if (path.startsWith("/rest/v1/estimates?")) return estimateRows;
    if (path.startsWith("/rest/v1/contract_package_snapshots?")) return packageRows;
    return [];
  });
});

test("staff estimate summaries preserve revision and permission without snapshots", async () => {
  state.role = "staff";
  const response = await estimates(request("estimates?summary=1"));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  const [entry] = await response.json();
  expect(entry).toMatchObject({ id: "estimate1", projectName: "Synthetic estimate", total: 341000,
    canEdit: true, canConfirm: false, revision: "5", authorship: { creatorName: "Synthetic author" } });
  for (const field of ["estimate_data", "customerQuote", "internalDetails", "inputs", "creator_role"]) {
    expect(entry).not.toHaveProperty(field);
  }
  const path = state.db.mock.calls.find(([url]) => url.startsWith("/rest/v1/estimates?"))[0];
  expect(path).toContain("archive.kind=eq.estimate&archive=is.null");
  expect(path).not.toContain("select=*");
});

test("contract estimate list retains archived linked estimates and omits archived legacy-only entries", async () => {
  estimateRows = [
    { ...estimateRows[0], id: "linked", confirmation_project_id: "project", legacy_archive: [{ kind: "legacy_contract" }] },
    { ...estimateRows[0], id: "unlinked", legacy_archive: [{ kind: "legacy_contract" }] },
    { ...estimateRows[0], id: "visible", legacy_archive: [] },
  ];
  const response = await estimates(request("estimates?summary=1&view=contracts"));
  expect((await response.json()).map(row => row.id)).toEqual(["linked", "visible"]);
  expect(state.db.mock.calls.find(([p]) => p.startsWith("/rest/v1/estimates?"))[0]).toContain("legacy_archive.kind=eq.legacy_contract");
  const original = await estimates(request("estimates"));
  expect((await original.json())[0]).toHaveProperty("estimate_data.internalDetails");
});

test("summary cannot bypass inactive actor checks or an employee's package scope", async () => {
  state.active = false;
  expect((await estimates(request("estimates?summary=1"))).status).toBe(403);
  state.active = true; state.role = "staff";
  state.db.mockClear();
  expect((await packages(request("contract-packages?summary=1"))).status).toBe(400);
  expect(state.db).not.toHaveBeenCalled();
});

test("package summary preserves search and workflow/issued access checks without document content", async () => {
  packageRows.push(
    { ...packageRows[0], id: "package2", preliminary_project_id: "denied-project" },
    { ...packageRows[0], id: "package3", preliminary_project_id: "allowed-project" },
    { ...packageRows[0], id: "package4" },
    { ...packageRows[0], id: "package5", preliminary_project_id: "allowed-project" },
    { ...packageRows[0], id: "package6", preliminary_project_id: "denied-project" },
  );
  state.checkContract.mockImplementation(async (_context, project) => {
    if (project === "denied-project") throw new ApiError(403, "denied");
  });
  state.issuedLinks.mockResolvedValue([{ package_id: "package4" }]);
  state.readIssued.mockResolvedValue({ id: "package4", contract_info: { project_name: "Synthetic issued", internal: 1 },
    contract_document_versions: [{ content_json: { memo: "PRIVATE_DOCUMENT" } }] });
  const response = await packages(request("contract-packages?summary=1&q=01000000000"));
  expect(response.status).toBe(200);
  const list = await response.json();
  expect(list.map(row => row.id)).toEqual(["package1", "package3", "package4", "package5"]);
  expect(list[0].contract_info).toMatchObject({ project_name: "Synthetic site", total_amount: 341000 });
  expect(list[2].contract_info).toEqual({ project_name: "Synthetic issued" });
  expect(JSON.stringify(list)).not.toMatch(/content_json|contract_document_versions|PRIVATE_DOCUMENT/);
  expect(state.checkContract.mock.calls.map(call => call[1])).toEqual(["denied-project", "allowed-project"]);
  expect(state.readIssued).toHaveBeenCalledWith(expect.anything(), "package4");
  expect(state.db.mock.calls[0][0]).not.toMatch(/select=\*|content_json/);
});
