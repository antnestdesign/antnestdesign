import { createAccountView } from "./account-view.js";
import { createAuditView } from "./audit-view.js";
import { createUiShell } from "./ui-shell.js";
import { bindApplicationEvents } from "./application-events.js";
import { COST_ITEM_DEFINITIONS, createEstimateCalculation } from "./calculator/estimate-core.js";
import { won, rateNumber, escapeHtml } from "./utils.js";
import { canonicalInputValues } from "./estimate-input.js";
import { createEstimateRestore } from "./estimate-restore.js";
import { createEstimateView } from "./estimate-view.js";
import { mountPreliminaryEstimateView } from "./preliminary-estimate-view.js";
import { mountDetailedEstimateView } from "./detailed-estimate-view.js";
import { createEstimatePrint } from "./estimate-print.js";
import { buildInternalRowsModel, buildStoredInternalSummaryModel, buildEstimateInternalViewModel, buildCalculatedEstimatePresentation } from "./estimate-view-model.js";
import { purchaseOrderItems } from "./purchase-order.js";
import { costSnapshotMap } from "./cost-snapshot.js";
import { createContractViewModel } from "./contract-view-model.js";
import { createContractView } from "./contract-view.js";
import { createContractPrint, CONTRACT_FIXED_TERM_LINES } from "./contract-print.js";
import { createCostViewModel, percentText, hasDraft, marginDistribution, existingDraftCount } from "./cost-view-model.js";
import { createCostView } from "./cost-view.js";
import { readEstimateForm, collectEstimateFormValues, syncEstimateFormRates, normalizeIntegerInput } from "./estimate-form.js";
import { buildEstimateState, composeEstimateInputs, effectiveEstimateInputOverrides as projectEffectiveEstimateInputs } from "./estimate-state.js";
import { bathroomRates } from "./rates/bathroom.js";
import { kitchenRates } from "./rates/kitchen.js";
import { doorRates } from "./rates/door.js";
import { finishMaterialRates } from "./rates/finish.js";
import { miscRates } from "./rates/misc.js";
import {
  saveEstimate,
  updateEstimate,
  loadEstimates,
  getEstimate,
  previewStaffEstimate,
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
  loadContractOptions,
  saveContractOptions,
  loadContractPackages,
  loadContractPackage,
  previewContractPackage,
  createContractPackage,
  confirmContractPackage,
  createOsUser,
  updateOsUser,
  resetOsUserPassword,
  changeOwnPassword,
  signIn,
  signOut,
  loadStoredSession,
  getAuthSession,
  requestProjectFoundation,
  loadProjectFoundationMode,
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
  "flooringMaterialType",
  "flooringSheetGrade",
  "flooringWoodGrade",
  "bathroomPlumbingRelocationEnabled",
  "bathroomFixtureGrade",
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
  "kitchenCustomAppliancePrice",
  "kitchenStandardInstallEnabled",
  "middleDoorUnits",
  "standardDoorUnits",
  "slidingDoorUnits",
  "windowNoticeEnabled",
  "wallpaperPublicMaterialGrade",
  "wallpaperPublicWallLengthM",
  "wallpaperRoomMaterialGrade",
  "wallpaperRoomWallLengthM",
  "filmMaterialLengthM",
  "generalWasteEnabled",
  "interiorProtectionEnabled",
  "moveInCleaningEnabled",
  "existingPipeCleaningEnabled",
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
  "rateBathroomPorcelainTileMaterial",
  "rateBathroomPlumbingRelocation",
  "rateBathroomFixtureSet",
  "rateBathroomFixtureInstall",
  "rateBathroomSmcCeiling",
  "rateBathroomFanNormal",
  "rateBathroomHugentMachine",
  "rateBathroomHugentInstallExtra",
  "rateBathroomBathtub",
  "rateBathroomGlassBooth",
  "rateBathroomGlassPartition",
  "rateWallpaperWorkerDay",
  "rateWallpaperBesti",
  "rateWallpaperDiamant",
  "rateWallpaperFortis",
  "rateWallpaperMaterialPerPyeong",
  "rateFilmWorkerDay",
  "rateFlooringPerPyeong",
  "rateFlooringSheetT18",
  "rateFlooringSheetT20",
  "rateFlooringSheetT22",
  "rateFlooringSheetT32",
  "rateFlooringSheetT45",
  "rateFlooringSheetT50",
  "rateFlooringWoodStandard",
  "rateKitchenSinkBowl",
  "rateKitchenFaucet",
  "rateKitchenHood",
  "rateKitchenStandardInstall",
  "rateExistingPipeCleaning",
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
let pipeCleaningAdjustmentDirty = false;
let lastRenderedEstimateSnapshot = null;
let contractOptionsState = null;
let contractPackagesState = [];
let allContractPackagesState = [];
let projectContractPackageMap = new Map();
let projectContractPackageMapLoaded = false;
let contractPackageSearchKeyword = "";
let loadedContractEstimateState = null;
let expandedAdminEstimateId = null;
let expandedAdminTradeKey = null;
const adminEstimateDetailCache = new Map();
let contractPreviewState = null;
let contractOptionsDirty = false;
let contractSelectedDocumentType = "CONTRACT";
let contractBusy = false;
let snapshotCalculationMissingItems = [];
let costItemEditorMode = null;
let costItemEditorSourceCode = null;
let costItemActionBusy = false;
let expandedSystemCostCategory = "";
let costItemFilters = {
  keyword: "",
  category: "",
  subcategory: "",
  active: "all",
  state: "all",
  sort: "sort",
};


const customerWon = (...args) => currentCalculationCore().customerWon(...args);


const mmText = (...args) => currentCalculationCore().mmText(...args);


const mText = (...args) => currentCalculationCore().mText(...args);

const markupRate = (...args) => currentCalculationCore().markupRate(...args);

const isSlabMaterial = (...args) => currentCalculationCore().isSlabMaterial(...args);

const slabBaseCost = (...args) => currentCalculationCore().slabBaseCost(...args);

const khanstoneBaseCost = () => slabBaseCost("khanstone");

const COST_ITEM_BY_CODE = Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.itemCode, item]));
const COST_ITEM_BY_INPUT = Object.fromEntries(COST_ITEM_DEFINITIONS.map((item) => [item.inputId, item]));

function ensureEstimateStatusControl() { return estimateRestore.ensureEstimateStatusControl(); }

function ensureSaveButtons() { return estimateRestore.ensureSaveButtons(); }

function ensureAdminStandardCheckLists() { return estimateRestore.ensureAdminStandardCheckLists(); }

function ensureCostSnapshotPanel() { return estimateRestore.ensureCostSnapshotPanel(); }

function ensureContractPackagePanel() { return currentContractView().ensureContractPackagePanel(); }

function selectedContractEstimate() {
  if (currentEditingEstimateId) {
    return activeQuoteEstimate || cachedEstimates.find((estimate) => estimate.id === currentEditingEstimateId) || loadedContractEstimateState || null;
  }
  return loadedContractEstimateState || null;
}

function contractStatus(message, type = "") { return currentContractView().contractStatus(message, type); }

function estimateOptionState(estimate) {
  return estimate?.inputs && typeof estimate.inputs === "object" ? estimate.inputs : estimate || {};
}

function defaultContractOptionsFromEstimate(estimate, options = {}) {
  const state = estimateOptionState(estimate);
  return {
    ...options,
    estimate_id: options.estimate_id || estimate?.id || null,
    admin_tasks: {
      admin_office_filing_included: state.demolitionConsentEnabled === true,
      resident_consent_included: state.demolitionConsentEnabled === true,
      permit_filing_included: state.demolitionPermitEnabled === true,
      ...(options.admin_tasks || {}),
    },
    protection_options: {
      existing_finish_protection_included: state.interiorProtectionEnabled === true,
      ...(options.protection_options || {}),
    },
  };
}

function resolveContractOptionsForEstimate(options, estimate) {
  if (options?.id) return options;
  return defaultContractOptionsFromEstimate(estimate, options || {});
}

function collectContractOptionsPayload() {
  const text = (id) => document.getElementById(id)?.value?.trim() || "";
  const checked = (id) => document.getElementById(id)?.checked === true;
  const consentIncluded = checked("residentConsentIncluded");
  return {
    contract_no: null,
    contract_info: {
      contract_no: null,
      contract_date: text("contractDate") || null,
      construction_type: text("constructionType") || null,
      start_date: text("contractStartDate") || null,
      planned_completion_date: text("contractCompletionDate") || null,
    },
    customer_info: {
      customer_address: text("customerAddress") || null,
      customer_email: text("customerEmail") || null,
    },
    contractor_info: {},
    site_manager: {
      name: text("siteManagerName") || null,
      title: text("siteManagerTitle") || null,
      phone: text("siteManagerPhone") || null,
    },
    admin_tasks: {
      admin_office_filing_included: consentIncluded,
      resident_consent_included: consentIncluded,
      permit_filing_included: checked("permitFilingIncluded"),
    },
    protection_options: {
      existing_finish_protection_included: checked("existingFinishProtectionIncluded"),
    },
    item_options: {},
    notes: null,
  };
}

function validateContractOptionsForPreview(payload) {
  if (payload.customer_info.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.customer_info.customer_email)) {
    throw new Error("이메일 형식이 올바르지 않습니다.");
  }
  if (payload.contract_info.start_date && payload.contract_info.planned_completion_date &&
      payload.contract_info.start_date > payload.contract_info.planned_completion_date) {
    throw new Error("착공일은 준공예정일보다 늦을 수 없습니다.");
  }
}

function projectContractStatusLabel(status, hasPackage = false) {
  if (!hasPackage) return "계약 전";
  return {
    DRAFT: "계약 준비",
    PREVIEWED: "계약 준비",
    READY: "계약 준비",
    CONTRACTED: "계약 완료",
    CHANGE_PENDING: "변경 진행",
    SUPERSEDED: "변경 완료",
    CANCELLED: "계약 취소",
  }[status] || "계약 준비";
}

function contractPackageSummary(item = {}) { return currentContractViewModel().contractPackageSummary(item); }

function contractPackageSortValue(item = {}) {
  const version = Number(item.package_version) || 0;
  const updatedAt = Date.parse(item.updated_at || item.created_at || "") || 0;
  return { version, updatedAt };
}

function buildLatestContractPackageMap(packages = []) {
  const map = new Map();
  for (const item of packages) {
    const estimateId = item?.estimate_id;
    if (!estimateId) continue;
    const current = map.get(estimateId);
    if (!current) {
      map.set(estimateId, item);
      continue;
    }
    const nextValue = contractPackageSortValue(item);
    const currentValue = contractPackageSortValue(current);
    if (
      nextValue.version > currentValue.version ||
      (nextValue.version === currentValue.version && nextValue.updatedAt > currentValue.updatedAt)
    ) {
      map.set(estimateId, item);
    }
  }
  return map;
}

function projectContractMeta(estimate) {
  const item = projectContractPackageMap.get(estimate?.id);
  if (!projectContractPackageMapLoaded) {
    return {
      package: null,
      statusLabel: "-",
      contractNo: "-",
    };
  }
  return {
    package: item || null,
    statusLabel: projectContractStatusLabel(item?.status, Boolean(item)),
    contractNo: item?.contract_no || "-",
  };
}


function renderAllContractPackages() { return currentContractView().renderAllContractPackages(); }

function renderContractPrintDocument(snapshot, documents = snapshot.contract_document_versions || []) { return contractPrint.renderContractPrintDocument(snapshot, documents); }

function renderContractPrintSheet(type = "ALL") {
  const snapshot = contractPreviewState?.snapshot;
  if (!contractPrint.hasPrintTarget() || !snapshot) {
    alert("먼저 3종 문서 미리보기를 생성해 주세요.");
    return false;
  }
  return contractPrint.renderContractPrintSheet(type, snapshot, contractPreviewState.documents || []);
}

function renderContractPreview() { return currentContractView().renderContractPreview(); }

function renderContractPackagePanel(estimate = selectedContractEstimate()) { return currentContractView().renderContractPackagePanel(estimate); }

async function refreshContractPackagePanel(estimate = selectedContractEstimate()) {
  ensureContractPackagePanel();
  if (!estimate?.id || !canViewContractPackage()) {
    renderContractPackagePanel(null);
    return;
  }
  contractStatus("계약 정보를 불러오는 중입니다.");
  try {
    const [options, packages] = await Promise.all([
      loadContractOptions(estimate.id),
      loadContractPackages(estimate.id),
    ]);
    contractOptionsState = resolveContractOptionsForEstimate(options, estimate);
    contractPackagesState = Array.isArray(packages) ? packages : [];
    contractPreviewState = null;
    contractOptionsDirty = false;
    renderContractPackagePanel(estimate);
    contractStatus("계약 정보를 불러왔습니다.", "success");
  } catch (error) {
    console.error("계약 패키지 조회 실패", error);
    contractStatus(error.message || "계약 정보를 불러오지 못했습니다.", "error");
    renderContractPackagePanel(estimate);
  }
}

async function refreshAllContractPackages() {
  if (!canViewContractPackage() || isStaff()) {
    allContractPackagesState = [];
    renderAllContractPackages();
    return;
  }
  try {
    allContractPackagesState = await loadContractPackages(null, { q: contractPackageSearchKeyword });
    renderAllContractPackages();
  } catch (error) {
    console.error("계약 목록 조회 실패", error);
    allContractPackagesState = [];
    renderAllContractPackages();
    contractStatus(error.message || "계약 목록을 불러오지 못했습니다.", "error");
  }
}

async function saveContractOptionsFromForm() {
  const estimate = selectedContractEstimate();
  if (!estimate?.id || !canEditContractPackageOptions()) return;
  if (contractBusy) return;
  try {
    contractBusy = true;
    const payload = collectContractOptionsPayload();
    contractStatus("계약 옵션을 저장하는 중입니다.");
    contractOptionsState = await saveContractOptions(estimate.id, payload);
    contractOptionsDirty = false;
    renderContractPackagePanel(estimate);
    contractStatus("계약 옵션을 저장했습니다.", "success");
  } catch (error) {
    console.error("계약 옵션 저장 실패", error);
    contractStatus(error.message || "계약 옵션 저장에 실패했습니다.", "error");
  } finally {
    contractBusy = false;
  }
}

async function previewContractPackageFromForm() {
  const estimate = selectedContractEstimate();
  if (!estimate?.id || !canPreviewContractPackage()) return;
  if (contractBusy) return;
  if (currentPipeCleaningDerivedEstimate()) {
    contractStatus("기존 배관 청소 변경사항을 수정 저장한 뒤 3종 문서 미리보기를 생성해 주세요.", "error");
    return;
  }
  try {
    contractBusy = true;
    const payload = collectContractOptionsPayload();
    validateContractOptionsForPreview(payload);
    contractStatus("3종 문서 미리보기를 생성하는 중입니다.");
    contractPreviewState = await previewContractPackage(estimate.id, payload);
    contractSelectedDocumentType = "CONTRACT";
    renderContractPackagePanel(estimate);
    contractStatus("미리보기를 생성했습니다. 데이터는 저장되지 않았습니다.", "success");
  } catch (error) {
    console.error("계약 패키지 미리보기 실패", error);
    contractStatus(error.message || "미리보기를 생성하지 못했습니다.", "error");
  } finally {
    contractBusy = false;
  }
}

function estimateFromContractPackage(contractPackage) {
  const summary = contractPackageSummary(contractPackage);
  const estimate = contractPackage.estimate_snapshot || {};
  const customerQuote = estimate.customer_quote || {};
  const total = Number(estimate.total_price ?? summary.totalAmount) || 0;
  return {
    id: contractPackage.estimate_id || estimate.estimate_id || "",
    projectName: summary.projectName,
    clientName: summary.customerName,
    phone: summary.customerPhone,
    clientPhone: summary.customerPhone,
    address: summary.siteAddress,
    areaPyeong: estimate.area_pyeong || contractPackage.contract_info?.area_pyeong || 0,
    status: estimate.status || "계약",
    total,
    totalText: estimate.total_text || won(total),
    customerQuote,
    savedAt: estimate.estimate_revision || contractPackage.updated_at || contractPackage.created_at || null,
    contractPackageId: contractPackage.id || null,
    contractNo: contractPackage.contract_no || summary.contractNo,
  };
}

async function createContractPackageFromForm() {
  const estimate = selectedContractEstimate();
  if (!estimate?.id || !canCreateContractPackage()) return;
  if (contractBusy) return;
  if (currentPipeCleaningDerivedEstimate()) {
    contractStatus("기존 배관 청소 변경사항을 수정 저장한 뒤 계약 패키지를 확정 저장해 주세요.", "error");
    return;
  }
  try {
    contractBusy = true;
    const currentPackage = contractPreviewState?.snapshot?.id ? contractPreviewState.snapshot : null;
    if (currentPackage?.status === "CONTRACTED") {
      contractStatus(`${currentPackage.contract_no || "계약"}은 이미 확정되어 있습니다.`, "success");
      return;
    }
    const payload = collectContractOptionsPayload();
    validateContractOptionsForPreview(payload);
    contractStatus("계약 패키지를 확정 저장하는 중입니다.");
    const draftPackage = currentPackage || await createContractPackage(estimate.id, payload);
    const confirmedPackage = await confirmContractPackage(draftPackage.id);
    const contractPackage = {
      ...draftPackage,
      ...confirmedPackage,
      status: confirmedPackage.status || "CONTRACTED",
      confirmed_at: confirmedPackage.confirmed_at || draftPackage.confirmed_at,
    };
    contractPreviewState = {
      status: contractPackage.status || "CONTRACTED",
      snapshot: contractPackage,
      documents: contractPackage.contract_document_versions || [],
    };
    contractSelectedDocumentType = "CONTRACT";
    contractOptionsDirty = false;
    await refreshContractPackagePanel(estimate);
    await refreshAllContractPackages();
    contractPreviewState = {
      status: contractPackage.status || "CONTRACTED",
      snapshot: contractPackage,
      documents: contractPackage.contract_document_versions || [],
    };
    renderContractPackagePanel(estimate);
    contractStatus(`${contractPackage.contract_no || "계약 패키지"}를 확정 저장했습니다.`, "success");
  } catch (error) {
    console.error("계약 확정 저장 실패", error);
    contractStatus(error.message || "계약 확정 저장에 실패했습니다.", "error");
  } finally {
    contractBusy = false;
  }
}

async function loadContractPackageToPreview(packageId) {
  if (!packageId || contractBusy) return;
  try {
    contractBusy = true;
    contractStatus("저장된 계약 패키지를 불러오는 중입니다.");
    const contractPackage = await loadContractPackage(packageId);
    loadedContractEstimateState = estimateFromContractPackage(contractPackage);
    currentEditingEstimateId = loadedContractEstimateState.id;
    activeQuoteEstimate = loadedContractEstimateState;
    lastRenderedEstimateSnapshot = loadedContractEstimateState;
    loadedEstimateBaseline = {
      id: loadedContractEstimateState.id || null,
      inputs: null,
      estimate: loadedContractEstimateState,
    };
    contractOptionsState = contractPackage.document_options_snapshot || { estimate_id: loadedContractEstimateState.id };
    contractPackagesState = [contractPackage];
    contractPreviewState = {
      status: contractPackage.status || "READY",
      snapshot: contractPackage,
      documents: contractPackage.contract_document_versions || [],
    };
    contractSelectedDocumentType = "CONTRACT";
    contractOptionsDirty = false;
    setText("clientTotal", customerWon(Number(loadedContractEstimateState.total) || 0));
    renderCustomerQuote(loadedContractEstimateState);
    renderStoredInternalSummary(loadedContractEstimateState);
    renderInternalRows([]);
    renderPurchaseOrder(loadedContractEstimateState);
    renderContractPackagePanel(loadedContractEstimateState);
    contractStatus(`${contractPackage.contract_no || "계약 패키지"}를 불러왔습니다.`, "success");
  } catch (error) {
    console.error("계약 패키지 불러오기 실패", error);
    contractStatus(error.message || "계약 패키지를 불러오지 못했습니다.", "error");
  } finally {
    contractBusy = false;
  }
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

function canViewContractPackage() {
  return Boolean(currentProfile);
}

function canEditContractPackageOptions() {
  return isAdmin() || currentProfile?.role === "staff";
}

function canPreviewContractPackage() {
  return isAdmin() || currentProfile?.role === "staff";
}

function canCreateContractPackage() {
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

function repairStaticKoreanLabels() { return uiShell.repairStaticKoreanLabels(); }

function removeDuplicateManagementCriteriaBlock() { return uiShell.removeDuplicateManagementCriteriaBlock(); }

function removeLegacyAdminEstimatePanels() { return uiShell.removeLegacyAdminEstimatePanels(); }

function updateRatesFromAdmin() {
  const context = { rates, flooringSheetGradeOptions, flooringWoodGradeOptions, pipeCleaningAmount: PIPE_CLEANING_AMOUNT };
  syncEstimateFormRates(el, context);
  PIPE_CLEANING_AMOUNT = context.pipeCleaningAmount;
}

function readState() {
  updateRatesFromAdmin();
  return buildEstimateState(readEstimateForm(el));
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
const flooringSheetGradeOptions = {
  t18: { label: "1.8T", unitPrice: 27000 },
  t20: { label: "2T", unitPrice: 36000 },
  t22: { label: "2.2T", unitPrice: 46000 },
  t32: { label: "3.2T", unitPrice: 73000 },
  t45: { label: "4.5T", unitPrice: 90000 },
  t50: { label: "5T", unitPrice: 100000 },
};
const flooringWoodGradeOptions = {
  editone: { label: "LX 에디톤급", unitPrice: 150000 },
  standard: { label: "일반마루", unitPrice: 100000 },
};
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

const estimateRestore = createEstimateRestore({ document, elements: el, excludedInputById: COST_ITEM_BY_INPUT });
const estimateView = createEstimateView({ document, customerWon, formatDateTime, quoteGroupLabels, quoteGroupOrder });
const estimatePrint = createEstimatePrint({ document, customerWon, formatDateTime, printGroupLabels });
const contractPrint = createContractPrint({ document, formatDateTime });
const uiShell = createUiShell({ document, Node, ensureEstimateStatusControl, ensureSaveButtons, ensureAdminStandardCheckLists, ensureCostSnapshotPanel });

function currentAccountView() {
  return createAccountView({ document, osUsers, osUsersLoaded, osUserActionBusy, editingUserId, resettingUserId, canManageUsers, formatDateTime });
}

function currentAuditView() {
  return createAuditView({ document, osAuditLogs, osAuditLogsLoaded, canManageUsers, formatDateTime });
}


function currentContractViewModel() {
  return createContractViewModel({ contractOptionsState, contractPreviewState, contractPackagesState, allContractPackagesState, contractSelectedDocumentType });
}
function currentContractView() {
  return createContractView({ document, model: currentContractViewModel(), selectedEstimate: selectedContractEstimate(), formatDateTime,
    permissions: { view: canViewContractPackage(), edit: canEditContractPackageOptions(), create: canCreateContractPackage(), staff: isStaff() },
  });
}
function currentCostViewModel() {
  return createCostViewModel({ originalCostItems, costItemFilters, systemCostHistory, systemPublishLogs, systemEstimateCount,
    expandedSystemCostCategory, costItemEditorMode, costItemEditorSourceCode, formatDateTime,
  });
}
function currentCostView() {
  return createCostView({ document, model: currentCostViewModel(), costItemFilters, expandedSystemCostCategory, systemCostHistory, systemPublishLogs,
    costItemEditorMode, costItemActionBusy, formatDateTime, permissions: { view: canViewSystem(), edit: canEditCost(), publish: canPublishCost() },
    onOpenSystem: () => {
      activateTab("system");
      refreshSystemManagement().catch((error) => console.error("시스템 관리 갱신 실패", error));
    },
    onRenderSystem: renderSystemManagement,
  });
}

function estimateInternalViewModel(estimate) {
  return buildEstimateInternalViewModel(estimate, { groupLabels: quoteGroupLabels, groupOrder: quoteGroupOrder,
    markupRate, canViewInternal: canViewSystem(), pipeCleaningItemName: PIPE_CLEANING_ITEM_NAME, pipeCleaningAmount: PIPE_CLEANING_AMOUNT,
  });
}

const countertopQuoteText = (material, billingM) =>
  isSlabMaterial(material) ? "1장 + 가공/시공" : mText(billingM);
const groupTotalFromDetails = (...args) => currentCalculationCore().groupTotalFromDetails(...args);

const carpentryCofferLabel = (type) => ({
  new: "우물천장 신설",
  change: "우물천장 변경",
}[type] || "");

function calculate() { return currentCalculationCore().calculate(readState()); }


function renderQuoteRows(lines, details, total) { return estimateView.renderQuoteRows(lines, details, total); }

function renderInternalRows(details) {
  if (!estimateView.hasInternalRowTargets()) return;
  return estimateView.renderInternalRows(buildInternalRowsModel(details));
}

function renderWarnings(warnings) { return estimateView.renderWarnings(warnings); }

function formatDateTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function collectInputValues() {
  return collectEstimateFormValues(el, COST_ITEM_BY_INPUT);
}

function restoreInputValues(inputs = {}) { return estimateRestore.restoreInputValues(inputs); }

const groupedCustomerItems = (...args) => currentCalculationCore().groupedCustomerItems(...args);


function buildEstimateSnapshot(result, options = {}) {
  const savedAt = new Date().toISOString();
  const customerGroups = groupedCustomerItems(result.details, result.quoteLines);
  const customerTotal = customerGroups.reduce((sum, group) => sum + (Number(group.total) || 0), 0);
  const inputOverrides = effectiveEstimateInputOverrides(result.state);
  const snapshot = {
    projectName: result.state.projectName,
    ...(options.address != null ? { address: options.address } : {}),
    areaPyeong: result.state.areaPyeong,
    clientName: result.state.clientName,
    phone: result.state.clientPhone,
    savedAt,
    total: customerTotal,
    totalText: customerWon(customerTotal),
    costTotal: result.directCost,
    marginRate: Number((result.actualMargin * 100).toFixed(2)),
    status: result.state.status || "견적",
    costSnapshot: options.costSnapshot || buildCostSnapshot(),
    author: {
      user_id: currentProfile?.id || getAuthSession()?.user?.id || "",
      user_email: currentProfile?.email || getAuthSession()?.user?.email || "",
      role: currentProfile?.role || "",
    },
    inputs: {
      ...collectInputValues(),
      ...inputOverrides,
    },
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
      total: customerTotal,
      totalText: customerWon(customerTotal),
      status: result.state.status || "견적",
      groups: customerGroups,
    },
  };
  return applyExistingPipeCleaningAdjustment(snapshot, result.state.existingPipeCleaningEnabled);
}

const PIPE_CLEANING_ITEM_NAME = "기존 배관 청소";
let PIPE_CLEANING_AMOUNT = 300000;

function applyExistingPipeCleaningAdjustment(estimate, enabled = Boolean(el.existingPipeCleaningEnabled?.checked)) { return currentCalculationCore().applyExistingPipeCleaningAdjustment(estimate, enabled); }


function currentPipeCleaningDerivedEstimate() {
  if (!pipeCleaningAdjustmentDirty || !activeQuoteEstimate?.customerQuote) return null;
  return activeQuoteEstimate;
}

function renderEstimateSnapshotOnly(estimate) {
  const total = Number(estimate.total ?? estimate.customerQuote?.total) || 0;
  setText("clientTotal", customerWon(total));
  renderCustomerQuote(estimate);
  renderStoredInternalSummary(estimate);
  renderInternalRows(estimate.internalDetails || []);
  renderPurchaseOrder(estimate);
  lastRenderedEstimateSnapshot = estimate;
}

function renderAdminEstimateDetailPanel(estimate) { return estimateView.renderAdminEstimateDetailPanel(estimateInternalViewModel(estimate), expandedAdminTradeKey); }


function renderAdminMarginTable(estimate) {
  if (!estimateView.hasAdminMarginTargets()) return;
  return estimateView.renderAdminMarginTable(estimateInternalViewModel(estimate));
}

function renderStoredInternalSummary(estimate) { return estimateView.renderStoredInternalSummary(buildStoredInternalSummaryModel(estimate, { markupRate })); }

function renderCostSnapshotInfo(estimate) {
  if (!isAdmin()) return;
  const snapshot = estimate?.costSnapshot;
  const currentLatest = latestDate(currentCostItems().map((item) => item.updatedAt));
  estimateView.renderCostSnapshotInfo(estimate, { currentLatest,
    snapshotChanged: Boolean(snapshot?.items?.length && costSnapshotChanged(snapshot)),
    hasCurrentItems: Boolean(originalCostItems.size),
  });
}

function renderCostSnapshotComparison(estimate) {
  if (!estimateView.hasCostComparisonTarget() || !estimate?.costSnapshot?.items?.length) {
    estimateView.renderCostSnapshotComparison(null);
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
  estimateView.renderCostSnapshotComparison({ rows, savedDirectCost, currentDirectCost, directDiff });
}

function renderPrintQuote(quote) { return estimatePrint.renderPrintQuote(quote); }

function renderCustomerSummaryPrint(quote) { return estimatePrint.renderCustomerSummaryPrint(quote); }

function currentEstimateForPrint() {
  if (currentProfile?.role === "staff") return activeQuoteEstimate || lastRenderedEstimateSnapshot;
  return activeQuoteEstimate || lastRenderedEstimateSnapshot || buildEstimateSnapshot(calculateForCurrentEstimate());
}

function renderAdminDetailPrint(estimate) { return estimatePrint.renderAdminDetailPrint(estimate); }

function renderAdminInternalPrint(estimate) {
  if (!estimatePrint.hasPrintTarget() || !estimate) return;
  estimatePrint.renderAdminInternalPrint(estimate, estimateInternalViewModel(estimate));
}

function renderPurchaseOrder(estimate) {
  if (!estimateView.hasPurchaseOrderTargets()) return;
  const items = purchaseOrderItems(estimate || currentEstimateForPrint(), quoteGroupLabels);
  estimateView.renderPurchaseOrder(items);
}

function renderPurchaseOrderPrint(estimate) {
  if (!estimatePrint.hasPrintTarget() || !estimate) return;
  const items = purchaseOrderItems(estimate, quoteGroupLabels);
  estimatePrint.renderPurchaseOrderPrint(estimate, items);
}

function renderAdminProcessTotals(quote) { return estimateView.renderAdminProcessTotals(quote); }

function renderCustomerQuote(estimate) {
  const quote = estimate?.customerQuote;
  estimateView.renderCustomerQuote(estimate);
  if (isAdmin() && estimateView.hasAdminMarginTargets()) renderAdminMarginTable(quote ? estimate : null);
  renderPurchaseOrder(quote ? estimate : null);
  if (quote) renderPrintQuote(quote);
  renderAdminProcessTotals(quote || null);
  renderCostSnapshotInfo(quote ? estimate : null);
}

function renderSavedEstimateRow(estimate, options = {}) {
  const admin = Boolean(options.admin);
  const canViewInternal = Boolean(options.canViewInternal);
  const colspan = options.colspan || 1;
  const contract = projectContractMeta(estimate);
  const estimateId = escapeHtml(estimate.id || "");
  const cells = `
    <td>${escapeHtml(estimate.projectName || "-")}</td>
    <td>${escapeHtml(estimate.clientName || "-")}</td>
    <td>${escapeHtml(estimate.phone || "-")}</td>
    <td>${escapeHtml(estimate.address || "-")}</td>
    <td>${escapeHtml(estimate.status || "상담")}</td>
    <td>${escapeHtml(contract.statusLabel)}</td>
    <td>${escapeHtml(contract.contractNo)}</td>
    <td>${formatDateTime(estimate.savedAt)}</td>
    <td><button type="button" data-open-estimate="${estimateId}">열기</button></td>
    ${canViewInternal ? `<td><button type="button" data-toggle-internal-estimate="${estimateId}">${expandedAdminEstimateId === estimate.id ? "내부견적 닫기" : "내부견적 상세 보기"}</button></td>` : ""}
    ${admin ? `<td><button type="button" data-delete-estimate="${estimateId}">삭제</button></td>` : ""}
  `;
  const detail = canViewInternal && expandedAdminEstimateId === estimate.id
    ? `<tr class="admin-estimate-detail-row"><td colspan="${colspan}">${renderAdminEstimateDetailPanel(adminEstimateDetailCache.get(estimate.id) || estimate)}</td></tr>`
    : "";
  return `
    <tr>
      ${cells}
    </tr>
    ${detail}
  `;
}

function renderSavedEstimateTableRows(tbody, estimates, options = {}) {
  const colspan = options.colspan || 1;
  tbody.innerHTML = estimates.length
    ? estimates.map((estimate) => renderSavedEstimateRow(estimate, { ...options, colspan })).join("")
    : `<tr><td colspan="${colspan}">저장된 프로젝트가 없습니다.</td></tr>`;
}

async function renderSavedEstimateRows() {
  const tbody = document.getElementById("savedEstimateRows");
  if (!tbody) return;
  const admin = isAdmin();
  const canViewInternal = canViewSystem();
  const canMergeContracts = isAdmin() || isManager();
  const colspan = 9 + (canViewInternal ? 1 : 0) + (admin ? 1 : 0);
  expandedAdminEstimateId = null;
  expandedAdminTradeKey = null;
  const headerRow = tbody.closest("table")?.querySelector("thead tr");
  if (headerRow) {
    headerRow.innerHTML = `
      <th>프로젝트명</th>
      <th>고객명</th>
      <th>연락처</th>
      <th>주소</th>
      <th>견적 상태</th>
      <th>계약 상태</th>
      <th>계약번호</th>
      <th>저장일</th>
      <th>열기</th>
      ${canViewInternal ? "<th>내부견적</th>" : ""}
      ${admin ? "<th>삭제</th>" : ""}
    `;
  }
  const heading = tbody.closest(".internal-card")?.querySelector(".section-heading h2");
  const description = tbody.closest(".internal-card")?.querySelector(".section-heading p");
  if (heading) heading.textContent = "프로젝트 목록";
  if (description) description.textContent = "저장된 견적과 연결된 계약 상태를 함께 확인합니다.";
  tbody.innerHTML = `<tr><td colspan="${colspan}">프로젝트 목록을 불러오는 중입니다.</td></tr>`;
  try {
    const estimates = await loadEstimates();
    cachedEstimates = estimates;
    projectContractPackageMap = new Map();
    projectContractPackageMapLoaded = false;
    if (canMergeContracts) {
      try {
        const packages = await loadContractPackages(null);
        projectContractPackageMap = buildLatestContractPackageMap(Array.isArray(packages) ? packages : []);
        projectContractPackageMapLoaded = true;
      } catch (error) {
        console.warn("프로젝트 계약 상태 조회 실패", error);
        projectContractPackageMap = new Map();
        projectContractPackageMapLoaded = false;
      }
    }
    renderProjectSearchResults();
    renderSavedEstimateTableRows(tbody, cachedEstimates, { admin, canViewInternal, colspan });
  } catch (error) {
    console.error("견적 조회 실패", error);
    tbody.innerHTML = `<tr><td colspan="${colspan}">프로젝트 목록 조회에 실패했습니다.</td></tr>`;
    alert("프로젝트 목록 조회에 실패했습니다.");
  }
}

function renderStandardCheck(state) { return estimateView.renderStandardCheck(state); }


function syncSectionLocks() { return estimateRestore.syncSectionLocks(); }

function syncBlockLocks() { return estimateRestore.syncBlockLocks(); }

function guardCheckboxLabelClicks() { return estimateRestore.guardCheckboxLabelClicks(); }

function render() {
  if (currentProfile?.role === "staff") {
    renderStaffEstimate();
    return;
  }
  const result = calculateForCurrentEstimate();
  const usesStoredEstimateSnapshot = syncLoadedEstimateSnapshot();
  const calculatedSnapshot = buildEstimateSnapshot(result);
  const displayEstimate = usesStoredEstimateSnapshot && activeQuoteEstimate ? activeQuoteEstimate : calculatedSnapshot;
  const presentation = buildCalculatedEstimatePresentation(result, displayEstimate, { groupTotalFromDetails, mmText, customerWon });
  estimateView.renderInputSummary(presentation);
  renderCustomerQuote(displayEstimate);
  estimateView.renderCalculatedInternalSummary(presentation);
  renderInternalRows(displayEstimate.internalDetails || result.details);
  renderWarnings(result.warnings);
  renderStandardCheck(result.state);
  renderPurchaseOrder(displayEstimate);
  if (usesStoredEstimateSnapshot && activeQuoteEstimate) {
    const storedTotal = Number(activeQuoteEstimate.total ?? activeQuoteEstimate.customerQuote?.total) || 0;
    setText("clientTotal", customerWon(storedTotal));
    renderStoredInternalSummary(activeQuoteEstimate);
    renderInternalRows(activeQuoteEstimate.internalDetails || []);
    renderPurchaseOrder(activeQuoteEstimate);
  }
  lastRenderedEstimateSnapshot = displayEstimate;
}

function refresh() {
  syncSectionLocks();
  syncBlockLocks();
  render();
}

let staffPreviewGeneration = 0;
let staffPreviewTimer = null;

function displayStaffEstimate(estimate) {
  activeQuoteEstimate = estimate;
  lastRenderedEstimateSnapshot = estimate;
  setText("clientTotal", estimate.totalText || customerWon(estimate.total));
  renderCustomerQuote(estimate);
  renderStandardCheck(readState());
}

function cancelStaffPreview() {
  staffPreviewGeneration += 1;
  clearTimeout(staffPreviewTimer);
}

function renderStaffEstimate() {
  cancelStaffPreview();
  const pipeChanged = pipeCleaningAdjustmentDirty && Boolean(el.existingPipeCleaningEnabled?.checked)
    !== Boolean(loadedEstimateBaseline?.estimate?.inputs?.existingPipeCleaningEnabled);
  if (!pipeChanged && loadedEstimateMatchesCurrentInputs() && loadedEstimateBaseline?.estimate?.customerQuote) {
    displayStaffEstimate(loadedEstimateBaseline.estimate);
    return;
  }
  const generation = staffPreviewGeneration;
  const inputs = staffCurrentEstimateInputs();
  const estimateId = currentEditingEstimateId;
  setSaveStatus("고객 견적을 계산 중입니다.");
  staffPreviewTimer = setTimeout(async () => {
    try {
      const estimate = await previewStaffEstimate(inputs, estimateId);
      if (generation !== staffPreviewGeneration || currentProfile?.role !== "staff" || estimateId !== currentEditingEstimateId) return;
      displayStaffEstimate(estimate);
      setSaveStatus("입력값으로 고객 견적을 계산했습니다. 저장 전까지 원본 견적은 변경되지 않습니다.");
    } catch (error) {
      if (generation === staffPreviewGeneration) setSaveStatus(error.message || "견적 계산에 실패했습니다.");
    }
  }, 160);
}

function staffCurrentEstimateInputs() {
  return { ...currentEstimateInputValues(),
    existingPipeCleaningEnabled: Boolean(el.existingPipeCleaningEnabled?.checked),
  };
}

function activateTab(tabId) { return uiShell.activateTab(tabId); }

let staffAdminShellApplied = false;

function renderStaffAdminShell() { staffAdminShellApplied = uiShell.renderStaffAdminShell(staffAdminShellApplied); }

function changedCostItems() { return currentCostViewModel().changedCostItems(); }

function rowsBySystemFilter(options) { return currentCostViewModel().rowsBySystemFilter(options); }

function systemSubcategories(category = "") { return currentCostViewModel().systemSubcategories(category); }

function effectiveEstimateInputOverrides(state = readState()) {
  return projectEffectiveEstimateInputs(state);
}

function currentEstimateInputValues() {
  const formValues = collectInputValues();
  return composeEstimateInputs(formValues, readState());
}

function currentInputKey() {
  return canonicalInputValues(currentEstimateInputValues(), COST_ITEM_BY_INPUT);
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
  const derived = currentPipeCleaningDerivedEstimate();
  if (derived) {
    activeQuoteEstimate = derived;
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

function ensureSystemManagementShell() { return currentCostView().ensureSystemManagementShell(); }

function removeSystemManagementShell() { return currentCostView().removeSystemManagementShell(); }

function setSystemStatus(message) { return currentCostView().setSystemStatus(message); }

function renderSystemStatus() { return currentCostView().renderSystemStatus(); }

function renderBulkMarginPanel() { return currentCostView().renderBulkMarginPanel(); }

function renderCategoryCancelPanel() { return currentCostView().renderCategoryCancelPanel(); }

function renderCostItemTools() { return currentCostView().renderCostItemTools(); }

function renderCostItemEditor() { return currentCostView().renderCostItemEditor(); }


function renderSystemCostRows() {
  const view = currentCostView();
  if (!view.hasAccordionTarget()) return;
  const prepared = currentCostViewModel().accordion();
  expandedSystemCostCategory = prepared.expanded;
  view.renderSystemCostRows(prepared);
}

function renderSystemDraftRows() { return currentCostView().renderSystemDraftRows(); }

function renderSystemHistoryRows() { return currentCostView().renderSystemHistoryRows(); }

function renderSystemPublishLogRows() { return currentCostView().renderSystemPublishLogRows(); }

function renderRollbackPanel(version = "") { return currentCostView().renderRollbackPanel(version); }

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function isValidInitialPassword(value) {
  const password = String(value || "");
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

function setUserManagementStatus(message, type = "") { return currentAccountView().setUserManagementStatus(message, type); }

function renderUserManagement() { return currentAccountView().renderUserManagement(); }

function renderAuditLogRows() { return currentAuditView().renderAuditLogRows(); }

function ensureAuditLogShell() { return currentAuditView().ensureAuditLogShell(); }

function removePrivilegedManagementShell() {
  uiShell.removePrivilegedManagementShell();
  osUsers = [];
  osUsersLoaded = false;
  osAuditLogs = [];
  osAuditLogsLoaded = false;
  editingUserId = null;
  resettingUserId = null;
}

function setAuditLogStatus(message, type = "") { return currentAuditView().setAuditLogStatus(message, type); }

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

function ensureUserManagementShell() { return currentAccountView().ensureUserManagementShell(); }

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
  currentCostView().applyRolePresentation();
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
  const previousKeyword = costItemFilters.keyword;
  costItemFilters = {
    keyword: document.getElementById("costItemSearch")?.value || "",
    category: "",
    subcategory: document.getElementById("costItemSubcategoryFilter")?.value || "",
    active: document.getElementById("costItemActiveFilter")?.value || "all",
    state: document.getElementById("costItemStateFilter")?.value || "all",
    sort: document.getElementById("costItemSortFilter")?.value || "sort",
  };
  if (costItemFilters.keyword && costItemFilters.keyword !== previousKeyword) {
    expandedSystemCostCategory = "";
  }
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

function setPasswordChangeRequired(required) { return uiShell.setPasswordChangeRequired(required, !!getAuthSession()); }

function clearPasswordChangeInputs() { return uiShell.clearPasswordChangeInputs(); }

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
  uiShell.bindPasswordChangeShell({ onSubmit: submitOwnPasswordChange, onLogout: handlePasswordChangeLogout });
}

function applyAccessControl() {
  return uiShell.applyAccessControl({ currentProfile, isStaff, isManager, isAdmin,
    removeSystemManagementShell, renderStaffAdminShell, removePrivilegedManagementShell,
    ensureSystemManagementShell, ensureContractPackagePanel });
}

function setAuthenticated(isAuthenticated) { return uiShell.setAuthenticated(isAuthenticated); }

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
  renderContractPackagePanel();
  await refreshAllContractPackages();
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
    const contract = projectContractMeta(estimate);
    const contractText = contract.contractNo === "-"
      ? contract.statusLabel
      : `${contract.statusLabel} ${contract.contractNo}`;
    option.value = estimate.id;
    option.textContent = `${estimate.projectName} · ${estimate.clientName || "고객명 없음"} · ${estimate.totalText} · ${contractText}`;
    select.appendChild(option);
  }
}

function loadEstimateIntoUi(estimate) {
  cancelStaffPreview();
  pipeCleaningAdjustmentDirty = false;
  lastRenderedEstimateSnapshot = null;
  estimateRestore.restoreEstimateForm(estimate);
  currentEditingEstimateId = estimate.id || null;
  activeQuoteEstimate = null;
  loadedContractEstimateState = null;
  if (currentProfile?.role !== "staff") refresh();
  const hasStoredResult = estimate.customerQuote || estimate.internalSummary || estimate.internalDetails;
  const displayEstimate = hasStoredResult || currentProfile?.role === "staff"
    ? estimate
    : {
      ...estimate,
      ...buildEstimateSnapshot(calculate()),
      id: estimate.id,
      savedAt: estimate.savedAt,
      costSnapshot: estimate.costSnapshot,
  };
  activeQuoteEstimate = displayEstimate;
  lastRenderedEstimateSnapshot = displayEstimate;
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
  refreshContractPackagePanel(displayEstimate).catch((error) => console.error("계약 패키지 갱신 실패", error));
}

let saveEstimateInProgress = false;

function setSaveStatus(message) {
  const status = document.getElementById("saveStatus");
  if (status) status.textContent = message;
}

function handleEstimateInputChanged() {
  pipeCleaningAdjustmentDirty = false;
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

function handleExistingPipeCleaningChanged() {
  if (currentProfile?.role === "staff") {
    pipeCleaningAdjustmentDirty = true;
    renderStaffEstimate();
    return;
  }
  const enabled = Boolean(el.existingPipeCleaningEnabled?.checked);
  const baseEstimate = activeQuoteEstimate || loadedEstimateBaseline?.estimate || lastRenderedEstimateSnapshot;
  if (!baseEstimate?.customerQuote) return;
  const adjustedEstimate = applyExistingPipeCleaningAdjustment(baseEstimate, enabled);
  if (!adjustedEstimate) return;
  activeQuoteEstimate = adjustedEstimate;
  pipeCleaningAdjustmentDirty = true;
  renderEstimateSnapshotOnly(adjustedEstimate);
  setSaveStatus("기존 배관 청소 항목만 변경되었습니다. 수정 저장 전까지 원본 견적은 변경되지 않습니다.");
}

async function handleSaveEstimate(mode = "update") {
  if (saveEstimateInProgress) return;
  saveEstimateInProgress = true;
  try {
    setSaveStatus("저장 준비 중입니다.");
    const isUpdate = mode === "update";
    if (currentProfile?.role === "staff") {
      const updateId = currentEditingEstimateId;
      if (isUpdate && !updateId) throw new Error("수정할 저장 견적이 없습니다. 새 견적으로 저장을 사용해 주세요.");
      cancelStaffPreview();
      const inputKeyAtSave = currentInputKey();
      const inputEstimate = { inputs: staffCurrentEstimateInputs(),
        ...(isUpdate && loadedEstimateBaseline?.estimate?.address != null ? { address: loadedEstimateBaseline.estimate.address } : {}) };
      const saved = isUpdate ? await updateEstimate(updateId, inputEstimate) : await saveEstimate(inputEstimate);
      const unchanged = currentInputKey() === inputKeyAtSave
        && Boolean(el.existingPipeCleaningEnabled?.checked) === inputEstimate.inputs.existingPipeCleaningEnabled;
      if (unchanged) restoreInputValues(saved.inputs);
      displayStaffEstimate(saved);
      currentEditingEstimateId = saved.id || null;
      loadedEstimateBaseline = { id: saved.id || null, inputs: unchanged ? currentInputKey() : inputKeyAtSave, estimate: saved };
      pipeCleaningAdjustmentDirty = false;
      setSaveStatus("고객 견적 저장 완료");
      await renderSavedEstimateRows();
      await refreshContractPackagePanel(saved);
      if (!unchanged) renderStaffEstimate();
      activateTab("quote");
      return;
    }
    const pipeCleaningSnapshot = isUpdate ? currentPipeCleaningDerivedEstimate() : null;
    const result = pipeCleaningSnapshot ? null : calculateForCurrentEstimate();
    if (!pipeCleaningSnapshot && isUpdate && shouldUseLoadedCostSnapshot() && snapshotCalculationMissingItems.length) {
      const message = `저장 당시 원가 스냅샷에 ${snapshotCalculationMissingItems.join(", ")} 품목이 없어 현재 원가와 섞어 저장하지 않았습니다. 새 기준 재계산 기능에서 처리해 주세요.`;
      setSaveStatus(message);
      alert(message);
      return;
    }
    const snapshot = pipeCleaningSnapshot || buildEstimateSnapshot(result, {
      address: isUpdate ? loadedEstimateBaseline?.estimate?.address : undefined,
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
    pipeCleaningAdjustmentDirty = false;
    lastRenderedEstimateSnapshot = saved;
    renderCustomerQuote(saved);
    renderStoredInternalSummary(saved);
    setSaveStatus(`${formatDateTime(saved.savedAt)} ${isUpdate ? "수정 저장 완료" : "새 견적 저장 완료"}`);
    renderSavedEstimateRows().catch((error) => {
      console.warn("저장 후 목록 갱신 실패", error);
    });
    refreshContractPackagePanel(saved).catch((error) => console.warn("저장 후 계약 패키지 갱신 실패", error));
    activateTab("quote");
  } catch (error) {
    console.error("견적 저장 실패", error);
    setSaveStatus("견적 저장에 실패했습니다.");
    alert(error.message || "견적 저장에 실패했습니다.");
  } finally {
    saveEstimateInProgress = false;
  }
}

function handleTabNavigation(tabId) {
  activateTab(tabId);
  if (tabId === "admin") renderSavedEstimateRows();
  if (tabId === "system") refreshSystemManagement().catch((error) => console.error("시스템 관리 갱신 실패", error));
}

function handlePasswordChangeLogout() {
  leavePasswordChangeFlow().catch((error) => console.error("비밀번호 변경 화면 로그아웃 실패", error));
}

function handleBoundEstimateInput(input) {
  normalizeIntegerInput(input, integerIds);
  syncRateDirtyState(input);
  handleEstimateInputChanged();
}

async function onLoginSubmit(event) {
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
}

async function onLogoutClick() {
  await signOut();
  cancelStaffPreview();
  activeQuoteEstimate = null;
  loadedEstimateBaseline = null;
  lastRenderedEstimateSnapshot = null;
  currentEditingEstimateId = null;
  cachedEstimates = [];
  currentProfile = null;
  contractOptionsState = null;
  contractPackagesState = [];
  contractPreviewState = null;
  contractOptionsDirty = false;
  if (staffAdminShellApplied) {
    window.location.reload();
    return;
  }
  setAuthenticated(false);
  document.getElementById("loginPassword").value = "";
}

function onProjectSearchInput() {
  renderProjectSearchResults();
  if (!expandedAdminEstimateId) return;
  expandedAdminEstimateId = null;
  expandedAdminTradeKey = null;
  const tbody = document.getElementById("savedEstimateRows");
  if (tbody && cachedEstimates.length) {
    renderSavedEstimateTableRows(tbody, cachedEstimates, {
      admin: isAdmin(),
      canViewInternal: canViewSystem(),
      colspan: 9 + (canViewSystem() ? 1 : 0) + (isAdmin() ? 1 : 0),
    });
  }
}

async function onLoadProjectClick() {
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
}

function onSaveEstimateClick() { return handleSaveEstimate("update"); }

function onSaveAsNewEstimateClick() { return handleSaveEstimate("new"); }

function onDelegatedSaveClick(event) {
  const button = event.target?.closest?.("#saveEstimateButton, #saveAsNewEstimateButton");
  if (!button) return;
  event.preventDefault();
  handleSaveEstimate(button.id === "saveAsNewEstimateButton" ? "new" : "update");
}

function onContractOptionsInput(event) {
  if (!event.target?.closest?.("#contractOptionsForm")) return;
  contractOptionsDirty = true;
  contractStatus("저장되지 않은 계약 옵션 변경사항이 있습니다.");
}

function onContractOptionsChange(event) {
  if (!event.target?.closest?.("#contractOptionsForm")) return;
  contractOptionsDirty = true;
  contractStatus("저장되지 않은 계약 옵션 변경사항이 있습니다.");
}

async function onContractActionClick(event) {
  const button = event.target?.closest?.("#saveContractOptionsButton, #createContractPackageButton, #previewContractPackageButton, #contractPackageSearchButton, [data-contract-package-load], [data-contract-doc], [data-contract-print]");
  if (!button) return;
  event.preventDefault();
  if (button.dataset.contractPrint) {
    if (renderContractPrintSheet(button.dataset.contractPrint)) window.print();
    return;
  }
  if (button.dataset.contractDoc) {
    contractSelectedDocumentType = button.dataset.contractDoc;
    renderContractPreview();
    return;
  }
  if (button.id === "saveContractOptionsButton") {
    await saveContractOptionsFromForm();
  }
  if (button.id === "createContractPackageButton") {
    await createContractPackageFromForm();
  }
  if (button.id === "previewContractPackageButton") {
    await previewContractPackageFromForm();
  }
  if (button.id === "contractPackageSearchButton") {
    contractPackageSearchKeyword = document.getElementById("contractPackageSearchInput")?.value?.trim() || "";
    await refreshAllContractPackages();
  }
  if (button.dataset.contractPackageLoad) {
    await loadContractPackageToPreview(button.dataset.contractPackageLoad);
  }
}

function onBeforeUnload(event) {
  if (!contractOptionsDirty) return;
  event.preventDefault();
  event.returnValue = "";
}

function onPrintQuoteClick() {
  if (currentProfile?.role === "staff" && !activeQuoteEstimate?.customerQuote) {
    setSaveStatus("고객 견적 계산이 완료된 후 출력해 주세요.");
    return;
  }
  renderCustomerSummaryPrint(activeQuoteEstimate?.customerQuote || buildEstimateSnapshot(calculate()).customerQuote);
  window.print();
}

function onInternalPrintClick(event) {
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
}

async function onSystemActionClick(event) {
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
}

function onCostCategoryClick(event) {
  const button = event.target?.closest?.("[data-system-cost-category]");
  if (!button) return;
  const category = button.dataset.systemCostCategory || "";
  expandedSystemCostCategory = expandedSystemCostCategory === category ? "" : category;
  costItemFilters.subcategory = "";
  renderCostItemTools();
  renderSystemCostRows();
}

function onUserActionClick(event) {
  const button = event.target?.closest?.("[data-user-action]");
  if (!button) return;
  event.preventDefault();
  handleUserAction(button);
}

function onReloadAuditClick(event) {
  const button = event.target?.closest?.("#reloadAuditLogsButton");
  if (!button) return;
  event.preventDefault();
  refreshAuditLogs().catch((error) => {
    console.error("감사 기록 조회 실패", error);
    setAuditLogStatus("감사 기록을 불러오지 못했습니다.", "error");
  });
}

async function onCostItemSubmitClick(event) {
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
}

async function onManagementSubmit(event) {
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
}

function onCostSearchInput(event) {
  if (event.target?.matches?.("#costItemSearch")) updateCostItemFilters();
}

function onCostFilterChange(event) {
  if (event.target?.matches?.("#costItemSubcategoryFilter, #costItemActiveFilter, #costItemStateFilter, #costItemSortFilter")) {
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
}

function onSaveRateDbClick(event) {
  const button = event.target?.closest?.("#saveRateDbButton");
  if (!button) return;
  saveRateSettings();
}

function onCompareCostSnapshotClick(event) {
  const button = event.target?.closest?.("#compareCostSnapshotButton");
  if (!button) return;
  renderCostSnapshotComparison(activeQuoteEstimate);
}

async function onInternalEstimateToggle(event) {
  const button = event.target?.closest?.("[data-toggle-internal-estimate]");
  if (!button || !canViewSystem()) return;
  const estimateId = button.dataset.toggleInternalEstimate;
  if (!estimateId) return;
  const tbody = document.getElementById("savedEstimateRows");
  if (!tbody) return;
  if (expandedAdminEstimateId === estimateId) {
    expandedAdminEstimateId = null;
    expandedAdminTradeKey = null;
    renderSavedEstimateTableRows(tbody, cachedEstimates, {
      admin: isAdmin(),
      canViewInternal: canViewSystem(),
      colspan: 9 + (canViewSystem() ? 1 : 0) + (isAdmin() ? 1 : 0),
    });
    return;
  }
  expandedAdminEstimateId = estimateId;
  expandedAdminTradeKey = null;
  const cached = cachedEstimates.find((estimate) => estimate.id === estimateId);
  if (cached?.internalDetails) adminEstimateDetailCache.set(estimateId, cached);
  renderSavedEstimateTableRows(tbody, cachedEstimates, {
    admin: isAdmin(),
    canViewInternal: canViewSystem(),
    colspan: 9 + (canViewSystem() ? 1 : 0) + (isAdmin() ? 1 : 0),
  });
  if (!adminEstimateDetailCache.has(estimateId)) {
    try {
      const estimate = await getEstimate(estimateId);
      if (estimate) adminEstimateDetailCache.set(estimateId, estimate);
    } catch (error) {
      console.error("내부견적 상세 조회 실패", error);
      alert("내부견적 상세를 불러오지 못했습니다.");
    }
    renderSavedEstimateTableRows(tbody, cachedEstimates, {
      admin: isAdmin(),
      canViewInternal: canViewSystem(),
      colspan: 9 + (canViewSystem() ? 1 : 0) + (isAdmin() ? 1 : 0),
    });
  }
}

function onInternalTradeToggle(event) {
  const button = event.target?.closest?.("[data-toggle-internal-trade]");
  if (!button || !canViewSystem()) return;
  expandedAdminTradeKey = expandedAdminTradeKey === button.dataset.toggleInternalTrade
    ? null
    : button.dataset.toggleInternalTrade;
  const tbody = document.getElementById("savedEstimateRows");
  if (!tbody) return;
  renderSavedEstimateTableRows(tbody, cachedEstimates, {
    admin: isAdmin(),
    canViewInternal: canViewSystem(),
    colspan: 9 + (canViewSystem() ? 1 : 0) + (isAdmin() ? 1 : 0),
  });
}

async function onSavedEstimateAction(event) {
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
      alert(error?.message?.startsWith("프로젝트·") ? error.message : "견적 삭제에 실패했습니다.");
    }
  }
}

function onStaffQuoteAction(event) {
  const button = event.target?.closest?.("#staffOpenClientQuoteButton, #staffPrintClientQuoteButton");
  if (!button) return;
  activateTab("quote");
  if (button.id === "staffPrintClientQuoteButton") {
    renderCustomerSummaryPrint(currentEstimateForPrint()?.customerQuote);
    window.print();
  }
}

function bootstrap() {
  uiShell.bindNavigation(handleTabNavigation);
  repairStaticKoreanLabels();
  guardCheckboxLabelClicks();
  removeDuplicateManagementCriteriaBlock();
  removeLegacyAdminEstimatePanels();
  bindPasswordChangeShell();
  bindApplicationEvents({ document, window, elements: el, actions: {
    onLoginSubmit, onLogoutClick, onProjectSearchInput, onLoadProjectClick, onSaveEstimateClick, onSaveAsNewEstimateClick, onDelegatedSaveClick, onContractOptionsInput, onContractOptionsChange, onContractActionClick, onBeforeUnload, onPrintQuoteClick, onInternalPrintClick, onSystemActionClick, onCostCategoryClick, onUserActionClick, onReloadAuditClick, onCostItemSubmitClick, onManagementSubmit, onCostSearchInput, onCostFilterChange, onSaveRateDbClick, onCompareCostSnapshotClick, onInternalEstimateToggle, onInternalTradeToggle, onSavedEstimateAction, onStaffQuoteAction,
    onPipeCleaningChanged: handleExistingPipeCleaningChanged,
    onEstimateInput: handleBoundEstimateInput,
  } });
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
}

bootstrap();

mountPreliminaryEstimateView({
  document,
  getContext: () => ({
    estimate: activeQuoteEstimate || lastRenderedEstimateSnapshot,
    editingId: currentEditingEstimateId,
    storedSnapshot: Boolean(loadedEstimateBaseline?.estimate &&
      (activeQuoteEstimate || lastRenderedEstimateSnapshot) === loadedEstimateBaseline.estimate),
  }),
  onPrint: onPrintQuoteClick,
});

mountDetailedEstimateView({ document, request: requestProjectFoundation, loadMode: loadProjectFoundationMode,
  getContext: () => ({ estimateId: currentEditingEstimateId }),
});

export {
  CONTRACT_FIXED_TERM_LINES,
  renderContractPrintDocument,
  applyExistingPipeCleaningAdjustment,
  buildEstimateSnapshot,
  calculateForCurrentEstimate,
  enterAuthenticatedApp,
  handleSaveEstimate,
  loadEstimateIntoUi,
};

function currentCalculationCore() {
  return createEstimateCalculation({ rates, flooringSheetGradeOptions, flooringWoodGradeOptions, pipeCleaningAmount: PIPE_CLEANING_AMOUNT });
}
