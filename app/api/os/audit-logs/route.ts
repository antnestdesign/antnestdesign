import { NextRequest } from "next/server";
import {
  errorResponse,
  json,
  requireAdmin,
  sanitizeAuditLog,
  supabaseFetch,
  writeAuditLog,
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

export async function POST(request: NextRequest) {
  try {
    const context = await requireAdmin(request);
    const payload = await request.json().catch(() => ({}));
    await writeAuditLog(context, {
      action: String(payload.action || "SYSTEM_OPERATION"),
      target_type: payload.target_type ? String(payload.target_type) : null,
      target_id: payload.target_id ? String(payload.target_id) : null,
      target_label: payload.target_label ? String(payload.target_label) : null,
      before_data: typeof payload.before_data === "object" ? payload.before_data : null,
      after_data: typeof payload.after_data === "object" ? payload.after_data : null,
      result: payload.result ? String(payload.result) : "SUCCESS",
      reason: payload.reason ? String(payload.reason) : null,
    });
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
