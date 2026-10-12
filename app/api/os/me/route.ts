import { NextRequest } from "next/server";
import { errorResponse, getPasswordChangeContext, json, sanitizeProfile } from "../_lib/server";

export async function GET(request: NextRequest) {
  try {
    const { profile } = await getPasswordChangeContext(request);
    return json(sanitizeProfile(profile));
  } catch (error) {
    return errorResponse(error);
  }
}
