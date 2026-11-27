import { KHANSTONE_PRODUCTS, KHANSTONE_SELECTION_FIELDS } from "./khanstone-products.js";

const number=(value="0",max=10000000)=>({type:"number",value,min:0,max});
const toggle={type:"checkbox",value:false};
const select=(value,choices)=>({type:"select-one",value,choices});
const thickness=select("12",["12","20"]);
const khanstoneProduct=select("",["",...Object.keys(KHANSTONE_PRODUCTS)]);
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
  tallRiceCabinetMode:select("auto",["auto","on","off"]),
  khanstoneCatalogVersion:select("",["","v1"]),
  ...Object.fromEntries(Object.values(KHANSTONE_SELECTION_FIELDS).map(id=>[id,khanstoneProduct])),
  baseCounterCustomSize:toggle,baseCountertopFollowsLower:toggle,homebarTallLengthMm:number(),
  baseCounterThickness:thickness,islandCounterThickness:thickness,homebarCounterThickness:thickness,vanityCounterThickness:thickness,
  homebarMidwayCounterThickness:thickness,homebarMidwayHeightMm:number(),
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

export function tallRiceCabinetSelected(inputs) {
  return inputs.tallRiceCabinetMode === "on" || (inputs.tallRiceCabinetMode !== "off" && inputs.baseEnabled
    && [inputs.tallCabinetM, inputs.riceCabinetUnits].some(n => Number(n) > 0));
}

export const standardCountertopDimensions = (length, custom, width, depth) =>
  custom ? [Number(width), Number(depth)] : [Number(length), COUNTERTOP_DEFAULT_DEPTH_MM];

export function cabinetCountertopDimensions(inputs, lowerLength, homebarLength, legacyHomebarCounterLength = 0) {
  const legacy = inputs.countertopLayoutMode === "legacy";
  return {
    base: standardCountertopDimensions(lowerLength, !inputs.baseCountertopFollowsLower && inputs.baseCounterCustomSize,
      inputs.baseCounterWidthMm, inputs.baseCounterDepthMm),
    homebar: legacy
      ? [Number(inputs.homebarCounterWidthMm) || legacyHomebarCounterLength, Number(inputs.homebarCounterDepthMm) || COUNTERTOP_DEFAULT_DEPTH_MM]
      : [Number(homebarLength), COUNTERTOP_DEFAULT_DEPTH_MM],
  };
}

export const dryVanityCountertopDimensions = inputs => standardCountertopDimensions(inputs.dryVanityLengthMm,
  inputs.dryVanityCounterCustomSize, inputs.dryVanityCounterWidthMm, inputs.dryVanityCounterDepthMm);

export function selectedKhanstoneWorks(inputs) {
  const furniture = inputs.sectionFurnitureEnabled;
  const base = furniture && inputs.baseEnabled && (inputs.baseCountertopEnabled || inputs.baseCountertopFollowsLower)
    && (!inputs.baseCountertopFollowsLower || Number(inputs.lowerCabinetM) > 0);
  const work = (material,label) => ({ field:KHANSTONE_SELECTION_FIELDS[material], label });
  if (inputs.tradeFormulaVersion !== "v2" || inputs.countertopLayoutMode === "legacy") {
    return base && inputs.baseCountertopFollowsLower && inputs.baseCountertop === "khanstone"
      ? [work("baseCountertop","상하부장 상판")] : [];
  }
  const homebar = furniture && inputs.homebarEnabled && Number(inputs.homebarM) > 0;
  const island = furniture && inputs.islandEnabled && Number(inputs.islandM) > 0;
  return [
    ["baseCountertop", base, "상하부장 상판"],
    ["islandCountertop", island, "아일랜드 상판"],
    ["islandSideFinish", island && Number(inputs.islandSideFinishCount) > 0, "아일랜드 측판"],
    ["homebarCountertop", homebar, "홈바장 상판"],
    ["homebarMidway", homebar, "홈바장 미드웨이"],
    ["vanityTop", furniture && inputs.vanityEnabled !== "off" && Number(inputs.vanityMm) > 0, "화장대 상판"],
    ["dryVanityCountertop", inputs.sectionBathroomEnabled && inputs.dryVanityEnabled, "건식세면대 상판"],
  ].filter(([material,active])=>active&&inputs[material]==="khanstone")
    .map(([material,,label])=>work(material,label));
}

export function tradeRevisionValues(values,checked){
  return Object.fromEntries(Object.entries(TRADE_REVISION_INPUTS).map(([id,s])=>[id,s.type==="checkbox"?checked(id):s.type==="number"?Math.max(0,Number(values(id))||0):values(id)]));
}
