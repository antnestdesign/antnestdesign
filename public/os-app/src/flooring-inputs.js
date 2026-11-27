export const FLOORING_DEFAULT_PLAN = '{"common":{"sku":"","loss":null},"rooms":[]}';
export const FLOORING_MAX_ROOMS = 20;
export const FLOORING_MAX_AREA = 2000;
export const FLOORING_SKU = /^[a-z0-9-]{1,64}$/;

export class FlooringInputError extends Error {}

function check(condition, message = "마루 제품, 시공평수 또는 로스율을 확인해 주세요.") {
  if (!condition) throw new FlooringInputError(message);
}

function record(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).every(key => keys.includes(key));
}

function area(value) {
  const n = Number(value);
  check((typeof value === "string" || typeof value === "number") && /^\d+(\.\d{1,3})?$/.test(String(value))
    && n >= 0 && n <= FLOORING_MAX_AREA, "마루 시공평수는 0~2,000평(소수 세 자리)으로 입력해 주세요.");
  return Math.round(n * 1000);
}

function room(entry, separate) {
  check(record(entry, separate ? ["sku", "loss", "area"] : ["sku", "loss"]));
  const { sku, loss } = entry;
  check(typeof sku === "string" && (sku === "" || FLOORING_SKU.test(sku))
    && (loss === null || typeof loss === "number" && /^\d+(\.\d{1,2})?$/.test(String(loss)) && loss >= 0 && loss <= 100));
  return { sku, loss, ...(separate ? { area: area(entry.area) / 1000 } : {}) };
}

export function parseFlooringPlan(raw) {
  if (raw == null || raw === "") return null;
  check(typeof raw === "string" && raw.length <= 4000);
  let plan;
  try { plan = JSON.parse(raw); } catch { check(false); }
  check(record(plan, ["common", "rooms"]) && Array.isArray(plan.rooms) && plan.rooms.length <= FLOORING_MAX_ROOMS);
  return { common: room(plan.common, false), rooms: plan.rooms.map(value => room(value, true)) };
}

export function flooringZonePreview(inputs) {
  if (inputs.sectionFlooringEnabled !== true || inputs.flooringMaterialType === "sheet") return { zones: null, issues: [] };
  const plan = parseFlooringPlan(inputs.flooringPlan);
  if (!plan) return { zones: null, issues: [] };
  const total = area(inputs.flooringArea || "0");
  const separate = plan.rooms.reduce((sum, value) => sum + area(value.area), 0);
  if (!total) return { zones: [], issues: ["전체 마루 시공평수를 입력해 주세요."] };
  if (separate > total) return { zones: [], issues: ["별도 방의 합계는 전체 마루 시공평수를 초과할 수 없습니다."] };
  const zones = [
    { ...plan.common, areaMilli: total - separate, label: "공용부" },
    ...plan.rooms.map((value, index) => ({ ...value, areaMilli: area(value.area), label: `별도 방 ${index + 1}` })),
  ];
  const issues = zones.flatMap(zone => {
    if (zone.areaMilli > 0 && !zone.sku) return [`${zone.label} 마루 제품을 선택해 주세요.`];
    if (zone.label !== "공용부" && !zone.areaMilli) return [`${zone.label} 시공평수를 입력해 주세요.`];
    return [];
  });
  // A room with no area makes the remaining common area unknown.
  const unknownCommonArea = plan.rooms.some(room => !room.area);
  return { issues, zones: zones.filter((zone, index) => zone.areaMilli > 0 && zone.sku && (index > 0 || !unknownCommonArea)) };
}

export function flooringZones(inputs) {
  const { zones, issues } = flooringZonePreview(inputs);
  check(!issues.length, issues[0]);
  return zones;
}

export function flooringProductLabel(product) {
  return `${product.short_name} · ${product.width_mm}×${product.length_mm}×${product.thickness_mm} mm`;
}
