import { isEstimateInputExcluded } from "./estimate-input.js";
import { ESTIMATE_RATE_BINDINGS, buildEstimateRateUpdates } from "./estimate-state.js";

const ESTIMATE_FORM_FIELDS = [
  "sectionDemolitionEnabled",
  "sectionElectricalEnabled",
  "sectionBathroomEnabled",
  "sectionWallpaperEnabled",
  "sectionFilmEnabled",
  "sectionFlooringEnabled",
  "sectionCarpentryEnabled",
  "sectionFurnitureEnabled",
  "sectionFinishEnabled",
  "kitchenCustomAppliancePrice",
  "projectName",
  "areaPyeong",
  "clientName",
  "clientPhone",
  "estimateStatus",
  "targetMargin",
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
  "standardLightingEnabled",
  "standardSwitchEnabled",
  "standardDownlightUnits",
  "standardSquareLightUnits",
  "standardCylinderLightUnits",
  "standardT3M",
  "standardBedWallLightEnabled",
  "tileEnabled",
  "bathroomUnits",
  "tileGroutEnabled",
  "bathroomPlumbingRelocationEnabled",
  "wallpaperPreset",
  "wallpaperBaseCoatEnabled",
  "filmPreset",
  "flooringArea",
  "flooringMaterialType",
  "flooringSheetGrade",
  "flooringWoodGrade",
  "bathroomFixtureGrade",
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
  "baseCorrection",
  "islandCorrection",
  "homebarCorrection",
  "countertopCorrection",
  "optionCorrection",
];
const REQUIRED_VALUE_FIELDS = ["projectName", "clientName", "clientPhone", "baseEpDepth", "islandCountertop", "islandSideFinish", "homebarCountertop", "homebarMidway", "homebarEpDepth", "shoeDepth", "fridgeLaundryDepth", "pantryDepth", "builtInDepth", "hangerDepth", "demolitionFloorMaterial", "electricalAgeType", "wallpaperPreset", "filmPreset", "bathroomFanType", "carpentryCofferType"];

export function readEstimateForm(elements) {
  // Missing required selects retain the old readState TypeError rather than invent defaults.
  for (const id of REQUIRED_VALUE_FIELDS) {
    if (elements[id] == null) throw new TypeError(`Missing estimate form element: ${id}`);
  }
  return {
    values: Object.fromEntries(ESTIMATE_FORM_FIELDS.map((id) => [id, elements[id]?.value])),
    checked: Object.fromEntries(ESTIMATE_FORM_FIELDS.map((id) => [id, elements[id]?.checked])),
  };
}

export function collectEstimateFormValues(elements, excludedInputById) {
  return Object.fromEntries(Object.entries(elements)
    .filter(([id]) => !isEstimateInputExcluded(id, excludedInputById))
    .map(([id, input]) => [id, input?.type === "checkbox" ? Boolean(input.checked) : input?.value ?? ""]));
}

export function syncEstimateFormRates(elements, context) {
  const values = ESTIMATE_RATE_BINDINGS.map(({ inputId }) => elements[inputId]?.value);
  for (const { target, path, value } of buildEstimateRateUpdates(values, context)) {
    if (!path.length) {
      context[target] = value;
    } else {
      const parent = path.slice(0, -1).reduce((object, key) => object[key], context[target]);
      parent[path.at(-1)] = value;
    }
  }
}

export function normalizeIntegerInput(input, integerIds) {
  if (!integerIds.includes(input.id) || input.value === "") return;
  const max = input.max === "" ? Infinity : Number(input.max);
  input.value = String(Math.min(max, Math.max(0, Math.floor(Number(input.value) || 0))));
}
