import { moneyAmount, won } from "./utils.js";
const floorThousand = value => Math.floor(value / 1000) * 1000;
const customerWon = value => `${floorThousand(value).toLocaleString("ko-KR")}원`;
const markupRate = (profit,cost) => cost>0?profit/cost:0;

export function buildAdminMarginGroups(estimate, { groupLabels, groupOrder }) {
  if (!estimate) return [];
  const details = estimate.internalDetails || [];
  const groups = new Map();
  const ensureGroup = (label) => {
    if (!groups.has(label)) groups.set(label, { label, cost: 0, customer: 0, count: 0, details: [] });
    return groups.get(label);
  };

  for (const detail of details) {
    const label = groupLabels[detail.group] || detail.group || "기타";
    const group = ensureGroup(label);
    group.cost += moneyAmount(detail.cost);
    group.customer += internalDetailCustomerAmount(detail);
    group.count += 1;
    group.details.push(detail);
  }

  const orderedLabels = [
    ...groupOrder,
    ...[...groups.keys()].filter((label) => !groupOrder.includes(label)),
  ];
  return orderedLabels
    .map((label) => groups.get(label))
    .filter((group) => group && (Math.abs(group.customer) >= 1 || Math.abs(group.cost) >= 1))
    .map((group) => {
      const profit = group.customer - group.cost;
      const marginRate = markupRate(profit, group.cost);
      return { ...group, profit, marginRate };
    });
}

export function internalDetailCustomerAmount(detail) {
  return moneyAmount(Number.isFinite(detail?.customerRevenue)
    ? detail.customerRevenue
    : floorThousand(Number(detail?.revenue) || 0));
}

export function storedEstimateSummary(estimate, options) {
  const customerTotal = moneyAmount(estimate?.customerQuote?.total ?? estimate?.total ?? estimate?.internalSummary?.customerRevenue);
  const directCost = moneyAmount(estimate?.costTotal ?? estimate?.internalSummary?.directCost);
  const profit = customerTotal - directCost;
  const marginRate = markupRate(profit, directCost);
  const details = Array.isArray(estimate?.internalDetails) ? estimate.internalDetails : [];
  const groups = buildAdminMarginGroups(estimate, options);
  const detailCustomerTotal = groups.reduce((sum, group) => sum + moneyAmount(group.customer), 0);
  const detailCostTotal = groups.reduce((sum, group) => sum + moneyAmount(group.cost), 0);
  return {
    customerTotal,
    directCost,
    profit,
    marginRate,
    detailCount: details.length,
    detailCustomerTotal,
    detailCostTotal,
    customerDiff: detailCustomerTotal - customerTotal,
    costDiff: detailCostTotal - directCost,
  };
}

export function hasPipeCleaningLegacyCostGap(estimate, summary, { pipeCleaningItemName, pipeCleaningAmount }) {
  const pipeRows = (estimate?.internalDetails || []).filter((detail) => detail.item === pipeCleaningItemName);
  return pipeRows.some((detail) => (
    moneyAmount(detail.cost) === pipeCleaningAmount
    && internalDetailCustomerAmount(detail) === pipeCleaningAmount
  ))
    && summary.customerDiff === 0
    && summary.costDiff === pipeCleaningAmount;
}

export function adjustmentEvidence(estimate) {
  const adjustment = moneyAmount(estimate?.inputs?.manualAdjustment ?? estimate?.manualAdjustment);
  if (adjustment !== 0) {
    return { label: adjustment < 0 ? "할인" : "총액 조정", amount: Math.abs(adjustment) };
  }
  const quoteGroups = Array.isArray(estimate?.customerQuote?.groups) ? estimate.customerQuote.groups : [];
  const adjustmentItem = quoteGroups
    .flatMap((group) => Array.isArray(group.items) ? group.items : [])
    .find((item) => /상담 보정|수동 보정|총액 조정|할인|절사/.test(item.name || ""));
  if (adjustmentItem) {
    return { label: adjustmentItem.name || "총액 조정", amount: Math.abs(moneyAmount(adjustmentItem.amount)) };
  }
  return null;
}

export function findMatchingCostDetail(estimate, amount) {
  return (estimate?.internalDetails || []).find((detail) => moneyAmount(detail.cost) === Math.abs(amount));
}

export function buildEstimateDiagnostics(estimate, summary, options) {
  const diagnostics = [];
  if (hasPipeCleaningLegacyCostGap(estimate, summary, options)) {
    diagnostics.push({
      title: "구버전 견적 원가 누락",
      causeLabel: "원인",
      cause: "기존 배관 청소 직접원가 300,000원이 상세견적에는 포함됐지만, 저장된 전체 직접원가에는 반영되지 않았습니다.",
      impact: "예상 이익이 300,000원 높게 표시되고 전체 마진율이 실제보다 높게 표시됩니다.",
      action: "계약 전 테스트 견적이면 현재 기준으로 다시 계산해 저장하세요. 계약 완료 견적이면 자동 수정하지 말고 관리자 검토가 필요합니다.",
    });
  }

  if (summary.customerDiff !== 0) {
    const evidence = adjustmentEvidence(estimate);
    if (evidence) {
      diagnostics.push({
        title: "고객 견적 총액 조정",
        causeLabel: "원인",
        cause: `상세견적 합계에서 ${customerWon(Math.abs(summary.customerDiff))} ${evidence.label}이 적용되었습니다.`,
        impact: `상세 항목 합계와 최종 고객 견적 총액이 ${customerWon(Math.abs(summary.customerDiff))} 다릅니다.`,
        action: "의도된 조정이면 총액 조정 내역으로 관리하세요.",
      });
    } else {
      diagnostics.push({
        title: "고객가 저장값 불일치",
        causeLabel: "추정 원인",
        cause: "과거 견적의 총액 절사, 수동 조정 또는 구버전 저장 방식으로 인해 상세 고객가 합계와 저장된 고객 견적 총액이 다를 수 있습니다.",
        impact: `차액: ${customerWon(summary.customerDiff)}`,
        action: "상세 고객가 합계, 저장된 customerQuote.total, 계약 패키지 총액, 계약 문서 총액을 확인하세요.",
      });
    }
  }

  if (summary.costDiff !== 0 && !hasPipeCleaningLegacyCostGap(estimate, summary, options)) {
    const matched = findMatchingCostDetail(estimate, summary.costDiff);
    diagnostics.push({
      title: "직접원가 저장값 불일치",
      causeLabel: matched ? "추정 원인" : "추정 원인",
      cause: matched
        ? `${matched.item || "일부 상세 항목"} ${won(moneyAmount(matched.cost))}이 전체 costTotal에 반영되지 않았을 가능성이 있습니다.`
        : "일부 상세 항목의 원가가 전체 costTotal에 반영되지 않았거나, 과거 저장 구조에서 합계 필드가 갱신되지 않았을 가능성이 있습니다.",
      impact: `상세 직접원가 합계와 저장된 전체 직접원가가 ${won(summary.costDiff)} 다릅니다.`,
      action: "계약 전 견적이면 현재 기준 재계산 저장 여부를 검토하고, 계약 완료 견적이면 관리자 검토가 필요합니다.",
    });
  }

  return diagnostics;
}
