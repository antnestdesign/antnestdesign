import { NextRequest } from "next/server";
import {
  errorResponse,
  getUserContext,
  json,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";
import {
  assertCanWriteContractOptions,
  assertContractNoAvailable,
  assertNoContractedPackage,
  assertUuid,
  loadDocumentOptions,
  loadEstimateRow,
  normalizeContractOptions,
  projectContractOptions,
} from "../contract-packages/_lib/contracts";

function estimateIdFrom(request: NextRequest, body?: Record<string, unknown>) {
  const url = new URL(request.url);
  return assertUuid(body?.estimate_id || url.searchParams.get("estimateId"), "저장 견적 ID");
}

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const estimateId = estimateIdFrom(request);
    await loadEstimateRow(estimateId);
    const options = await loadDocumentOptions(estimateId);
    return json(projectContractOptions(options, context.profile.role, estimateId));
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
    await assertContractNoAvailable(estimateId, payload.contract_no || null);
    const existing = await loadDocumentOptions(estimateId);
    const rowPayload = {
      contract_no: payload.contract_no,
      contract_info: payload.contract_info,
      customer_info: payload.customer_info,
      contractor_info: payload.contractor_info,
      site_manager: payload.site_manager,
      admin_tasks: payload.admin_tasks,
      protection_options: payload.protection_options,
      item_options: payload.item_options,
      notes: payload.notes,
      updated_by: context.authUser.id,
    };
    const rows = existing
      ? await supabaseFetch<Array<Record<string, unknown>>>(
        `/rest/v1/estimate_document_options?estimate_id=eq.${encodeURIComponent(estimateId)}&select=*`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(rowPayload),
        },
      )
      : await supabaseFetch<Array<Record<string, unknown>>>(
        "/rest/v1/estimate_document_options?select=*",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            estimate_id: estimateId,
            ...rowPayload,
            created_by: context.authUser.id,
          }),
        },
      );
    const saved = rows[0];
    await writeAuditLog(context, {
      action: "CONTRACT_OPTIONS_SAVED",
      target_type: "estimate_document_options",
      target_id: saved?.id ? String(saved.id) : estimateId,
      target_label: payload.contract_no || estimateId,
      after_data: {
        estimate_id: estimateId,
        contract_no: payload.contract_no,
        contract_info: payload.contract_info,
        customer_info: payload.customer_info,
        site_manager: payload.site_manager,
        admin_tasks: payload.admin_tasks,
        protection_options: payload.protection_options,
      },
    });
    return json(projectContractOptions(saved, context.profile.role, estimateId));
  } catch (error) {
    return errorResponse(error);
  }
}
