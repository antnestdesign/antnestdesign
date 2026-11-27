import { wallpaperGradeOption } from "./finish.js";
import { cabinetCountertopDimensions, dryVanityCountertopDimensions, furnitureDoorsSelected } from "../../../../../../public/os-app/src/trade-revision-inputs.js";
import { countertopProductLabel, khanstonePrice } from "./khanstone-rates.js";

export const counterRates={ceramic:500000,khanstone:400000,himacs:210000};
const previousCounterRates={ceramic:400000,khanstone:320000,himacs:200000};
const slabThickness=(material,thickness,legacy)=>!legacy&&material==="khanstone"&&thickness==="20"?"20":"12";
const countertopReferenceAreaMm2 = 700000;
function countertopRate(material,thickness,legacy,product) {
  if (legacy) return previousCounterRates[material] || 0;
  const t = slabThickness(material,thickness,legacy);
  if (material === "khanstone") return khanstonePrice(product,t) ?? (t === "20" ? 450000 : counterRates.khanstone);
  return counterRates[material] || 0;
}
export const countertopAreaCost=(width,depth,material,thickness,legacy=false,product)=>
  Math.floor(width*depth*countertopRate(material,thickness,legacy,product)/countertopReferenceAreaMm2);
export const wallpaperRolls=area=>Math.ceil(area*2.5/5);
export const filmLabor=v=>Math.ceil(((v.filmWindow?({20:4,30:6,40:8,50:10}[v.filmWindowArea]||0):0)*4000
  +v.filmDoorCount*2000+v.filmOneSideMm*2+v.filmBothSidesMm*4+v.filmWallMm)/4000);

export function expansionDetails(v,mmText){
  if(!v?.demolition)return [];
  const rows=[
    ["거실 확장",v.expansionLiving?1:0,4600000,6000000],
    ["각방 확장",Math.trunc(v.expansionRooms||0),3000000,4000000],
    ["주방 확장",Math.trunc(v.expansionKitchen||0),3000000,4000000],
  ].filter(([,count])=>count>0).map(([item,count,unitCost,unitSale])=>({
    group:"demolition",item,input:`${count}개소`,quantity:`${count}개소`,
    unitPrice:unitCost,cost:count*unitCost,customerRevenue:count*unitSale,
  }));
  if(v.expansionPartitionMm>0){
    const meters=v.expansionPartitionMm/1000,unitPrice=100000;
    rows.push({group:"demolition",item:"가벽철거",input:mmText(v.expansionPartitionMm),
      quantity:`${meters}m`,unitPrice,cost:v.expansionPartitionMm*unitPrice/1000,fixedMarkup:0.30});
  }
  return rows;
}

export const usesPricedKhanstoneMidway = state =>
  state.tradeRevision?.tradeFormulaVersion === "v2" && state.tradeRevision.countertopLayoutMode !== "legacy"
  && state.homebarMidway === "khanstone" && Boolean(state.tradeRevision.homebarMidwayKhanstoneProduct);

export function revisedCountertops(state, legacyHomebarCounterLength) {
  const v = state.tradeRevision;
  if (!v) return [];
  const { base, homebar } = cabinetCountertopDimensions(v, state.lowerCabinetM, state.homebarM, legacyHomebarCounterLength);
  const dry = dryVanityCountertopDimensions(v);
  const vanity = v.vanityEnabled !== "off" && v.vanityMm > 0;
  const dryVanity = v.countertopLayoutMode !== "legacy" && state.bathroomEnabled && v.dryVanityEnabled && v.dryVanityLengthMm>0;
  return [
    ["base","상하부장 상판",v.furniture&&state.baseEnabled&&state.baseCountertopEnabled,base[0],state.baseCountertop,base[1],v.baseCounterThickness,v.baseKhanstoneProduct],
    ["island","아일랜드 상판",v.furniture&&state.islandEnabled,state.islandM,state.islandCountertop,state.islandDepthMm,v.islandCounterThickness,v.islandKhanstoneProduct],
    ["homebar","홈바장 상판",v.furniture&&state.homebarEnabled,homebar[0],state.homebarCountertop,homebar[1],v.homebarCounterThickness,v.homebarKhanstoneProduct],
    ["homebar","홈바장 미드웨이",v.furniture&&state.homebarEnabled&&usesPricedKhanstoneMidway(state),
      state.homebarM,state.homebarMidway,v.homebarMidwayHeightMm,v.homebarMidwayCounterThickness,v.homebarMidwayKhanstoneProduct],
    ["base","화장대 상판",v.furniture&&vanity,v.vanityMm,v.vanityTop,v.vanityDepthMm,v.vanityCounterThickness,v.vanityKhanstoneProduct],
    ["bathroom","건식세면대 상판",dryVanity,dry[0],v.dryVanityCountertop,dry[1],v.dryVanityCounterThickness,v.dryVanityKhanstoneProduct],
  ].filter(([, ,enabled,width,material,depth])=>enabled&&width>0&&depth>0&&Object.hasOwn(counterRates,material));
}

export function revisedTradeDetails(state,rates,{jaRounded,mmText,counterMinimumM,homebarCounterActualMm}){
  const v=state.tradeRevision;
  if(v?.tradeFormulaVersion!=="v2")return [];
  const rows=[];
  const add=(group,item,count,unit,unitPrice,cost=count*unitPrice,input=`${count}${unit}`)=>{
    if(cost>0)rows.push({group,item,input,quantity:`${count}${unit}`,unitPrice,cost});
  };
  const meters=(group,item,mm,price)=>add(group,item,mm/1000,"m",price,mm*price/1000,mmText(mm));
  if(v.demolition){
    if(v.demolitionMode==="partial"){
      for(const [item,key,price] of [["주방 가구철거","demoKitchenMm",10000],["싱크대 상판 철거","demoCounterMm",10000]])meters("demolition",item,v[key],price);
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
  const legacy=v.countertopLayoutMode==="legacy";
  const tops=revisedCountertops(state,homebarCounterActualMm);
  const addTop=([group,label,,width,material,depth,thickness,product])=>{
    const t=slabThickness(material,thickness,legacy);
    const name=countertopProductLabel(material,rates.countertop[material].label,legacy?"":product);
    add(group,`${label}(${name}, ${t}T)`,width*depth/countertopReferenceAreaMm2,"장 환산",
      countertopRate(material,t,legacy,product),countertopAreaCost(width,depth,material,t,legacy,product),`${mmText(width)} × ${mmText(depth)}`);
  };
  if(!legacy&&state.bathroomEnabled&&v.dryVanityEnabled&&v.dryVanityLengthMm>0){
    const foam=v.dryVanityCabinetType==="foam";
    add("bathroom",foam?"건식세면대 발포 하부장":"건식세면대 일반 가구장",jaRounded(v.dryVanityLengthMm),"자",foam?310000:rates.lowerPerJa,
      undefined,mmText(v.dryVanityLengthMm));
    if(v.dryVanityCountertop==="epPanel"){
      add("bathroom","건식세면대 상판(EP판)",Math.max(counterMinimumM,v.dryVanityLengthMm/1000),"m",
        rates.countertop.epPanel.costPerM,undefined,mmText(v.dryVanityLengthMm));
    }
    tops.filter(([group])=>group==="bathroom").forEach(addTop);
  }
  if(v.furniture){
    if(furnitureDoorsSelected(v)){
      for(const [item,key,price] of [["키큰장 문짝 교체","furnitureTallDoors",70000],["싱크대 문짝 교체 (400mm 이하)","furnitureSinkSmallDoors",35000],["싱크대 문짝 교체 (400mm 초과~600mm 이하)","furnitureSinkMediumDoors",45000]])add("base",item,v[key],"개",price);
      meters("base","가구 몰딩",v.furnitureMoldingMm,20000);
    }
    const vanity=v.vanityEnabled!=="off"&&v.vanityMm>0;
    if(vanity){
      add("base","화장대 하부장",jaRounded(v.vanityMm),"자",rates.lowerPerJa,undefined,mmText(v.vanityMm));
      add("base","화장대 서랍",v.vanityDrawers,"개",rates.drawer);
    }
    tops.filter(([group])=>group!=="bathroom").forEach(addTop);
    const side=state.islandSideFinish, count=state.islandSideFinishCount, depth=state.islandDepthMm, height=900;
    if(state.islandEnabled&&state.islandM>0&&depth>0&&count>0&&Object.hasOwn(counterRates,side)){
      const t=slabThickness(side,v.islandCounterThickness,legacy);
      const product=v.islandSideKhanstoneProduct;
      const material=countertopProductLabel(side,rates.countertop[side].label,legacy?"":product);
      const name=legacy?`아일랜드 좌우마감재(${material})`:`아일랜드 좌우마감재(${material}, ${t}T)`;
      add("island",name,
        depth*height*count/countertopReferenceAreaMm2,"장 환산",countertopRate(side,t,legacy,product),countertopAreaCost(depth*count,height,side,t,legacy,product),
        `${mmText(depth)} × ${mmText(height)} × ${count}개`);
    }
    if(legacy){
      if(v.countertopTransport&&tops.some(([, , ,width])=>width>2000))add("base","상판 운반비",1,"회",300000);
      if(v.countertopLadder&&tops.length)add("base","상판 사다리차",1,"회",120000);
    }
  }
  if(v.finish&&v.carrySelected&&v.carryNoElevator&&v.carryFloor>=2)add("misc","소운반비",1,"식",1800000);
  return rows;
}
