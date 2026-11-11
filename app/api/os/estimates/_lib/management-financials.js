import {ApiError} from '../../_lib/server';
import {createEstimateCalculation} from '../../_lib/calculation/calculator/estimate-core.js';

export function managementMoney(value,discount=false){
  const number=Number(value);
  if(!['number','string'].includes(typeof value)||typeof value==='string'&&!/^\d+$/.test(value)||!Number.isSafeInteger(number)||number<0||number>1e9)throw new ApiError(400,'금액은 0 이상의 원 단위 정수로 입력해 주세요.');
  if(discount&&number%1000!==0)throw new ApiError(400,'할인금액은 1,000원 단위로 입력해 주세요.');
  return number;
}

export function applyManagementFinancials(snapshot){
  const managementCost=managementMoney(snapshot.inputs?.managementCost??0),discount=managementMoney(snapshot.inputs?.managementDiscount??0,true);
  const core=createEstimateCalculation(),groups=snapshot.customerQuote?.groups;
  if(!Array.isArray(groups))throw new ApiError(409,'저장된 고객 견적 내역을 확인할 수 없습니다.');
  const previousDiscount=-groups.flatMap(g=>g.items||[]).filter(i=>i.managementDiscount===true).reduce((sum,i)=>sum+Number(i.amount),0);
  if(managementCost===0&&discount===0&&previousDiscount===0&&!snapshot.internalSummary?.managementCost)return snapshot;
  const beforeDiscount=Number(snapshot.total)+previousDiscount;
  if(!Number.isFinite(beforeDiscount)||discount>beforeDiscount)throw new ApiError(400,'할인금액은 할인 전 견적금액을 초과할 수 없습니다.');
  // Adjust only the saved discount line; never reprice existing work or current master costs.
  for(const group of groups){
    const removed=(group.items||[]).filter(i=>i.managementDiscount===true);
    if(removed.length){group.items=group.items.filter(i=>i.managementDiscount!==true);group.total-=removed.reduce((sum,i)=>sum+Number(i.amount),0);group.totalText=core.customerWon(group.total);}
  }
  if(discount){let group=groups.find(g=>g.label==='기타');if(!group){group={label:'기타',items:[],total:0,totalText:'0원'};groups.push(group);}
    group.items.push({name:'할인금액',amount:-discount,amountText:core.customerWon(-discount),managementDiscount:true});group.total-=discount;group.totalText=core.customerWon(group.total);}
  const total=discount===previousDiscount?Number(snapshot.total):core.floorThousand(beforeDiscount-discount),incomplete=snapshot.costIncomplete===true||snapshot.costTotal===null;
  if(incomplete)snapshot.costIncomplete=true;
  const cost=Number(snapshot.costTotal??snapshot.internalSummary?.directCost??0),profit=incomplete?null:total-cost-managementCost;
  const marginRate=incomplete?null:Number((core.markupRate(profit,cost)*100).toFixed(2));
  Object.assign(snapshot,{total,totalText:core.customerWon(total),marginRate});
  Object.assign(snapshot.customerQuote,{total,totalText:snapshot.totalText});
  snapshot.internalSummary={...snapshot.internalSummary,customerRevenue:total,managementCost,profit,marginRate};
  return snapshot;
}

export function updateManagementFinancials(row,body){
  if(!body||Object.keys(body).length!==1||!body.financialAdjustment||typeof body.financialAdjustment!=='object'||Array.isArray(body.financialAdjustment))throw new ApiError(400,'관리비용과 할인금액만 전송해 주세요.');
  const data=body.financialAdjustment;
  if(Object.keys(data).some(k=>!['managementCost','discountAmount'].includes(k)))throw new ApiError(400,'허용되지 않은 금액 항목입니다.');
  const snapshot=structuredClone(row.estimate_data);
  if(!snapshot||row.total_price!==undefined&&Number(row.total_price)!==Number(snapshot.total)||Number(snapshot.customerQuote?.total)!==Number(snapshot.total))throw new ApiError(409,'저장된 견적 총액과 내역이 일치하지 않습니다. 견적을 먼저 확인해 주세요.');
  if(!Object.hasOwn(snapshot,'costTotal')&&row.cost_total!==undefined)snapshot.costTotal=row.cost_total;
  snapshot.inputs={...snapshot.inputs,managementCost:String(managementMoney(data.managementCost)),managementDiscount:String(managementMoney(data.discountAmount,true))};
  return applyManagementFinancials(snapshot);
}
