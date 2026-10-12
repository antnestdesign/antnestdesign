export const costSnapshotCases = [
  ["normal snapshot", () => ({ items: [
    { itemCode: "A", costPrice: 100, defaultMarginRate: 30, meta: { unit: "개", tags: ["synthetic"] } },
    { itemCode: "B", costPrice: "200.5", extra: false },
    { itemCode: "C", costPrice: null },
  ] })],
  ["single item", () => ({ items: [{ itemCode: "A", costPrice: 0 }] })],
  ["empty snapshot", () => ({})],
  ["null snapshot", () => null],
  ["undefined snapshot", () => undefined],
  ["empty items", () => ({ items: [] })],
  ["falsey items null", () => ({ items: null })],
  ["falsey items false", () => ({ items: false })],
  ["falsey items empty string", () => ({ items: "" })],
  ["falsey items zero", () => ({ items: 0 })],
  ["duplicate last wins first insertion order", () => ({ items: [
    { itemCode: "A", costPrice: 100 }, { itemCode: "B", costPrice: 200 },
    { itemCode: "A", costPrice: 300 }, { itemCode: "C", costPrice: 400 },
  ] })],
  ["missing code and legacy names", () => ({ items: [
    { item_code: "OLD", cost_price: 1 }, { inputId: "legacy-input", id: "legacy-id" },
    { itemCode: undefined, costPrice: 3 },
  ] })],
  ["key types are not normalized", () => ({ items: [
    { itemCode: 1, costPrice: 1 }, { itemCode: "1", costPrice: 2 },
    { itemCode: null, costPrice: 3 }, { itemCode: "", costPrice: 4 },
    { itemCode: " A ", costPrice: 5 }, { itemCode: "A", costPrice: 6 },
  ] })],
  ["same value zero keys", () => ({ items: [
    { itemCode: NaN, costPrice: 1 }, { itemCode: NaN, costPrice: 2 },
    { itemCode: -0, costPrice: -0 }, { itemCode: 0, costPrice: Infinity },
  ] })],
  ["object key identity", () => {
    const shared = { marker: "same shape" };
    const separate = { marker: "same shape" };
    return { items: [{ itemCode: shared, costPrice: 1 }, { itemCode: separate, costPrice: 2 }, { itemCode: shared, costPrice: 3 }] };
  }],
  ["same item reference repeated", () => { const item = { itemCode: "A", nested: { keep: true } }; return { items: [item, item] }; }],
  ["primitive detail values", () => ({ items: [0, false, "legacy", 1] })],
  ["legacy raw array", () => [{ itemCode: "A", costPrice: 1 }]],
  ["wrong wrapper", () => ({ costSnapshot: { items: [{ itemCode: "A", costPrice: 1 }] }, internalDetails: [{ itemCode: "B" }] })],
  ["truthy non-array items", () => ({ items: {} })],
  ["truthy string items", () => ({ items: "legacy" })],
  ["null item error", () => ({ items: [null] })],
  ["undefined item error", () => ({ items: [undefined] })],
  ["sparse array error", () => ({ items: [, { itemCode: "A" }] })],
];

export const snapshotConsumerCases = [
  { name: "same prices", snapshot: { items: [{ itemCode: "A", costPrice: 100, defaultMarginRate: 30 }, { itemCode: "WALLPAPER_MATERIAL_PER_PYEONG", costPrice: 10, defaultMarginRate: 30 }] }, current: [{ itemCode: "A", itemName: "합성 A", costPrice: 100, defaultMarginRate: 30 }, { itemCode: "WALLPAPER_MATERIAL_PER_PYEONG", itemName: "합성 도배", costPrice: 10, defaultMarginRate: 30 }], savedCost: 1000, currentCost: 1000 },
  { name: "duplicate and price difference", snapshot: { items: [{ itemCode: "A", costPrice: 50, defaultMarginRate: 30 }, { itemCode: "A", costPrice: 100, defaultMarginRate: 30 }] }, current: [{ itemCode: "A", itemName: "합성 A", costPrice: 150, defaultMarginRate: 30 }], savedCost: 1000, currentCost: 1500 },
  { name: "missing stored item", snapshot: { items: [{ itemCode: "OLD", costPrice: 1 }] }, current: [{ itemCode: "A", itemName: "합성 A", costPrice: 100, defaultMarginRate: 30 }], savedCost: 1000, currentCost: 1000 },
  { name: "missing snapshot", snapshot: null, current: [{ itemCode: "A", itemName: "합성 A", costPrice: 100, defaultMarginRate: 30 }], savedCost: 1000, currentCost: 1000 },
];

export function encodeSnapshotValue(value) {
  if (value === undefined) return { $snapshotType: "undefined" };
  if (typeof value === "number" && (!Number.isFinite(value) || Object.is(value, -0)))
    return { $snapshotType: "number", value: Object.is(value, -0) ? "-0" : String(value) };
  if (Array.isArray(value)) return value.map(encodeSnapshotValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, encodeSnapshotValue(entry)]));
  return value;
}

export function decodeSnapshotValue(value) {
  if (value?.$snapshotType === "undefined") return undefined;
  if (value?.$snapshotType === "number") return value.value === "-0" ? -0 : Number(value.value);
  if (Array.isArray(value)) return value.map(decodeSnapshotValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decodeSnapshotValue(entry)]));
  return value;
}
