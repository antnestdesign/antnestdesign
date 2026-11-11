import { NextRequest } from 'next/server';
import { ApiError, getUserContext, json, supabaseFetch } from '../../../_lib/server';
import { readEstimate, estimateErrorResponse, assertEstimateId } from '../../_lib/estimates';
import { estimateActor, projectEstimateHistory } from '../../_lib/ownership';

export async function GET(request: NextRequest, route: {params:Promise<{id:string}>}) {
  try {
    const actor = await estimateActor(await getUserContext(request));
    const row = await readEstimate((await route.params).id);
    const versionId=new URL(request.url).searchParams.get('versionId');
    let range='';
    if(versionId){
      const [version]=await supabaseFetch<Array<{source_revision:number;version_no:number}>>(`/rest/v1/preliminary_estimate_versions?id=eq.${assertEstimateId(versionId)}&estimate_id=eq.${row.id}&select=source_revision,version_no&limit=1`);
      if(!version)throw new ApiError(404,'확정 버전을 찾을 수 없습니다.');
      const [prior]=await supabaseFetch<Array<{source_revision:number}>>(`/rest/v1/preliminary_estimate_versions?estimate_id=eq.${row.id}&version_no=lt.${version.version_no}&select=source_revision&order=version_no.desc&limit=1`);
      range=`&after_data->revision=lte.${version.source_revision+1}&after_data->revision=gt.${prior?prior.source_revision+1:-1}`;
    }
    const events = await supabaseFetch<Record<string,unknown>[]>(`/rest/v1/os_audit_logs?target_type=eq.estimate&target_id=eq.${row.id}&or=(action.like.ESTIMATE_SAVE_*,action.like.ESTIMATE_FLOW_*)${range}&select=id,created_at,actor_name,action,before_data,after_data&order=created_at.desc,id.desc&limit=100`);
    return json(events.map(event=>projectEstimateHistory(event,actor.role==='staff')));
  } catch(error) { return estimateErrorResponse(error); }
}
