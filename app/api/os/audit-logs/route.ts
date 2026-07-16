import { NextRequest } from "next/server";
import {
  errorResponse,
  json,
  requireAdmin,
  sanitizeAuditLog,
  supabaseFetch,
} from "../_lib/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const limitRaw = Number(url.searchParams.get("limit") || 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 100;
    const action = url.searchParams.get("action")?.trim();
    const actor = url.searchParams.get("actor")?.trim();
    const filters = [
      "select=id,created_at,actor_user_id,actor_email,actor_name,actor_role,action,target_type,target_id,target_label,result,reason",
      "order=created_at.desc",
      `limit=${encodeURIComponent(limit)}`,
    ];
    if (action) filters.push(`action=eq.${encodeURIComponent(action)}`);
    if (actor) filters.push(`actor_email=ilike.${encodeURIComponent(`*${actor}*`)}`);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/os_audit_logs?${filters.join("&")}`,
    );
    return json(rows.map(sanitizeAuditLog));
  } catch (error) {
    return errorResponse(error);
  }
}
