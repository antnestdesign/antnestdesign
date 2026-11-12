import {NextRequest} from 'next/server';
import {ApiError,errorResponse,getUserContext,json,supabaseFetch} from '../../_lib/server';
import {estimateActor} from '../../estimates/_lib/ownership';
import {assertEstimateId} from '../../estimates/_lib/estimates';
import {requireFoundationAction} from './feature-state';

type Row=Record<string,unknown>;
export function workflowStage(value:unknown) {
  const status=String(value||'').trim();
  if(['','견적','상담','상담중','검토','견적전','NEW','ESTIMATE'].includes(status))return 'estimate';
  if(status==='계약 준비')return 'preparation';
  if(['계약','계약완료','CONTRACTED','계약 체결'].includes(status))return 'contracted';
  if(['착공','공사중','진행중','IN_PROGRESS'].includes(status))return 'started';
  if(['준공','완료','COMPLETED'].includes(status))return 'completed';
  return 'unknown';
}
const versionColumns='id,estimate_id,project_id,version_no,supply_amount,vat_amount,total_amount,confirmed_at,confirmer_name';
function version(v:Row|undefined){return v?{id:v.id,estimateId:v.estimate_id,versionNo:v.version_no,supply:v.supply_amount,vat:v.vat_amount,total:v.total_amount,at:v.confirmed_at,actor:v.confirmer_name}:null;}
export async function publicProjectWorkflows(rows:Row[]) {
  async function loadById(field:string,table:string,columns:string) {
    const ids=[...new Set(rows.map(row=>row[field]).filter(Boolean))],result=new Map();
    for(let i=0;i<ids.length;i+=50) {
      const batch=await supabaseFetch<Row[]>(`/rest/v1/${table}?id=in.(${ids.slice(i,i+50).join(',')})&select=${columns}`);
      for(const row of batch)result.set(row.id,row);
    }
    return result;
  }
  const [versions,creators]=await Promise.all([
    loadById('flow_version_id','preliminary_estimate_versions',versionColumns),
    loadById('flow_estimate_id','estimates','id,creator_name'),
  ]);
  return rows.map(p=>({id:p.id,project_name:p.project_name,address:p.address,area_pyeong:p.area_pyeong,status:p.status,
    customer_id:p.customer_id,managed:p.os_managed_at!=null,customer:p.customer,
    workflow:p.flow_version_id?{estimateId:p.flow_estimate_id,versionId:p.flow_version_id,creatorName:creators.get(p.flow_estimate_id)?.creator_name,basis:version(versions.get(p.flow_version_id)),
      revision:String(p.flow_revision),contractDate:p.flow_contract_date,contractAmount:p.flow_contract_amount,amountBasis:p.flow_amount_basis,
      startDate:p.flow_start_date,completionDate:p.flow_completion_date}:null}));
}
function failure(error:unknown){
  if(error instanceof ApiError&&error.message.startsWith('{')){
    try{
      const detail=JSON.parse(error.message),message=String(detail.message||'');
      const errors:Array<[string,number,string]>=[
        ['access_denied',403,'이 프로젝트의 진행 상태를 변경할 권한이 없습니다.'],
        ['confirmed_version_required',409,'프로젝트에 연결된 확정 견적 버전이 필요합니다. 기존 미연결 자료는 별도 검토가 필요합니다.'],
        ['scope_conflict',409,'선택한 견적·계약 문서와 프로젝트 연결이 다릅니다.'],
        ['revision_conflict',409,'다른 사용자가 진행 정보를 변경했습니다. 새로고침 후 다시 확인해 주세요.'],
        ['request_conflict',409,'다른 내용에 사용한 요청입니다. 최신 상태를 다시 확인해 주세요.'],
        ['already_transferred',409,'이미 계약 단계이거나 전환된 프로젝트입니다. 기존 진행 정보를 확인해 주세요.'],
        ['basis_locked',409,'계약 체결 후에는 기준 견적 버전을 변경할 수 없습니다.'],
        ['amount_admin_approval_required',403,'확정 견적과 다른 계약금액은 관리자의 명시적 차이 승인과 사유가 필요합니다.'],
        ['existing_contract_required',409,'이미 체결된 계약이 있습니다. 기존 계약 문서를 명시적으로 연결해 주세요.'],
        ['existing_signed_contract',409,'이미 체결된 기존 계약이 있는 프로젝트입니다. 계약 준비로 되돌리지 않으며 기존 계약 자료를 확인해 주세요.'],
        ['existing_contract_review',409,'복수 원계약이 있는 프로젝트입니다. 공사범위별 계약을 별도로 검토해야 합니다.'],
        ['invalid_transition',409,'현재 단계에서는 이 처리를 할 수 없습니다. 계약 준비 → 계약 체결 → 착공 → 준공 순서를 확인해 주세요.'],
        ['correction_requires_evidence',409,'상태 정정은 이미 기록된 체결·착공·준공 사실에 맞추는 경우에만 가능합니다. 취소나 단계 되돌리기는 지원하지 않습니다.'],
        ['reason_required',400,'변경 사유를 입력해 주세요.'],
        ['invalid_contract',400,'실제 계약일·계약금액·부가세 구분을 확인해 주세요.'],
        ['invalid_date',400,'실제 날짜의 순서와 미래 날짜 여부를 확인해 주세요.'],
        ['not_found',404,'프로젝트를 찾을 수 없습니다.'],
      ];
      for(const [code,status,text]of errors)if(message.includes(code))return json({error:text},{status});
      if(['22023','22007','22008','22P02','23514'].includes(detail.code))return json({error:'입력한 날짜·금액·변경 내용을 확인해 주세요.'},{status:400});
      if(['40001','23505','55P03'].includes(detail.code))return json({error:'다른 요청과 충돌했습니다. 현재 상태를 다시 확인해 주세요.'},{status:409});
      if(detail.code==='42501')return json({error:'프로젝트 진행 정보에 접근할 권한이 없습니다.'},{status:403});
      if(detail.code==='P5F01'||detail.code==='P5F02')return json({error:'프로젝트 진행 변경 기능이 비활성화되었거나 읽기 전용입니다.'},{status:detail.code==='P5F02'?423:503});
    }catch{/* Never expose raw PostgREST row details. */}
    return json({error:'프로젝트 진행 요청을 완료하지 못했습니다.'},{status:500});
  }
  return errorResponse(error);
}

const actionKeys:Record<string,string[]>={transfer:['estimateId','versionId','plannedContractDate'],basis:['versionId','reason'],contract:['date','amount','amountBasis','reason','approveDifference','packageId','signedAcknowledged'],start:['date','plannedCompletionDate'],complete:['date','note'],correct:['status','reason']};
async function hasExistingContract(projectId:string){
  const links=await supabaseFetch<Row[]>(`/rest/v1/project_preliminary_estimates?project_id=eq.${projectId}&select=estimate_id`);
  const direct=await supabaseFetch<Row[]>(`/rest/v1/estimates?or=(project_id.eq.${projectId},confirmation_project_id.eq.${projectId})&select=id`);
  const ids=[...new Set([...links.map(r=>r.estimate_id),...direct.map(r=>r.id)])];
  for(let i=0;i<ids.length;i+=50){
    const rows=await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?estimate_id=in.(${ids.slice(i,i+50).join(',')})&status=eq.CONTRACTED&parent_package_id=is.null&select=id&limit=1`);
    if(rows.length)return true;
  }
  return false;
}
export function workflowBody(raw:unknown){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||JSON.stringify(raw).length>10000)throw new ApiError(400,'진행 변경 요청을 확인해 주세요.');
  const b=raw as Row,action=String(b.action||'');
  if(Object.keys(b).some(k=>!['action','expectedRevision','requestId','data'].includes(k))||!Object.hasOwn(actionKeys,action))throw new ApiError(400,'허용되지 않은 진행 변경 요청입니다.');
  if(typeof b.expectedRevision!=='string'||!/^\d+$/.test(b.expectedRevision)||!Number.isSafeInteger(Number(b.expectedRevision)))throw new ApiError(409,'현재 진행 개정정보를 다시 불러와 주세요.');
  const data=b.data;
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!actionKeys[action].includes(k)))throw new ApiError(400,'허용되지 않은 진행 정보입니다.');
  const values=data as Row;
  for(const key of ['estimateId','versionId','packageId'])if(values[key]!=null&&values[key]!=='')assertEstimateId(values[key]);
  for(const key of ['date','plannedContractDate','plannedCompletionDate'])if(values[key]!=null&&values[key]!==''&&(typeof values[key]!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(String(values[key]))))throw new ApiError(400,'날짜를 연-월-일 형식으로 입력해 주세요.');
  for(const key of ['reason','note','status'])if(values[key]!=null&&(typeof values[key]!=='string'||String(values[key]).length>1000))throw new ApiError(400,'입력 내용을 확인해 주세요.');
  if(values.amount!==undefined&&(typeof values.amount!=='number'||!Number.isSafeInteger(values.amount)||values.amount<=0))throw new ApiError(400,'계약금액을 원 단위 양수로 입력해 주세요.');
  if(values.approveDifference!==undefined&&typeof values.approveDifference!=='boolean')throw new ApiError(400,'금액 차이 승인 여부를 확인해 주세요.');
  if(values.signedAcknowledged!==undefined&&typeof values.signedAcknowledged!=='boolean')throw new ApiError(400,'서명·체결 확인 여부를 확인해 주세요.');
  return {action,revision:Number(b.expectedRevision),requestId:assertEstimateId(b.requestId),data:values};
}

export async function projectWorkflow(request:NextRequest,projectId:string){
  try{
    const context=await getUserContext(request),actor=await estimateActor(context);
    assertEstimateId(projectId);
    const mode=requireFoundationAction(request.method==='GET'?'project':'project-workflow');
    if(request.method!=='GET'){
      if(actor.role==='staff')throw new ApiError(403,'직원은 프로젝트 진행 상태를 변경할 수 없습니다.');
      const body=workflowBody(await request.json());
      const result=await supabaseFetch('/rest/v1/rpc/and_os_project_flow_command',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_project:projectId,p_action:body.action,p_revision:body.revision,p_request_id:body.requestId,p_data:body.data,p_mode:mode})});
      return json(result);
    }
    const projects=await supabaseFetch<Row[]>(`/rest/v1/projects?id=eq.${projectId}&select=*,customer:customers(name)&limit=1`),p=projects[0];
    if(!p)throw new ApiError(404,'프로젝트를 찾을 수 없습니다.');
    if(actor.role==='staff'&&p.os_managed_at==null)throw new ApiError(403,'도입되지 않은 프로젝트는 조회할 수 없습니다.');
    const estimateId=p.flow_estimate_id||new URL(request.url).searchParams.get('estimateId');
    let e:Row|undefined,versions:Row[]=[],canEdit=false,documents:Row[]=[];
    if(estimateId){
      assertEstimateId(estimateId);
      const linked=await supabaseFetch<string|null>('/rest/v1/rpc/and_os_preliminary_project',{method:'POST',body:JSON.stringify({p_id:estimateId})});
      if(linked!==projectId)throw new ApiError(409,'견적의 프로젝트 연결이 다릅니다.');
      e=(await supabaseFetch<Row[]>(`/rest/v1/estimates?id=eq.${estimateId}&select=id,creator_name&limit=1`))[0];
      canEdit=actor.role!=='staff'&&await supabaseFetch<boolean>('/rest/v1/rpc/and_os_estimate_can_edit',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_estimate:estimateId})});
      versions=await supabaseFetch<Row[]>(`/rest/v1/preliminary_estimate_versions?estimate_id=eq.${estimateId}&project_id=eq.${projectId}&select=${versionColumns}&order=version_no.desc`);
      documents=await supabaseFetch<Row[]>(`/rest/v1/contract_package_snapshots?estimate_id=eq.${estimateId}&or=(status.eq.CONTRACTED,preliminary_project_id.eq.${projectId})&parent_package_id=is.null&select=id,contract_no,package_version,preliminary_version_id,status,contract_info`);
      documents=documents.filter(d=>!d.preliminary_version_id||d.preliminary_version_id===p.flow_version_id).map(d=>({id:d.id,contract_no:d.contract_no,version:d.package_version,issued:Boolean(d.preliminary_version_id),total:(d.contract_info as Row)?.total_amount,supply:(d.contract_info as Row)?.supply_amount,status:d.status}));
    }
    const history=await supabaseFetch<Row[]>(`/rest/v1/os_audit_logs?target_type=eq.project&target_id=eq.${projectId}&action=like.PROJECT_FLOW_*&select=id,created_at,actor_name,action,reason,before_data,after_data&order=created_at.desc&limit=100`);
    const stateKeys=['status','flow_version_id','flow_contract_date','flow_contract_amount','flow_amount_basis','flow_start_date','flow_planned_completion_date','flow_completion_date'];
    const state=(value:unknown)=>{const row=(value||{}) as Row;return Object.fromEntries(stateKeys.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));};
    const correctionTarget=p.flow_completion_at?'준공':p.flow_start_at?'착공':p.flow_contract_at?'계약 체결':'계약 준비';
    const stage=workflowStage(p.status);
    const existingContract=!p.flow_version_id&&await hasExistingContract(projectId);
    return json({project:{id:p.id,name:p.project_name,customer:(p.customer as Row)?.name||'',creator:e?.creator_name||'작성자 미확인',assignee:null},
      status:p.status||'견적',stage,revision:String(p.flow_revision),legacy:!p.flow_version_id&&(stage!=='estimate'||existingContract),estimateId:e?.id||null,
      basis:version(versions.find(v=>v.id===p.flow_version_id)),versions:versions.map(version),documents,
      canManage:canEdit&&Boolean(p.flow_version_id)&&mode==='ON',canTransfer:canEdit&&!p.flow_version_id&&!existingContract&&stage==='estimate'&&versions.length>0&&mode==='ON',
      canCorrect:actor.role==='admin'&&Boolean(p.flow_version_id)&&p.status!==correctionTarget&&mode==='ON',correctionTarget,
      plannedContractDate:p.flow_planned_contract_date,contractDate:p.flow_contract_date,contractAmount:p.flow_contract_amount,amountBasis:p.flow_amount_basis,
      amountReason:actor.role==='staff'?null:p.flow_amount_reason,packageId:p.flow_package_id,startDate:p.flow_start_date,plannedCompletionDate:p.flow_planned_completion_date,completionDate:p.flow_completion_date,
      note:actor.role==='staff'?null:p.flow_completion_note,
      milestones:[['계약관리 전환',p.flow_transferred_at,p.flow_transferred_name,p.flow_transferred_at],['계약 체결',p.flow_contract_date,p.flow_contract_name,p.flow_contract_at],['착공',p.flow_start_date,p.flow_start_name,p.flow_start_at],['준공',p.flow_completion_date,p.flow_completion_name,p.flow_completion_at]].filter(m=>m[1]).map(([label,date,name,at])=>({label,date,actor:name,at})),
      history:history.map(h=>({id:h.id,at:h.created_at,actor:h.actor_name,action:h.action,reason:actor.role==='staff'?null:h.reason,before:state(h.before_data),after:state(h.after_data)})),mode});
  }catch(error){return failure(error);}
}
