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
  updateEstimate,
  loadEstimates,
  getEstimate,
  deleteEstimate,
  loadSystemCostItems,
  loadCostItemHistory,
  loadCostPublishLogs,
  loadEstimateCount,
  saveCostItemChanges,
  cancelCostItemDraft,
  cancelAllCostDrafts,
  publishCostDrafts,
  createCostItem,
  cloneCostItem,
  updatePendingCostItem,
  loadCurrentOsUser,
  loadOsUsers,
  loadOsAuditLogs,
  createOsAuditLog,
  createOsUser,
  updateOsUser,
  resetOsUserPassword,
  changeOwnPassword,
  signIn,
  signOut,
  loadStoredSession,
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
    elevatorProtect: 200000,
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
    wallpaperMaterialPerPyeong: 10000,
    filmWorkerDay: 280000,
    flooringPerPyeong: 150000,
    silicone: 450000,
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
  "estimateStatus",
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
  "baseCountertopEnabled",
  "baseCountertop",
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
  "carpentryPartitionM",
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
let currentEditingEstimateId = null;
let currentProfile = null;
let cachedEstimates = [];
let originalCostItems = new Map();
let editedCostItems = new Map();
let dirtyItemCodes = new Set();
let costDbLoaded = false;
let systemCostHistory = [];
let systemPublishLogs = [];
let systemEstimateCount = 0;
let systemDataLoaded = false;
let osUsers = [];
let osUsersLoaded = false;
let osUserActionBusy = false;
let editingUserId = null;
let resettingUserId = null;
let passwordChangeBusy = false;
let osAuditLogs = [];
let osAuditLogsLoaded = false;
let loadedEstimateBaseline = null;
let snapshotCalculationMissingItems = [];
let costItemEditorMode = null;
let costItemEditorSourceCode = null;
let costItemActionBusy = false;
let costItemFilters = {
  keyword: "",
  category: "",
  subcategory: "",
  active: "all",
  state: "all",
  sort: "sort",
};

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

const COST_ITEM_DEFINITIONS = [
  ["rateLowerPerJa", "CABINET_LOWER", "가구", "상하부장", "하부장 자당", "자"],
  ["rateUpperPerJa", "CABINET_UPPER", "가구", "상하부장", "상부장 자당", "자"],
  ["rateIslandPerJa", "CABINET_ISLAND", "가구", "아일랜드", "아일랜드 자당", "자"],
  ["rateHomebarBuildPerJa", "CABINET_HOMEBAR_BUILD", "가구", "홈바장", "홈바장 자당", "자"],
  ["rateTallPerJa", "CABINET_TALL", "가구", "키큰장", "키큰장 자당", "자"],
  ["rateFridgeLaundryPerJa", "CABINET_FRIDGE_LAUNDRY", "가구", "냉장고장", "냉장고 및 세탁기장 자당", "자"],
  ["rateShoePerJa", "CABINET_SHOE", "가구", "신발장", "신발장 자당", "자"],
  ["ratePantryPerJa", "CABINET_PANTRY", "가구", "팬트리장", "팬트리장 자당", "자"],
  ["ratePantryDrawer", "CABINET_PANTRY_DRAWER", "가구", "팬트리장", "팬트리장 하부서랍장 1개", "개"],
  ["rateBuiltInPerJa", "CABINET_BUILT_IN_WARDROBE", "가구", "옷장", "옷장(붙박이장) 자당", "자"],
  ["rateHangerPerJa", "CABINET_HANGER_WARDROBE", "가구", "옷장", "옷장(헹거장) 자당", "자"],
  ["rateRiceCabinetPerUnit", "CABINET_RICE", "가구", "옵션", "밥솥장 1통", "통"],
  ["rateEndPanelShallow", "CABINET_EP_SHALLOW", "가구", "EP", "EP 400mm 이하", "개"],
  ["rateEndPanelDeep", "CABINET_EP_DEEP", "가구", "EP", "EP 400mm 초과", "개"],
  ["rateDrawer", "CABINET_DRAWER", "가구", "옵션", "서랍 1개", "개"],
  ["rateBachmannOutlet", "ELEC_BACHMANN_OUTLET", "가구", "주방설비", "바흐만 2구 콘센트", "개"],
  ["rateLightingPerCabinetUnit", "LIGHT_LINE_CABINET", "가구", "조명", "라인조명 1통", "통"],
  ["rateT3LightingUnit", "LIGHT_T3_CABINET", "가구", "조명", "간접조명(T3) 1라인", "라인"],
  ["rateStandardDownlight", "ELEC_DOWNLIGHT", "전기", "조명", "다운라이트 1개", "개"],
  ["rateStandardSquareLight", "ELEC_SQUARE_LIGHT", "전기", "조명", "사각매입등 1개", "개"],
  ["rateStandardCylinderLight", "ELEC_CYLINDER_LIGHT", "전기", "조명", "실린더등 1개", "개"],
  ["rateStandardT3PerM", "ELEC_T3_PER_M", "전기", "조명", "간접조명(T3) 1m", "m"],
  ["rateStandardBedWallLight", "ELEC_BED_WALL_LIGHT", "전기", "조명", "침대 벽등", "식"],
  ["rateHimacsPerM", "COUNTER_HIMACS_PER_M", "상판", "하이막스", "하이막스 1,000mm", "m"],
  ["rateKhanstoneSlab", "COUNTER_KHANSTONE_SLAB", "상판", "칸스톤", "칸스톤 12T 1장", "장"],
  ["rateKhanstoneFactory", "COUNTER_KHANSTONE_FACTORY", "상판", "칸스톤", "칸스톤 공장가공비", "식"],
  ["rateKhanstoneInstall", "COUNTER_KHANSTONE_INSTALL", "상판", "칸스톤", "칸스톤 현장시공비", "식"],
  ["rateCeramicSlab", "COUNTER_CERAMIC_SLAB", "상판", "세라믹", "세라믹 1장", "장"],
  ["rateCeramicFactory", "COUNTER_CERAMIC_FACTORY", "상판", "세라믹", "세라믹 공장가공비", "식"],
  ["rateCeramicInstall", "COUNTER_CERAMIC_INSTALL", "상판", "세라믹", "세라믹 현장시공비", "식"],
  ["rateEpPanelPerM", "COUNTER_EP_PANEL_PER_M", "상판", "EP", "EP 상판/미드웨이 1,000mm", "m"],
  ["rateDemolitionFloorPerPyeong", "DEMO_FLOOR_WOOD", "철거", "바닥", "마루철거 평당", "평"],
  ["rateDemolitionDecoTilePerPyeong", "DEMO_FLOOR_DECOTILE", "철거", "바닥", "데코타일 철거 평당", "평"],
  ["rateDemolitionFurniturePerJa", "DEMO_CABINET_PER_JA", "철거", "가구", "가구철거 자당", "자"],
  ["rateDemolitionBathroomWaterproof", "DEMO_BATHROOM_WATERPROOF", "철거", "욕실", "화장실 철거 및 방수", "칸"],
  ["rateDemolitionCeilingPerPyeong", "DEMO_CEILING_PER_PYEONG", "철거", "천장", "천장철거 평당", "평"],
  ["rateDemolitionElevatorProtect", "DEMO_ELEVATOR_PROTECT", "철거", "보양", "E/V 보양", "식"],
  ["rateDemolitionElevatorProtectRemoval", "DEMO_ELEVATOR_PROTECT_REMOVAL", "철거", "보양", "E/V 보양 철거", "식"],
  ["rateDemolitionPermit", "PERMIT_CONSTRUCTION", "인허가", "행위허가", "행위허가", "식"],
  ["rateDemolitionConsent", "PERMIT_CONSENT", "인허가", "동의서", "동의서", "식"],
  ["rateElectricalWorkerDay", "ELEC_LABOR_WORKER", "전기", "인건비", "전기 기공 1품", "품"],
  ["rateElectricalHelperDay", "ELEC_LABOR_HELPER", "전기", "인건비", "전기 조공 1품", "품"],
  ["rateElectricalUnder10Days", "ELEC_DAYS_UNDER10", "전기", "품수", "준공 10년 이하 품수", "품"],
  ["rateElectricalOver10Days", "ELEC_DAYS_OVER10", "전기", "품수", "준공 10년 이상 품수", "품"],
  ["rateElectricalWiring", "ELEC_WIRING", "전기", "자재", "전기 배선비", "식"],
  ["rateElectricalStandardSwitch", "ELEC_STANDARD_SWITCH", "전기", "기구", "AND 표준 콘센트 스위치", "식"],
  ["rateTileWorkerDay", "TILE_LABOR_WORKER", "욕실", "타일", "타일 기공 1품", "품"],
  ["rateTileHelperDay", "TILE_LABOR_HELPER", "욕실", "타일", "타일 조공 1품", "품"],
  ["rateTileGrout", "TILE_GROUT", "욕실", "타일", "타일 메지", "식"],
  ["rateWallpaperWorkerDay", "WALLPAPER_LABOR", "도배", "인건비", "도배 1품", "품"],
  ["rateWallpaperMaterialPerPyeong", "WALLPAPER_MATERIAL_PER_PYEONG", "도배", "자재", "도배 자재 평당", "평"],
  ["rateFilmWorkerDay", "FILM_LABOR", "필름", "인건비", "필름 1품", "품"],
  ["rateFlooringPerPyeong", "FLOORING_WOOD_PER_PYEONG", "바닥", "마루", "바닥(마루) 평단가", "평"],
  ["rateSilicone", "FINISH_SILICONE", "마감", "실리콘", "실리콘 기본", "식"],
  ["rateElasticBase", "FINISH_ELASTIC_BASE", "마감", "탄성", "탄성 기본", "식"],
  ["rateElasticExtraRoom", "FINISH_ELASTIC_EXTRA_ROOM", "마감", "탄성", "탄성 추가 1개소", "개소"],
  ["rateCarpentryWorkerDay", "WOOD_LABOR_WORKER", "목공", "인건비", "목공 1품", "품"],
  ["rateCarpentryMachineDay", "WOOD_MACHINE_DAY", "목공", "장비", "목공 기계품 1품", "품"],
  ["rateCarpentryLifting", "WOOD_LIFTING", "목공", "양중", "목공 양중", "식"],
  ["rateCarpentrySubsidiary", "WOOD_SUBSIDIARY", "목공", "부자재", "목공 부자재", "식"],
  ["rateCarpentryCeilingFanUnit", "WOOD_CEILING_FAN", "목공", "천장", "실링팬 1개소", "개소"],
  ["rateCarpentryDrywallSheet", "WOOD_DRYWALL_SHEET", "목공", "자재", "석고보드 1장", "장"],
  ["rateCarpentryMdfSheet", "WOOD_MDF_SHEET", "목공", "자재", "MDF 1장", "장"],
  ["rateCarpentryPlywoodSheet", "WOOD_PLYWOOD_SHEET", "목공", "자재", "합판 1장", "장"],
  ["rateCarpentryStudBundle", "WOOD_STUD_BUNDLE", "목공", "자재", "다루끼 1묶음", "묶음"],
].map(([inputId, itemCode, category, subcategory, itemName, unit], index) => ({
  inputId,
  itemCode,
  category,
  subcategory,
  itemName,
  unit,
  sortOrder: index + 1,
}));
const COST_ITEM_BY_CODE = Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.itemCode, item]));
const COST_ITEM_BY_INPUT = Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.inputId, item]));

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

function ensureEstimateStatusControl() {
  if (!document.getElementById("estimateStatus")) {
    const grid = document.querySelector(".project-info-grid");
    if (grid) {
      const label = document.createElement("label");
      label.innerHTML = `
        상태
        <select id="estimateStatus">
          <option value="견적">견적</option>
          <option value="계약">계약</option>
          <option value="착공">착공</option>
          <option value="준공">준공</option>
        </select>
      `;
      grid.appendChild(label);
      el.estimateStatus = label.querySelector("#estimateStatus");
    }
  }
}

function ensureSaveButtons() {
  const updateButton = document.getElementById("saveEstimateButton");
  if (!updateButton) return;
  updateButton.textContent = "견적 수정";
  if (document.getElementById("saveAsNewEstimateButton")) return;
  const newButton = document.createElement("button");
  newButton.id = "saveAsNewEstimateButton";
  newButton.className = "secondary-action";
  newButton.type = "button";
  newButton.textContent = "새 견적으로 저장";
  updateButton.insertAdjacentElement("afterend", newButton);
}

function ensureAdminStandardCheckLists() {
  const separate = document.getElementById("adminStandardSeparateItems");
  const grid = separate?.closest(".standard-check-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div>
      <h3>선택 항목</h3>
      <ul id="adminStandardSelectedItems"></ul>
    </div>
    <div>
      <h3>미선택 항목</h3>
      <ul id="adminStandardUnselectedItems"></ul>
    </div>
    <div>
      <h3>별도 확인</h3>
      <ul id="adminStandardSeparateItems"></ul>
    </div>
  `;
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

function ensureCostSnapshotPanel() {
  const adminPanel = document.getElementById("admin");
  const savedList = document.getElementById("savedEstimateRows")?.closest(".internal-card");
  if (!adminPanel || !savedList || document.getElementById("costSnapshotPanel")) return;
  const section = document.createElement("section");
  section.id = "costSnapshotPanel";
  section.className = "internal-card admin-only";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>원가 기준</h2>
      <p>저장 당시 원가 기준과 현재 원가 상태를 비교합니다.</p>
    </div>
    <dl class="metric-list admin-metric-list">
      <div><dt>원가 적용 기준</dt><dd id="costBasisLabel">저장된 견적 없음</dd></div>
      <div><dt>견적 저장일</dt><dd id="costBasisSavedAt">-</dd></div>
      <div><dt>저장 원가 기준 시각</dt><dd id="costSnapshotCapturedAt">-</dd></div>
      <div><dt>원가 관리 최신 수정일</dt><dd id="costDbLatestUpdatedAt">-</dd></div>
      <div><dt>현재 원가 상태</dt><dd id="costSnapshotStatus">-</dd></div>
    </dl>
    <div class="admin-action-row">
      <button id="compareCostSnapshotButton" type="button" disabled>현재 원가와 비교</button>
      <span id="costCompareStatus" class="status-text"></span>
    </div>
    <div id="costComparisonPanel" class="table-wrap" hidden></div>
  `;
  savedList.insertAdjacentElement("afterend", section);
}

function setRateDbStatus(message) {
  const status = document.getElementById("rateDbSaveStatus");
  if (status) status.textContent = message;
}

function isAdmin() {
  return currentProfile?.role === "admin";
}

function isManager() {
  return currentProfile?.role === "manager";
}

function isStaff() {
  return !currentProfile || currentProfile.role === "staff";
}

function canViewSystem() {
  return isAdmin() || isManager();
}

function canEditCost() {
  return isAdmin();
}

function canPublishCost() {
  return isAdmin();
}

function canManageUsers() {
  return isAdmin();
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function rateInputs() {
  return COST_ITEM_DEFINITIONS.map((item) => el[item.inputId]).filter(Boolean);
}

function setRateDbInputsDisabled(disabled) {
  rateInputs().forEach((input) => {
    input.disabled = disabled;
  });
  const saveButton = document.getElementById("saveRateDbButton");
  if (saveButton) saveButton.disabled = disabled || !canEditCost();
}

function rateNumber(value) {
  return Number(value) || 0;
}

function costItemFromRow(definition, row) {
  return {
    itemCode: definition.itemCode,
    category: row?.category || definition.category,
    itemName: row?.item_name || definition.itemName,
    unit: row?.unit || definition.unit,
    costPrice: rateNumber(row?.cost_price),
    defaultMarginRate: rateNumber(row?.default_margin_rate),
    updatedAt: row?.updated_at || null,
  };
}

function latestDate(values) {
  const timestamps = values
    .map((value) => value ? new Date(value).getTime() : 0)
    .filter((value) => Number.isFinite(value) && value > 0);
  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function currentCostItems() {
  return COST_ITEM_DEFINITIONS
    .map((definition) => {
      const row = originalCostItems.get(definition.itemCode);
      return row ? costItemFromRow(definition, row) : null;
    })
    .filter(Boolean);
}

function buildCostSnapshot() {
  if (!canViewSystem() || !originalCostItems.size) return null;
  const items = currentCostItems();
  return {
    capturedAt: new Date().toISOString(),
    costDbUpdatedAt: latestDate(items.map((item) => item.updatedAt)),
    source: "supabase_cost_items",
    items,
  };
}

function costSnapshotMap(snapshot) {
  return new Map((snapshot?.items || []).map((item) => [item.itemCode, item]));
}

function costSnapshotChanged(snapshot) {
  if (!snapshot?.items?.length || !originalCostItems.size) return false;
  const saved = costSnapshotMap(snapshot);
  return currentCostItems().some((current) => {
    const old = saved.get(current.itemCode);
    if (!old) return true;
    return rateNumber(old.costPrice) !== rateNumber(current.costPrice) ||
      rateNumber(old.defaultMarginRate) !== rateNumber(current.defaultMarginRate);
  });
}

function clearCostItemDirtyMark(inputId) {
  const label = document.getElementById(inputId)?.closest("label");
  label?.classList.remove("cost-item-dirty");
  label?.querySelector(".dirty-badge")?.remove();
}

function markCostItemDirty(inputId, isDirty) {
  const label = document.getElementById(inputId)?.closest("label");
  if (!label) return;
  label.classList.toggle("cost-item-dirty", isDirty);
  let badge = label.querySelector(".dirty-badge");
  if (isDirty && !badge) {
    badge = document.createElement("span");
    badge.className = "dirty-badge";
    badge.textContent = "변경됨";
    label.appendChild(badge);
  }
  if (!isDirty) badge?.remove();
}

function syncRateDirtyState(input) {
  const definition = COST_ITEM_BY_INPUT[input.id];
  if (!definition || !originalCostItems.has(definition.itemCode)) return;
  const original = originalCostItems.get(definition.itemCode);
  const edited = {
    ...original,
    cost_price: rateNumber(input.value),
  };
  editedCostItems.set(definition.itemCode, edited);
  const isDirty =
    rateNumber(original.cost_price) !== rateNumber(edited.cost_price) ||
    rateNumber(original.default_margin_rate) !== rateNumber(edited.default_margin_rate);
  if (isDirty) {
    dirtyItemCodes.add(definition.itemCode);
  } else {
    dirtyItemCodes.delete(definition.itemCode);
  }
  markCostItemDirty(input.id, isDirty);
}

async function loadRateSettings() {
  if (!canViewSystem()) {
    costDbLoaded = false;
    originalCostItems = new Map();
    editedCostItems = new Map();
    dirtyItemCodes = new Set();
    setRateDbInputsDisabled(true);
    return;
  }

  try {
    setRateDbStatus("원가 정보를 불러오는 중입니다.");
    setRateDbInputsDisabled(true);
    const rows = await loadSystemCostItems();
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("원가 관리 데이터가 비어 있습니다. 관리자에게 확인해 주세요.");
    }

    originalCostItems = new Map();
    editedCostItems = new Map();
    dirtyItemCodes = new Set();
    for (const row of rows) {
      const definition = COST_ITEM_BY_CODE[row.item_code];
      const normalized = {
        ...row,
        cost_price: rateNumber(row.cost_price),
        default_margin_rate: rateNumber(row.default_margin_rate),
      };
      originalCostItems.set(row.item_code, normalized);
      editedCostItems.set(row.item_code, { ...normalized });
      if (definition && el[definition.inputId]) {
        el[definition.inputId].value = normalized.cost_price;
        clearCostItemDirtyMark(definition.inputId);
      }
    }

    costDbLoaded = true;
    updateRatesFromAdmin();
    setRateDbInputsDisabled(!canEditCost());
    setRateDbStatus("원가 정보 연결 완료");
  } catch (error) {
    console.error("Supabase 원가DB 불러오기 실패", error);
    costDbLoaded = false;
    setRateDbInputsDisabled(true);
    setRateDbStatus("원가 정보 연결 실패");
    throw error;
  }
}

async function saveRateSettings() {
  if (!canEditCost()) {
    alert("원가 관리 저장 권한이 없습니다.");
    return;
  }
  if (!costDbLoaded) {
    alert("원가 정보가 연결되지 않아 저장할 수 없습니다.");
    return;
  }
  const changes = [...dirtyItemCodes]
    .map((itemCode) => {
      const original = originalCostItems.get(itemCode);
      const edited = editedCostItems.get(itemCode);
      if (!original || !edited) return null;
      return {
        id: original.id,
        item_code: itemCode,
        old_cost_price: rateNumber(original.cost_price),
        new_cost_price: rateNumber(edited.cost_price),
        old_margin_rate: rateNumber(original.default_margin_rate),
        new_margin_rate: rateNumber(edited.default_margin_rate),
        new_is_active: original.is_active,
      };
    })
    .filter(Boolean);

  if (!changes.length) {
    setRateDbStatus("변경된 항목이 없습니다.");
    return;
  }

  try {
    setRateDbStatus("저장 중입니다.");
    await saveCostItemChanges(changes);
    await loadRateSettings();
    await refreshSystemManagement();
    updateRatesFromAdmin();
    refresh();
    setRateDbStatus("저장 완료");
  } catch (error) {
    console.error("Supabase 원가DB 저장 실패", {
      error,
      status: error?.status,
      body: error?.body,
      endpoint: error?.endpoint,
      method: error?.method,
      updated_by: currentProfile?.id,
      currentProfileId: currentProfile?.id,
      role: currentProfile?.role,
      changes,
    });
    setRateDbStatus("저장 실패");
    alert(`원가 관리 저장에 실패했습니다.${error?.message ? `\n${error.message}` : ""}`);
  }
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
    rateWallpaperWorkerDay: "도배",
    rateFilmWorkerDay: "필름",
    rateFlooringPerPyeong: "바닥",
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
    ["#marginStatus", "목표 마진 상태"],
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
        <h2>출력</h2>
        <p>관리용 견적서와 발주내역서를 구분해서 출력합니다.</p>
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
  rates.finishMaterial.wallpaperMaterialPerPyeong = rateValue("rateWallpaperMaterialPerPyeong", rates.finishMaterial.wallpaperMaterialPerPyeong);
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
    status: el.estimateStatus?.value || "견적",
    targetMargin: (numberValue("targetMargin") || 30) / 100,
    baseEnabled: furnitureSection && checkedValue("baseEnabled"),
    lowerCabinetM: numberValue("lowerCabinetM"),
    upperCabinetM: numberValue("upperCabinetM"),
    tallCabinetM: numberValue("tallCabinetM"),
    riceCabinetUnits: numberValue("riceCabinetUnits"),
    baseEndPanels: numberValue("baseEndPanels"),
    baseEpDepth: el.baseEpDepth.value,
    baseCountertopEnabled: checkedValue("baseCountertopEnabled"),
    baseCountertop: el.baseCountertop?.value || "himacs",
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
    carpentryPartitionM: numberValue("carpentryPartitionM"),
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
    .replace(/\bEP(?!판)\b/g, "EP판");
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
    p20: baseCoat ? 6 : 5,
    p30: baseCoat ? 7 : 6,
    p40: baseCoat ? 11 : 9,
    p50: baseCoat ? 15 : 11,
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
    mmToM(state.carpentryPartitionM) * rates.carpentry.artwallDaysPerM +
    state.carpentryHiddenDoorUnits * rates.carpentry.hiddenDoorDays +
    (state.carpentryMoldingEnabled ? rates.carpentry.moldingDays : 0) +
    (state.carpentryBaseboardEnabled ? rates.carpentry.baseboardDays : 0)
  );
}

function carpentryMaterialCounts(state) {
  const wallLength = state.carpentryArtwallM;
  const partitionLength = state.carpentryPartitionM;
  const wallArea = wallLength * state.carpentryCeilingHeight;
  const partitionArea = partitionLength * state.carpentryCeilingHeight;
  const artwallBoards = wallArea > 0 ? Math.ceil(wallArea / boardArea()) : 0;
  const partitionBoards = partitionArea > 0 ? Math.ceil(partitionArea / boardArea()) * 2 : 0;
  const totalWallBoards = artwallBoards + partitionBoards;
  const plywoodBase = state.carpentryTvUnits * 2;
  const mdfBase = Math.max(0, artwallBoards - plywoodBase) + partitionBoards;
  const verticalStuds = wallLength > 0 ? Math.ceil(wallLength / rates.carpentry.studSpacing) : 0;
  const partitionVerticalStuds = partitionLength > 0 ? Math.ceil(partitionLength / rates.carpentry.studSpacing) : 0;
  const wallStudLength = (wallLength * 2) + (state.carpentryCeilingHeight * verticalStuds);
  const partitionStudLength = ((partitionLength * 2) + (state.carpentryCeilingHeight * partitionVerticalStuds)) * 2;
  const studLength = wallStudLength + partitionStudLength;
  const studBundleLength = rates.carpentry.studPieceLength * rates.carpentry.studPiecesPerBundle;
  return {
    totalWallBoards,
    artwallBoards,
    partitionBoards,
    mdfBase,
    plywoodBase,
    mdf: boardCountWithWaste(mdfBase),
    plywood: boardCountWithWaste(plywoodBase),
    drywall: 0,
    studLength,
    studLengthWithWaste: studLength * rates.carpentry.wasteFactor,
    studBundles: studLength > 0 ? Math.ceil((studLength * rates.carpentry.wasteFactor) / studBundleLength) : 0,
    verticalStuds,
    partitionVerticalStuds,
    wallStudLength,
    partitionStudLength,
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
  const baseCounter = rates.countertop[state.baseCountertop];
  const homebarCounter = rates.countertop[state.homebarCountertop];
  const homebarMidway = rates.countertop[state.homebarMidway];
  const baseCounterBillingM = state.lowerCabinetM > 0 ? Math.max(1, mmToM(state.lowerCabinetM)) : 0;
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
    if (state.baseCountertopEnabled && state.lowerCabinetM > 0) {
      addDetail(details, {
        group: "base",
        item: `상하부장 상판(${baseCounter.label})`,
        input: `하부장 ${mmText(state.lowerCabinetM)}`,
        quantity: countertopQuantity(state.baseCountertop, baseCounterBillingM),
        unitPrice: isSlabMaterial(state.baseCountertop) ? slabBaseCost(state.baseCountertop) : baseCounter.costPerM,
        cost: countertopCost(state.baseCountertop, baseCounterBillingM),
        margin,
        correction: state.corrections.countertop,
      });
    }
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

  const carpentryRawDays = carpentryLaborDays(state);
  const carpentryDays = Math.ceil(carpentryRawDays);
  const carpentryMaterials = carpentryMaterialCounts(state);
  const carpentryActive = hasCarpentryWork(state, carpentryRawDays, carpentryMaterials);
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 인건비",
    enabled: carpentryRawDays > 0,
    input: `산출 ${quantityText(carpentryRawDays, "품")} / 올림`,
    quantity: quantityText(carpentryDays, "품"),
    unitPrice: rates.carpentry.workerDay,
    units: carpentryDays,
    margin,
    correction: state.corrections.option,
  });
  addUnitDetail(details, {
    group: "carpentry",
    item: "목공 기계품",
    enabled: carpentryRawDays > 0,
    input: `산출 ${quantityText(carpentryRawDays, "품")} / 올림`,
    quantity: `${carpentryDays}일`,
    unitPrice: rates.carpentry.machineDay,
    units: carpentryDays,
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
    input: `벽체 ${Math.max(0, carpentryMaterials.artwallBoards - carpentryMaterials.plywoodBase)}장 + 가벽 양면 ${carpentryMaterials.partitionBoards}장 / 15% 할증`,
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
    input: `벽체 ${mmText(carpentryMaterials.wallStudLength)} + 가벽 ${mmText(carpentryMaterials.partitionStudLength)} / 15% 할증`,
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
    (state.baseEnabled && state.baseCountertopEnabled && state.lowerCabinetM > 0 && isSlabMaterial(state.baseCountertop)) ||
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
  if (!tbody && !adminTbody) return;
  if (tbody) tbody.innerHTML = "";
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
    if (tbody) tbody.appendChild(row);
    if (adminTbody) adminTbody.appendChild(row.cloneNode(true));
  }
}

function renderWarnings(warnings) {
  const box = document.getElementById("internalWarnings");
  if (!box) return;
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

function isEstimateInputExcluded(id) {
  return Boolean(COST_ITEM_BY_INPUT[id]);
}

function collectInputValues() {
  return Object.fromEntries(Object.entries(el)
    .filter(([id]) => !isEstimateInputExcluded(id))
    .map(([id, input]) => [
    id,
    input?.type === "checkbox" ? Boolean(input.checked) : input?.value ?? "",
  ]));
}

function restoreInputValues(inputs = {}) {
  for (const [id, value] of Object.entries(inputs)) {
    if (isEstimateInputExcluded(id)) continue;
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

function buildEstimateSnapshot(result, options = {}) {
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
    status: result.state.status || "견적",
    costSnapshot: options.costSnapshot || buildCostSnapshot(),
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
      status: result.state.status || "견적",
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
    row.className = "admin-margin-row";
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

function renderStoredInternalSummary(estimate) {
  if (!estimate) return;
  const summary = estimate.internalSummary || {};
  const directCost = Number(estimate.costTotal ?? summary.directCost) || 0;
  const customerRevenue = Number(estimate.total ?? summary.customerRevenue) || 0;
  const profit = Number.isFinite(summary.profit) ? summary.profit : customerRevenue - directCost;
  const marginRate = Number.isFinite(summary.marginRate)
    ? summary.marginRate
    : (customerRevenue > 0 ? (profit / customerRevenue) * 100 : Number(estimate.marginRate) || 0);
  setText("internalCost", won(directCost));
  setText("internalRevenue", customerWon(customerRevenue));
  setText("internalProfit", won(profit));
  setText("internalMargin", `${Number(marginRate).toFixed(1)}%`);
  setText("adminInternalCost", won(directCost));
  setText("adminInternalRevenue", customerWon(customerRevenue));
  setText("adminInternalProfit", won(profit));
  setText("adminInternalMargin", `${Number(marginRate).toFixed(1)}%`);
}

function renderCostSnapshotInfo(estimate) {
  if (!isAdmin()) return;
  const snapshot = estimate?.costSnapshot;
  const currentLatest = latestDate(currentCostItems().map((item) => item.updatedAt));
  setText("costBasisLabel", estimate ? (snapshot ? "저장 당시 원가" : "기존 저장 계산 결과") : "저장된 견적 없음");
  setText("costBasisSavedAt", estimate?.savedAt ? formatDateTime(estimate.savedAt) : "-");
  setText("costSnapshotCapturedAt", snapshot?.capturedAt ? formatDateTime(snapshot.capturedAt) : "저장 원가 기준 없음");
  setText("costDbLatestUpdatedAt", currentLatest ? formatDateTime(currentLatest) : "-");
  const compareButton = document.getElementById("compareCostSnapshotButton");
  const comparePanel = document.getElementById("costComparisonPanel");
  const status = document.getElementById("costCompareStatus");
  if (comparePanel) {
    comparePanel.hidden = true;
    comparePanel.innerHTML = "";
  }
  if (status) status.textContent = "";
  if (!estimate) {
    setText("costSnapshotStatus", "-");
    if (compareButton) compareButton.disabled = true;
    return;
  }
  if (!snapshot?.items?.length) {
    setText("costSnapshotStatus", "저장 원가 기준 없음");
    if (compareButton) compareButton.disabled = true;
    return;
  }
  setText("costSnapshotStatus", costSnapshotChanged(snapshot) ? "저장 이후 변경됨" : "저장 당시와 동일");
  if (compareButton) compareButton.disabled = !originalCostItems.size;
}

function renderCostSnapshotComparison(estimate) {
  const panel = document.getElementById("costComparisonPanel");
  const status = document.getElementById("costCompareStatus");
  if (!panel || !estimate?.costSnapshot?.items?.length) {
    if (status) status.textContent = "원가 스냅샷이 없어 비교할 수 없습니다.";
    return;
  }
  const saved = costSnapshotMap(estimate.costSnapshot);
  const current = currentCostItems();
  const rows = current
    .map((item) => {
      const old = saved.get(item.itemCode);
      if (!old) return null;
      const diff = rateNumber(item.costPrice) - rateNumber(old.costPrice);
      const diffRate = rateNumber(old.costPrice) > 0 ? diff / rateNumber(old.costPrice) : 0;
      return { ...item, savedPrice: rateNumber(old.costPrice), diff, diffRate };
    })
    .filter((item) => item && item.diff !== 0);
  const savedDirectCost = Number(estimate.costTotal ?? estimate.internalSummary?.directCost) || 0;
  const currentSnapshot = buildEstimateSnapshot(calculate());
  const currentDirectCost = Number(currentSnapshot.costTotal) || 0;
  const directDiff = currentDirectCost - savedDirectCost;
  panel.hidden = false;
  panel.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>항목명</th>
          <th>저장 당시 단가</th>
          <th>현재 단가</th>
          <th>증감액</th>
          <th>증감률</th>
        </tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((item) => `
          <tr>
            <td>${item.itemName}</td>
            <td>${won(item.savedPrice)}</td>
            <td>${won(item.costPrice)}</td>
            <td>${won(item.diff)}</td>
            <td>${(item.diffRate * 100).toFixed(1)}%</td>
          </tr>
        `).join("") : `<tr><td colspan="5">현재 원가와 저장 당시 원가가 동일합니다.</td></tr>`}
      </tbody>
    </table>
    <div class="quote-total-list">
      <div><span>저장 당시 직접원가</span><strong>${won(savedDirectCost)}</strong></div>
      <div><span>현재 원가 적용 예상 직접원가</span><strong>${won(currentDirectCost)}</strong></div>
      <div><span>예상 증감액</span><strong>${won(directDiff)}</strong></div>
    </div>
  `;
  if (status) status.textContent = "비교 완료";
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

function currentEstimateForPrint() {
  return activeQuoteEstimate || buildEstimateSnapshot(calculateForCurrentEstimate());
}

function renderAdminDetailPrint(estimate) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  const details = estimate.internalDetails || [];
  sheet.innerHTML = `
    <header>
      <p>상세견적</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>항목</th><th>입력</th><th>산출</th><th>단가</th><th>직접원가</th><th>고객가</th><th>마진</th></tr>
      </thead>
      <tbody>
        ${details.map((item) => `
          <tr>
            <td>${item.item}</td>
            <td>${item.input}</td>
            <td>${item.quantity}</td>
            <td>${won(item.unitPrice)}</td>
            <td>${won(item.cost)}</td>
            <td>${customerWon(item.revenue)}</td>
            <td>${won(item.customerRevenue - item.cost)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <footer>
      <div><span>고객용 총액</span><strong>${customerWon(estimate.total || 0)}</strong></div>
      <div><span>내부 원가</span><strong>${won(estimate.costTotal || 0)}</strong></div>
    </footer>
  `;
}

function renderAdminInternalPrint(estimate) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  const groups = buildAdminMarginGroups(estimate);
  const totalCustomer = groups.reduce((sum, group) => sum + group.customer, 0);
  const totalCost = groups.reduce((sum, group) => sum + group.cost, 0);
  const totalProfit = totalCustomer - totalCost;
  const totalMarginRate = totalCustomer > 0 ? totalProfit / totalCustomer : 0;
  sheet.innerHTML = `
    <header>
      <p>내부견적</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>고객용</th><th>내부용</th><th>마진</th><th>마진율</th></tr>
      </thead>
      <tbody>
        ${groups.map((group) => `
          <tr>
            <td>${group.label}</td>
            <td>${customerWon(group.customer)}</td>
            <td>${won(group.cost)}</td>
            <td>${won(group.profit)}</td>
            <td>${(group.marginRate * 100).toFixed(1)}%</td>
          </tr>
        `).join("")}
        <tr>
          <td>총계</td>
          <td>${customerWon(totalCustomer)}</td>
          <td>${won(totalCost)}</td>
          <td>${won(totalProfit)}</td>
          <td>${(totalMarginRate * 100).toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function purchaseOrderItems(estimate) {
  const orderGroups = new Set(["base", "island", "homebar", "shoe", "fridgeLaundry", "pantry", "builtIn", "hanger", "kitchen", "bathroom", "wallpaper", "film", "flooring", "standardLighting", "carpentry"]);
  const materialKeywords = [
    "자재", "MDF", "합판", "다루끼", "각재", "상판", "칸스톤", "세라믹", "하이막스", "EP",
    "싱크볼", "싱크수전", "후드", "도기", "수전", "장식장", "악세사리", "휴젠트",
    "벽지", "필름", "마루", "다운라이트", "매입등", "실린더", "콘센트", "스위치",
    "밥솥장", "서랍", "신발장", "팬트리", "붙박이", "헹거", "냉장고", "세탁기",
    "하부장", "상부장", "키큰장", "홈바장", "아일랜드", "제작"
  ];
  const excludedKeywords = ["인건비", "기공", "조공", "시공", "설치비", "철거", "방수", "양중", "폐기물", "청소", "보양", "허가", "동의서"];
  return (estimate?.internalDetails || [])
    .filter((item) => {
      const text = `${item.item} ${item.input} ${item.quantity}`;
      if (!orderGroups.has(item.group)) return false;
      return materialKeywords.some((keyword) => text.includes(keyword)) &&
        !excludedKeywords.some((keyword) => text.includes(keyword));
    })
    .map((item) => ({
      process: quoteGroupLabels[item.group] || item.group || "기타",
      item: item.item,
      spec: item.input,
      quantity: item.quantity,
      budget: item.cost,
    }));
}

function renderPurchaseOrder(estimate) {
  const rows = document.getElementById("purchaseOrderRows");
  const summary = document.getElementById("purchaseOrderSummary");
  if (!rows || !summary) return;
  const items = purchaseOrderItems(estimate || currentEstimateForPrint());
  rows.innerHTML = items.length
    ? items.map((item) => `
      <tr>
        <td>${item.process}</td>
        <td>${item.item}</td>
        <td>${item.spec}</td>
        <td>${item.quantity}</td>
        <td>${won(item.budget)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="5">발주 필요 품목이 없습니다.</td></tr>`;
  summary.innerHTML = `
    <div><span>발주 품목</span><strong>${items.length}개</strong></div>
    <div><span>예상 원가</span><strong>${won(items.reduce((sum, item) => sum + item.budget, 0))}</strong></div>
  `;
}

function renderPurchaseOrderPrint(estimate) {
  const sheet = document.getElementById("printQuoteSheet");
  if (!sheet || !estimate) return;
  const items = purchaseOrderItems(estimate);
  sheet.innerHTML = `
    <header>
      <p>발주내역서</p>
      <h1>${estimate.projectName || "상담 프로젝트"}</h1>
      <dl>
        <div><dt>평형</dt><dd>${estimate.areaPyeong || "-"}평</dd></div>
        <div><dt>작성일</dt><dd>${formatDateTime(estimate.savedAt || new Date().toISOString())}</dd></div>
      </dl>
    </header>
    <table>
      <thead>
        <tr><th>공정</th><th>품목</th><th>사양</th><th>수량</th><th>예상 원가</th></tr>
      </thead>
      <tbody>
        ${items.length ? items.map((item) => `
          <tr>
            <td>${item.process}</td>
            <td>${item.item}</td>
            <td>${item.spec}</td>
            <td>${item.quantity}</td>
            <td>${won(item.budget)}</td>
          </tr>
        `).join("") : `<tr><td colspan="5">발주 필요 품목이 없습니다.</td></tr>`}
      </tbody>
    </table>
    <footer>
      <div><span>발주 품목</span><strong>${items.length}개</strong></div>
      <div><span>예상 원가</span><strong>${won(items.reduce((sum, item) => sum + item.budget, 0))}</strong></div>
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
    setText("quoteProject", "저장된 견적이 없습니다");
    setText("quoteArea", "-");
    setText("quoteDate", "-");
    setText("quoteTotal", "0원");
    renderCustomerQuoteTable(null, rows, groupTotals);
    if (isAdmin() && adminRows && adminGroupTotals) renderAdminMarginTable(null);
    renderPurchaseOrder(null);
    renderAdminProcessTotals(null);
    renderCostSnapshotInfo(null);
    return;
  }

  setText("quoteProject", quote.projectName);
  setText("quoteArea", `${quote.areaPyeong}평`);
  setText("quoteDate", formatDateTime(quote.savedAt));
  setText("quoteTotal", quote.totalText);
  renderCustomerQuoteTable(quote, rows, groupTotals);
  if (isAdmin() && adminRows && adminGroupTotals) renderAdminMarginTable(estimate);
  renderPurchaseOrder(estimate);
  renderPrintQuote(quote);
  renderAdminProcessTotals(quote);
  renderCostSnapshotInfo(estimate);
}

async function renderSavedEstimateRows() {
  const tbody = document.getElementById("savedEstimateRows");
  if (!tbody) return;
  const admin = isAdmin();
  const colspan = admin ? 7 : 8;
  tbody.innerHTML = `<tr><td colspan="${colspan}">저장된 견적을 불러오는 중입니다.</td></tr>`;
  try {
    const estimates = await loadEstimates();
    cachedEstimates = estimates;
    renderProjectSearchResults();
    tbody.innerHTML = estimates.length
      ? estimates.map((estimate) => admin ? `
        <tr>
          <td>${estimate.projectName}</td>
          <td>${formatDateTime(estimate.savedAt)}</td>
          <td>${estimate.areaPyeong}평</td>
          <td>${estimate.totalText}</td>
          <td>${estimate.status || "상담"}</td>
          <td><button type="button" data-open-estimate="${estimate.id}">열기</button></td>
          <td><button type="button" data-delete-estimate="${estimate.id}">삭제</button></td>
        </tr>
      ` : `
        <tr>
          <td>${estimate.projectName || "-"}</td>
          <td>${estimate.clientName || "-"}</td>
          <td>${estimate.phone || "-"}</td>
          <td>${estimate.areaPyeong || "-"}평</td>
          <td>${estimate.status || "상담"}</td>
          <td>${estimate.totalText}</td>
          <td>${formatDateTime(estimate.savedAt)}</td>
          <td><button type="button" data-open-estimate="${estimate.id}">열기</button></td>
        </tr>
      `).join("")
      : `<tr><td colspan="${colspan}">저장된 견적이 없습니다.</td></tr>`;
  } catch (error) {
    console.error("견적 조회 실패", error);
    tbody.innerHTML = `<tr><td colspan="${colspan}">견적 조회에 실패했습니다.</td></tr>`;
    alert("견적 조회에 실패했습니다.");
  }
}

function renderStandardCheck(state) {
  const checks = [
    ["욕실", state.bathroomEnabled || state.bathroomUnits > 0],
    ["주방 부속/기기", state.kitchenEnabled || state.kitchenSinkBowlUnits + state.kitchenFaucetUnits + state.kitchenHoodUnits > 0 || state.kitchenStandardInstallEnabled],
    ["일반 폐기물", state.generalWasteEnabled],
    ["세대 내 보양", state.interiorProtectionEnabled],
    ["입주청소", state.moveInCleaningEnabled],
    ["중문", state.middleDoorUnits > 0],
    ["일반도어", state.standardDoorUnits > 0],
    ["슬라이딩도어", state.slidingDoorUnits > 0],
    ["도배", state.wallpaperEnabled],
    ["필름", state.filmEnabled],
    ["바닥", state.flooringEnabled || state.flooringArea > 0],
    ["마감", state.siliconeEnabled || state.elasticEnabled || state.elasticExtraRooms > 0],
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
  const result = calculateForCurrentEstimate();
  const { state, details, quoteLines, directCost, customerRevenue, profit, actualMargin, discountRoom, warnings, counts } = result;
  const usesStoredEstimateSnapshot = syncLoadedEstimateSnapshot();

  setText("selectionCount", `${quoteLines.length}개 항목`);
  setText("cabinetSummary", state.baseEnabled ? `하부 ${counts.lowerJa}자 / 상부 ${counts.upperJa}자 / 키큰장 ${counts.tallJa}자` : "미선택");
  setText("islandSummary", state.islandEnabled && state.islandM > 0 ? `가로 ${mmText(state.islandM)} / 세로 ${mmText(state.islandDepthMm)}, 서랍 ${state.islandDrawers}개` : "미선택");
  setText("homebarSummary", state.homebarEnabled && state.homebarM > 0 ? `${mmText(state.homebarM)}, 서랍 ${state.homebarDrawers}개` : "미선택");
  setText("shoeSummary", state.shoeEnabled && state.shoeM > 0 ? `${mmText(state.shoeM)} / ${counts.shoeJa}자` : "미선택");
  setText("fridgeLaundrySummary", state.fridgeLaundryEnabled && state.fridgeLaundryM > 0 ? `${mmText(state.fridgeLaundryM)} / ${counts.fridgeLaundryJa}자` : "미선택");
  setText("pantrySummary", state.pantryEnabled && state.pantryM > 0 ? `${mmText(state.pantryM)} / ${counts.pantryJa}자` : "미선택");
  setText("builtInSummary", state.builtInEnabled && state.builtInM > 0 ? `${mmText(state.builtInM)} / ${counts.builtInJa}자` : "미선택");
  setText("hangerSummary", state.hangerEnabled && state.hangerM > 0 ? `${mmText(state.hangerM)} / ${counts.hangerJa}자` : "미선택");
  setText("demolitionSummary", groupTotalFromDetails(details, "demolition") > 0 ? customerWon(groupTotalFromDetails(details, "demolition")) : "미선택");
  setText(
    "electricalSummary",
    groupTotalFromDetails(details, "electrical") > 0
      ? `${state.electricalEnabled ? (state.electricalAgeType === "under10" ? "10년 이하" : "10년 이상") : "옵션"} / ${customerWon(groupTotalFromDetails(details, "electrical"))}`
      : "미선택"
  );
  setText("lightingSummary", state.standardLightingEnabled ? customerWon(groupTotalFromDetails(details, "standardLighting")) : "미선택");
  setText("clientTotal", customerWon(customerRevenue));

  if (usesStoredEstimateSnapshot && activeQuoteEstimate) {
    renderCustomerQuote(activeQuoteEstimate);
  } else if (!activeQuoteEstimate) {
    renderCustomerQuote(buildEstimateSnapshot(result));
  }

  setText("internalCost", won(directCost));
  setText("internalRevenue", customerWon(customerRevenue));
  setText("internalProfit", won(profit));
  setText("internalMargin", `${(actualMargin * 100).toFixed(1)}%`);
  setText("discountRoom", customerWon(discountRoom));
  setText("marginStatus", warnings.some((item) => item.includes("미달")) ? "미달" : "정상");
  setText("adminInternalCost", won(directCost));
  setText("adminInternalRevenue", customerWon(customerRevenue));
  setText("adminInternalProfit", won(profit));
  setText("adminInternalMargin", `${(actualMargin * 100).toFixed(1)}%`);
  setText("adminDiscountRoom", customerWon(discountRoom));
  setText("adminMarginStatus", warnings.some((item) => item.includes("미달")) ? "미달" : "정상");
  renderInternalRows(details);
  renderWarnings(warnings);
  renderStandardCheck(state);
  renderPurchaseOrder(buildEstimateSnapshot(result));

  if (usesStoredEstimateSnapshot && activeQuoteEstimate) {
    const storedTotal = Number(activeQuoteEstimate.total ?? activeQuoteEstimate.customerQuote?.total) || 0;
    setText("clientTotal", customerWon(storedTotal));
    renderStoredInternalSummary(activeQuoteEstimate);
    renderInternalRows(activeQuoteEstimate.internalDetails || []);
    renderPurchaseOrder(activeQuoteEstimate);
  }
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

let staffAdminShellApplied = false;

function renderStaffAdminShell() {
  if (staffAdminShellApplied) return;
  const adminPanel = document.getElementById("admin");
  if (!adminPanel) return;
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
  staffAdminShellApplied = true;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function percentText(value) {
  return `${(rateNumber(value) * 100).toFixed(1)}%`;
}

function draftValue(row, key) {
  if (key === "cost") return row.draft_cost_price ?? row.cost_price;
  if (key === "margin") return row.draft_margin_rate ?? row.default_margin_rate;
  if (key === "active") return row.draft_is_active ?? row.is_active;
  return null;
}

function hasDraft(row) {
  return row?.draft_cost_price !== null && row?.draft_cost_price !== undefined ||
    row?.draft_margin_rate !== null && row?.draft_margin_rate !== undefined ||
    row?.draft_is_active !== null && row?.draft_is_active !== undefined;
}

function changedCostItems() {
  return [...originalCostItems.values()].filter(hasDraft);
}

function latestPublishLog() {
  return systemPublishLogs[0] || null;
}

function systemCategories() {
  return [...new Set([...originalCostItems.values()].map((row) => row.category || "기타"))]
    .sort((a, b) => String(a).localeCompare(String(b), "ko-KR"));
}

function rowsBySystemFilter({ scope = "all", category = "", activeMode = "active" } = {}) {
  return [...originalCostItems.values()].filter((row) => {
    if (scope === "category" && row.category !== category) return false;
    if (activeMode === "active" && !row.is_active) return false;
    return true;
  });
}

const COST_CALCULATION_BASIS_OPTIONS = [
  ["fixed", "고정금액"],
  ["apartment_pyeong", "아파트 평형"],
  ["flooring_pyeong", "실제 시공평수"],
  ["length_mm", "길이(mm)"],
  ["length_m", "길이(m)"],
  ["area_sqm", "면적(㎡)"],
  ["count", "개수"],
  ["bathroom_count", "욕실 개소"],
  ["lower_cabinet_length", "하부장 길이"],
  ["upper_cabinet_length", "상부장 길이"],
  ["homebar_length", "홈바장 길이"],
  ["island_length", "아일랜드 길이"],
  ["partition_length", "가벽 길이"],
  ["manual_input", "사용자 직접입력"],
];

const COST_ROUNDING_OPTIONS = [
  ["none", "소수 유지"],
  ["ceil", "정수 올림"],
  ["floor", "정수 내림"],
  ["round", "반올림"],
];

function systemSubcategories(category = "") {
  return [...new Set([...originalCostItems.values()]
    .filter((row) => !category || row.category === category)
    .map((row) => row.subcategory || "")
    .filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "ko-KR"));
}

function filteredSystemCostItems() {
  const keyword = costItemFilters.keyword.trim().toLowerCase();
  const rows = [...originalCostItems.values()].filter((row) => {
    if (keyword) {
      const haystack = `${row.item_code || ""} ${row.item_name || ""}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    if (costItemFilters.category && row.category !== costItemFilters.category) return false;
    if (costItemFilters.subcategory && row.subcategory !== costItemFilters.subcategory) return false;
    if (costItemFilters.active === "active" && !row.is_active) return false;
    if (costItemFilters.active === "inactive" && row.is_active) return false;
    if (costItemFilters.state === "draft" && !hasDraft(row)) return false;
    if (costItemFilters.state === "pending" && !row.is_pending_new) return false;
    if (costItemFilters.state === "published" && row.is_pending_new) return false;
    return true;
  });
  return rows.sort((a, b) => {
    if (costItemFilters.sort === "updated") {
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    }
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

function costItemFormDefaults(source = {}) {
  return {
    item_code: source.item_code || "",
    category: source.category || systemCategories()[0] || "",
    subcategory: source.subcategory || "",
    item_name: source.item_name || "",
    unit: source.unit || "",
    calculation_basis: source.calculation_basis || "manual_input",
    cost_price: source.cost_price ?? "",
    default_margin_rate: source.default_margin_rate ?? 0.3,
    is_active: source.draft_is_active ?? source.is_active ?? true,
    sort_order: source.sort_order ?? 0,
    memo: source.memo || "",
    customer_name: source.customer_name || "",
    order_name: source.order_name || "",
    calculation_multiplier: source.calculation_multiplier ?? 1,
    min_quantity: source.min_quantity ?? "",
    rounding_method: source.rounding_method || "none",
    include_in_customer_quote: source.include_in_customer_quote ?? true,
    include_in_internal_quote: source.include_in_internal_quote ?? true,
    include_in_order_sheet: source.include_in_order_sheet ?? false,
    is_material: source.is_material ?? false,
    is_labor: source.is_labor ?? false,
    is_service: source.is_service ?? false,
  };
}

function canonicalInputValues(inputs = {}) {
  return JSON.stringify(Object.keys(inputs)
    .sort()
    .reduce((acc, key) => {
      if (!isEstimateInputExcluded(key)) acc[key] = inputs[key];
      return acc;
    }, {}));
}

function currentInputKey() {
  return canonicalInputValues(collectInputValues());
}

function loadedEstimateMatchesCurrentInputs() {
  return Boolean(loadedEstimateBaseline?.inputs && currentInputKey() === loadedEstimateBaseline.inputs);
}

function syncLoadedEstimateSnapshot() {
  if (!loadedEstimateBaseline?.estimate) return false;
  if (loadedEstimateMatchesCurrentInputs()) {
    activeQuoteEstimate = loadedEstimateBaseline.estimate;
    return true;
  }
  if (activeQuoteEstimate?.id === loadedEstimateBaseline.id) {
    activeQuoteEstimate = null;
  }
  return false;
}

function shouldUseLoadedCostSnapshot() {
  return Boolean(
    loadedEstimateBaseline?.estimate?.costSnapshot?.items?.length &&
    !loadedEstimateMatchesCurrentInputs()
  );
}

function requiredMissingSnapshotItems(snapshot, state) {
  const saved = costSnapshotMap(snapshot);
  const missing = [];
  if (state?.wallpaperMaterialEnabled && !saved.has("WALLPAPER_MATERIAL_PER_PYEONG")) {
    missing.push("도배 자재비");
  }
  return missing;
}

function calculateForCurrentEstimate() {
  snapshotCalculationMissingItems = [];
  if (!shouldUseLoadedCostSnapshot()) return calculate();

  const snapshot = loadedEstimateBaseline.estimate.costSnapshot;
  const saved = costSnapshotMap(snapshot);
  const previousValues = [];
  for (const definition of COST_ITEM_DEFINITIONS) {
    const input = el[definition.inputId];
    const item = saved.get(definition.itemCode);
    if (!input || !item) continue;
    previousValues.push([input, input.value]);
    input.value = rateNumber(item.costPrice);
  }

  try {
    updateRatesFromAdmin();
    const result = calculate();
    snapshotCalculationMissingItems = requiredMissingSnapshotItems(snapshot, result.state);
    return result;
  } finally {
    previousValues.forEach(([input, value]) => {
      input.value = value;
    });
    updateRatesFromAdmin();
  }
}

function marginDistribution(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = percentText(row.default_margin_rate);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([rate, count]) => `${rate} ${count}개`).join(" / ") || "-";
}

function existingDraftCount(rows) {
  return rows.filter(hasDraft).length;
}

async function writeSystemAudit(action, payload = {}) {
  if (!canManageUsers()) return;
  try {
    await createOsAuditLog({
      action,
      target_type: payload.target_type || "cost_items",
      target_id: payload.target_id || null,
      target_label: payload.target_label || null,
      before_data: payload.before_data || null,
      after_data: payload.after_data || null,
      result: payload.result || "SUCCESS",
      reason: payload.reason || null,
    });
  } catch (error) {
    console.warn("시스템 감사 기록 저장 실패", error);
  }
}

function ensureSystemManagementShell() {
  if (!canViewSystem()) return;
  const tabs = document.querySelector(".tabs");
  if (tabs && !document.querySelector('[data-tab="system"]')) {
    const button = document.createElement("button");
    button.className = "tab-button system-tab-button";
    button.dataset.tab = "system";
    button.type = "button";
    button.textContent = "시스템 관리";
    tabs.appendChild(button);
    button.addEventListener("click", () => {
      activateTab("system");
      refreshSystemManagement().catch((error) => console.error("시스템 관리 갱신 실패", error));
    });
  }
  if (!document.getElementById("system")) {
    const section = document.createElement("section");
    section.className = "tab-panel system-panel";
    section.id = "system";
    section.innerHTML = `
      <section class="internal-card system-status-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>시스템 현황</h2>
          <p>원가 관리, 변경 예정값, 배포, 견적 저장 상태를 확인합니다.</p>
        </div>
        <dl class="metric-list system-metric-list" id="systemStatusMetrics"></dl>
      </section>
      <section class="internal-card system-cost-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>원가 관리</h2>
          <p>운영값과 변경 예정값을 분리해 확인합니다.</p>
        </div>
        <div id="systemBulkMarginPanel" class="system-operation-panel"></div>
        <div id="systemCostItemTools" class="system-operation-panel"></div>
        <div id="systemCostItemEditor" class="system-operation-panel" hidden></div>
        <div class="table-wrap system-cost-wrap"><table class="system-cost-table"><thead><tr>
          <th>품목명</th><th>운영<br>원가</th><th>변경 예정<br>원가</th><th>운영<br>마진율</th><th>변경 예정<br>마진율(%)</th><th class="admin-system-only">임시<br>저장</th><th>카테고리</th><th>운영<br>상태</th><th>변경 예정<br>상태</th><th>상태</th><th>최근 수정일</th><th class="admin-system-only">작업</th>
        </tr></thead><tbody id="systemCostRows"></tbody></table></div>
      </section>
      <section class="internal-card system-publish-card">
        <div class="section-heading compact-heading no-side-padding">
          <h2>배포 준비</h2>
          <p>변경 예정 품목을 확인한 뒤 관리자만 배포할 수 있습니다.</p>
        </div>
        <div id="systemPublishSummary" class="system-publish-summary"></div>
        <div id="systemCategoryCancelPanel" class="system-operation-panel"></div>
        <div class="table-wrap"><table><thead><tr><th>품목</th><th>운영값</th><th>변경 예정값</th><th>차이</th><th class="admin-system-only">취소</th></tr></thead><tbody id="systemDraftRows"></tbody></table></div>
        <div id="systemPublishActions" class="admin-action-row system-publish-actions"></div>
        <p id="systemStatusText" class="status-text"></p>
      </section>
      <section class="internal-card system-history-card">
        <div class="section-heading compact-heading no-side-padding"><h2>변경 이력</h2><p>배포 단위 품목 변경 내역입니다.</p></div>
        <div class="table-wrap"><table><thead><tr><th>버전</th><th>품목</th><th>이전 값</th><th>변경 값</th><th>활성 변경</th><th>사유</th><th>변경자</th><th>변경일</th></tr></thead><tbody id="systemHistoryRows"></tbody></table></div>
      </section>
      <section class="internal-card system-log-card">
        <div class="section-heading compact-heading no-side-padding"><h2>배포 기록</h2><p>배포 단위 이력입니다.</p></div>
        <div id="systemRollbackPanel" class="system-operation-panel"></div>
        <div class="table-wrap"><table><thead><tr><th>버전</th><th>변경 품목 수</th><th>사유</th><th>배포자</th><th>배포일시</th><th class="admin-system-only">원복</th></tr></thead><tbody id="systemPublishLogRows"></tbody></table></div>
      </section>
    `;
    document.querySelector(".tab-panel#admin")?.insertAdjacentElement("afterend", section);
  }
  renderSystemManagement();
}

function removeSystemManagementShell() {
  document.querySelector('[data-tab="system"]')?.remove();
  document.getElementById("system")?.remove();
}

function setSystemStatus(message) {
  const node = document.getElementById("systemStatusText");
  if (node) node.textContent = message;
}

function renderSystemStatus() {
  const box = document.getElementById("systemStatusMetrics");
  if (!box) return;
  const items = [...originalCostItems.values()];
  const drafts = changedCostItems();
  const latest = latestPublishLog();
  const metrics = [
    ["전체 원가 품목 수", items.length.toLocaleString("ko-KR")],
    ["활성 품목 수", items.filter((item) => item.is_active).length.toLocaleString("ko-KR")],
    ["변경 예정 품목 수", drafts.length.toLocaleString("ko-KR")],
    ["최근 배포 버전", latest?.version || "-"],
    ["최근 배포 일시", latest?.published_at ? formatDateTime(latest.published_at) : "-"],
    ["저장된 견적 수", systemEstimateCount.toLocaleString("ko-KR")],
  ];
  box.innerHTML = metrics.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("");
}

function renderBulkMarginPanel() {
  const panel = document.getElementById("systemBulkMarginPanel");
  if (!panel) return;
  const categories = systemCategories();
  const activeRows = rowsBySystemFilter({ activeMode: "active" });
  if (!canEditCost()) {
    panel.innerHTML = `
      <div class="system-readonly-note">
        <strong>마진 일괄 변경</strong>
        <span>매니저는 원가와 변경 예정값을 조회만 할 수 있습니다.</span>
      </div>`;
    return;
  }
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>마진 일괄 변경</h3>
      <p>운영값은 즉시 바뀌지 않고 변경 예정 마진율만 생성됩니다.</p>
    </div>
    <div class="system-bulk-grid">
      <label>적용 범위
        <select id="bulkMarginScope">
          <option value="all">전체 품목</option>
          <option value="category">공정별</option>
        </select>
      </label>
      <label>공정
        <select id="bulkMarginCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>대상 상태
        <select id="bulkMarginActiveMode">
          <option value="active" selected>활성 품목만</option>
          <option value="all">전체 품목</option>
        </select>
      </label>
      <label>변경 마진율(%)
        <input id="bulkMarginRate" type="number" min="0" max="99" step="0.1" value="30">
      </label>
      <label>기존 변경 예정값
        <select id="bulkMarginDraftPolicy">
          <option value="keep" selected>유지</option>
          <option value="overwrite">덮어쓰기</option>
        </select>
      </label>
      <button type="button" data-system-action="bulk-margin-preview">대상 확인</button>
      <button type="button" data-system-action="bulk-margin-apply">변경 예정값으로 일괄 적용</button>
    </div>
    <p id="bulkMarginPreview" class="status-text">
      기본 대상: 활성 품목 ${activeRows.length}개 / 현재 마진율 분포 ${marginDistribution(activeRows)}
    </p>`;
}

function renderCategoryCancelPanel() {
  const panel = document.getElementById("systemCategoryCancelPanel");
  if (!panel) return;
  if (!canEditCost()) {
    panel.innerHTML = "";
    return;
  }
  const categories = systemCategories();
  panel.innerHTML = `
    <div class="system-category-cancel">
      <label>공정별 임시저장 취소
        <select id="cancelDraftCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <button type="button" data-system-action="cancel-category-drafts">선택 공정 임시저장 취소</button>
    </div>`;
}

function renderCostItemTools() {
  const panel = document.getElementById("systemCostItemTools");
  if (!panel) return;
  const categories = systemCategories();
  const subcategories = systemSubcategories(costItemFilters.category);
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>품목 검색·필터</h3>
      <p>품목 수가 늘어나도 코드, 이름, 분류, 상태로 빠르게 찾습니다.</p>
    </div>
    <div class="system-bulk-grid cost-item-filter-grid">
      <label>검색
        <input id="costItemSearch" type="search" value="${escapeHtml(costItemFilters.keyword)}" placeholder="품목명 또는 코드">
      </label>
      <label>대분류
        <select id="costItemCategoryFilter">
          <option value="">전체</option>
          ${categories.map((item) => `<option value="${escapeHtml(item)}" ${costItemFilters.category === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>중분류
        <select id="costItemSubcategoryFilter">
          <option value="">전체</option>
          ${subcategories.map((item) => `<option value="${escapeHtml(item)}" ${costItemFilters.subcategory === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>활성 상태
        <select id="costItemActiveFilter">
          <option value="all" ${costItemFilters.active === "all" ? "selected" : ""}>전체</option>
          <option value="active" ${costItemFilters.active === "active" ? "selected" : ""}>활성</option>
          <option value="inactive" ${costItemFilters.active === "inactive" ? "selected" : ""}>비활성</option>
        </select>
      </label>
      <label>운영 상태
        <select id="costItemStateFilter">
          <option value="all" ${costItemFilters.state === "all" ? "selected" : ""}>전체</option>
          <option value="draft" ${costItemFilters.state === "draft" ? "selected" : ""}>변경 예정</option>
          <option value="pending" ${costItemFilters.state === "pending" ? "selected" : ""}>신규 배포 대기</option>
          <option value="published" ${costItemFilters.state === "published" ? "selected" : ""}>운영 품목</option>
        </select>
      </label>
      <label>정렬
        <select id="costItemSortFilter">
          <option value="sort" ${costItemFilters.sort === "sort" ? "selected" : ""}>정렬 순서</option>
          <option value="updated" ${costItemFilters.sort === "updated" ? "selected" : ""}>최근 수정순</option>
        </select>
      </label>
      ${canEditCost() ? `<button type="button" data-system-action="cost-item-create-open">+ 품목 추가</button>` : ""}
    </div>`;
}

function renderCostItemEditor() {
  const panel = document.getElementById("systemCostItemEditor");
  if (!panel) return;
  if (!canEditCost() || !costItemEditorMode) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  const source = costItemEditorSourceCode ? originalCostItems.get(costItemEditorSourceCode) : null;
  const isEdit = costItemEditorMode === "edit";
  const isClone = costItemEditorMode === "clone";
  const defaults = costItemFormDefaults(source || {});
  if (!isEdit) {
    defaults.item_code = "";
    defaults.item_name = "";
  }
  const categories = systemCategories();
  const subcategories = systemSubcategories(defaults.category);
  panel.hidden = false;
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>${isEdit ? "신규 품목 수정" : isClone ? "품목 복제" : "품목 추가"}</h3>
      <p>신규 품목은 배포 전까지 운영 견적 계산에 사용되지 않습니다.</p>
    </div>
    <form id="costItemForm" class="cost-item-form">
      <div class="cost-item-form-grid">
        <label>품목 코드
          <input id="costItemCode" type="text" value="${escapeHtml(defaults.item_code)}" ${isEdit ? "readonly" : ""} placeholder="SYSTEM_TEST_MATERIAL_ITEM">
        </label>
        <label>품목명
          <input id="costItemName" type="text" value="${escapeHtml(defaults.item_name)}">
        </label>
        <label>대분류
          <select id="costItemCategory">
            ${categories.map((item) => `<option value="${escapeHtml(item)}" ${defaults.category === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label>중분류
          <select id="costItemSubcategory">
            ${subcategories.map((item) => `<option value="${escapeHtml(item)}" ${defaults.subcategory === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
          </select>
        </label>
        <label>단위
          <input id="costItemUnit" type="text" value="${escapeHtml(defaults.unit)}">
        </label>
        <label>계산 기준
          <select id="costItemCalculationBasis">
            ${COST_CALCULATION_BASIS_OPTIONS.map(([value, label]) => `<option value="${escapeHtml(value)}" ${defaults.calculation_basis === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
          </select>
        </label>
        <label>기본 원가
          <input id="costItemCostPrice" type="number" min="0" step="1000" value="${defaults.cost_price}">
        </label>
        <label>기본 마진율(%)
          <input id="costItemMarginRate" type="number" min="0" max="99" step="0.1" value="${(rateNumber(defaults.default_margin_rate) * 100).toFixed(1)}">
        </label>
        <label>활성 상태
          <select id="costItemActive">
            <option value="true" ${defaults.is_active ? "selected" : ""}>활성</option>
            <option value="false" ${!defaults.is_active ? "selected" : ""}>비활성</option>
          </select>
        </label>
        <label>정렬 순서
          <input id="costItemSortOrder" type="number" min="0" step="1" value="${defaults.sort_order}">
        </label>
        <label>계산 배수
          <input id="costItemMultiplier" type="number" min="0" step="0.01" value="${defaults.calculation_multiplier}">
        </label>
        <label>최소 수량
          <input id="costItemMinQuantity" type="number" min="0" step="0.01" value="${defaults.min_quantity}">
        </label>
        <label>수량 올림 방식
          <select id="costItemRounding">
            ${COST_ROUNDING_OPTIONS.map(([value, label]) => `<option value="${value}" ${defaults.rounding_method === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
        <label>고객 표시명
          <input id="costItemCustomerName" type="text" value="${escapeHtml(defaults.customer_name)}">
        </label>
        <label>내부 설명
          <input id="costItemMemo" type="text" value="${escapeHtml(defaults.memo)}">
        </label>
        <label>발주 표시명
          <input id="costItemOrderName" type="text" value="${escapeHtml(defaults.order_name)}">
        </label>
      </div>
      <div class="cost-item-checks">
        <label class="inline-check"><input id="costItemCustomerQuote" type="checkbox" ${defaults.include_in_customer_quote ? "checked" : ""}><span>고객 견적 표시</span></label>
        <label class="inline-check"><input id="costItemInternalQuote" type="checkbox" ${defaults.include_in_internal_quote ? "checked" : ""}><span>내부 견적 표시</span></label>
        <label class="inline-check"><input id="costItemOrderSheet" type="checkbox" ${defaults.include_in_order_sheet ? "checked" : ""}><span>발주내역 표시</span></label>
        <label class="inline-check"><input id="costItemMaterial" type="checkbox" ${defaults.is_material ? "checked" : ""}><span>자재</span></label>
        <label class="inline-check"><input id="costItemLabor" type="checkbox" ${defaults.is_labor ? "checked" : ""}><span>인건비</span></label>
        <label class="inline-check"><input id="costItemService" type="checkbox" ${defaults.is_service ? "checked" : ""}><span>기타/서비스</span></label>
      </div>
      <p class="status-text">새 입력 필드가 필요한 품목은 배포 전 “견적 입력 화면 연결 필요” 상태를 확인하세요.</p>
      <div class="admin-action-row">
        <button type="submit" ${costItemActionBusy ? "disabled" : ""}>${isEdit ? "수정 임시저장" : isClone ? "복제 임시저장" : "신규 임시저장"}</button>
        <button type="button" data-system-action="cost-item-editor-close">취소</button>
      </div>
    </form>`;
}

function renderSystemCostRows() {
  const tbody = document.getElementById("systemCostRows");
  if (!tbody) return;
  const rows = filteredSystemCostItems();
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12">조건에 맞는 원가 품목이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map((row) => {
    const dirty = hasDraft(row);
    const draftCost = row.draft_cost_price ?? "";
    const draftMargin = row.draft_margin_rate ?? 0.3;
    const draftActive = draftValue(row, "active");
    const draftCostCell = canEditCost()
      ? `<input class="system-draft-input" data-system-field="cost" data-item-code="${row.item_code}" type="number" step="1000" min="0" value="${draftCost}">`
      : (row.draft_cost_price !== null && row.draft_cost_price !== undefined ? won(row.draft_cost_price) : "-");
    const draftMarginCell = canEditCost()
      ? `<input class="system-draft-input system-margin-input" data-system-field="margin" data-item-code="${row.item_code}" type="number" step="0.1" min="0" max="99" value="${(rateNumber(draftMargin) * 100).toFixed(1)}">`
      : (row.draft_margin_rate !== null && row.draft_margin_rate !== undefined ? percentText(row.draft_margin_rate) : "-");
    const draftActiveCell = canEditCost()
      ? `<select class="system-draft-input" data-system-field="active" data-item-code="${row.item_code}"><option value="true" ${draftActive ? "selected" : ""}>활성</option><option value="false" ${!draftActive ? "selected" : ""}>비활성</option></select>`
      : (draftActive ? "활성" : "비활성");
    const actionCell = canEditCost()
      ? `<button type="button" data-system-action="save-draft" data-item-code="${row.item_code}">임시저장</button>`
      : "";
    const stateLabel = row.is_pending_new ? "신규 배포 대기" : dirty ? "변경 예정" : "운영";
    const managementActions = canEditCost()
      ? `<div class="cost-item-row-actions">
          <button type="button" data-system-action="cost-item-clone-open" data-item-code="${row.item_code}">복제</button>
          ${row.is_pending_new ? `<button type="button" data-system-action="cost-item-edit-open" data-item-code="${row.item_code}">수정</button>` : ""}
          <button type="button" data-system-action="deactivate-draft" data-item-code="${row.item_code}">${row.is_active ? "비활성화 예정" : "재활성화 예정"}</button>
        </div>`
      : "";
    return `
      <tr class="${dirty ? "system-dirty-row" : ""} ${row.is_pending_new ? "system-pending-row" : ""}">
        <td>${escapeHtml(row.item_name || row.itemCode)}</td>
        <td>${won(row.cost_price)}</td>
        <td>${draftCostCell}</td>
        <td>${percentText(row.default_margin_rate)}</td>
        <td>${draftMarginCell}</td>
        <td class="admin-system-only">${actionCell}</td>
        <td>${escapeHtml(row.category || "-")}</td>
        <td>${row.is_active ? "활성" : "비활성"}</td>
        <td>${draftActiveCell}</td>
        <td>${stateLabel}</td>
        <td>${row.updated_at ? formatDateTime(row.updated_at) : "-"}</td>
        <td class="admin-system-only">${managementActions}</td>
      </tr>`;
  }).join("");
}
function draftChangeText(row) {
  const parts = [];
  if (row.draft_cost_price !== null && row.draft_cost_price !== undefined) parts.push(`단가 ${won(row.cost_price)} → ${won(row.draft_cost_price)}`);
  if (row.draft_margin_rate !== null && row.draft_margin_rate !== undefined) parts.push(`마진 ${percentText(row.default_margin_rate)} → ${percentText(row.draft_margin_rate)}`);
  if (row.draft_is_active !== null && row.draft_is_active !== undefined) parts.push(`활성 ${row.is_active ? "활성" : "비활성"} → ${row.draft_is_active ? "활성" : "비활성"}`);
  return parts.join(" / ") || "-";
}

function renderSystemDraftRows() {
  const tbody = document.getElementById("systemDraftRows");
  const summary = document.getElementById("systemPublishSummary");
  const actions = document.getElementById("systemPublishActions");
  if (!tbody || !summary || !actions) return;
  const rows = changedCostItems();
  summary.innerHTML = `<strong>변경 예정 품목 수: ${rows.length.toLocaleString("ko-KR")}개</strong>`;
  tbody.innerHTML = rows.length ? rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.item_name || row.item_code)}</td>
      <td>${won(row.cost_price)} / ${percentText(row.default_margin_rate)} / ${row.is_active ? "활성" : "비활성"}</td>
      <td>${won(draftValue(row, "cost"))} / ${percentText(draftValue(row, "margin"))} / ${draftValue(row, "active") ? "활성" : "비활성"}</td>
      <td>${escapeHtml(draftChangeText(row))}</td>
      <td class="admin-system-only">${canEditCost() ? `<button type="button" data-system-action="cancel-draft" data-item-code="${row.item_code}">임시저장 취소</button>` : ""}</td>
    </tr>
  `).join("") : `<tr><td colspan="5">배포 대기 중인 변경 예정값이 없습니다.</td></tr>`;
  actions.innerHTML = canPublishCost() ? `
    <label class="system-publish-reason">배포 사유<input id="systemPublishReason" type="text" maxlength="500" placeholder="사유를 입력하세요"></label>
    <button type="button" data-system-action="publish" ${rows.length ? "" : "disabled"}>배포</button>
    <button type="button" data-system-action="cancel-all-drafts" ${rows.length ? "" : "disabled"}>전체 임시저장 취소</button>
  ` : "";
}

function renderSystemHistoryRows() {
  const tbody = document.getElementById("systemHistoryRows");
  if (!tbody) return;
  tbody.innerHTML = systemCostHistory.length ? systemCostHistory.map((row) => {
    const item = row.cost_items || {};
    return `<tr>
      <td>${escapeHtml(row.cost_version || "-")}</td>
      <td>${escapeHtml(item.item_name || item.item_code || row.cost_item_id || "-")}</td>
      <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)}</td>
      <td>${won(row.new_cost_price)} / ${percentText(row.new_margin_rate)}</td>
      <td>${row.old_is_active === row.new_is_active ? "-" : `${row.old_is_active ? "활성" : "비활성"} → ${row.new_is_active ? "활성" : "비활성"}`}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
      <td>${escapeHtml(row.changed_by || "-")}</td>
      <td>${row.changed_at ? formatDateTime(row.changed_at) : "-"}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="8">변경 이력이 없습니다.</td></tr>`;
}

function renderSystemPublishLogRows() {
  const tbody = document.getElementById("systemPublishLogRows");
  if (!tbody) return;
  tbody.innerHTML = systemPublishLogs.length ? systemPublishLogs.map((row) => `
    <tr>
      <td>${escapeHtml(row.version || "-")}</td>
      <td>${Number(row.changed_item_count || 0).toLocaleString("ko-KR")}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
      <td>${escapeHtml(row.published_by || "-")}</td>
      <td>${row.published_at ? formatDateTime(row.published_at) : "-"}</td>
      <td class="admin-system-only">${canEditCost() ? `<button type="button" data-system-action="rollback-view" data-version="${escapeHtml(row.version || "")}">변경 내역 보기</button>` : ""}</td>
    </tr>
  `).join("") : `<tr><td colspan="6">배포 기록이 없습니다.</td></tr>`;
}

function renderRollbackPanel(version = "") {
  const panel = document.getElementById("systemRollbackPanel");
  if (!panel) return;
  if (!canEditCost()) {
    panel.innerHTML = "";
    return;
  }
  if (!version) {
    panel.innerHTML = `<p class="status-text">배포 기록에서 변경 내역을 선택하면 원복 예정값을 검토할 수 있습니다.</p>`;
    return;
  }
  const log = systemPublishLogs.find((item) => item.version === version);
  const rows = systemCostHistory.filter((row) => row.cost_version === version);
  const categories = [...new Set(rows.map((row) => row.cost_items?.category || "기타"))];
  const reviewed = rows.map((row) => {
    const item = row.cost_items || {};
    const current = originalCostItems.get(item.item_code);
    const conflict = !current ||
      rateNumber(current.cost_price) !== rateNumber(row.new_cost_price) ||
      rateNumber(current.default_margin_rate) !== rateNumber(row.new_margin_rate) ||
      Boolean(current.is_active) !== Boolean(row.new_is_active);
    return { row, item, current, conflict };
  });
  const conflictCount = reviewed.filter((item) => item.conflict).length;
  panel.innerHTML = `
    <div class="system-operation-header">
      <h3>원복 검토: ${escapeHtml(version)}</h3>
      <p>이전 값을 새 변경 예정값으로 생성합니다. 운영값은 배포 전까지 바뀌지 않습니다.</p>
    </div>
    <dl class="system-rollback-meta">
      <div><dt>원본 사유</dt><dd>${escapeHtml(log?.reason || "-")}</dd></div>
      <div><dt>원본 배포자</dt><dd>${escapeHtml(log?.published_by || "-")}</dd></div>
      <div><dt>원본 배포일</dt><dd>${log?.published_at ? formatDateTime(log.published_at) : "-"}</dd></div>
      <div><dt>대상 품목</dt><dd>${rows.length}개 / 충돌 ${conflictCount}개</dd></div>
    </dl>
    <div class="system-bulk-grid">
      <label>원복 단위
        <select id="rollbackScope">
          <option value="version">버전 전체</option>
          <option value="category">공정별</option>
          <option value="item">특정 품목</option>
        </select>
      </label>
      <label>공정
        <select id="rollbackCategory">
          ${categories.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}
        </select>
      </label>
      <label>품목
        <select id="rollbackItemCode">
          ${reviewed.map(({ item }) => `<option value="${escapeHtml(item.item_code || "")}">${escapeHtml(item.item_name || item.item_code || "-")}</option>`).join("")}
        </select>
      </label>
      <label class="inline-check"><input id="rollbackForceConflicts" type="checkbox"><span>충돌 품목도 변경 예정값 생성</span></label>
      <button type="button" data-system-action="rollback-create" data-version="${escapeHtml(version)}">원복 예정값 생성</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>품목</th><th>원본 변경 전</th><th>원본 변경 후</th><th>현재 운영값</th><th>원복 예정값</th><th>충돌</th></tr></thead><tbody>
      ${reviewed.map(({ row, item, current, conflict }) => `
        <tr class="${conflict ? "system-conflict-row" : ""}">
          <td>${escapeHtml(item.item_name || item.item_code || "-")}</td>
          <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)} / ${row.old_is_active ? "활성" : "비활성"}</td>
          <td>${won(row.new_cost_price)} / ${percentText(row.new_margin_rate)} / ${row.new_is_active ? "활성" : "비활성"}</td>
          <td>${current ? `${won(current.cost_price)} / ${percentText(current.default_margin_rate)} / ${current.is_active ? "활성" : "비활성"}` : "품목 없음"}</td>
          <td>${won(row.old_cost_price)} / ${percentText(row.old_margin_rate)} / ${row.old_is_active ? "활성" : "비활성"}</td>
          <td>${conflict ? "충돌" : "-"}</td>
        </tr>
      `).join("")}
    </tbody></table></div>`;
}

function roleLabel(role) {
  return { admin: "관리자", manager: "매니저", staff: "직원" }[role] || "직원";
}

function passwordStatusLabel(user) {
  return user.must_change_password ? "변경 필요" : "변경 완료";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isValidInitialPassword(value) {
  const password = String(value || "");
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function setUserManagementStatus(message, type = "") {
  const node = document.getElementById("userManagementStatus");
  if (!node) return;
  node.textContent = message || "";
  node.dataset.status = type;
}

function renderUserManagementRows() {
  const tbody = document.getElementById("userManagementRows");
  if (!tbody) return;
  if (!osUsersLoaded) {
    tbody.innerHTML = `<tr><td colspan="8">사용자 목록을 불러오는 중입니다.</td></tr>`;
    return;
  }
  if (!osUsers.length) {
    tbody.innerHTML = `<tr><td colspan="8">등록된 사용자가 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = osUsers.map((user) => `
    <tr>
      <td>${escapeHtml(user.name || "-")}</td>
      <td>${escapeHtml(user.email || "-")}</td>
      <td>${roleLabel(user.role)}</td>
      <td>${user.is_active ? "활성" : "비활성"}</td>
      <td>${passwordStatusLabel(user)}</td>
      <td>${user.created_at ? formatDateTime(user.created_at) : "-"}</td>
      <td>${user.updated_at ? formatDateTime(user.updated_at) : "-"}</td>
      <td class="user-action-cell">
        <button type="button" data-user-action="edit" data-user-id="${user.id}">수정</button>
        <button type="button" data-user-action="reset-password" data-user-id="${user.id}">초기 비밀번호 재설정</button>
      </td>
    </tr>
  `).join("");
}

function renderUserEditPanel() {
  const panel = document.getElementById("userEditPanel");
  if (!panel) return;
  if (!editingUserId) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  const user = osUsers.find((item) => item.id === editingUserId);
  if (!user) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h3>사용자 수정</h3>
      <p>마지막 활성 관리자는 비활성화하거나 역할을 낮출 수 없고, 본인 계정은 직접 비활성화할 수 없습니다.</p>
    </div>
    <form id="userEditForm" class="user-management-form">
      <label>이름<input id="editUserName" type="text" value="${escapeHtml(user.name || "")}" autocomplete="off"></label>
      <label>역할<select id="editUserRole">
        <option value="admin" ${user.role === "admin" ? "selected" : ""}>관리자</option>
        <option value="manager" ${user.role === "manager" ? "selected" : ""}>매니저</option>
        <option value="staff" ${user.role === "staff" ? "selected" : ""}>직원</option>
      </select></label>
      <label>상태<select id="editUserActive">
        <option value="true" ${user.is_active ? "selected" : ""}>활성</option>
        <option value="false" ${!user.is_active ? "selected" : ""}>비활성</option>
      </select></label>
      <div class="admin-action-row">
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>수정 저장</button>
        <button type="button" data-user-action="cancel-edit">취소</button>
      </div>
    </form>
  `;
}

function renderUserResetPanel() {
  const panel = document.getElementById("userPasswordPanel");
  if (!panel) return;
  if (!resettingUserId) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  const user = osUsers.find((item) => item.id === resettingUserId);
  if (!user) {
    panel.innerHTML = "";
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h3>초기 비밀번호 재설정</h3>
      <p>${escapeHtml(user.name || user.email || "사용자")}의 초기 비밀번호를 재설정합니다. 비밀번호 값은 다시 표시되지 않습니다.</p>
    </div>
    <form id="userPasswordForm" class="user-management-form">
      <label>새 초기 비밀번호<input id="resetUserPassword" type="password" autocomplete="new-password"></label>
      <label>새 초기 비밀번호 확인<input id="resetUserPasswordConfirm" type="password" autocomplete="new-password"></label>
      <div class="admin-action-row">
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>비밀번호 재설정</button>
        <button type="button" data-user-action="cancel-reset">취소</button>
      </div>
    </form>
  `;
}

function renderUserManagement() {
  if (!canManageUsers()) return;
  renderUserManagementRows();
  renderUserEditPanel();
  renderUserResetPanel();
}

function auditActionLabel(action) {
  return {
    USER_CREATED: "사용자 생성",
    USER_NAME_UPDATED: "사용자 이름 변경",
    USER_ROLE_UPDATED: "사용자 역할 변경",
    USER_ACTIVATED: "사용자 활성화",
    USER_DEACTIVATED: "사용자 비활성화",
    INITIAL_PASSWORD_RESET: "초기 비밀번호 재설정",
    PASSWORD_CHANGE_COMPLETED: "최초 비밀번호 변경 완료",
  }[action] || action || "-";
}

function renderAuditLogRows() {
  const tbody = document.getElementById("auditLogRows");
  if (!tbody) return;
  if (!osAuditLogsLoaded) {
    tbody.innerHTML = `<tr><td colspan="7">감사 기록을 불러오는 중입니다.</td></tr>`;
    return;
  }
  if (!osAuditLogs.length) {
    tbody.innerHTML = `<tr><td colspan="7">표시할 감사 기록이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = osAuditLogs.map((row) => `
    <tr>
      <td>${row.created_at ? formatDateTime(row.created_at) : "-"}</td>
      <td>${escapeHtml(row.actor_name || row.actor_email || "-")}</td>
      <td>${row.actor_role ? roleLabel(row.actor_role) : "-"}</td>
      <td>${escapeHtml(auditActionLabel(row.action))}</td>
      <td>${escapeHtml(row.target_label || row.target_id || row.target_type || "-")}</td>
      <td>${escapeHtml(row.result || "-")}</td>
      <td>${escapeHtml(row.reason || "-")}</td>
    </tr>
  `).join("");
}

function ensureAuditLogShell() {
  if (!canManageUsers()) return;
  const system = document.getElementById("system");
  if (!system || document.getElementById("auditLogCard")) return;
  const section = document.createElement("section");
  section.className = "internal-card audit-log-card";
  section.id = "auditLogCard";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>감사 기록</h2>
      <p>중요 작업을 누가 언제 수행했는지 확인합니다.</p>
    </div>
    <div class="control-grid audit-filter-grid">
      <label>작업 유형
        <select id="auditActionFilter">
          <option value="">전체</option>
          <option value="USER_CREATED">사용자 생성</option>
          <option value="USER_NAME_UPDATED">사용자 이름 변경</option>
          <option value="USER_ROLE_UPDATED">사용자 역할 변경</option>
          <option value="USER_ACTIVATED">사용자 활성화</option>
          <option value="USER_DEACTIVATED">사용자 비활성화</option>
          <option value="INITIAL_PASSWORD_RESET">초기 비밀번호 재설정</option>
          <option value="PASSWORD_CHANGE_COMPLETED">최초 비밀번호 변경 완료</option>
        </select>
      </label>
      <label>수행자
        <input id="auditActorFilter" type="search" placeholder="이메일 검색">
      </label>
      <button id="reloadAuditLogsButton" type="button">조회</button>
    </div>
    <p id="auditLogStatus" class="status-text"></p>
    <div class="table-wrap audit-log-table-wrap">
      <table class="audit-log-table">
        <thead><tr><th>일시</th><th>수행자</th><th>역할</th><th>작업</th><th>대상</th><th>결과</th><th>사유</th></tr></thead>
        <tbody id="auditLogRows"></tbody>
      </table>
    </div>
  `;
  document.getElementById("userManagementCard")?.insertAdjacentElement("afterend", section);
  renderAuditLogRows();
}

function removePrivilegedManagementShell() {
  document.getElementById("userManagementCard")?.remove();
  document.getElementById("auditLogCard")?.remove();
  osUsers = [];
  osUsersLoaded = false;
  osAuditLogs = [];
  osAuditLogsLoaded = false;
  editingUserId = null;
  resettingUserId = null;
}

function setAuditLogStatus(message, type = "") {
  const node = document.getElementById("auditLogStatus");
  if (!node) return;
  node.textContent = message || "";
  node.dataset.status = type;
}

async function refreshAuditLogs() {
  if (!canManageUsers()) return;
  ensureAuditLogShell();
  setAuditLogStatus("감사 기록을 불러오는 중입니다.");
  try {
    const action = document.getElementById("auditActionFilter")?.value || "";
    const actor = document.getElementById("auditActorFilter")?.value?.trim() || "";
    const logs = await loadOsAuditLogs({ limit: 100, action, actor });
    osAuditLogs = Array.isArray(logs) ? logs : [];
    osAuditLogsLoaded = true;
    renderAuditLogRows();
    setAuditLogStatus("감사 기록을 불러왔습니다.", "success");
  } catch (error) {
    osAuditLogsLoaded = false;
    renderAuditLogRows();
    setAuditLogStatus(error.message || "감사 기록을 불러오지 못했습니다.", "error");
  }
}

function ensureUserManagementShell() {
  if (!canManageUsers()) return;
  const system = document.getElementById("system");
  if (!system || document.getElementById("userManagementCard")) return;
  const section = document.createElement("section");
  section.className = "internal-card user-management-card";
  section.id = "userManagementCard";
  section.innerHTML = `
    <div class="section-heading compact-heading no-side-padding">
      <h2>사용자 관리</h2>
      <p>AND OS 사용자를 생성하고 역할과 활성 상태를 관리합니다.</p>
    </div>
    <div class="user-management-layout">
      <form id="userCreateForm" class="user-management-form">
        <h3>사용자 생성</h3>
        <label>이름<input id="newUserName" type="text" autocomplete="off"></label>
        <label>이메일<input id="newUserEmail" type="email" autocomplete="off"></label>
        <label>초기 비밀번호<input id="newUserPassword" type="password" autocomplete="new-password"></label>
        <label>초기 비밀번호 확인<input id="newUserPasswordConfirm" type="password" autocomplete="new-password"></label>
        <label>역할<select id="newUserRole">
          <option value="staff">직원</option>
          <option value="manager">매니저</option>
          <option value="admin">관리자</option>
        </select></label>
        <button type="submit" ${osUserActionBusy ? "disabled" : ""}>사용자 생성</button>
      </form>
      <div class="user-management-panels">
        <div id="userEditPanel" class="user-subpanel" hidden></div>
        <div id="userPasswordPanel" class="user-subpanel" hidden></div>
      </div>
    </div>
    <p id="userManagementStatus" class="status-text"></p>
    <div class="table-wrap user-management-table-wrap">
      <table class="user-management-table">
        <thead><tr><th>이름</th><th>이메일</th><th>역할</th><th>상태</th><th>비밀번호</th><th>생성일</th><th>수정일</th><th>작업</th></tr></thead>
        <tbody id="userManagementRows"></tbody>
      </table>
    </div>
  `;
  document.querySelector(".system-log-card")?.insertAdjacentElement("afterend", section);
  renderUserManagement();
}

async function refreshUserManagement() {
  if (!canManageUsers()) return;
  ensureUserManagementShell();
  setUserManagementStatus("사용자 목록을 불러오는 중입니다.");
  try {
    await loadCurrentOsUser();
    const users = await loadOsUsers();
    osUsers = Array.isArray(users) ? users : [];
    osUsersLoaded = true;
    renderUserManagement();
    setUserManagementStatus("사용자 목록을 불러왔습니다.", "success");
  } catch (error) {
    osUsersLoaded = false;
    renderUserManagement();
    setUserManagementStatus(error.message || "사용자 목록을 불러오지 못했습니다.", "error");
  }
}

function assertUserPasswordPair(password, confirm) {
  if (!isValidInitialPassword(password)) {
    throw new Error("비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.");
  }
  if (password !== confirm) {
    throw new Error("비밀번호 확인이 일치하지 않습니다.");
  }
}

async function submitCreateUser(event) {
  event.preventDefault();
  if (!canManageUsers() || osUserActionBusy) return;
  const name = document.getElementById("newUserName")?.value?.trim() || "";
  const email = document.getElementById("newUserEmail")?.value?.trim() || "";
  const initialPassword = document.getElementById("newUserPassword")?.value || "";
  const confirmPassword = document.getElementById("newUserPasswordConfirm")?.value || "";
  const role = document.getElementById("newUserRole")?.value || "staff";
  if (!name) throw new Error("이름을 입력해 주세요.");
  if (!isValidEmail(email)) throw new Error("이메일 형식을 확인해 주세요.");
  if (!["admin", "manager", "staff"].includes(role)) throw new Error("역할 값을 확인해 주세요.");
  assertUserPasswordPair(initialPassword, confirmPassword);
  osUserActionBusy = true;
  renderUserManagement();
  setUserManagementStatus("사용자 생성 중입니다.");
  try {
    await createOsUser({ name, email, initialPassword, role });
    document.getElementById("userCreateForm")?.reset();
    await refreshUserManagement();
    setUserManagementStatus("사용자를 생성했습니다.", "success");
  } finally {
    osUserActionBusy = false;
    const passwordInput = document.getElementById("newUserPassword");
    const confirmInput = document.getElementById("newUserPasswordConfirm");
    if (passwordInput) passwordInput.value = "";
    if (confirmInput) confirmInput.value = "";
    renderUserManagement();
  }
}

async function submitEditUser(event) {
  event.preventDefault();
  if (!canManageUsers() || osUserActionBusy || !editingUserId) return;
  const name = document.getElementById("editUserName")?.value?.trim() || "";
  const role = document.getElementById("editUserRole")?.value || "staff";
  const isActive = document.getElementById("editUserActive")?.value === "true";
  if (!name) throw new Error("이름을 입력해 주세요.");
  if (!["admin", "manager", "staff"].includes(role)) throw new Error("역할 값을 확인해 주세요.");
  osUserActionBusy = true;
  setUserManagementStatus("사용자 수정 중입니다.");
  try {
    await updateOsUser(editingUserId, { name, role, is_active: isActive });
    editingUserId = null;
    await refreshUserManagement();
    setUserManagementStatus("사용자 정보를 수정했습니다.", "success");
  } finally {
    osUserActionBusy = false;
    renderUserManagement();
  }
}

async function submitResetPassword(event) {
  event.preventDefault();
  if (!canManageUsers() || osUserActionBusy || !resettingUserId) return;
  const password = document.getElementById("resetUserPassword")?.value || "";
  const confirm = document.getElementById("resetUserPasswordConfirm")?.value || "";
  assertUserPasswordPair(password, confirm);
  osUserActionBusy = true;
  setUserManagementStatus("비밀번호 재설정 중입니다.");
  try {
    await resetOsUserPassword(resettingUserId, password);
    resettingUserId = null;
    await refreshUserManagement();
    setUserManagementStatus("초기 비밀번호를 재설정했습니다.", "success");
  } finally {
    osUserActionBusy = false;
    renderUserManagement();
  }
}

function handleUserAction(button) {
  if (!canManageUsers()) return;
  const action = button.dataset.userAction;
  const userId = button.dataset.userId;
  if (action === "edit") {
    editingUserId = userId;
    resettingUserId = null;
    renderUserManagement();
  }
  if (action === "reset-password") {
    resettingUserId = userId;
    editingUserId = null;
    renderUserManagement();
  }
  if (action === "cancel-edit") {
    editingUserId = null;
    renderUserManagement();
  }
  if (action === "cancel-reset") {
    resettingUserId = null;
    renderUserManagement();
  }
}

function renderSystemManagement() {
  if (!canViewSystem() || !document.getElementById("system")) return;
  document.getElementById("system")?.classList.toggle("system-readonly", !canEditCost());
  renderSystemStatus();
  renderBulkMarginPanel();
  renderCostItemTools();
  renderCostItemEditor();
  renderSystemCostRows();
  renderCategoryCancelPanel();
  renderSystemDraftRows();
  renderSystemHistoryRows();
  renderSystemPublishLogRows();
  renderRollbackPanel();
  if (canManageUsers()) {
    ensureUserManagementShell();
    renderUserManagement();
    ensureAuditLogShell();
    renderAuditLogRows();
  } else {
    removePrivilegedManagementShell();
  }
}

async function refreshSystemManagement() {
  if (!canViewSystem()) return;
  ensureSystemManagementShell();
  try {
    const [history, logs, count] = await Promise.all([
      loadCostItemHistory(),
      loadCostPublishLogs(),
      loadEstimateCount().catch(() => cachedEstimates.length),
    ]);
    systemCostHistory = Array.isArray(history) ? history : [];
    systemPublishLogs = Array.isArray(logs) ? logs : [];
    systemEstimateCount = Number(count) || cachedEstimates.length || 0;
    systemDataLoaded = true;
    renderSystemManagement();
    await refreshUserManagement();
    await refreshAuditLogs();
    setSystemStatus(systemDataLoaded ? "시스템 관리 데이터를 불러왔습니다." : "");
  } catch (error) {
    console.error("시스템 관리 데이터 조회 실패", error);
    setSystemStatus("시스템 관리 데이터 조회 실패");
  }
}

function systemRowValue(itemCode, field) {
  const input = document.querySelector(`[data-item-code="${CSS.escape(itemCode)}"][data-system-field="${field}"]`);
  if (!input) return null;
  if (field === "active") return input.value === "true";
  if (input.value === "") return null;
  if (field === "margin") return rateNumber(input.value) / 100;
  return rateNumber(input.value);
}

async function saveSystemDraft(itemCode) {
  if (!canEditCost()) return;
  const row = originalCostItems.get(itemCode);
  if (!row) return;
  const draftCost = systemRowValue(itemCode, "cost");
  const draftMargin = systemRowValue(itemCode, "margin");
  if (draftCost !== null && draftCost < 0) {
    alert("변경 원가는 0원 이상으로 입력해 주세요.");
    return;
  }
  if (draftMargin !== null && (draftMargin < 0 || draftMargin > 0.99)) {
    alert("변경 마진율은 0 이상 99 이하의 퍼센트 숫자로 입력해 주세요.");
    return;
  }
  setSystemStatus("임시저장 중입니다.");
  await saveCostItemChanges([{
    id: row.id,
    item_code: itemCode,
    new_cost_price: draftCost,
    new_margin_rate: draftMargin,
    new_is_active: systemRowValue(itemCode, "active"),
  }]);
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus("임시저장 완료");
}

function costItemFormPayload() {
  const margin = rateNumber(document.getElementById("costItemMarginRate")?.value) / 100;
  return {
    item_code: document.getElementById("costItemCode")?.value || "",
    item_name: document.getElementById("costItemName")?.value || "",
    category: document.getElementById("costItemCategory")?.value || "",
    subcategory: document.getElementById("costItemSubcategory")?.value || "",
    unit: document.getElementById("costItemUnit")?.value || "",
    calculation_basis: document.getElementById("costItemCalculationBasis")?.value || "",
    cost_price: rateNumber(document.getElementById("costItemCostPrice")?.value),
    default_margin_rate: margin,
    is_active: document.getElementById("costItemActive")?.value !== "false",
    sort_order: rateNumber(document.getElementById("costItemSortOrder")?.value),
    memo: document.getElementById("costItemMemo")?.value || "",
    customer_name: document.getElementById("costItemCustomerName")?.value || "",
    order_name: document.getElementById("costItemOrderName")?.value || "",
    calculation_multiplier: rateNumber(document.getElementById("costItemMultiplier")?.value) || 1,
    min_quantity: document.getElementById("costItemMinQuantity")?.value || null,
    rounding_method: document.getElementById("costItemRounding")?.value || "none",
    include_in_customer_quote: Boolean(document.getElementById("costItemCustomerQuote")?.checked),
    include_in_internal_quote: Boolean(document.getElementById("costItemInternalQuote")?.checked),
    include_in_order_sheet: Boolean(document.getElementById("costItemOrderSheet")?.checked),
    is_material: Boolean(document.getElementById("costItemMaterial")?.checked),
    is_labor: Boolean(document.getElementById("costItemLabor")?.checked),
    is_service: Boolean(document.getElementById("costItemService")?.checked),
  };
}

function openCostItemEditor(mode, itemCode = "") {
  if (!canEditCost()) return;
  costItemEditorMode = mode;
  costItemEditorSourceCode = itemCode || null;
  renderCostItemEditor();
  document.getElementById("systemCostItemEditor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeCostItemEditor() {
  costItemEditorMode = null;
  costItemEditorSourceCode = null;
  renderCostItemEditor();
}

async function submitCostItemForm(event) {
  event.preventDefault();
  if (!canEditCost() || costItemActionBusy || !costItemEditorMode) return;
  const payload = costItemFormPayload();
  try {
    costItemActionBusy = true;
    renderCostItemEditor();
    setSystemStatus("원가 품목 임시저장 중입니다.");
    if (costItemEditorMode === "edit") {
      const row = originalCostItems.get(costItemEditorSourceCode);
      if (!row?.id) throw new Error("수정할 신규 품목을 찾지 못했습니다.");
      await updatePendingCostItem(row.id, payload);
    } else if (costItemEditorMode === "clone") {
      const row = originalCostItems.get(costItemEditorSourceCode);
      if (!row?.id) throw new Error("복제할 품목을 찾지 못했습니다.");
      await cloneCostItem({ ...payload, source_cost_item_id: row.id });
    } else {
      await createCostItem(payload);
    }
    closeCostItemEditor();
    await loadRateSettings();
    await refreshSystemManagement();
    setSystemStatus("신규 품목이 변경 예정값으로 임시저장되었습니다.");
  } finally {
    costItemActionBusy = false;
    renderCostItemEditor();
  }
}

async function createDeactivateDraft(itemCode) {
  if (!canEditCost()) return;
  const row = originalCostItems.get(itemCode);
  if (!row) return;
  const targetActive = !row.is_active;
  const label = targetActive ? "재활성화" : "비활성화";
  if (!confirm(`${row.item_name || row.item_code} 품목을 ${label} 예정값으로 임시저장할까요?`)) return;
  await saveCostItemChanges([{
    id: row.id,
    item_code: row.item_code,
    new_cost_price: row.draft_cost_price ?? null,
    new_margin_rate: row.draft_margin_rate ?? null,
    new_is_active: targetActive,
  }]);
  await writeSystemAudit(targetActive ? "COST_ITEM_REACTIVATE_DRAFT" : "COST_ITEM_DEACTIVATE_DRAFT", {
    target_id: row.id,
    target_label: row.item_name || row.item_code,
    before_data: { item_code: row.item_code, is_active: row.is_active },
    after_data: { item_code: row.item_code, draft_is_active: targetActive },
    reason: `${label} 변경 예정값 생성`,
  });
  await loadRateSettings();
  await refreshSystemManagement();
  setSystemStatus(`${label} 예정값 임시저장 완료`);
}

function updateCostItemFilters() {
  costItemFilters = {
    keyword: document.getElementById("costItemSearch")?.value || "",
    category: document.getElementById("costItemCategoryFilter")?.value || "",
    subcategory: document.getElementById("costItemSubcategoryFilter")?.value || "",
    active: document.getElementById("costItemActiveFilter")?.value || "all",
    state: document.getElementById("costItemStateFilter")?.value || "all",
    sort: document.getElementById("costItemSortFilter")?.value || "sort",
  };
  renderCostItemTools();
  renderSystemCostRows();
}

function bulkMarginOptions() {
  return {
    scope: document.getElementById("bulkMarginScope")?.value || "all",
    category: document.getElementById("bulkMarginCategory")?.value || "",
    activeMode: document.getElementById("bulkMarginActiveMode")?.value || "active",
    marginRate: rateNumber(document.getElementById("bulkMarginRate")?.value) / 100,
    policy: document.getElementById("bulkMarginDraftPolicy")?.value || "keep",
  };
}

function previewBulkMargin() {
  if (!canEditCost()) return;
  const options = bulkMarginOptions();
  const targetRows = rowsBySystemFilter(options);
  const draftCount = existingDraftCount(targetRows);
  const target = document.getElementById("bulkMarginPreview");
  if (target) {
    target.textContent = `대상 ${targetRows.length}개 / 현재 마진율 분포 ${marginDistribution(targetRows)} / 기존 변경 예정값 ${draftCount}개 / 변경 예정 마진율 ${percentText(options.marginRate)}`;
  }
}

async function applyBulkMarginDrafts() {
  if (!canEditCost()) return;
  const options = bulkMarginOptions();
  if (options.marginRate < 0 || options.marginRate > 0.99) {
    alert("변경 마진율은 0 이상 99 이하의 퍼센트 숫자로 입력해 주세요.");
    return;
  }
  let targetRows = rowsBySystemFilter(options);
  const draftCount = existingDraftCount(targetRows);
  if (options.policy === "keep") targetRows = targetRows.filter((row) => !hasDraft(row));
  if (!targetRows.length) {
    setSystemStatus("적용할 품목이 없습니다.");
    return;
  }
  if (!confirm(`${targetRows.length}개 품목에 ${percentText(options.marginRate)} 변경 예정 마진율을 적용할까요?`)) return;
  setSystemStatus("마진율 변경 예정값을 일괄 적용 중입니다.");
  for (const row of targetRows) {
    await saveCostItemChanges([{
      id: row.id,
      item_code: row.item_code,
      new_cost_price: row.draft_cost_price ?? null,
      new_margin_rate: options.marginRate,
      new_is_active: row.draft_is_active ?? null,
    }]);
  }
  await writeSystemAudit("COST_MARGIN_BULK_DRAFT", {
    target_label: options.scope === "category" ? options.category : "전체 품목",
    after_data: {
      scope: options.scope,
      category: options.category,
      activeMode: options.activeMode,
      targetCount: targetRows.length,
      existingDraftCount: draftCount,
      marginRate: options.marginRate,
      draftPolicy: options.policy,
    },
    reason: "마진율 일괄 변경 예정값 생성",
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus(`마진율 변경 예정값 ${targetRows.length}개 적용 완료`);
}

async function cancelSystemDraft(itemCode) {
  if (!canEditCost()) return;
  const row = originalCostItems.get(itemCode);
  if (!row) return;
  setSystemStatus("임시저장 취소 중입니다.");
  await cancelCostItemDraft(row.id);
  await writeSystemAudit("COST_DRAFT_CANCEL_ITEM", {
    target_id: row.id,
    target_label: row.item_name || row.item_code,
    before_data: {
      item_code: row.item_code,
      draft_cost_price: row.draft_cost_price,
      draft_margin_rate: row.draft_margin_rate,
      draft_is_active: row.draft_is_active,
    },
    reason: "품목별 임시저장 취소",
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus("임시저장 취소 완료");
}

async function cancelCategorySystemDrafts() {
  if (!canEditCost()) return;
  const category = document.getElementById("cancelDraftCategory")?.value || "";
  const rows = changedCostItems().filter((row) => row.category === category);
  if (!rows.length) {
    setSystemStatus("선택 공정에 취소할 변경 예정값이 없습니다.");
    return;
  }
  if (!confirm(`${category} 공정의 변경 예정값 ${rows.length}개를 취소할까요?`)) return;
  setSystemStatus("공정별 임시저장 취소 중입니다.");
  for (const row of rows) {
    await cancelCostItemDraft(row.id);
  }
  await writeSystemAudit("COST_DRAFT_CANCEL_CATEGORY", {
    target_label: category,
    before_data: { category, targetCount: rows.length },
    reason: "공정별 임시저장 취소",
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus(`${category} 공정 임시저장 ${rows.length}개 취소 완료`);
}

async function cancelAllSystemDrafts() {
  if (!canEditCost()) return;
  const rows = changedCostItems();
  if (!confirm("전체 임시저장을 취소할까요?")) return;
  setSystemStatus("전체 임시저장 취소 중입니다.");
  await cancelAllCostDrafts();
  await writeSystemAudit("COST_DRAFT_CANCEL_ALL", {
    target_label: "전체 품목",
    before_data: { targetCount: rows.length },
    reason: "전체 임시저장 취소",
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus("전체 임시저장 취소 완료");
}

function rollbackTargets(version) {
  const scope = document.getElementById("rollbackScope")?.value || "version";
  const category = document.getElementById("rollbackCategory")?.value || "";
  const itemCode = document.getElementById("rollbackItemCode")?.value || "";
  const force = Boolean(document.getElementById("rollbackForceConflicts")?.checked);
  return systemCostHistory
    .filter((row) => row.cost_version === version)
    .filter((row) => {
      const item = row.cost_items || {};
      if (scope === "category") return item.category === category;
      if (scope === "item") return item.item_code === itemCode;
      return true;
    })
    .map((row) => {
      const item = row.cost_items || {};
      const current = originalCostItems.get(item.item_code);
      const conflict = !current ||
        rateNumber(current.cost_price) !== rateNumber(row.new_cost_price) ||
        rateNumber(current.default_margin_rate) !== rateNumber(row.new_margin_rate) ||
        Boolean(current.is_active) !== Boolean(row.new_is_active);
      return { row, item, current, conflict, force };
    })
    .filter((item) => item.force || !item.conflict);
}

async function createRollbackDrafts(version) {
  if (!canEditCost()) return;
  const targets = rollbackTargets(version);
  if (!targets.length) {
    setSystemStatus("원복 예정값을 생성할 대상이 없습니다.");
    return;
  }
  if (!confirm(`${version} 기준 원복 예정값 ${targets.length}개를 생성할까요?`)) return;
  setSystemStatus("원복 예정값 생성 중입니다.");
  for (const target of targets) {
    if (!target.current) continue;
    await saveCostItemChanges([{
      id: target.current.id,
      item_code: target.item.item_code,
      new_cost_price: rateNumber(target.row.old_cost_price),
      new_margin_rate: rateNumber(target.row.old_margin_rate),
      new_is_active: Boolean(target.row.old_is_active),
    }]);
  }
  await writeSystemAudit("COST_ROLLBACK_DRAFT", {
    target_label: version,
    after_data: {
      sourceVersion: version,
      targetCount: targets.length,
      forceConflicts: Boolean(document.getElementById("rollbackForceConflicts")?.checked),
    },
    reason: "배포 기록 기준 원복 예정값 생성",
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  setSystemStatus(`${version} 원복 예정값 ${targets.length}개 생성 완료`);
}

async function publishSystemDrafts() {
  if (!canPublishCost()) return;
  const reason = document.getElementById("systemPublishReason")?.value?.trim();
  if (!reason) {
    alert("배포 사유를 입력해야 합니다.");
    return;
  }
  if (!confirm("현재 변경 예정값을 운영 원가로 배포할까요?")) return;
  setSystemStatus("배포 중입니다.");
  const rows = changedCostItems();
  const result = await publishCostDrafts(reason);
  await writeSystemAudit("COST_DRAFT_PUBLISH", {
    target_label: reason,
    before_data: { targetCount: rows.length },
    after_data: { result },
    reason,
  });
  await loadRateSettings();
  await refreshSystemManagement();
  updateRatesFromAdmin();
  refresh();
  const version = Array.isArray(result) ? result[0]?.version : result?.version;
  setSystemStatus(version ? `배포 완료: ${version}` : "배포 완료");
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

function setPasswordChangeRequired(required) {
  ensurePasswordChangeShell();
  const screen = document.getElementById("passwordChangeScreen");
  document.getElementById("loginScreen").hidden = required || !!getAuthSession();
  if (screen) screen.hidden = !required;
  document.getElementById("appShell").classList.toggle("app-locked", required);
}

function clearPasswordChangeInputs() {
  const password = document.getElementById("newOwnPassword");
  const confirm = document.getElementById("newOwnPasswordConfirm");
  if (password) password.value = "";
  if (confirm) confirm.value = "";
}

function validateOwnPassword(password, confirm) {
  if (password !== password.trim()) throw new Error("비밀번호 앞뒤에 공백을 넣을 수 없습니다.");
  if (password.length < 8) throw new Error("비밀번호는 8자 이상이어야 합니다.");
  if (!/[A-Za-z]/.test(password)) throw new Error("비밀번호에는 영문이 포함되어야 합니다.");
  if (!/\d/.test(password)) throw new Error("비밀번호에는 숫자가 포함되어야 합니다.");
  if (password !== confirm) throw new Error("비밀번호 확인이 일치하지 않습니다.");
}

async function leavePasswordChangeFlow() {
  await signOut();
  currentProfile = null;
  clearPasswordChangeInputs();
  setPasswordChangeRequired(false);
  setAuthenticated(false);
  const password = document.getElementById("loginPassword");
  if (password) password.value = "";
}

async function submitOwnPasswordChange(event) {
  event.preventDefault();
  if (passwordChangeBusy) return;
  const status = document.getElementById("passwordChangeStatus");
  const password = document.getElementById("newOwnPassword")?.value || "";
  const confirm = document.getElementById("newOwnPasswordConfirm")?.value || "";
  try {
    validateOwnPassword(password, confirm);
    passwordChangeBusy = true;
    if (status) status.textContent = "비밀번호를 변경하는 중입니다.";
    await changeOwnPassword(password);
    clearPasswordChangeInputs();
    const profile = await loadCurrentOsUser();
    if (profile.must_change_password) {
      throw new Error("비밀번호 변경 상태를 확인하지 못했습니다. 다시 로그인해 주세요.");
    }
    if (status) status.textContent = "비밀번호 변경이 완료되었습니다.";
    await enterAuthenticatedApp(profile);
  } catch (error) {
    console.error("비밀번호 변경 실패", error);
    clearPasswordChangeInputs();
    if (status) status.textContent = error.message || "비밀번호 변경에 실패했습니다.";
  } finally {
    passwordChangeBusy = false;
  }
}

function bindPasswordChangeShell() {
  ensurePasswordChangeShell();
  document.getElementById("passwordChangeForm")?.addEventListener("submit", submitOwnPasswordChange);
  document.getElementById("passwordChangeLogoutButton")?.addEventListener("click", () => {
    leavePasswordChangeFlow().catch((error) => console.error("비밀번호 변경 화면 로그아웃 실패", error));
  });
}

function applyAccessControl() {
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

async function enterAuthenticatedApp(profile) {
  currentProfile = profile;
  if (currentProfile.role === "admin" && staffAdminShellApplied) {
    window.location.reload();
    return;
  }
  await loadRateSettings();
  setAuthenticated(true);
  applyAccessControl();
  refresh();
  await renderSavedEstimateRows();
  await refreshSystemManagement();
}

async function completeLogin() {
  const profile = await loadCurrentOsUser();
  if (!profile) throw new Error("프로필 정보를 불러오지 못했습니다.");
  if (profile.is_active === false) {
    await signOut();
    currentProfile = null;
    setAuthenticated(false);
    throw new Error("비활성화된 계정입니다. 관리자에게 문의해 주세요.");
  }
  if (profile.must_change_password) {
    currentProfile = profile;
    setAuthenticated(false);
    setPasswordChangeRequired(true);
    return;
  }
  await enterAuthenticatedApp(profile);
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
  if (el.estimateStatus) el.estimateStatus.value = estimate.status || "견적";
  currentEditingEstimateId = estimate.id || null;
  activeQuoteEstimate = null;
  refresh();
  const hasStoredResult = estimate.customerQuote || estimate.internalSummary || estimate.internalDetails;
  const displayEstimate = hasStoredResult
    ? estimate
    : {
      ...estimate,
      ...buildEstimateSnapshot(calculate()),
      id: estimate.id,
      savedAt: estimate.savedAt,
  };
  activeQuoteEstimate = displayEstimate;
  currentEditingEstimateId = estimate.id || null;
  loadedEstimateBaseline = {
    id: estimate.id || null,
    inputs: currentInputKey(),
    estimate: displayEstimate,
  };
  setText("clientTotal", customerWon(Number(displayEstimate.total ?? displayEstimate.customerQuote?.total) || 0));
  renderCustomerQuote(displayEstimate);
  renderStoredInternalSummary(displayEstimate);
  renderInternalRows(displayEstimate.internalDetails || []);
  renderPurchaseOrder(displayEstimate);
  setSaveStatus("저장 당시 계산 결과를 표시 중입니다.");
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
    if (button.dataset.tab === "admin") renderSavedEstimateRows();
    if (button.dataset.tab === "system") refreshSystemManagement().catch((error) => console.error("시스템 관리 갱신 실패", error));
  });
});

repairStaticKoreanLabels();
guardCheckboxLabelClicks();
bindPasswordChangeShell();

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
    const message = error.message || "로그인에 실패했습니다.";
    status.textContent = message;
    alert(message);
  }
});

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  await signOut();
  currentProfile = null;
  if (staffAdminShellApplied) {
    window.location.reload();
    return;
  }
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

function handleEstimateInputChanged() {
  if (loadedEstimateBaseline) {
    if (loadedEstimateMatchesCurrentInputs()) {
      activeQuoteEstimate = loadedEstimateBaseline.estimate;
      setSaveStatus("저장 당시 계산 결과를 표시 중입니다.");
    } else {
      activeQuoteEstimate = null;
      setSaveStatus("입력값이 변경되어 재계산되었습니다. 저장 전까지 원본 견적은 변경되지 않습니다.");
    }
  } else {
    activeQuoteEstimate = null;
  }
  refresh();
}

async function handleSaveEstimate(mode = "update") {
  if (saveEstimateInProgress) return;
  saveEstimateInProgress = true;
  try {
    setSaveStatus("저장 준비 중입니다.");
    const isUpdate = mode === "update";
    const result = calculateForCurrentEstimate();
    if (isUpdate && shouldUseLoadedCostSnapshot() && snapshotCalculationMissingItems.length) {
      const message = `저장 당시 원가 스냅샷에 ${snapshotCalculationMissingItems.join(", ")} 품목이 없어 현재 원가와 섞어 저장하지 않았습니다. 새 기준 재계산 기능에서 처리해 주세요.`;
      setSaveStatus(message);
      alert(message);
      return;
    }
    const snapshot = buildEstimateSnapshot(result, {
      costSnapshot: isUpdate && shouldUseLoadedCostSnapshot()
        ? loadedEstimateBaseline?.estimate?.costSnapshot
        : undefined,
    });
    if (!snapshot.projectName?.trim()) {
      setSaveStatus("프로젝트명을 입력해야 저장할 수 있습니다.");
      alert("프로젝트명을 입력해야 저장할 수 있습니다.");
      return;
    }
    const updateId = currentEditingEstimateId || activeQuoteEstimate?.id;
    if (isUpdate && !updateId) {
      setSaveStatus("수정할 저장 견적이 없습니다. 새 견적으로 저장을 사용해 주세요.");
      alert("수정할 저장 견적이 없습니다. 새 견적으로 저장을 사용해 주세요.");
      return;
    }
    setSaveStatus(isUpdate ? "수정 저장 중입니다." : "새 견적으로 저장 중입니다.");
    const saved = isUpdate
      ? await updateEstimate(updateId, { ...snapshot, id: updateId })
      : await saveEstimate({ ...snapshot, id: "" });
    activeQuoteEstimate = saved;
    currentEditingEstimateId = saved.id || null;
    loadedEstimateBaseline = {
      id: saved.id || null,
      inputs: currentInputKey(),
      estimate: saved,
    };
    renderCustomerQuote(saved);
    renderStoredInternalSummary(saved);
    setSaveStatus(`${formatDateTime(saved.savedAt)} ${isUpdate ? "수정 저장 완료" : "새 견적 저장 완료"}`);
    renderSavedEstimateRows().catch((error) => {
      console.warn("저장 후 목록 갱신 실패", error);
    });
    activateTab("quote");
  } catch (error) {
    console.error("견적 저장 실패", error);
    setSaveStatus("견적 저장에 실패했습니다.");
    alert(error.message || "견적 저장에 실패했습니다.");
  } finally {
    saveEstimateInProgress = false;
  }
}

document.getElementById("saveEstimateButton")?.addEventListener("click", () => handleSaveEstimate("update"));
document.getElementById("saveAsNewEstimateButton")?.addEventListener("click", () => handleSaveEstimate("new"));

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#saveEstimateButton, #saveAsNewEstimateButton");
  if (!button) return;
  event.preventDefault();
  handleSaveEstimate(button.id === "saveAsNewEstimateButton" ? "new" : "update");
});

document.getElementById("printQuoteButton")?.addEventListener("click", () => {
  renderPrintQuote(activeQuoteEstimate?.customerQuote || buildEstimateSnapshot(calculate()).customerQuote);
  window.print();
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#printAdminDetailButton, #printAdminInternalButton, #printPurchaseOrderButton");
  if (!button) return;
  const estimate = currentEstimateForPrint();
  if (button.id === "printAdminDetailButton") {
    renderAdminDetailPrint(estimate);
  } else if (button.id === "printAdminInternalButton") {
    renderAdminInternalPrint(estimate);
  } else {
    renderPurchaseOrderPrint(estimate);
  }
  window.print();
});

document.addEventListener("click", async (event) => {
  const button = event.target?.closest?.("[data-system-action]");
  if (!button) return;
  event.preventDefault();
  try {
    const action = button.dataset.systemAction;
    const itemCode = button.dataset.itemCode;
    if (action === "save-draft") await saveSystemDraft(itemCode);
    if (action === "cancel-draft") await cancelSystemDraft(itemCode);
    if (action === "cost-item-create-open") openCostItemEditor("create");
    if (action === "cost-item-clone-open") openCostItemEditor("clone", itemCode);
    if (action === "cost-item-edit-open") openCostItemEditor("edit", itemCode);
    if (action === "cost-item-editor-close") closeCostItemEditor();
    if (action === "deactivate-draft") await createDeactivateDraft(itemCode);
    if (action === "bulk-margin-preview") previewBulkMargin();
    if (action === "bulk-margin-apply") await applyBulkMarginDrafts();
    if (action === "cancel-category-drafts") await cancelCategorySystemDrafts();
    if (action === "rollback-view") renderRollbackPanel(button.dataset.version || "");
    if (action === "rollback-create") await createRollbackDrafts(button.dataset.version || "");
    if (action === "cancel-all-drafts") await cancelAllSystemDrafts();
    if (action === "publish") await publishSystemDrafts();
  } catch (error) {
    console.error("시스템 관리 작업 실패", error);
    setSystemStatus("작업 실패");
    alert(error.message || "시스템 관리 작업에 실패했습니다.");
  }
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("[data-user-action]");
  if (!button) return;
  event.preventDefault();
  handleUserAction(button);
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#reloadAuditLogsButton");
  if (!button) return;
  event.preventDefault();
  refreshAuditLogs().catch((error) => {
    console.error("감사 기록 조회 실패", error);
    setAuditLogStatus("감사 기록을 불러오지 못했습니다.", "error");
  });
});

document.addEventListener("click", async (event) => {
  const button = event.target?.closest?.("#costItemForm button[type='submit']");
  if (!button) return;
  try {
    await submitCostItemForm(event);
  } catch (error) {
    event.preventDefault();
    console.error("원가 품목 임시저장 실패", error);
    setSystemStatus("원가 품목 임시저장 실패");
    alert(error.message || "원가 품목 임시저장에 실패했습니다.");
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form?.matches?.("#costItemForm")) {
    try {
      await submitCostItemForm(event);
    } catch (error) {
      event.preventDefault();
      console.error("원가 품목 임시저장 실패", error);
      setSystemStatus("원가 품목 임시저장 실패");
      alert(error.message || "원가 품목 임시저장에 실패했습니다.");
    }
    return;
  }
  if (!form?.matches?.("#userCreateForm, #userEditForm, #userPasswordForm")) return;
  try {
    if (form.id === "userCreateForm") await submitCreateUser(event);
    if (form.id === "userEditForm") await submitEditUser(event);
    if (form.id === "userPasswordForm") await submitResetPassword(event);
  } catch (error) {
    event.preventDefault();
    setUserManagementStatus(error.message || "사용자관리 작업에 실패했습니다.", "error");
    renderUserManagement();
  }
});

document.addEventListener("input", (event) => {
  if (event.target?.matches?.("#costItemSearch")) updateCostItemFilters();
});

document.addEventListener("change", (event) => {
  if (event.target?.matches?.("#costItemCategoryFilter, #costItemSubcategoryFilter, #costItemActiveFilter, #costItemStateFilter, #costItemSortFilter")) {
    updateCostItemFilters();
  }
  if (event.target?.matches?.("#costItemCategory")) {
    const subcategory = document.getElementById("costItemSubcategory");
    if (subcategory) {
      subcategory.innerHTML = systemSubcategories(event.target.value)
        .map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`)
        .join("");
    }
  }
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#saveRateDbButton");
  if (!button) return;
  saveRateSettings();
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#compareCostSnapshotButton");
  if (!button) return;
  renderCostSnapshotComparison(activeQuoteEstimate);
});

document.addEventListener("click", async (event) => {
  const openId = event.target?.dataset?.openEstimate;
  const deleteId = event.target?.dataset?.deleteEstimate;
  if (!openId && !deleteId) return;
  if (openId) {
    try {
      const estimate = await getEstimate(openId);
      if (!estimate) return;
      loadEstimateIntoUi(estimate);
      if (isAdmin()) activateTab("admin");
    } catch (error) {
      console.error("견적 열기 실패", error);
      alert("견적 열기에 실패했습니다.");
    }
  }
  if (deleteId) {
    if (!isAdmin()) return;
    if (!confirm("저장된 견적을 삭제할까요?")) return;
    try {
      await deleteEstimate(deleteId);
      if (activeQuoteEstimate?.id === deleteId) {
        activeQuoteEstimate = null;
        currentEditingEstimateId = null;
        renderCustomerQuote(buildEstimateSnapshot(calculate()));
      }
      renderSavedEstimateRows();
    } catch (error) {
      console.error("견적 삭제 실패", error);
      alert("견적 삭제에 실패했습니다.");
    }
  }
});

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#staffOpenClientQuoteButton, #staffPrintClientQuoteButton");
  if (!button) return;
  activateTab("quote");
  if (button.id === "staffPrintClientQuoteButton") {
    renderPrintQuote(currentEstimateForPrint()?.customerQuote);
    window.print();
  }
});

for (const input of Object.values(el)) {
  if (!input) continue;
  if (["projectSearch", "projectSearchResults"].includes(input.id)) continue;
  input.addEventListener("input", () => {
    normalizeIntegerInput(input);
    syncRateDirtyState(input);
    handleEstimateInputChanged();
  });
  input.addEventListener("change", () => {
    normalizeIntegerInput(input);
    syncRateDirtyState(input);
    handleEstimateInputChanged();
  });
}

setAuthenticated(false);
loadStoredSession();
if (getAuthSession()) {
  completeLogin().catch((error) => {
    console.error("세션 복원 실패", error);
  signOut();
  setAuthenticated(false);
  setPasswordChangeRequired(false);
});
}











