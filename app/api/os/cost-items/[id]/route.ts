import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  json,
  readBearerToken,
  requireAdmin,
  supabaseFetch,
  supabaseUserFetch,
  writeAuditLog,
} from "../../_lib/server";
import { costItemAuditData, costItemRpcPayload } from "../_lib";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const accessToken = readBearerToken(request);
    const context = await requireAdmin(request);
    const { id } = await params;
    const beforeRows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/cost_items?id=eq.${encodeURIComponent(id)}&select=*`,
    );
    const before = beforeRows[0];
    if (!before) throw new ApiError(404, "원가 품목을 찾지 못했습니다.");
    if (before.is_pending_new !== true) {
      throw new ApiError(400, "운영 중인 품목 정보는 기존 임시저장 경로로 변경해 주세요.");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      p_cost_item_id: id,
      ...costItemRpcPayload({
        ...before,
        ...body,
        item_code: before.item_code,
        cost_price: body.cost_price ?? before.cost_price,
        default_margin_rate: body.default_margin_rate ?? before.default_margin_rate,
        calculation_basis: body.calculation_basis ?? before.calculation_basis ?? "manual_input",
        calculation_multiplier: body.calculation_multiplier ?? before.calculation_multiplier ?? 1,
        min_quantity: body.min_quantity ?? before.min_quantity ?? null,
        rounding_method: body.rounding_method ?? before.rounding_method ?? "none",
        is_active: body.is_active ?? before.draft_is_active ?? true,
      }),
    };

    delete (payload as Record<string, unknown>).p_source_cost_item_id;

    const rows = await supabaseUserFetch<Array<Record<string, unknown>>>(
      "/rest/v1/rpc/update_cost_item_pending",
      accessToken,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
    );
    const item = Array.isArray(rows) ? rows[0] : rows;
    await writeAuditLog(context, {
      action: "COST_ITEM_PENDING_UPDATED",
      target_type: "cost_items",
      target_id: item?.id ? String(item.id) : id,
      target_label: item?.item_code ? String(item.item_code) : String(before.item_code || id),
      before_data: costItemAuditData(before),
      after_data: costItemAuditData(item),
      reason: "신규 원가 품목 임시저장 수정",
    });
    return json(item);
  } catch (error) {
    return errorResponse(error);
  }
}
