import { NextRequest } from "next/server";
import {
  ApiError,
  assertNonEmptyString,
  assertPassword,
  assertValidRole,
  errorResponse,
  json,
  profileAuditData,
  requireAdmin,
  sanitizeProfile,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";

type CreatedAuthUser = {
  id: string;
  email?: string;
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const users = await supabaseFetch<Array<Parameters<typeof sanitizeProfile>[0]>>(
      "/rest/v1/profiles?select=id,name,email,role,is_active,must_change_password,created_at,updated_at&order=created_at.asc",
    );
    return json(users.map(sanitizeProfile));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const context = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const name = assertNonEmptyString(body.name, "이름");
    const email = assertNonEmptyString(body.email, "이메일").toLowerCase();
    const password = assertPassword(body.initialPassword);
    const role = assertValidRole(body.role);

    const createdUser = await supabaseFetch<CreatedAuthUser>("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      }),
    });

    if (!createdUser?.id) {
      throw new ApiError(500, "인증 사용자를 생성하지 못했습니다.");
    }
    createdUserId = createdUser.id;

    let createdProfile: ReturnType<typeof sanitizeProfile>;
    try {
      const profiles = await supabaseFetch<Array<Parameters<typeof sanitizeProfile>[0]>>(
        "/rest/v1/profiles?select=id,name,email,role,is_active,must_change_password,created_at,updated_at",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            id: createdUser.id,
            name,
            email,
            role,
            is_active: true,
            must_change_password: true,
          }),
        },
      );
      createdProfile = sanitizeProfile(profiles[0]);
    } catch (profileError) {
      await supabaseFetch<null>(`/auth/v1/admin/users/${encodeURIComponent(createdUser.id)}`, {
        method: "DELETE",
      }).catch((rollbackError) => {
        console.error("AND OS user creation rollback failed", rollbackError);
      });
      throw profileError;
    }
    await writeAuditLog(context, {
      action: "USER_CREATED",
      target_type: "user",
      target_id: createdProfile.id,
      target_label: createdProfile.email || createdProfile.name || createdProfile.id,
      after_data: profileAuditData(createdProfile),
    });
    return json(createdProfile, { status: 201 });
  } catch (error) {
    if (createdUserId) {
      console.error("AND OS user creation failed after auth user creation", { userId: createdUserId });
    }
    return errorResponse(error);
  }
}
