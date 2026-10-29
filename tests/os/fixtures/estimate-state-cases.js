import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { ESTIMATE_INPUT_SCHEMA,PRIVATE_ESTIMATE_INPUTS } from "../../../app/api/os/_lib/calculation/estimate-inputs.js";

export const estimateStateCases = [
  { name: "default form" },
  { name: "normal all processes", values: { projectName: "SYNTHETIC PIPELINE", areaPyeong: "33", lowerCabinetM: "4200", wallpaperPublicWallLengthM: "120000", wallpaperRoomWallLengthM: "16000", flooringArea: "31.5", kitchenCustomAppliancePrice: "123456" }, allChecked: true },
  { name: "numeric zero", numeric: "0" },
  { name: "all false", allChecked: false },
  { name: "empty numeric", numeric: "", values: { projectName: "", clientName: "", clientPhone: "" } },
  { name: "null raw values", rawValues: { areaPyeong: null, baseCountertop: null, flooringMaterialType: null, targetMargin: null } },
  { name: "undefined raw values", rawValues: { areaPyeong: undefined, baseEpDepth: undefined, wallpaperPublicMaterialGrade: undefined } },
  { name: "partial optional form", missing: ["areaPyeong", "targetMargin", "baseCountertop", "flooringSheetGrade", "bathroomFixtureGrade", "sectionFinishEnabled"] },
  { name: "missing required select", missing: ["islandCountertop"] },
  { name: "rate override", values: { rateLowerPerJa: "123456.75", rateFlooringSheetT20: "34567.5", rateExistingPipeCleaning: "300123.25" } },
  { name: "rate zero fallback", rateValues: "0" },
  { name: "rate empty fallback", rateValues: "" },
  { name: "rate missing fallback", missingRates: true },
  { name: "rate null undefined", rawValues: { rateLowerPerJa: null, rateUpperPerJa: undefined } },
  { name: "rate repeated retention", steps: [{ rateLowerPerJa: "654321.5", rateFlooringPerPyeong: "175001.5" }, { rateLowerPerJa: "0", rateFlooringPerPyeong: "" }, {}] },
  { name: "legacy restore", restoreInputs: { targetMargin: 0.3, wallpaperMaterialGrade: "fortis", wallpaperWallLengthM: 90000, bathroomUnits: 2 } },
  { name: "pipe on", checked: { sectionFinishEnabled: true, existingPipeCleaningEnabled: true } },
  { name: "pipe off", checked: { sectionFinishEnabled: true, existingPipeCleaningEnabled: false } },
  { name: "excluded rate and legacy extra", values: { rateLowerPerJa: "765432" }, extras: { legacyExtra: { value: "keep", type: "text" }, constructor: { value: "excluded", type: "text" } } },
  { name: "repeated read", steps: [{}, {}, {}] },
  { name: "loaded estimate context", loaded: true, values: { projectName: "SYNTHETIC LOADED", areaPyeong: "34" } },
  { name: "no loaded estimate context", loaded: false, values: { projectName: "SYNTHETIC LOADED", areaPyeong: "34" } },
  { name: "sections gated", allChecked: true, checked: { sectionDemolitionEnabled: false, sectionElectricalEnabled: false, sectionBathroomEnabled: false, sectionFurnitureEnabled: false, sectionFinishEnabled: false } },
  { name: "fractional negative and defaults", values: { bathroomUnits: "2.9", islandSideFinishCount: "8.7", baseLightingUnits: "-1.5", manualAdjustment: "-123.45", targetMargin: "0.3", baseCorrection: "1.25", carpentryCeilingHeight: "0", kitchenCustomAppliancePrice: "0.5" } },
];

export function createCaseElements(entry, ids) {
  const dom = new JSDOM(readFileSync(new URL("../../../public/os-app/index.html", import.meta.url), "utf8"));
  const elements = Object.fromEntries(ids.map((id) => [id, dom.window.document.getElementById(id)]));
  // These privileged characterization fixtures model defaults delivered after authorization.
  for(const id of PRIVATE_ESTIMATE_INPUTS)if(elements[id])elements[id].value=ESTIMATE_INPUT_SCHEMA[id].value;
  for (const [id, input] of Object.entries(elements)) {
    if (!input) continue;
    if (entry.allChecked !== undefined && input.type === "checkbox") input.checked = entry.allChecked;
    if (entry.numeric !== undefined && input.type === "number" && !id.startsWith("rate")) input.value = entry.numeric;
    if (entry.rateValues !== undefined && id.startsWith("rate")) input.value = entry.rateValues;
    if (entry.missingRates && id.startsWith("rate")) elements[id] = null;
  }
  setElementValues(elements, entry.values || {});
  for (const [id, checked] of Object.entries(entry.checked || {})) elements[id].checked = checked;
  for (const [id, value] of Object.entries(entry.rawValues || {})) {
    elements[id] = { value, checked: elements[id]?.checked, type: elements[id]?.type };
  }
  for (const id of entry.missing || []) elements[id] = null;
  Object.assign(elements, entry.extras || {});
  return { dom, elements };
}

export function setElementValues(elements, values) {
  for (const [id, value] of Object.entries(values)) elements[id].value = value;
}

export function encodeStateValue(value) {
  if (value === undefined) return { __phase3c: "undefined" };
  if (Array.isArray(value)) return value.map(encodeStateValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeStateValue(item)]));
  return value;
}

export function decodeStateValue(value) {
  if (value?.__phase3c === "undefined") return undefined;
  if (Array.isArray(value)) return value.map(decodeStateValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decodeStateValue(item)]));
  return value;
}
