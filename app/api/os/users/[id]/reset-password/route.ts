import { NextRequest } from "next/server";
import {
  ApiError,
  assertPassword,
  errorResponse,
  getProfileById,
  json,
  profileAuditData,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../../../_lib/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await requireAdmin(request);
    const { id } = await params;
    const target = await getProfileById(id);
    if (!target) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다.");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const password = assertPassword(body.initialPassword ?? body.password);

    await supabaseFetch(`/auth/v1/admin/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });

    await supabaseFetch(`/rest/v1/profiles?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ must_change_password: true }),
    });

    await writeAuditLog(context, {
      action: "INITIAL_PASSWORD_RESET",
      target_type: "user",
      target_id: target.id,
      target_label: target.email || target.name || target.id,
      before_data: { ...profileAuditData(target), must_change_password: target.must_change_password },
      after_data: { ...profileAuditData(target), must_change_password: true },
      reason: "초기 비밀번호 재설정",
    });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
