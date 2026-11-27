import { NextRequest } from "next/server";
import { getUserContext, json, supabaseFetch } from "../_lib/server";
import { assertBuilderActor } from '../estimate-items/_lib/service';
import { estimateActor, estimateViews, saveBody, saveEstimateCommand,protectEstimateProjectStatus,preserveEstimateProjectStatus } from './_lib/ownership';
import { calculatePrivilegedEstimate, calculateStaffEstimate, estimateErrorResponse, estimateRowPayload, validateStaffBody } from "./_lib/estimates";
import { estimateListSelect } from "./_lib/list-summary";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const actor = await estimateActor(context);
    const search=new URL(request.url).searchParams;
    const contracts=search.get('view')==='contracts';
    const summary=search.get('summary')==='1';
    const filter=contracts?'':'&archive.kind=eq.estimate&archive=is.null';
    const archive=contracts?'legacy_archive:os_list_archive(kind)':'archive:os_list_archive()';
    const rows = await supabaseFetch<Record<string, unknown>[]>(`/rest/v1/estimates?select=${summary?estimateListSelect:'*'},${archive}&order=created_at.desc${filter}${contracts?'&legacy_archive.kind=eq.legacy_contract':''}`);
    if(!summary&&rows.some(row=>(row.estimate_data as {itemBuilder?:unknown})?.itemBuilder))await assertBuilderActor(context);
    const views=await estimateViews(rows.map(({legacy_archive,...row})=>row),actor,summary);
    return json(views.map((row,index)=>{
      const archive=rows[index].legacy_archive;
      return {...row,legacyContractArchived:Array.isArray(archive)&&archive.length>0};
    }).filter(row=>!contracts||row.projectId||!row.legacyContractArchived), summary ? { headers: { "Cache-Control": "private, no-store" } } : undefined);
  } catch (error) { return estimateErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const actor = await estimateActor(context);
    const {body} = saveBody(await request.json(),false);
    const raw=protectEstimateProjectStatus(body);
    const snapshot = context.profile.role!=='staff'
      ? (await calculatePrivilegedEstimate(raw,context)).snapshot
      : await calculateStaffEstimate(validateStaffBody(raw), context);
    const row = await saveEstimateCommand(actor,null,null,estimateRowPayload(preserveEstimateProjectStatus(snapshot)));
    return json((await estimateViews([row],actor))[0], { status: 201 });
  } catch (error) { return estimateErrorResponse(error); }
}
