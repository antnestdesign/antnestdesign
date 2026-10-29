import { NextRequest } from "next/server";
import { ApiError, getUserContext, json } from "../../_lib/server";
import { calculatePrivilegedEstimate, privateEstimateDefaults, estimateErrorResponse } from "../_lib/estimates";
export async function GET(request: NextRequest) {
  try { const user=await getUserContext(request);if(!['admin','manager'].includes(user.profile.role))throw new ApiError(403,'접근 권한이 없습니다.');return json({defaults:privateEstimateDefaults(),costManagement:{defaultMarginRate:0.3}},{headers:{'Cache-Control':'private, no-store'}}); }
  catch(error){return estimateErrorResponse(error);}
}
export async function POST(request: NextRequest) {
  try { const user=await getUserContext(request);if(!['admin','manager'].includes(user.profile.role))throw new ApiError(403,'접근 권한이 없습니다.');return json(await calculatePrivilegedEstimate(await request.json(),user),{headers:{'Cache-Control':'private, no-store'}}); }
  catch(error){return estimateErrorResponse(error);}
}
