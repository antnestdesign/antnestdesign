import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "espree";
import { JSDOM } from "jsdom";
import * as utils from "../../../public/os-app/src/utils.js";
import * as contractModels from "../../../public/os-app/src/contract-view-model.js";
import * as costModels from "../../../public/os-app/src/cost-view-model.js";
import { createContractView } from "../../../public/os-app/src/contract-view.js";
import { createContractPrint, CONTRACT_FIXED_TERM_LINES } from "../../../public/os-app/src/contract-print.js";
import { createCostView } from "../../../public/os-app/src/cost-view.js";
import { contractFixture, costFixture } from "../fixtures/contract-cost-view-cases.js";

export const contractCostGolden = JSON.parse(readFileSync(new URL("../fixtures/contract-cost-view-characterization.json", import.meta.url), "utf8"));
const source = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
export function currentFunctionSource(name) {
  const node = ast.body.find((node) => node.type === "FunctionDeclaration" && node.id.name === name);
  if (!node) return null;
  return source.slice(...node.range).replaceAll("\r\n", "\n");
}

export function createContractCostRuntime(kind, entry, original = false) {
  const dom = new JSDOM(readFileSync(new URL("../../../public/os-app/index.html", import.meta.url), "utf8"));
  const document = dom.window.document;
  const fixture = kind === "contract" ? contractFixture(entry, CONTRACT_FIXED_TERM_LINES) : costFixture(entry);
  const role = entry.role || "admin";
  const context = vm.createContext({
    ...utils, ...contractModels, ...costModels, createContractView, createContractPrint, createCostView, document, Date,
    canViewContractPackage: () => true, canEditContractPackageOptions: () => role !== "manager", canCreateContractPackage: () => role === "admin", isStaff: () => role === "staff",
    canViewSystem: () => role !== "staff", canEditCost: () => role === "admin", canPublishCost: () => role === "admin",
    contractOptionsState: fixture.options, contractPreviewState: fixture.preview, contractPackagesState: fixture.packages || [], allContractPackagesState: fixture.packages || [], contractSelectedDocumentType: fixture.selectedType || "CONTRACT", selectedContractEstimate: () => fixture.estimate,
    issuedContractEstimate: null, issuedContractMode: "OFF",
    originalCostItems: new Map((fixture.rows || []).map((row) => [row.item_code, row])), costItemFilters: fixture.filters,
    expandedSystemCostCategory: fixture.expanded, costItemEditorMode: fixture.mode, costItemEditorSourceCode: fixture.source, costItemActionBusy: Boolean(entry.busy),
    systemCostHistory: fixture.history || [], systemPublishLogs: fixture.logs || [], systemEstimateCount: 4,
    costManagementDefaults: { defaultMarginRate: 0.3 },
    activateTab() {}, refreshSystemManagement: async () => {}, renderSystemManagement() {}, alert() {},
  });
  const names = [...contractCostGolden.contract, ...contractCostGolden.cost, "formatDateTime", "setText"];
  let script;
  if (original) script = Object.values(contractCostGolden.sources).join("\n");
  else script = [...names, "currentContractViewModel", "currentContractView", "currentCostViewModel", "currentCostView"].map(currentFunctionSource).filter(Boolean).join("\n")
    + "\nconst contractPrint = createContractPrint({ document, formatDateTime });";
  const exposed = names.filter((name) => original || currentFunctionSource(name));
  vm.runInContext(script + "\nglobalThis.runtime = {" + (original ? "" : "...contractPrint, ...(costItemFilters ? currentCostViewModel() : {}),") + exposed.join(",") + "};", context);
  return { dom, document, context, runtime: context.runtime, fixture };
}

export function exerciseContractCost(evidence, kind, entry) {
  const { runtime, document, context, fixture: fixture } = evidence;
  const returns = {};
  if (kind === "contract") {
    runtime.renderContractPackagePanel(fixture.estimate);
    returns.contract = runtime.renderContractPrintDocument(fixture.preview?.snapshot || {}, fixture.preview?.documents || []);
    returns.quote = runtime.renderContractQuotePrint(fixture.preview?.snapshot || {});
    returns.spec = runtime.renderContractSpecPrint(fixture.preview?.snapshot || {});
    returns.sheet = runtime.renderContractPrintSheet("ALL");
  } else {
    runtime.ensureSystemManagementShell();
    runtime.renderSystemStatus(); runtime.renderBulkMarginPanel(); runtime.renderCostItemTools(); runtime.renderCostItemEditor(); runtime.renderSystemCostRows(); runtime.renderCategoryCancelPanel(); runtime.renderSystemDraftRows(); runtime.renderSystemHistoryRows(); runtime.renderSystemPublishLogRows(); runtime.renderRollbackPanel(entry.version || "");
    returns.filtered = runtime.systemCostRowsForAccordion().map((row) => row.item_code);
    returns.expanded = context.expandedSystemCostCategory;
  }
  const ids = kind === "contract" ? ["contractPackagePanel", "printQuoteSheet"] : ["system"];
  returns.dom = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)?.innerHTML ?? null]));
  returns.controls = [...document.querySelectorAll(kind === "contract" ? "#contractPackagePanel input, #contractPackagePanel button, #contractPackagePanel select" : "#system input, #system button, #system select")].map((node) => ({ id: node.id, value: node.value, checked: Boolean(node.checked), disabled: node.disabled, hidden: node.hidden, readOnly: Boolean(node.readOnly) }));
  return returns;
}
