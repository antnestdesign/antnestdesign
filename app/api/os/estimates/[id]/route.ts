import { NextRequest } from "next/server";
import { ApiError, getUserContext, json, supabaseFetch } from "../../_lib/server";
import { calculateStaffEstimate, estimateErrorResponse, estimateRowPayload, projectStaffEstimate, readEstimate, validateStaffBody } from "../_lib/estimates";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, route: RouteContext) {
  try {
    const context = await getUserContext(request);
    const row = await readEstimate((await route.params).id);
    return json(context.profile.role === "staff" ? projectStaffEstimate(row) : row);
  } catch (error) { return estimateErrorResponse(error); }
}

export async function PATCH(request: NextRequest, route: RouteContext) {
  try {
    const context = await getUserContext(request);
    const row = await readEstimate((await route.params).id);
    const snapshot = await calculateStaffEstimate(validateStaffBody(await request.json()), context, row);
    const expectedVersion = row.updated_at ? `&updated_at=eq.${encodeURIComponent(String(row.updated_at))}` : "";
    const rows = await supabaseFetch<Record<string, unknown>[]>(`/rest/v1/estimates?id=eq.${row.id}${expectedVersion}&select=*`, {
      method: "PATCH", headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...estimateRowPayload(snapshot), updated_at: new Date().toISOString() }),
    });
    if (!rows.length) throw new ApiError(409, "다른 사용자가 견적을 수정했습니다. 다시 불러온 후 저장해 주세요.");
    return json(context.profile.role === "staff" ? projectStaffEstimate(rows[0]) : rows[0]);
  } catch (error) { return estimateErrorResponse(error); }
}
