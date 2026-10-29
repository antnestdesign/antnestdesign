import { standardById } from "./detailed-standard-items.js";

export const QUANTITY_LABELS = { floorArea: "바닥면적", ceilingArea: "천장면적", wallArea: "벽면적", surfaceArea: "벽·천장 면적", walls: "벽 길이", spaceCount: "선택 공간 개수", one: "기본 1식", preliminary: "가견적 수량", manual: "직접 입력" };
export function quantityModes(item) {
  if (item.kind === "fixed") return ["one", "manual"];
  const s = standardById(item.standardId), id = s?.id || `std-${item.masterCode || ""}`;
  let modes = [];
  if (id === "std-DEMO_CEILING_PER_PYEONG") modes = ["ceilingArea"];
  else if (id.startsWith("std-DEMO_FLOOR_") || s?.trade === "flooring" || id === "std-WALLPAPER_MATERIAL_PER_PYEONG") modes = ["floorArea"];
  else if (/WALLPAPER_ROLL_|FILM_WOOD_ROLL/.test(id)) modes = ["wallArea", "ceilingArea", "surfaceArea"];
  else if (id === "std-TILE_AREA" || id === "std-WOOD_DRYWALL_SHEET") modes = ["floorArea", "wallArea", "ceilingArea"];
  else if (["std-DEMO_BATHROOM_WATERPROOF", "std-BATH_FAN_NORMAL", "std-BATH_HUGENT_MACHINE", "std-BATH_HUGENT_INSTALL_EXTRA", "std-BATH_PLUMBING_RELOCATION", "std-BATH_FIXTURE_SET", "std-BATH_FIXTURE_INSTALL", "std-BATH_SMC_CEILING"].includes(id)) modes = ["spaceCount"];
  else if (s?.unit === "m") modes = ["walls"];
  else if (!s && !item.standardId) modes = ["floorArea", "ceilingArea", "wallArea", "walls"];
  if (item.unit === "식") modes.push("one");
  return [...(item.origin && item.origin.kind !== "review" ? ["preliminary"] : []), ...new Set(modes), "manual"];
}

export function selectedSpaceIds(item) { return item.spaceIds || (item.spaceId ? [item.spaceId] : []); }
export function measuredSelection(item, spaces, basis, parameters = {}) {
  if (!quantityModes(item).includes(basis) || ["manual", "preliminary"].includes(basis)) return null;
  const ids = selectedSpaceIds(item), selected = ids.map(id => spaces.find(s => s.id === id));
  if (basis !== "one" && (!ids.length || selected.some(s => !s))) return null;
  let raw = 1, unit = "식", evidence = [];
  if (basis !== "one") {
    const value = s => basis === "floorArea" ? s.floorArea : basis === "ceilingArea" ? s.ceilingArea
      : basis === "walls" ? s.walls.reduce((sum, n) => sum + n, 0)
      : basis === "spaceCount" ? 1 : s.walls.reduce((sum, n) => sum + n, 0) * s.height / 1000 + (basis === "surfaceArea" ? s.ceilingArea : 0);
    evidence = selected.map(s => [s.id, value(s)]);
    raw = evidence.reduce((sum, entry) => sum + entry[1], 0);
    unit = basis === "walls" ? "m" : basis === "spaceCount" ? "개소" : "㎡";
  }
  const area = unit === "㎡";
  const excluded = parameters.excludeArea === undefined ? 0 : Number(parameters.excludeArea);
  if (!Number.isFinite(excluded) || excluded < 0 || excluded > raw || (!area && excluded)) return null;
  let explanation = `${raw.toLocaleString("ko-KR", { maximumFractionDigits: 6 })}${unit}`;
  if (excluded) { raw = Number((raw - excluded).toFixed(6)); explanation += ` - 제외 ${excluded}㎡`; }
  let value = raw;
  if (area && item.unit === "평") { value = raw / 3.3058; explanation += " ÷ 3.3058㎡/평"; }
  else if (area && ["롤", "장"].includes(item.unit)) {
    const coverage = Number(parameters.coverage), waste = Number(parameters.waste);
    if (!(coverage > 0 && coverage <= 100000 && waste >= 1 && waste <= 10)) return { needsCoverage: true, raw, explanation: `${explanation} · ${item.unit}당 면적과 여유율 확인 필요` };
    value = Math.ceil(Number((raw * waste / coverage).toFixed(10))); explanation += ` × ${waste} ÷ ${coverage}㎡/${item.unit}, 올림`;
  } else if (area && item.unit !== "㎡") return null;
  else if (unit === "m" && item.unit !== "m") return null;
  else if (basis === "spaceCount" && !["칸", "개소", "개"].includes(item.unit)) return null;
  value = Number(value.toFixed(6));
  if (!Number.isFinite(value) || value < 0 || value > 100000) return null;
  const stamp = JSON.stringify([basis, item.unit, evidence, parameters.coverage ?? null, parameters.waste ?? null, ...(parameters.excludeArea === undefined ? [] : [excluded])]);
  return { basis, spaceIds: [...ids], value, stamp, ...(parameters.coverage === undefined ? {} : { coverage: Number(parameters.coverage) }), ...(parameters.waste === undefined ? {} : { waste: Number(parameters.waste) }), ...(parameters.excludeArea === undefined ? {} : { excludeArea: excluded }), explanation };
}
export function measurementChanged(item, spaces) {
  if (!item.measurement) return false;
  const next = measuredSelection(item, spaces, item.measurement.basis, item.measurement);
  return !next || next.needsCoverage || next.stamp !== item.measurement.stamp;
}

export function quantityState(item, spaces) {
  if (measurementChanged(item, spaces)) return "실측값 변경·수량 재확인 필요";
  if (item.quantityManual) return "수동 수정됨";
  if (item.measurement) return "실측 적용";
  return item.origin ? item.origin.kind === "review" ? "가견적 사양 · 실측 수량 확인 필요" : item.origin.kind === "estimate" ? "가견적에서 가져옴 · 실측 확인 필요" : "가견적에서 가져옴" : "사용자가 추가함";
}
