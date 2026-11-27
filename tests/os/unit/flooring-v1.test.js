import { describe, expect, it } from "vitest";
import { flooringZones, flooringZonePreview, parseFlooringPlan } from "../../../public/os-app/src/flooring-inputs.js";
import { calculateFlooring } from "../../../app/api/os/_lib/calculation/flooring.js";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import { publicFlooringSummary } from "../../../app/api/os/_lib/flooring-store.js";

const inputs = {
  sectionFlooringEnabled: true, flooringMaterialType: "wood", flooringArea: "34",
  flooringPlan: JSON.stringify({ common: { sku: "test-a", loss: null }, rooms: [{ sku: "test-b", loss: null, area: 15 }] }),
};
const makeProduct = (sku, billing_unit, pack_m2, supplier_pyeong_m2 = null, loss_percent = 15, supply_cost = 100000) => ({
  sku, billing_unit, pack_m2, supplier_pyeong_m2, loss_percent, supply_cost, brand: "Test",
  short_name: sku, width_mm: 100, length_mm: 800, thickness_mm: 7.5,
});
const zone = (sku, areaMilli, loss = null, label = "공용부") => ({ sku, areaMilli, loss, label });

describe("flooring V1 pricing", () => {
  it("splits 34 pyeong into common 19 and rooms 15 on exact milli-pyeong boundaries", () => {
    expect(flooringZones(inputs).map(r => r.areaMilli)).toEqual([19000, 15000]);
    const plan = JSON.parse(inputs.flooringPlan);
    expect(() => flooringZones({ ...inputs, flooringArea: "10" })).toThrow(/초과/);
    expect(() => parseFlooringPlan(JSON.stringify({ ...plan, rooms: [{ sku: "x", loss: null, area: -1 }] }))).toThrow();
    expect(() => flooringZones({ ...inputs, flooringPlan: JSON.stringify({ ...plan, common: {sku:"",loss:null} }) })).toThrow(/제품/);
    expect(() => parseFlooringPlan(JSON.stringify({ ...plan, common: { sku:"x", loss: null, supply_cost: 1 } }))).toThrow();
  });

  it("bills BOX, 2BOX and the explicit supplier pyeong separately", () => {
    const [box, bundle, pyeong] = calculateFlooring([zone("a",10000),zone("b",10000),zone("c",10000)], [
      makeProduct("a","BOX",3.036), makeProduct("b","2BOX",1.62), makeProduct("c","PYEONG",2.527,3.24),
    ]);
    expect([box.cost,bundle.cost,pyeong.cost]).toEqual([1300000,1200000,1200000]);
    expect([box.summary.quantity,bundle.summary.quantity,pyeong.summary.quantity]).toEqual(["13박스","12묶음(2박스)","12평"]);
    expect(box.customerRevenue).toBe(1690000);
  });

  it("previews only priced zones without guessing the common area or using a fallback SKU", () => {
    const plan = JSON.parse(inputs.flooringPlan);
    const blankSku = { ...inputs, flooringPlan: JSON.stringify({ ...plan, rooms: [{ sku: "", loss: null, area: 15 }] }) };
    expect(flooringZonePreview(blankSku)).toMatchObject({ zones: [{ label: "공용부", areaMilli: 19000 }], issues: ["별도 방 1 마루 제품을 선택해 주세요."] });
    const blankArea = { ...inputs, flooringPlan: JSON.stringify({ ...plan, rooms: [...plan.rooms, { sku: "test-a", loss: null, area: 0 }] }) };
    expect(flooringZonePreview(blankArea)).toMatchObject({ zones: [{ label: "별도 방 1", areaMilli: 15000 }], issues: ["별도 방 2 시공평수를 입력해 주세요."] });
    expect(() => flooringZones(blankArea)).toThrow(/시공평수/);
    expect(flooringZonePreview({ ...inputs, flooringArea: "10" }).zones).toEqual([]);
  });

  it("groups the same product and resolved loss but not distinct loss rates", () => {
    const p = makeProduct("a","BOX",3.3058,null,15,105500);
    const rows = calculateFlooring([zone("a",2000,15),zone("a",1000,null,"별도 방 1"),zone("a",1000,0,"별도 방 2")],[p]);
    expect(rows.map(row => row.summary.quantity)).toEqual(["4박스","1박스"]);
    expect(rows[0].summary.zones).toEqual(["공용부","별도 방 1"]);
    expect(rows.map(row => row.customerRevenue)).toEqual([548000,137000]);
  });

  it("uses the supplier pyeong basis without a pack area, but still requires one for box billing", () => {
    const square = makeProduct("loca-square", "PYEONG", null, 3.24, 15, 135000);
    const [row] = calculateFlooring([zone(square.sku, 20000)], [square]);
    expect(row.summary).toMatchObject({ packM2: null, supplierBasis: 3.24, quantity: "24평" });
    expect([row.cost, row.customerRevenue]).toEqual([3240000, 4212000]);
    expect(publicFlooringSummary([row.summary])[0].packM2).toBeNull();
    for (const billing_unit of ["BOX", "2BOX"]) {
      expect(() => calculateFlooring([zone(square.sku, 20000)], [{ ...square, billing_unit }])).toThrow(/과금 기준/);
    }
  });

  it("does not charge extra for an exact boundary, inactive section or sheet", () => {
    const p = makeProduct("a","2BOX",3.3058);
    expect(calculateFlooring([zone("a",2000,0)],[p])[0].cost).toBe(100000);
    expect(calculateFlooring([zone("a",2001,0)],[p])[0].cost).toBe(200000);
    expect(flooringZones({ ...inputs, flooringMaterialType:"sheet" })).toBeNull();
    expect(flooringZones({ ...inputs, sectionFlooringEnabled:false })).toBeNull();
    expect(flooringZones({ ...inputs, flooringPlan:"" })).toBeNull();
  });

  it("replaces the old floor row only for V1 and keeps costs outside the staff projection", () => {
    const rows = calculateFlooring(flooringZones(inputs), [makeProduct("test-a","BOX",3.036),makeProduct("test-b","PYEONG",1.6,3.24)]);
    const legacy = createEstimateCalculation();
    const current = createEstimateCalculation({ flooringRows: rows });
    const result = current.calculate(current.readState(inputs));
    const details = result.details.filter(row => row.group==="flooring");
    expect(details).toHaveLength(2);
    expect(legacy.calculate(legacy.readState(inputs)).details.filter(row => row.group==="flooring")).toHaveLength(1);
    expect(details.every(row => row.lockedSiteCost && row.fixedMarkup===0.30)).toBe(true);
    const groups = current.groupedCustomerItems(details, []);
    expect(groups.find(g => g.label === "바닥")?.total).toBe(rows.reduce((sum,row)=>sum+row.customerRevenue,0));
    const [visible] = publicFlooringSummary([{ ...rows[0].summary, supply_cost: 100000, cost: rows[0].cost }]);
    expect(visible).not.toHaveProperty("supply_cost");
    expect(visible).not.toHaveProperty("cost");
  });
});
