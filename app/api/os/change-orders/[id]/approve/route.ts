import { NextRequest } from "next/server";
import {
  errorResponse,
  json,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../../../_lib/server";
import {
  assertCanManageChangeOrder,
  assertUuid,
  normalizeApprovalBody,
} from "../../../contract-packages/_lib/contracts";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await requireAdmin(request);
    assertCanManageChangeOrder(context);
    const { id } = await params;
    const changeOrderId = assertUuid(id, "변경견적 ID");
    const body = (await request.json()) as Record<string, unknown>;
    const approval = normalizeApprovalBody(body);
    const result = await supabaseFetch<Record<string, unknown>>(
      "/rest/v1/rpc/approve_contract_change_order",
      {
        method: "POST",
        body: JSON.stringify({
          p_actor_user_id: context.authUser.id,
          p_change_order_id: changeOrderId,
          p_payload: {
            customer_name: approval.customerName,
            approval_method: approval.approvalMethod,
            evidence_file_id: approval.evidenceFileId,
            evidence_url: approval.evidenceUrl,
            approved_document_hash: approval.approvedDocumentHash,
            approved_package_version: approval.approvedPackageVersion,
            customer_signed_at: approval.customerSignedAt,
            notes: approval.notes,
          },
        }),
      },
    );
    await writeAuditLog(context, {
      action: "CHANGE_ORDER_APPROVED",
      target_type: "change_order",
      target_id: changeOrderId,
      target_label: String(result.title || changeOrderId),
      before_data: { status: "CHANGE_PENDING" },
      after_data: {
        status: "APPROVED",
        customer_signed_at: approval.customerSignedAt,
        revised_contract_amount: result.revised_contract_amount,
        approval_hash: result.approval_hash,
      },
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
