import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { storedEstimateInputValue, displayEstimateInputValue } from "../../../public/os-app/src/estimate-length.js";
import { readEstimateForm, collectEstimateFormValues } from "../../../public/os-app/src/estimate-form.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { createEstimateCalculation } from "../../../app/api/os/_lib/calculation/calculator/estimate-core.js";
const html = readFileSync("public/os-app/index.html", "utf8");
const setup = () => { document.body.innerHTML = html; return Object.fromEntries([...document.querySelectorAll("[id]")].map(e => [e.id, e])); };
test.each([["20000", "20"], ["30000", "30"], ["21500", "21.5"], ["1", "0.001"], ["0", "0"], ["", ""]])("mm %s stores historical metres %s without precision loss", (mm, metres) => {
  const e = setup(); e.carpentryMoldingLengthM.value = mm;
  expect(storedEstimateInputValue(e.carpentryMoldingLengthM)).toBe(metres);
  expect(displayEstimateInputValue(e.carpentryMoldingLengthM, metres)).toBe(mm);
});
test("all preliminary length controls show mm; already-mm values are never divided twice", () => {
  const e = setup();
  const labels = [...document.querySelectorAll('#client label')].filter(l => l.textContent.includes("길이"));
  expect(labels.length).toBeGreaterThan(10);
  for (const label of labels) expect(label.textContent).toContain("mm");
  e.demolitionFurnitureM.value = "3100"; expect(storedEstimateInputValue(e.demolitionFurnitureM)).toBe("3100");
});
test("20000mm molding plus 30000mm baseboard retains material cost 99000 and original labor", () => {
  const e = setup(); e.sectionCarpentryEnabled.checked = true; e.carpentryMoldingEnabled.checked = true; e.carpentryBaseboardEnabled.checked = true;
  e.carpentryMoldingLengthM.value = "20000"; e.carpentryBaseboardLengthM.value = "30000";
  const inputs = collectEstimateFormValues(e, {}); expect(inputs.carpentryMoldingLengthM).toBe("20"); expect(inputs.carpentryBaseboardLengthM).toBe("30");
  const core = createEstimateCalculation(), r = core.calculate(core.readState(inputs));
  const material = r.details.filter(d => /^(천장몰딩|걸레받이) 자재$/.test(d.item));
  expect(material.reduce((n,d) => n+d.cost, 0)).toBe(99000);
  const restore = createEstimateRestore({ document, elements: e, excludedInputById: {} });
  restore.restoreInputValues(inputs);
  expect(e.carpentryMoldingLengthM.value).toBe("20000"); expect(e.carpentryBaseboardLengthM.value).toBe("30000");
  expect(collectEstimateFormValues(e, {})).toEqual(inputs);
});
test("legacy T3 20m reopens as 20000mm and still calculates exactly 20m", () => {
  const e = setup(), restore = createEstimateRestore({ document, elements: e, excludedInputById: {} });
  restore.restoreInputValues({ sectionElectricalEnabled: true, standardLightingEnabled: true, standardT3M: "20" });
  expect(e.standardT3M.value).toBe("20000"); expect(readEstimateForm(e).values.standardT3M).toBe("20");
  const input = collectEstimateFormValues(e, {}), core = createEstimateCalculation(), result = core.calculate(core.readState(input));
  const line = result.details.find(d => d.item === "AND표준 조명 간접조명(T3)");
  expect(line.quantity).toBe("20m"); expect(line.cost).toBe(200000);
});
