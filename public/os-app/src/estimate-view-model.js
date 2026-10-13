import { moneyAmount } from "./utils.js";
import { buildAdminMarginGroups, internalDetailCustomerAmount, storedEstimateSummary, buildEstimateDiagnostics } from "./estimate-summary.js";

export function buildInternalRowsModel(details) {
  return details.map((item) => ({ ...item, viewProfit: item.customerRevenue - item.cost }));
}

export function buildStoredInternalSummaryModel(estimate, { markupRate }) {
  if (!estimate) return null;
  const summary = estimate.internalSummary || {};
  const directCost = Number(estimate.costTotal ?? summary.directCost) || 0;
  const customerRevenue = Number(estimate.total ?? summary.customerRevenue) || 0;
  const profit = Number.isFinite(summary.profit) ? summary.profit : customerRevenue - directCost;
  const marginRate = Number.isFinite(summary.marginRate)
    ? summary.marginRate
    : (directCost > 0 ? markupRate(profit, directCost) * 100 : Number(estimate.marginRate) || 0);
  return { directCost, customerRevenue, profit, marginRate };
}

export function buildEstimateInternalViewModel(estimate, options) {
  if (!estimate) return null;
  const summary = storedEstimateSummary(estimate, options);
  const groups = buildAdminMarginGroups(estimate, options).map((group) => ({
    ...group,
    details: group.details.map((detail) => {
      const customer = internalDetailCustomerAmount(detail);
      const cost = moneyAmount(detail.cost);
      const profit = customer - cost;
      return { ...detail, view: { customer, cost, profit, marginRate: options.markupRate(profit, cost) } };
    }),
  }));
  const totalCustomer = groups.reduce((sum, group) => sum + group.customer, 0);
  const totalCost = groups.reduce((sum, group) => sum + group.cost, 0);
  const totalProfit = totalCustomer - totalCost;
  return {
    summary,
    groups,
    diagnostics: options.canViewInternal ? buildEstimateDiagnostics(estimate, summary, options) : [],
    totals: { totalCustomer, totalCost, totalProfit, totalMarginRate: options.markupRate(totalProfit, totalCost) },
  };
}

export function buildCalculatedEstimatePresentation(result, displayEstimate, { groupTotalFromDetails, mmText, customerWon }) {
  const { state, details, quoteLines, directCost, customerRevenue, profit, actualMargin, discountRoom, warnings, counts } = result;
  const displaySummary = displayEstimate.internalSummary || {};
  const displayRevenue = Number(displaySummary.customerRevenue ?? displayEstimate.total ?? customerRevenue) || 0;
  const displayCost = Number(displaySummary.directCost ?? displayEstimate.costTotal ?? directCost) || 0;
  const displayProfit = Number(displaySummary.profit ?? profit) || 0;
  const displayMarginRate = Number(displaySummary.marginRate ?? (actualMargin * 100)) || 0;
  return {
    displayRevenue, displayCost, displayProfit, displayMarginRate, discountRoom,
    marginStatus: warnings.some((item) => item.includes("미달")) ? "미달" : "정상",
    inputSummary: {
      selectionCount: `${quoteLines.length}개 항목`,
      cabinetSummary: state.baseEnabled ? `하부 ${counts.lowerJa}자 / 상부 ${counts.upperJa}자 / 키큰장 ${counts.tallJa}자` : "미선택",
      islandSummary: state.islandEnabled && state.islandM > 0 ? `가로 ${mmText(state.islandM)} / 세로 ${mmText(state.islandDepthMm)}, 서랍 ${state.islandDrawers}개` : "미선택",
      homebarSummary: state.homebarEnabled && state.homebarM > 0 ? `${mmText(state.homebarM)}, 서랍 ${state.homebarDrawers}개` : "미선택",
      shoeSummary: state.shoeEnabled && state.shoeM > 0 ? `${mmText(state.shoeM)} / ${counts.shoeJa}자` : "미선택",
      fridgeLaundrySummary: state.fridgeLaundryEnabled && state.fridgeLaundryM > 0 ? `${mmText(state.fridgeLaundryM)} / ${counts.fridgeLaundryJa}자` : "미선택",
      pantrySummary: state.pantryEnabled && state.pantryM > 0 ? `${mmText(state.pantryM)} / ${counts.pantryJa}자` : "미선택",
      builtInSummary: state.builtInEnabled && state.builtInM > 0 ? `${mmText(state.builtInM)} / ${counts.builtInJa}자` : "미선택",
      hangerSummary: state.hangerEnabled && state.hangerM > 0 ? `${mmText(state.hangerM)} / ${counts.hangerJa}자` : "미선택",
      demolitionSummary: groupTotalFromDetails(details, "demolition") > 0 ? customerWon(groupTotalFromDetails(details, "demolition")) : "미선택",
      electricalSummary: groupTotalFromDetails(details, "electrical") > 0
        ? `${state.electricalEnabled ? (state.electricalAgeType === "under10" ? "10년 이하" : "10년 이상") : "옵션"} / ${customerWon(groupTotalFromDetails(details, "electrical"))}` : "미선택",
      lightingSummary: state.standardLightingEnabled ? customerWon(groupTotalFromDetails(details, "standardLighting")) : "미선택",
    },
  };
}
