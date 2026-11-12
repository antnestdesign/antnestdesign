import {ApiError,supabaseFetch,UserContext} from '../../_lib/server';
import {estimateActor} from '../../estimates/_lib/ownership';
import {assertUuid,buildContractDocuments,buildContractPackageSnapshot,hashJson,normalizeContractOptions,paymentSchedule,EstimateRow} from './contracts';
import {customerQuoteProjection} from '../../../../../public/os-app/src/customer-quote.js';
import {requireFoundationAction} from '../../projects/_lib/feature-state';
import {contractAddress} from './contractor';

export type Row=Record<string,unknown>;
const obj=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{};
export async function confirmedContractAccess(context:UserContext,projectId:string,write=false){
 assertUuid(projectId,'프로젝트 ID');const actor=await estimateActor(context),mode=requireFoundationAction(write?'project-workflow':'project');
 const p=(await supabaseFetch<Row[]>(`/rest/v1/projects?id=eq.${projectId}&select=*&limit=1`))[0];
 if(!p?.flow_version_id)throw new ApiError(409,'계약관리로 전환된 확정 견적이 필요합니다.');
 const v=(await supabaseFetch<Row[]>(`/rest/v1/preliminary_estimate_versions?id=eq.${p.flow_version_id}&project_id=eq.${projectId}&select=*&limit=1`))[0];
 if(!v||v.estimate_id!==p.flow_estimate_id)throw new ApiError(409,'계약 기준 확정 버전의 연결을 확인해 주세요.');
 const canManage=actor.role!=='staff'&&await supabaseFetch<boolean>('/rest/v1/rpc/and_os_estimate_can_edit',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_estimate:v.estimate_id})});
 if((write&&!canManage)||(!canManage&&!(actor.role==='staff'&&obj(v.snapshot).creator_id===actor.id)))throw new ApiError(403,'이 프로젝트의 계약 문서에 접근할 권한이 없습니다.');
 return {actor,project:p,version:v,canManage,canWrite:canManage&&mode==='ON'};
}
const fields=['customerName','customerPhone','siteAddress','customerAddress','customerEmail','contractDate','startDate','completionDate','constructionType','companyName','businessNo','representative','companyAddress','companyPhone','managerName','managerTitle','managerPhone','amount','amountBasis','reason','approveDifference','notes','adminOfficeIncluded','consentIncluded','permitIncluded','protectionIncluded','pipeCleaningIncluded'];
export function confirmedContractForm(raw:unknown){
 const data={...obj(raw)};if(Object.keys(data).some(k=>!fields.includes(k)))throw new ApiError(400,'허용되지 않은 계약 정보입니다.');
 if([data.customerAddress,data.siteAddress].every(v=>v==null||typeof v==='string')){
  data.customerAddress=data.siteAddress=contractAddress(data.customerAddress,data.siteAddress);
 }
 const text=(key:string,required=false)=>{const v=data[key];if(v!=null&&typeof v!=='string')throw new ApiError(400,'계약 입력 형식을 확인해 주세요.');const s=String(v??'').trim();if(s.length>1000||required&&!s)throw new ApiError(400,`${({customerName:'계약 상대방',customerPhone:'고객 연락처',siteAddress:'현장 주소',contractDate:'계약일',startDate:'착공일',completionDate:'준공예정일',constructionType:'공사유형',companyName:'시공자 상호',businessNo:'사업자등록번호',representative:'대표자',companyAddress:'시공자 주소',companyPhone:'시공자 연락처'} as Row)[key]||key}을 입력해 주세요.`);return s;};
 const result:Row={};for(const key of fields)if(!['amount','approveDifference','adminOfficeIncluded','consentIncluded','permitIncluded','protectionIncluded','pipeCleaningIncluded'].includes(key))result[key]=text(key,['customerName','customerPhone','siteAddress','contractDate','startDate','completionDate','constructionType','companyName','businessNo','representative','companyAddress','companyPhone'].includes(key));
 for(const key of ['contractDate','startDate','completionDate']){const s=String(result[key]),date=new Date(s);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==s)throw new ApiError(400,'실제 달력 날짜를 확인해 주세요.');}
 if(String(result.startDate)>String(result.completionDate))throw new ApiError(400,'공사기간을 확인해 주세요.');
 if(!['supply','vat_included'].includes(String(result.amountBasis))||typeof data.amount!=='number'||!Number.isSafeInteger(data.amount)||data.amount<=0||data.amount>10_000_000_000)throw new ApiError(400,'계약금액과 부가세 구분을 확인해 주세요.');
 result.amount=data.amount;for(const key of ['approveDifference','adminOfficeIncluded','consentIncluded','permitIncluded','protectionIncluded','pipeCleaningIncluded']){if(data[key]!=null&&typeof data[key]!=='boolean')throw new ApiError(400,'계약 확인 항목을 확인해 주세요.');result[key]=data[key]===true;}
 return result;
}
export async function buildConfirmedContract(access:Awaited<ReturnType<typeof confirmedContractAccess>>,form:Row,contractNo:string,stamp:string){
 const {version:v,actor,project:p}=access;
 const expected=Number(form.amountBasis==='supply'?v.supply_amount:v.total_amount),amount=Number(form.amount),difference=amount-expected;
 if(difference!==0&&(actor.role!=='admin'||form.approveDifference!==true||!form.reason))throw new ApiError(403,'확정 견적과 다른 계약금액은 관리자 명시 승인과 사유가 필요합니다.');
 const supply=form.amountBasis==='supply'?amount:difference===0?Number(v.supply_amount):Math.round(amount/1.1);
 const vat=form.amountBasis==='supply'?Math.round(supply*.1):amount-supply,total=form.amountBasis==='supply'?supply+vat:amount;
 const original=obj(v.snapshot),estimate={...original,id:String(v.estimate_id),project_name:obj(original).project_name,client_name:String(form.customerName),phone:String(form.customerPhone),address:String(form.siteAddress)} as EstimateRow;
 // Keep the quotation attachment frozen; only the contract amount/payment schedule may differ explicitly.
 const options=normalizeContractOptions({contract_info:{contract_date:form.contractDate,start_date:form.startDate,planned_completion_date:form.completionDate,construction_type:form.constructionType},customer_info:{customer_address:form.customerAddress,customer_email:form.customerEmail},contractor_info:{company_name:form.companyName,business_no:form.businessNo,representative:form.representative,address:form.companyAddress,phone:form.companyPhone},site_manager:{name:form.managerName,title:form.managerTitle,phone:form.managerPhone},admin_tasks:{admin_office_filing_included:form.adminOfficeIncluded,resident_consent_included:form.consentIncluded,permit_filing_included:form.permitIncluded},protection_options:{existing_finish_protection_included:form.protectionIncluded,existing_pipe_cleaning_included:form.pipeCleaningIncluded},notes:form.notes});
 const snapshot=await buildContractPackageSnapshot(String(v.estimate_id),options,contractNo,{...estimate,total_price:total});
 snapshot.estimate_snapshot={...snapshot.estimate_snapshot,total_price:Number(v.total_amount),customer_quote:customerQuoteProjection(obj(obj(original.estimate_data).customerQuote))};
 snapshot.contract_info=Object.assign(snapshot.contract_info,{issued_version_id:v.id,issued_quote_number:'확정 견적',issued_version:v.version_no,preliminary_version_id:v.id,project_id:p.id,supply_amount:supply,vat_amount:vat,total_amount:total,quote_supply_amount:v.supply_amount,quote_vat_amount:v.vat_amount,quote_total_amount:v.total_amount,amount_basis:form.amountBasis,amount_difference:difference,amount_reason:difference?form.reason:null,amount_approved_by:difference?actor.id:null,document_generated_at:stamp});
 snapshot.payment_schedule=paymentSchedule(total,String(form.startDate));
 // Existing spec mapping supplies standards; retain every public item even when no standard matches.
 const quoteItems=snapshot.estimate_snapshot.quote_items;
 const details=obj(original.estimate_data).internalDetails,notices:string[]=[];
 snapshot.spec_snapshot=quoteItems.flatMap(item=>{const matches=snapshot.spec_snapshot.filter(s=>s.item_name===item.item_name&&s.work_category===item.work_category);const source=Array.isArray(details)?details.map(obj).filter(d=>d.item===item.item_name&&Number(d.customerRevenue)===item.sales_amount):[];const raw=source.length===1?String(source[0].quantity??''):'';const parsed=raw.match(/^([\d,.]+)\s*(평|㎡|m²|mm|m|자|개|식|품|일|칸|통|세트|롤|장|판|라인)$/);const quantity=parsed?parsed[1]:'',unit=parsed?parsed[2]:'';if(!parsed)notices.push(`${item.item_name}: 확정 견적의 수량·단위 확인 필요`);return (matches.length?matches:[{...item,spec_code:'',standard_item_name:'',selected_grade:'',specification:'',spec_version:''}]).map(s=>Object.assign(s,{quantity,unit}));});
 snapshot.source_hash=hashJson({...snapshot,source_hash:undefined});
 const documents=buildContractDocuments(snapshot).map(d=>{
  if(d.document_type==='CONTRACT'){const content={...d.content_json,generated_sections:{...obj(d.content_json.generated_sections),confirmed_notes:String(form.notes||''),confirmed_choices:snapshot.clause_snapshot}};return {...d,content_json:content,content_hash:hashJson(content)};}
  if(d.document_type!=='QUOTE')return d;const content={...d.content_json,total_amount:Number(v.total_amount)};return {...d,content_json:content,content_hash:hashJson(content)};
 });
 return {snapshot,documents,notices};
}
