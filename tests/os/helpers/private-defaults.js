import { ESTIMATE_INPUT_SCHEMA } from "../../../app/api/os/_lib/calculation/estimate-inputs.js";
import { readFileSync } from "node:fs";

const historicalControls = JSON.parse(readFileSync(new URL("../fixtures/estimate-view-characterization.json", import.meta.url), "utf8")).cases[0].result.controls;

// Renderer fixtures represent an authenticated privileged session, not public HTML defaults.
export function hydratePrivateTestDefaults(document) {
  for (const [id, field] of Object.entries(ESTIMATE_INPUT_SCHEMA)) {
    const node = document.getElementById(id);
    if (node && (id.startsWith("rate") || ["targetMargin", "manualAdjustment", "baseCorrection", "islandCorrection", "homebarCorrection", "countertopCorrection", "optionCorrection"].includes(id))) {
      node.value = String(field.value ?? "");
      node.defaultValue = node.value;
    }
  }
  for (const control of historicalControls) if (control.id.startsWith("rate")) {
    const node = document.getElementById(control.id);
    if (node) { node.value = control.value; node.defaultValue = control.value; }
  }
}
