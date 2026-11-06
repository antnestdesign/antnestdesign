import { ApiError, type UserContext } from '../../_lib/server';
import { createEstimateCalculation } from '../../_lib/calculation/calculator/estimate-core.js';
import { evaluateItem, itemCatalog, priceUnits, object } from './model.js';
import { assertBuilderActor, builderMode, itemId, requireBuilder, versionForAdoption } from './service';
import { isDeepStrictEqual } from 'node:util';

const labels:Record<string,string>={demolition:'철거',electrical:'전기/조명',bathroom:'욕실',wallpaper:'도배',film:'필름',flooring:'바닥',carpentry:'목공',furniture:'가구',finish:'기타'};
const groups:Record<string,string>={demolition:'demolition',electrical:'electrical',bathroom:'bathroom',wallpaper:'wallpaper',film:'film',flooring:'flooring',carpentry:'carpentry',furniture:'base',finish:'misc'};
type Version=Awaited<ReturnType<typeof versionForAdoption>>;
type Selection={id:string;versionId:string;inputs:Record<string,number>};
type PublicRow=ReturnType<typeof itemCatalog>&{id:string;versionId:string;quantity:number;amount:number;values:Record<string,number>};
type Detail=Omit<ReturnType<ReturnType<typeof createEstimateCalculation>['makeDetail']>,'cost'|'profit'>&{cost:number|null;profit:number|null};
type Snapshot={inputs:Record<string,unknown>;total:number;totalText:string;costTotal:number|null;marginRate:number|null;savedAt:string;costIncomplete?:boolean;
  internalDetails:Detail[];internalSummary:Record<string,number|null>;costBreakdown:unknown[];reviewNotice:boolean;
  customerQuote:{total:number;totalText:string;groups:Array<{label:string;total:number;totalText:string;items:Array<{name:string;amount:number;amountText:string}>}>};
  itemBuilder?:{schema:number;actor:string;selections:Selection[];publicRows:PublicRow[];privateRows:Array<Selection&{version:Version}>;base:Record<string,unknown>}};
type EstimateRow={estimate_data:Snapshot;[key:string]:unknown};
export function baseEstimate(row:EstimateRow|null) {
  if(!row?.estimate_data?.itemBuilder)return row;
  const data=structuredClone(row.estimate_data),base=data.itemBuilder!.base;
  if(!base)throw new ApiError(409,'추가 항목의 저장 기준을 확인할 수 없습니다.');
  Object.assign(data,structuredClone(base));delete data.itemBuilder;delete data.costIncomplete;
  return {...row,total_price:data.total,cost_total:data.costTotal,margin_rate:data.marginRate,estimate_data:data};
}
export async function appendEstimateItems(snapshot:Snapshot,requested:unknown,original:EstimateRow|null,user:UserContext) {
  const previous=original?.estimate_data?.itemBuilder;
  const selections=requested===undefined?previous?.selections||[]:requested;
  if(!Array.isArray(selections)||selections.length>100)throw new ApiError(400,'추가 항목은 100개까지 사용할 수 있습니다.');
  if(!selections.length&&!previous)return snapshot;
  await assertBuilderActor(user);
  const ids=new Set();
  const normalized=selections.map(s=>{object(s,['id','versionId','inputs']);const id=itemId(s.id),versionId=itemId(s.versionId);if(ids.has(id))throw new ApiError(400,'추가 항목 식별자가 중복됐습니다.');ids.add(id);return {id,versionId,inputs:s.inputs};});
  if(builderMode()!=='ON'&&!isDeepStrictEqual(normalized,previous?.selections||[]))requireBuilder(true);
  const privateRows=[],publicRows=[],details=[],core=createEstimateCalculation();
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
  const keys=['total','totalText','costTotal','marginRate','internalDetails','internalSummary','costBreakdown','reviewNotice','customerQuote'] as const;
  const base=Object.fromEntries(keys.map(k=>[k,structuredClone(snapshot[k]??null)]));
  snapshot=structuredClone(snapshot);
  for(const row of publicRows){const label=labels[row.trade];let group=snapshot.customerQuote.groups.find(g=>g.label===label);if(!group){group={label,total:0,totalText:'0원',items:[]};snapshot.customerQuote.groups.push(group);}group.items.push({name:row.name,amount:row.amount,amountText:core.customerWon(row.amount)});group.total=Number(group.total)+row.amount;group.totalText=core.customerWon(group.total);}
  const extraCost=details.reduce((n,d)=>n+(d.cost??0),0),extraSale=publicRows.reduce((n,r)=>n+r.amount,0),unknown=details.some(d=>d.cost===null),knownCost=Number(snapshot.costTotal)+extraCost;
  snapshot.total=Number(snapshot.total)+extraSale;snapshot.totalText=core.customerWon(snapshot.total);snapshot.costTotal=unknown?null:knownCost;snapshot.costIncomplete=unknown;
  if(!Number.isSafeInteger(snapshot.total)||snapshot.total<0||snapshot.total>1e12||!Number.isFinite(knownCost)||knownCost<0||knownCost>1e12)throw new ApiError(400,'견적 합계가 허용 범위를 초과했습니다. 기존 견적과 추가 수량을 확인해 주세요.');
  snapshot.marginRate=unknown?null:Number(((knownCost?(snapshot.total-knownCost)/knownCost:0)*100).toFixed(2));
  snapshot.customerQuote.total=snapshot.total;snapshot.customerQuote.totalText=snapshot.totalText;
  snapshot.internalDetails=[...(snapshot.internalDetails||[]),...details];
  snapshot.internalSummary={...snapshot.internalSummary,directCost:snapshot.costTotal,customerRevenue:snapshot.total,profit:unknown?null:snapshot.total-knownCost,marginRate:snapshot.marginRate,...(unknown?{discountRoom:null}:{})};
  snapshot.itemBuilder={schema:1,actor:user.authUser.id,selections:normalized,publicRows,privateRows,base};
  return snapshot;
}
