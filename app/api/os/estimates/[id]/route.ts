import { NextRequest } from "next/server";
import { ApiError, getUserContext, json, supabaseFetch } from "../../_lib/server";
import { assertBuilderActor } from '../../estimate-items/_lib/service';
import { estimateActor, estimateViews, requireEstimateEdit, saveBody, saveEstimateCommand,protectEstimateProjectStatus,preserveEstimateProjectStatus } from '../_lib/ownership';
import { calculatePrivilegedEstimate, calculateStaffEstimate, estimateErrorResponse, estimateRowPayload, readEstimate, validateStaffBody } from "../_lib/estimates";
import {updateManagementFinancials} from '../_lib/management-financials';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, route: RouteContext) {
  try {
    const context = await getUserContext(request);
    const actor = await estimateActor(context);
    const row = await readEstimate((await route.params).id);
    if(row.estimate_data?.itemBuilder)await assertBuilderActor(context);
    return json((await estimateViews([row],actor))[0]);
  } catch (error) { return estimateErrorResponse(error); }
}

export async function PATCH(request: NextRequest, route: RouteContext) {
  try {
    const context = await getUserContext(request);
    const actor = await estimateActor(context);
    const row = await readEstimate((await route.params).id);
    await requireEstimateEdit(actor,row);
    const {body,revision} = saveBody(await request.json(),true);
    if('financialAdjustment' in body){
      if(context.profile.role==='staff')throw new ApiError(403,'관리비용과 할인은 관리자 또는 매니저가 수정해야 합니다.');
      const snapshot=updateManagementFinancials(row,body);
      const saved=await saveEstimateCommand(actor,row.id,revision,estimateRowPayload(snapshot));
      return json((await estimateViews([saved],actor))[0]);
    }
    const raw=protectEstimateProjectStatus(body,row);
    if (String(row.revision) !== String(revision)) throw new ApiError(409,'다른 사용자가 견적을 수정했습니다. 다시 불러온 후 저장해 주세요.');
    const snapshot = context.profile.role!=='staff'
      ? (await calculatePrivilegedEstimate({...raw,estimateId:row.id},context)).snapshot
      : await calculateStaffEstimate(validateStaffBody(raw), context, row);
    const saved = await saveEstimateCommand(actor,row.id,revision,estimateRowPayload(preserveEstimateProjectStatus(snapshot,row)));
    return json((await estimateViews([saved],actor))[0]);
  } catch (error) { return estimateErrorResponse(error); }
}

export async function DELETE(request: NextRequest, route: RouteContext) {
  try {
    const context = await getUserContext(request), actor = await estimateActor(context);
    if (actor.role !== 'admin') throw new ApiError(403,'관리자만 견적을 삭제할 수 있습니다.');
    const row = await readEstimate((await route.params).id);
    const {revision} = saveBody(await request.json(),true);
    await supabaseFetch('/rest/v1/rpc/and_os_archive_list_item',{method:'POST',body:JSON.stringify({
      p_actor:actor.id,p_kind:'estimate',p_id:row.id,p_restore:false,p_revision:revision,
    })});
    return json({deleted:true});
  } catch(error) { return estimateErrorResponse(error); }
}
