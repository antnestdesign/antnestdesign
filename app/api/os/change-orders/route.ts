import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  getUserContext,
  json,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";
import {
  assertCanManageChangeOrder,
  normalizeChangeOrderBody,
} from "../contract-packages/_lib/contracts";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    if (context.profile.role === "staff") {
      throw new ApiError(403, "변경견적 조회 권한이 없습니다.");
    }
    const url = new URL(request.url);
    const packageId = url.searchParams.get("packageId")?.trim();
    const filters = ["select=*,change_order_approvals(*)", "order=created_at.desc"];
    if (packageId) filters.push(`package_id=eq.${encodeURIComponent(packageId)}`);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/change_orders?${filters.join("&")}`,
    );
    return json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAdmin(request);
    assertCanManageChangeOrder(context);
    const body = (await request.json()) as Record<string, unknown>;
    const { packageId, title, afterSnapshot, amountDelta, scheduleImpact } = normalizeChangeOrderBody(body);
    const changeOrder = await supabaseFetch<Record<string, unknown>>(
      "/rest/v1/rpc/create_contract_change_order",
      {
        method: "POST",
        body: JSON.stringify({
          p_actor_user_id: context.authUser.id,
          p_payload: {
            package_id: packageId,
            title,
            after_snapshot: afterSnapshot,
            amount_delta: amountDelta,
            schedule_impact: scheduleImpact,
          },
        }),
      },
    );
    await writeAuditLog(context, {
      action: "CHANGE_ORDER_CREATED",
      target_type: "change_order",
      target_id: changeOrder?.id ? String(changeOrder.id) : null,
      target_label: String(changeOrder?.title || title),
      after_data: {
        package_id: packageId,
        change_version: changeOrder?.change_version,
        amount_delta: changeOrder?.amount_delta,
      },
    });
    return json(changeOrder, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
