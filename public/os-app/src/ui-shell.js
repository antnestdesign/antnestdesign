import { roleLabel } from "./account-view.js";

export function createUiShell({ document, Node, ensureEstimateStatusControl, ensureSaveButtons, ensureAdminStandardCheckLists, ensureCostSnapshotPanel }) {
function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function labelTextFor(id, text) {
  const control = document.getElementById(id);
  const label = control?.closest("label");
  if (!label) return;
  const span = label.querySelector("span");
  if (span) {
    span.textContent = text;
    return;
  }
  const textNode = [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (textNode) {
    textNode.textContent = `${text} `;
  } else {
    label.insertBefore(document.createTextNode(`${text} `), control);
  }
}

function optionTextFor(id, value, text) {
  const select = document.getElementById(id);
  const option = [...(select?.options || [])].find((item) => item.value === value);
  if (option) option.textContent = text;
}

function textFor(selector, text) {
  const node = document.querySelector(selector);
  if (node) node.textContent = text;
}

function sectionTextFor(controlId, text) {
  const node = document.getElementById(controlId)?.closest(".section-heading")?.querySelector("p");
  if (node) node.textContent = text;
}

function repairStaticKoreanLabels() {
  ensureEstimateStatusControl();
  ensureSaveButtons();
  ensureAdminStandardCheckLists();
  ensureRateDbSaveButton();
  ensureCostSnapshotPanel();
  const labels = {
    projectName: "프로젝트명",
    areaPyeong: "평형",
    clientName: "고객성명",
    clientPhone: "연락처",
    estimateStatus: "상태",
    sectionDemolitionEnabled: "철거 및 인허가",
    demolitionFloorEnabled: "바닥",
    demolitionFloorMaterial: "바닥 재질",
    demolitionBathroomEnabled: "화장실",
    demolitionBathroomUnits: "화장실 개소",
    demolitionFurnitureEnabled: "가구",
    demolitionFurnitureM: "길이(mm)",
    demolitionCeilingEnabled: "천장",
    demolitionElevatorProtectEnabled: "E/V 보양",
    demolitionElevatorProtectRemovalEnabled: "E/V 보양 철거",
    demolitionPermitEnabled: "행위허가",
    demolitionConsentEnabled: "동의서",
    sectionElectricalEnabled: "전기",
    electricalEnabled: "전기 공정",
    electricalAgeType: "준공 연식",
    standardLightingEnabled: "AND 표준 조명",
    standardDownlightUnits: "다운라이트",
    standardSquareLightUnits: "사각매입등",
    standardCylinderLightUnits: "실린더등",
    standardT3M: "간접조명(T3) 길이(m)",
    standardBedWallLightEnabled: "침대 벽등",
    standardSwitchEnabled: "AND 표준 콘센트 스위치(르그랑 급)",
    sectionBathroomEnabled: "욕실",
    tileEnabled: "타일(AND표준 포세린)",
    tileGroutEnabled: "메지 포함",
    bathroomPlumbingRelocationEnabled: "욕실 설비 위치조정",
    bathroomFixtureGrade: "욕실 도기·수전 등급",
    bathroomUnits: "욕실 칸",
    bathroomFanType: "환풍기",
    bathroomBathtubUnits: "욕조",
    bathroomGlassBoothUnits: "유리파티션+유리문",
    bathroomGlassPartitionUnits: "유리파티션",
    bathroomMasonryWallUnits: "조적벽",
    sectionWallpaperEnabled: "도배",
    wallpaperPreset: "기준",
    wallpaperBaseCoatEnabled: "초배 포함",
    wallpaperPublicMaterialGrade: "공용부 자재 등급",
    wallpaperPublicWallLengthM: "공용부 벽 길이(mm)",
    wallpaperRoomMaterialGrade: "각방 자재 등급",
    wallpaperRoomWallLengthM: "각방 벽 길이(mm)",
    sectionFilmEnabled: "필름",
    filmPreset: "기준",
    filmMaterialLengthM: "필름 길이(mm)",
    sectionFlooringEnabled: "바닥",
    flooringArea: "면적(평)",
    flooringMaterialType: "바닥 종류",
    flooringSheetGrade: "장판 등급",
    flooringWoodGrade: "마루 등급",
    sectionCarpentryEnabled: "목공",
    carpentryCurtainBoxUnits: "커튼박스 신설(개소)",
    carpentryCofferType: "우물천장",
    carpentryDropCeilingUnits: "단내림 개소",
    carpentryIndirectLightUnits: "간접등 개소",
    carpentryCeilingFanUnits: "실링팬 개수",
    carpentryLineLightM: "천장 라인조명 길이(mm)",
    carpentryArtwallM: "목공벽/아트월 길이(mm)",
    carpentryPartitionM: "가벽(파티션) 길이(mm)",
    carpentryHiddenDoorUnits: "히든도어 개소",
    carpentryCeilingHeight: "천장고(mm)",
    carpentryTvUnits: "벽걸이 TV 보강",
    carpentryMoldingEnabled: "몰딩",
    carpentryBaseboardEnabled: "걸레받이",
    middleDoorUnits: "중문",
    standardDoorUnits: "일반도어",
    slidingDoorUnits: "슬라이딩도어",
    windowNoticeEnabled: "창호 별도 실측 후 견적",
    sectionFurnitureEnabled: "가구",
    baseEnabled: "상하부장",
    lowerCabinetM: "하부장 길이(mm)",
    upperCabinetM: "상부장 길이(mm)",
    tallCabinetM: "키큰장 길이(mm)",
    riceCabinetUnits: "밥솥장",
    baseEndPanels: "EP 마감판",
    baseEpDepth: "EP 깊이",
    baseCountertopEnabled: "상하부장 상판 적용",
    baseCountertop: "상하부장 상판 등급",
    baseLightingUnits: "라인조명 통수",
    baseT3Units: "간접조명(T3) 라인",
    islandEnabled: "아일랜드",
    islandM: "가로길이(mm)",
    islandDepthMm: "세로길이(mm)",
    islandCountertop: "상판",
    islandSideFinish: "좌우마감재",
    islandSideFinishCount: "좌우마감재 수량",
    islandDrawers: "서랍",
    islandRiceCabinetEnabled: "밥솥장 추가",
    islandBachmannOutletEnabled: "바흐만 2구 콘센트",
    islandLightingUnits: "라인조명 통수",
    islandT3Units: "간접조명(T3) 라인",
    kitchenEnabled: "주방설비",
    kitchenSinkBowlUnits: "싱크볼",
    kitchenFaucetUnits: "싱크수전",
    kitchenHoodUnits: "후드",
    kitchenCustomAppliancePrice: "싱크볼·싱크수전·후드 직접입력 금액",
    kitchenStandardInstallEnabled: "AND 표준설비 설치",
    homebarEnabled: "홈바장",
    homebarM: "길이(mm)",
    homebarCountertop: "상판",
    homebarMidway: "미드웨이",
    homebarDrawers: "서랍",
    homebarEndPanels: "EP 마감판",
    homebarEpDepth: "EP 깊이",
    homebarLightingUnits: "라인조명 통수",
    homebarT3Units: "간접조명(T3) 라인",
    shoeEnabled: "신발장",
    shoeM: "길이(mm)",
    shoeDepth: "깊이",
    shoeEndPanels: "EP 마감판",
    shoeLightingUnits: "라인조명 통수",
    shoeT3Units: "간접조명(T3) 라인",
    fridgeLaundryEnabled: "냉장고 및 세탁기장",
    fridgeLaundryM: "길이(mm)",
    fridgeLaundryDepth: "깊이",
    fridgeLaundryEndPanels: "EP 마감판",
    fridgeLaundryLightingUnits: "라인조명 통수",
    fridgeLaundryT3Units: "간접조명(T3) 라인",
    pantryEnabled: "팬트리장",
    pantryM: "길이(mm)",
    pantryDepth: "깊이",
    pantryEndPanels: "EP 마감판",
    pantryDrawerUnits: "하부서랍장",
    builtInEnabled: "옷장(붙박이장)",
    builtInM: "길이(mm)",
    builtInDepth: "깊이",
    builtInEndPanels: "EP 마감판",
    builtInLightingUnits: "라인조명 통수",
    builtInT3Units: "간접조명(T3) 라인",
    hangerEnabled: "옷장(헹거장)",
    hangerM: "길이(mm)",
    hangerDepth: "깊이",
    hangerLightingUnits: "라인조명 통수",
    hangerT3Units: "간접조명(T3) 라인",
    sectionFinishEnabled: "마감",
    generalWasteEnabled: "일반 폐기물",
    interiorProtectionEnabled: "세대 내 보양비",
    moveInCleaningEnabled: "입주청소",
    existingPipeCleaningEnabled: "기존 배관 청소 추가 (+300,000원)",
    siliconeEnabled: "실리콘",
    elasticEnabled: "탄성(기본 2개소)",
    elasticExtraRooms: "탄성 추가 개소",
    targetMargin: "목표 원가 가산율(%)",
    manualAdjustment: "고객가 수동 보정",
    baseCorrection: "가구 보정률(%)",
    islandCorrection: "아일랜드 보정률(%)",
    homebarCorrection: "홈바장 보정률(%)",
    countertopCorrection: "상판 보정률(%)",
    optionCorrection: "옵션 보정률(%)",
  };

  Object.entries(labels).forEach(([id, text]) => labelTextFor(id, text));

  textFor("#client .option-panel > .section-heading h2", "고객상담 입력");
  textFor("#client .option-panel > .section-heading p", "프로젝트 정보와 공정 선택값을 입력합니다.");
  sectionTextFor("sectionDemolitionEnabled", "바닥, 화장실, 가구, 천장 철거와 인허가 항목을 선택합니다.");
  sectionTextFor("sectionElectricalEnabled", "전기 시공과 AND 표준 조명을 선택합니다.");
  sectionTextFor("sectionBathroomEnabled", "욕실 공사와 AND 표준 포세린 타일을 선택합니다.");
  sectionTextFor("sectionWallpaperEnabled", "도배 기준과 자재 등급을 선택합니다.");
  sectionTextFor("sectionFilmEnabled", "필름 기준과 시공 범위를 선택합니다.");
  sectionTextFor("sectionFlooringEnabled", "바닥 마루 등급과 시공 면적을 입력합니다.");
  sectionTextFor("sectionCarpentryEnabled", "천장, 간접, 벽체, 도어 목공 항목을 입력합니다.");
  sectionTextFor("sectionFurnitureEnabled", "가구를 mm 단위로 입력하고 옵션을 선택합니다.");
  sectionTextFor("sectionFinishEnabled", "폐기물, 보양, 청소, 실리콘, 탄성 항목을 선택합니다.");
  textFor(".summary-card h2", "상담 선택 요약");
  textFor(".summary-card > p", "현재 선택한 항목을 확인합니다.");
  const wallDoorBlock = document.getElementById("carpentryArtwallM")?.closest(".furniture-block");
  const wallDoorTitle = wallDoorBlock?.querySelector(".check-title span");
  if (wallDoorTitle) wallDoorTitle.textContent = "벽체/도어 목공";
  const selectionCount = document.getElementById("selectionCount");
  const selectionLead = selectionCount?.closest("div")?.querySelector("p");
  if (selectionLead) selectionLead.textContent = "상담 선택 요약";

  const options = {
    demolitionFloorMaterial: { wood: "마루", vinyl: "장판", decoTile: "데코타일" },
    electricalAgeType: { under10: "준공 10년 이하", over10: "준공 10년 이상" },
    bathroomFanType: { normal: "일반 환풍기", hugent: "휴젠트" },
    bathroomFixtureGrade: { value: "AND 실속(대림급)", standard: "AND 표준(아메리칸 스탠다드급)", premium: "AND 고급(수전 그로헤급)" },
    wallpaperPreset: { p20: "20평대", p30: "30평대", p40: "40평대", p50: "50평 이상" },
    wallpaperPublicMaterialGrade: { besti: "베스띠급", diamant: "디아망급", fortis: "디아망 포티스급" },
    wallpaperRoomMaterialGrade: { besti: "베스띠급", diamant: "디아망급", fortis: "디아망 포티스급" },
    filmPreset: { p20: "20평대", p30: "30평대", p40: "40평대", p50: "50평 이상" },
    carpentryCofferType: { none: "없음", new: "신설", change: "변경" },
    riceCabinetUnits: { 0: "없음", 1: "600mm 1통", 2: "600mm 2통" },
    baseEndPanels: { 0: "없음", 1: "1장", 2: "2장", 3: "3장" },
    baseEpDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    baseCountertop: { himacs: "하이막스", khanstone: "칸스톤", ceramic: "세라믹", epPanel: "EP판" },
    islandCountertop: { himacs: "하이막스", khanstone: "칸스톤", ceramic: "세라믹", epPanel: "EP판" },
    islandSideFinish: { epPanel: "EP판", himacs: "하이막스", khanstone: "칸스톤", ceramic: "세라믹" },
    homebarCountertop: { himacs: "하이막스", khanstone: "칸스톤", ceramic: "세라믹", epPanel: "EP판" },
    homebarMidway: { none: "없음", epPanel: "EP판", himacs: "하이막스", khanstone: "칸스톤", ceramic: "세라믹" },
    homebarEpDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    shoeDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    fridgeLaundryDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    pantryDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    builtInDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
    hangerDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
  };

  Object.entries(options).forEach(([id, values]) =>
    Object.entries(values).forEach(([value, text]) => optionTextFor(id, value, text))
  );

  textFor("#saveEstimateButton", "견적 수정");
  textFor("#selectionCount", "0개 선택");
  textFor(".excluded-work strong", "포함되지 않은 공정");
  document.querySelectorAll(".excluded-work li").forEach((item, index) => {
    const items = ["창호", "시스템에어컨", "가전제품", "인덕션", "식기세척기", "냉장고", "정수기", "고객 지급 자재", "기타 별도공사"];
    if (items[index]) item.textContent = items[index];
  });
  [
    ["#cabinetSummary", "상하부장"],
    ["#islandSummary", "아일랜드"],
    ["#homebarSummary", "홈바장"],
    ["#shoeSummary", "신발장"],
    ["#fridgeLaundrySummary", "냉장고장"],
    ["#pantrySummary", "팬트리장"],
    ["#builtInSummary", "붙박이장"],
    ["#hangerSummary", "헹거장"],
    ["#demolitionSummary", "철거"],
    ["#electricalSummary", "전기공사"],
    ["#lightingSummary", "AND 표준 조명"],
    ["#clientTotal", "견적 총액"],
  ].forEach(([selector, text]) => {
    const dt = document.querySelector(selector)?.previousElementSibling;
    if (dt) dt.textContent = text;
  });

  const rateLabels = {
    rateLowerPerJa: "하부장 자당",
    rateUpperPerJa: "상부장 자당",
    rateIslandPerJa: "아일랜드 자당",
    rateHomebarBuildPerJa: "홈바장 자당",
    rateTallPerJa: "키큰장 자당",
    rateFridgeLaundryPerJa: "냉장고 및 세탁기장 자당",
    rateShoePerJa: "신발장 자당",
    ratePantryPerJa: "팬트리장 자당",
    ratePantryDrawer: "팬트리장 하부서랍장 1개",
    rateBuiltInPerJa: "옷장(붙박이장) 자당",
    rateHangerPerJa: "옷장(헹거장) 자당",
    rateRiceCabinetPerUnit: "밥솥장 1통",
    rateEndPanelShallow: "EP 400mm 이하",
    rateEndPanelDeep: "EP 400mm 초과",
    rateDrawer: "서랍 1개",
    rateBachmannOutlet: "바흐만 2구 콘센트",
    rateLightingPerCabinetUnit: "라인조명 1통",
    rateT3LightingUnit: "간접조명(T3) 1라인",
    rateStandardDownlight: "다운라이트 1개",
    rateStandardSquareLight: "사각매입등 1개",
    rateStandardCylinderLight: "실린더등 1개",
    rateStandardT3PerM: "간접조명(T3) 1m",
    rateStandardBedWallLight: "침대 벽등",
    rateHimacsPerM: "하이막스 1,000mm",
    rateKhanstoneSlab: "칸스톤 12T 1장",
    rateKhanstoneFactory: "칸스톤 공장가공비",
    rateKhanstoneInstall: "칸스톤 현장시공비",
    rateCeramicSlab: "세라믹 1장",
    rateCeramicFactory: "세라믹 공장가공비",
    rateCeramicInstall: "세라믹 현장시공비",
    rateEpPanelPerM: "EP 상판/미드웨이 1,000mm",
    rateDemolitionFloorPerPyeong: "마루철거 평당",
    rateDemolitionDecoTilePerPyeong: "데코타일 철거 평당",
    rateDemolitionFurniturePerJa: "가구철거 자당",
    rateDemolitionBathroomWaterproof: "화장실 철거 및 방수",
    rateDemolitionCeilingPerPyeong: "천장철거 평당",
    rateDemolitionElevatorProtect: "E/V 보양",
    rateDemolitionElevatorProtectRemoval: "E/V 보양 철거",
    rateDemolitionPermit: "행위허가",
    rateDemolitionConsent: "동의서",
    rateElectricalWorkerDay: "전기 기공 1품",
    rateElectricalHelperDay: "전기 조공 1품",
    rateElectricalUnder10Days: "준공 10년 이하 품수",
    rateElectricalOver10Days: "준공 10년 이상 품수",
    rateElectricalWiring: "전기 배선비",
    rateElectricalStandardSwitch: "AND 표준 콘센트 스위치",
    rateTileWorkerDay: "타일 기공 1품",
    rateTileHelperDay: "타일 조공 1품",
    rateTileGrout: "타일 메지",
    rateBathroomPorcelainTileMaterial: "욕실 포세린 타일 자재+잡자재",
    rateBathroomPlumbingRelocation: "욕실 설비 위치조정",
    rateBathroomFixtureSet: "욕실 도기·수전 기본세트",
    rateBathroomFixtureInstall: "욕실 도기·수전 설치비",
    rateBathroomSmcCeiling: "SMC 천장돔 설치비",
    rateBathroomFanNormal: "일반 환풍기",
    rateBathroomHugentMachine: "휴젠트 본체",
    rateBathroomHugentInstallExtra: "휴젠트 추가 설치비",
    rateBathroomBathtub: "욕조",
    rateBathroomGlassBooth: "유리파티션+유리문",
    rateBathroomGlassPartition: "유리파티션",
    rateWallpaperWorkerDay: "도배 1품",
    rateWallpaperBesti: "도배지 베스띠 1롤",
    rateWallpaperDiamant: "도배지 디아망 1롤",
    rateWallpaperFortis: "도배지 디아망 포티스 1롤",
    rateWallpaperMaterialPerPyeong: "도배 잡자재 평당",
    rateFilmWorkerDay: "필름 1품",
    rateFlooringPerPyeong: "마루 LX 에디톤급 평단가",
    rateFlooringSheetT18: "장판 1.8T 평단가",
    rateFlooringSheetT20: "장판 2T 평단가",
    rateFlooringSheetT22: "장판 2.2T 평단가",
    rateFlooringSheetT32: "장판 3.2T 평단가",
    rateFlooringSheetT45: "장판 4.5T 평단가",
    rateFlooringSheetT50: "장판 5T 평단가",
    rateFlooringWoodStandard: "일반마루 평단가",
    rateKitchenSinkBowl: "주방 싱크볼",
    rateKitchenFaucet: "주방 싱크수전",
    rateKitchenHood: "주방 후드",
    rateKitchenStandardInstall: "주방 AND 표준설비 설치비",
    rateExistingPipeCleaning: "기존 배관 청소",
    rateSilicone: "실리콘 기본",
    rateElasticBase: "탄성 기본",
    rateElasticExtraRoom: "탄성 추가 1개소",
    rateCarpentryWorkerDay: "목공 1품",
    rateCarpentryMachineDay: "목공 기계품 1품",
    rateCarpentryLifting: "목공 양중",
    rateCarpentrySubsidiary: "목공 부자재",
    rateCarpentryCeilingFanUnit: "실링팬 1개소",
    rateCarpentryDrywallSheet: "석고보드 1장",
    rateCarpentryMdfSheet: "MDF 1장",
    rateCarpentryPlywoodSheet: "합판 1장",
    rateCarpentryStudBundle: "다루끼 1묶음",
  };
  const rateCategories = {
    rateLowerPerJa: "가구",
    rateUpperPerJa: "가구",
    rateIslandPerJa: "가구",
    rateHomebarBuildPerJa: "가구",
    rateTallPerJa: "가구",
    rateFridgeLaundryPerJa: "가구",
    rateShoePerJa: "가구",
    ratePantryPerJa: "가구",
    ratePantryDrawer: "가구",
    rateBuiltInPerJa: "가구",
    rateHangerPerJa: "가구",
    rateRiceCabinetPerUnit: "가구",
    rateEndPanelShallow: "가구",
    rateEndPanelDeep: "가구",
    rateDrawer: "가구",
    rateBachmannOutlet: "가구",
    rateLightingPerCabinetUnit: "가구",
    rateT3LightingUnit: "가구",
    rateStandardDownlight: "전기",
    rateStandardSquareLight: "전기",
    rateStandardCylinderLight: "전기",
    rateStandardT3PerM: "전기",
    rateStandardBedWallLight: "전기",
    rateHimacsPerM: "상판",
    rateKhanstoneSlab: "상판",
    rateKhanstoneFactory: "상판",
    rateKhanstoneInstall: "상판",
    rateCeramicSlab: "상판",
    rateCeramicFactory: "상판",
    rateCeramicInstall: "상판",
    rateEpPanelPerM: "상판",
    rateDemolitionFloorPerPyeong: "철거",
    rateDemolitionDecoTilePerPyeong: "철거",
    rateDemolitionFurniturePerJa: "철거",
    rateDemolitionBathroomWaterproof: "철거",
    rateDemolitionCeilingPerPyeong: "철거",
    rateDemolitionElevatorProtect: "철거",
    rateDemolitionElevatorProtectRemoval: "철거",
    rateDemolitionPermit: "인허가",
    rateDemolitionConsent: "인허가",
    rateElectricalWorkerDay: "전기",
    rateElectricalHelperDay: "전기",
    rateElectricalUnder10Days: "전기",
    rateElectricalOver10Days: "전기",
    rateElectricalWiring: "전기",
    rateElectricalStandardSwitch: "전기",
    rateTileWorkerDay: "타일",
    rateTileHelperDay: "타일",
    rateTileGrout: "타일",
    rateBathroomPorcelainTileMaterial: "욕실",
    rateBathroomPlumbingRelocation: "욕실",
    rateBathroomFixtureSet: "욕실",
    rateBathroomFixtureInstall: "욕실",
    rateBathroomSmcCeiling: "욕실",
    rateBathroomFanNormal: "욕실",
    rateBathroomHugentMachine: "욕실",
    rateBathroomHugentInstallExtra: "욕실",
    rateBathroomBathtub: "욕실",
    rateBathroomGlassBooth: "욕실",
    rateBathroomGlassPartition: "욕실",
    rateWallpaperWorkerDay: "도배",
    rateWallpaperBesti: "도배",
    rateWallpaperDiamant: "도배",
    rateWallpaperFortis: "도배",
    rateWallpaperMaterialPerPyeong: "도배",
    rateFilmWorkerDay: "필름",
    rateFlooringPerPyeong: "바닥",
    rateFlooringSheetT18: "바닥",
    rateFlooringSheetT20: "바닥",
    rateFlooringSheetT22: "바닥",
    rateFlooringSheetT32: "바닥",
    rateFlooringSheetT45: "바닥",
    rateFlooringSheetT50: "바닥",
    rateFlooringWoodStandard: "바닥",
    rateKitchenSinkBowl: "가구",
    rateKitchenFaucet: "가구",
    rateKitchenHood: "가구",
    rateKitchenStandardInstall: "가구",
    rateExistingPipeCleaning: "마감",
    rateSilicone: "마감",
    rateElasticBase: "마감",
    rateElasticExtraRoom: "마감",
    rateCarpentryWorkerDay: "목공",
    rateCarpentryMachineDay: "목공",
    rateCarpentryLifting: "목공",
    rateCarpentrySubsidiary: "목공",
    rateCarpentryCeilingFanUnit: "목공",
    rateCarpentryDrywallSheet: "목공",
    rateCarpentryMdfSheet: "목공",
    rateCarpentryPlywoodSheet: "목공",
    rateCarpentryStudBundle: "목공",
  };
  const categorizedRateLabel = (category, text) => {
    if (!category) return text;
    const duplicatePrefix = new RegExp(`^${category}\\s*`);
    if (duplicatePrefix.test(text)) return `(${category}) ${text.replace(duplicatePrefix, "")}`;
    return `(${category})${text}`;
  };
  Object.entries(rateLabels).forEach(([id, text]) => labelTextFor(id, categorizedRateLabel(rateCategories[id], text)));

  textFor("#internal .internal-summary-card h2", "내부 요약");
  [
    ["#internalCost", "직접원가"],
    ["#internalRevenue", "고객가"],
    ["#internalProfit", "예상마진"],
    ["#internalMargin", "마진율"],
    ["#discountRoom", "할인 가능 금액"],
    ["#marginStatus", "목표 원가 가산율 상태"],
  ].forEach(([selector, text]) => {
    const dt = document.querySelector(selector)?.previousElementSibling;
    if (dt) dt.textContent = text;
  });
  const standardSections = [
    ["standardSelectedItems", ["견적내역 확인", "선택 항목, 미선택 항목, 별도 확인 항목을 구분합니다.", "선택 항목", "미선택 항목", "별도 확인"]],
    ["adminStandardSelectedItems", ["견적내역 확인", "선택 항목, 미선택 항목, 별도 확인 항목을 구분합니다.", "선택 항목", "미선택 항목", "별도 확인"]],
  ];
  standardSections.forEach(([id, texts]) => {
    const section = document.getElementById(id)?.closest(".internal-card");
    if (!section) return;
    const heading = section.querySelector(".section-heading h2");
    const paragraph = section.querySelector(".section-heading p");
    const headings = section.querySelectorAll(".standard-check-grid h3");
    if (heading) heading.textContent = texts[0];
    if (paragraph) paragraph.textContent = texts[1];
    headings.forEach((item, index) => {
      item.textContent = texts[index + 2] || item.textContent;
    });
  });
  const costTable = document.querySelector("#internal .cost-table tbody");
  if (costTable) {
    const rows = [
      ["하부장", "자당 120,000원, 300mm 단위 올림"],
      ["상부장", "자당 90,000원, 300mm 단위 올림"],
      ["키큰장", "자당 130,000원, 300mm 단위 올림"],
      ["밥솥장", "600mm 1통 560,000원"],
      ["상판", "하이막스 220,000원/1,000mm, 칸스톤/세라믹 장당+가공+시공 기준"],
      ["서랍", "아일랜드/홈바장 수량 입력, 개당 60,000원"],
      ["EP 마감판", "400mm 이하 90,000원, 400mm 초과 130,000원"],
      ["조명", "라인조명 1통 240,000원, 간접조명(T3) 1라인 50,000원"],
      ["마감", "실리콘 기본, 탄성 기본 및 추가 개소 기준"],
      ["목공", "인건비, 기계품, 부자재, 양중, 자재 산출 기준"],
    ];
    costTable.innerHTML = rows.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join("");
  }
  const detailSections = document.querySelectorAll("#internal .detail-card, #admin .detail-card");
  detailSections.forEach((section) => {
    if (section.querySelector("#internalDetailRows, #adminInternalDetailRows")) {
      const heading = section.querySelector(".section-heading h2");
      const paragraph = section.querySelector(".section-heading p");
      if (heading) heading.textContent = "상세견적";
      if (paragraph) paragraph.textContent = "원가, 고객가, 마진, 보정률, 단가, 상세 산출 내역";
      section.querySelectorAll("th").forEach((cell, index) => {
        const headers = ["항목", "입력", "산출", "단가", "직접원가", "보정률", "고객가", "마진"];
        if (headers[index]) cell.textContent = headers[index];
      });
    }
  });
  const adminQuoteSection = document.getElementById("adminQuoteRows")?.closest(".detail-card");
  if (adminQuoteSection) {
    const heading = adminQuoteSection.querySelector(".section-heading h2");
    const paragraph = adminQuoteSection.querySelector(".section-heading p");
    if (heading) heading.textContent = "내부견적";
    if (paragraph) paragraph.textContent = "공정별 고객용 금액, 내부 원가, 마진을 확인합니다.";
    const headerRow = adminQuoteSection.querySelector("thead tr");
    if (headerRow) {
      headerRow.innerHTML = `
        <th>공정</th>
        <th>고객용</th>
        <th>내부용</th>
        <th>마진</th>
        <th>마진율</th>
      `;
    }
  }
  const adminPanel = document.getElementById("admin");
  const savedList = document.getElementById("savedEstimateRows")?.closest(".internal-card");
  if (adminPanel && savedList && !document.getElementById("adminPrintActions")) {
    const actions = document.createElement("section");
    actions.className = "internal-card admin-print-actions";
    actions.id = "adminPrintActions";
    actions.innerHTML = `
      <div class="section-heading compact-heading no-side-padding">
        <h2>관리용 출력</h2>
        <p>현재 열려 있는 프로젝트의 관리용 상세견적, 내부견적, 발주내역을 출력합니다.</p>
      </div>
      <div class="admin-action-row">
        <button id="printAdminDetailButton" type="button">상세견적 출력</button>
        <button id="printAdminInternalButton" type="button">내부견적 출력</button>
        <button id="printPurchaseOrderButton" type="button">발주내역 출력</button>
      </div>
    `;
    savedList.insertAdjacentElement("afterend", actions);
  }
  const standardSection = document.getElementById("adminStandardSelectedItems")?.closest(".internal-card");
  if (adminPanel && standardSection && !document.getElementById("purchaseOrderRows")) {
    const orderSection = document.createElement("section");
    orderSection.className = "internal-card detail-card admin-only";
    orderSection.innerHTML = `
      <div class="section-heading compact-heading">
        <h2>발주내역서</h2>
        <p>발주가 필요한 자재와 품목을 정리합니다.</p>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>공정</th>
              <th>품목</th>
              <th>사양</th>
              <th>수량</th>
              <th>예상 원가</th>
            </tr>
          </thead>
          <tbody id="purchaseOrderRows"></tbody>
        </table>
      </div>
      <div id="purchaseOrderSummary" class="quote-total-list"></div>
    `;
    standardSection.insertAdjacentElement("afterend", orderSection);
  }
  const adminDb = document.querySelector("#admin .admin-db-card");
  if (adminDb) {
    textFor("#admin .admin-db-card h2", "원가 관리");
    textFor("#admin .admin-db-card p", "기준 단가와 보정률은 관리 화면에서만 수정합니다.");
  }
  const management = document.getElementById("targetMargin")?.closest(".internal-card");
  if (management) {
    const heading = management.querySelector(".section-heading h2");
    const paragraph = management.querySelector(".section-heading p");
    if (heading) heading.textContent = "관리기준";
    if (paragraph) paragraph.textContent = "마진, 보정률, 원가 관리 기준을 관리합니다.";
  }
  [
    "clientTotal",
    "internalCost",
    "internalRevenue",
    "internalProfit",
    "discountRoom",
    "adminInternalCost",
    "adminInternalRevenue",
    "adminInternalProfit",
    "adminDiscountRoom",
  ].forEach((id) => {
    const node = document.getElementById(id);
    if (node && node.textContent.includes("/dd")) node.textContent = "0원";
  });
  ["marginStatus", "adminMarginStatus"].forEach((id) => {
    const node = document.getElementById(id);
    if (node && /[濡遺寃怨湲援媛諛紐筌獄揶]|�|\?\?/.test(node.textContent)) node.textContent = "정상";
  });
}

function ensureRateDbSaveButton() {
  const adminDb = document.querySelector("#admin .admin-db-card");
  if (!adminDb || document.getElementById("saveRateDbButton")) return;
  const actions = document.createElement("div");
  actions.className = "admin-action-row";
  actions.innerHTML = `
    <button id="saveRateDbButton" type="button">원가 관리 저장</button>
    <span id="rateDbSaveStatus" class="status-text"></span>
  `;
  adminDb.appendChild(actions);
}

function removeDuplicateManagementCriteriaBlock() {
  const block = document.getElementById("targetMargin")?.closest(".internal-card");
  if (block) block.remove();
}

function removeLegacyAdminEstimatePanels() {
  [
    "adminQuoteRows",
    "adminInternalCost",
    "adminInternalDetailRows",
  ].forEach((id) => {
    const block = document.getElementById(id)?.closest(".internal-card");
    if (block) block.remove();
  });
}

function activateTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("active", item.dataset.tab === tabId));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function renderStaffAdminShell(staffAdminShellApplied = false) {
  if (staffAdminShellApplied) return true;
  const adminPanel = document.getElementById("admin");
  if (!adminPanel) return staffAdminShellApplied;
  adminPanel.innerHTML = `
    <section class="internal-card staff-admin-card">
      <div class="section-heading compact-heading no-side-padding">
        <h2>저장된 견적 리스트</h2>
        <p>고객 공개용 견적만 확인합니다.</p>
      </div>
      <div class="table-wrap">
        <table class="saved-table">
          <thead>
            <tr>
              <th>프로젝트명</th>
              <th>고객명</th>
              <th>연락처</th>
              <th>평형</th>
              <th>상태</th>
              <th>고객견적 총액</th>
              <th>작성일</th>
              <th>열기</th>
            </tr>
          </thead>
          <tbody id="savedEstimateRows"></tbody>
        </table>
      </div>
    </section>
    <section class="internal-card staff-admin-card">
      <div class="section-heading compact-heading no-side-padding">
        <h2>고객용 상세견적</h2>
        <p>상세견적 탭에서 고객 공개용 견적서를 확인하고 출력합니다.</p>
      </div>
      <div class="admin-action-row">
        <button id="staffOpenClientQuoteButton" type="button">고객용 상세견적 열기</button>
        <button id="staffPrintClientQuoteButton" type="button">고객용 상세견적 출력</button>
      </div>
    </section>
  `;
  return true;
}

function ensurePasswordChangeShell() {
  if (document.getElementById("passwordChangeScreen")) return;
  const section = document.createElement("section");
  section.className = "login-screen password-change-screen";
  section.id = "passwordChangeScreen";
  section.hidden = true;
  section.innerHTML = `
    <form class="login-card password-change-card" id="passwordChangeForm">
      <p class="eyebrow">AND OS</p>
      <h1>비밀번호 변경</h1>
      <p>처음 로그인했거나 초기 비밀번호가 재설정되었습니다.</p>
      <label>
        새 비밀번호
        <input autocomplete="new-password" id="newOwnPassword" required type="password">
      </label>
      <label>
        새 비밀번호 확인
        <input autocomplete="new-password" id="newOwnPasswordConfirm" required type="password">
      </label>
      <button class="primary-action" type="submit">비밀번호 변경</button>
      <button class="secondary-action" id="passwordChangeLogoutButton" type="button">로그아웃</button>
      <p aria-live="polite" class="status-text" id="passwordChangeStatus"></p>
    </form>
  `;
  document.body.insertBefore(section, document.getElementById("appShell"));
}

function setPasswordChangeRequired(required, hasSession) {
  ensurePasswordChangeShell();
  const screen = document.getElementById("passwordChangeScreen");
  document.getElementById("loginScreen").hidden = required || hasSession;
  if (screen) screen.hidden = !required;
  document.getElementById("appShell").classList.toggle("app-locked", required);
}

function clearPasswordChangeInputs() {
  const password = document.getElementById("newOwnPassword");
  const confirm = document.getElementById("newOwnPasswordConfirm");
  if (password) password.value = "";
  if (confirm) confirm.value = "";
}

function applyAccessControl({ currentProfile, isStaff, isManager, isAdmin, removeSystemManagementShell, renderStaffAdminShell, removePrivilegedManagementShell, ensureSystemManagementShell, ensureContractPackagePanel }) {
  const role = currentProfile?.role || "staff";
  document.body.dataset.role = role;
  setText("currentUserLabel", `${currentProfile?.email || "-"} · ${roleLabel(role)}`);
  if (isStaff()) {
    document.querySelectorAll(".admin-only").forEach((node) => node.remove());
    removeSystemManagementShell();
    renderStaffAdminShell();
  } else if (isManager()) {
    document.querySelectorAll(".admin-only").forEach((node) => node.remove());
    removePrivilegedManagementShell();
    renderStaffAdminShell();
    ensureSystemManagementShell();
  } else {
    document.querySelectorAll(".admin-only").forEach((node) => {
      node.hidden = false;
    });
    document.querySelector("#admin .admin-db-card")?.remove();
    ensureSystemManagementShell();
  }
  ensureContractPackagePanel();
  if (!isAdmin() && document.getElementById("internal")?.classList.contains("active")) {
    activateTab("client");
  }
}

function setAuthenticated(isAuthenticated) {
  document.getElementById("loginScreen").hidden = isAuthenticated;
  const passwordScreen = document.getElementById("passwordChangeScreen");
  if (passwordScreen) passwordScreen.hidden = true;
  document.getElementById("appShell").classList.toggle("app-locked", !isAuthenticated);
}

function removePrivilegedManagementShell() {
  document.getElementById("userManagementCard")?.remove();
  document.getElementById("auditLogCard")?.remove();
}

function bindNavigation(onNavigate) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => onNavigate(button.dataset.tab));
  });
}

function bindPasswordChangeShell({ onSubmit, onLogout }) {
  ensurePasswordChangeShell();
  document.getElementById("passwordChangeForm")?.addEventListener("submit", onSubmit);
  document.getElementById("passwordChangeLogoutButton")?.addEventListener("click", onLogout);
}

return { repairStaticKoreanLabels, removeDuplicateManagementCriteriaBlock, removeLegacyAdminEstimatePanels, activateTab, renderStaffAdminShell, ensurePasswordChangeShell, setPasswordChangeRequired, clearPasswordChangeInputs, applyAccessControl, setAuthenticated, removePrivilegedManagementShell, bindNavigation, bindPasswordChangeShell };
}
