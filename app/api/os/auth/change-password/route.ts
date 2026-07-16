import { NextRequest } from "next/server";
import {
  assertPassword,
  errorResponse,
  getUserContext,
  json,
  supabaseFetch,
} from "../../_lib/server";

export async function POST(request: NextRequest) {
  try {
    const { authUser } = await getUserContext(request);
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

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
