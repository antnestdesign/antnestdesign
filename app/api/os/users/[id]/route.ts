import { NextRequest } from "next/server";
import {
  ApiError,
  assertNonEmptyString,
  assertValidRole,
  countActiveAdmins,
  errorResponse,
  getProfileById,
  json,
  requireAdmin,
  sanitizeProfile,
  supabaseFetch,
} from "../../_lib/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { authUser } = await requireAdmin(request);
    const { id } = await params;
    const target = await getProfileById(id);
    if (!target) {
      throw new ApiError(404, "사용자를 찾을 수 없습니다.");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if ("name" in body) {
      updates.name = assertNonEmptyString(body.name, "이름");
    }
    if ("role" in body) {
      updates.role = assertValidRole(body.role);
    }
    if ("is_active" in body) {
      if (typeof body.is_active !== "boolean") {
        throw new ApiError(400, "활성 상태 값이 올바르지 않습니다.");
      }
      updates.is_active = body.is_active;
    }

    if (!Object.keys(updates).length) {
      throw new ApiError(400, "수정할 값이 없습니다.");
    }

    if (target.id === authUser.id && updates.is_active === false) {
      throw new ApiError(400, "자기 계정은 비활성화할 수 없습니다.");
    }

    const willRemoveActiveAdmin =
      target.role === "admin" &&
      target.is_active &&
      (updates.is_active === false || (updates.role != null && updates.role !== "admin"));

    if (willRemoveActiveAdmin && (await countActiveAdmins()) <= 1) {
      throw new ApiError(400, "마지막 활성 admin은 변경할 수 없습니다.");
    }

    const rows = await supabaseFetch<Array<Parameters<typeof sanitizeProfile>[0]>>(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=id,name,email,role,is_active,must_change_password,created_at,updated_at`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(updates),
      },
    );

    return json(sanitizeProfile(rows[0]));
  } catch (error) {
    return errorResponse(error);
  }
}
