import { bathroomRates } from "./rates/bathroom.js";
import { kitchenRates } from "./rates/kitchen.js";
import { doorRates } from "./rates/door.js";
import { finishMaterialRates } from "./rates/finish.js";
import { miscRates } from "./rates/misc.js";
import { bathroomDetails } from "./calculator/bathroom.js";
import { kitchenDetails } from "./calculator/kitchen.js";
import { doorDetails } from "./calculator/door.js";
import { wallpaperMaterialDetail, filmMaterialDetail } from "./calculator/finish.js";
import { miscDetails } from "./calculator/misc.js";
import {
  saveEstimate,
  loadEstimates,
  getEstimate,
  deleteEstimate,
  signIn,
  signOut,
  loadStoredSession,
  loadProfile,
  getAuthSession,
} from "./storage.js";

const rates = {
  lowerPerJa: 120000,
  upperPerJa: 90000,
  islandPerJa: 180000,
  homebarStorageBaseJa: 3,
  homebarBuildPerJa: 210000,
  tallPerJa: 130000,
  storagePerJa: 130000,
  fridgeLaundryPerJa: 90000,
  shoePerJa: 80000,
  pantryPerJa: 65000,
  pantryDrawer: 270000,
  builtInPerJa: 160000,
  hangerPerJa: 90000,
  riceCabinetPerUnit: 560000,
  endPanelShallow: 90000,
  endPanelDeep: 130000,
  drawer: 60000,
  bachmannOutlet: 160000,
  lightingPerCabinetUnit: 240000,
  t3LightingUnit: 50000,
  standardLighting: {
    downlight: 10000,
    square: 35000,
    cylinder: 30000,
    t3PerM: 10000,
    bedWallLight: 200000,
  },
  demolition: {
    floorPerPyeong: 30000,
    decoTilePerPyeong: 15000,
    furniturePerJa: 25000,
    bathroomWaterproof: 800000,
    ceilingPerPyeong: 160000,
    elevatorProtect: 150000,
    elevatorProtectRemoval: 50000,
    permit: 200000,
    consent: 150000,
  },
  electrical: {
    workerDay: 300000,
    helperDay: 250000,
    under10YearsDays: 6,
    over10YearsDays: 8,
    wiring: 600000,
    standardSwitch: 400000,
  },
  finish: {
    tileWorkerDay: 350000,
    tileHelperDay: 280000,
    tileGrout: 350000,
    wallpaperWorkerDay: 300000,
    filmWorkerDay: 280000,
    flooringPerPyeong: 180000,
    silicone: 350000,
    elasticBase: 650000,
    elasticExtraRoom: 250000,
  },
  carpentry: {
    workerDay: 300000,
    machineDay: 150000,
    lifting: 200000,
    subsidiary: 150000,
    curtainBoxDaysPerTwo: 1,
    cofferNewDays: 2,
    cofferChangeDays: 1.5,
    artwallDaysPerM: 0.3,
    hiddenDoorDays: 1,
    lineLightDaysPerM: 0.1,
    indirectLightDays: 0.1,
    ceilingFanUnit: 500000,
    dropCeilingDays: 0.5,
    moldingDays: 2,
    baseboardDays: 1,
    boardWidth: 2400,
    boardHeight: 1200,
    studSpacing: 450,
    studPieceLength: 3600,
    studPiecesPerBundle: 12,
    wasteFactor: 1.15,
    drywallSheet: 4500,
    mdfSheet: 12500,
    plywoodSheet: 30000,
    studBundle: 22000,
  },
  countertop: {
    himacs: { label: "하이막스", costPerM: 220000 },
    khanstone: { label: "칸스톤", costPerM: 360000, slabCost: 1500000, factoryCost: 700000, installCost: 900000 },
    ceramic: { label: "세라믹", costPerM: 520000, slabCost: 1500000, factoryCost: 700000, installCost: 900000 },
    epPanel: { label: "EP판", costPerM: 130000 },
    none: { label: "없음", costPerM: 0 },
  },
  bathroom: bathroomRates,
  kitchen: kitchenRates,
  door: doorRates,
  finishMaterial: finishMaterialRates,
  misc: miscRates,
};

const ids = [
  "projectName",
  "areaPyeong",
  "clientName",
  "clientPhone",
  "projectSearch",
  "projectSearchResults",
  "sectionDemolitionEnabled",
  "sectionElectricalEnabled",
  "sectionBathroomEnabled",
  "sectionWallpaperEnabled",
  "sectionFilmEnabled",
  "sectionFlooringEnabled",
  "sectionCarpentryEnabled",
  "sectionFurnitureEnabled",
  "sectionFinishEnabled",
  "baseEnabled",
  "lowerCabinetM",
  "upperCabinetM",
  "tallCabinetM",
  "riceCabinetUnits",
  "baseEndPanels",
  "baseEpDepth",
  "baseLightingUnits",
  "baseT3Units",
  "islandEnabled",
  "islandM",
  "islandDepthMm",
  "islandCountertop",
  "islandSideFinish",
  "islandSideFinishCount",
  "islandDrawers",
  "islandRiceCabinetEnabled",
  "islandBachmannOutletEnabled",
  "islandLightingUnits",
  "islandT3Units",
  "homebarEnabled",
  "homebarM",
  "homebarCountertop",
  "homebarMidway",
  "homebarDrawers",
  "homebarEndPanels",
  "homebarEpDepth",
  "homebarLightingUnits",
  "homebarT3Units",
  "shoeEnabled",
  "shoeM",
  "shoeDepth",
  "shoeEndPanels",
  "shoeLightingUnits",
  "shoeT3Units",
  "fridgeLaundryEnabled",
  "fridgeLaundryM",
  "fridgeLaundryDepth",
  "fridgeLaundryEndPanels",
  "fridgeLaundryLightingUnits",
  "fridgeLaundryT3Units",
  "pantryEnabled",
  "pantryM",
  "pantryDepth",
  "pantryEndPanels",
  "pantryDrawerUnits",
  "builtInEnabled",
  "builtInM",
  "builtInDepth",
  "builtInEndPanels",
  "builtInLightingUnits",
  "builtInT3Units",
  "hangerEnabled",
  "hangerM",
  "hangerDepth",
  "hangerLightingUnits",
  "hangerT3Units",
  "demolitionFloorEnabled",
  "demolitionFloorMaterial",
  "demolitionFurnitureEnabled",
  "demolitionFurnitureM",
  "demolitionBathroomEnabled",
  "demolitionBathroomUnits",
  "demolitionCeilingEnabled",
  "demolitionElevatorProtectEnabled",
  "demolitionElevatorProtectRemovalEnabled",
  "demolitionPermitEnabled",
  "demolitionConsentEnabled",
  "electricalEnabled",
  "electricalAgeType",
  "standardSwitchEnabled",
  "standardLightingEnabled",
  "standardDownlightUnits",
  "standardSquareLightUnits",
  "standardCylinderLightUnits",
  "standardT3M",
  "standardBedWallLightEnabled",
  "tileEnabled",
  "tileGroutEnabled",
  "wallpaperPreset",
  "wallpaperBaseCoatEnabled",
  "filmPreset",
  "flooringArea",
  "bathroomUnits",
  "bathroomFanType",
  "bathroomBathtubUnits",
  "bathroomGlassBoothUnits",
  "bathroomGlassPartitionUnits",
  "bathroomMasonryWallUnits",
  "kitchenEnabled",
  "kitchenSinkBowlUnits",
  "kitchenFaucetUnits",
  "kitchenHoodUnits",
  "kitchenStandardInstallEnabled",
  "middleDoorUnits",
  "standardDoorUnits",
  "slidingDoorUnits",
  "windowNoticeEnabled",
  "wallpaperMaterialGrade",
  "wallpaperWallLengthM",
  "filmMaterialLengthM",
  "generalWasteEnabled",
  "interiorProtectionEnabled",
  "moveInCleaningEnabled",
  "siliconeEnabled",
  "elasticEnabled",
  "elasticExtraRooms",
  "carpentryCurtainBoxUnits",
  "carpentryCofferType",
  "carpentryArtwallM",
  "carpentryHiddenDoorUnits",
  "carpentryLineLightM",
  "carpentryIndirectLightUnits",
  "carpentryCeilingFanUnits",
  "carpentryDropCeilingUnits",
  "carpentryMoldingEnabled",
  "carpentryBaseboardEnabled",
  "carpentryCeilingHeight",
  "carpentryTvUnits",
  "manualAdjustment",
  "targetMargin",
  "baseCorrection",
  "islandCorrection",
  "homebarCorrection",
  "countertopCorrection",
  "optionCorrection",
  "rateLowerPerJa",
  "rateUpperPerJa",
  "rateIslandPerJa",
  "rateHomebarBuildPerJa",
  "rateTallPerJa",
  "rateFridgeLaundryPerJa",
  "rateShoePerJa",
  "ratePantryPerJa",
  "ratePantryDrawer",
  "rateBuiltInPerJa",
  "rateHangerPerJa",
  "rateRiceCabinetPerUnit",
  "rateEndPanelShallow",
  "rateEndPanelDeep",
  "rateDrawer",
  "rateBachmannOutlet",
  "rateLightingPerCabinetUnit",
  "rateT3LightingUnit",
  "rateStandardDownlight",
  "rateStandardSquareLight",
  "rateStandardCylinderLight",
  "rateStandardT3PerM",
  "rateStandardBedWallLight",
  "rateHimacsPerM",
  "rateKhanstoneSlab",
  "rateKhanstoneFactory",
  "rateKhanstoneInstall",
  "rateCeramicSlab",
  "rateCeramicFactory",
  "rateCeramicInstall",
  "rateEpPanelPerM",
  "rateDemolitionFloorPerPyeong",
  "rateDemolitionDecoTilePerPyeong",
  "rateDemolitionFurniturePerJa",
  "rateDemolitionBathroomWaterproof",
  "rateDemolitionCeilingPerPyeong",
  "rateDemolitionElevatorProtect",
  "rateDemolitionElevatorProtectRemoval",
  "rateDemolitionPermit",
  "rateDemolitionConsent",
  "rateElectricalWorkerDay",
  "rateElectricalHelperDay",
  "rateElectricalUnder10Days",
  "rateElectricalOver10Days",
  "rateElectricalWiring",
  "rateElectricalStandardSwitch",
  "rateTileWorkerDay",
  "rateTileHelperDay",
  "rateTileGrout",
  "rateWallpaperWorkerDay",
  "rateFilmWorkerDay",
  "rateFlooringPerPyeong",
  "rateSilicone",
  "rateElasticBase",
  "rateElasticExtraRoom",
  "rateCarpentryWorkerDay",
  "rateCarpentryMachineDay",
  "rateCarpentryLifting",
  "rateCarpentrySubsidiary",
  "rateCarpentryCeilingFanUnit",
  "rateCarpentryDrywallSheet",
  "rateCarpentryMdfSheet",
  "rateCarpentryPlywoodSheet",
  "rateCarpentryStudBundle",
];

const integerIds = [
  "baseLightingUnits",
  "baseT3Units",
  "islandDrawers",
  "islandSideFinishCount",
  "islandLightingUnits",
  "islandT3Units",
  "homebarDrawers",
  "homebarEndPanels",
  "homebarLightingUnits",
  "homebarT3Units",
  "shoeEndPanels",
  "shoeLightingUnits",
  "shoeT3Units",
  "fridgeLaundryEndPanels",
  "fridgeLaundryLightingUnits",
  "fridgeLaundryT3Units",
  "pantryEndPanels",
  "pantryDrawerUnits",
  "builtInEndPanels",
  "builtInLightingUnits",
  "builtInT3Units",
  "hangerLightingUnits",
  "hangerT3Units",
  "demolitionBathroomUnits",
  "elasticExtraRooms",
  "bathroomUnits",
  "bathroomBathtubUnits",
  "bathroomGlassBoothUnits",
  "bathroomGlassPartitionUnits",
  "bathroomMasonryWallUnits",
  "kitchenSinkBowlUnits",
  "kitchenFaucetUnits",
  "kitchenHoodUnits",
  "middleDoorUnits",
  "standardDoorUnits",
  "slidingDoorUnits",
  "standardDownlightUnits",
  "standardSquareLightUnits",
  "standardCylinderLightUnits",
  "carpentryCurtainBoxUnits",
  "carpentryIndirectLightUnits",
  "carpentryCeilingFanUnits",
  "carpentryHiddenDoorUnits",
  "carpentryDropCeilingUnits",
  "carpentryTvUnits",
];

const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
let activeQuoteEstimate = null;
let currentProfile = null;
let cachedEstimates = [];

const won = (value) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const floorThousand = (value) => Math.floor(value / 1000) * 1000;
const customerWon = (value) => `${floorThousand(value).toLocaleString("ko-KR")}원`;
const numberValue = (id) => Number(el[id]?.value) || 0;
const integerValue = (id) => Math.max(0, Math.floor(numberValue(id)));
const checkedValue = (id) => Boolean(el[id]?.checked);
const rateValue = (id, fallback) => Number(el[id]?.value) || fallback;
const mmToM = (mm) => mm / 1000;
const mmText = (mm) => `${Math.round(mm).toLocaleString("ko-KR")}mm`;
const quantityText = (value, suffix) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return `${rounded.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${suffix}`;
};
const mText = (meters) => mmText(meters * 1000);
const jaRounded = (mm) => (mm <= 0 ? 0 : Math.ceil(mm / 300));
const sellPrice = (cost, margin, correction = 0) => (cost / (1 - margin)) * (1 + correction);
const correctionValue = (id) => numberValue(id) / 100;
const epUnitPrice = (depth) => (depth === "shallow" ? rates.endPanelShallow : rates.endPanelDeep);
const epDepthLabel = (depth) => (depth === "shallow" ? "400mm 이하" : "400mm 초과");
const slabMaterials = new Set(["khanstone", "ceramic"]);
const isSlabMaterial = (material) => slabMaterials.has(material);
const slabBaseCost = (material) =>
  rates.countertop[material].slabCost + rates.countertop[material].factoryCost + rates.countertop[material].installCost;
const khanstoneBaseCost = () => slabBaseCost("khanstone");

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
  const labels = {
    projectName: "프로젝트명",
    areaPyeong: "평형",
    clientName: "고객성명",
    clientPhone: "연락처",
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
    bathroomUnits: "욕실 칸",
    bathroomFanType: "환풍기",
    bathroomBathtubUnits: "욕조",
    bathroomGlassBoothUnits: "유리부스",
    bathroomGlassPartitionUnits: "유리파티션",
    bathroomMasonryWallUnits: "조적벽",
    sectionWallpaperEnabled: "도배",
    wallpaperPreset: "기준",
    wallpaperBaseCoatEnabled: "초배 포함",
    wallpaperMaterialGrade: "자재 등급",
    wallpaperWallLengthM: "벽 길이(mm)",
    sectionFilmEnabled: "필름",
    filmPreset: "기준",
    filmMaterialLengthM: "필름 길이(mm)",
    sectionFlooringEnabled: "바닥",
    flooringArea: "면적(평)",
    sectionCarpentryEnabled: "목공",
    carpentryCurtainBoxUnits: "커튼박스 신설(개소)",
    carpentryCofferType: "우물천장",
    carpentryDropCeilingUnits: "단내림 개소",
    carpentryIndirectLightUnits: "간접등 개소",
    carpentryCeilingFanUnits: "실링팬 개수",
    carpentryLineLightM: "천장 라인조명 길이(mm)",
    carpentryArtwallM: "목공벽/아트월/가벽/파티션 길이(mm)",
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
    siliconeEnabled: "실리콘",
    elasticEnabled: "탄성(기본 2개소)",
    elasticExtraRooms: "탄성 추가 개소",
    targetMargin: "목표 마진(%)",
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
  sectionTextFor("sectionFlooringEnabled", "바닥(마루 : LX에디톤 급) 시공 면적을 입력합니다.");
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
    wallpaperPreset: { p20: "20평대", p30: "30평대", p40: "40평대", p50: "50평 이상" },
    wallpaperMaterialGrade: { diamant: "디아망급", fortis: "디아망 포티스급" },
    filmPreset: { p20: "20평대", p30: "30평대", p40: "40평대", p50: "50평 이상" },
    carpentryCofferType: { none: "없음", new: "신설", change: "변경" },
    riceCabinetUnits: { 0: "없음", 1: "600mm 1통", 2: "600mm 2통" },
    baseEndPanels: { 0: "없음", 1: "1장", 2: "2장", 3: "3장" },
    baseEpDepth: { shallow: "400mm 이하", deep: "400mm 초과" },
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

  textFor("#saveEstimateButton", "견적 저장");
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
    rateWallpaperWorkerDay: "도배 1품",
    rateFilmWorkerDay: "필름 1품",
    rateFlooringPerPyeong: "바닥(마루) 평단가",
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
  Object.entries(rateLabels).forEach(([id, text]) => labelTextFor(id, text));

  textFor("#internal .internal-summary-card h2", "내부 요약");
  [
    ["#internalCost", "직접원가"],
    ["#internalRevenue", "고객가"],
    ["#internalProfit", "예상마진"],
    ["#internalMargin", "마진율"],
    ["#discountRoom", "할인 가능 금액"],
    ["#marginStatus", "목표 마진 상태"],
  ].forEach(([selector, text]) => {
    const dt = document.querySelector(selector)?.previousElementSibling;
    if (dt) dt.textContent = text;
  });
  const standardSections = [
    ["standardSelectedItems", ["표준견적 체크", "선택 항목, 미선택 항목, 별도 확인 항목을 구분합니다.", "선택 항목", "미선택 항목", "별도 확인"]],
    ["adminStandardSelectedItems", ["표준견적 체크", "선택 항목, 미선택 항목, 별도 확인 항목을 구분합니다.", "선택 항목", "미선택 항목", "별도 확인"]],
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
      if (heading) heading.textContent = "내부견적";
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
    if (heading) heading.textContent = "상세견적";
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
  const adminDb = document.querySelector("#admin .admin-db-card");
  if (adminDb) {
    textFor("#admin .admin-db-card h2", "원가DB");
    textFor("#admin .admin-db-card p", "기준 단가와 보정률은 관리 화면에서만 수정합니다.");
  }
  const management = document.getElementById("targetMargin")?.closest(".internal-card");
  if (management) {
    const heading = management.querySelector(".section-heading h2");
    const paragraph = management.querySelector(".section-heading p");
    if (heading) heading.textContent = "관리기준";
    if (paragraph) paragraph.textContent = "마진, 보정률, 원가DB 기준을 관리합니다.";
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

function updateRatesFromAdmin() {
  rates.lowerPerJa = rateValue("rateLowerPerJa", rates.lowerPerJa);
  rates.upperPerJa = rateValue("rateUpperPerJa", rates.upperPerJa);
  rates.islandPerJa = rateValue("rateIslandPerJa", rates.islandPerJa);
  rates.homebarBuildPerJa = rateValue("rateHomebarBuildPerJa", rates.homebarBuildPerJa);
  rates.tallPerJa = rateValue("rateTallPerJa", rates.tallPerJa);
  rates.fridgeLaundryPerJa = rateValue("rateFridgeLaundryPerJa", rates.fridgeLaundryPerJa);
  rates.shoePerJa = rateValue("rateShoePerJa", rates.shoePerJa);
  rates.pantryPerJa = rateValue("ratePantryPerJa", rates.pantryPerJa);
  rates.pantryDrawer = rateValue("ratePantryDrawer", rates.pantryDrawer);
  rates.builtInPerJa = rateValue("rateBuiltInPerJa", rates.builtInPerJa);
  rates.hangerPerJa = rateValue("rateHangerPerJa", rates.hangerPerJa);
  rates.riceCabinetPerUnit = rateValue("rateRiceCabinetPerUnit", rates.riceCabinetPerUnit);
  rates.endPanelShallow = rateValue("rateEndPanelShallow", rates.endPanelShallow);
  rates.endPanelDeep = rateValue("rateEndPanelDeep", rates.endPanelDeep);
  rates.drawer = rateValue("rateDrawer", rates.drawer);
  rates.bachmannOutlet = rateValue("rateBachmannOutlet", rates.bachmannOutlet);
  rates.lightingPerCabinetUnit = rateValue("rateLightingPerCabinetUnit", rates.lightingPerCabinetUnit);
  rates.t3LightingUnit = rateValue("rateT3LightingUnit", rates.t3LightingUnit);
  rates.standardLighting.downlight = rateValue("rateStandardDownlight", rates.standardLighting.downlight);
  rates.standardLighting.square = rateValue("rateStandardSquareLight", rates.standardLighting.square);
  rates.standardLighting.cylinder = rateValue("rateStandardCylinderLight", rates.standardLighting.cylinder);
  rates.standardLighting.t3PerM = rateValue("rateStandardT3PerM", rates.standardLighting.t3PerM);
  rates.standardLighting.bedWallLight = rateValue("rateStandardBedWallLight", rates.standardLighting.bedWallLight);
  rates.countertop.himacs.costPerM = rateValue("rateHimacsPerM", rates.countertop.himacs.costPerM);
  rates.countertop.khanstone.slabCost = rateValue("rateKhanstoneSlab", rates.countertop.khanstone.slabCost);
  rates.countertop.khanstone.factoryCost = rateValue("rateKhanstoneFactory", rates.countertop.khanstone.factoryCost);
  rates.countertop.khanstone.installCost = rateValue("rateKhanstoneInstall", rates.countertop.khanstone.installCost);
  rates.countertop.ceramic.slabCost = rateValue("rateCeramicSlab", rates.countertop.ceramic.slabCost);
  rates.countertop.ceramic.factoryCost = rateValue("rateCeramicFactory", rates.countertop.ceramic.factoryCost);
  rates.countertop.ceramic.installCost = rateValue("rateCeramicInstall", rates.countertop.ceramic.installCost);
  rates.countertop.epPanel.costPerM = rateValue("rateEpPanelPerM", rates.countertop.epPanel.costPerM);
  rates.demolition.floorPerPyeong = rateValue("rateDemolitionFloorPerPyeong", rates.demolition.floorPerPyeong);
  rates.demolition.decoTilePerPyeong = rateValue("rateDemolitionDecoTilePerPyeong", rates.demolition.decoTilePerPyeong);
  rates.demolition.furniturePerJa = rateValue("rateDemolitionFurniturePerJa", rates.demolition.furniturePerJa);
  rates.demolition.bathroomWaterproof = rateValue("rateDemolitionBathroomWaterproof", rates.demolition.bathroomWaterproof);
  rates.demolition.ceilingPerPyeong = rateValue("rateDemolitionCeilingPerPyeong", rates.demolition.ceilingPerPyeong);
  rates.demolition.elevatorProtect = rateValue("rateDemolitionElevatorProtect", rates.demolition.elevatorProtect);
  rates.demolition.elevatorProtectRemoval = rateValue("rateDemolitionElevatorProtectRemoval", rates.demolition.elevatorProtectRemoval);
  rates.demolition.permit = rateValue("rateDemolitionPermit", rates.demolition.permit);
  rates.demolition.consent = rateValue("rateDemolitionConsent", rates.demolition.consent);
  rates.electrical.workerDay = rateValue("rateElectricalWorkerDay", rates.electrical.workerDay);
  rates.electrical.helperDay = rateValue("rateElectricalHelperDay", rates.electrical.helperDay);
  rates.electrical.under10YearsDays = rateValue("rateElectricalUnder10Days", rates.electrical.under10YearsDays);
  rates.electrical.over10YearsDays = rateValue("rateElectricalOver10Days", rates.electrical.over10YearsDays);
  rates.electrical.wiring = rateValue("rateElectricalWiring", rates.electrical.wiring);
  rates.electrical.standardSwitch = rateValue("rateElectricalStandardSwitch", rates.electrical.standardSwitch);
  rates.finish.tileWorkerDay = rateValue("rateTileWorkerDay", rates.finish.tileWorkerDay);
  rates.finish.tileHelperDay = rateValue("rateTileHelperDay", rates.finish.tileHelperDay);
  rates.finish.tileGrout = rateValue("rateTileGrout", rates.finish.tileGrout);
  rates.finish.wallpaperWorkerDay = rateValue("rateWallpaperWorkerDay", rates.finish.wallpaperWorkerDay);
  rates.finish.filmWorkerDay = rateValue("rateFilmWorkerDay", rates.finish.filmWorkerDay);
  rates.finish.flooringPerPyeong = rateValue("rateFlooringPerPyeong", rates.finish.flooringPerPyeong);
  rates.finish.silicone = rateValue("rateSilicone", rates.finish.silicone);
  rates.finish.elasticBase = rateValue("rateElasticBase", rates.finish.elasticBase);
  rates.finish.elasticExtraRoom = rateValue("rateElasticExtraRoom", rates.finish.elasticExtraRoom);
  rates.carpentry.workerDay = rateValue("rateCarpentryWorkerDay", rates.carpentry.workerDay);
  rates.carpentry.machineDay = rateValue("rateCarpentryMachineDay", rates.carpentry.machineDay);
  rates.carpentry.lifting = rateValue("rateCarpentryLifting", rates.carpentry.lifting);
  rates.carpentry.subsidiary = rateValue("rateCarpentrySubsidiary", rates.carpentry.subsidiary);
  rates.carpentry.ceilingFanUnit = rateValue("rateCarpentryCeilingFanUnit", rates.carpentry.ceilingFanUnit);
  rates.carpentry.drywallSheet = rateValue("rateCarpentryDrywallSheet", rates.carpentry.drywallSheet);
  rates.carpentry.mdfSheet = rateValue("rateCarpentryMdfSheet", rates.carpentry.mdfSheet);
  rates.carpentry.plywoodSheet = rateValue("rateCarpentryPlywoodSheet", rates.carpentry.plywoodSheet);
  rates.carpentry.studBundle = rateValue("rateCarpentryStudBundle", rates.carpentry.studBundle);
}

function countertopCost(material, billingM) {
  if (isSlabMaterial(material)) return slabBaseCost(material);
  return billingM * rates.countertop[material].costPerM;
}

function countertopQuantity(material, billingM) {
  if (isSlabMaterial(material)) return "1장 + 가공/시공";
  return mText(billingM);
}
function normalizeIntegerInput(input) {
  if (!integerIds.includes(input.id) || input.value === "") return;
  const max = input.max === "" ? Infinity : Number(input.max);
  input.value = String(Math.min(max, Math.max(0, Math.floor(Number(input.value) || 0))));
}

function readState() {
  updateRatesFromAdmin();
  const demolitionSection = checkedValue("sectionDemolitionEnabled");
  const electricalSection = checkedValue("sectionElectricalEnabled");
  const bathroomSection = checkedValue("sectionBathroomEnabled");
  const wallpaperSection = checkedValue("sectionWallpaperEnabled");
  const filmSection = checkedValue("sectionFilmEnabled");
  const flooringSection = checkedValue("sectionFlooringEnabled");
  const carpentrySection = checkedValue("sectionCarpentryEnabled");
  const furnitureSection = checkedValue("sectionFurnitureEnabled");
  const finishSection = checkedValue("sectionFinishEnabled");
  return {
    projectName: el.projectName.value || "상담 프로젝트",
    areaPyeong: numberValue("areaPyeong"),
    clientName: el.clientName.value || "",
    clientPhone: el.clientPhone.value || "",
    targetMargin: (numberValue("targetMargin") || 35) / 100,
    baseEnabled: furnitureSection && checkedValue("baseEnabled"),
    lowerCabinetM: numberValue("lowerCabinetM"),
    upperCabinetM: numberValue("upperCabinetM"),
    tallCabinetM: numberValue("tallCabinetM"),
    riceCabinetUnits: numberValue("riceCabinetUnits"),
    baseEndPanels: numberValue("baseEndPanels"),
    baseEpDepth: el.baseEpDepth.value,
    baseLightingUnits: integerValue("baseLightingUnits"),
    baseT3Units: integerValue("baseT3Units"),
    islandEnabled: furnitureSection && checkedValue("islandEnabled"),
    islandM: numberValue("islandM"),
    islandDepthMm: numberValue("islandDepthMm"),
    islandCountertop: el.islandCountertop.value,
    islandSideFinish: el.islandSideFinish.value,
    islandSideFinishCount: Math.min(2, integerValue("islandSideFinishCount")),
    islandDrawers: integerValue("islandDrawers"),
    islandRiceCabinetEnabled: checkedValue("islandRiceCabinetEnabled"),
    islandBachmannOutletEnabled: checkedValue("islandBachmannOutletEnabled"),
    islandLightingUnits: integerValue("islandLightingUnits"),
    islandT3Units: integerValue("islandT3Units"),
    homebarEnabled: furnitureSection && checkedValue("homebarEnabled"),
    homebarM: numberValue("homebarM"),
    homebarCountertop: el.homebarCountertop.value,
    homebarMidway: el.homebarMidway.value,
    homebarDrawers: integerValue("homebarDrawers"),
    homebarEndPanels: integerValue("homebarEndPanels"),
    homebarEpDepth: el.homebarEpDepth.value,
    homebarLightingUnits: integerValue("homebarLightingUnits"),
    homebarT3Units: integerValue("homebarT3Units"),
    shoeEnabled: furnitureSection && checkedValue("shoeEnabled"),
    shoeM: numberValue("shoeM"),
    shoeDepth: el.shoeDepth.value,
    shoeEndPanels: integerValue("shoeEndPanels"),
    shoeLightingUnits: integerValue("shoeLightingUnits"),
    shoeT3Units: integerValue("shoeT3Units"),
    fridgeLaundryEnabled: furnitureSection && checkedValue("fridgeLaundryEnabled"),
    fridgeLaundryM: numberValue("fridgeLaundryM"),
    fridgeLaundryDepth: el.fridgeLaundryDepth.value,
    fridgeLaundryEndPanels: integerValue("fridgeLaundryEndPanels"),
    fridgeLaundryLightingUnits: integerValue("fridgeLaundryLightingUnits"),
    fridgeLaundryT3Units: integerValue("fridgeLaundryT3Units"),
    pantryEnabled: furnitureSection && checkedValue("pantryEnabled"),
    pantryM: numberValue("pantryM"),
    pantryDepth: el.pantryDepth.value,
    pantryEndPanels: integerValue("pantryEndPanels"),
    pantryDrawerUnits: integerValue("pantryDrawerUnits"),
    builtInEnabled: furnitureSection && checkedValue("builtInEnabled"),
    builtInM: numberValue("builtInM"),
    builtInDepth: el.builtInDepth.value,
    builtInEndPanels: integerValue("builtInEndPanels"),
    builtInLightingUnits: integerValue("builtInLightingUnits"),
    builtInT3Units: integerValue("builtInT3Units"),
    hangerEnabled: furnitureSection && checkedValue("hangerEnabled"),
    hangerM: numberValue("hangerM"),
    hangerDepth: el.hangerDepth.value,
    hangerLightingUnits: integerValue("hangerLightingUnits"),
    hangerT3Units: integerValue("hangerT3Units"),
    demolitionFloorEnabled: demolitionSection && checkedValue("demolitionFloorEnabled"),
    demolitionFloorMaterial: el.demolitionFloorMaterial.value,
    demolitionFurnitureEnabled: demolitionSection && checkedValue("demolitionFurnitureEnabled"),
    demolitionFurnitureM: numberValue("demolitionFurnitureM"),
    demolitionBathroomEnabled: demolitionSection && checkedValue("demolitionBathroomEnabled"),
    demolitionBathroomUnits: integerValue("demolitionBathroomUnits"),
    demolitionCeilingEnabled: demolitionSection && checkedValue("demolitionCeilingEnabled"),
    demolitionElevatorProtectEnabled: demolitionSection && checkedValue("demolitionElevatorProtectEnabled"),
    demolitionElevatorProtectRemovalEnabled: demolitionSection && checkedValue("demolitionElevatorProtectRemovalEnabled"),
    demolitionPermitEnabled: demolitionSection && checkedValue("demolitionPermitEnabled"),
    demolitionConsentEnabled: demolitionSection && checkedValue("demolitionConsentEnabled"),
    electricalEnabled: electricalSection && checkedValue("electricalEnabled"),
    electricalAgeType: el.electricalAgeType.value,
    standardLightingEnabled: electricalSection && checkedValue("standardLightingEnabled"),
    standardSwitchEnabled: electricalSection && checkedValue("standardLightingEnabled") && checkedValue("standardSwitchEnabled"),
    standardDownlightUnits: integerValue("standardDownlightUnits"),
    standardSquareLightUnits: integerValue("standardSquareLightUnits"),
    standardCylinderLightUnits: integerValue("standardCylinderLightUnits"),
    standardT3M: numberValue("standardT3M"),
    standardBedWallLightEnabled: electricalSection && checkedValue("standardBedWallLightEnabled"),
    tileEnabled: bathroomSection && checkedValue("tileEnabled"),
    tileBathroomUnits: integerValue("bathroomUnits"),
    tileGroutEnabled: bathroomSection && checkedValue("tileGroutEnabled"),
    wallpaperEnabled: wallpaperSection,
    wallpaperPreset: el.wallpaperPreset.value,
    wallpaperBaseCoatEnabled: wallpaperSection && checkedValue("wallpaperBaseCoatEnabled"),
    filmEnabled: filmSection,
    filmPreset: el.filmPreset.value,
    flooringEnabled: flooringSection,
    flooringArea: numberValue("flooringArea"),
    bathroomEnabled: bathroomSection,
    bathroomUnits: integerValue("bathroomUnits"),
    bathroomFanType: el.bathroomFanType.value,
    bathroomBathtubUnits: integerValue("bathroomBathtubUnits"),
    bathroomGlassBoothUnits: integerValue("bathroomGlassBoothUnits"),
    bathroomGlassPartitionUnits: integerValue("bathroomGlassPartitionUnits"),
    bathroomMasonryWallUnits: integerValue("bathroomMasonryWallUnits"),
    kitchenEnabled: furnitureSection && checkedValue("kitchenEnabled"),
    kitchenSinkBowlUnits: integerValue("kitchenSinkBowlUnits"),
    kitchenFaucetUnits: integerValue("kitchenFaucetUnits"),
    kitchenHoodUnits: integerValue("kitchenHoodUnits"),
    kitchenStandardInstallEnabled: checkedValue("kitchenStandardInstallEnabled"),
    doorWindowEnabled: carpentrySection,
    middleDoorUnits: integerValue("middleDoorUnits"),
    standardDoorUnits: integerValue("standardDoorUnits"),
    slidingDoorUnits: integerValue("slidingDoorUnits"),
    windowNoticeEnabled: carpentrySection && checkedValue("windowNoticeEnabled"),
    wallpaperMaterialEnabled: wallpaperSection,
    wallpaperMaterialGrade: el.wallpaperMaterialGrade.value,
    wallpaperWallLengthM: numberValue("wallpaperWallLengthM"),
    filmMaterialEnabled: filmSection,
    filmMaterialLengthM: numberValue("filmMaterialLengthM"),
    generalWasteEnabled: finishSection && checkedValue("generalWasteEnabled"),
    interiorProtectionEnabled: finishSection && checkedValue("interiorProtectionEnabled"),
    moveInCleaningEnabled: finishSection && checkedValue("moveInCleaningEnabled"),
    siliconeEnabled: finishSection && checkedValue("siliconeEnabled"),
    elasticEnabled: finishSection && checkedValue("elasticEnabled"),
    elasticExtraRooms: integerValue("elasticExtraRooms"),
    carpentryCurtainBoxEnabled: carpentrySection,
    carpentryCurtainBoxUnits: integerValue("carpentryCurtainBoxUnits"),
    carpentryCofferType: el.carpentryCofferType.value,
    carpentryArtwallM: numberValue("carpentryArtwallM"),
    carpentryHiddenDoorUnits: integerValue("carpentryHiddenDoorUnits"),
    carpentryLineLightM: numberValue("carpentryLineLightM"),
    carpentryIndirectLightUnits: integerValue("carpentryIndirectLightUnits"),
    carpentryCeilingFanUnits: integerValue("carpentryCeilingFanUnits"),
    carpentryDropCeilingUnits: integerValue("carpentryDropCeilingUnits"),
    carpentryMoldingEnabled: carpentrySection && checkedValue("carpentryMoldingEnabled"),
    carpentryBaseboardEnabled: carpentrySection && checkedValue("carpentryBaseboardEnabled"),
    carpentryCeilingHeight: numberValue("carpentryCeilingHeight") || 2400,
    carpentryTvUnits: integerValue("carpentryTvUnits"),
    adjustment: numberValue("manualAdjustment"),
    corrections: {
      base: correctionValue("baseCorrection"),
      island: correctionValue("islandCorrection"),
      homebar: correctionValue("homebarCorrection"),
      countertop: correctionValue("countertopCorrection"),
      option: correctionValue("optionCorrection"),
    },
  };
}

function makeDetail({ group, item, input, quantity, unitPrice, cost, margin, correction = 0 }) {
  const revenue = sellPrice(cost, margin, correction);
  const customerRevenue = floorThousand(revenue);
  return {
    group,
    item,
    input,
    quantity,
    unitPrice,
    cost,
    correction,
    revenue,
    customerRevenue,
    profit: customerRevenue - cost,
  };
}

function addDetail(details, config) {
  if (config.cost <= 0) return;
  details.push(makeDetail(config));
}

function addModuleDetails(details, items, margin, correction) {
  for (const item of items.filter(Boolean)) {
    addDetail(details, {
      ...item,
      margin,
      correction,
    });
  }
}

function addT3Detail(details, { group, label, units, margin, corrections }) {
  if (units <= 0) return;
  addDetail(details, {
    group,
    item: `${label} 간접조명(T3)`,
    input: `${units}라인`,
    quantity: `${units}라인`,
    unitPrice: rates.t3LightingUnit,
    cost: units * rates.t3LightingUnit,
    margin,
    correction: corrections.option,
  });
}

function addStorageDetails(details, { group, label, enabled, mm, depth, endPanels, bodyUnitPrice, lightingUnits, t3Units, margin, corrections }) {
  if (!enabled || mm <= 0) return 0;
  const ja = jaRounded(mm);
  addDetail(details, {
    group,
    item: `${label} 몸통`,
    input: mmText(mm),
    quantity: `${ja}자`,
    unitPrice: bodyUnitPrice,
    cost: ja * bodyUnitPrice,
    margin,
    correction: corrections.base,
  });
  addDetail(details, {
    group,
    item: `${label} EP`,
    input: `${endPanels}장 / ${epDepthLabel(depth)}`,
    quantity: `${endPanels}장`,
    unitPrice: epUnitPrice(depth),
    cost: endPanels * epUnitPrice(depth),
    margin,
    correction: corrections.option,
  });
  if (lightingUnits > 0) {
    addDetail(details, {
      group,
      item: `${label} 라인조명`,
      input: `${lightingUnits}통`,
      quantity: `${lightingUnits}통`,
      unitPrice: rates.lightingPerCabinetUnit,
      cost: lightingUnits * rates.lightingPerCabinetUnit,
      margin,
      correction: corrections.option,
    });
  }
  addT3Detail(details, { group, label, units: t3Units, margin, corrections });
  return ja;
}

function addUnitDetail(details, { group, item, enabled, input, quantity, unitPrice, units, margin, correction }) {
  if (!enabled || units <= 0) return;
  addDetail(details, {
    group,
    item,
    input,
    quantity,
    unitPrice,
    cost: units * unitPrice,
    margin,
    correction,
  });
}

function islandSideFinishCalc(material, count, sideLengthM) {
  if (count <= 0) return { quantity: "0개", cost: 0 };
  if (material === "himacs") {
    const billingM = 0.9 * count;
    return {
      quantity: `${count}개 / ${mText(billingM)}`,
      cost: billingM * rates.countertop.himacs.costPerM,
    };
  }
  if (isSlabMaterial(material)) {
    return {
      quantity: `${count}개 / 1판 + 가공/시공`,
      cost: slabBaseCost(material),
    };
  }
  const billingM = sideLengthM * count;
  return {
    quantity: `${count}개 / ${mText(billingM)}`,
    cost: billingM * rates.countertop.epPanel.costPerM,
  };
}

const lightingText = (lineUnits, t3Units) =>
  `라인조명 ${lineUnits > 0 ? `${lineUnits}통` : "없음"}, 간접조명(T3) ${t3Units > 0 ? `${t3Units}라인` : "없음"}`;

const quoteGroupLabels = {
  demolition: "철거",
  electrical: "전기/조명",
  standardLighting: "전기/조명",
  bathroom: "욕실",
  tile: "욕실",
  kitchen: "가구",
  door: "도어/창호",
  misc: "기타",
  wallpaper: "도배",
  film: "필름",
  flooring: "바닥",
  silicone: "마감",
  elastic: "마감",
  carpentry: "목공",
  base: "가구",
  island: "가구",
  homebar: "가구",
  shoe: "가구",
  fridgeLaundry: "가구",
  pantry: "가구",
  builtIn: "가구",
  hanger: "가구",
};
const quoteGroupOrder = ["철거", "욕실", "전기/조명", "목공", "가구", "도배", "필름", "바닥", "마감", "도어/창호", "기타"];
const printGroupLabels = {
  철거: "철거공사",
  욕실: "욕실공사",
  "전기/조명": "전기·조명공사",
  목공: "목공공사",
  가구: "가구공사",
  도배: "도배공사",
  필름: "필름공사",
  바닥: "바닥공사",
  마감: "마감공사",
  "도어/창호": "도어·창호공사",
  기타: "기타공사",
};
const customerItemNames = {
  "마루철거": "바닥 철거",
  "화장실 철거 방수": "욕실 철거 및 방수",
  "타일 기공": "타일 시공",
  "타일 조공": "타일 시공",
  "타일 메지": "줄눈 마감",
  "욕실 포세린 타일 자재+잡자재": "AND표준 포세린 타일",
  "도기·수전·장식장·악세사리 기본세트": "AND표준 욕실 도기 및 수전",
  "도기·수전·장식장·악세사리 설치비": "욕실 도기 및 수전 시공",
  "휴젠트 옵션": "휴젠트 설치비",
  "AND 표준설비 설치비": "주방 설비 시공",
  "싱크볼(깜포르떼960 기준)": "싱크볼(깜포르떼960급)",
  "싱크수전(라우체급 기준)": "싱크수전(라우체급)",
  "후드(하츠 아일랜드 후드 기준)": "후드(하츠 아일랜드 후드급)",
  "전기 인건비": "전기 시공",
  "전기 배선비(전선/후렉시블)": "배선 자재",
  "AND 표준 콘센트 스위치(르그랑 급)": "AND표준 콘센트·스위치",
  "목공 인건비": "목공 시공",
  "목공 기계품": "장비 사용",
  "목공 양중": "자재 운반",
  MDF: "MDF 자재",
  "다루끼": "각재",
  "도배 인건비": "도배 시공",
  "도배 자재(디아망급)": "벽지(AND표준 디아망급)",
  "도배 자재(디아망 포티스급)": "벽지(AND표준 디아망 포티스급)",
  "필름 인건비": "필름 시공",
  "필름 자재(우드 무늬)": "필름(AND표준 우드)",
  "바닥 시공": "바닥(AND표준 마루)",
  "일반 폐기물": "폐기물 처리",
  "입주청소": "준공 청소",
};
function customerItemName(item) {
  if (customerItemNames[item]) return customerItemNames[item];
  return item
    .replace("몸통", "제작")
    .replace("냉장고 및 세탁기장", "냉장고장")
    .replace("옷장(붙박이장)", "붙박이장")
    .replace(/\bEP\b/g, "EP판");
}
const countertopQuoteText = (material, billingM) =>
  isSlabMaterial(material) ? "1장 + 가공/시공" : mText(billingM);
const groupTotalFromDetails = (details, group) =>
  details.filter((item) => item.group === group).reduce((sum, item) => sum + item.revenue, 0);
const floorDemolitionLabel = (material) => ({
  wood: "마루 철거",
  vinyl: "장판 철거",
  decoTile: "데코타일 철거",
}[material] || "바닥 철거");
const floorDemolitionUnitPrice = (material) => ({
  wood: rates.demolition.floorPerPyeong,
  vinyl: 0,
  decoTile: rates.demolition.decoTilePerPyeong,
}[material] || 0);
const wallpaperDays = (preset, baseCoat) => {
  const table = {
    p20: baseCoat ? 5 : 4,
    p30: baseCoat ? 6 : 5,
    p40: baseCoat ? 10 : 8,
    p50: baseCoat ? 14 : 10,
  };
  return table[preset] || 0;
};
const wallpaperLabel = (preset) => ({
  p20: "20평대",
  p30: "30평대",
  p40: "40평대",
  p50: "50평 이상",
}[preset] || "미선택");
const filmDays = (preset) => ({
  p20: 6,
  p30: 9,
  p40: 12,
  p50: 15,
}[preset] || 0);
const filmLabel = (preset) => ({
  p20: "20평대",
  p30: "30평대",
  p40: "40평대",
  p50: "50평 이상",
}[preset] || "미선택");
const boardArea = () => rates.carpentry.boardWidth * rates.carpentry.boardHeight;
const boardCountWithWaste = (rawCount) => (rawCount <= 0 ? 0 : Math.ceil(rawCount * rates.carpentry.wasteFactor));
const carpentryCofferDays = (type) => ({
  new: rates.carpentry.cofferNewDays,
  change: rates.carpentry.cofferChangeDays,
}[type] || 0);
const carpentryCofferLabel = (type) => ({
  new: "우물천장 신설",
  change: "우물천장 변경",
}[type] || "");

function carpentryLaborDays(state) {
  const ceilingWorkDays = state.carpentryCurtainBoxEnabled
    ? (
      (state.carpentryCurtainBoxUnits / 2) * rates.carpentry.curtainBoxDaysPerTwo +
      carpentryCofferDays(state.carpentryCofferType) +
      state.carpentryDropCeilingUnits * rates.carpentry.dropCeilingDays +
      state.carpentryIndirectLightUnits * rates.carpentry.indirectLightDays +
      mmToM(state.carpentryLineLightM) * rates.carpentry.lineLightDaysPerM
    )
    : 0;

  return (
    ceilingWorkDays +
    mmToM(state.carpentryArtwallM) * rates.carpentry.artwallDaysPerM +
    state.carpentryHiddenDoorUnits * rates.carpentry.hiddenDoorDays +
    (state.carpentryMoldingEnabled ? rates.carpentry.moldingDays : 0) +
    (state.carpentryBaseboardEnabled ? rates.carpentry.baseboardDays : 0)
  );
}

function carpentryMaterialCounts(state) {
  const wallLength = state.carpentryArtwallM;
  const wallArea = wallLength * state.carpentryCeilingHeight;
  const totalWallBoards = wallArea > 0 ? Math.ceil(wallArea / boardArea()) : 0;
  const plywoodBase = state.carpentryTvUnits * 2;
  const mdfBase = Math.max(0, totalWallBoards - plywoodBase);
  const verticalStuds = wallLength > 0 ? Math.ceil(wallLength / rates.carpentry.studSpacing) : 0;
  const studLength = (wallLength * 2) + (state.carpentryCeilingHeight * verticalStuds);
  const studBundleLength = rates.carpentry.studPieceLength * rates.carpentry.studPiecesPerBundle;
  return {
    totalWallBoards,
    mdfBase,
    plywoodBase,
    mdf: boardCountWithWaste(mdfBase),
    plywood: boardCountWithWaste(plywoodBase),
    drywall: 0,
    studLength,
    studLengthWithWaste: studLength * rates.carpentry.wasteFactor,
    studBundles: studLength > 0 ? Math.ceil((studLength * rates.carpentry.wasteFactor) / studBundleLength) : 0,
    verticalStuds,
  };
}

function hasCarpentryWork(state, laborDays, materials) {
  return laborDays > 0 ||
    materials.mdf > 0 ||
    materials.plywood > 0 ||
    materials.drywall > 0 ||
    materials.studBundles > 0 ||
    state.carpentryCeilingFanUnits > 0;
}

function calculate() {
  const state = readState();
  const margin = state.targetMargin;
  const details = [];

  const lowerJa = state.baseEnabled ? jaRounded(state.lowerCabinetM) : 0;
  const upperJa = state.baseEnabled ? jaRounded(state.upperCabinetM) : 0;
  const tallJa = state.baseEnabled ? jaRounded(state.tallCabinetM) : 0;
  const islandJa = state.islandEnabled ? jaRounded(state.islandM) : 0;
  const homebarJa = state.homebarEnabled ? jaRounded(state.homebarM) : 0;
  const shoeJa = state.shoeEnabled ? jaRounded(state.shoeM) : 0;
  const fridgeLaundryJa = state.fridgeLaundryEnabled ? jaRounded(state.fridgeLaundryM) : 0;
  const pantryJa = state.pantryEnabled ? jaRounded(state.pantryM) : 0;
  const builtInJa = state.builtInEnabled ? jaRounded(state.builtInM) : 0;
  const hangerJa = state.hangerEnabled ? jaRounded(state.hangerM) : 0;
  const islandCounter = rates.countertop[state.islandCountertop];
  const islandSideFinish = rates.countertop[state.islandSideFinish];
  const homebarCounter = rates.countertop[state.homebarCountertop];
  const homebarMidway = rates.countertop[state.homebarMidway];
  const homebarStorageJa = rates.homebarStorageBaseJa;
  const homebarExtraJa = Math.max(0, homebarJa - homebarStorageJa);
  const homebarCounterActualMm = homebarExtraJa * 300;
  const homebarCounterBillingM = homebarCounterActualMm > 0 ? Math.max(1, mmToM(homebarCounterActualMm)) : 0;
  const islandCounterMultiplier = state.islandCountertop === "himacs" && state.islandDepthMm > 720 ? 2 : 1;
  const islandCounterBillingM = mmToM(state.islandM) * islandCounterMultiplier;
  const islandSideLengthM = state.islandM > 3000 ? 0.9 : Math.max(0, mmToM(state.islandDepthMm));
  const islandSideCalc = islandSideFinishCalc(state.islandSideFinish, state.islandSideFinishCount, islandSideLengthM);

  if (state.baseEnabled) {
    addDetail(details, {
      group: "base",
      item: "하부장",
      input: mmText(state.lowerCabinetM),
      quantity: `${lowerJa}자`,
      unitPrice: rates.lowerPerJa,
      cost: lowerJa * rates.lowerPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "상부장",
      input: mmText(state.upperCabinetM),
      quantity: `${upperJa}자`,
      unitPrice: rates.upperPerJa,
      cost: upperJa * rates.upperPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "키큰장",
      input: mmText(state.tallCabinetM),
      quantity: `${tallJa}자`,
      unitPrice: rates.tallPerJa,
      cost: tallJa * rates.tallPerJa,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "밥솥장",
      input: `${state.riceCabinetUnits}통`,
      quantity: `${state.riceCabinetUnits}통`,
      unitPrice: rates.riceCabinetPerUnit,
      cost: state.riceCabinetUnits * rates.riceCabinetPerUnit,
      margin,
      correction: state.corrections.base,
    });
    addDetail(details, {
      group: "base",
      item: "상하부장 EP",
      input: `${state.baseEndPanels}장 / ${epDepthLabel(state.baseEpDepth)}`,
      quantity: `${state.baseEndPanels}장`,
      unitPrice: epUnitPrice(state.baseEpDepth),
      cost: state.baseEndPanels * epUnitPrice(state.baseEpDepth),
      margin,
      correction: state.corrections.option,
    });
    if (state.baseLightingUnits > 0) {
      addDetail(details, {
        group: "base",
        item: "상하부장 라인조명",
        input: `${state.baseLightingUnits}통`,
        quantity: `${state.baseLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.baseLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "base",
      label: "상하부장",
      units: state.baseT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  if (state.islandEnabled && state.islandM > 0) {
    addDetail(details, {
      group: "island",
      item: "아일랜드 몸통",
      input: mmText(state.islandM),
      quantity: `${islandJa}자`,
      unitPrice: rates.islandPerJa,
      cost: islandJa * rates.islandPerJa,
      margin,
      correction: state.corrections.island,
    });
    addDetail(details, {
      group: "island",
      item: `아일랜드 상판(${islandCounter.label})`,
      input: `${mmText(state.islandM)} x ${mmText(state.islandDepthMm)}`,
      quantity: isSlabMaterial(state.islandCountertop) ? countertopQuantity(state.islandCountertop, islandCounterBillingM) : `${mText(mmToM(state.islandM))}${islandCounterMultiplier > 1 ? " x 2" : ""}`,
      unitPrice: isSlabMaterial(state.islandCountertop) ? slabBaseCost(state.islandCountertop) : islandCounter.costPerM,
      cost: countertopCost(state.islandCountertop, islandCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "island",
      item: `아일랜드 좌우마감재(${islandSideFinish.label})`,
      input: state.islandSideFinish === "epPanel" ? `각 ${mmText(islandSideLengthM * 1000)}` : "900mm 기준",
      quantity: islandSideCalc.quantity,
      unitPrice: isSlabMaterial(state.islandSideFinish) ? slabBaseCost(state.islandSideFinish) : islandSideFinish.costPerM,
      cost: islandSideCalc.cost,
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "island",
      item: "아일랜드 서랍",
      input: `${state.islandDrawers}개`,
      quantity: `${state.islandDrawers}개`,
      unitPrice: rates.drawer,
      cost: state.islandDrawers * rates.drawer,
      margin,
      correction: state.corrections.option,
    });
    if (state.islandRiceCabinetEnabled) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 밥솥장 추가",
        input: "1개",
        quantity: "1개",
        unitPrice: rates.drawer,
        cost: rates.drawer,
        margin,
        correction: state.corrections.option,
      });
    }
    if (state.islandBachmannOutletEnabled) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 바흐만 2구 콘센트",
        input: "1개",
        quantity: "1개",
        unitPrice: rates.bachmannOutlet,
        cost: rates.bachmannOutlet,
        margin,
        correction: state.corrections.option,
      });
    }
    if (state.islandLightingUnits > 0) {
      addDetail(details, {
        group: "island",
        item: "아일랜드 라인조명",
        input: `${state.islandLightingUnits}통`,
        quantity: `${state.islandLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.islandLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "island",
      label: "아일랜드",
      units: state.islandT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  if (state.homebarEnabled && state.homebarM > 0) {
    addDetail(details, {
      group: "homebar",
      item: "홈바장 키큰수납장",
      input: mmText(state.homebarM),
      quantity: `${homebarStorageJa}자`,
      unitPrice: rates.homebarBuildPerJa,
      cost: homebarStorageJa * rates.homebarBuildPerJa,
      margin,
      correction: state.corrections.homebar,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 상하부장",
      input: mmText(state.homebarM),
      quantity: `${homebarExtraJa}자`,
      unitPrice: rates.homebarBuildPerJa,
      cost: homebarExtraJa * rates.homebarBuildPerJa,
      margin,
      correction: state.corrections.homebar,
    });
    addDetail(details, {
      group: "homebar",
      item: `홈바장 상판(${homebarCounter.label})`,
      input: `상하부장 ${mmText(homebarCounterActualMm)}`,
      quantity: countertopQuantity(state.homebarCountertop, homebarCounterBillingM),
      unitPrice: isSlabMaterial(state.homebarCountertop) ? slabBaseCost(state.homebarCountertop) : homebarCounter.costPerM,
      cost: countertopCost(state.homebarCountertop, homebarCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "homebar",
      item: `홈바장 미드웨이(${homebarMidway.label})`,
      input: `상하부장 ${mmText(homebarCounterActualMm)}`,
      quantity: countertopQuantity(state.homebarMidway, homebarCounterBillingM),
      unitPrice: isSlabMaterial(state.homebarMidway) ? slabBaseCost(state.homebarMidway) : homebarMidway.costPerM,
      cost: countertopCost(state.homebarMidway, homebarCounterBillingM),
      margin,
      correction: state.corrections.countertop,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 서랍",
      input: `${state.homebarDrawers}개`,
      quantity: `${state.homebarDrawers}개`,
      unitPrice: rates.drawer,
      cost: state.homebarDrawers * rates.drawer,
      margin,
      correction: state.corrections.option,
    });
    addDetail(details, {
      group: "homebar",
      item: "홈바장 EP",
      input: `${state.homebarEndPanels}장 / ${epDepthLabel(state.homebarEpDepth)}`,
      quantity: `${state.homebarEndPanels}장`,
      unitPrice: epUnitPrice(state.homebarEpDepth),
      cost: state.homebarEndPanels * epUnitPrice(state.homebarEpDepth),
      margin,
      correction: state.corrections.option,
    });
    if (state.homebarLightingUnits > 0) {
      addDetail(details, {
        group: "homebar",
        item: "홈바장 라인조명",
        input: `${state.homebarLightingUnits}통`,
        quantity: `${state.homebarLightingUnits}통`,
        unitPrice: rates.lightingPerCabinetUnit,
        cost: state.homebarLightingUnits * rates.lightingPerCabinetUnit,
        margin,
        correction: state.corrections.option,
      });
    }
    addT3Detail(details, {
      group: "homebar",
      label: "홈바장",
      units: state.homebarT3Units,
      margin,
      corrections: state.corrections,
    });
  }

  addStorageDetails(details, {
    group: "shoe",
    label: "신발장",
    enabled: state.shoeEnabled,
    mm: state.shoeM,
    depth: state.shoeDepth,
    endPanels: state.shoeEndPanels,
    bodyUnitPrice: state.shoeDepth === "shallow" ? rates.shoePerJa : rates.tallPerJa,
    lightingUnits: state.shoeLightingUnits,
    t3Units: state.shoeT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "fridgeLaundry",
    label: "냉장고 및 세탁기장",
    enabled: state.fridgeLaundryEnabled,
    mm: state.fridgeLaundryM,
    depth: state.fridgeLaundryDepth,
    endPanels: state.fridgeLaundryEndPanels,
    bodyUnitPrice: rates.fridgeLaundryPerJa,
    lightingUnits: state.fridgeLaundryLightingUnits,
    t3Units: state.fridgeLaundryT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "pantry",
    label: "팬트리장",
    enabled: state.pantryEnabled,
    mm: state.pantryM,
    depth: state.pantryDepth,
    endPanels: state.pantryEndPanels,
    bodyUnitPrice: rates.pantryPerJa,
    lightingUnits: 0,
    t3Units: 0,
    margin,
    corrections: state.corrections,
  });
  addUnitDetail(details, {
    group: "pantry",
    item: "팬트리장 하부서랍장",
    enabled: state.pantryEnabled,
    input: `${state.pantryDrawerUnits}개`,
    quantity: `${state.pantryDrawerUnits}개`,
    unitPrice: rates.pantryDrawer,
    units: state.pantryDrawerUnits,
    margin,
    correction: state.corrections.option,
  });
  addStorageDetails(details, {
    group: "builtIn",
    label: "옷장(붙박이장)",
    enabled: state.builtInEnabled,
    mm: state.builtInM,
    depth: state.builtInDepth,
    endPanels: state.builtInEndPanels,
    bodyUnitPrice: rates.builtInPerJa,
    lightingUnits: state.builtInLightingUnits,
    t3Units: state.builtInT3Units,
    margin,
    corrections: state.corrections,
  });
  addStorageDetails(details, {
    group: "hanger",
    label: "옷장(헹거장)",
    enabled: state.hangerEnabled,
    mm: state.hangerM,
    depth: state.hangerDepth,
    endPanels: 0,
    bodyUnitPrice: rates.hangerPerJa,
    lightingUnits: state.hangerLightingUnits,
    t3Units: state.hangerT3Units,
    margin,
    corrections: state.corrections,
  });

  addUnitDetail(details, {
    group: "demolition",
    item: floorDemolitionLabel(state.demolitionFloorMaterial),
    enabled: state.demolitionFloorEnabled,
    input: `${state.areaPyeong}평`,
    quantity: `${state.areaPyeong}평`,
    unitPrice: floorDemolitionUnitPrice(state.demolitionFloorMaterial),
    units: state.areaPyeong,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "가구 철거(폐기물 포함)",
    enabled: state.demolitionFurnitureEnabled,
    input: mmText(state.demolitionFurnitureM),
    quantity: `${jaRounded(state.demolitionFurnitureM)}자`,
    unitPrice: rates.demolition.furniturePerJa,
    units: jaRounded(state.demolitionFurnitureM),
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "화장실 철거 방수",
    enabled: state.demolitionBathroomEnabled,
    input: `${state.demolitionBathroomUnits}개소`,
    quantity: `${state.demolitionBathroomUnits}개소`,
    unitPrice: rates.demolition.bathroomWaterproof,
    units: state.demolitionBathroomUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "천장철거(폐기물 포함)",
    enabled: state.demolitionCeilingEnabled,
    input: `${state.areaPyeong}평`,
    quantity: `${state.areaPyeong}평`,
    unitPrice: rates.demolition.ceilingPerPyeong,
    units: state.areaPyeong,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "E/V 보양",
    enabled: state.demolitionElevatorProtectEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.elevatorProtect,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "E/V 보양 철거",
    enabled: state.demolitionElevatorProtectRemovalEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.elevatorProtectRemoval,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "행위허가",
    enabled: state.demolitionPermitEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.permit,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "demolition",
    item: "동의서",
    enabled: state.demolitionConsentEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.demolition.consent,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  const electricalDays = state.electricalAgeType === "under10" ? rates.electrical.under10YearsDays : rates.electrical.over10YearsDays;
  addUnitDetail(details, {
    group: "electrical",
    item: `전기 인건비(${state.electricalAgeType === "under10" ? "준공 10년 이하" : "준공 10년 이상"})`,
    enabled: state.electricalEnabled,
    input: `${electricalDays}품`,
    quantity: `${electricalDays}품`,
    unitPrice: rates.electrical.workerDay,
    units: electricalDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "electrical",
    item: "전기 배선비(전선/후렉시블)",
    enabled: state.electricalEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.electrical.wiring,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND 표준 콘센트 스위치(르그랑 급)",
    enabled: state.standardSwitchEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.electrical.standardSwitch,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 다운라이트",
    enabled: state.standardLightingEnabled,
    input: `${state.standardDownlightUnits}개`,
    quantity: `${state.standardDownlightUnits}개`,
    unitPrice: rates.standardLighting.downlight,
    units: state.standardDownlightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 사각매입등",
    enabled: state.standardLightingEnabled,
    input: `${state.standardSquareLightUnits}개`,
    quantity: `${state.standardSquareLightUnits}개`,
    unitPrice: rates.standardLighting.square,
    units: state.standardSquareLightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 실린더등",
    enabled: state.standardLightingEnabled,
    input: `${state.standardCylinderLightUnits}개`,
    quantity: `${state.standardCylinderLightUnits}개`,
    unitPrice: rates.standardLighting.cylinder,
    units: state.standardCylinderLightUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 간접조명(T3)",
    enabled: state.standardLightingEnabled,
    input: `${state.standardT3M}m`,
    quantity: `${state.standardT3M}m`,
    unitPrice: rates.standardLighting.t3PerM,
    units: state.standardT3M,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "standardLighting",
    item: "AND표준 조명 침대 벽등",
    enabled: state.standardLightingEnabled && state.standardBedWallLightEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.standardLighting.bedWallLight,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "tile",
    item: "타일 기공",
    enabled: state.tileEnabled,
    input: `${state.tileBathroomUnits}칸 x 3품`,
    quantity: `${state.tileBathroomUnits * 3}품`,
    unitPrice: rates.finish.tileWorkerDay,
    units: state.tileBathroomUnits * 3,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "타일 조공",
    enabled: state.tileEnabled,
    input: `${state.tileBathroomUnits}칸 x 1품`,
    quantity: `${state.tileBathroomUnits}품`,
    unitPrice: rates.finish.tileHelperDay,
    units: state.tileBathroomUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "타일 메지",
    enabled: state.tileEnabled && state.tileGroutEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.finish.tileGrout,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "tile",
    item: "조적벽 타일 기공 추가",
    enabled: state.bathroomEnabled,
    input: `${state.bathroomMasonryWallUnits}개`,
    quantity: `${state.bathroomMasonryWallUnits}품`,
    unitPrice: rates.finish.tileWorkerDay,
    units: state.bathroomMasonryWallUnits,
    margin,
    correction: state.corrections.option,
  });

  addModuleDetails(details, bathroomDetails(state, rates.bathroom), margin, state.corrections.option);

  const wallpaperUnitDays = wallpaperDays(state.wallpaperPreset, state.wallpaperBaseCoatEnabled);
  addUnitDetail(details, {
    group: "wallpaper",
    item: "도배 인건비",
    enabled: state.wallpaperEnabled,
    input: `${wallpaperLabel(state.wallpaperPreset)}${state.wallpaperBaseCoatEnabled ? " / 초배 포함" : ""}`,
    quantity: `${wallpaperUnitDays}품`,
    unitPrice: rates.finish.wallpaperWorkerDay,
    units: wallpaperUnitDays,
    margin,
    correction: state.corrections.option,
  });
  addModuleDetails(details, [wallpaperMaterialDetail(state, rates.finishMaterial)], margin, state.corrections.option);

  const filmUnitDays = filmDays(state.filmPreset);
  addUnitDetail(details, {
    group: "film",
    item: "필름 인건비",
    enabled: state.filmEnabled,
    input: filmLabel(state.filmPreset),
    quantity: `${filmUnitDays}품`,
    unitPrice: rates.finish.filmWorkerDay,
    units: filmUnitDays,
    margin,
    correction: state.corrections.option,
  });
  addModuleDetails(details, [filmMaterialDetail(state, rates.finishMaterial)], margin, state.corrections.option);

  addUnitDetail(details, {
    group: "flooring",
    item: "바닥 시공",
    enabled: state.flooringEnabled,
    input: `${state.flooringArea}평`,
    quantity: `${state.flooringArea}평`,
    unitPrice: rates.finish.flooringPerPyeong,
    units: state.flooringArea,
    margin,
    correction: state.corrections.option,
  });

  addModuleDetails(details, kitchenDetails(state, rates.kitchen), margin, state.corrections.option);
  addModuleDetails(details, doorDetails(state, rates.door), margin, state.corrections.option);
  addModuleDetails(details, miscDetails(state, rates.misc), margin, state.corrections.option);

  addUnitDetail(details, {
    group: "silicone",
    item: "실리콘",
    enabled: state.siliconeEnabled,
    input: "1식",
    quantity: "1식",
    unitPrice: rates.finish.silicone,
    units: 1,
    margin,
    correction: state.corrections.option,
  });

  addUnitDetail(details, {
    group: "elastic",
    item: "탄성 기본 2개소",
    enabled: state.elasticEnabled,
    input: "기본 2개소",
    quantity: "1식",
    unitPrice: rates.finish.elasticBase,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "elastic",
    item: "탄성 추가 개소",
    enabled: state.elasticEnabled,
    input: `${state.elasticExtraRooms}개소`,
    quantity: `${state.elasticExtraRooms}개소`,
    unitPrice: rates.finish.elasticExtraRoom,
    units: state.elasticExtraRooms,
    margin,
    correction: state.corrections.option,
  });

  const carpentryDays = carpentryLaborDays(state);
  const carpentryMaterials = carpentryMaterialCounts(state);
  const carpentryActive = hasCarpentryWork(state, carpentryDays, carpentryMaterials);
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 인건비",
    enabled: carpentryDays > 0,
    input: "내부 품수 산출",
    quantity: quantityText(carpentryDays, "품"),
    unitPrice: rates.carpentry.workerDay,
    units: carpentryDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 기계품",
    enabled: carpentryDays > 0,
    input: `${quantityText(carpentryDays, "품")} 올림`,
    quantity: `${Math.ceil(carpentryDays)}일`,
    unitPrice: rates.carpentry.machineDay,
    units: Math.ceil(carpentryDays),
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 부자재",
    enabled: carpentryActive,
    input: "자동 포함",
    quantity: "1식",
    unitPrice: rates.carpentry.subsidiary,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 양중",
    enabled: carpentryActive,
    input: "자동 포함",
    quantity: "1식",
    unitPrice: rates.carpentry.lifting,
    units: 1,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "실링팬 보강",
    enabled: true,
    input: `${state.carpentryCeilingFanUnits}개`,
    quantity: `${state.carpentryCeilingFanUnits}개`,
    unitPrice: rates.carpentry.ceilingFanUnit,
    units: state.carpentryCeilingFanUnits,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "MDF",
    enabled: carpentryMaterials.mdf > 0,
    input: `기본 ${carpentryMaterials.mdfBase}장 / 15% 할증`,
    quantity: `${carpentryMaterials.mdf}장`,
    unitPrice: rates.carpentry.mdfSheet,
    units: carpentryMaterials.mdf,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "합판",
    enabled: carpentryMaterials.plywood > 0,
    input: `TV ${state.carpentryTvUnits}개 x 2장 / 15% 할증`,
    quantity: `${carpentryMaterials.plywood}장`,
    unitPrice: rates.carpentry.plywoodSheet,
    units: carpentryMaterials.plywood,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "다루끼",
    enabled: carpentryMaterials.studBundles > 0,
    input: `${mmText(carpentryMaterials.studLength)} x 1.15`,
    quantity: `${carpentryMaterials.studBundles}묶음`,
    unitPrice: rates.carpentry.studBundle,
    units: carpentryMaterials.studBundles,
    margin,
    correction: state.corrections.option,
  });

  const directCost = details.reduce((sum, item) => sum + item.cost, 0);
  const rawRevenue = details.reduce((sum, item) => sum + item.revenue, 0) + state.adjustment;
  const customerRevenue = floorThousand(Math.max(0, rawRevenue));
  const profit = customerRevenue - directCost;
  const actualMargin = customerRevenue > 0 ? profit / customerRevenue : 0;
  const targetRevenue = directCost / (1 - margin);
  const discountRoom = Math.max(0, customerRevenue - targetRevenue);
  const groupTotal = (group) => groupTotalFromDetails(details, group);
  const usesStoneSlab =
    (state.islandEnabled && state.islandM > 0 && (
      isSlabMaterial(state.islandCountertop) ||
      (isSlabMaterial(state.islandSideFinish) && state.islandSideFinishCount > 0)
    )) ||
    (state.homebarEnabled && state.homebarM > 0 && (
      isSlabMaterial(state.homebarCountertop) ||
      isSlabMaterial(state.homebarMidway)
    ));

  const quoteLines = [
    { process: "상하부장", description: state.baseEnabled ? "상하부장 선택" : "미선택", revenue: groupTotal("base") },
    { process: "아일랜드", description: state.islandEnabled && state.islandM > 0 ? "아일랜드 선택" : "미선택", revenue: groupTotal("island") },
    { process: "홈바장", description: state.homebarEnabled && state.homebarM > 0 ? "홈바장 선택" : "미선택", revenue: groupTotal("homebar") },
    { process: "신발장", description: state.shoeEnabled && state.shoeM > 0 ? "신발장 선택" : "미선택", revenue: groupTotal("shoe") },
    { process: "냉장고장", description: state.fridgeLaundryEnabled && state.fridgeLaundryM > 0 ? "냉장고 및 세탁기장 선택" : "미선택", revenue: groupTotal("fridgeLaundry") },
    { process: "팬트리장", description: state.pantryEnabled && state.pantryM > 0 ? "팬트리장 선택" : "미선택", revenue: groupTotal("pantry") },
    { process: "붙박이장", description: state.builtInEnabled && state.builtInM > 0 ? "붙박이장 선택" : "미선택", revenue: groupTotal("builtIn") },
    { process: "헹거장", description: state.hangerEnabled && state.hangerM > 0 ? "헹거장 선택" : "미선택", revenue: groupTotal("hanger") },
    { process: "철거", description: "철거 및 인허가", revenue: groupTotal("demolition") },
    { process: "전기", description: "전기 시공", revenue: groupTotal("electrical") },
    { process: "AND표준 조명", description: "조명 및 콘센트·스위치", revenue: groupTotal("standardLighting") },
    { process: "욕실", description: "욕실 공사", revenue: groupTotal("bathroom") },
    { process: "타일", description: "타일(AND표준 포세린)", revenue: groupTotal("tile") },
    { process: "주방설비", description: "주방 부속/기기", revenue: groupTotal("kitchen") },
    { process: "도어/창호", description: "도어 및 창호", revenue: groupTotal("door") },
    { process: "기타", description: "기타 공정", revenue: groupTotal("misc") },
    { process: "도배", description: state.wallpaperEnabled ? wallpaperLabel(state.wallpaperPreset) : "미선택", revenue: groupTotal("wallpaper") },
    { process: "필름", description: state.filmEnabled ? filmLabel(state.filmPreset) : "미선택", revenue: groupTotal("film") },
    { process: "바닥", description: state.flooringEnabled ? `${state.flooringArea}평` : "미선택", revenue: groupTotal("flooring") },
    { process: "마감", description: "실리콘", revenue: groupTotal("silicone") },
    { process: "마감", description: "탄성", revenue: groupTotal("elastic") },
    { process: "목공", description: "목공 공사", revenue: groupTotal("carpentry") },
    {
      process: "창호",
      description: "별도 실측 후 견적",
      revenue: 0,
      amountText: state.doorWindowEnabled && state.windowNoticeEnabled ? "별도 실측 후 견적" : "",
    },
  ].filter((line) => line.revenue > 0 || line.amountText);

  if (state.adjustment !== 0) {
    quoteLines.push({
      process: "상담 보정",
      description: "현장 사이즈, 작업 조정, 할인 반영",
      revenue: state.adjustment,
    });
  }
  if (usesStoneSlab) {
    quoteLines.push({
      process: "양중비",
      description: "칸스톤/세라믹 양중비",
      amountText: "현장별 별도",
      revenue: 0,
    });
  }

  const warnings = [];
  if (details.length === 0) {
    warnings.push("선택한 항목이 없습니다.");
  } else if (actualMargin + 0.0001 < margin) {
    warnings.push(`목표 마진 ${(margin * 100).toFixed(1)}% 미달: 현재 ${(actualMargin * 100).toFixed(1)}%`);
  }
  if (warnings.length === 0) warnings.push("목표 마진 기준 정상입니다.");

  return {
    state,
    details,
    quoteLines,
    directCost,
    customerRevenue,
    profit,
    actualMargin,
    discountRoom,
    warnings,
    counts: { lowerJa, upperJa, tallJa, islandJa, homebarJa, shoeJa, fridgeLaundryJa, pantryJa, builtInJa, hangerJa },
  };
}

function renderQuoteRows(lines, details, total) {
  const quoteRows = document.getElementById("quoteRows");
  quoteRows.innerHTML = "";

  const grouped = new Map();
  for (const item of details.filter((detail) => detail.revenue > 0)) {
    const label = quoteGroupLabels[item.group] || item.group;
    if (!grouped.has(label)) grouped.set(label, { total: 0, items: [] });
    grouped.get(label).total += item.revenue;
    grouped.get(label).items.push(item);
  }

  for (const label of quoteGroupOrder) {
    const group = grouped.get(label);
    if (!group) continue;
    const headerRow = document.createElement("tr");
    headerRow.className = "quote-group-row";
    headerRow.innerHTML = `
      <td>${label}</td>
      <td>공정 합계</td>
      <td>${customerWon(group.total)}</td>
    `;
    quoteRows.appendChild(headerRow);

    for (const item of group.items) {
      const row = document.createElement("tr");
      row.className = "quote-item-row";
      row.innerHTML = `
        <td></td>
        <td>${item.item} · ${item.quantity}</td>
        <td>${customerWon(item.revenue)}</td>
      `;
      quoteRows.appendChild(row);
    }
  }

  for (const item of lines.filter((line) => line.amountText)) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.process}</td>
      <td>${item.description}</td>
      <td>${item.amountText}</td>
    `;
    quoteRows.appendChild(row);
  }

  for (const item of lines.filter((line) => line.process === "상담 보정" && line.revenue !== 0)) {
    const row = document.createElement("tr");
    row.className = "quote-group-row";
    row.innerHTML = `
      <td>${item.process}</td>
      <td>${item.description}</td>
      <td>${customerWon(item.revenue)}</td>
    `;
    quoteRows.appendChild(row);
  }

  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총 금액</td>
    <td>총 공사금액</td>
    <td>${customerWon(total)}</td>
  `;
  quoteRows.appendChild(totalRow);
}

function renderInternalRows(details) {
  const tbody = document.getElementById("internalDetailRows");
  const adminTbody = document.getElementById("adminInternalDetailRows");
  tbody.innerHTML = "";
  if (adminTbody) adminTbody.innerHTML = "";
  for (const item of details) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.item}</td>
      <td>${item.input}</td>
      <td>${item.quantity}</td>
      <td>${won(item.unitPrice)}</td>
      <td>${won(item.cost)}</td>
      <td>${(item.correction * 100).toFixed(1)}%</td>
      <td>${customerWon(item.revenue)}</td>
      <td>${won(item.customerRevenue - item.cost)}</td>
    `;
    tbody.appendChild(row);
    if (adminTbody) adminTbody.appendChild(row.cloneNode(true));
  }
}

function renderWarnings(warnings) {
  const box = document.getElementById("internalWarnings");
  box.innerHTML = "";
  for (const warning of warnings) {
    const item = document.createElement("div");
    item.className = `warning-item${warning.includes("정상") ? " ok" : ""}`;
    item.textContent = warning;
    box.appendChild(item);
  }
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function collectInputValues() {
  return Object.fromEntries(Object.entries(el).map(([id, input]) => [
    id,
    input?.type === "checkbox" ? Boolean(input.checked) : input?.value ?? "",
  ]));
}

function restoreInputValues(inputs = {}) {
  for (const [id, value] of Object.entries(inputs)) {
    const input = el[id];
    if (!input) continue;
    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = value;
    }
  }
  syncSectionLocks();
  syncBlockLocks();
}

function groupedCustomerItems(details, lines) {
  const groups = new Map();
  const ensureGroup = (label) => {
    if (!groups.has(label)) groups.set(label, { label, total: 0, items: [] });
    return groups.get(label);
  };
  const addCustomerItem = (group, name, amount, amountText = customerWon(amount)) => {
    const existing = group.items.find((item) => item.name === name && item.amountText !== "현장별 별도");
    if (existing && amount > 0) {
      existing.amount += amount;
      existing.amountText = customerWon(existing.amount);
      return;
    }
    group.items.push({ name, amount, amountText });
  };

  for (const detail of details.filter((item) => item.revenue > 0)) {
    const group = ensureGroup(quoteGroupLabels[detail.group] || detail.group);
    group.total += detail.revenue;
    addCustomerItem(group, customerItemName(detail.item), detail.revenue);
  }

  for (const line of lines.filter((item) => item.amountText)) {
    const group = ensureGroup(line.process === "양중비" ? "기타" : line.process);
    addCustomerItem(group, line.description || line.process, 0, line.amountText);
  }

  for (const line of lines.filter((item) => item.process === "상담 보정" && item.revenue !== 0)) {
    const group = ensureGroup("기타");
    group.total += line.revenue;
    addCustomerItem(group, line.description, line.revenue);
  }

  return quoteGroupOrder
    .map((label) => groups.get(label))
    .filter(Boolean)
    .map((group) => ({
      ...group,
      totalText: customerWon(group.total),
    }));
}

function buildEstimateSnapshot(result) {
  const savedAt = new Date().toISOString();
  return {
    projectName: result.state.projectName,
    areaPyeong: result.state.areaPyeong,
    clientName: result.state.clientName,
    phone: result.state.clientPhone,
    savedAt,
    total: result.customerRevenue,
    totalText: customerWon(result.customerRevenue),
    costTotal: result.directCost,
    marginRate: Number((result.actualMargin * 100).toFixed(2)),
    status: "상담",
    author: {
      user_id: currentProfile?.id || getAuthSession()?.user?.id || "",
      user_email: currentProfile?.email || getAuthSession()?.user?.email || "",
      role: currentProfile?.role || "",
    },
    inputs: collectInputValues(),
    internalSummary: {
      directCost: result.directCost,
      customerRevenue: result.customerRevenue,
      profit: result.profit,
      marginRate: Number((result.actualMargin * 100).toFixed(2)),
      discountRoom: result.discountRoom,
    },
    internalDetails: result.details,
    customerQuote: {
      projectName: result.state.projectName,
      areaPyeong: result.state.areaPyeong,
      clientName: result.state.clientName,
      phone: result.state.clientPhone,
      savedAt,
      total: result.customerRevenue,
      totalText: customerWon(result.customerRevenue),
      status: "상담",
      groups: groupedCustomerItems(result.details, result.quoteLines),
    },
  };
}

function renderCustomerQuoteTable(quote, rows, groupTotals) {
  rows.innerHTML = "";
  groupTotals.innerHTML = "";
  if (!quote) {
    return;
  }
  for (const group of quote.groups) {
    const headerRow = document.createElement("tr");
    headerRow.className = "quote-group-row";
    headerRow.innerHTML = `
      <td>${group.label}</td>
      <td>공정 합계</td>
      <td>${group.totalText}</td>
    `;
    rows.appendChild(headerRow);

    for (const item of group.items) {
      const row = document.createElement("tr");
      row.className = "quote-item-row";
      row.innerHTML = `
        <td></td>
        <td>${item.name}</td>
        <td>${item.amountText}</td>
      `;
      rows.appendChild(row);
    }
  }

  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총 금액</td>
    <td>총 공사금액</td>
    <td>${quote.totalText}</td>
  `;
  rows.appendChild(totalRow);

  groupTotals.innerHTML = quote.groups.map((group) => `
    <div>
      <span>${group.label}</span>
      <strong>${group.totalText}</strong>
    </div>
  `).join("");
}

function buildAdminMarginGroups(estimate) {
  if (!estimate) return [];
  const details = estimate.internalDetails || [];
  const groups = new Map();
  const ensureGroup = (label) => {
    if (!groups.has(label)) groups.set(label, { label, cost: 0, customer: 0 });
    return groups.get(label);
  };

  for (const detail of details) {
    const label = quoteGroupLabels[detail.group] || detail.group || "기타";
    const group = ensureGroup(label);
    group.cost += Number(detail.cost) || 0;
    group.customer += Number.isFinite(detail.customerRevenue)
      ? detail.customerRevenue
      : floorThousand(Number(detail.revenue) || 0);
  }

  const customerTotal = Number(estimate.total ?? estimate.customerQuote?.total ?? estimate.internalSummary?.customerRevenue) || 0;
  const costTotal = Number(estimate.costTotal ?? estimate.internalSummary?.directCost) || 0;
  const groupedCustomer = [...groups.values()].reduce((sum, group) => sum + group.customer, 0);
  const groupedCost = [...groups.values()].reduce((sum, group) => sum + group.cost, 0);
  const customerDiff = customerTotal - groupedCustomer;
  const costDiff = costTotal - groupedCost;
  if (Math.abs(customerDiff) >= 1 || Math.abs(costDiff) >= 1) {
    const group = ensureGroup("기타");
    group.customer += customerDiff;
    group.cost += costDiff;
  }

  return quoteGroupOrder
    .map((label) => groups.get(label))
    .filter((group) => group && (Math.abs(group.customer) >= 1 || Math.abs(group.cost) >= 1))
    .map((group) => {
      const profit = group.customer - group.cost;
      const marginRate = group.customer > 0 ? profit / group.customer : 0;
      return { ...group, profit, marginRate };
    });
}

function renderAdminMarginTable(estimate) {
  const rows = document.getElementById("adminQuoteRows");
  const groupTotals = document.getElementById("adminQuoteGroupTotals");
  if (!rows || !groupTotals) return;
  rows.innerHTML = "";
  groupTotals.innerHTML = "";

  const groups = buildAdminMarginGroups(estimate);
  if (!groups.length) {
    rows.innerHTML = `<tr><td colspan="5">표시할 상세견적이 없습니다.</td></tr>`;
    groupTotals.innerHTML = `<div><span>공정별 마진</span><strong>없음</strong></div>`;
    return;
  }

  for (const group of groups) {
    const row = document.createElement("tr");
    row.className = "quote-item-row";
    row.innerHTML = `
      <td>${group.label}</td>
      <td>${customerWon(group.customer)}</td>
      <td>${won(group.cost)}</td>
      <td>${won(group.profit)}</td>
      <td>${(group.marginRate * 100).toFixed(1)}%</td>
    `;
    rows.appendChild(row);
  }

  const totalCustomer = groups.reduce((sum, group) => sum + group.customer, 0);
  const totalCost = groups.reduce((sum, group) => sum + group.cost, 0);
  const totalProfit = totalCustomer - totalCost;
  const totalMarginRate = totalCustomer > 0 ? totalProfit / totalCustomer : 0;
  const totalRow = document.createElement("tr");
  totalRow.className = "quote-total-row";
  totalRow.innerHTML = `
    <td>총계</td>
    <td>${customerWon(totalCustomer)}</td>
    <td>${won(totalCost)}</td>
    <td>${won(totalProfit)}</td>
    <td>${(totalMarginRate * 100).toFixed(1)}%</td>
  `;
  rows.appendChild(totalRow);

  groupTotals.innerHTML = `
    <div><span>고객용 총액</span><strong>${customerWon(totalCustomer)}</strong></div>
    <div><span>내부 원가</span><strong>${won(totalCost)}</strong></div>
    <div><span>총 마진</span><strong>${won(totalProfit)}</strong></div>
    <div><span>마진율</span><strong>${(totalMarginRate * 100).toFixed(1)}%</strong></div>
  `;
}

function renderPrintQuote(quote) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !quote) return;
  sheet.innerHTML = `
    <header>
      <p>공사 견적서</p>
      <h1>${quote.projectName}</h1>
      <dl>
        <div><dt>평형</dt><dd>${quote.areaPyeong}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(quote.savedAt)}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>금액</th></tr>
      </thead>
      <tbody>
        ${quote.groups.map((group) => `
          <tr>
            <td>${printGroupLabels[group.label] || `${group.label}공사`}</td>
            <td>${group.totalText}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <footer>
      <div><span>총 공사금액</span><strong>${quote.totalText}</strong></div>
      <p>※ 부가세 별도 금액입니다.</p>
      <p>※ 현장 실측 및 최종 자재 선택에 따라 공사금액은 조정될 수 있습니다.</p>
    </footer>
  `;
}

function renderAdminProcessTotals(quote) {
  const box = document.getElementById("adminProcessTotals");
  if (!box) return;
  box.innerHTML = quote?.groups?.length
    ? quote.groups.map((group) => `
      <div>
        <span>${group.label}</span>
        <strong>${group.totalText}</strong>
      </div>
    `).join("")
    : "<div><span>공정별 합계</span><strong>없음</strong></div>";
}

function renderCustomerQuote(estimate) {
  const quote = estimate?.customerQuote;
  const rows = document.getElementById("quoteRows");
  const groupTotals = document.getElementById("quoteGroupTotals");
  const adminRows = document.getElementById("adminQuoteRows");
  const adminGroupTotals = document.getElementById("adminQuoteGroupTotals");

  if (!quote) {
    document.getElementById("quoteProject").textContent = "저장된 견적이 없습니다";
    document.getElementById("quoteArea").textContent = "-";
    document.getElementById("quoteDate").textContent = "-";
    document.getElementById("quoteTotal").textContent = "0원";
    renderCustomerQuoteTable(null, rows, groupTotals);
    if (adminRows && adminGroupTotals) renderAdminMarginTable(null);
    renderAdminProcessTotals(null);
    return;
  }

  document.getElementById("quoteProject").textContent = quote.projectName;
  document.getElementById("quoteArea").textContent = `${quote.areaPyeong}평`;
  document.getElementById("quoteDate").textContent = formatDateTime(quote.savedAt);
  document.getElementById("quoteTotal").textContent = quote.totalText;
  renderCustomerQuoteTable(quote, rows, groupTotals);
  if (adminRows && adminGroupTotals) renderAdminMarginTable(estimate);
  renderPrintQuote(quote);
  renderAdminProcessTotals(quote);
}

async function renderSavedEstimateRows() {
  const tbody = document.getElementById("savedEstimateRows");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7">저장된 견적을 불러오는 중입니다.</td></tr>`;
  try {
    const estimates = await loadEstimates();
    cachedEstimates = estimates;
    renderProjectSearchResults();
    tbody.innerHTML = estimates.length
      ? estimates.map((estimate) => `
        <tr>
          <td>${estimate.projectName}</td>
          <td>${formatDateTime(estimate.savedAt)}</td>
          <td>${estimate.areaPyeong}평</td>
          <td>${estimate.totalText}</td>
          <td>${estimate.status || "상담"}</td>
          <td><button type="button" data-open-estimate="${estimate.id}">열기</button></td>
          <td><button type="button" data-delete-estimate="${estimate.id}">삭제</button></td>
        </tr>
      `).join("")
      : `<tr><td colspan="7">저장된 견적이 없습니다.</td></tr>`;
  } catch (error) {
    console.error("견적 조회 실패", error);
    tbody.innerHTML = `<tr><td colspan="7">견적 조회에 실패했습니다.</td></tr>`;
    alert("Supabase 견적 조회에 실패했습니다.");
  }
}

function renderStandardCheck(state) {
  const checks = [
    ["욕실", state.bathroomEnabled && state.bathroomUnits > 0],
    ["주방 부속/기기", state.kitchenEnabled && (state.kitchenSinkBowlUnits + state.kitchenFaucetUnits + state.kitchenHoodUnits > 0 || state.kitchenStandardInstallEnabled)],
    ["일반 폐기물", state.generalWasteEnabled],
    ["세대 내 보양", state.interiorProtectionEnabled],
    ["입주청소", state.moveInCleaningEnabled],
    ["중문", state.middleDoorUnits > 0],
    ["일반도어", state.standardDoorUnits > 0],
    ["슬라이딩도어", state.slidingDoorUnits > 0],
    ["도배", state.wallpaperEnabled],
    ["필름", state.filmEnabled],
    ["바닥", state.flooringEnabled && state.flooringArea > 0],
    ["마감", state.siliconeEnabled || state.elasticEnabled],
    ["도어/창호", state.middleDoorUnits > 0 || state.standardDoorUnits > 0 || state.slidingDoorUnits > 0 || state.windowNoticeEnabled],
  ];
  const selected = checks.filter(([, enabled]) => enabled).map(([label]) => label);
  const unselected = checks.filter(([, enabled]) => !enabled).map(([label]) => label);
  const separate = state.windowNoticeEnabled ? ["창호: 별도 실측 후 견적"] : [];
  const renderList = (id, items) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.innerHTML = items.length
      ? items.map((item) => `<li>${item}</li>`).join("")
      : "<li>없음</li>";
  };
  renderList("standardSelectedItems", selected);
  renderList("standardUnselectedItems", unselected);
  renderList("standardSeparateItems", separate);
  renderList("adminStandardSelectedItems", selected);
  renderList("adminStandardUnselectedItems", unselected);
  renderList("adminStandardSeparateItems", separate);
}

function getSectionContentNodes(toggle) {
  const heading = toggle.closest?.(".section-heading");
  const nodes = [];
  let node = heading?.nextElementSibling;
  while (node && !node.classList?.contains("section-heading")) {
    nodes.push(node);
    node = node.nextElementSibling;
  }
  return nodes;
}

function syncSectionLocks() {
  document.querySelectorAll(".section-toggle input[type='checkbox']").forEach((toggle) => {
    for (const node of getSectionContentNodes(toggle)) {
      node.querySelectorAll("input, select, textarea, button").forEach((control) => {
        control.disabled = !toggle.checked;
      });
    }
  });
}

function syncBlockLocks() {
  document.querySelectorAll(".furniture-block > label.check-title input[type='checkbox']").forEach((toggle) => {
    const block = toggle.closest?.(".furniture-block");
    if (!block) return;
    const disabled = toggle.disabled || !toggle.checked;
    block.querySelectorAll("input, select, textarea, button").forEach((control) => {
      if (control === toggle) return;
      control.disabled = disabled;
    });
  });
}

function guardCheckboxLabelClicks() {
  document.querySelectorAll("label.inline-check, label.check-title, label.section-toggle").forEach((label) => {
    label.addEventListener("click", (event) => {
      if (event.target?.matches?.("input[type='checkbox'], input[type='radio']")) return;
      event.preventDefault();
    });
  });
}

function render() {
  const result = calculate();
  const { state, details, quoteLines, directCost, customerRevenue, profit, actualMargin, discountRoom, warnings, counts } = result;

  document.getElementById("selectionCount").textContent = `${quoteLines.length}개 항목`;
  document.getElementById("cabinetSummary").textContent =
    state.baseEnabled ? `하부 ${counts.lowerJa}자 / 상부 ${counts.upperJa}자 / 키큰장 ${counts.tallJa}자` : "미선택";
  document.getElementById("islandSummary").textContent =
    state.islandEnabled && state.islandM > 0 ? `가로 ${mmText(state.islandM)} / 세로 ${mmText(state.islandDepthMm)}, 서랍 ${state.islandDrawers}개` : "미선택";
  document.getElementById("homebarSummary").textContent =
    state.homebarEnabled && state.homebarM > 0 ? `${mmText(state.homebarM)}, 서랍 ${state.homebarDrawers}개` : "미선택";
  document.getElementById("shoeSummary").textContent =
    state.shoeEnabled && state.shoeM > 0 ? `${mmText(state.shoeM)} / ${counts.shoeJa}자` : "미선택";
  document.getElementById("fridgeLaundrySummary").textContent =
    state.fridgeLaundryEnabled && state.fridgeLaundryM > 0 ? `${mmText(state.fridgeLaundryM)} / ${counts.fridgeLaundryJa}자` : "미선택";
  document.getElementById("pantrySummary").textContent =
    state.pantryEnabled && state.pantryM > 0 ? `${mmText(state.pantryM)} / ${counts.pantryJa}자` : "미선택";
  document.getElementById("builtInSummary").textContent =
    state.builtInEnabled && state.builtInM > 0 ? `${mmText(state.builtInM)} / ${counts.builtInJa}자` : "미선택";
  document.getElementById("hangerSummary").textContent =
    state.hangerEnabled && state.hangerM > 0 ? `${mmText(state.hangerM)} / ${counts.hangerJa}자` : "미선택";
  document.getElementById("demolitionSummary").textContent =
    groupTotalFromDetails(details, "demolition") > 0 ? customerWon(groupTotalFromDetails(details, "demolition")) : "미선택";
  document.getElementById("electricalSummary").textContent =
    groupTotalFromDetails(details, "electrical") > 0
      ? `${state.electricalEnabled ? (state.electricalAgeType === "under10" ? "10년 이하" : "10년 이상") : "옵션"} / ${customerWon(groupTotalFromDetails(details, "electrical"))}`
      : "미선택";
  document.getElementById("lightingSummary").textContent =
    state.standardLightingEnabled ? customerWon(groupTotalFromDetails(details, "standardLighting")) : "미선택";
  document.getElementById("clientTotal").textContent = customerWon(customerRevenue);

  if (!activeQuoteEstimate) {
    renderCustomerQuote(buildEstimateSnapshot(result));
  }

  document.getElementById("internalCost").textContent = won(directCost);
  document.getElementById("internalRevenue").textContent = customerWon(customerRevenue);
  document.getElementById("internalProfit").textContent = won(profit);
  document.getElementById("internalMargin").textContent = `${(actualMargin * 100).toFixed(1)}%`;
  document.getElementById("discountRoom").textContent = customerWon(discountRoom);
  document.getElementById("marginStatus").textContent = warnings.some((item) => item.includes("미달")) ? "미달" : "정상";
  document.getElementById("adminInternalCost").textContent = won(directCost);
  document.getElementById("adminInternalRevenue").textContent = customerWon(customerRevenue);
  document.getElementById("adminInternalProfit").textContent = won(profit);
  document.getElementById("adminInternalMargin").textContent = `${(actualMargin * 100).toFixed(1)}%`;
  document.getElementById("adminDiscountRoom").textContent = customerWon(discountRoom);
  document.getElementById("adminMarginStatus").textContent = warnings.some((item) => item.includes("미달")) ? "미달" : "정상";
  renderInternalRows(details);
  renderWarnings(warnings);
  renderStandardCheck(state);
}

function refresh() {
  syncSectionLocks();
  syncBlockLocks();
  render();
}

function activateTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((item) => item.classList.toggle("active", item.dataset.tab === tabId));
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
}

function applyAccessControl() {
  const role = currentProfile?.role || "staff";
  document.body.dataset.role = role;
  document.getElementById("currentUserLabel").textContent = `${currentProfile?.email || "-"} · ${role}`;
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.hidden = role !== "admin";
  });
  if (role !== "admin" && document.getElementById("internal")?.classList.contains("active")) {
    activateTab("client");
  }
}

function setAuthenticated(isAuthenticated) {
  document.getElementById("loginScreen").hidden = isAuthenticated;
  document.getElementById("appShell").classList.toggle("app-locked", !isAuthenticated);
}

async function completeLogin() {
  currentProfile = await loadProfile();
  if (!currentProfile) throw new Error("프로필 정보를 불러오지 못했습니다.");
  setAuthenticated(true);
  applyAccessControl();
  refresh();
  await renderSavedEstimateRows();
}

function renderProjectSearchResults() {
  const keyword = (el.projectSearch.value || "").trim().toLowerCase();
  const select = el.projectSearchResults;
  const matches = cachedEstimates.filter((estimate) => {
    const haystack = `${estimate.projectName || ""} ${estimate.clientName || ""} ${estimate.phone || ""}`.toLowerCase();
    return !keyword || haystack.includes(keyword);
  }).slice(0, 30);
  select.innerHTML = `<option value="">${matches.length ? "프로젝트 선택" : "검색 결과 없음"}</option>`;
  for (const estimate of matches) {
    const option = document.createElement("option");
    option.value = estimate.id;
    option.textContent = `${estimate.projectName} · ${estimate.clientName || "고객명 없음"} · ${estimate.totalText}`;
    select.appendChild(option);
  }
}

function loadEstimateIntoUi(estimate) {
  restoreInputValues(estimate.inputs);
  el.projectName.value = estimate.projectName || "";
  el.areaPyeong.value = estimate.areaPyeong ?? "";
  el.clientName.value = estimate.clientName || "";
  el.clientPhone.value = estimate.phone || estimate.clientPhone || "";
  activeQuoteEstimate = null;
  refresh();
  const recalculated = {
    ...estimate,
    ...buildEstimateSnapshot(calculate()),
    id: estimate.id,
    savedAt: estimate.savedAt,
  };
  activeQuoteEstimate = recalculated;
  renderCustomerQuote(recalculated);
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
    if (button.dataset.tab === "admin") renderSavedEstimateRows();
  });
});

repairStaticKoreanLabels();
guardCheckboxLabelClicks();

document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const status = document.getElementById("loginStatus");
  try {
    status.textContent = "로그인 중입니다.";
    await signIn(document.getElementById("loginEmail").value, document.getElementById("loginPassword").value);
    await completeLogin();
    status.textContent = "";
  } catch (error) {
    console.error("로그인 실패", error);
    status.textContent = "로그인에 실패했습니다.";
    alert("로그인에 실패했습니다.");
  }
});

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await signOut();
  currentProfile = null;
  setAuthenticated(false);
  document.getElementById("loginPassword").value = "";
});

el.projectSearch?.addEventListener("input", renderProjectSearchResults);

document.getElementById("loadProjectButton")?.addEventListener("click", async () => {
  const id = el.projectSearchResults.value;
  if (!id) return;
  try {
    const estimate = await getEstimate(id);
    if (!estimate) return;
    loadEstimateIntoUi(estimate);
  } catch (error) {
    console.error("프로젝트 불러오기 실패", error);
    alert("프로젝트를 불러오지 못했습니다.");
  }
});

let saveEstimateInProgress = false;

function setSaveStatus(message) {
  const status = document.getElementById("saveStatus");
  if (status) status.textContent = message;
}

async function handleSaveEstimate() {
  if (saveEstimateInProgress) return;
  saveEstimateInProgress = true;
  try {
    setSaveStatus("저장 준비 중입니다.");
    const snapshot = buildEstimateSnapshot(calculate());
    if (!snapshot.projectName?.trim()) {
      setSaveStatus("프로젝트명을 입력해야 저장할 수 있습니다.");
      alert("프로젝트명을 입력해야 저장할 수 있습니다.");
      return;
    }
    setSaveStatus("Supabase에 저장 중입니다.");
    const saved = await saveEstimate(snapshot);
    activeQuoteEstimate = saved;
    renderCustomerQuote(saved);
    setSaveStatus(`${formatDateTime(saved.savedAt)} 저장 완료`);
    renderSavedEstimateRows().catch((error) => {
      console.warn("저장 후 목록 갱신 실패", error);
    });
    activateTab("quote");
  } catch (error) {
    console.error("견적 저장 실패", error);
    setSaveStatus("견적 저장에 실패했습니다.");
    alert(error.message || "Supabase 견적 저장에 실패했습니다.");
  } finally {
    saveEstimateInProgress = false;
  }
}

document.getElementById("saveEstimateButton")?.addEventListener("click", handleSaveEstimate);

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#saveEstimateButton");
  if (!button) return;
  event.preventDefault();
  handleSaveEstimate();
});

document.getElementById("printQuoteButton")?.addEventListener("click", () => {
  renderPrintQuote(activeQuoteEstimate?.customerQuote || buildEstimateSnapshot(calculate()).customerQuote);
  window.print();
});

document.getElementById("savedEstimateRows")?.addEventListener("click", async (event) => {
  const openId = event.target?.dataset?.openEstimate;
  const deleteId = event.target?.dataset?.deleteEstimate;
  if (openId) {
    try {
      const estimate = await getEstimate(openId);
      if (!estimate) return;
      loadEstimateIntoUi(estimate);
      activateTab("admin");
    } catch (error) {
      console.error("견적 열기 실패", error);
      alert("Supabase 견적 열기에 실패했습니다.");
    }
  }
  if (deleteId) {
    if (!confirm("저장된 견적을 삭제할까요?")) return;
    try {
      await deleteEstimate(deleteId);
      if (activeQuoteEstimate?.id === deleteId) {
        activeQuoteEstimate = null;
        renderCustomerQuote(buildEstimateSnapshot(calculate()));
      }
      renderSavedEstimateRows();
    } catch (error) {
      console.error("견적 삭제 실패", error);
      alert("Supabase 견적 삭제에 실패했습니다.");
    }
  }
});

for (const input of Object.values(el)) {
  if (!input) continue;
  if (["projectSearch", "projectSearchResults"].includes(input.id)) continue;
  input.addEventListener("input", () => {
    normalizeIntegerInput(input);
    activeQuoteEstimate = null;
    refresh();
  });
  input.addEventListener("change", () => {
    normalizeIntegerInput(input);
    activeQuoteEstimate = null;
    refresh();
  });
}

setAuthenticated(false);
loadStoredSession();
if (getAuthSession()) {
  completeLogin().catch((error) => {
    console.error("세션 복원 실패", error);
    signOut();
    setAuthenticated(false);
  });
}

