export const ESTIMATE_INPUT_SCHEMA = {
  "estimateStatus": { "type": "select", "value": "견적", "choices": ["견적","계약","착공","준공"] },
  "projectName": {
    "type": "text",
    "value": ""
  },
  "areaPyeong": {
    "type": "number",
    "value": "34",
    "min": 10,
    "max": 80
  },
  "clientName": {
    "type": "text",
    "value": ""
  },
  "clientPhone": {
    "type": "tel",
    "value": ""
  },
  "sectionDemolitionEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionElectricalEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionBathroomEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionWallpaperEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionFilmEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionFlooringEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionCarpentryEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionFurnitureEnabled": {
    "type": "checkbox",
    "value": false
  },
  "sectionFinishEnabled": {
    "type": "checkbox",
    "value": false
  },
  "baseEnabled": {
    "type": "checkbox",
    "value": false
  },
  "lowerCabinetM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "upperCabinetM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "tallCabinetM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "riceCabinetUnits": {
    "type": "select-one",
    "value": "0",
    "choices": [
      "0",
      "1",
      "2"
    ]
  },
  "baseEndPanels": {
    "type": "select-one",
    "value": "0",
    "choices": [
      "0",
      "1",
      "2",
      "3"
    ]
  },
  "baseEpDepth": {
    "type": "select-one",
    "value": "deep",
    "choices": [
      "deep",
      "shallow"
    ]
  },
  "baseCountertopEnabled": {
    "type": "checkbox",
    "value": false
  },
  "baseCountertop": {
    "type": "select-one",
    "value": "himacs",
    "choices": [
      "himacs",
      "khanstone",
      "ceramic",
      "epPanel"
    ]
  },
  "baseLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "baseT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "islandEnabled": {
    "type": "checkbox",
    "value": false
  },
  "islandM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "islandDepthMm": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "islandCountertop": {
    "type": "select-one",
    "value": "himacs",
    "choices": [
      "himacs",
      "khanstone",
      "ceramic",
      "epPanel"
    ]
  },
  "islandSideFinish": {
    "type": "select-one",
    "value": "epPanel",
    "choices": [
      "epPanel",
      "himacs",
      "khanstone",
      "ceramic"
    ]
  },
  "islandSideFinishCount": {
    "type": "number",
    "value": "0",
    "min": 0,
    "max": 2
  },
  "islandDrawers": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "islandRiceCabinetEnabled": {
    "type": "checkbox",
    "value": false
  },
  "islandBachmannOutletEnabled": {
    "type": "checkbox",
    "value": false
  },
  "islandLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "islandT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "homebarEnabled": {
    "type": "checkbox",
    "value": false
  },
  "homebarM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "homebarCountertop": {
    "type": "select-one",
    "value": "himacs",
    "choices": [
      "himacs",
      "khanstone",
      "ceramic",
      "epPanel"
    ]
  },
  "homebarMidway": {
    "type": "select-one",
    "value": "epPanel",
    "choices": [
      "none",
      "epPanel",
      "himacs",
      "khanstone",
      "ceramic"
    ]
  },
  "homebarDrawers": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "homebarEndPanels": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "homebarEpDepth": {
    "type": "select-one",
    "value": "deep",
    "choices": [
      "deep",
      "shallow"
    ]
  },
  "homebarLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "homebarT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "shoeEnabled": {
    "type": "checkbox",
    "value": false
  },
  "shoeM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "shoeDepth": {
    "type": "select-one",
    "value": "shallow",
    "choices": [
      "shallow",
      "deep"
    ]
  },
  "shoeEndPanels": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "shoeLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "shoeT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "fridgeLaundryEnabled": {
    "type": "checkbox",
    "value": false
  },
  "fridgeLaundryM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "fridgeLaundryDepth": {
    "type": "select-one",
    "value": "deep",
    "choices": [
      "deep",
      "shallow"
    ]
  },
  "fridgeLaundryEndPanels": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "fridgeLaundryLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "fridgeLaundryT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "pantryEnabled": {
    "type": "checkbox",
    "value": false
  },
  "pantryM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "pantryDepth": {
    "type": "select-one",
    "value": "shallow",
    "choices": [
      "shallow",
      "deep"
    ]
  },
  "pantryEndPanels": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "pantryDrawerUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "builtInEnabled": {
    "type": "checkbox",
    "value": false
  },
  "builtInM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "builtInDepth": {
    "type": "select-one",
    "value": "deep",
    "choices": [
      "deep",
      "shallow"
    ]
  },
  "builtInEndPanels": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "builtInLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "builtInT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "hangerEnabled": {
    "type": "checkbox",
    "value": false
  },
  "hangerM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "hangerDepth": {
    "type": "select-one",
    "value": "deep",
    "choices": [
      "deep",
      "shallow"
    ]
  },
  "hangerLightingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "hangerT3Units": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "demolitionFloorEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionFloorMaterial": {
    "type": "select-one",
    "value": "wood",
    "choices": [
      "wood",
      "vinyl",
      "decoTile"
    ]
  },
  "demolitionFurnitureEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionFurnitureM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "demolitionBathroomEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionBathroomUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "demolitionCeilingEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionElevatorProtectEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionElevatorProtectRemovalEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionPermitEnabled": {
    "type": "checkbox",
    "value": false
  },
  "demolitionConsentEnabled": {
    "type": "checkbox",
    "value": false
  },
  "electricalEnabled": {
    "type": "checkbox",
    "value": false
  },
  "electricalAgeType": {
    "type": "select-one",
    "value": "under10",
    "choices": [
      "under10",
      "over10"
    ]
  },
  "standardSwitchEnabled": {
    "type": "checkbox",
    "value": false
  },
  "standardLightingEnabled": {
    "type": "checkbox",
    "value": false
  },
  "standardDownlightUnits": {
    "type": "number",
    "value": "65",
    "min": 0
  },
  "standardSquareLightUnits": {
    "type": "number",
    "value": "8",
    "min": 0
  },
  "standardCylinderLightUnits": {
    "type": "number",
    "value": "4",
    "min": 0
  },
  "standardT3M": {
    "type": "number",
    "value": "20",
    "min": 0
  },
  "standardBedWallLightEnabled": {
    "type": "checkbox",
    "value": false
  },
  "tileEnabled": {
    "type": "checkbox",
    "value": false
  },
  "tileGroutEnabled": {
    "type": "checkbox",
    "value": false
  },
  "wallpaperPreset": {
    "type": "select-one",
    "value": "p20",
    "choices": [
      "p20",
      "p30",
      "p40",
      "p50"
    ]
  },
  "wallpaperBaseCoatEnabled": {
    "type": "checkbox",
    "value": false
  },
  "filmPreset": {
    "type": "select-one",
    "value": "p20",
    "choices": [
      "p20",
      "p30",
      "p40",
      "p50"
    ]
  },
  "flooringArea": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "flooringMaterialType": {
    "type": "select-one",
    "value": "wood",
    "choices": [
      "wood",
      "sheet"
    ]
  },
  "flooringSheetGrade": {
    "type": "select-one",
    "value": "t18",
    "choices": [
      "t18",
      "t20",
      "t22",
      "t32",
      "t45",
      "t50"
    ]
  },
  "flooringWoodGrade": {
    "type": "select-one",
    "value": "editone",
    "choices": [
      "editone",
      "standard"
    ]
  },
  "bathroomPlumbingRelocationEnabled": {
    "type": "checkbox",
    "value": true
  },
  "bathroomFixtureGrade": {
    "type": "select-one",
    "value": "standard",
    "choices": [
      "value",
      "standard",
      "premium"
    ]
  },
  "bathroomUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "bathroomFanType": {
    "type": "select-one",
    "value": "normal",
    "choices": [
      "normal",
      "hugent"
    ]
  },
  "bathroomBathtubUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "bathroomGlassBoothUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "bathroomGlassPartitionUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "bathroomMasonryWallUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "kitchenEnabled": {
    "type": "checkbox",
    "value": false
  },
  "kitchenSinkBowlUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "kitchenFaucetUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "kitchenHoodUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "kitchenCustomAppliancePrice": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "kitchenStandardInstallEnabled": {
    "type": "checkbox",
    "value": false
  },
  "middleDoorUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "standardDoorUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "slidingDoorUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "windowNoticeEnabled": {
    "type": "checkbox",
    "value": false
  },
  "wallpaperPublicMaterialGrade": {
    "type": "select-one",
    "value": "diamant",
    "choices": [
      "besti",
      "diamant",
      "fortis"
    ]
  },
  "wallpaperPublicWallLengthM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "wallpaperRoomMaterialGrade": {
    "type": "select-one",
    "value": "besti",
    "choices": [
      "besti",
      "diamant",
      "fortis"
    ]
  },
  "wallpaperRoomWallLengthM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "filmMaterialLengthM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "generalWasteEnabled": {
    "type": "checkbox",
    "value": false
  },
  "interiorProtectionEnabled": {
    "type": "checkbox",
    "value": false
  },
  "moveInCleaningEnabled": {
    "type": "checkbox",
    "value": false
  },
  "existingPipeCleaningEnabled": {
    "type": "checkbox",
    "value": false
  },
  "siliconeEnabled": {
    "type": "checkbox",
    "value": false
  },
  "elasticEnabled": {
    "type": "checkbox",
    "value": false
  },
  "elasticExtraRooms": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryCurtainBoxUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryCofferType": {
    "type": "select-one",
    "value": "none",
    "choices": [
      "none",
      "new",
      "change"
    ]
  },
  "carpentryArtwallM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryPartitionM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryHiddenDoorUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryLineLightM": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryIndirectLightUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryCeilingFanUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryDropCeilingUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "carpentryMoldingEnabled": {
    "type": "checkbox",
    "value": false
  },
  "carpentryBaseboardEnabled": {
    "type": "checkbox",
    "value": false
  },
  "carpentryCeilingHeight": {
    "type": "number",
    "value": "2400",
    "min": 0
  },
  "carpentryTvUnits": {
    "type": "number",
    "value": "0",
    "min": 0
  },
  "manualAdjustment": {
    "type": "number",
    "value": "0"
  },
  "targetMargin": {
    "type": "number",
    "value": "30",
    "min": 5,
    "max": 60
  },
  "baseCorrection": {
    "type": "number",
    "value": "0",
    "min": -20,
    "max": 50
  },
  "islandCorrection": {
    "type": "number",
    "value": "0",
    "min": -20,
    "max": 50
  },
  "homebarCorrection": {
    "type": "number",
    "value": "0",
    "min": -20,
    "max": 50
  },
  "countertopCorrection": {
    "type": "number",
    "value": "0",
    "min": -20,
    "max": 50
  },
  "optionCorrection": {
    "type": "number",
    "value": "0",
    "min": -20,
    "max": 50
  }
};
export const PRIVATE_ESTIMATE_INPUTS = ["targetMargin","manualAdjustment","baseCorrection","islandCorrection","homebarCorrection","countertopCorrection","optionCorrection"];

export function staffEstimateInputs(inputs = {}) {
  return Object.fromEntries(Object.keys(ESTIMATE_INPUT_SCHEMA)
    .filter((id) => !PRIVATE_ESTIMATE_INPUTS.includes(id) && Object.hasOwn(inputs, id))
    .map((id) => [id, inputs[id]]));
}
