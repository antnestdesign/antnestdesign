import { ApiError } from "../_lib/server";

export const CALCULATION_BASIS_OPTIONS = new Set([
  "fixed",
  "apartment_pyeong",
  "flooring_pyeong",
  "length_mm",
  "length_m",
  "area_sqm",
  "count",
  "bathroom_count",
  "lower_cabinet_length",
  "upper_cabinet_length",
  "homebar_length",
  "island_length",
  "partition_length",
  "manual_input",
]);

export const ROUNDING_OPTIONS = new Set(["none", "ceil", "floor", "round"]);

export function itemCode(value: unknown) {
  const code = String(value || "").trim().toUpperCase();
  if (!code) throw new ApiError(400, "품목 코드를 입력해 주세요.");
  if (!/^[A-Z0-9_]+$/.test(code)) {
    throw new ApiError(400, "품목 코드는 영문 대문자, 숫자, 밑줄만 사용할 수 있습니다.");
  }
  return code;
}

export function requiredText(value: unknown, label: string) {
  const text = String(value || "").trim();
  if (!text) throw new ApiError(400, `${label}을 입력해 주세요.`);
  return text;
}

export function optionalText(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

export function nonNegativeNumber(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ApiError(400, `${label}은 0 이상 숫자로 입력해 주세요.`);
  }
  return number;
}

export function optionalNonNegativeNumber(value: unknown, label: string) {
  if (value === null || value === undefined || value === "") return null;
  return nonNegativeNumber(value, label);
}

export function marginRate(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number >= 1) {
    throw new ApiError(400, "마진율은 0 이상 1 미만 값으로 입력해 주세요.");
  }
  return number;
}

export function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function calculationBasis(value: unknown) {
  const basis = requiredText(value, "계산 기준");
  if (!CALCULATION_BASIS_OPTIONS.has(basis)) {
    throw new ApiError(400, "허용되지 않은 계산 기준입니다.");
  }
  return basis;
}

export function roundingMethod(value: unknown) {
  const method = String(value || "none").trim() || "none";
  if (!ROUNDING_OPTIONS.has(method)) {
    throw new ApiError(400, "허용되지 않은 수량 올림 방식입니다.");
  }
  return method;
}

export function costItemRpcPayload(body: Record<string, unknown>, sourceId: string | null = null) {
  return {
    p_item_code: itemCode(body.item_code),
    p_category: requiredText(body.category, "대분류"),
    p_subcategory: optionalText(body.subcategory),
    p_item_name: requiredText(body.item_name, "품목명"),
    p_unit: requiredText(body.unit, "단위"),
    p_calculation_basis: calculationBasis(body.calculation_basis),
    p_cost_price: nonNegativeNumber(body.cost_price, "기본 원가"),
    p_margin_rate: marginRate(body.default_margin_rate),
    p_is_active: booleanValue(body.is_active, true),
    p_sort_order: Math.floor(nonNegativeNumber(body.sort_order ?? 0, "정렬 순서")),
    p_memo: optionalText(body.memo),
    p_customer_name: optionalText(body.customer_name),
    p_order_name: optionalText(body.order_name),
    p_calculation_multiplier: nonNegativeNumber(body.calculation_multiplier ?? 1, "계산 배수"),
    p_min_quantity: optionalNonNegativeNumber(body.min_quantity, "최소 수량"),
    p_rounding_method: roundingMethod(body.rounding_method),
    p_include_in_customer_quote: booleanValue(body.include_in_customer_quote, true),
    p_include_in_internal_quote: booleanValue(body.include_in_internal_quote, true),
    p_include_in_order_sheet: booleanValue(body.include_in_order_sheet, false),
    p_is_material: booleanValue(body.is_material, false),
    p_is_labor: booleanValue(body.is_labor, false),
    p_is_service: booleanValue(body.is_service, false),
    p_source_cost_item_id: sourceId,
  };
}

export function costItemAuditData(row: Record<string, unknown> | null | undefined) {
  if (!row) return null;
  return {
    id: row.id,
    item_code: row.item_code,
    item_name: row.item_name,
    category: row.category,
    subcategory: row.subcategory,
    unit: row.unit,
    cost_price: row.cost_price,
    default_margin_rate: row.default_margin_rate,
    is_active: row.is_active,
    draft_is_active: row.draft_is_active,
    calculation_basis: row.calculation_basis,
    calculation_multiplier: row.calculation_multiplier,
    min_quantity: row.min_quantity,
    rounding_method: row.rounding_method,
    is_pending_new: row.is_pending_new,
    source_cost_item_id: row.source_cost_item_id,
  };
}
