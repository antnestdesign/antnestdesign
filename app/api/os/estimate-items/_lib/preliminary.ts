import { ApiError, type UserContext } from '../../_lib/server';
import { createEstimateCalculation } from '../../_lib/calculation/calculator/estimate-core.js';
import { evaluateItem, itemCatalog, priceUnits, object } from './model.js';
import { assertBuilderActor, builderMode, itemId, requireBuilder, versionForAdoption } from './service';
import { isDeepStrictEqual } from 'node:util';
import { normalizeManualWorks, publicManualWork, manualWorkInput, manualWorkAmount, manualWorkName } from '../../../../../public/os-app/src/manual-work.js';

const labels:Record<string,string>={demolition:'철거',electrical:'전기/조명',bathroom:'욕실',wallpaper:'도배',film:'필름',flooring:'바닥',carpentry:'목공',furniture:'가구',finish:'기타'};
const groups:Record<string,string>={demolition:'demolition',electrical:'electrical',bathroom:'bathroom',wallpaper:'wallpaper',film:'film',flooring:'flooring',carpentry:'carpentry',furniture:'base',finish:'misc'};
type Version=Awaited<ReturnType<typeof versionForAdoption>>;
type Selection={id:string;versionId:string;inputs:Record<string,number>};
type ManualWork={id:string;trade:string;name:string;amount:number;note:string;costAmount?:number|null};
type PublicRow=(ReturnType<typeof itemCatalog>&{id:string;versionId:string;quantity:number;amount:number;values:Record<string,number>})|
  {id:string;kind:'manual';trade:string;name:string;spec:string;unit:string;quantity:number;amount:number;saleUnitPrice:number;inputs:[]};
type Detail=Omit<ReturnType<ReturnType<typeof createEstimateCalculation>['makeDetail']>,'cost'|'profit'>&{cost:number|null;profit:number|null};
type Snapshot={inputs:Record<string,unknown>;total:number;totalText:string;costTotal:number|null;marginRate:number|null;savedAt:string;costIncomplete?:boolean;
  internalDetails:Detail[];internalSummary:Record<string,number|null>;costBreakdown:unknown[];reviewNotice:boolean;
  customerQuote:{total:number;totalText:string;groups:Array<{label:string;total:number;totalText:string;items:Array<{name:string;amount:number;amountText:string}>}>};
  itemBuilder?:{schema:number;actor:string;selections:Selection[];manualWorks?:ManualWork[];publicRows:PublicRow[];privateRows:Array<Selection&{version:Version}>;base:Record<string,unknown>}};
type EstimateRow={estimate_data:Snapshot;[key:string]:unknown};
export function baseEstimate(row:EstimateRow|null) {
  if(!row?.estimate_data?.itemBuilder)return row;
  const data=structuredClone(row.estimate_data),base=data.itemBuilder!.base;
  if(!base)throw new ApiError(409,'추가 항목의 저장 기준을 확인할 수 없습니다.');
  Object.assign(data,structuredClone(base));delete data.itemBuilder;delete data.costIncomplete;
  return {...row,total_price:data.total,cost_total:data.costTotal,margin_rate:data.marginRate,estimate_data:data};
}
export async function appendEstimateItems(snapshot:Snapshot,requested:unknown,original:EstimateRow|null,user:UserContext,manualRequested?:unknown) {
  const previous=original?.estimate_data?.itemBuilder;
  const selections=requested===undefined?previous?.selections||[]:requested;
  if(!Array.isArray(selections)||selections.length>100)throw new ApiError(400,'추가 항목은 100개까지 사용할 수 있습니다.');
  if(user.profile.role==='staff'&&Array.isArray(manualRequested)&&manualRequested.some(row=>row&&typeof row==='object'&&Object.hasOwn(row,'costAmount')))throw new ApiError(403,'직접 공사 변경은 관리자 또는 매니저가 처리해야 합니다.');
  const previousRaw=previous?.manualWorks||[];
  let manualWorks:ManualWork[];
  try{manualWorks=normalizeManualWorks(manualRequested===undefined?previousRaw.map(manualWorkInput):manualRequested);}catch(error){throw new ApiError(400,(error as Error).message);}
  const previousManual=normalizeManualWorks(previousRaw.map(manualWorkInput));
  if(user.profile.role!=='staff')manualWorks=manualWorks.map(row=>{
    const old=previousManual.find(saved=>saved.id===row.id);
    return !Object.hasOwn(row,'costAmount')&&old&&Object.hasOwn(old,'costAmount')?{...row,costAmount:old.costAmount}:row;
  });
  if(user.profile.role==='staff'){
    if(manualRequested!==undefined&&manualWorks.some(row=>Object.hasOwn(row,'costAmount')))throw new ApiError(403,'직접 공사 변경은 관리자 또는 매니저가 처리해야 합니다.');
    if(!isDeepStrictEqual(manualWorks.map(publicManualWork),previousManual.map(publicManualWork)))throw new ApiError(403,'직접 공사 추가·금액 수정은 관리자 또는 매니저가 처리해야 합니다.');
    // Staff sends only public fields; retain the trusted private cost from the saved row.
    manualWorks=structuredClone(previousManual);
  }
  // Preserve opaque saved fields by stable ID; never accept opaque fields from a request.
  manualWorks=manualWorks.map(row=>({...structuredClone(previousRaw.find(saved=>saved.id.toLowerCase()===row.id)||{}),...row}));
  if(!selections.length&&!previous&&!manualWorks.length)return snapshot;
  await assertBuilderActor(user);
  const ids=new Set();
  const normalized=selections.map(s=>{object(s,['id','versionId','inputs']);const id=itemId(s.id),versionId=itemId(s.versionId);if(ids.has(id))throw new ApiError(400,'추가 항목 식별자가 중복됐습니다.');ids.add(id);return {id,versionId,inputs:s.inputs};});
  if(builderMode()!=='ON'&&!isDeepStrictEqual(normalized,previous?.selections||[]))requireBuilder(true);
  if(builderMode()!=='ON'&&!isDeepStrictEqual(manualWorks.map(manualWorkInput),previousManual))requireBuilder(true);
  if(normalized.length+manualWorks.length>100)throw new ApiError(400,'추가 공사는 합계 100개까지 사용할 수 있습니다.');
  for(const row of manualWorks){if(ids.has(row.id))throw new ApiError(400,'추가 공사 식별자가 중복됐습니다.');ids.add(row.id);}
  const privateRows:Array<Selection&{version:Version}>=[],publicRows:PublicRow[]=[],details:Detail[]=[],core=createEstimateCalculation();
  for(const s of normalized){
    const old=previous?.privateRows.find(r=>r.id===s.id&&r.versionId===s.versionId);
    const row=old?.version||await versionForAdoption(s.versionId);
    const result=evaluateItem(row.frozen,s.inputs),d=row.frozen.definition;
    const margin=Number(snapshot.inputs.targetMargin||30)/100;
    const units=priceUnits(row.frozen,margin);if(units.preliminaryUnit===null)throw new ApiError(409,`${d.name}: 판매가격 미설정입니다. 관리자에게 확인해 주세요.`);
    const manual=d.pricing?.preliminarySaleUnit!=null;
    const detail:Detail=core.makeDetail({group:groups[d.trade],item:d.name,input:'게시 항목',quantity:`${result.quantity}${d.unit}`,unitPrice:result.costUnit,cost:result.cost??0,margin,customerRevenue:manual?core.floorThousand(result.quantity*units.preliminaryUnit):undefined});
    if(result.cost===null){detail.cost=null;detail.profit=null;}
    if(!Number.isSafeInteger(detail.customerRevenue)||detail.customerRevenue<0||detail.customerRevenue>1e12)throw new ApiError(400,'추가 공사 금액이 허용 범위를 초과했습니다.');
    details.push(detail);
    privateRows.push({...s,version:row});
    publicRows.push({...itemCatalog(row,false),id:s.id,versionId:s.versionId,quantity:result.quantity,amount:detail.customerRevenue,saleUnitPrice:units.preliminaryUnit,values:s.inputs});
  }
  for(const row of manualWorks){
    const sale=manualWorkAmount(row.amount);
    const cost=row.costAmount??null;
    const detail:Detail=core.makeDetail({group:groups[row.trade],item:manualWorkName(row),input:'직접 입력 판매금액',quantity:'1식',unitPrice:cost,cost:cost??0,margin:0,customerRevenue:sale});
    detail.cost=cost;detail.profit=cost===null?null:sale-cost;
    details.push(detail);
    publicRows.push({id:row.id,kind:'manual',trade:row.trade,name:row.name,spec:row.note,unit:'식',quantity:1,amount:sale,saleUnitPrice:sale,inputs:[]});
  }
  const keys=['total','totalText','costTotal','marginRate','internalDetails','internalSummary','costBreakdown','reviewNotice','customerQuote'] as const;
  const base={...structuredClone(previous?.base||{}),...Object.fromEntries(keys.map(k=>[k,structuredClone(snapshot[k]??null)]))};
  snapshot=structuredClone(snapshot);
  for(const row of publicRows){const label=labels[row.trade];let group=snapshot.customerQuote.groups.find(g=>g.label===label);if(!group){group={label,total:0,totalText:'0원',items:[]};snapshot.customerQuote.groups.push(group);}const manual=manualWorks.find(m=>m.id===row.id);group.items.push({name:manual?manualWorkName(manual):row.name,amount:row.amount,amountText:core.customerWon(row.amount)});group.total=Number(group.total)+row.amount;group.totalText=core.customerWon(group.total);}
  const extraCost=details.reduce((n,d)=>n+(d.cost??0),0),extraSale=publicRows.reduce((n,r)=>n+r.amount,0),unknown=details.some(d=>d.cost===null),knownCost=Number(snapshot.costTotal)+extraCost;
  snapshot.total=Number(snapshot.total)+extraSale;snapshot.totalText=core.customerWon(snapshot.total);snapshot.costTotal=unknown?null:knownCost;snapshot.costIncomplete=unknown;
  if(!Number.isSafeInteger(snapshot.total)||snapshot.total<0||snapshot.total>1e12||!Number.isFinite(knownCost)||knownCost<0||knownCost>1e12)throw new ApiError(400,'견적 합계가 허용 범위를 초과했습니다. 기존 견적과 추가 수량을 확인해 주세요.');
  snapshot.marginRate=unknown?null:Number(((knownCost?(snapshot.total-knownCost)/knownCost:0)*100).toFixed(2));
  snapshot.customerQuote.total=snapshot.total;snapshot.customerQuote.totalText=snapshot.totalText;
  snapshot.internalDetails=[...(snapshot.internalDetails||[]),...details];
  snapshot.internalSummary={...snapshot.internalSummary,directCost:snapshot.costTotal,customerRevenue:snapshot.total,profit:unknown?null:snapshot.total-knownCost,marginRate:snapshot.marginRate,...(unknown?{discountRoom:null}:{})};
  snapshot.itemBuilder={...structuredClone(previous||{}),schema:1,actor:user.authUser.id,selections:normalized,...(manualWorks.length||previous?.manualWorks?{manualWorks}:{}),publicRows,privateRows,base};
  return snapshot;
}
