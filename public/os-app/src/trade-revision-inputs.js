const number=(value="0",max=10000000)=>({type:"number",value,min:0,max});
const toggle={type:"checkbox",value:false};
const select=(value,choices)=>({type:"select-one",value,choices});
const thickness=select("12",["12","20"]);
export const COUNTERTOP_DEFAULT_DEPTH_MM = 700;
export const COUNTERTOP_LIFTING_NOTICE = "양중비용 별도";
export const TRADE_REVISION_INPUTS={
  tradeFormulaVersion:select("v2",["legacy","v2"]),
  demolitionMode:select("full",["full","partial"]),
  demoKitchenMm:number(),demoCounterMm:number(),demoCabinetJa:number(),demoEntryUnits:number(),demoDoorUnits:number(),demoDoorSetUnits:number(),demoLights:toggle,demoPartitionMm:number(),
  demoBathFull:number(),demoBathFixtures:number(),demoBathTub:number(),demoBathOverlay:number(),
  expansionLiving:toggle,expansionRooms:number("0",80),expansionKitchen:number("0",80),expansionPartitionMm:number(),
  electricalMode:select("full",["full","partial"]),electricBasic:toggle,electricArea:select("30",["20","30","40","50"]),electricRecessed:number(),electricSwitch:number(),
  wallpaperRoomPyeong:number("0",80),
  filmWindow:toggle,filmWindowArea:select("30",["20","30","40","50"]),filmDoorCount:number(),filmOneSideMm:number(),filmBothSidesMm:number(),filmWallMm:number(),
  furnitureDoorsEnabled:select("auto",["auto","on","off"]),
  furnitureTallDoors:number(),furnitureSinkSmallDoors:number(),furnitureSinkMediumDoors:number(),furnitureMoldingMm:number(),
  vanityMm:number(),vanityDrawers:number(),vanityTop:select("none",["none","himacs","khanstone","ceramic"]),vanityDepthMm:number("700"),
  countertopLayoutMode:select("current",["current","legacy"]),
  baseCounterCustomSize:toggle,homebarTallLengthMm:number(),
  baseCounterThickness:thickness,islandCounterThickness:thickness,homebarCounterThickness:thickness,vanityCounterThickness:thickness,
  baseCounterWidthMm:number(),baseCounterDepthMm:number(String(COUNTERTOP_DEFAULT_DEPTH_MM)),homebarCounterWidthMm:number(),homebarCounterDepthMm:number(String(COUNTERTOP_DEFAULT_DEPTH_MM)),
  dryVanityEnabled:toggle,dryVanityCabinetType:select("standard",["standard","foam"]),dryVanityLengthMm:number(),
  dryVanityCountertop:select("epPanel",["epPanel","himacs","khanstone","ceramic","none"]),dryVanityCounterThickness:thickness,
  dryVanityCounterCustomSize:toggle,dryVanityCounterWidthMm:number(),dryVanityCounterDepthMm:number(String(COUNTERTOP_DEFAULT_DEPTH_MM)),
  countertopTransport:toggle,countertopLadder:toggle,carrySelected:toggle,carryFloor:number("1",200),carryNoElevator:toggle,
  vanityEnabled:select("auto",["auto","on","off"]),
  electricFixtureEnabled:toggle,electricLightCost:number("0",1000000000),electricSwitchCost:number("0",1000000000),electricOutletCost:number("0",1000000000),
};
export const TRADE_PRIVATE_INPUTS=["electricLightCost","electricSwitchCost","electricOutletCost"];

// Only a previously active partial-demolition length carries forward.
export function expansionPartitionInput(inputs) {
  return inputs.expansionPartitionMm ?? (
    inputs.tradeFormulaVersion === "v2" && inputs.demolitionMode === "partial" ? inputs.demoPartitionMm ?? "0" : "0");
}

export const furnitureDoorsSelected = inputs => inputs.furnitureDoorsEnabled === "on" ||
  (inputs.furnitureDoorsEnabled !== "off" &&
    [inputs.furnitureTallDoors, inputs.furnitureSinkSmallDoors, inputs.furnitureSinkMediumDoors,
      inputs.furnitureMoldingMm].some(n => Number(n) > 0));

export const standardCountertopDimensions = (length, custom, width, depth) =>
  custom ? [Number(width), Number(depth)] : [Number(length), COUNTERTOP_DEFAULT_DEPTH_MM];

export function cabinetCountertopDimensions(inputs, lowerLength, homebarLength) {
  const legacy = inputs.countertopLayoutMode === "legacy";
  return {
    base: standardCountertopDimensions(lowerLength, inputs.baseCounterCustomSize, inputs.baseCounterWidthMm, inputs.baseCounterDepthMm),
    homebar: legacy ? [Number(inputs.homebarCounterWidthMm), Number(inputs.homebarCounterDepthMm)] : [Number(homebarLength), COUNTERTOP_DEFAULT_DEPTH_MM],
  };
}

export const dryVanityCountertopDimensions = inputs => standardCountertopDimensions(inputs.dryVanityLengthMm,
  inputs.dryVanityCounterCustomSize, inputs.dryVanityCounterWidthMm, inputs.dryVanityCounterDepthMm);

export function tradeRevisionValues(values,checked){
  return Object.fromEntries(Object.entries(TRADE_REVISION_INPUTS).map(([id,s])=>[id,s.type==="checkbox"?checked(id):s.type==="number"?Math.max(0,Number(values(id))||0):values(id)]));
}
