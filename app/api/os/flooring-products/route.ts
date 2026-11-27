import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json, requireAdmin, supabaseFetch } from "../_lib/server";
import { listFlooringProducts } from "../_lib/flooring-store.js";
import { FLOORING_SKU } from "../../../../public/os-app/src/flooring-inputs.js";

export async function GET(request: NextRequest) {
  try {
    const admin = request.nextUrl.searchParams.get("view") === "admin";
    if (admin) await requireAdmin(request);
    else await getUserContext(request);
    return json(await listFlooringProducts(admin));
  } catch (error) { return errorResponse(error); }
}

function decimal(value: unknown, min: number, max: number, factor: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    && Math.abs(Math.round(value * factor) - value * factor) < 1e-7;
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAdmin(request);
    const data = await request.json();
    const { sku, revision, supply_cost, loss_percent, pack_m2, billing_unit, supplier_pyeong_m2, active } = data ?? {};
    if (typeof sku !== "string" || !FLOORING_SKU.test(sku) || !decimal(revision, 1, 2147483646, 1)
      || !decimal(supply_cost, 1, 10000000, 1) || !decimal(loss_percent, 0, 100, 100)
      || !(billing_unit === "PYEONG" && pack_m2 === null || decimal(pack_m2, 0.01, 100, 10000))
      || !["BOX", "2BOX", "PYEONG"].includes(billing_unit)
      || !(billing_unit === "PYEONG" ? decimal(supplier_pyeong_m2, 0.01, 100, 10000) : supplier_pyeong_m2 === null)
      || typeof active !== "boolean") throw new ApiError(400, "마루 원가·과금 기준을 확인해 주세요.");
    try {
      const updated = await supabaseFetch("/rest/v1/rpc/and_os_update_flooring_product", { method: "POST",
        body: JSON.stringify({ p_actor: context.authUser.id, p_sku: sku, p_revision: revision,
          p_supply_cost: supply_cost, p_loss_percent: loss_percent, p_pack_m2: pack_m2, p_billing_unit: billing_unit,
          p_supplier_pyeong_m2: supplier_pyeong_m2, p_active: active }) });
      return json(updated);
    } catch (error) {
      if (error instanceof ApiError && error.message.includes("flooring_revision_conflict")) {
        throw new ApiError(409, "다른 사용자가 이 제품을 수정했습니다. 다시 불러와 주세요.");
      }
      throw new ApiError(400, "마루 원가 기준을 저장하지 못했습니다.");
    }
  } catch (error) { return errorResponse(error); }
}
