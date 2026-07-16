import { NextRequest } from "next/server";
import {
  assertPassword,
  errorResponse,
  getUserContext,
  json,
  profileAuditData,
  supabaseFetch,
  writeAuditLog,
} from "../../_lib/server";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const { authUser, profile } = context;
    const body = (await request.json()) as Record<string, unknown>;
    const password = assertPassword(body.password ?? body.newPassword);

    await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(authUser.id)}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });

    await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(authUser.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ must_change_password: false }),
    });

    await writeAuditLog(context, {
      action: "PASSWORD_CHANGE_COMPLETED",
      target_type: "user",
      target_id: profile.id,
      target_label: profile.email || profile.name || profile.id,
      before_data: { ...profileAuditData(profile), must_change_password: profile.must_change_password },
      after_data: { ...profileAuditData(profile), must_change_password: false },
      reason: "본인 최초 비밀번호 변경 완료",
    });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
