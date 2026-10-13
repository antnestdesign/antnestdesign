import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse } from "espree";
import { createEstimateCalculation } from "../../../public/os-app/src/calculator/estimate-core.js";
import * as utils from "../../../public/os-app/src/utils.js";
import * as summary from "../../../public/os-app/src/estimate-summary.js";
import * as input from "../../../public/os-app/src/estimate-input.js";
import * as models from "../../../public/os-app/src/estimate-view-model.js";
import { createEstimateRestore } from "../../../public/os-app/src/estimate-restore.js";
import { createEstimateView } from "../../../public/os-app/src/estimate-view.js";
import { createEstimatePrint } from "../../../public/os-app/src/estimate-print.js";
import { purchaseOrderItems } from "../../../public/os-app/src/purchase-order.js";
import { costSnapshotMap } from "../../../public/os-app/src/cost-snapshot.js";
import { createViewCaseDom, viewCaseEstimate } from "../fixtures/estimate-view-cases.js";

export const viewGolden = JSON.parse(readFileSync(new URL("../fixtures/estimate-view-characterization.json", import.meta.url), "utf8"));
const inputGolden = JSON.parse(readFileSync(new URL("../fixtures/estimate-state-characterization.json", import.meta.url), "utf8"));
const source = readFileSync(new URL("../../../public/os-app/src/main.js", import.meta.url), "utf8");
const ast = parse(source, { ecmaVersion: "latest", sourceType: "module", range: true });
const core = createEstimateCalculation();

export function createViewRuntime(entry, original = false) {
  const { dom, document, elements } = createViewCaseDom(entry, viewGolden.config.ids);
  const estimate = viewCaseEstimate(entry);
  const state = structuredClone(inputGolden.cases.find((item) => item.name === "normal all processes").reads[0].state);
  const result = core.calculate(state);
  const currentItems = [{ itemCode: "DEMO_CABINET_PER_JA", itemName: "합성 원가", costPrice: entry.changed ? 35000 : 25000, defaultMarginRate: 0.3, updatedAt: "2026-01-02T00:00:00.000Z" }];
  const excluded = { rateLowerPerJa: true };
  const formatDateTime = (value) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const context = vm.createContext({
    ...utils, ...summary, ...input, ...core, ...models, purchaseOrderItems, costSnapshotMap,
    document, el: elements, COST_ITEM_BY_INPUT: excluded,
    PIPE_CLEANING_ITEM_NAME: "기존 배관 청소", PIPE_CLEANING_AMOUNT: 300000,
    isAdmin: () => !entry.role || entry.role === "admin", canViewSystem: () => entry.role !== "staff",
    expandedAdminTradeKey: entry.expanded ?? null,
    originalCostItems: new Map(currentItems.map((item) => [item.itemCode, item])), currentCostItems: () => currentItems,
    latestDate: (dates) => dates.filter(Boolean).sort().at(-1) || null,
    currentEstimateForPrint: () => estimate,
    currentProfile: { role: entry.role || "admin" },
    calculateForCurrentEstimate: () => result, calculate: () => result, syncLoadedEstimateSnapshot: () => Boolean(entry.stored),
    buildEstimateSnapshot: () => estimate, activeQuoteEstimate: estimate, lastRenderedEstimateSnapshot: null, readState: () => result.state,
    estimateRestore: createEstimateRestore({ document, elements, excludedInputById: excluded }),
    estimateView: createEstimateView({ document, customerWon: core.customerWon, formatDateTime, ...viewGolden.config }),
    estimatePrint: createEstimatePrint({ document, customerWon: core.customerWon, formatDateTime, ...viewGolden.config }),
  });
  const selected = Object.keys(viewGolden.sources).filter((name) => {
    if (original) return true;
    return ast.body.some((node) => node.id?.name === name || node.declarations?.some((item) => item.id.name === name));
  });
  if (!original) selected.push("estimateInternalViewModel");
  const script = selected.map((name) => {
    if (original) return viewGolden.sources[name];
    const node = ast.body.find((node) => node.id?.name === name || node.declarations?.some((item) => item.id.name === name));
    return source.slice(...node.range);
  }).join("\n");
  vm.runInContext(script + "\nglobalThis.runtime = { document, " + selected.filter((name) => !["ids", "quoteGroupLabels", "quoteGroupOrder", "printGroupLabels"].includes(name)).join(",") + " };", context);
  return { dom, document, elements, estimate, result, runtime: context.runtime, context };
}
