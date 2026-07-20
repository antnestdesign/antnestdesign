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
import { assertCanManageChangeOrder, hashJson } from "../contract-packages/_lib/contracts";

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

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
    const packageId = String(body.package_id || "").trim();
    if (!packageId) throw new ApiError(400, "계약 패키지 ID가 필요합니다.");
    const packages = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?id=eq.${encodeURIComponent(packageId)}&select=*`,
    );
    const contractPackage = packages[0];
    if (!contractPackage) throw new ApiError(404, "계약 패키지를 찾지 못했습니다.");
    if (contractPackage.status !== "CONTRACTED") {
      throw new ApiError(409, "계약확정된 패키지만 변경견적을 만들 수 있습니다.");
    }
    const existing = await supabaseFetch<Array<{ change_version: number }>>(
      `/rest/v1/change_orders?package_id=eq.${encodeURIComponent(packageId)}&select=change_version&order=change_version.desc&limit=1`,
    );
    const changeVersion = Number(existing[0]?.change_version || 0) + 1;
    const afterSnapshot = objectValue(body.after_snapshot);
    const amountDelta = Number(body.amount_delta || 0);
    const payload = {
      package_id: packageId,
      estimate_id: contractPackage.estimate_id,
      change_version: changeVersion,
      status: "CHANGE_PENDING",
      title: String(body.title || `변경견적 ${changeVersion}`).trim(),
      before_snapshot: contractPackage,
      after_snapshot: afterSnapshot,
      amount_delta: Number.isFinite(amountDelta) ? amountDelta : 0,
      schedule_impact: objectValue(body.schedule_impact),
      approval_snapshot: null,
      source_hash: hashJson({ package_id: packageId, change_version: changeVersion, after_snapshot: afterSnapshot }),
      created_by: context.authUser.id,
    };
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      "/rest/v1/change_orders?select=*",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      },
    );
    const changeOrder = rows[0];
    await writeAuditLog(context, {
      action: "CHANGE_ORDER_CREATED",
      target_type: "change_order",
      target_id: changeOrder?.id ? String(changeOrder.id) : null,
      target_label: String(payload.title),
      after_data: {
        package_id: packageId,
        change_version: changeVersion,
        amount_delta: payload.amount_delta,
      },
    });
    return json(changeOrder, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
