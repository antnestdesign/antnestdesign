const number=(value="0",max=10000000)=>({type:"number",value,min:0,max});
const toggle={type:"checkbox",value:false};
const select=(value,choices)=>({type:"select-one",value,choices});
export const TRADE_REVISION_INPUTS={
  tradeFormulaVersion:select("v2",["legacy","v2"]),
  demolitionMode:select("full",["full","partial"]),
  demoKitchenMm:number(),demoCounterMm:number(),demoCabinetJa:number(),demoEntryUnits:number(),demoDoorUnits:number(),demoDoorSetUnits:number(),demoLights:toggle,demoPartitionMm:number(),
  demoBathFull:number(),demoBathFixtures:number(),demoBathTub:number(),demoBathOverlay:number(),
  electricalMode:select("full",["full","partial"]),electricBasic:toggle,electricArea:select("30",["20","30","40","50"]),electricRecessed:number(),electricSwitch:number(),
  wallpaperRoomPyeong:number("0",80),
  filmWindow:toggle,filmWindowArea:select("30",["20","30","40","50"]),filmDoorCount:number(),filmOneSideMm:number(),filmBothSidesMm:number(),filmWallMm:number(),
  furnitureTallDoors:number(),furnitureSinkSmallDoors:number(),furnitureSinkMediumDoors:number(),furnitureMoldingMm:number(),
  vanityMm:number(),vanityDrawers:number(),vanityTop:select("none",["none","himacs","khanstone","ceramic"]),vanityDepthMm:number("700"),
  baseCounterWidthMm:number(),baseCounterDepthMm:number("700"),homebarCounterWidthMm:number(),homebarCounterDepthMm:number("700"),
  countertopTransport:toggle,countertopLadder:toggle,carrySelected:toggle,carryFloor:number("1",200),carryNoElevator:toggle,
};

export function tradeRevisionValues(values,checked){
  return Object.fromEntries(Object.entries(TRADE_REVISION_INPUTS).map(([id,s])=>[id,s.type==="checkbox"?checked(id):s.type==="number"?Math.max(0,Number(values(id))||0):values(id)]));
}
