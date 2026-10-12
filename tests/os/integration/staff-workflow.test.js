import { expect, test } from "vitest";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs } from "../helpers/os-harness.js";
import { requestLog } from "../helpers/network.js";

test("staff UI loads stored quote, previews pipe change, saves inputs only and reloads safe result", async () => {
  const database = createEstimateDatabase(latestEstimate());
  const { main, storage } = await mountOs(database, testProfile("staff"));
  main.loadEstimateIntoUi(await storage.getEstimate(database.row.id));
  const pipe = document.getElementById("existingPipeCleaningEnabled");
  pipe.checked = true;
  pipe.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 240));
  expect(document.getElementById("clientTotal").textContent).toBe("4,070,000원");
  await main.handleSaveEstimate("update");
  const patch = requestLog.requests.find((r) => r.method === "PATCH");
  expect(patch.url.pathname).toBe(`/api/os/estimates/${database.row.id}`);
  expect(Object.keys(patch.body).sort()).toEqual(["address", "inputs"]);
  expect(patch.body.inputs).not.toHaveProperty("targetMargin");
  expect(patch.body.inputs.existingPipeCleaningEnabled).toBe(true);
  expect(requestLog.requests.some((r) => r.url.pathname === "/rest/v1/estimates")).toBe(false);
  const saved = await storage.getEstimate(database.row.id);
  expect(saved).not.toHaveProperty("internalDetails");
  expect(saved).not.toHaveProperty("costTotal");
  main.loadEstimateIntoUi(saved);
  expect(document.getElementById("clientTotal").textContent).toBe("4,070,000원");
});
