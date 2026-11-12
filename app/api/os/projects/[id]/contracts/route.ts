import {NextRequest} from 'next/server';
import {ApiError,getUserContext,json,supabaseFetch} from '../../../_lib/server';
import {assertUuid,DOCUMENT_TYPES,generateNextContractNo,hashJson} from '../../../contract-packages/_lib/contracts';
import {confirmedContractAccess,confirmedContractForm,buildConfirmedContract,Row} from '../../../contract-packages/_lib/confirmed-source';
import {contractHtml,contractPdfs} from '../../../contract-packages/_lib/contract-pdf';
import {contractAddress,contractCompany} from '../../../contract-packages/_lib/contractor';
import {estimateContractInclusions} from '../../../../../../public/os-app/src/contract-estimate-inclusions.js';
export const runtime='nodejs';
export const maxDuration=60;
type Params={params:Promise<{id:string}>};
function fail(error:unknown){
 if(error instanceof ApiError&&!error.message.startsWith('{'))return json({error:error.message},{status:error.status});
 const message=String((error as Error)?.message||'');
 const status=/revision_conflict|request_conflict|number_conflict|duplicate_content|40001|23505/.test(message)?409:/42501/.test(message)?403:/23514|22023/.test(message)?400:500;
 return json({error:status===409?'계약 기준이나 문서가 변경됐습니다. 새로고침 후 미리보기를 다시 확인해 주세요.':status===403?'이 계약 문서를 처리할 권한이 없습니다.':status===400?'계약 정보·금액·PDF 무결성을 확인해 주세요.':'계약 문서를 완료하지 못했습니다. 발행 상태를 확인한 뒤 다시 시도해 주세요.'},{status});
}
export async function GET(request:NextRequest,{params}:Params){
 try{
  const {id}=await params,a=await confirmedContractAccess(await getUserContext(request),id);
  const packages=await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?preliminary_project_id=eq.${id}&select=id,contract_no,package_version,status,preliminary_version_id,preliminary_series_id,preliminary_issued_at,preliminary_issuer_name,contract_info,document_options_snapshot,contract_document_versions(id,document_type,pdf_sha256,mime_type)&order=package_version.desc`);
  const s=a.version.snapshot as Row,latest=packages[0],options=(latest?.document_options_snapshot||{}) as Row,prior=(options.confirmed_form||{}) as Row;
  const savedInputs=((s.estimate_data as Row)?.inputs||{}) as Row;
  const defaults={customerName:s.client_name||'',customerPhone:s.phone||'',siteAddress:s.address||'',customerAddress:'',customerEmail:'',contractDate:'',startDate:'',completionDate:'',constructionType:'',companyName:prior.companyName||'',businessNo:prior.businessNo||'',representative:prior.representative||'',companyAddress:prior.companyAddress||'',companyPhone:prior.companyPhone||'',managerName:'',managerTitle:'',managerPhone:'',amount:Number(a.version.total_amount),amountBasis:'vat_included',reason:'',approveDifference:false,notes:''};
  Object.assign(defaults,{adminOfficeIncluded:savedInputs.sectionDemolitionEnabled===true&&savedInputs.demolitionConsentEnabled===true,consentIncluded:savedInputs.sectionDemolitionEnabled===true&&savedInputs.demolitionConsentEnabled===true,permitIncluded:savedInputs.sectionDemolitionEnabled===true&&savedInputs.demolitionPermitEnabled===true,protectionIncluded:savedInputs.sectionFinishEnabled===true&&savedInputs.interiorProtectionEnabled===true,pipeCleaningIncluded:savedInputs.sectionFinishEnabled===true&&savedInputs.existingPipeCleaningEnabled===true});
  const draft={...defaults,...(latest?.preliminary_version_id===a.version.id?{...prior,approveDifference:false,reason:''}:{})};
  Object.assign(draft,estimateContractInclusions(savedInputs,defaults));
  const address=contractAddress(draft.customerAddress,draft.siteAddress);
  Object.assign(draft,{customerAddress:address,siteAddress:address,companyName:contractCompany.company_name,businessNo:contractCompany.business_no,representative:contractCompany.representative,companyAddress:contractCompany.address,companyPhone:contractCompany.phone});
  return json({projectId:id,revision:String(a.project.flow_revision),version:{id:a.version.id,no:a.version.version_no,supply:a.version.supply_amount,vat:a.version.vat_amount,total:a.version.total_amount},canManage:a.canWrite,canLinkExisting:a.canWrite&&Boolean(a.project.flow_contract_at)&&!a.project.flow_package_id,...(a.canWrite?{defaults:draft}:{}),packages:packages.map(p=>({id:p.id,contractId:p.preliminary_series_id,no:p.contract_no,version:p.package_version,status:p.status,quoteVersionId:p.preliminary_version_id,at:p.preliminary_issued_at,actor:p.preliminary_issuer_name,total:(p.contract_info as Row).total_amount,documents:p.contract_document_versions})),types:DOCUMENT_TYPES});
 }catch(error){return fail(error);}
}
export async function POST(request:NextRequest,{params}:Params){
 try{
  const {id}=await params,a=await confirmedContractAccess(await getUserContext(request),id,true),raw=await request.json();
  if(raw?.action==='link'){
   if(Object.keys(raw).some(k=>!['action','expectedRevision','versionId','requestId','packageId','signedAcknowledged'].includes(k))||raw.versionId!==a.version.id||raw.signedAcknowledged!==true||typeof raw.expectedRevision!=='string'||!/^\d+$/.test(raw.expectedRevision)||!Number.isSafeInteger(Number(raw.expectedRevision)))throw new ApiError(400,'발행본 연결 확인 정보를 확인해 주세요.');
   return json(await supabaseFetch('/rest/v1/rpc/and_os_link_confirmed_contract',{method:'POST',body:JSON.stringify({p_actor:a.actor.id,p_project:id,p_package:assertUuid(raw.packageId,'계약 버전'),p_revision:Number(raw.expectedRevision),p_request:assertUuid(raw.requestId,'연결 요청'),p_signed:true,p_mode:'ON'})}));
  }
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['action','expectedRevision','versionId','requestId','form','type','previewHash'].includes(k))||!['preview','issue'].includes(raw.action))throw new ApiError(400,'허용된 계약 문서 요청만 전송해 주세요.');
  const versionId=assertUuid(raw.versionId,'확정 견적 버전');if(versionId!==a.version.id)throw new ApiError(409,'계약 기준 확정 버전이 변경됐습니다.');
  const form=confirmedContractForm(raw.form),requestId=raw.action==='issue'?assertUuid(raw.requestId,'발행 요청'):null;
  Object.assign(form,estimateContractInclusions(((a.version.snapshot as Row).estimate_data as Row)?.inputs,form));
  if(requestId){
   const previous=(await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?preliminary_issued_by=eq.${a.actor.id}&preliminary_request_id=eq.${requestId}&select=id,preliminary_project_id,preliminary_version_id,package_version,preliminary_series_id,document_options_snapshot&limit=1`))[0];
   if(previous){if(previous.preliminary_project_id!==id||previous.preliminary_version_id!==versionId||hashJson((previous.document_options_snapshot as Row).confirmed_form)!==hashJson(form))throw new ApiError(409,'다른 내용에 사용한 발행 요청입니다.');return json({id:previous.id,version:previous.package_version,contractId:previous.preliminary_series_id});}
  }
  if(typeof raw.expectedRevision!=='string'||raw.expectedRevision!==String(a.project.flow_revision))throw new ApiError(409,'계약 진행 정보가 변경됐습니다. 다시 불러와 주세요.');
  const series=(await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?preliminary_project_id=eq.${id}&select=contract_no,package_version&order=package_version.desc&limit=1`))[0];
  const no=series?String(series.contract_no):await generateNextContractNo(),stamp=new Date().toISOString();
  const {snapshot,documents,notices}=await buildConfirmedContract(a,form,no,stamp);
  if(a.project.flow_contract_at){const signedTotal=a.project.flow_amount_basis==='supply'?Number(a.project.flow_contract_amount)+Math.round(Number(a.project.flow_contract_amount)*.1):Number(a.project.flow_contract_amount);if(snapshot.contract_info.total_amount!==signedTotal)throw new ApiError(409,'체결된 계약금액은 문서 재발행으로 변경할 수 없습니다. 별도 변경계약 검토가 필요합니다.');}
  snapshot.document_options_snapshot=Object.assign(snapshot.document_options_snapshot,{confirmed_form:form});
  const stableInfo=Object.fromEntries(Object.entries(snapshot.contract_info).filter(([k])=>k!=='document_generated_at'));
  const fingerprint=hashJson({form,versionHash:a.version.snapshot_hash,revision:raw.expectedRevision,seriesVersion:series?.package_version??0,snapshot:{...snapshot,contract_info:stableInfo,source_hash:undefined}});
  if(raw.action==='preview'){
   const type=DOCUMENT_TYPES.find(t=>t===raw.type)||'CONTRACT';return json({fingerprint,html:contractHtml(type,snapshot,documents,stamp),total:snapshot.contract_info.total_amount,paymentSchedule:snapshot.payment_schedule,notices,type});
  }
  if(raw.previewHash!==fingerprint)throw new ApiError(409,'계약 정보가 미리보기 이후 변경됐습니다. 미리보기를 다시 확인해 주세요.');
  const html=Object.fromEntries(DOCUMENT_TYPES.map(t=>[t,contractHtml(t,snapshot,documents,stamp)])) as Record<(typeof DOCUMENT_TYPES)[number],string>;
  const pdfs=await contractPdfs(html);
  const result=await supabaseFetch('/rest/v1/rpc/and_os_issue_confirmed_contract',{method:'POST',body:JSON.stringify({p_actor:a.actor.id,p_project:id,p_version:versionId,p_revision:Number(raw.expectedRevision),p_request:requestId,p_fingerprint:fingerprint,p_snapshot:snapshot,p_documents:documents.map(d=>({...d,...pdfs.find(p=>p.document_type===d.document_type)})),p_mode:'ON'})});
  return json(result,{status:201});
 }catch(error){return fail(error);}
}
