import { expect, test, vi } from "vitest";
import { internalEstimate, testProfile, testSession } from "../fixtures/estimates.js";
import { createEstimateDatabase } from "../helpers/os-harness.js";
import { clearRequestLog, mutations, requestLog, setMockHandler } from "../helpers/network.js";

async function storageAs(role) {
  vi.resetModules();
  sessionStorage.setItem("and-os.auth-session", JSON.stringify(testSession(role)));
  const database = createEstimateDatabase(internalEstimate());
  database.profile = testProfile(role);
  setMockHandler(database.handle);
  const storage = await import("../../../public/os-app/src/storage.js");
  storage.loadStoredSession();
  await storage.loadCurrentOsUser();
  clearRequestLog();
  return { database, storage };
}

test("P0-2 staff contract metadata request uses the protected Next API", async () => {
  const { storage, database } = await storageAs("staff");
  const result = await storage.loadContractOptions(database.row.id);
  expect(result).toEqual({ estimate_id: database.row.id });
  expect(requestLog.requests[0].url.pathname).toBe("/api/os/contract-options");
  expect(mutations()).toEqual([]);
});

test("update without an address field preserves the existing row address", async () => {
  const { storage, database } = await storageAs("admin");
  const address = database.row.address;
  const estimate = { ...database.row.estimate_data };
  delete estimate.address;
  const saved = await storage.updateEstimate(database.row.id, estimate);
  const patch = mutations().find(({ method }) => method === "PATCH");
  expect(patch.body).not.toHaveProperty("address");
  expect(database.row.address).toBe(address);
  expect(saved.address).toBe(address);
});

test("FIXED KF-004 staff estimates use server whitelist API, never raw REST", async () => {
  const { storage } = await storageAs("staff");
  const estimates = await storage.loadEstimates();
  expect(estimates).toHaveLength(1);
  const request = requestLog.requests[0];
  expect(request.method).toBe("GET");
  expect(request.url.pathname).toBe("/api/os/estimates");
  expect(requestLog.requests.some(({ url }) => url.pathname === "/rest/v1/estimates")).toBe(false);
  const { internalDetails, internalSummary, costTotal, marginRate, costSnapshot } = estimates[0];
  expect({ internalDetails, internalSummary, costTotal, marginRate, costSnapshot }, "H2: browser-facing staff result must remove internal fields").toEqual({
    internalDetails: undefined, internalSummary: undefined, costTotal: undefined,
    marginRate: undefined, costSnapshot: undefined,
  });
});

test("KF-005 POLICY CLARIFIED: manager can update estimate business fields", async () => {
  const { storage, database } = await storageAs("manager");
  const saved = await storage.updateEstimate(database.row.id, {
    ...database.row.estimate_data, projectName: "SYSTEM_SYNTHETIC_MANAGER_EDIT", phone: "000-0000-0001",
  });
  expect(mutations()).toHaveLength(1);
  expect(mutations()[0].method).toBe("PATCH");
  expect(saved.projectName).toBe("SYSTEM_SYNTHETIC_MANAGER_EDIT");
  expect(saved.phone).toBe("000-0000-0001");
});

test("KF-006 CLIENT GUARD: manager cannot issue estimate DELETE", async () => {
  const { storage, database } = await storageAs("manager");
  await expect(storage.deleteEstimate(database.row.id)).rejects.toThrow("관리자만 견적을 삭제할 수 있습니다.");
  expect(mutations(), "manager must not issue DELETE").toEqual([]);
  expect(database.row).not.toBeNull();
  expect(requestLog.requests[0].url.pathname).toBe("/api/os/me");
});

test("admin estimate deletion still uses the existing REST path", async () => {
  const { storage, database } = await storageAs("admin");
  await storage.deleteEstimate(database.row.id);
  expect(mutations().map(({ method }) => method)).toEqual(["DELETE"]);
  expect(database.row).toBeNull();
});
