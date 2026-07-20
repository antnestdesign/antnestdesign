import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  json,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../../../_lib/server";
import { assertCanManageChangeOrder, hashJson } from "../../../contract-packages/_lib/contracts";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await requireAdmin(request);
    assertCanManageChangeOrder(context);
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const orders = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/change_orders?id=eq.${encodeURIComponent(id)}&select=*`,
    );
    const order = orders[0];
    if (!order) throw new ApiError(404, "변경견적을 찾지 못했습니다.");
    if (order.status !== "CHANGE_PENDING") {
      throw new ApiError(409, "승인 대기 중인 변경견적만 승인할 수 있습니다.");
    }
    const approvedAt = typeof body.approved_at === "string" && body.approved_at.trim()
      ? body.approved_at.trim()
      : new Date().toISOString();
    const approvalSnapshot = {
      approved_by_name: String(body.approved_by_name || "").trim(),
      approval_method: String(body.approval_method || "서면 승인").trim(),
      approved_at: approvedAt,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      change_order_id: id,
      change_version: order.change_version,
      amount_delta: order.amount_delta,
    };
    const approvalRows = await supabaseFetch<Array<Record<string, unknown>>>(
      "/rest/v1/change_order_approvals?select=*",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          change_order_id: id,
          approval_method: approvalSnapshot.approval_method,
          approved_by_name: approvalSnapshot.approved_by_name || null,
          approved_at: approvedAt,
          approval_snapshot: approvalSnapshot,
          approval_hash: hashJson(approvalSnapshot),
          created_by: context.authUser.id,
        }),
      },
    );
    const updatedOrders = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/change_orders?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          status: "APPROVED",
          approval_snapshot: approvalSnapshot,
          approved_by: context.authUser.id,
          approved_at: approvedAt,
        }),
      },
    );
    await writeAuditLog(context, {
      action: "CHANGE_ORDER_APPROVED",
      target_type: "change_order",
      target_id: id,
      target_label: String(order.title || id),
      before_data: { status: order.status },
      after_data: { status: "APPROVED", approved_at: approvedAt },
    });
    return json({ ...updatedOrders[0], change_order_approvals: approvalRows });
  } catch (error) {
    return errorResponse(error);
  }
}
