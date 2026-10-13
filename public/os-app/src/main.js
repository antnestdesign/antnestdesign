import { COST_ITEM_DEFINITIONS, createEstimateCalculation } from "./calculator/estimate-core.js";
import { won, rateNumber, escapeHtml } from "./utils.js";
import { canonicalInputValues } from "./estimate-input.js";
import { createEstimateRestore } from "./estimate-restore.js";
import { createEstimateView } from "./estimate-view.js";
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

function ensureEstimateStatusControl() { return estimateRestore.ensureEstimateStatusControl(); }

function ensureSaveButtons() { return estimateRestore.ensureSaveButtons(); }

function ensureAdminStandardCheckLists() { return estimateRestore.ensureAdminStandardCheckLists(); }

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

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tab);
    if (button.dataset.tab === "admin") renderSavedEstimateRows();
    if (button.dataset.tab === "system") refreshSystemManagement().catch((error) => console.error("시스템 관리 갱신 실패", error));
  });
});

repairStaticKoreanLabels();
guardCheckboxLabelClicks();
removeDuplicateManagementCriteriaBlock();
removeLegacyAdminEstimatePanels();
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
});

el.projectSearch?.addEventListener("input", () => {
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
});

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

document.getElementById("saveEstimateButton")?.addEventListener("click", () => handleSaveEstimate("update"));
document.getElementById("saveAsNewEstimateButton")?.addEventListener("click", () => handleSaveEstimate("new"));

document.addEventListener("click", (event) => {
  const button = event.target?.closest?.("#saveEstimateButton, #saveAsNewEstimateButton");
  if (!button) return;
  event.preventDefault();
  handleSaveEstimate(button.id === "saveAsNewEstimateButton" ? "new" : "update");
});

document.addEventListener("input", (event) => {
  if (!event.target?.closest?.("#contractOptionsForm")) return;
  contractOptionsDirty = true;
  contractStatus("저장되지 않은 계약 옵션 변경사항이 있습니다.");
});

document.addEventListener("change", (event) => {
  if (!event.target?.closest?.("#contractOptionsForm")) return;
  contractOptionsDirty = true;
  contractStatus("저장되지 않은 계약 옵션 변경사항이 있습니다.");
});

document.addEventListener("click", async (event) => {
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
});

window.addEventListener("beforeunload", (event) => {
  if (!contractOptionsDirty) return;
  event.preventDefault();
  event.returnValue = "";
});

document.getElementById("printQuoteButton")?.addEventListener("click", () => {
  if (currentProfile?.role === "staff" && !activeQuoteEstimate?.customerQuote) {
    setSaveStatus("고객 견적 계산이 완료된 후 출력해 주세요.");
    return;
  }
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
  const button = event.target?.closest?.("[data-system-cost-category]");
  if (!button) return;
  const category = button.dataset.systemCostCategory || "";
  expandedSystemCostCategory = expandedSystemCostCategory === category ? "" : category;
  costItemFilters.subcategory = "";
  renderCostItemTools();
  renderSystemCostRows();
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
});

document.addEventListener("click", (event) => {
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
  if (input.id === "existingPipeCleaningEnabled") {
    input.addEventListener("change", handleExistingPipeCleaningChanged);
    continue;
  }
  input.addEventListener("input", () => {
    normalizeIntegerInput(input, integerIds);
    syncRateDirtyState(input);
    handleEstimateInputChanged();
  });
  input.addEventListener("change", () => {
    normalizeIntegerInput(input, integerIds);
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
