import { NextRequest } from "next/server";
import { getUserContext, json } from "../../_lib/server";
import { calculateStaffEstimate, estimateErrorResponse, estimateRowPayload, projectStaffEstimate, readEstimate, validateStaffBody } from "../_lib/estimates";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const body = await request.json();
    const { estimateId, ...inputBody } = body;
    const existing = estimateId ? await readEstimate(estimateId) : null;
    const snapshot = await calculateStaffEstimate(validateStaffBody(inputBody), context, existing);
    return json(projectStaffEstimate({ ...estimateRowPayload(snapshot), id: existing?.id || "", created_at: snapshot.savedAt }));
  } catch (error) { return estimateErrorResponse(error); }
}
