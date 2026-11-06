import { NextRequest } from "next/server";
import { getUserContext, json, supabaseFetch } from "../_lib/server";
import { assertBuilderActor } from '../estimate-items/_lib/service';
import { calculatePrivilegedEstimate, calculateStaffEstimate, estimateErrorResponse, estimateRowPayload, projectStaffEstimate, validateStaffBody } from "./_lib/estimates";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const rows = await supabaseFetch<Record<string, unknown>[]>("/rest/v1/estimates?select=*&order=created_at.desc");
    if(rows.some(row=>(row.estimate_data as {itemBuilder?:unknown})?.itemBuilder))await assertBuilderActor(context);
    return json(context.profile.role === "staff" ? rows.map(projectStaffEstimate) : rows);
  } catch (error) { return estimateErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const raw = await request.json();
    const snapshot = context.profile.role!=='staff'&&raw.itemSelections!==undefined
      ? (await calculatePrivilegedEstimate(raw,context)).snapshot
      : await calculateStaffEstimate(validateStaffBody(raw), context);
    const rows = await supabaseFetch<Record<string, unknown>[]>("/rest/v1/estimates?select=*", {
      method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(estimateRowPayload(snapshot)),
    });
    return json(context.profile.role === "staff" ? projectStaffEstimate(rows[0]) : rows[0], { status: 201 });
  } catch (error) { return estimateErrorResponse(error); }
}
