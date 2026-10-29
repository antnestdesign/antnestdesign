import { standardById } from "./detailed-standard-items.js";

export const PRELIMINARY_MAPPING_VERSION = "preliminary-input-v1";
const checked = v => v === true || v === "true";
const positive = v => (typeof v === "number" || typeof v === "string") && v !== "" && Number.isFinite(Number(v)) && Number(v) > 0;
const round = n => Number(n.toFixed(6));

// Read only the frozen public reference. Never invoke the preliminary calculator or read prices.
export function buildPreliminaryPlan(reference, sourceId) {
  const i = reference?.inputs || {}, rows = [], reviews = [];
  const enabled = key => checked(i[key]);
  const section = trade => !Object.hasOwn(i, `section${trade}Enabled`) || enabled(`section${trade}Enabled`);
  const review = (trade, label, keys, reason, code) => reviews.push({ trade, label, inputs: keys.filter(k => Object.hasOwn(i, k)), reason, ...(code ? { standardIds: (Array.isArray(code) ? code : [code]).map(c => `std-${c}`) } : {}) });
  const add = (code, quantity, keys, label, kind = "input", spec = "", part = "") => {
    const s = standardById(`std-${code}`); if (!s || !positive(quantity)) return;
    const key = `${code}:${keys.join("+")}`;
    const origin = { key, sourceId, mappingVersion: PRELIMINARY_MAPPING_VERSION, inputs: keys, quantity: round(quantity), unit: s.unit, kind, label };
    rows.push({ key, standardId: s.id, trade: s.trade, name: s.name, unit: s.unit, quantity: round(quantity), spec, workScope: part, origin });
  };
  const number = (code, key, label, gate = true, spec = "", part = "") => { if (gate && positive(i[key])) add(code, Number(i[key]), [key], label, "input", spec, part); };
  const one = (code, key, label, gate = true) => { if (gate && enabled(key)) add(code, 1, [key], label, "option"); };
  const ja = (code, key, label, gate, spec = "", part = "") => { if (gate && positive(i[key])) add(code, Math.ceil(Number(i[key]) / 300), [key], `${label} ${i[key]}mm ÷ 300, 올림`, "conversion", spec, part); };
  if (section("Demolition")) {
    if (enabled("demolitionFloorEnabled")) {
      const code = { wood: "DEMO_FLOOR_WOOD", decoTile: "DEMO_FLOOR_DECOTILE" }[i.demolitionFloorMaterial];
      if (code && positive(i.areaPyeong)) add(code, Number(i.areaPyeong), ["demolitionFloorEnabled", "demolitionFloorMaterial", "areaPyeong"], "가견적 평형 기준 · 철거 공간 실측 확인", "estimate");
      else review("demolition", "바닥 철거", ["demolitionFloorMaterial", "areaPyeong"], "철거 자재 또는 면적을 확인해 주세요.");
    }
    ja("DEMO_CABINET_PER_JA", "demolitionFurnitureM", "가구 철거 길이", enabled("demolitionFurnitureEnabled"));
    number("DEMO_BATHROOM_WATERPROOF", "demolitionBathroomUnits", "욕실 철거·방수 개수", enabled("demolitionBathroomEnabled"));
    if (enabled("demolitionBathroomEnabled")) review("demolition", "욕실 철거·방수 묶음", ["demolitionBathroomUnits"], "철거·방수 포함 범위와 타일 등 개별 공사의 중복을 확인해 주세요.");
    if (enabled("demolitionCeilingEnabled") && positive(i.areaPyeong)) add("DEMO_CEILING_PER_PYEONG", Number(i.areaPyeong), ["demolitionCeilingEnabled", "areaPyeong"], "가견적 평형 기준 · 천장 철거 부분 실측 확인", "estimate");
    for (const [code, key] of [["DEMO_ELEVATOR_PROTECT", "demolitionElevatorProtectEnabled"], ["DEMO_ELEVATOR_PROTECT_REMOVAL", "demolitionElevatorProtectRemovalEnabled"], ["PERMIT_CONSTRUCTION", "demolitionPermitEnabled"], ["PERMIT_CONSENT", "demolitionConsentEnabled"]]) one(code, key, "가견적 선택 · 기본 1식");
  }
  if (section("Electrical")) {
    const lighting = !Object.hasOwn(i, "standardLightingEnabled") || enabled("standardLightingEnabled");
    for (const [code, key] of [["ELEC_DOWNLIGHT", "standardDownlightUnits"], ["ELEC_SQUARE_LIGHT", "standardSquareLightUnits"], ["ELEC_CYLINDER_LIGHT", "standardCylinderLightUnits"], ["ELEC_T3_PER_M", "standardT3M"]]) number(code, key, "가견적 조명 직접 입력", lighting);
    one("ELEC_BED_WALL_LIGHT", "standardBedWallLightEnabled", "침대 벽등 기본 1식"); one("ELEC_STANDARD_SWITCH", "standardSwitchEnabled", "스위치 기본 1식", lighting);
    if (enabled("electricalEnabled")) review("electrical", "전기 인력·배선", ["electricalAgeType", "areaPyeong"], "산출된 전기 품 수가 공개 참조에 없어 직접 확인이 필요합니다.");
  }
  if (section("Bathroom")) {
    if (positive(i.bathroomUnits)) {
      const grade = { standard: "AND표준(아메리칸 스탠다드 급)", value: "AND실속(대림급)", premium: "AND고급(수전 그로헤급)" }[i.bathroomFixtureGrade];
      review("bathroom", "욕실 공사 구성", ["bathroomUnits", "bathroomFixtureGrade", "tileEnabled"], `욕실 ${i.bathroomUnits}개. ${grade || "도기·수전 등급 확인 필요"}. 타일 인력·자재·도기·시공의 묶음 구성과 수량은 개별 확인이 필요합니다.`, ["TILE_LABOR_WORKER", "TILE_LABOR_HELPER", "BATH_PORCELAIN_TILE_MATERIAL", "BATH_FIXTURE_SET", "BATH_FIXTURE_INSTALL", "BATH_SMC_CEILING"]);
      if (enabled("bathroomPlumbingRelocationEnabled")) add("BATH_PLUMBING_RELOCATION", Number(i.bathroomUnits), ["bathroomPlumbingRelocationEnabled", "bathroomUnits"], "위치 조정 선택 · 욕실 개수", "option");
      if (i.bathroomFanType === "normal") add("BATH_FAN_NORMAL", Number(i.bathroomUnits), ["bathroomFanType", "bathroomUnits"], "환풍기 선택 · 욕실 개수", "option");
      else if (i.bathroomFanType === "hugent") {
        add("BATH_HUGENT_MACHINE", Number(i.bathroomUnits), ["bathroomFanType", "bathroomUnits"], "휴젠트 본체 · 욕실 개수", "option");
        add("BATH_HUGENT_INSTALL_EXTRA", Number(i.bathroomUnits), ["bathroomFanType", "bathroomUnits"], "휴젠트 추가 설치 · 욕실 개수", "option");
      }
    }
    for (const [code, key] of [["BATH_BATHTUB", "bathroomBathtubUnits"], ["BATH_GLASS_BOOTH", "bathroomGlassBoothUnits"], ["BATH_GLASS_PARTITION", "bathroomGlassPartitionUnits"]]) number(code, key, "욕실 옵션 직접 입력");
    if (enabled("tileEnabled") || enabled("tileGroutEnabled") || positive(i.bathroomMasonryWallUnits)) review("bathroom", "타일·줄눈·조적 범위", ["tileEnabled", "tileGroutEnabled", "bathroomMasonryWallUnits"], "욕실/비욕실 구분과 실제 면적·구성을 확인해 주세요. 조적은 확인된 현장 품목만 연결하며 임의 생성하지 않습니다.", ["TILE_LABOR_WORKER", "TILE_LABOR_HELPER", "BATH_PORCELAIN_TILE_MATERIAL", "TILE_GROUT", "TILE_AREA"]);
  }
  if (section("Wallpaper")) {
    if (positive(i.areaPyeong)) add("WALLPAPER_MATERIAL_PER_PYEONG", Number(i.areaPyeong), ["sectionWallpaperEnabled", "areaPyeong"], "도배 잡자재 · 가견적 평형 기준", "estimate");
    for (const [part, gradeKey, lengthKey] of [["공용부", "wallpaperPublicMaterialGrade", "wallpaperPublicWallLengthM"], ["각방", "wallpaperRoomMaterialGrade", "wallpaperRoomWallLengthM"]]) {
      const code = { besti: "WALLPAPER_ROLL_BESTI", diamant: "WALLPAPER_ROLL_DIAMANT", fortis: "WALLPAPER_ROLL_FORTIS" }[i[gradeKey]];
      if (code && positive(i[lengthKey])) review("wallpaper", `${part} ${standardById(`std-${code}`).name}`, [gradeKey, lengthKey, "areaPyeong"], `벽 길이 ${i[lengthKey]}mm. 저장 참조에 롤 수·천장 배분·로스 기준이 없어 실측 수량 확인이 필요합니다.`, code);
    }
    if (i.wallpaperPreset) review("wallpaper", "도배 인력·잡자재", ["wallpaperPreset", "wallpaperBaseCoatEnabled", "areaPyeong"], "가견적 산출 품 수와 잡자재 범위는 공개 참조만으로 확정할 수 없습니다.", ["WALLPAPER_LABOR", "WALLPAPER_MATERIAL_PER_PYEONG"]);
  }
  if (section("Film") && (positive(i.filmMaterialLengthM) || i.filmPreset)) review("film", "필름 공사", ["filmMaterialLengthM", "filmPreset"], "벽 길이(mm)·작업 난이도는 보존되지만 롤 수·인력 품 수는 확인이 필요합니다.", ["FILM_LABOR", "FILM_WOOD_ROLL"]);
  if (section("Flooring") && positive(i.flooringArea)) {
    const sheet = { t18: ["18T", "1.8T"], t20: ["20T", "2T"], t22: ["22T", "2.2T"], t32: ["32T", "3.2T"], t45: ["45T", "4.5T"], t50: ["50T", "5T"] }[i.flooringSheetGrade];
    const code = i.flooringMaterialType === "sheet" ? sheet?.[0]
      : i.flooringMaterialType === "wood" ? ({ editone: "FLOORING_WOOD_PER_PYEONG", standard: "FLOORING_WOOD_STANDARD" })[i.flooringWoodGrade] : undefined;
    if (code) add(i.flooringMaterialType === "sheet" ? `FLOORING_SHEET_${code}` : code, Number(i.flooringArea), ["flooringArea", "flooringMaterialType", i.flooringMaterialType === "sheet" ? "flooringSheetGrade" : "flooringWoodGrade"], "가견적 바닥 시공면적(평)", "input", `${i.flooringMaterialType === "sheet" ? "장판" : "마루"} ${i.flooringMaterialType === "sheet" ? sheet[1] : i.flooringWoodGrade === "editone" ? "LX 에디톤급" : "일반마루"}`);
    else review("flooring", "바닥 공사", ["flooringArea", "flooringMaterialType", "flooringWoodGrade", "flooringSheetGrade"], "저장된 바닥 종류·등급의 명확한 대응이 없어 확인이 필요합니다.");
  }
  if (section("Carpentry")) {
    for (const [code, key] of [["WOOD_CURTAIN_BOX", "carpentryCurtainBoxUnits"], ["WOOD_ARTWALL", "carpentryArtwallM"], ["WOOD_PARTITION", "carpentryPartitionM"], ["WOOD_HIDDEN_DOOR", "carpentryHiddenDoorUnits"], ["WOOD_LINE_LIGHT", "carpentryLineLightM"], ["WOOD_INDIRECT_LIGHT", "carpentryIndirectLightUnits"], ["WOOD_DROP_CEILING", "carpentryDropCeilingUnits"]]) {
      if (positive(i[key])) { const length = standardById(`std-${code}`).unit === "m"; add(code, Number(i[key]) / (length ? 1000 : 1), [key], length ? "가견적 길이 mm → m" : "가견적 개소 직접 입력", length ? "conversion" : "input"); }
    }
    number("WOOD_CEILING_FAN", "carpentryCeilingFanUnits", "실링팬 보강 개수");
    if (rows.some(r => r.trade === "carpentry") || enabled("carpentryMoldingEnabled") || enabled("carpentryBaseboardEnabled") || (i.carpentryCofferType && i.carpentryCofferType !== "none")) review("carpentry", "목공 구성·투입 원가", ["carpentryCofferType", "carpentryMoldingEnabled", "carpentryBaseboardEnabled", "carpentryCeilingHeight"], "완성 시공 범위와 자재·인력 포함 여부를 확인해 주세요. 투입 원가를 자동 중복 추가하지 않습니다.", ["WOOD_LABOR_WORKER", "WOOD_MACHINE_DAY", "WOOD_SUBSIDIARY"]);
    for (const [code, key] of [["INTERIOR_DOOR_MIDDLE", "middleDoorUnits"], ["INTERIOR_DOOR_STANDARD", "standardDoorUnits"], ["INTERIOR_DOOR_SLIDING", "slidingDoorUnits"]]) number(code, key, "실내 도어 직접 입력");
  }
  if (section("Furniture")) {
    for (const [gate, part, cabinets] of [
      ["baseEnabled", "주방", [["CABINET_LOWER", "lowerCabinetM"], ["CABINET_UPPER", "upperCabinetM"], ["CABINET_TALL", "tallCabinetM"]]],
      ["islandEnabled", "아일랜드", [["CABINET_ISLAND", "islandM"]]], ["shoeEnabled", "신발장", [["CABINET_SHOE", "shoeM"]]],
      ["fridgeLaundryEnabled", "냉장고·세탁실장", [["CABINET_FRIDGE_LAUNDRY", "fridgeLaundryM"]]], ["pantryEnabled", "팬트리", [["CABINET_PANTRY", "pantryM"]]],
      ["builtInEnabled", "붙박이장", [["CABINET_BUILT_IN_WARDROBE", "builtInM"]]], ["hangerEnabled", "행거장", [["CABINET_HANGER_WARDROBE", "hangerM"]]],
    ]) for (const [code, key] of cabinets) ja(code, key, `${part} 길이`, enabled(gate), positive(i[key]) ? `${i[key]}mm` : "", part);
    for (const [gate, key, code, part] of [
      ["baseEnabled", "riceCabinetUnits", "CABINET_RICE", "주방"], ["islandEnabled", "islandDrawers", "CABINET_DRAWER", "아일랜드"], ["homebarEnabled", "homebarDrawers", "CABINET_DRAWER", "홈바"], ["pantryEnabled", "pantryDrawerUnits", "CABINET_PANTRY_DRAWER", "팬트리"],
    ]) number(code, key, `${part} 개수`, enabled(gate), "", part);
    for (const [gate, prefix, part] of [["baseEnabled", "base", "주방"], ["islandEnabled", "island", "아일랜드"], ["homebarEnabled", "homebar", "홈바"], ["shoeEnabled", "shoe", "신발장"], ["fridgeLaundryEnabled", "fridgeLaundry", "냉장고·세탁실장"], ["builtInEnabled", "builtIn", "붙박이장"], ["hangerEnabled", "hanger", "행거장"]]) {
      number("LIGHT_LINE_CABINET", `${prefix}LightingUnits`, `${part} 라인조명`, enabled(gate), "", part);
      number("LIGHT_T3_CABINET", `${prefix}T3Units`, `${part} T3 조명`, enabled(gate), "", part);
    }
    if (enabled("islandEnabled") && enabled("islandBachmannOutletEnabled")) add("ELEC_BACHMANN_OUTLET", 1, ["islandEnabled", "islandBachmannOutletEnabled"], "아일랜드 콘센트 기본 1개", "option", "", "아일랜드");
    const composite = ["homebarEnabled", "baseCountertopEnabled", "islandEnabled", "homebarEnabled", "baseEndPanels", "shoeEndPanels", "pantryEndPanels", "builtInEndPanels"].filter(k => enabled(k) || positive(i[k]));
    if (composite.length) review("furniture", "상판·홈바·마감패널 구성", [...new Set(composite)], "원판·가공·시공 포함 범위, 깊이 및 세부 규격은 개별 확인이 필요합니다.");
    if (enabled("kitchenEnabled") || positive(i.kitchenCustomAppliancePrice)) {
      for (const [code, key] of [["KITCHEN_SINK_BOWL", "kitchenSinkBowlUnits"], ["KITCHEN_FAUCET", "kitchenFaucetUnits"], ["KITCHEN_HOOD", "kitchenHoodUnits"]]) number(code, key, "AND표준 주방 설비 개수");
      one("KITCHEN_STANDARD_INSTALL", "kitchenStandardInstallEnabled", "주방 설비 설치 기본 1식");
      if (positive(i.kitchenCustomAppliancePrice)) review("furniture", "주방 설비 직접 입력 금액", ["kitchenCustomAppliancePrice"], "직접 입력 총액의 제품별 내역을 확인해 주세요. 본견적 판매단가로 자동 복사하지 않습니다.");
    }
  }
  if (section("Finish")) {
    for (const [code, key] of [["MISC_EXISTING_PIPE_CLEANING", "existingPipeCleaningEnabled"], ["MISC_WASTE", "generalWasteEnabled"], ["MISC_PROTECTION", "interiorProtectionEnabled"], ["MISC_CLEANING", "moveInCleaningEnabled"], ["FINISH_SILICONE", "siliconeEnabled"], ["FINISH_ELASTIC_BASE", "elasticEnabled"]]) one(code, key, "가견적 선택 · 기본 1식");
    number("FINISH_ELASTIC_EXTRA_ROOM", "elasticExtraRooms", "탄성코트 추가 공간 수", enabled("elasticEnabled"));
  }
  if (enabled("windowNoticeEnabled")) review("finish", "창호·냉난방기 별도 견적", ["windowNoticeEnabled"], "별도 견적 경계를 유지합니다. 포함으로 자동 변경하지 않습니다.");
  const tradeLabels = { "철거": "demolition", "전기/조명": "electrical", "욕실": "bathroom", "도배": "wallpaper", "필름": "film", "바닥": "flooring", "목공": "carpentry", "가구": "furniture", "마감": "finish", "기타": "finish", "도어/창호": "carpentry" };
  for (const group of reference?.customerQuote?.groups || []) {
    const trade = tradeLabels[group.label];
    if (Number(group.total) > 0 && (!trade || (!rows.some(r => r.trade === trade) && !reviews.some(r => r.trade === trade)))) review(trade || "finish", `저장 가견적 ${group.label}`, [], `입력 근거가 부족하여 자동 연결하지 않았습니다. ${(group.items || []).map(r => r.name).join(", ")} 내용을 확인해 주세요.`);
  }
  const suggestions = reviews.filter(r => r.standardIds?.length === 1 && /std-WALLPAPER_ROLL_|std-FILM_WOOD_ROLL/.test(r.standardIds[0])).map(r => {
    const s = standardById(r.standardIds[0]), key = `review:${s.id}:${r.inputs.join("+")}`;
    r.suggestionKey = key;
    return { key, standardId: s.id, trade: s.trade, name: s.name, unit: s.unit, quantity: 0, spec: r.label, workScope: r.label.startsWith("공용부") ? "공용부" : r.label.startsWith("각방") ? "각방" : "",
      origin: { key, sourceId, mappingVersion: PRELIMINARY_MAPPING_VERSION, inputs: r.inputs, quantity: 0, unit: s.unit, kind: "review", label: `${r.label} · 원본 수량 미확정` } };
  });
  return { sourceId, mappingVersion: PRELIMINARY_MAPPING_VERSION, rows, reviews, suggestions };
}

export function preliminaryComparison(reference, summary) {
  const q = reference?.customerQuote?.total, header = reference?.header?.total_price;
  const known = reference?.schema_version === "5b1-public-v1" && typeof q === "number" && Number.isFinite(q) && q >= 0 && typeof header === "number" && Number.isFinite(header) && header === q;
  if (!known) return { comparable: false, referenceAmount: typeof q === "number" && Number.isFinite(q) ? q : null };
  const difference = summary.supply - q;
  return { comparable: true, referenceAmount: q, currentAmount: summary.supply, difference, rate: q > 0 ? difference / q : null };
}
