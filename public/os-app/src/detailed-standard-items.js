import { COST_ITEM_DEFINITIONS } from "./cost-item-definitions.js";

const categoryTrade = { "철거": "demolition", "인허가": "demolition", "전기": "electrical", "욕실": "bathroom", "타일·욕실": "bathroom", "도배": "wallpaper", "필름": "film", "바닥": "flooring", "목공": "carpentry", "가구": "furniture", "상판": "furniture", "마감": "finish" };
const coefficientCodes = new Set(["ELEC_DAYS_UNDER10", "ELEC_DAYS_OVER10"]);
const basisFor = unit => unit === "평" || unit === "㎡" ? "floorArea" : unit === "m" ? "walls" : "manual";

// Definitions, not prices: live published cost_items remain the only master price source.
const linked = COST_ITEM_DEFINITIONS.filter(d => !coefficientCodes.has(d.itemCode)).map(d => ({
  id: `std-${d.itemCode}`, trade: categoryTrade[d.category], name: d.itemName,
  spec: "", unit: d.unit, sourceCode: d.itemCode, group: d.subcategory,
  pricing: "master", scope: ["상판", "가구"].includes(d.category) ? "선택 가구" : "선택 공간",
  spaceAllowed: !["인허가"].includes(d.category), quantityBasis: basisFor(d.unit),
  note: d.itemCode === "DEMO_BATHROOM_WATERPROOF" ? "철거·방수 묶음. 세부 분리 시 원품목 합산 제외."
    : d.itemCode.startsWith("FLOORING_") ? "자재·시공 포함. 별도 시공비 중복 주의."
    : d.unit === "평" ? "실측 ㎡를 평으로 환산할 때 적용 전 확인."
    : "수량·시공 범위를 확인한 뒤 적용.",
}));
const extra = (id, trade, name, unit, group, quantityBasis = "manual", note = "회사 기준 원가 미등록. 현장 적용 원가 또는 판매단가를 확인.") => ({
  id: `std-${id}`, trade, name, spec: "", unit, sourceCode: "", group, pricing: "manual", scope: "선택 공간", spaceAllowed: true, quantityBasis, note,
});
export const STANDARD_ITEMS = Object.freeze([...linked,
  extra("FILM_WOOD_ROLL", "film", "필름 자재(AND 표준 우드)", "롤", "자재"),
  extra("MISC_WASTE", "finish", "일반 폐기물", "식", "폐기물"),
  extra("MISC_PROTECTION", "finish", "세대 내 보양비", "식", "보양"),
  extra("MISC_CLEANING", "finish", "입주청소", "식", "청소"),
  { ...extra("TILE_AREA", "bathroom", "비욕실 타일", "㎡", "비욕실 타일", "wallArea", "기존 비욕실 타일 산식. 실측 적용 전 범위 확인."), pricing: "tile" },
  ...[["CURTAIN_BOX", "커튼박스", "개소", "manual"], ["COFFER", "우물천장", "개소", "manual"],
    ["ARTWALL", "아트월", "m", "walls"], ["PARTITION", "가벽", "m", "walls"], ["HIDDEN_DOOR", "히든도어", "개소", "manual"],
    ["LINE_LIGHT", "라인조명 목공", "m", "walls"], ["INDIRECT_LIGHT", "간접조명 목공", "개소", "manual"],
    ["DROP_CEILING", "단내림 천장", "개소", "manual"], ["MOLDING", "몰딩", "m", "walls"], ["BASEBOARD", "걸레받이", "m", "walls"]]
    .map(([id, name, unit, basis]) => extra(`WOOD_${id}`, "carpentry", name, unit, "목공 시공", basis)),
  ...[["MIDDLE", "중문"], ["STANDARD", "방문"], ["SLIDING", "슬라이딩 도어"]]
    .map(([id, name]) => extra(`INTERIOR_DOOR_${id}`, "carpentry", name, "개", "실내 도어")),
].map(item => {
  /** @type {{initialSale?: number, salePolicy?: string, legacySourceCode?: string, estimationType?: string}} */
  const metadata = {};
  if (item.id === "std-MISC_EXISTING_PIPE_CLEANING") { Object.assign(metadata, { initialSale: 300000, salePolicy: "pipe-fixed-v1" }); item.note = "기본 판매단가 300,000원. 적용 원가와 판매가는 별도로 유지."; }
  if (item.id === "std-FLOORING_WOOD_PER_PYEONG") { metadata.legacySourceCode = item.sourceCode; Object.assign(item, { sourceCode: "", pricing: "manual", note: "에디톤급 원가·시공 포함 범위 미확정. 일반 마루 원가를 사용하지 않음." }); }
  if (item.id === "std-WALLPAPER_MATERIAL_PER_PYEONG") Object.assign(item, { name: "도배 잡자재 평당", note: "벽지 본자재 제외. 회사 기준 원가 미등록." });
  if (["std-PERMIT_CONSTRUCTION", "std-PERMIT_CONSENT"].includes(item.id)) Object.assign(item, { spaceAllowed: false, scope: "현장 공통" });
  if (item.trade === "carpentry") metadata.estimationType = item.sourceCode ? "투입 원가" : item.id.startsWith("std-INTERIOR_DOOR_") ? "도어 범위 확인" : "완성 시공·구성 미확정";
  return Object.freeze({ ...item, ...metadata });
}));

export function standardById(id) { return STANDARD_ITEMS.find(item => item.id === id); }
export function recommendedStandardIds(reference) {
  const inputs = reference?.inputs || {}, selected = new Set();
  const enabled = key => inputs[key] === true || inputs[key] === "true";
  const positive = key => Number(inputs[key]) > 0;
  const add = code => selected.add(`std-${code}`);
  const bool = { demolitionFloorEnabled: ({ wood: "DEMO_FLOOR_WOOD", decoTile: "DEMO_FLOOR_DECOTILE" })[inputs.demolitionFloorMaterial], demolitionFurnitureEnabled: "DEMO_CABINET_PER_JA", demolitionBathroomEnabled: "DEMO_BATHROOM_WATERPROOF", demolitionCeilingEnabled: "DEMO_CEILING_PER_PYEONG", demolitionElevatorProtectEnabled: "DEMO_ELEVATOR_PROTECT", demolitionElevatorProtectRemovalEnabled: "DEMO_ELEVATOR_PROTECT_REMOVAL", demolitionPermitEnabled: "PERMIT_CONSTRUCTION", demolitionConsentEnabled: "PERMIT_CONSENT", standardSwitchEnabled: "ELEC_STANDARD_SWITCH", standardBedWallLightEnabled: "ELEC_BED_WALL_LIGHT", bathroomPlumbingRelocationEnabled: "BATH_PLUMBING_RELOCATION", kitchenStandardInstallEnabled: "KITCHEN_STANDARD_INSTALL", existingPipeCleaningEnabled: "MISC_EXISTING_PIPE_CLEANING", generalWasteEnabled: "MISC_WASTE", interiorProtectionEnabled: "MISC_PROTECTION", moveInCleaningEnabled: "MISC_CLEANING", siliconeEnabled: "FINISH_SILICONE", elasticEnabled: "FINISH_ELASTIC_BASE" };
  for (const [key, code] of Object.entries(bool)) if (enabled(key) && code) add(code);
  for (const [key, code] of Object.entries({ standardDownlightUnits: "ELEC_DOWNLIGHT", standardSquareLightUnits: "ELEC_SQUARE_LIGHT", standardCylinderLightUnits: "ELEC_CYLINDER_LIGHT", standardT3M: "ELEC_T3_PER_M", bathroomBathtubUnits: "BATH_BATHTUB", bathroomGlassBoothUnits: "BATH_GLASS_BOOTH", bathroomGlassPartitionUnits: "BATH_GLASS_PARTITION", kitchenSinkBowlUnits: "KITCHEN_SINK_BOWL", kitchenFaucetUnits: "KITCHEN_FAUCET", kitchenHoodUnits: "KITCHEN_HOOD" })) if (positive(key)) add(code);
  for (const [gate, key, code] of [["baseEnabled", "lowerCabinetM", "CABINET_LOWER"], ["baseEnabled", "upperCabinetM", "CABINET_UPPER"], ["islandEnabled", "islandM", "CABINET_ISLAND"], ["shoeEnabled", "shoeM", "CABINET_SHOE"], ["builtInEnabled", "builtInM", "CABINET_BUILT_IN_WARDROBE"]]) if (enabled(gate) && positive(key)) add(code);
  if (enabled("sectionWallpaperEnabled")) {
    const codes = { besti: "WALLPAPER_ROLL_BESTI", diamant: "WALLPAPER_ROLL_DIAMANT", fortis: "WALLPAPER_ROLL_FORTIS" };
    for (const key of ["wallpaperPublicMaterialGrade", "wallpaperRoomMaterialGrade"]) if (codes[inputs[key]]) add(codes[inputs[key]]);
  }
  const names = new Set((reference?.customerQuote?.groups || []).flatMap(g => (g.items || []).map(i => i.name)));
  for (const item of STANDARD_ITEMS) if (names.has(item.name)) selected.add(item.id);
  const gates = { demolition: "sectionDemolitionEnabled", electrical: "sectionElectricalEnabled", bathroom: "sectionBathroomEnabled", wallpaper: "sectionWallpaperEnabled", film: "sectionFilmEnabled", flooring: "sectionFlooringEnabled", carpentry: "sectionCarpentryEnabled", furniture: "sectionFurnitureEnabled", finish: "sectionFinishEnabled" };
  return [...selected].filter(id => {
    const item = standardById(id); if (!item) return false;
    return !Object.hasOwn(inputs, gates[item.trade]) || enabled(gates[item.trade]);
  });
}

export function measuredQuantity(item, space, basis) {
  if (!space) return null;
  let value = basis === "wallArea" ? space.walls.reduce((sum, n) => sum + n, 0) * space.height / 1000
    : basis === "walls" ? space.walls.reduce((sum, n) => sum + n, 0) : space[basis];
  if (!Number.isFinite(value)) return null;
  if (item.unit === "평" && basis !== "walls") value /= 3.3058;
  return Number(value.toFixed(6));
}
