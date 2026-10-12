import { describe, expect, test } from "vitest";
import {
  clone, latestEstimate, legacyFractionalEstimate, TEST_ADDRESS, TEST_ESTIMATE_ID,
  TEST_PACKAGE_ID, testProfile,
} from "../fixtures/estimates.js";
import { regressionTest } from "../helpers/known-failure.js";
import { createEstimateDatabase, flushAsyncWork, mountOs } from "../helpers/os-harness.js";
import { mutations, requestLog } from "../helpers/network.js";

async function readAndLoad(fixture, packages = []) {
  const database = createEstimateDatabase(fixture, packages);
  const before = clone(database.row);
  const { main, storage } = await mountOs(database, testProfile());
  const estimate = await storage.getEstimate(fixture.id);
  main.loadEstimateIntoUi(estimate);
  await flushAsyncWork();
  return { main, storage, database, before, estimate };
}

describe("P0-1 latest estimate read-only load", () => {
  test("GET and UI load never POST or PATCH and retain the saved result", async () => {
    const evidence = await readAndLoad(latestEstimate());
    expect(mutations()).toEqual([]);
    expect(evidence.database.mutations).toEqual([]);
    expect(evidence.database.row).toEqual(evidence.before);
    expect(document.getElementById("clientTotal").textContent).toBe("3,770,000원");
    expect(evidence.estimate.customerQuote).toEqual(evidence.before.estimate_data.customerQuote);
    expect(evidence.estimate.total).toBe(3770000);
    expect(evidence.estimate.costTotal).toBe(2900000);
    expect(evidence.estimate.address).toBe(TEST_ADDRESS);
  });

  test("reading an already CONTRACTED latest quote does not update it", async () => {
    const evidence = await readAndLoad(latestEstimate(), [{
      id: TEST_PACKAGE_ID, estimate_id: TEST_ESTIMATE_ID, status: "CONTRACTED", package_version: 1,
      contract_no: "AND-2026-01-001",
    }]);
    expect(evidence.database.packages[0].status).toBe("CONTRACTED");
    expect(evidence.database.row).toEqual(evidence.before);
    expect(mutations()).toEqual([]);
  });
});

regressionTest("KF-001", "fractional margin lookup must never repair/PATCH the source", async () => {
  const evidence = await readAndLoad(legacyFractionalEstimate());
  expect(requestLog.requests.some(({ method }) => method === "GET")).toBe(true);
  return evidence;
}, ({ database, before }) => {
  expect(database.mutations, "C1: lookup must not call updateEstimate").toEqual([]);
  expect(database.row).toEqual(before);
  expect(document.getElementById("clientTotal").textContent).toBe("3,770,000원");
});

regressionTest("KF-002", "fractional margin lookup must protect a CONTRACTED project", async () => {
  return readAndLoad(legacyFractionalEstimate(), [{
    id: TEST_PACKAGE_ID, estimate_id: TEST_ESTIMATE_ID, status: "CONTRACTED", package_version: 1,
    contract_no: "AND-2026-01-001",
  }]);
}, ({ database, before }) => {
  expect(database.row.total_price, "C1: confirmed-project read must retain price").toBe(before.total_price);
  expect(database.mutations).toEqual([]);
  expect(database.row).toEqual(before);
  expect(document.getElementById("clientTotal").textContent).toBe("3,770,000원");
});

regressionTest("KF-003", "general edit/save must preserve the existing site address", async () => {
  const evidence = await readAndLoad(latestEstimate());
  document.getElementById("demolitionFurnitureM").value = "1500";
  document.getElementById("demolitionFurnitureM").dispatchEvent(new Event("input", { bubbles: true }));
  await evidence.main.handleSaveEstimate("update");
  await flushAsyncWork();
  const patch = evidence.database.mutations.find(({ method }) => method === "PATCH");
  expect(patch, "The real update save path must have run").toBeDefined();
  return { ...evidence, patch };
}, ({ database, patch }) => {
  expect(patch.body.address, "H5: update payload must retain the saved site address").toBe(TEST_ADDRESS);
  expect(database.row.address).toBe(TEST_ADDRESS);
});
