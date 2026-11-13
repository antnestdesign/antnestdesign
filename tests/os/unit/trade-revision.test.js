import {expect,test} from "vitest";
import {createEstimateCalculation} from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import {countertopAreaCost,filmLabor} from "../../../app/api/os/_lib/calculation/calculator/trade-revision.js";

const run=(inputs,options)=>{const core=createEstimateCalculation(options);return core.calculate(core.readState({tradeFormulaVersion:"v2",...inputs}));};
const detail=(result,item)=>result.details.find(row=>row.item===item);
test("full demolition and electrical retain legacy prices",()=>{
  const input={sectionDemolitionEnabled:true,demolitionBasicEnabled:true,demolitionBasicArea:"10",demolitionFloorEnabled:true,sectionElectricalEnabled:true,electricalEnabled:true};
  expect(run(input).details).toEqual(run({...input,tradeFormulaVersion:"legacy"}).details);
});
test("partial demolition uses the 40-pyeong boundary and cannot stack the full rate",()=>{
  const inputs={sectionDemolitionEnabled:true,demolitionMode:"partial",demoKitchenMm:"2500",demoCounterMm:"1000",demoCabinetJa:"3",demoEntryUnits:"1",demoDoorUnits:"2",demoDoorSetUnits:"1",demoLights:true,demoPartitionMm:"1000",demolitionBasicEnabled:true,demolitionBasicArea:"40",areaPyeong:"40"};
  const r=run(inputs);
  expect(r.directCost).toBe(365000);
  expect(detail(r,"조명철거").revenue).toBe(65000);
  expect(detail(run({...inputs,areaPyeong:"41"}),"조명철거").cost).toBe(100000);
});
test("bathroom full and fixtures-only scopes have independent rates",()=>{
  const scope={sectionDemolitionEnabled:true};
  expect(run({...scope,demoBathFull:"2",demoBathTub:"1",demoBathOverlay:"2"}).directCost).toBe(1700000);
  expect(run({...scope,demoBathFixtures:"2"}).directCost).toBe(300000);
});
test("partial electrical uses the existing worker price and supports additions alone",()=>{
  const scope={sectionElectricalEnabled:true,electricalMode:"partial",electricalEnabled:true,standardLightingEnabled:true,electricRecessed:"2",electricSwitch:"1"};
  expect(run(scope).directCost).toBe(106000);
  for(const [area,days] of [[20,1],[30,1.5],[40,2],[50,3]])expect(detail(run({...scope,electricBasic:true,electricArea:String(area)},{rateValues:{rateElectricalWorkerDay:320000}}),"기본형 전기공사 (조명기구 별도)").cost).toBe(days*320000);
});
test("wallpaper rolls are rounded after aggregating each paper group",()=>{
  const scope={sectionWallpaperEnabled:true,areaPyeong:"34"};
  const rolls=inputs=>run(inputs).details.filter(row=>row.quantity.endsWith("롤")).map(row=>row.quantity);
  expect(rolls({...scope,wallpaperRoomPyeong:"15"})).toEqual(["10롤","8롤"]);
  expect(rolls(scope)).toEqual(["17롤"]);
});
test("partial electrical includes only enabled manual fixture costs and no standard lighting",()=>{
  const inputs={sectionElectricalEnabled:true,electricalMode:"partial",standardLightingEnabled:true,standardSwitchEnabled:true,electricLightCost:"100000",electricSwitchCost:"20000",electricOutletCost:"30000"};
  expect(run(inputs).directCost).toBe(0);
  const result=run({...inputs,electricFixtureEnabled:true});
  expect(result.directCost).toBe(150000);
  expect(result.customerRevenue).toBe(195000);
  expect(result.details.every(row=>row.group==="electrical")).toBe(true);
});
test("unchecking vanity keeps dimensions without billing its cabinet, drawers or countertop",()=>{
  const inputs={sectionFurnitureEnabled:true,vanityMm:"3000",vanityDrawers:"2",vanityTop:"ceramic",countertopTransport:true};
  expect(run(inputs).directCost).toBeGreaterThan(0);
  expect(run({...inputs,vanityEnabled:"off"}).directCost).toBe(0);
});
test("film rounds once after combining fractional labor",()=>{
  const base={filmWindow:true,filmWindowArea:"20",filmDoorCount:2,filmOneSideMm:0,filmBothSidesMm:0,filmWallMm:0};
  for(const mm of [400,2000,3600,4000])expect(filmLabor({...base,filmWallMm:mm})).toBe(6);
  expect(filmLabor({...base,filmDoorCount:1,filmOneSideMm:200,filmBothSidesMm:400,filmWallMm:0})).toBe(5);
});
test("furniture doors, molding, vanity and area-based tops use their own rates",()=>{
  expect([countertopAreaCost(3000,1000,"ceramic"),countertopAreaCost(1000,700,"khanstone"),countertopAreaCost(1000,700,"himacs")]).toEqual([1714285,320000,200000]);
  const scope={sectionFurnitureEnabled:true,furnitureTallDoors:"1",furnitureSinkSmallDoors:"2",furnitureSinkMediumDoors:"3",furnitureMoldingMm:"1500",vanityMm:"900",vanityDrawers:"2"};
  const r=run(scope);
  expect(detail(r,"키큰장 문짝 교체").cost).toBe(70000);
  expect(detail(r,"가구 몰딩").cost).toBe(30000);
  expect(detail(r,"화장대 하부장").quantity).toBe("3자");
  expect(detail(r,"화장대 서랍").quantity).toBe("2개");
  expect(detail(r,"싱크대 문짝 교체 (400mm 초과~600mm 이하)").cost).toBe(135000);
});
test("transport is one opt-in charge; ladder and carry are independent and gated",()=>{
  const scope={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,baseCountertop:"ceramic",baseCounterWidthMm:"3000",islandEnabled:true,islandM:"3000",islandDepthMm:"700",islandCountertop:"himacs",sectionFinishEnabled:true,carryFloor:"2",carryNoElevator:true};
  expect(detail(run(scope),"상판 운반비")).toBeUndefined();
  const r=run({...scope,countertopTransport:true,countertopLadder:true,carrySelected:true});
  expect(r.details.filter(row=>row.item==="상판 운반비")).toHaveLength(1);
  expect(detail(r,"상판 운반비").cost).toBe(300000);
  expect(detail(r,"상판 사다리차").cost).toBe(120000);
  expect(detail(r,"소운반비").revenue).toBe(2340000);
  expect(detail(run({...scope,carrySelected:true,carryFloor:"1"}),"소운반비")).toBeUndefined();
});

test("island stone sides use depth, fixed 900 mm height and count without duplicate charges",()=>{
  const input={sectionFurnitureEnabled:true,islandEnabled:true,islandM:"3000",islandDepthMm:"700",islandSideFinishCount:"2"};
  const sides=r=>r.details.filter(d=>d.item.startsWith("아일랜드 좌우마감재"));
  for(const [material,cost] of [["ceramic",720000],["khanstone",576000],["himacs",360000]]){
    const rows=sides(run({...input,islandSideFinish:material}));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({cost,input:"700mm × 900mm × 2개",quantity:"1.8장 환산"});
    expect(rows[0].revenue).toBeCloseTo(cost*1.3);
  }
  expect(sides(run({...input,islandSideFinish:"ceramic",islandSideFinishCount:"0"}))).toHaveLength(0);
  const ep={...input,islandSideFinish:"epPanel"};
  expect(sides(run(ep))).toEqual(sides(run({...ep,tradeFormulaVersion:"legacy"})));
});
