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

export async function POST(request: NextRequest) {
  try {
    const accessToken = readBearerToken(request);
    const context = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const sourceId = String(body.source_cost_item_id || "").trim();
    if (!sourceId) throw new ApiError(400, "복제할 원가 품목을 찾지 못했습니다.");

    const sourceRows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/cost_items?id=eq.${encodeURIComponent(sourceId)}&select=*`,
    );
    const source = sourceRows[0];
    if (!source) throw new ApiError(404, "복제할 원가 품목을 찾지 못했습니다.");

    const payload = costItemRpcPayload({
      ...source,
      ...body,
      item_code: body.item_code,
      item_name: body.item_name,
      cost_price: body.cost_price ?? source.cost_price,
      default_margin_rate: body.default_margin_rate ?? source.default_margin_rate,
      calculation_basis: body.calculation_basis ?? source.calculation_basis ?? "manual_input",
      calculation_multiplier: body.calculation_multiplier ?? source.calculation_multiplier ?? 1,
      min_quantity: body.min_quantity ?? source.min_quantity ?? null,
      rounding_method: body.rounding_method ?? source.rounding_method ?? "none",
      is_active: body.is_active ?? true,
    }, sourceId);

    const rows = await supabaseUserFetch<Array<Record<string, unknown>>>(
      "/rest/v1/rpc/create_cost_item_pending",
      accessToken,
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
    );
    const item = Array.isArray(rows) ? rows[0] : rows;
    await writeAuditLog(context, {
      action: "COST_ITEM_CLONED",
      target_type: "cost_items",
      target_id: item?.id ? String(item.id) : null,
      target_label: item?.item_code ? String(item.item_code) : null,
      before_data: costItemAuditData(source),
      after_data: costItemAuditData(item),
      reason: "기존 원가 품목 복제",
    });
    return json(item, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
