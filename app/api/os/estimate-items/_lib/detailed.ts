import { ApiError, supabaseFetch } from '../../_lib/server';
import { itemCatalog, priceUnits } from './model.js';
import { builderMode, itemId, publishedItems, requireBuilder, versionForAdoption } from './service';
import type { PrivateEditor } from '../../projects/_lib/editor-model';
import { isDeepStrictEqual } from 'node:util';

type PublicItem={id:string;name:string;trade:string;spec:string;unit:string;saleUnitPrice:number|null;costUnit?:number|null};
export function asStandard(p:PublicItem) {
  return {id:`tpl-${p.id}`,name:p.name,trade:p.trade,spec:p.spec,unit:p.unit,sourceCode:'',masterCode:'',group:'추가 공사',spaceAllowed:true,quantityBasis:'manual',pricing:'master',linked:p.saleUnitPrice!==null,saleUnitPrice:p.saleUnitPrice,scope:'시공 범위 확인',note:'',...(p.costUnit===undefined?{}:{costUnit:p.costUnit})};
}
export async function extraStandards(privileged:boolean) {
  return builderMode()==='OFF'?[]:(await publishedItems(privileged)).map(asStandard);
}
export async function referenceStandards(rows:Array<{versionId:string}>|undefined,privileged:boolean) {
  const ids=[...new Set((rows||[]).map(r=>itemId(r.versionId)))];if(!ids.length)return [];
  const versions=await supabaseFetch<Array<Parameters<typeof itemCatalog>[0]>>(`/rest/v1/estimate_item_versions?select=*&id=in.(${ids.join(',')})`);
  if(versions.length!==ids.length)throw new ApiError(409,'참고 항목 버전을 찾지 못했습니다.');
  return versions.map(v=>asStandard(itemCatalog(v,privileged)));
}
export async function prepareTemplateItems(input:unknown,previous:PrivateEditor,referenceRows:Array<{versionId:string}>|undefined) {
  const editor=input as {items?:Array<{id:string;standardId?:string}>};
  if(!Array.isArray(editor?.items))return {internal:previous,standards:[]};
  const internal=structuredClone(previous),standards=[];
  internal.items ||= {};
  for(const i of editor.items){
    if(!i.standardId?.startsWith('tpl-'))continue;
    const id=itemId(i.standardId.slice(4)),old=internal.items[i.id];
    if(old){if(old.templateVersion?.id!==id)throw new ApiError(409,'기존 품목의 게시 출처는 바꿀 수 없습니다.');continue;}
    requireBuilder(true);
    const fromReference=referenceRows?.some(r=>r.versionId===id);
    let row;
    if(fromReference){const rows=await supabaseFetch<Array<Parameters<typeof itemCatalog>[0]>>(`/rest/v1/estimate_item_versions?id=eq.${id}&select=*`);row=rows[0];if(!row)throw new ApiError(409,'참고 게시 항목을 찾지 못했습니다.');}
    else row=await versionForAdoption(id);
    const frozen=row.frozen,d=frozen.definition;
    if(priceUnits(frozen).detailedUnit===null)throw new ApiError(409,`${d.name}: 판매가격 미설정입니다. 관리자에게 확인해 주세요.`);
    internal.items[i.id]={costUnit:frozen.costUnit,costConfigured:frozen.costUnit!==null,targetMargin:previous.policy?.tradeMargins?.[d.trade]??previous.policy?.companyMargin??.25,masterCode:'',kind:'quantity',templateVersion:{id,frozen}};
    standards.push(asStandard(itemCatalog(row,false)));
  }
  return {internal,standards};
}
export function protectTemplateEdits(input:unknown,previous:unknown,commands:unknown,changes:unknown) {
  if(builderMode()==='ON')return;
  const now=input as {items?:Array<Record<string,unknown>>},old=previous as {items?:Array<Record<string,unknown>>};
  const clean=(r:Record<string,unknown>)=>Object.fromEntries(Object.entries(r).filter(([k])=>k!=='amount'&&k!=='masterCode'));
  const templateIds=new Set((old.items||[]).filter(i=>String(i.standardId).startsWith('tpl-')).map(i=>i.id));
  for(const i of [...now.items||[],...old.items||[]])if(String(i.standardId).startsWith('tpl-')){
    const before=old.items?.find(r=>r.id===i.id),after=now.items?.find(r=>r.id===i.id);
    if(!before||!after||!isDeepStrictEqual(clean(before),clean(after)))requireBuilder(true);
  }
  if(Array.isArray(commands)&&commands.some(c=>templateIds.has(c.itemId)||c.action==='approve'||c.action==='reject'))requireBuilder(true);
  const internal=changes as {items?:Record<string,unknown>;reprice?:string[]};
  if(internal&&(Object.keys(internal.items||{}).some(id=>templateIds.has(id))||internal.reprice?.some(id=>templateIds.has(id))))requireBuilder(true);
}
