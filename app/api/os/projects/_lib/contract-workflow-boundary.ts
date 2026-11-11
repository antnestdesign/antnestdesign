import {ApiError,supabaseFetch} from '../../_lib/server';
export async function assertLegacyContractWorkflow(estimateId:string){
  const project=await supabaseFetch<string|null>('/rest/v1/rpc/and_os_preliminary_project',{method:'POST',body:JSON.stringify({p_id:estimateId})});
  if(!project)return;
  const rows=await supabaseFetch<Array<{flow_version_id:string|null}>>(`/rest/v1/projects?id=eq.${project}&select=flow_version_id&limit=1`);
  if(rows[0]?.flow_version_id)throw new ApiError(409,'계약 기준 확정 견적이 고정된 프로젝트입니다. 계약관리에서 체결 사실을 기록하고 기존 문서를 조회해 주세요. 새 확정 견적용 계약서 생성은 아직 제공하지 않습니다.');
}
