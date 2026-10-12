import { expect, test } from "vitest";
import { createEstimateCalculation, ESTIMATE_INPUT_SCHEMA } from "../../../public/os-app/src/calculator/estimate-core.js";
import { createEstimateDatabase, mountOs } from "../helpers/os-harness.js";
import { latestEstimate, testProfile } from "../fixtures/estimates.js";

const scenarios = [
  { projectName: "SYNTHETIC_SHARED_DEFAULTS" },
  { projectName: "SYNTHETIC_SHARED_ALL", sectionDemolitionEnabled: true, sectionElectricalEnabled: true,
    sectionBathroomEnabled: true, bathroomEnabled: true, bathroomUnits: "2", bathroomFixtureGrade: "premium",
    sectionWallpaperEnabled: true, wallpaperEnabled: true, wallpaperMaterialEnabled: true,
    wallpaperPublicWallLengthM: "120000", wallpaperRoomWallLengthM: "31000", areaPyeong: "33",
    sectionFilmEnabled: true, filmEnabled: true, filmLengthM: "1700", sectionCarpentryEnabled: true,
    carpentryPartitionEnabled: true, carpentryPartitionM: "3700", sectionFlooringEnabled: true,
    flooringEnabled: true, flooringArea: "31.5", sectionFurnitureEnabled: true, baseEnabled: true,
    lowerCabinetM: "4200", baseCountertopEnabled: true, islandEnabled: true, islandM: "1700",
    existingPipeCleaningEnabled: true, kitchenCustomAppliancePrice: "321000" },
  { projectName: "SYNTHETIC_SHARED_ROUNDING", areaPyeong: "34", sectionFlooringEnabled: true,
    flooringEnabled: true, flooringMaterialType: "sheet", flooringSheetGrade: "t22", flooringArea: "20.25",
    sectionWallpaperEnabled: true, wallpaperEnabled: true, wallpaperPublicMaterialGrade: "besti",
    wallpaperRoomMaterialGrade: "fortis", wallpaperPublicWallLengthM: "28001", wallpaperRoomWallLengthM: "31001" },
];

for (const input of scenarios) {
  test(`shared pure core equals existing browser calculation: ${input.projectName}`, async () => {
    const { main } = await mountOs(createEstimateDatabase(latestEstimate()), testProfile("admin"));
    for (const [id, value] of Object.entries(input)) {
      const element = document.getElementById(id);
      if (!element) continue;
      if (element.type === "checkbox") element.checked = value;
      else element.value = value;
    }
    const inputs = Object.fromEntries(Object.entries(ESTIMATE_INPUT_SCHEMA).map(([id, schema]) => {
      const element = document.getElementById(id);
      return [id, element ? schema.type === "checkbox" ? element.checked : element.value : schema.value];
    }));
    const core = createEstimateCalculation();
    const state = core.readState(inputs);
    expect(core.calculate(state)).toEqual(main.calculateForCurrentEstimate());
  });
}

test("server rate contexts never mutate shared defaults across requests", () => {
  const inputs = { projectName: "SYNTHETIC_ISOLATION", sectionFurnitureEnabled: true, baseEnabled: true,
    lowerCabinetM: "3000", upperCabinetM: "0", tallCabinetM: "0" };
  const standard = createEstimateCalculation();
  const before = standard.calculate(standard.readState(inputs));
  const customized = createEstimateCalculation({ rateValues: { rateLowerPerJa: 12345 } });
  expect(customized.calculate(customized.readState(inputs)).directCost).not.toBe(before.directCost);
  const fresh = createEstimateCalculation();
  expect(fresh.calculate(fresh.readState(inputs))).toEqual(before);
});
