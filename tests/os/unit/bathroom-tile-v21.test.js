import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { bathroomTileAmounts } from "../../../app/api/os/_lib/calculation/calculator/bathroom-tile.js";
import { bathroomTileMaterialPolicy, withBathroomTileMaterialPolicy } from "../../../app/api/os/_lib/calculation/bathroom-tile-materials.js";
import { describeSiteRows } from "../../../app/api/os/_lib/calculation/site-costs.js";
import { defaultPolicy, policyCatalog, validatePolicy } from "../../../app/api/os/_lib/calculation/preliminary-policy.js";
import { projectStaffEstimate, validateStaffBody } from "../../../app/api/os/estimates/_lib/estimates.js";
import { parseBathroomTileRooms } from "../../../public/os-app/src/bathroom-tile-inputs.js";
import { mountBathroomTileInputs } from "../../../public/os-app/src/bathroom-tile-view.js";
import { bindApplicationEvents } from "../../../public/os-app/src/application-events.js";
import { collectEstimateFormValues } from "../../../public/os-app/src/estimate-form.js";

const room = { wallLengthMm: 8000, floorArea: 4, wallTile: "ara-1200", floorTile: "ekr-600", labor: true, jolly: false };
const base = { sectionBathroomEnabled: true, bathroomUnits: "1", tileEnabled: true, tileGroutEnabled: true };
const payload = rooms => JSON.stringify(rooms);
const { wallLengthMm, ...oldRoomFields } = room;
const oldRoom = { wallLength: wallLengthMm / 1000, ...oldRoomFields };
function calculate(inputs) {
  const core = createEstimateCalculation();
  const r = core.calculate(core.readState({ ...base, ...inputs }));
  const details = r.details.filter(d => d.group === "tile");
  return { details, otherDetails: r.details.filter(d => d.group !== "tile"), quote: core.groupedCustomerItems(details, []) };
}
const sum = (rows, key) => rows.reduce((n, d) => n + d[key], 0);

test("the reference room buys 20 boxes, lays 17 and totals 1,752,000 / 2,277,000", () => {
  expect(bathroomTileAmounts(room, true)).toEqual({
    wallBuy: 16, floorBuy: 4, wallLay: 14, floorLay: 3, cerafix: 4, dryfix: 2, grout: 2,
    tile: 612000, supplies: 90000, labor: 700000, jolly: 0,
  });
  const { details, quote, otherDetails } = calculate({ bathroomTileRooms: payload([room]) });
  expect(sum(details, "cost")).toBe(1752000);
  expect(details.find(d => d.item.includes("타일 부자재")).input).toContain("세라픽스 4개 / 드라이픽스 2포 / 줄눈재 2포");
  expect(quote[0].total).toBe(2277000);
  expect(quote[0].items.find(i => i.name.includes("타일 자재")).name).toContain("벽체 실속형 600×1200 / 바닥 표준형 600×600");
  expect(details.map(d => d.item)).not.toContain("타일 기공");
  expect(details.map(d => d.item)).not.toContain("타일 조공");
  expect(otherDetails.map(d => d.item)).not.toContain("욕실 포세린 타일 자재+잡자재");
});

test.each([
  ["ara-1200", 30600], ["ara-600", 18360],
  ["ekr-1200", 42840], ["ekr-600", 30600],
  ["lt-1200", 75888], ["lt-600", 61200],
])("tile %s receives the purchase price discount once", (wallTile, price) => {
  expect(bathroomTileAmounts({ ...room, wallTile, wallLengthMm: 300, floorArea: 0 }, true))
    .toMatchObject({ wallBuy: 1, tile: price, labor: 700000 });
});

test("bathroom material policy defaults, editable coverage, and saved rates stay independent", () => {
  const defaults = bathroomTileMaterialPolicy();
  const old = defaultPolicy(createEstimateCalculation().policyDefaults());
  for (const area of ["prices", "parameters"]) for (const key of Object.keys(defaults[area])) delete old[area][key];
  const normalized = validatePolicy(old);
  expect(bathroomTileMaterialPolicy(normalized)).toEqual(defaults);
  expect(old.prices.BATH_TILE_DRYFIX).toBeUndefined();
  const newPrices = structuredClone(normalized);
  Object.assign(newPrices.prices, { BATH_TILE_CERAFIX: 20000, BATH_TILE_DRYFIX: 7000, BATH_TILE_GROUT_MATERIAL: 6000 });
  Object.assign(newPrices.parameters, { bathTileCerafixCoverage: 2, bathTileDryfixCoverage: 0.5 });
  const cost = policy => {
    const core = createEstimateCalculation({ preliminaryPolicy: policy });
    return core.calculate(core.readState({ ...base, bathroomTileRooms: payload([room]) })).details.find(d => d.item === "욕실 1 타일 부자재");
  };
  expect(cost(newPrices)).toMatchObject({ cost: 93000, input: "세라픽스 3개 / 드라이픽스 3포 / 줄눈재 2포" });
  expect(cost(withBathroomTileMaterialPolicy(newPrices, old)).cost).toBe(90000);
  expect(policyCatalog().prices.find(p => p.key === "BATH_TILE_DRYFIX")).toMatchObject({ label: "드라이픽스", unit: "포", trade: "욕실·타일" });
  for (const value of [0, -1, null, 0.0001, 1001, "1"]) {
    const invalid = structuredClone(newPrices);
    invalid.parameters.bathTileDryfixCoverage = value;
    expect(() => validatePolicy(invalid)).toThrow(/드라이픽스/);
  }
});

test("each room has its own minimum; grout labor remains one line and jolly is independent", () => {
  const second = { ...room, wallLengthMm: 600, floorArea: 1.44, wallTile: "lt-600", jolly: true };
  expect(bathroomTileAmounts(second, true)).toMatchObject({ wallLay: 1, floorLay: 1, wallBuy: 2, floorBuy: 2, labor: 700000 });
  const inputs = { bathroomUnits: "2", bathroomTileRooms: payload([room, second]) };
  const work = calculate(inputs).details;
  expect(work.filter(d => d.item.includes("타일 시공 인건비")).map(d => d.cost)).toEqual([700000, 700000]);
  expect(work.filter(d => d.item === "타일 메지").map(d => d.cost)).toEqual([350000]);
  expect(work.filter(d => d.item.includes("졸리컷"))).toMatchObject([{ item: "욕실 2 졸리컷", cost: 400000, customerRevenue: 520000 }]);
  const laborOff = calculate({ ...inputs, tileEnabled: false }).details;
  expect(laborOff).toEqual(work.filter(d => !/메지|시공 인건비/.test(d.item)));
  expect(calculate({ ...inputs, bathroomTileRooms: payload([{ ...room, labor: false }, second]) }).details
    .filter(d => d.item.includes("타일 시공 인건비")).map(d => d.item)).toEqual(["욕실 2 타일 시공 인건비"]);
  expect(bathroomTileAmounts({ ...room, wallLengthMm: 16000, floorArea: 6 }, true).labor).toBe(1216000);
  expect(bathroomTileAmounts({ ...room, wallLengthMm: 0, floorArea: 0 }, true).labor).toBe(0);
});

test("existing metre snapshots keep their stored unit and calculate exactly like millimetres", () => {
  expect(parseBathroomTileRooms(payload([oldRoom]))).toEqual([room]);
  expect(calculate({ bathroomTileRooms: payload([oldRoom]) })).toEqual(calculate({ bathroomTileRooms: payload([room]) }));
  const stored = projectStaffEstimate({ estimate_data: { inputs: { ...base, bathroomTileRooms: payload([oldRoom]) } } });
  expect(JSON.parse(stored.inputs.bathroomTileRooms)).toEqual([oldRoom]);
  expect(() => parseBathroomTileRooms(payload([{ ...oldRoom, wallLength: 8000 }]))).toThrow();
  expect(() => parseBathroomTileRooms(payload([{ ...room, wallLengthMm: 8000.1 }]))).toThrow();
  expect(() => parseBathroomTileRooms(payload([{ ...room, wallLength: 8 }]))).toThrow();
});

test("new scope fixes the 30% markup, floors each item and keeps other bathroom and demolition details", () => {
  const extras = { sectionDemolitionEnabled: true, tradeFormulaVersion: "v2", demoBathFull: "1",
    bathroomFixtureGrade: "premium", bathroomPlumbingRelocationEnabled: true, bathroomFanType: "hugent",
    bathroomBathtubUnits: "1", bathroomGlassPartitionUnits: "1", bathroomGlassBoothUnits: "1", bathroomMasonryWallUnits: "1" };
  const old = calculate(extras);
  const fresh = calculate({ ...extras, bathroomTileRooms: payload([{ ...room, wallTile: "lt-1200" }]) });
  expect(old.details.filter(d => ["타일 기공", "타일 조공"].includes(d.item))).toHaveLength(2);
  expect(fresh.otherDetails).toEqual(old.otherDetails.filter(d => d.item !== "욕실 포세린 타일 자재+잡자재"));
  expect(fresh.details.filter(d => /조적벽|메지/.test(d.item))).toEqual(old.details.filter(d => /조적벽|메지/.test(d.item)));
  const widget = calculate({ targetMargin: "55", optionCorrection: "20", bathroomTileRooms: payload([{ ...room, wallTile: "lt-1200" }]) });
  expect(widget.quote[0].items.find(i => i.name.includes("타일 자재")).amount).toBe(1737000);
  expect(calculate({ bathroomTileRooms: payload([room]), sectionBathroomEnabled: false }).details).toEqual([]);
});

test("input validation and staff projection round-trip selections without exposing unit costs", () => {
  const data = validateStaffBody({ inputs: { ...base, bathroomTileRooms: payload([room]) } });
  const projected = projectStaffEstimate({ estimate_data: { inputs: data.inputs, internalDetails: [{ cost: 720000 }] } });
  expect(parseBathroomTileRooms(projected.inputs.bathroomTileRooms)).toEqual([room]);
  expect(JSON.stringify(projected)).not.toMatch(/720000|internalDetails|unitPrice/);
  expect(projectStaffEstimate({ estimate_data: { inputs: base } }).inputs.bathroomTileRooms).toBe("");
  for (const bad of [{ ...room, wallTile: "unknown" }, { ...room, floorArea: -4 }, { ...room, labor: 1 }, { ...room, cost: 1 }]) {
    expect(() => validateStaffBody({ inputs: { bathroomTileRooms: payload([bad]) } })).toThrow(/욕실별 타일/);
  }
});

test("room controls preserve per-room entries on count changes and after reloading", () => {
  const html = readFileSync("public/os-app/index.html", "utf8");
  document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  const sync = mountBathroomTileInputs(document);
  const input = document.getElementById("bathroomTileRooms");
  const units = document.getElementById("bathroomUnits");
  const field = (n, key) => document.querySelector(`[data-tile-room="${n}"][data-tile-field="${key}"]`);
  document.getElementById("sectionBathroomEnabled").checked = true;
  units.value = "2";
  input.value = payload([room, { ...room, wallTile: "lt-1200" }]);
  sync();
  expect(field(1, "wallTile").selectedOptions[0].textContent).toBe("고급형 600×1200");
  expect(field(1, "labor")).toBeNull();
  field(1, "jolly").checked = true;
  field(1, "jolly").dispatchEvent(new Event("input", { bubbles: true }));
  expect(parseBathroomTileRooms(input.value)[1].jolly).toBe(true);
  units.value = "1"; sync();
  expect(field(1, "wallTile")).toBeNull();
  units.value = "2"; sync();
  expect(field(1, "jolly").checked).toBe(true);
  input.value = ""; sync();
  expect(field(0, "wallTile")).toBeNull();
  input.value = payload([oldRoom]); sync();
  expect(field(0, "wallLengthMm").value).toBe("8000");
  expect(JSON.parse(input.value)).toEqual([oldRoom]);
  expect(field(0, "floorTile").value).toBe("ekr-600");
});

test("two bathrooms calculate from the actual form event payload and price all works", () => {
  const html = readFileSync("public/os-app/index.html", "utf8");
  document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
  const sync = mountBathroomTileInputs(document);
  const elements = Object.fromEntries(["bathroomTileRooms", ...Object.keys(base), "bathroomPlumbingRelocationEnabled"]
    .map(id => [id, document.getElementById(id)]));
  let last;
  bindApplicationEvents({ document, window, elements, actions: { onEstimateInput: () => {
    last = validateStaffBody({ inputs: collectEstimateFormValues(elements, {}) }).inputs;
  } } });
  elements.bathroomUnits.value = "2";
  for (const id of ["sectionBathroomEnabled","tileEnabled","tileGroutEnabled","bathroomPlumbingRelocationEnabled"]) elements[id].checked = true;
  sync();
  for (const index of [0, 1]) {
    for (const [key, value] of Object.entries({ wallLengthMm: "8000", wallTile: "ara-1200", floorArea: "3.84", floorTile: "ara-600", jolly: true })) {
      const field = document.querySelector(`[data-tile-room="${index}"][data-tile-field="${key}"]`);
      if (typeof value === "boolean") field.checked = value;
      else field.value = value;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  expect(parseBathroomTileRooms(last.bathroomTileRooms).map(r => r.wallLengthMm)).toEqual([8000, 8000]);
  const core = createEstimateCalculation();
  const run = inputs => core.calculate(core.readState(inputs));
  const result = run(last);
  const failure = run({ ...last, bathroomTileRooms: "[]" });
  const groups = value => core.groupedCustomerItems(value.details, value.quoteLines);
  const customer = value => sum(groups(value), "total");
  expect(sum(failure.details.filter(d => d.group === "tile"), "cost")).toBe(372000);
  expect(customer(failure)).toBe(6151000);
  expect(sum(result.details.filter(d => d.group === "tile"), "cost")).toBe(3856080);
  expect(sum(result.details.filter(d => d.group === "bathroom"), "cost")).toBe(4360000);
  expect(result.directCost).toBe(8216080);
  expect(customer(result)).toBe(10679000);
  const breakdown = describeSiteRows(result.details).filter(row => row.group === "tile");
  expect(breakdown.find(row => row.code === "TILE_GROUT")).toMatchObject({ kind: "labor", amount: 350000, missing: false });
  expect(breakdown.every(row => !row.missing)).toBe(true);
  const setUnchecked = (index, key) => {
    const field = document.querySelector(`[data-tile-room="${index}"][data-tile-field="${key}"]`);
    field.checked = false;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  elements.tileEnabled.click();
  expect(run(last).directCost).toBe(6466080);
  setUnchecked(1, "jolly");
  expect(run(last).directCost).toBe(6066080);
});

test("saved room labor preferences are preserved until the user explicitly enables the master checkbox", () => {
  document.body.innerHTML = readFileSync("public/os-app/index.html", "utf8");
  const sync = mountBathroomTileInputs(document);
  const get = id => document.getElementById(id);
  get("sectionBathroomEnabled").checked = true;
  get("bathroomUnits").value = "2";
  const legacy = payload([{ ...oldRoom, labor: false }, { ...oldRoom, jolly: true }]);
  const input = get("bathroomTileRooms");
  const toggle = get("tileEnabled");
  input.value = legacy;
  toggle.checked = true;
  sync();
  expect(input.value).toBe(legacy);
  expect(document.querySelectorAll('[data-tile-field="labor"]')).toHaveLength(0);
  toggle.click();
  expect(input.value).toBe(legacy);
  toggle.click();
  const updated = parseBathroomTileRooms(input.value);
  expect(updated.map(r => r.labor)).toEqual([true, true]);
  expect(updated.map(r => [r.wallLengthMm, r.jolly])).toEqual([[8000, false], [8000, true]]);
  expect(calculate({ bathroomUnits: "2", bathroomTileRooms: input.value }).details.filter(d => d.item.includes("타일 시공 인건비"))).toHaveLength(2);
});
