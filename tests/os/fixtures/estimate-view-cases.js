import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { latestEstimate, pipeCleaningEstimate } from "./estimates.js";

export const estimateViewCases = [
  { name: "customer normal", kind: "customer" },
  { name: "customer single process", kind: "customer", shape: "single" },
  { name: "customer empty groups", kind: "customer", shape: "empty" },
  { name: "customer absent snapshot", kind: "customer", shape: "absent" },
  { name: "customer optional legacy", kind: "customer", shape: "legacy" },
  { name: "customer pipe on", kind: "customer", pipe: true },
  { name: "internal admin closed", kind: "internal", role: "admin" },
  { name: "internal manager open", kind: "internal", role: "manager", expanded: "0" },
  { name: "internal staff safe", kind: "internal", role: "staff", safe: true },
  { name: "internal pipe zero margin", kind: "internal", pipe: true, expanded: "7" },
  { name: "internal legacy pipe gap", kind: "internal", pipe: true, gap: true },
  { name: "internal explicit discount", kind: "internal", discount: true },
  { name: "internal unknown mismatch", kind: "internal", mismatch: true },
  { name: "internal empty", kind: "internal", shape: "empty" },
  { name: "restore normal", kind: "restore" },
  { name: "restore zero false empty", kind: "restore", inputs: { areaPyeong: "0", baseEnabled: false, lowerCabinetM: "", sectionFurnitureEnabled: false, existingPipeCleaningEnabled: false } },
  { name: "restore selected controls", kind: "restore", inputs: { sectionFurnitureEnabled: true, baseEnabled: true, baseCountertop: "ceramic", bathroomFixtureGrade: "economy", existingPipeCleaningEnabled: true } },
  { name: "restore fractional margin", kind: "restore", inputs: { targetMargin: 0.3 } },
  { name: "restore legacy wallpaper", kind: "restore", inputs: { wallpaperMaterialGrade: "fortis", wallpaperWallLengthM: 45678 } },
  { name: "restore absent plumbing", kind: "restore", inputs: { bathroomUnits: 2 } },
  { name: "restore explicit plumbing false", kind: "restore", inputs: { bathroomUnits: 2, bathroomPlumbingRelocationEnabled: false } },
  { name: "restore excluded rate", kind: "restore", inputs: { rateLowerPerJa: "17", unknown: "keep source unchanged" } },
  { name: "restore partial defaults", kind: "restore", inputs: {} },
  { name: "locks editable admin", kind: "locks", allChecked: true },
  { name: "locks sections off", kind: "locks", allChecked: false },
  { name: "locks block off", kind: "locks", allChecked: true, checked: { baseEnabled: false, islandEnabled: false } },
  { name: "locks parent disabled", kind: "locks", allChecked: true, checked: { sectionFurnitureEnabled: false } },
  { name: "locks manager", kind: "locks", role: "manager", allChecked: true },
  { name: "locks staff", kind: "locks", role: "staff", allChecked: true },
  { name: "locks contracted existing policy", kind: "locks", allChecked: true, status: "계약" },
  { name: "print customer normal", kind: "print" },
  { name: "print pipe on", kind: "print", pipe: true },
  { name: "print empty", kind: "print", shape: "empty" },
  { name: "print legacy", kind: "print", shape: "legacy" },
  { name: "live calculated", kind: "live" },
  { name: "live stored snapshot", kind: "live", stored: true, pipe: true },
  { name: "live staff safe", kind: "live", role: "staff", safe: true },
  { name: "setup repeated", kind: "setup" },
  { name: "cost saved info", kind: "cost" },
  { name: "cost changed comparison", kind: "cost", changed: true },
  { name: "cost absent snapshot", kind: "cost", shape: "absent" },
];

export function viewCaseEstimate(entry) {
  const estimate = entry.pipe ? pipeCleaningEstimate() : latestEstimate();
  if (entry.shape === "single") {
    estimate.customerQuote.groups = estimate.customerQuote.groups.slice(0, 1);
    estimate.customerQuote.total = estimate.customerQuote.groups[0].total;
    estimate.customerQuote.totalText = estimate.customerQuote.groups[0].totalText;
  }
  if (entry.shape === "empty") {
    estimate.customerQuote.groups = [];
    estimate.internalDetails = [];
    estimate.total = estimate.costTotal = estimate.customerQuote.total = 0;
    estimate.totalText = estimate.customerQuote.totalText = "0원";
    estimate.internalSummary = { directCost: 0, customerRevenue: 0, profit: 0, marginRate: 0 };
  }
  if (entry.shape === "absent") delete estimate.customerQuote;
  if (entry.shape === "legacy") {
    estimate.customerQuote.groups[0].items = [{ name: "합성 legacy <표시>", amountText: "130,000원" }];
    estimate.internalDetails[0].customerRevenue = "130000";
    delete estimate.internalDetails[0].correction;
    delete estimate.internalSummary;
  }
  if (entry.gap) {
    estimate.costTotal -= 300000;
    estimate.internalSummary.directCost -= 300000;
  }
  if (entry.discount || entry.mismatch) {
    estimate.customerQuote.total -= 10000;
    if (entry.discount) estimate.inputs.manualAdjustment = -10000;
  }
  if (entry.safe) {
    for (const key of ["costTotal", "internalSummary", "internalDetails", "costSnapshot", "marginRate"]) delete estimate[key];
  }
  return estimate;
}

export function createViewCaseDom(entry, ids) {
  const dom = new JSDOM(readFileSync(new URL("../../../public/os-app/index.html", import.meta.url), "utf8"), { url: "https://os.invalid/" });
  const document = dom.window.document;
  const elements = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  for (const input of Object.values(elements)) {
    if (entry.allChecked !== undefined && input?.type === "checkbox") input.checked = entry.allChecked;
  }
  for (const [id, checked] of Object.entries(entry.checked || {})) elements[id].checked = checked;
  if (entry.status && elements.estimateStatus) elements.estimateStatus.value = entry.status;
  if (entry.role === "staff") document.querySelectorAll(".admin-only").forEach((node) => node.remove());
  return { dom, document, elements };
}

const targetIds = [
  "quoteProject", "quoteArea", "quoteDate", "quoteTotal", "quoteRows", "quoteGroupTotals", "adminQuoteRows", "adminQuoteGroupTotals",
  "internalDetailRows", "adminInternalDetailRows", "internalWarnings", "internalCost", "internalRevenue", "internalProfit", "internalMargin",
  "adminInternalCost", "adminInternalRevenue", "adminInternalProfit", "adminInternalMargin", "discountRoom", "marginStatus", "adminDiscountRoom", "adminMarginStatus",
  "printQuoteSheet", "purchaseOrderRows", "purchaseOrderSummary", "adminProcessTotals", "clientTotal", "selectionCount", "cabinetSummary", "islandSummary", "homebarSummary", "shoeSummary", "fridgeLaundrySummary", "pantrySummary", "builtInSummary", "hangerSummary", "demolitionSummary", "electricalSummary", "lightingSummary",
  "standardSelectedItems", "standardUnselectedItems", "standardSeparateItems", "adminStandardSelectedItems", "adminStandardUnselectedItems", "adminStandardSeparateItems",
  "costSnapshotPanel", "costComparisonPanel", "costCompareStatus", "saveEstimateButton", "saveAsNewEstimateButton",
];
export function snapshotView(document, elements, returns = {}) {
  return {
    targets: Object.fromEntries(targetIds.map((id) => {
      const node = document.getElementById(id);
      return [id, node ? { html: node.innerHTML, hidden: node.hidden, disabled: Boolean(node.disabled) } : null];
    })),
    controls: Object.entries(elements).filter(([, input]) => input && "value" in input).map(([id, input]) => ({ id, value: input.value, checked: Boolean(input.checked), disabled: input.disabled, readOnly: Boolean(input.readOnly) })),
    ...returns,
  };
}

export function exerciseViewCase(runtime, entry, estimate, result) {
  const returns = {};
  if (entry.kind === "customer") runtime.renderCustomerQuote(estimate);
  if (entry.kind === "internal") {
    runtime.renderInternalRows(estimate.internalDetails || []);
    runtime.renderStoredInternalSummary(estimate);
    runtime.renderAdminMarginTable(estimate);
    returns.detailPanel = runtime.renderAdminEstimateDetailPanel(estimate);
    runtime.renderWarnings(["합성 정상", "합성 확인 필요"]);
  }
  if (entry.kind === "restore") returns.restore = runtime.restoreInputValues(entry.inputs ?? estimate.inputs);
  if (entry.kind === "locks") {
    runtime.syncSectionLocks(); runtime.syncBlockLocks();
  }
  if (entry.kind === "print") {
    runtime.renderPrintQuote(estimate.customerQuote);
    returns.customerPrint = runtime.document.getElementById("printQuoteSheet").innerHTML;
    runtime.renderAdminDetailPrint(estimate);
    returns.detailPrint = runtime.document.getElementById("printQuoteSheet").innerHTML;
    runtime.renderAdminInternalPrint(estimate);
    returns.internalPrint = runtime.document.getElementById("printQuoteSheet").innerHTML;
    runtime.renderPurchaseOrderPrint(estimate);
  }
  if (entry.kind === "live") {
    if (entry.safe) runtime.displayStaffEstimate(estimate);
    else runtime.render();
    runtime.renderStandardCheck(result.state);
  }
  if (entry.kind === "setup") {
    for (let i = 0; i < 2; i += 1) {
      runtime.ensureEstimateStatusControl(); runtime.ensureSaveButtons(); runtime.ensureAdminStandardCheckLists(); runtime.ensureCostSnapshotPanel();
    }
  }
  if (entry.kind === "cost") {
    runtime.ensureCostSnapshotPanel();
    runtime.renderCostSnapshotInfo(estimate);
    runtime.renderCostSnapshotComparison(estimate);
  }
  return returns;
}
