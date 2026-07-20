import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  getUserContext,
  json,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";
import {
  assertCanWriteContractOptions,
  assertNoContractedPackage,
  loadDocumentOptions,
  loadEstimateRow,
  normalizeContractOptions,
} from "../contract-packages/_lib/contracts";

function estimateIdFrom(request: NextRequest, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  const id = String(body?.estimate_id || url.searchParams.get("estimateId") || "").trim();
  if (!id) throw new ApiError(400, "저장 견적 ID가 필요합니다.");
  return id;
}

export async function GET(request: NextRequest) {
  try {
    await getUserContext(request);
    const estimateId = estimateIdFrom(request);
    await loadEstimateRow(estimateId);
    const options = await loadDocumentOptions(estimateId);
    return json(options || { estimate_id: estimateId });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    assertCanWriteContractOptions(context);
    const body = (await request.json()) as Record<string, unknown>;
    const estimateId = estimateIdFrom(request, body);
    await loadEstimateRow(estimateId);
    await assertNoContractedPackage(estimateId);
    const payload = normalizeContractOptions(body);
    const existing = await loadDocumentOptions(estimateId);
    const rows = existing
      ? await supabaseFetch<Array<Record<string, unknown>>>(
        `/rest/v1/estimate_document_options?estimate_id=eq.${encodeURIComponent(estimateId)}&select=*`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            ...payload,
            updated_by: context.authUser.id,
          }),
        },
      )
      : await supabaseFetch<Array<Record<string, unknown>>>(
        "/rest/v1/estimate_document_options?select=*",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            estimate_id: estimateId,
            ...payload,
            created_by: context.authUser.id,
            updated_by: context.authUser.id,
          }),
        },
      );
    const saved = rows[0];
    await writeAuditLog(context, {
      action: "CONTRACT_OPTIONS_SAVED",
      target_type: "estimate_document_options",
      target_id: saved?.id ? String(saved.id) : estimateId,
      target_label: estimateId,
      after_data: {
        estimate_id: estimateId,
        contract_info: payload.contract_info,
        customer_info: payload.customer_info,
        site_manager: payload.site_manager,
        admin_tasks: payload.admin_tasks,
        protection_options: payload.protection_options,
      },
    });
    return json(saved);
  } catch (error) {
    return errorResponse(error);
  }
}
