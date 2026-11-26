import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { bathroomTileAmounts } from "../../../app/api/os/_lib/calculation/calculator/bathroom-tile.js";
import { bathroomTileMaterialPolicy, withBathroomTileMaterialPolicy } from "../../../app/api/os/_lib/calculation/bathroom-tile-materials.js";
import { defaultPolicy, policyCatalog, validatePolicy } from "../../../app/api/os/_lib/calculation/preliminary-policy.js";
import { projectStaffEstimate, validateStaffBody } from "../../../app/api/os/estimates/_lib/estimates.js";
import { parseBathroomTileRooms } from "../../../public/os-app/src/bathroom-tile-inputs.js";
import { mountBathroomTileInputs } from "../../../public/os-app/src/bathroom-tile-view.js";

const room = { wallLength: 8, floorArea: 4, wallTile: "ara-1200", floorTile: "ekr-600", labor: true, jolly: false };
const base = { sectionBathroomEnabled: true, bathroomUnits: "1", tileEnabled: true, tileGroutEnabled: true };
const payload = rooms => JSON.stringify(rooms);
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
  expect(bathroomTileAmounts({ ...room, wallTile, wallLength: 0.3, floorArea: 0 }, true))
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
  const second = { ...room, wallLength: 0.6, floorArea: 1.44, wallTile: "lt-600", jolly: true };
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
  expect(bathroomTileAmounts({ ...room, wallLength: 16, floorArea: 6 }, true).labor).toBe(1216000);
  expect(bathroomTileAmounts({ ...room, wallLength: 0, floorArea: 0 }, true).labor).toBe(0);
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
  field(1, "jolly").checked = true;
  field(1, "jolly").dispatchEvent(new Event("input", { bubbles: true }));
  expect(parseBathroomTileRooms(input.value)[1].jolly).toBe(true);
  units.value = "1"; sync();
  expect(field(1, "wallTile")).toBeNull();
  units.value = "2"; sync();
  expect(field(1, "jolly").checked).toBe(true);
  input.value = ""; sync();
  expect(field(0, "wallTile")).toBeNull();
  input.value = payload([room]); sync();
  expect(field(0, "wallLength").value).toBe("8");
  expect(field(0, "floorTile").value).toBe("ekr-600");
});
