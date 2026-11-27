import {expect,test} from "vitest";
import {createEstimateCalculation} from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
import {countertopAreaCost,filmLabor} from "../../../app/api/os/_lib/calculation/calculator/trade-revision.js";
import {KHANSTONE_PRODUCTS} from "../../../public/os-app/src/khanstone-products.js";

const run=(inputs,options)=>{const core=createEstimateCalculation(options);return core.calculate(core.readState({tradeFormulaVersion:"v2",...inputs}));};
const detail=(result,item)=>result.details.find(row=>row.item===item);

test("Khanstone all twelve products use their quoted 12T and 20T reference-area prices",()=>{
  const tiers=[
    [["snowfield","denver","luna-white","ash-concrete","luna-shadow"],320000,350000],
    [["eden","eden-gray","patagonia","cremosa"],400000,450000],
    [["cristallo","matterhorn","boa-vista"],450000,500000],
  ];
  expect(new Set(tiers.flatMap(([products])=>products))).toEqual(new Set(Object.keys(KHANSTONE_PRODUCTS)));
  for(const [products,t12,t20] of tiers)for(const sku of products){
    expect(countertopAreaCost(1000,700,"khanstone","12",false,sku)).toBe(t12);
    expect(countertopAreaCost(1000,700,"khanstone","20",false,sku)).toBe(t20);
  }
});

test("Khanstone selection uses existing dimensions, one markup, and leaves unselected and legacy rows unchanged",()=>{
  const scope={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,
    baseCountertop:"khanstone",lowerCabinetM:"1000",baseCounterThickness:"20",
    islandEnabled:true,islandM:"2000",islandDepthMm:"700",islandCountertop:"khanstone",
    islandSideFinish:"khanstone",islandSideFinishCount:"2",islandCounterThickness:"20",
    homebarEnabled:true,homebarM:"1400",homebarMidway:"khanstone"};
  const selected={baseKhanstoneProduct:"snowfield",islandKhanstoneProduct:"eden",islandSideKhanstoneProduct:"cristallo",
    homebarMidwayKhanstoneProduct:"patagonia",homebarMidwayCounterThickness:"20",homebarMidwayHeightMm:"500"};
  const r=run({...scope,...selected});
  expect(detail(r,"상하부장 상판(칸스톤 스노우필드, 20T)")).toMatchObject({cost:350000,customerRevenue:455000});
  expect(detail(r,"아일랜드 상판(칸스톤 에덴, 20T)")).toMatchObject({cost:900000});
  expect(detail(r,"아일랜드 좌우마감재(칸스톤 크리스탈로, 20T)")).toMatchObject({cost:900000,input:"700mm × 900mm × 2개"});
  expect(r.details.filter(row=>row.item.startsWith("홈바장 미드웨이"))).toMatchObject([
    {item:"홈바장 미드웨이(칸스톤 파타고니아, 20T)",cost:450000,input:"1,400mm × 500mm"},
  ]);
  expect(detail(run(scope),"상하부장 상판(칸스톤, 20T)").cost).toBe(450000);
  const legacy={...scope,countertopLayoutMode:"legacy"};
  expect(run({...legacy,...selected}).details).toEqual(run(legacy).details);
});
test.each(["full","partial","legacy"])("expansion keeps fixed costs and customer prices in %s",mode=>{
  const inputs={sectionDemolitionEnabled:true,demolitionMode:mode==="partial"?"partial":"full",
    tradeFormulaVersion:mode==="legacy"?"legacy":"v2",expansionLiving:true,expansionRooms:"2",expansionKitchen:"1",targetMargin:"55"};
  const result=run(inputs);
  expect(detail(result,"거실 확장")).toMatchObject({unitPrice:4600000,cost:4600000,customerRevenue:6000000,revenue:6000000});
  expect(detail(result,"각방 확장")).toMatchObject({quantity:"2개소",unitPrice:3000000,cost:6000000,customerRevenue:8000000});
  expect(detail(result,"주방 확장")).toMatchObject({unitPrice:3000000,cost:3000000,customerRevenue:4000000});
  expect(result.directCost).toBe(13600000);
  expect(result.customerRevenue).toBe(18000000);
  expect(run({...inputs,sectionDemolitionEnabled:false}).details).toEqual([]);
});
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
test.each(["full","partial"])("partition removal is billed once on top of %s demolitions",mode=>{
  const inputs={sectionDemolitionEnabled:true,demolitionMode:mode,demolitionBasicEnabled:true,demolitionBasicArea:"20",
    expansionLiving:true,expansionPartitionMm:"2500",demoPartitionMm:"9000"};
  const result=run(inputs);
  expect(result.details.filter(row=>row.item==="가벽철거")).toEqual([expect.objectContaining({
    quantity:"2.5m",unitPrice:100000,cost:250000,customerRevenue:325000
  })]);
  expect(detail(result,"거실 확장").customerRevenue).toBe(6000000);
  expect(result.directCost-run({...inputs,expansionPartitionMm:"0"}).directCost).toBe(250000);
  expect(detail(run({...inputs,expansionPartitionMm:"2300"}),"가벽철거").customerRevenue).toBe(299000);
  expect(detail(run({...inputs,expansionPartitionMm:""}),"가벽철거")).toBeUndefined();
  expect(run({...inputs,sectionDemolitionEnabled:false}).details).toEqual([]);
});
test("old hidden lengths do not appear in full demolition but previously priced lengths carry forward",()=>{
  const inputs={sectionDemolitionEnabled:true,demoPartitionMm:"2000"};
  expect(detail(run({...inputs,demolitionMode:"full"}),"가벽철거")).toBeUndefined();
  expect(detail(run({...inputs,demolitionMode:"partial"}),"가벽철거").cost).toBe(200000);
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

test("door replacement toggle gates molding and preserves earlier molding-only quotes",()=>{
  const inputs={sectionFurnitureEnabled:true,furnitureTallDoors:"2",furnitureSinkSmallDoors:"3",furnitureMoldingMm:"1000"};
  expect(run(inputs).directCost).toBe(265000);
  expect(run({...inputs,furnitureDoorsEnabled:"on"}).directCost).toBe(265000);
  const off=run({...inputs,furnitureDoorsEnabled:"off"});
  expect(off.details).toEqual([]);
  expect(off.directCost).toBe(0);
  expect(run({sectionFurnitureEnabled:true,furnitureMoldingMm:"1000"}).directCost).toBe(20000);
});
test("film rounds once after combining fractional labor",()=>{
  const base={filmWindow:true,filmWindowArea:"20",filmDoorCount:2,filmOneSideMm:0,filmBothSidesMm:0,filmWallMm:0};
  for(const mm of [400,2000,3600,4000])expect(filmLabor({...base,filmWallMm:mm})).toBe(6);
  expect(filmLabor({...base,filmDoorCount:1,filmOneSideMm:200,filmBothSidesMm:400,filmWallMm:0})).toBe(5);
});
test("furniture doors, molding, vanity and area-based tops use their own rates",()=>{
  expect([countertopAreaCost(3000,1000,"ceramic"),countertopAreaCost(1000,700,"khanstone"),countertopAreaCost(1000,700,"himacs")]).toEqual([2142857,400000,210000]);
  const scope={sectionFurnitureEnabled:true,furnitureTallDoors:"1",furnitureSinkSmallDoors:"2",furnitureSinkMediumDoors:"3",furnitureMoldingMm:"1500",vanityMm:"900",vanityDrawers:"2"};
  const r=run(scope);
  expect(detail(r,"키큰장 문짝 교체").cost).toBe(70000);
  expect(detail(r,"가구 몰딩").cost).toBe(30000);
  expect(detail(r,"화장대 하부장").quantity).toBe("3자");
  expect(detail(r,"화장대 서랍").quantity).toBe("2개");
  expect(detail(r,"싱크대 문짝 교체 (400mm 초과~600mm 이하)").cost).toBe(135000);
});
test("saved transport charges stay pinned; new quotes only disclose separate lifting and retain independent carry",()=>{
  const scope={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,baseCountertop:"ceramic",baseCounterWidthMm:"3000",lowerCabinetM:"3000",islandEnabled:true,islandM:"3000",islandDepthMm:"700",islandCountertop:"himacs",sectionFinishEnabled:true,carryFloor:"2",carryNoElevator:true};
  expect(detail(run(scope),"상판 운반비")).toBeUndefined();
  const r=run({...scope,countertopLayoutMode:"legacy",baseCounterCustomSize:true,countertopTransport:true,countertopLadder:true,carrySelected:true});
  expect(r.details.filter(row=>row.item==="상판 운반비")).toHaveLength(1);
  expect(detail(r,"상판 운반비").cost).toBe(300000);
  expect(detail(r,"상판 사다리차").cost).toBe(120000);
  expect(detail(r,"소운반비").revenue).toBe(2340000);
  expect(detail(run({...scope,carrySelected:true,carryFloor:"1"}),"소운반비")).toBeUndefined();
  const current=run({...scope,countertopTransport:true,countertopLadder:true,carrySelected:true});
  expect(current.details.some(d=>/상판 운반비|상판 사다리차/.test(d.item))).toBe(false);
  expect(current.quoteLines.filter(l=>l.description==="양중비용 별도")).toEqual([{process:"양중비",description:"양중비용 별도",amountText:"현장별 별도",revenue:0}]);
  expect(detail(current,"소운반비").revenue).toBe(2340000);
});

test("island stone sides use depth, fixed 900 mm height and count without duplicate charges",()=>{
  const input={sectionFurnitureEnabled:true,islandEnabled:true,islandM:"3000",islandDepthMm:"700",islandSideFinishCount:"2"};
  const sides=r=>r.details.filter(d=>d.item.startsWith("아일랜드 좌우마감재"));
  for(const [material,cost] of [["ceramic",900000],["khanstone",720000],["himacs",378000]]){
    const rows=sides(run({...input,islandSideFinish:material}));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({cost,input:"700mm × 900mm × 2개",quantity:"1.8장 환산"});
    expect(rows[0].revenue).toBeCloseTo(cost*1.3);
  }
  expect(sides(run({...input,islandSideFinish:"khanstone",islandCounterThickness:"20"}))[0]).toMatchObject({cost:810000});
  expect(sides(run({...input,countertopLayoutMode:"legacy",islandSideFinish:"ceramic"}))[0]).toMatchObject({cost:720000});
  expect(sides(run({...input,islandSideFinish:"ceramic",islandSideFinishCount:"0"}))).toHaveLength(0);
  const ep={...input,islandSideFinish:"epPanel"};
  expect(sides(run(ep))).toEqual(sides(run({...ep,tradeFormulaVersion:"legacy"})));
});

test("base cabinet dimensions default to the lower cabinet and 700 mm unless explicitly overridden",()=>{
  const inputs={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:true,baseCountertop:"khanstone",lowerCabinetM:"3200",baseCounterWidthMm:"1000",baseCounterDepthMm:"800"};
  const top=result=>result.details.find(d=>d.item.startsWith("상하부장 상판"));
  expect(top(run(inputs))).toMatchObject({cost:1280000,unitPrice:400000,input:"3,200mm × 700mm"});
  expect(top(run({...inputs,baseCounterCustomSize:true,baseCounterThickness:"20"}))).toMatchObject({cost:514285,unitPrice:450000,input:"1,000mm × 800mm",item:expect.stringContaining("20T")});
  expect(top(run({...inputs,baseCountertop:"ceramic",baseCounterThickness:"20"}))).toMatchObject({cost:1600000,unitPrice:500000,item:expect.stringContaining("12T")});
});

test("automatic base cabinet tops always follow the lower cabinet, even on an older draft",()=>{
  const options={sectionFurnitureEnabled:true,baseEnabled:true,baseCountertopEnabled:false,
    baseCountertopFollowsLower:true,baseCountertop:"khanstone",lowerCabinetM:"1000",
    baseCounterCustomSize:true,baseCounterWidthMm:"5000",baseCounterDepthMm:"950",
    baseKhanstoneProduct:"snowfield",baseCounterThickness:"20"};
  for(const tradeFormulaVersion of ["v2","legacy"]){
    const result=run({...options,tradeFormulaVersion,countertopLayoutMode:"legacy"});
    expect(result.details.filter(d=>d.item.startsWith("상하부장 상판"))).toMatchObject([
      {item:"상하부장 상판(칸스톤 스노우필드, 20T)",input:"1,000mm × 700mm",cost:350000,customerRevenue:455000},
    ]);
  }
  expect(run({...options,lowerCabinetM:"0"}).details.some(d=>d.item.startsWith("상하부장 상판"))).toBe(false);
});

test("tall cabinets and rice cooker cabinets remain billable without base cabinets when separately selected",()=>{
  const inputs={sectionFurnitureEnabled:true,tallCabinetM:"900",riceCabinetUnits:"2"};
  const historical=run({...inputs,baseEnabled:true});
  const independent=run({...inputs,baseEnabled:false,tallRiceCabinetMode:"on"});
  for(const name of ["키큰장","밥솥장"])expect(detail(independent,name)).toEqual(detail(historical,name));
  expect(independent.details.map(d=>d.item)).toEqual(["키큰장","밥솥장"]);
  expect(run({...inputs,baseEnabled:true,tallRiceCabinetMode:"off"}).details.some(d=>["키큰장","밥솥장"].includes(d.item))).toBe(false);
  expect(run({...inputs,sectionFurnitureEnabled:false,tallRiceCabinetMode:"on"}).details).toEqual([]);
});

test("homebar tall cabinet length never extends the countertop",()=>{
  const inputs={sectionFurnitureEnabled:true,homebarEnabled:true,homebarM:"1400",homebarTallLengthMm:"900",homebarCountertop:"ceramic"};
  const r=run(inputs), top=result=>result.details.find(d=>d.item.startsWith("홈바장 상판"));
  expect(detail(r,"홈바장 상하부장")).toMatchObject({quantity:"5자",input:"1,400mm"});
  expect(detail(r,"홈바장 키큰수납장")).toMatchObject({quantity:"3자",input:"900mm"});
  expect(top(r)).toMatchObject({input:"1,400mm × 700mm",cost:700000});
  expect(top(run({...inputs,homebarTallLengthMm:"1800"})).cost).toBe(700000);
  const tallOnly=run({...inputs,homebarM:"0",homebarMidway:"ceramic"});
  expect(top(tallOnly)).toBeUndefined();
  expect(tallOnly.details.some(d=>d.item.startsWith("홈바장 미드웨이"))).toBe(false);
  expect(detail(tallOnly,"홈바장 키큰수납장")).toBeTruthy();
});

test("a legacy homebar without saved slab dimensions uses its lower cabinet span and the legacy rate",()=>{
  const inputs={sectionFurnitureEnabled:true,homebarEnabled:true,countertopLayoutMode:"legacy",
    homebarM:"1500",homebarCountertop:"himacs",homebarCounterWidthMm:"0",homebarCounterDepthMm:"700"};
  const top=result=>result.details.find(d=>d.item.startsWith("홈바장 상판"));
  expect(top(run(inputs))).toMatchObject({input:"600mm × 700mm",unitPrice:200000,cost:120000});
  expect(top(run({...inputs,homebarCounterWidthMm:"1250",homebarCounterDepthMm:"800"})))
    .toMatchObject({input:"1,250mm × 800mm",unitPrice:200000,cost:285714});
  expect(top(run({...inputs,homebarM:"900"}))).toBeUndefined();
  expect(top(run({...inputs,homebarEnabled:false}))).toBeUndefined();
});

test("bathroom dry vanity uses kitchen cabinet rates or the independent foam price",()=>{
  const inputs={sectionBathroomEnabled:true,dryVanityEnabled:true,dryVanityLengthMm:"900",dryVanityCountertop:"himacs"};
  const r=run(inputs,{rateValues:{rateLowerPerJa:220000}});
  expect(detail(r,"건식세면대 일반 가구장")).toMatchObject({quantity:"3자",unitPrice:220000,cost:660000,group:"bathroom"});
  expect(r.details.find(d=>d.item.startsWith("건식세면대 상판"))).toMatchObject({cost:189000,input:"900mm × 700mm"});
  const foam=run({...inputs,dryVanityCabinetType:"foam",dryVanityCountertop:"khanstone",dryVanityCounterThickness:"20",dryVanityCounterCustomSize:true,dryVanityCounterWidthMm:"1000",dryVanityCounterDepthMm:"700"});
  expect(detail(foam,"건식세면대 발포 하부장")).toMatchObject({quantity:"3자",unitPrice:310000,cost:930000,customerRevenue:1209000});
  expect(foam.details.find(d=>d.item.startsWith("건식세면대 상판"))).toMatchObject({cost:450000,item:expect.stringContaining("20T")});
  expect(run({...inputs,dryVanityEnabled:false}).details).toEqual([]);
  expect(run({...inputs,sectionBathroomEnabled:false}).details).toEqual([]);
});

test("dry vanity EP panel uses the existing linear EP rate and lower-cabinet length",()=>{
  const inputs={sectionBathroomEnabled:true,dryVanityEnabled:true,dryVanityLengthMm:"1200",dryVanityCounterCustomSize:true,
    dryVanityCounterWidthMm:"2500",dryVanityCounterDepthMm:"900"};
  const ep=run(inputs,{rateValues:{rateEpPanelPerM:140000}});
  expect(detail(ep,"건식세면대 상판(EP판)")).toMatchObject({quantity:"1.2m",unitPrice:140000,cost:168000,customerRevenue:218000});
  expect(detail(run({...inputs,dryVanityLengthMm:"900"}),"건식세면대 상판(EP판)").quantity).toBe("1m");
  expect(detail(run({...inputs,dryVanityCountertop:"none"}),"건식세면대 상판(EP판)")).toBeUndefined();
});
