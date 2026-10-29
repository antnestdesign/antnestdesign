import { expect, test } from "vitest";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";
import { createEstimateDatabase, mountOs, flushAsyncWork } from "../helpers/os-harness.js";
import { PRELIMINARY_TRADES } from "../../../public/os-app/src/preliminary-estimate-view.js";
import { mutations, jsonResponse } from "../helpers/network.js";
import { calculateStaffEstimate, projectStaffEstimate } from "../../../app/api/os/estimates/_lib/estimates.js";

async function assertDisplayedMoney(expected) {
  const sum = [...document.querySelectorAll(".preliminary-trade-amount")]
    .reduce((total, node) => total + Number(node.textContent.replace(/[^\d-]/g, "")), 0);
  expect(sum).toBe(expected);
  for (const id of ["clientTotal", "quoteTotal"]) expect(Number(document.getElementById(id).textContent.replace(/[^\d-]/g, ""))).toBe(expected);
  document.querySelector(".preliminary-actions button:last-child").click();
  await flushAsyncWork();
  const print = document.getElementById("printQuoteSheet");
  const printedSum = [...print.querySelectorAll("tbody tr td:last-child")]
    .reduce((total, node) => total + Number(node.textContent.replace(/[^\d-]/g, "")), 0);
  expect(printedSum).toBe(expected);
  expect(print.textContent).not.toMatch(/저장 금액 포함|입력 미선택|직접원가|마진율/);
}

for (const role of ["admin", "manager", "staff"]) test(`${role}: existing load -> trade navigation -> same total, no writes, same customer summary print`, async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const { main, storage } = await mountOs(database, testProfile(role));
  main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  await flushAsyncWork();
  const before = structuredClone(database.row);
  const rows = document.getElementById("quoteRows").innerHTML;
  const total = document.getElementById("clientTotal").textContent;
  const status = document.getElementById("saveStatus").textContent;
  for (const trade of PRELIMINARY_TRADES) document.getElementById(`preliminary-${trade.id}-button`).click();
  await flushAsyncWork();
  expect(document.querySelector(".preliminary-context").textContent).toBe("저장 견적 수정 중");
  expect(document.querySelector(".preliminary-identity").textContent).toContain(fixture.projectName);
  expect(document.getElementById("clientTotal").textContent).toBe(total);
  expect(document.getElementById("quoteRows").innerHTML).toBe(rows);
  expect(document.getElementById("saveStatus").textContent).toBe(status);
  expect(mutations()).toEqual([]);
  expect(database.row).toStrictEqual(before);
  document.getElementById("printQuoteButton").click();
  await flushAsyncWork();
  const oldPrint = document.getElementById("printQuoteSheet").innerHTML;
  document.querySelector(".preliminary-actions button:last-child").click();
  await flushAsyncWork();
  expect(document.getElementById("printQuoteSheet").innerHTML).toBe(oldPrint);
  expect(document.querySelector(".preliminary-overview").textContent).not.toMatch(/직접원가|내부 원가|이익|마진/);
  if (role === "staff") expect(document.getElementById("internalDetailRows")).toBeNull();
});

test("folded controls retain the update payload, saved snapshot and exact reload after a real input edit", async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const { main, storage } = await mountOs(database, testProfile());
  main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  await flushAsyncWork();
  const storedBeforeEdit = structuredClone(database.row);
  expect(document.getElementById("clientTotal").textContent).toBe("3,770,000원");
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("저장 견적 총액");
  document.getElementById("preliminary-sectionDemolitionEnabled-button").click();
  const input = document.getElementById("demolitionFurnitureM");
  input.value = "1800";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await main.ensureServerCalculation();
  const expected = main.buildEstimateSnapshot(main.calculateForCurrentEstimate());
  expect(expected.total).toBe(195000);
  await flushAsyncWork();
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("현재 견적 총액");
  for (const tab of ["quote", "admin", "client"]) {
    document.querySelector(`.tab-button[data-tab="${tab}"]`).click();
    await flushAsyncWork();
    expect(database.row).toStrictEqual(storedBeforeEdit);
    expect(database.mutations).toEqual([]);
    expect(document.getElementById("clientTotal").textContent).toBe("195,000원");
  }
  document.getElementById("preliminary-sectionFurnitureEnabled-button").click();
  await main.handleSaveEstimate("update");
  await flushAsyncWork();
  const payload = database.mutations.at(-1).body.estimate_data;
  expect(database.mutations).toHaveLength(1);
  expect(payload.inputs.demolitionFurnitureM).toBe("1800");
  for (const key of ["total", "totalText", "costTotal", "marginRate", "customerQuote", "internalDetails", "internalSummary", "inputs"]) {
    if (key === "customerQuote") expect(payload[key].groups).toStrictEqual(expected[key].groups);
    else expect(payload[key]).toStrictEqual(expected[key]);
  }
  const saved = await storage.getEstimate(fixture.id);
  main.loadEstimateIntoUi(saved);
  await flushAsyncWork();
  expect(input.value).toBe("1800");
  expect(document.getElementById("clientTotal").textContent).toBe(payload.totalText);
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("저장 견적 총액");
  expect(saved.customerQuote).toStrictEqual({ ...payload.customerQuote, savedAt: database.row.updated_at });
  expect(document.querySelectorAll(".preliminary-trade")).toHaveLength(9);
});

for (const loaded of [false, true]) test(`${loaded ? "loaded estimate copy" : "new estimate"}: existing new-save action is unchanged`, async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const originalHandler = database.handle;
  const newId = "10000000-0000-4000-8000-000000000002";
  database.handle = request => {
    if (request.method === "POST" && request.url.pathname === "/rest/v1/estimates") {
      database.mutations.push({ method: "POST", body: structuredClone(request.body) });
      return jsonResponse([{ ...request.body, id: newId, created_at: fixture.savedAt, updated_at: fixture.savedAt }]);
    }
    return originalHandler(request);
  };
  const { main, storage } = await mountOs(database, testProfile());
  if (loaded) main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  else document.getElementById("projectName").value = "SYSTEM_SYNTHETIC_NEW";
  const original = structuredClone(database.row);
  await main.ensureServerCalculation();
  const expected = main.buildEstimateSnapshot(main.calculateForCurrentEstimate());
  document.getElementById("preliminary-sectionFurnitureEnabled-button").click();
  await main.handleSaveEstimate("new");
  await flushAsyncWork();
  const saved = database.mutations.find(entry => entry.method === "POST").body.estimate_data;
  expect(saved.customerQuote.groups).toStrictEqual(expected.customerQuote.groups);
  expect(saved.internalDetails).toStrictEqual(expected.internalDetails);
  expect(saved.inputs).toStrictEqual(expected.inputs);
  expect(saved.total).toBe(expected.total);
  expect(database.row).toStrictEqual(original);
  expect(document.getElementById("saveStatus").textContent).toContain("새 견적 저장 완료");
});

for (const role of ["admin", "manager", "staff"]) test(`${role}: saved selection mismatch is explicit; real deselection recalculates; returning to baseline restores original saved result`, async () => {
  const fixture = latestEstimate();
  const database = createEstimateDatabase(fixture);
  const originalHandler = database.handle;
  const profile = testProfile(role);
  database.handle = async request => {
    if (request.method === "POST" && request.url.pathname === "/api/os/estimates/preview") {
      const snapshot = await calculateStaffEstimate({ inputs: request.body.inputs }, { profile, authUser: { id: profile.id } }, database.row);
      return jsonResponse(projectStaffEstimate({ ...database.row, total_price: snapshot.total, estimate_data: snapshot }));
    }
    return originalHandler(request);
  };
  const { main, storage } = await mountOs(database, profile);
  main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));
  await flushAsyncWork();
  const original = JSON.stringify(database.row);
  await assertDisplayedMoney(3770000);
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("저장 견적 총액");
  expect(document.querySelector(".preliminary-source-notice").hidden).toBe(false);
  expect(document.querySelector('[data-trade="sectionElectricalEnabled"] .preliminary-amount-source').textContent).toBe("저장 금액 포함");
  if (role !== "staff") expect(main.buildEstimateSnapshot(main.calculateForCurrentEstimate()).total).toBe(fixture.total);
  const toggle = document.getElementById("sectionDemolitionEnabled");
  toggle.checked = false;
  toggle.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise(done => setTimeout(done, 210));
  await flushAsyncWork();
  await assertDisplayedMoney(0);
  expect(document.querySelector(".preliminary-source-notice").hidden).toBe(true);
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("현재 견적 총액");
  expect(document.getElementById("demolitionFurnitureM").value).toBe("1200");
  toggle.checked = true;
  toggle.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise(done => setTimeout(done, 210));
  await flushAsyncWork();
  await assertDisplayedMoney(3770000);
  expect(document.getElementById("clientTotal").previousElementSibling.textContent).toBe("저장 견적 총액");
  expect(JSON.stringify(database.row)).toBe(original);
  expect(database.mutations).toEqual([]);
}, 15000);

for (const role of ["admin", "manager"]) test(`${role}: all 9 current-input trades and multiple selection stay exact across list, engine, header and customer output`, async () => {
  const database = createEstimateDatabase(latestEstimate());
  const { main } = await mountOs(database, testProfile(role));
  const settings = {
    projectName: "SYSTEM_SYNTHETIC_TRADE_SELECTION", demolitionFurnitureEnabled: true, demolitionFurnitureM: "1200",
    electricalEnabled: true, bathroomUnits: "1", wallpaperPublicWallLengthM: "12000", wallpaperRoomWallLengthM: "24000",
    filmMaterialLengthM: "10", flooringArea: "20", carpentryCurtainBoxUnits: "1", baseEnabled: true,
    lowerCabinetM: "3000", generalWasteEnabled: true,
  };
  for (const [id, value] of Object.entries(settings)) {
    const node = document.getElementById(id);
    if (node.type === "checkbox") node.checked = value;
    else node.value = value;
  }
  for (const trade of PRELIMINARY_TRADES) {
    const toggle = document.getElementById(trade.id);
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    await flushAsyncWork();
    const expected = main.buildEstimateSnapshot(main.calculateForCurrentEstimate()).total;
    expect(expected).toBeGreaterThan(0);
    await assertDisplayedMoney(expected);
    toggle.checked = false;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
    await flushAsyncWork();
    await assertDisplayedMoney(0);
  }
  for (const trade of PRELIMINARY_TRADES) {
    const toggle = document.getElementById(trade.id);
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change", { bubbles: true }));
  }
  await flushAsyncWork();
  await assertDisplayedMoney(main.buildEstimateSnapshot(main.calculateForCurrentEstimate()).total);
  expect(database.mutations).toEqual([]);
}, 15000);
