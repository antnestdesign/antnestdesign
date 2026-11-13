import {NextRequest} from 'next/server';
import {ApiError,getUserContext,json,supabaseFetch} from '../../_lib/server';
import {assertEstimateId,estimateErrorResponse,readEstimate} from './estimates';
import {estimateActor,estimateViews,saveBody} from './ownership';
import {foundationMode} from '../../projects/_lib/feature-state';

type Row=Record<string,unknown>;
type Version=Row&{id:string;estimate_id:string;project_id:string;version_no:number;source_revision:number;confirmed_at:string;confirmer_name:string;snapshot:Row};
const metadata=(v:Version)=>({id:v.id,versionNo:v.version_no,sourceRevision:String(v.source_revision),confirmedAt:v.confirmed_at,
  confirmedBy:v.confirmer_name,supply:v.supply_amount,vat:v.vat_amount,total:v.total_amount});

function commandError(error:unknown):never {
  const message=error instanceof Error?error.message:'';
  const cases:Array<[string,number,string]>=[
    ['estimate_access_denied',403,'이 견적을 확정하거나 수정본을 만들 권한이 없습니다.'],
    ['estimate_locked',423,'확정된 견적은 직접 수정할 수 없습니다. 수정본을 만들어 주세요.'],
    ['estimate_revision_conflict',409,'저장본이 변경됐습니다. 견적을 다시 불러온 후 확인해 주세요.'],
    ['preliminary_project_required',409,'확정할 견적의 프로젝트를 명시적으로 선택해 주세요.'],
    ['preliminary_project_read_only',423,'현재 새 현장 연결이 중지되어 있습니다.'],
    ['preliminary_project_match_required',409,'같은 현장 후보가 있습니다. 표시된 후보를 확인해 주세요.'],
    ['preliminary_project_candidate_changed',409,'현장 후보가 변경되었거나 보관 처리됐습니다. 다시 확인해 주세요.'],
    ['preliminary_project_conflict',409,'기존 프로젝트 연결과 다릅니다. 연결 상태를 확인해 주세요.'],
    ['preliminary_validation_failed',409,'확정 전 확인사항을 해결하고 저장해 주세요.'],
    ['preliminary_revision_exists',409,'이미 작성 중인 수정본이 있습니다. 현재 견적을 다시 불러와 주세요.'],
    ['preliminary_request_conflict',409,'다른 명령에 사용한 요청입니다. 화면을 다시 열어 주세요.'],
    ['preliminary_content_changed',409,'확정본과 현재 저장 내용이 다릅니다. 관리자 확인이 필요합니다.'],
    ['23505',409,'다른 요청이 먼저 완료됐습니다. 견적을 다시 불러와 주세요.'],
  ];
  for(const [code,status,text]of cases)if(message.includes(code))throw new ApiError(status,text);
  throw new ApiError(500,'견적 확정 요청을 완료하지 못했습니다. 다시 불러와 상태를 확인해 주세요.');
}

export async function confirmationGet(request:NextRequest,id:string,versionId?:string) {
  try {
    const actor=await estimateActor(await getUserContext(request));
    const row=await readEstimate(id);
    if(versionId) {
      assertEstimateId(versionId);
      const versions=await supabaseFetch<Version[]>(`/rest/v1/preliminary_estimate_versions?id=eq.${versionId}&estimate_id=eq.${row.id}&select=*&limit=1`);
      const v=versions[0];if(!v)throw new ApiError(404,'확정 버전을 찾을 수 없습니다.');
      const view=(await estimateViews([v.snapshot],actor))[0];
      return json({...view,canEdit:false,canConfirm:false,canCreateRevision:false,
        confirmation:{state:'confirmed',draftVersion:v.version_no,projectId:v.project_id,latestId:row.latest_confirmation_id,viewingVersion:metadata(v)}});
    }
    const versions=await supabaseFetch<Version[]>(`/rest/v1/preliminary_estimate_versions?estimate_id=eq.${row.id}&select=id,estimate_id,project_id,version_no,source_revision,confirmed_at,confirmer_name,supply_amount,vat_amount,total_amount&order=version_no.desc`);
    const projectId=await supabaseFetch<string|null>('/rest/v1/rpc/and_os_preliminary_project',{method:'POST',body:JSON.stringify({p_id:row.id})});
    const issues=await supabaseFetch<string[]>('/rest/v1/rpc/and_os_preliminary_issues',{method:'POST',body:JSON.stringify({p_row:row})});
    // Only a privileged confirmer needs the private business fingerprint.
    let fingerprint:string|undefined;
    if(actor.role!=='staff') {
      fingerprint=await supabaseFetch<string>('/rest/v1/rpc/and_os_preliminary_fingerprint',{method:'POST',body:JSON.stringify({p_id:row.id})});
    }
    const projectCandidates=projectId||actor.role==='staff'||row.confirmation_state==='confirmed'?[]:
      await supabaseFetch<Row[]>('/rest/v1/rpc/and_os_estimate_project_matches',{method:'POST',body:JSON.stringify({p_actor:actor.id,p_id:row.id})});
    return json({versions:versions.map(metadata),projectId,projectCandidates,issues,revision:String(row.revision),fingerprint});
  }catch(error){return estimateErrorResponse(error);}
}

export async function confirmationPost(request:NextRequest,id:string,action:'confirm'|'revise') {
  try {
    const actor=await estimateActor(await getUserContext(request));
    assertEstimateId(id);
    const raw=await request.json();
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!['expectedRevision','requestId','fingerprint','projectId'].includes(k)))throw new ApiError(400,'허용된 확정 요청 정보만 전송해 주세요.');
    const {revision}=saveBody(raw,true),requestId=assertEstimateId(raw.requestId);
    const projectId=raw.projectId==null?null:assertEstimateId(raw.projectId);
    if(action==='confirm'&&(typeof raw.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(raw.fingerprint)))throw new ApiError(400,'저장 견적을 확인한 뒤 다시 확정해 주세요.');
    let result:Row;
    try{
      const common={p_actor:actor.id,p_id:id,p_revision:revision,p_request_id:requestId,p_fingerprint:raw.fingerprint??null,p_project:projectId};
      const rpc=action==='confirm'?'and_os_confirm_estimate_with_project':'and_os_preliminary_command';
      result=await supabaseFetch<Row>('/rest/v1/rpc/'+rpc,{method:'POST',body:JSON.stringify(action==='confirm'?{...common,p_feature_mode:foundationMode()}:{...common,p_action:action})});
    }catch(error){commandError(error);}
    if(result.blocked)throw new ApiError(403,'이 견적을 확정하거나 수정본을 만들 권한이 없습니다.');
    return json(result);
  }catch(error){return estimateErrorResponse(error);}
}
