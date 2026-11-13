import { wallpaperGradeOption } from "./finish.js";

export const counterRates={ceramic:400000,khanstone:320000,himacs:200000};
export const countertopAreaCost=(width,depth,material)=>Math.floor(width*depth*(counterRates[material]||0)/700000);
export const wallpaperRolls=area=>Math.ceil(area*2.5/5);
export const filmLabor=v=>Math.ceil(((v.filmWindow?({20:4,30:6,40:8,50:10}[v.filmWindowArea]||0):0)*4000
  +v.filmDoorCount*2000+v.filmOneSideMm*2+v.filmBothSidesMm*4+v.filmWallMm)/4000);

export function revisedTradeDetails(state,rates,{jaRounded,mmText}){
  const v=state.tradeRevision;
  if(v?.tradeFormulaVersion!=="v2")return [];
  const rows=[];
  const add=(group,item,count,unit,unitPrice,cost=count*unitPrice,input=`${count}${unit}`)=>{
    if(cost>0)rows.push({group,item,input,quantity:`${count}${unit}`,unitPrice,cost});
  };
  const meters=(group,item,mm,price)=>add(group,item,mm/1000,"m",price,mm*price/1000,mmText(mm));
  if(v.demolition){
    if(v.demolitionMode==="partial"){
      for(const [item,key,price] of [["주방 가구철거","demoKitchenMm",10000],["싱크대 상판 철거","demoCounterMm",10000],["가벽철거","demoPartitionMm",100000]])meters("demolition",item,v[key],price);
      for(const [item,key,unit,price] of [["일반 가구장 철거","demoCabinetJa","자",10000],["중문 및 중문틀 철거","demoEntryUnits","개소",100000],["방문만 철거","demoDoorUnits","개",10000],["방문 및 문틀 철거","demoDoorSetUnits","조",30000]])add("demolition",item,v[key],unit,price);
      if(v.demoLights)add("demolition","조명철거",1,"식",state.areaPyeong<=40?50000:100000);
    }
    for(const [item,count,price] of [["화장실 전체철거 (경비 포함)",v.demoBathFull,650000],["화장실 집기만 철거",v.demoBathFixtures,150000],["욕조 철거 추가",v.demoBathFull?Math.min(v.demoBathFull,v.demoBathTub):0,200000],["타일 덧방 철거 추가",v.demoBathFull?Math.min(v.demoBathFull,v.demoBathOverlay):0,100000]])add("demolition",item,count,"개소",price);
  }
  if(v.electrical&&v.electricalMode==="partial"){
    if(v.electricBasic)add("electrical","기본형 전기공사 (조명기구 별도)",{20:1,30:1.5,40:2,50:3}[v.electricArea]||0,"품",rates.electrical.workerDay);
    add("electrical","매입등 추가 (등기구 별도)",v.electricRecessed,"개소",28000);
    add("electrical","스위치 추가 (이설 제외)",v.electricSwitch,"개소",50000);
    if(v.electricFixtureEnabled)for(const [label,amount] of [["조명기구",v.electricLightCost],["스위치 기구",v.electricSwitchCost],["콘센트 기구",v.electricOutletCost]])add("electrical",label,1,"식",amount);
  }
  if(v.wallpaper&&state.wallpaperMaterialEnabled){
    const room=Math.min(state.areaPyeong,v.wallpaperRoomPyeong);
    for(const [label,area,grade] of [["공용부",state.areaPyeong-room,state.wallpaperPublicMaterialGrade],["별도 벽지 방",room,state.wallpaperRoomMaterialGrade]]){
      const material=wallpaperGradeOption(grade,rates.finishMaterial,`${label} `);
      add("wallpaper",material.item,wallpaperRolls(area),"롤",material.unitPrice,undefined,`${area}평`);
    }
  }
  if(v.film&&state.filmEnabled)add("film","필름 인건비",filmLabor(v),"품",rates.finish.filmWorkerDay);
  if(v.furniture){
    for(const [item,key,price] of [["키큰장 문짝 교체","furnitureTallDoors",70000],["싱크대 문짝 교체 (400mm 이하)","furnitureSinkSmallDoors",35000],["싱크대 문짝 교체 (400mm 초과~600mm 이하)","furnitureSinkMediumDoors",45000]])add("base",item,v[key],"개",price);
    meters("base","가구 몰딩",v.furnitureMoldingMm,20000);
    const vanity=v.vanityEnabled!=="off"&&v.vanityMm>0;
    if(vanity){
      add("base","화장대 하부장",jaRounded(v.vanityMm),"자",rates.lowerPerJa,undefined,mmText(v.vanityMm));
      add("base","화장대 서랍",v.vanityDrawers,"개",rates.drawer);
    }
    const tops=[
      ["base","상하부장 상판",state.baseEnabled&&state.baseCountertopEnabled,v.baseCounterWidthMm,state.baseCountertop,v.baseCounterDepthMm],
      ["island","아일랜드 상판",state.islandEnabled,state.islandM,state.islandCountertop,state.islandDepthMm],
      ["homebar","홈바장 상판",state.homebarEnabled,v.homebarCounterWidthMm,state.homebarCountertop,v.homebarCounterDepthMm],
      ["base","화장대 상판",vanity,v.vanityMm,v.vanityTop,v.vanityDepthMm],
    ].filter(([, ,enabled,width,material,depth])=>enabled&&width>0&&depth>0&&counterRates[material]);
    for(const [group,label,,width,material,depth] of tops){
      add(group,`${label}(${rates.countertop[material].label}, 12T)`,width*depth/700000,"장 환산",counterRates[material],countertopAreaCost(width,depth,material),`${mmText(width)} × ${mmText(depth)}`);
    }
    if(v.countertopTransport&&tops.some(([, , ,width])=>width>2000))add("base","상판 운반비",1,"회",300000);
    if(v.countertopLadder&&tops.length)add("base","상판 사다리차",1,"회",120000);
  }
  if(v.finish&&v.carrySelected&&v.carryNoElevator&&v.carryFloor>=2)add("misc","소운반비",1,"식",1800000);
  return rows;
}
