import {NextRequest} from 'next/server';
import {ApiError,errorResponse,getUserContext,json,supabaseFetch} from '../../_lib/server';
import {estimateActor} from '../../estimates/_lib/ownership';

export async function GET(request:NextRequest){
  try{
    const actor=await estimateActor(await getUserContext(request));
    if(actor.role!=='admin')throw new ApiError(403,'관리자만 삭제 항목을 조회할 수 있습니다.');
    const rows=await supabaseFetch<Array<Record<string,unknown>>>('/rest/v1/os_list_archive?select=kind,target_id,deleted_by,deleted_at,estimate:estimates(project_name),project:projects(project_name)&order=deleted_at.desc,kind.asc,target_id.asc');
    return json(rows);
  }catch(error){return errorResponse(error);}
}

export async function POST(request:NextRequest){
  try{
    const actor=await estimateActor(await getUserContext(request));
    if(actor.role!=='admin')throw new ApiError(403,'관리자만 삭제하거나 복구할 수 있습니다.');
    const data=await request.json().catch(()=>null);
    if(!data||!['estimate','contract','legacy_contract'].includes(data.kind)||!['archive','restore'].includes(data.action)
      ||(data.kind==='estimate'&&data.action!=='restore')
      ||typeof data.id!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(data.id))
      throw new ApiError(400,'삭제 또는 복구 대상을 확인해 주세요.');
    await supabaseFetch('/rest/v1/rpc/and_os_archive_list_item',{method:'POST',body:JSON.stringify({
      p_actor:actor.id,p_kind:data.kind,p_id:data.id,p_restore:data.action==='restore',
    })});
    return json({ok:true});
  }catch(error){return errorResponse(error);}
}
