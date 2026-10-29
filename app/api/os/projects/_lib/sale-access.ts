import { createHash } from "node:crypto";
import { ApiError } from "../../_lib/server";
import { calculateEditor, Master, PrivateEditor } from "./editor-model";
import { standardCatalog } from "./standard-catalog";
import { priceStamp } from "../../../../../public/os-app/src/detailed-completion.js";

type Editor = ReturnType<typeof calculateEditor>["publicEditor"];
type Row = Editor["items"][number];
type SaleRequest = { id: string; itemId: string; before: number; proposed: number; reason: string; requester: string; requestedAt: string; state: "pending" | "approved" | "rejected"; condition: string; superseded?: boolean; reviewer?: string; reviewedAt?: string; response?: string };
export type SaleState = { requests: SaleRequest[]; authorized: Record<string, { price: number; condition: string }>; review?: { actor: string; at: string } };
type Internal = PrivateEditor & { saleReview?: SaleState };
function bad(message: string, status = 400): never { throw new ApiError(status, message); }
const condition = (i: Row) => createHash("sha256").update(JSON.stringify([i.id,i.standardId,i.masterCode,i.kind,i.quantity,i.unit,i.spec,i.spaceId,i.spaceIds,i.workScope,i.excluded])).digest("hex");
const validPrice = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 1e9;
const obj = (v: unknown, keys: string[]) => { if(!v || typeof v!=="object" || Array.isArray(v) || Object.keys(v).some(k=>!keys.includes(k)))bad("가격 요청 형식을 확인해 주세요.");return v as Record<string, unknown>; };
const text = (v: unknown) => { if(typeof v!=="string" || !v.trim() || v.length>500)bad("가격 검토 사유를 입력해 주세요.");return v as string; };
export function staffStandards(masters: Master[]) {
  return standardCatalog(masters,false).map(s=>({id:s.id,trade:s.trade,name:s.name,spec:s.spec,unit:s.unit,group:s.group,spaceAllowed:s.spaceAllowed,quantityBasis:s.quantityBasis,
    pricing:s.pricing,scope:"시공 범위 확인",note:"시공 수량과 적용 부위를 확인해 주세요.",linked:s.saleUnitPrice!=null,saleUnitPrice:s.saleUnitPrice}));
}
export function staffEditor(editor: Editor) {
  return {...editor,items:editor.items.map(i=>({...i,masterCode:""}))};
}
export function prepareStaffInput(input: unknown, previous: Editor, masters: Master[]) {
  const e = structuredClone(input) as Editor;
  if(!e || !Array.isArray(e.items))bad("작성본 품목을 확인해 주세요.");
  if(e.addition!==(previous.addition??0) || e.discount!==(previous.discount??0))bad("총액 조정은 가격 검토가 필요합니다.",403);
  const standards=standardCatalog(masters,false);
  for(const i of e.items){
    const old=previous.items?.find(r=>r.id===i.id);
    if(old){
      if(i.saleUnitPrice!==old.saleUnitPrice || i.standardId!==old.standardId || (i.masterCode && i.masterCode!==old.masterCode) || i.kind!==old.kind)bad("판매가격 변경은 가격 변경 요청을 이용해 주세요.",403);
      i.masterCode=old.masterCode;
    }else{
      const standard=standards.find(s=>s.id===i.standardId);
      if(i.masterCode && i.masterCode!==standard?.masterCode)bad("표준 품목을 선택해 주세요.",403);
      if(!standard && i.masterCode)bad("표준 품목을 선택해 주세요.",403);
      const price=standard?.saleUnitPrice??0;
      if(i.saleUnitPrice!=null && i.saleUnitPrice!==price)bad("판매가격 변경은 가격 변경 요청을 이용해 주세요.",403);
      i.masterCode=standard?.masterCode||"";
      i.saleUnitPrice=price;
      if(standard && i.kind!==(standard.pricing==="tile"?"tile":"quantity"))bad("표준 품목의 금액 방식을 확인해 주세요.",403);
    }
  }
  return e;
}
function stateOf(internal: Internal): SaleState { return structuredClone(internal.saleReview || {requests:[],authorized:{}}); }
export function saleProjection(editor: Editor, internal: Internal, actor: string, privileged: boolean) {
  const state=stateOf(internal);
  return { requests:state.requests.filter(r=>privileged||r.requester===actor).map(r=>{
    const row=editor.items.find(i=>i.id===r.itemId),stale=Boolean(r.superseded)||!row||condition(row)!==r.condition||(r.state==="pending"?row.saleUnitPrice!==r.before:r.state==="approved"&&row.saleUnitPrice!==r.proposed);
    return {id:r.id,itemId:r.itemId,before:r.before,proposed:r.proposed,reason:r.reason,state:r.state,stale,requestedAt:r.requestedAt,reviewedAt:r.reviewedAt,response:privileged?r.response:r.state==="approved"?"요청 가격이 승인됐습니다.":r.state==="rejected"?"가격 요청이 반려됐습니다. 검토자에게 확인해 주세요.":undefined};
  }), needsReview:unreviewed(editor,internal), reviewRequested:Boolean(state.review) };
}
function unreviewed(editor: Editor, internal: Internal) {
  const state=stateOf(internal);
  return editor.items.filter(i=>{
    if(i.excluded)return false;
    const a=state.authorized[i.id],d=internal.items?.[i.id];
    if(a&&a.price===i.saleUnitPrice&&a.condition===condition(i))return false;
    if(d?.priceApproval&&!d.priceApproval.invalidated&&d.priceApproval.stamp===priceStamp(i,d))return false;
    if(d?.cost==null)return true;
    const base=i.kind==="tile"?(i.quantity?d.cost/i.quantity:0):d.costUnit;
    const standard=d.salePolicy==="pipe-fixed-v1"?300000:base==null?null:Math.round(base/(1-d.targetMargin));
    return standard!==i.saleUnitPrice;
  }).map(i=>i.id);
}
export function processSaleCommands(editor: Editor, internal: Internal, previous: Editor, before: Internal, commands: unknown, actor: string, role: string) {
  const privileged=role==="admin"||role==="manager",state=stateOf(before),now=new Date().toISOString();
  for(const i of editor.items){
    const old=previous.items?.find(r=>r.id===i.id),auth=state.authorized[i.id];
    if(auth && (auth.condition!==condition(i)||auth.price!==i.saleUnitPrice))delete state.authorized[i.id];
    if(privileged && (!old||old.saleUnitPrice!==i.saleUnitPrice))state.authorized[i.id]={price:i.saleUnitPrice,condition:condition(i)};
  }
  if(commands!==undefined && (!Array.isArray(commands)||commands.length>100))bad("가격 요청 개수를 확인해 주세요.");
  const seen=new Set<string>();
  for(const raw of (commands||[]) as unknown[]){
    const c=obj(raw,["action","id","itemId","proposed","reason"]);
    if(c.action==="review"){state.review={actor,at:now};continue;}
    if(typeof c.id!=="string" || !/^[a-f0-9-]{36}$/i.test(c.id) || seen.has(c.id))bad("가격 요청 식별자를 확인해 주세요.");seen.add(c.id);
    if(c.action==="request"){
      if(state.requests.some(r=>r.id===c.id))bad("이미 처리된 가격 요청입니다.",409);
      const i=editor.items.find(i=>i.id===c.itemId);if(!i||i.excluded)bad("가격 요청 품목을 확인해 주세요.");
      if(!validPrice(c.proposed))bad("요청 판매단가를 확인해 주세요.");
      const reason=text(c.reason);
      for(const r of state.requests)if(r.itemId===i.id&&r.state==="pending")r.superseded=true;
      state.requests.push({id:c.id,itemId:i.id,before:i.saleUnitPrice,proposed:c.proposed,reason,requester:actor,requestedAt:now,state:"pending",condition:condition(i)});
    }else if(c.action==="approve"||c.action==="reject"){
      if(!privileged)bad("가격 처리 권한이 없습니다.",403);
      const r=state.requests.find(r=>r.id===c.id),i=r&&editor.items.find(i=>i.id===r.itemId);
      const saved=r&&previous.items?.find(i=>i.id===r.itemId);
      if(!r||!i||r.state!=="pending"||r.superseded||(c.action==="approve"&&(condition(i)!==r.condition||saved?.saleUnitPrice!==r.before||(i.saleUnitPrice!==r.before&&i.saleUnitPrice!==r.proposed))))bad("가격 요청 조건이 변경됐습니다. 새로 요청해 주세요.",409);
      r.state=c.action==="approve"?"approved":"rejected";r.reviewer=actor;r.reviewedAt=now;r.response=text(c.reason);
      if(r.state==="approved"){
        i.saleUnitPrice=r.proposed;state.authorized[i.id]={price:r.proposed,condition:condition(i)};
      }
    }else bad("가격 요청 작업을 확인해 주세요.");
  }
  internal.saleReview=state;
  return state;
}
export function applySaleApprovals(editor: Editor, internal: Internal, state: SaleState, actor: string, save: boolean, approvedIds: string[]) {
  internal.saleReview=state;
  for(const r of state.requests){
    const i=editor.items.find(i=>i.id===r.itemId),detail=i&&internal.items[i.id];
    if(approvedIds.includes(r.id)&&r.state==="approved"&&r.reviewer===actor&&r.reviewedAt&&i&&detail&&r.proposed===i.saleUnitPrice&&condition(i)===r.condition&&detail.cost!=null&&i.amount<detail.cost){
      detail.priceApproval={reason:r.response||r.reason,stamp:priceStamp(i,detail),...(save?{actor,at:r.reviewedAt}:{})};
    }
  }
}
export function validateSaleRequests(editor: Editor, internal: Internal) {
  const state=stateOf(internal);
  if(state.requests.some(r=>r.state==="pending"&&!r.superseded&&editor.items.some(i=>i.id===r.itemId&&!i.excluded)))bad("처리되지 않은 판매가격 요청이 있습니다.");
  if(internal.saleReview&&unreviewed(editor,internal).length)bad("판매가격 검토가 필요한 품목이 있습니다.");
  for(const r of state.requests.filter(r=>r.state==="approved")){
    const i=editor.items.find(i=>i.id===r.itemId),auth=i&&state.authorized[i.id];
    if(i&&!i.excluded&&r.proposed===i.saleUnitPrice&&(!auth||auth.condition!==condition(i)))bad("판매가격 승인 조건이 변경됐습니다. 다시 검토해 주세요.");
  }
}
