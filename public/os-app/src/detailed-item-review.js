import { standardById } from "./detailed-standard-items.js";
import { selectedSpaceIds } from "./detailed-measurement.js";

const code = row => row.standardId || (row.masterCode ? `std-${row.masterCode}` : row.kind === "tile" ? "std-TILE_AREA" : "");
const alternatives = [
  ["바닥 대안 자재", s => s?.trade === "flooring"],
  ["도배지 대안 자재", s => /^std-WALLPAPER_ROLL_/.test(s?.id || "")],
  ["유리파티션 포함 범위", s => ["std-BATH_GLASS_BOOTH", "std-BATH_GLASS_PARTITION"].includes(s?.id)],
];
const tileInput = s => ["std-TILE_LABOR_WORKER", "std-TILE_LABOR_HELPER", "std-BATH_PORCELAIN_TILE_MATERIAL"].includes(s?.id);
const woodInput = s => s?.trade === "carpentry" && s.estimationType === "투입 원가";
const woodFinished = s => s?.estimationType === "완성 시공·구성 미확정";

// Advisory only: spaces and explicit work parts are evidence, names/specs are not.
// Never return internal prices, suppliers, or inferred deductions.
export function reviewDetailedItems(items) {
  const rows = items.filter(i => !i.excluded), notices = [];
  for (let a = 0; a < rows.length; a++) for (let b = a + 1; b < rows.length; b++) {
    const left = rows[a], right = rows[b], x = standardById(code(left)), y = standardById(code(right));
    const leftSpaces = selectedSpaceIds(left), rightSpaces = selectedSpaceIds(right);
    const overlap = leftSpaces.some(id => rightSpaces.includes(id));
    if (leftSpaces.length && rightSpaces.length && !overlap) continue;
    const lp = (left.workScope || "").trim(), rp = (right.workScope || "").trim();
    let type = code(left) && code(left) === code(right) ? "동일 품목" : "";
    for (const [label, matches] of alternatives) if (matches(x) && matches(y)) type ||= label;
    if ((woodInput(x) && woodFinished(y)) || (woodInput(y) && woodFinished(x))) type = "목공 투입·완성 시공";
    if ((code(left) === "std-TILE_AREA" && tileInput(y)) || (code(right) === "std-TILE_AREA" && tileInput(x))) type = "비욕실 타일 자재·노무";
    if ((code(left) === "std-DEMO_BATHROOM_WATERPROOF" && tileInput(y)) || (code(right) === "std-DEMO_BATHROOM_WATERPROOF" && tileInput(x))) type = "욕실 철거·방수와 타일 범위";
    if (overlap && lp && lp === rp && ((x?.trade === "film" && ["carpentry", "furniture"].includes(y?.trade)) || (y?.trade === "film" && ["carpentry", "furniture"].includes(x?.trade)))) type = "필름·목공·가구 포함 범위";
    if (!type) continue;
    const known = Boolean(overlap && lp && lp === rp);
    const note = type.startsWith("목공") ? "완성 시공의 포함 자재·노무가 미확정입니다. 투입 항목과 범위를 확인해 주세요."
      : type.startsWith("비욕실") ? "비욕실 타일은 자재·노무를 함께 산정합니다. 욕실의 별도 작업인지 확인해 주세요."
      : type.startsWith("욕실") ? "철거·방수 묶음과 타일 시공은 다른 작업일 수 있습니다. 방수 등 동일 범위가 겹치는지 확인해 주세요."
      : "별도 부위의 정당한 복수 시공이면 함께 적용할 수 있습니다.";
    notices.push({ type, itemIds: [left.id, right.id], names: [left.name, right.name], scopeKnown: known,
      message: `${type} 확인 필요: ${left.name} / ${right.name}. ${known ? "같은 공간·적용 부위입니다." : lp && rp && lp !== rp ? "적용 부위 표기가 다릅니다. 실제로 별도 범위인지 확인해 주세요." : "적용 부위 정보가 부족하여 중복으로 확정할 수 없습니다."} ${note}` });
  }
  return notices;
}

export function itemReviewText(notices) {
  return notices.slice(0, 6).map(n => n.message).join("\n") + (notices.length > 6 ? `\n외 ${notices.length - 6}건` : "");
}
