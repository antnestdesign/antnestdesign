import { NextRequest } from "next/server";
import {
  errorResponse,
  json,
  readBearerToken,
  requireAdmin,
  supabaseUserFetch,
  writeAuditLog,
} from "../_lib/server";
import { costItemAuditData, costItemRpcPayload } from "./_lib";

export async function POST(request: NextRequest) {
  try {
    const accessToken = readBearerToken(request);
    const context = await requireAdmin(request);
    const body = (await request.json()) as Record<string, unknown>;
    const payload = costItemRpcPayload(body);
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
      action: "COST_ITEM_PENDING_CREATED",
      target_type: "cost_items",
      target_id: item?.id ? String(item.id) : null,
      target_label: item?.item_code ? String(item.item_code) : null,
      after_data: costItemAuditData(item),
      reason: "신규 원가 품목 임시저장",
    });
    return json(item, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
