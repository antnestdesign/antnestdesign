const row = (group, item, input, quantity, cost, extra = {}) => ({ group, item, input, quantity, cost, ...extra });
const estimate = (internalDetails, extra = {}) => ({
  projectName: "합성 발주 프로젝트", areaPyeong: 33, savedAt: "2026-01-02T03:04:05.000Z",
  internalDetails, ...extra,
});

export const purchaseOrderCases = [
  ["null estimate", () => null],
  ["undefined estimate", () => undefined],
  ["empty object", () => ({})],
  ["falsey details", () => estimate(null)],
  ["empty details", () => estimate([])],
  ["single item", () => estimate([row("wallpaper", "벽지", "합성 등급", "3롤", 120000)])],
  ["normal multi trade", () => estimate([
    row("flooring", "마루", "시험 등급", "10평", 1000000, { unitPrice: 100000, customerRevenue: 1300000 }),
    row("base", "하부장 제작", "합성 사양", "4자", 400000, { unitPrice: 100000, customerRevenue: 520000 }),
    row("wallpaper", "벽지", "시험 등급", "3롤", 120000),
    row("carpentry", "목공 인건비", "시험 시공", "2품", 300000),
    row("bathroom", "도기", "시험 제품급", "1개", 100000),
    row("demolition", "철거 자재", "시험", "1식", 20000),
  ])],
  ["no matching rows", () => estimate([
    row("electrical", "콘센트", "시험", "1개", 10000),
    row("misc", "기존 배관 청소", "시험", "1식", 300000),
    row("wallpaper", "작업", "시험", "1식", 10000),
  ])],
  ["mixed zero optional and unknown", () => estimate([
    row("wallpaper", "벽지", "0수량", 0, 0, { is_active: false, include_in_order_sheet: false }),
    row("kitchen", "싱크볼", "선택 안 함", "1개", -10),
    row("custom", "MDF 자재", "시험", "1장", 100),
    row("base", "하부장 설치비", "시험", "1식", 100),
    row("film", "작업", "필름", "0m", 0),
  ])],
  ["order A", () => estimate([row("wallpaper", "벽지", "A", "1롤", 10), row("base", "하부장", "B", "2자", 20)])],
  ["order B", () => estimate([row("base", "하부장", "B", "2자", 20), row("wallpaper", "벽지", "A", "1롤", 10)])],
  ["duplicates retained", () => {
    const item = row("wallpaper", "벽지", "동일", "1롤", 100);
    return estimate([item, item, { ...item }]);
  }],
  ["legacy missing projected fields", () => estimate([
    { group: "wallpaper", input: "벽지" },
    { group: "base", item: "하부장", cost: "1000.5", quantity: "2.5자" },
  ])],
  ["raw numeric values", () => estimate([
    row("wallpaper", "벽지", "음수", -1.5, -100.5),
    row("wallpaper", "벽지", "문자열", "3.25", "900.4"),
    row("wallpaper", "벽지", "큰 값", 1000000000, 9000000000000),
    row("wallpaper", "벽지", "비정상 숫자", NaN, Infinity),
    row("wallpaper", "벽지", "음의 0", -0, -0),
    row("wallpaper", "벽지", "원시 값", null, undefined),
    row("wallpaper", "벽지", "bigint", 1n, 123n),
  ])],
  ["unit price customer tax and total ignored", () => estimate([
    row("kitchen", "싱크볼", "시험", "2개", 100.5, { unit: "다른 단위", unitPrice: 999, cost_price: 888, total: 777, revenue: 666, customerRevenue: 555, supplyAmount: 444, vat: 333 }),
  ])],
  ["snapshot and flags ignored", () => estimate([
    row("wallpaper", "벽지", "시험", "1롤", 45000, { item_code: "SYNTHETIC", is_active: false, include_in_order_sheet: false }),
  ], { costSnapshot: { items: [{ itemCode: "SYNTHETIC", costPrice: 999999 }] }, customerQuote: { total: 9999999 } })],
  ["snapshot without details", () => ({ costSnapshot: { items: [{ itemCode: "SYNTHETIC", costPrice: 1 }] } })],
  ["legacy string budgets for renderer", () => estimate([row("wallpaper", "벽지", "시험", "1롤", "1000"), row("base", "하부장", "시험", "1자", "2000")])],
  ["non-array details error", () => estimate({})],
  ["null detail error", () => estimate([null])],
  ["undefined detail error", () => estimate([undefined])],
];

export function encodePurchaseValue(value) {
  if (value === undefined) return { $purchaseType: "undefined" };
  if (typeof value === "bigint") return { $purchaseType: "bigint", value: String(value) };
  if (typeof value === "number" && (!Number.isFinite(value) || Object.is(value, -0)))
    return { $purchaseType: "number", value: Object.is(value, -0) ? "-0" : String(value) };
  if (Array.isArray(value)) return value.map(encodePurchaseValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encodePurchaseValue(entry)]));
  return value;
}

export function decodePurchaseValue(value) {
  if (value?.$purchaseType === "undefined") return undefined;
  if (value?.$purchaseType === "bigint") return BigInt(value.value);
  if (value?.$purchaseType === "number") return value.value === "-0" ? -0 : Number(value.value);
  if (Array.isArray(value)) return value.map(decodePurchaseValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decodePurchaseValue(entry)]));
  return value;
}
