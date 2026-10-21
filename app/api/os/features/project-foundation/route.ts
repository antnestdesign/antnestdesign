import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json } from "../../_lib/server";
import { foundationMode } from "../../projects/_lib/feature-state";

// Authenticated capability discovery only; no project data or domain RPC.
export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    if (!["admin", "manager", "staff"].includes(user.profile.role)) throw new ApiError(403, "접근 권한이 없습니다.");
    return json({ mode: foundationMode() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return errorResponse(error); }
}
