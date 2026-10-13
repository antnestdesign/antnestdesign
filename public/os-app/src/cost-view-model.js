import { rateNumber } from "./utils.js";

export const SYSTEM_TRADE_ORDER = ["철거", "전기·조명", "목공", "가구", "타일·욕실", "도배·필름", "바닥", "마감·기타"];

export const COST_CALCULATION_BASIS_OPTIONS = [
  ["fixed", "고정금액"],
  ["apartment_pyeong", "아파트 평형"],
  ["flooring_pyeong", "실제 시공평수"],
  ["length_mm", "길이(mm)"],
  ["length_m", "길이(m)"],
  ["area_sqm", "면적(㎡)"],
  ["count", "개수"],
  ["bathroom_count", "욕실 개소"],
  ["lower_cabinet_length", "하부장 길이"],
  ["upper_cabinet_length", "상부장 길이"],
  ["homebar_length", "홈바장 길이"],
  ["island_length", "아일랜드 길이"],
  ["partition_length", "가벽 길이"],
  ["manual_input", "사용자 직접입력"],
];

export const COST_ROUNDING_OPTIONS = [
  ["none", "소수 유지"],
  ["ceil", "정수 올림"],
  ["floor", "정수 내림"],
  ["round", "반올림"],
];

export function percentText(value) {
  return `${(rateNumber(value) * 100).toFixed(1)}%`;
}

export function draftValue(row, key) {
  if (key === "cost") return row.draft_cost_price ?? row.cost_price;
  if (key === "margin") return row.draft_margin_rate ?? row.default_margin_rate;
  if (key === "active") return row.draft_is_active ?? row.is_active;
  return null;
}

export function hasDraft(row) {
  return row?.draft_cost_price !== null && row?.draft_cost_price !== undefined ||
    row?.draft_margin_rate !== null && row?.draft_margin_rate !== undefined ||
    row?.draft_is_active !== null && row?.draft_is_active !== undefined;
}

export function marginDistribution(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    const key = percentText(row.default_margin_rate);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].map(([rate, count]) => `${rate} ${count}개`).join(" / ") || "-";
}

export function existingDraftCount(rows) {
  return rows.filter(hasDraft).length;
}

export function systemCategoryLabel(category = "") {
  const value = category || "기타";
  if (["가구", "철거", "목공", "바닥"].includes(value)) return value;
  if (["전기", "조명"].includes(value)) return "전기·조명";
  if (["욕실", "타일"].includes(value)) return "타일·욕실";
  if (["도배", "필름"].includes(value)) return "도배·필름";
  if (["도어", "중문", "창호"].includes(value)) return "도어·창호";
  if (["마감", "기타", "상판", "설비", "인허가"].includes(value)) return "마감·기타";
  return value;
}

export function systemTradeOrderIndex(label = "") {
  const index = SYSTEM_TRADE_ORDER.indexOf(label);
  return index === -1 ? SYSTEM_TRADE_ORDER.length : index;
}

export function createCostViewModel({ originalCostItems, costItemFilters, systemCostHistory, systemPublishLogs, systemEstimateCount, expandedSystemCostCategory: initialExpanded, costItemEditorMode, costItemEditorSourceCode, formatDateTime }) {
function changedCostItems() {
  return [...originalCostItems.values()].filter(hasDraft);
}

function latestPublishLog() {
  return systemPublishLogs[0] || null;
}

function systemCategories() {
  return [...new Set([...originalCostItems.values()].map((row) => row.category || "기타"))]
    .sort((a, b) => String(a).localeCompare(String(b), "ko-KR"));
}

function rowsBySystemFilter({ scope = "all", category = "", activeMode = "active" } = {}) {
  return [...originalCostItems.values()].filter((row) => {
    if (scope === "category" && row.category !== category) return false;
    if (activeMode === "active" && !row.is_active) return false;
    return true;
  });
}

function systemSubcategories(category = "") {
  return [...new Set([...originalCostItems.values()]
    .filter((row) => !category || row.category === category)
    .map((row) => row.subcategory || "")
    .filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "ko-KR"));
}

function systemTradeSubcategories(tradeLabel = "") {
  return [...new Set([...originalCostItems.values()]
    .filter((row) => !tradeLabel || systemCategoryLabel(row.category) === tradeLabel)
    .map((row) => row.subcategory || "")
    .filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b), "ko-KR"));
}

function systemCostRowsForAccordion() {
  const keyword = costItemFilters.keyword.trim().toLowerCase();
  const rows = [...originalCostItems.values()].filter((row) => {
    if (keyword) {
      const haystack = `${row.item_code || ""} ${row.item_name || ""}`.toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    if (costItemFilters.subcategory && row.subcategory !== costItemFilters.subcategory) return false;
    if (costItemFilters.active === "active" && !row.is_active) return false;
    if (costItemFilters.active === "inactive" && row.is_active) return false;
    if (costItemFilters.state === "draft" && !hasDraft(row)) return false;
    if (costItemFilters.state === "pending" && !row.is_pending_new) return false;
    if (costItemFilters.state === "published" && row.is_pending_new) return false;
    return true;
  });
  return rows.sort((a, b) => {
    if (costItemFilters.sort === "updated") {
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    }
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

function groupedSystemCostRows() {
  const groups = new Map();
  for (const row of systemCostRowsForAccordion()) {
    const tradeLabel = systemCategoryLabel(row.category);
    if (!groups.has(tradeLabel)) groups.set(tradeLabel, []);
    groups.get(tradeLabel).push(row);
  }
  return [...groups.entries()].sort(([a], [b]) =>
    systemTradeOrderIndex(a) - systemTradeOrderIndex(b) || String(a).localeCompare(String(b), "ko-KR")
  );
}

function costItemFormDefaults(source = {}) {
  return {
    item_code: source.item_code || "",
    category: source.category || systemCategories()[0] || "",
    subcategory: source.subcategory || "",
    item_name: source.item_name || "",
    unit: source.unit || "",
    calculation_basis: source.calculation_basis || "manual_input",
    cost_price: source.cost_price ?? "",
    default_margin_rate: source.default_margin_rate ?? 0.3,
    is_active: source.draft_is_active ?? source.is_active ?? true,
    sort_order: source.sort_order ?? 0,
    memo: source.memo || "",
    customer_name: source.customer_name || "",
    order_name: source.order_name || "",
    calculation_multiplier: source.calculation_multiplier ?? 1,
    min_quantity: source.min_quantity ?? "",
    rounding_method: source.rounding_method || "none",
    include_in_customer_quote: source.include_in_customer_quote ?? true,
    include_in_internal_quote: source.include_in_internal_quote ?? true,
    include_in_order_sheet: source.include_in_order_sheet ?? false,
    is_material: source.is_material ?? false,
    is_labor: source.is_labor ?? false,
    is_service: source.is_service ?? false,
  };
}

function accordion() {
  let expandedSystemCostCategory = initialExpanded;
  const groups = groupedSystemCostRows();
  if (!groups.length) {
    expandedSystemCostCategory = "";
    return { expanded: "", groups: [] };
  }
  if (costItemFilters.keyword && !groups.some(([tradeLabel]) => tradeLabel === expandedSystemCostCategory)) {
    expandedSystemCostCategory = groups[0][0];
  }
  return { expanded: expandedSystemCostCategory, groups: groups.map(([tradeLabel, rows]) => {
    const isOpen = expandedSystemCostCategory === tradeLabel;
    const draftCount = rows.filter(hasDraft).length;
    const inactiveDraftCount = rows.filter((row) => row.draft_is_active === false).length;
    const meta = [
      `${rows.length.toLocaleString("ko-KR")}개 항목`,
      draftCount ? `변경 예정 ${draftCount.toLocaleString("ko-KR")}개` : "",
      inactiveDraftCount ? `비활성 예정 ${inactiveDraftCount.toLocaleString("ko-KR")}개` : "",
    ].filter(Boolean).join(" · ");
    return { tradeLabel, rows, isOpen, meta };
  }) };
}

function rollback(version) {
  const log = systemPublishLogs.find((item) => item.version === version);
  const rows = systemCostHistory.filter((row) => row.cost_version === version);
  const categories = [...new Set(rows.map((row) => row.cost_items?.category || "기타"))];
  const reviewed = rows.map((row) => {
    const item = row.cost_items || {};
    const current = originalCostItems.get(item.item_code);
    const conflict = !current ||
      rateNumber(current.cost_price) !== rateNumber(row.new_cost_price) ||
      rateNumber(current.default_margin_rate) !== rateNumber(row.new_margin_rate) ||
      Boolean(current.is_active) !== Boolean(row.new_is_active);
    return { row, item, current, conflict };
  });
  const conflictCount = reviewed.filter((item) => item.conflict).length;
  return { log, rows, categories, reviewed, conflictCount };
}

function editor() {
  const source = costItemEditorSourceCode ? originalCostItems.get(costItemEditorSourceCode) : null;
  const isEdit = costItemEditorMode === "edit";
  const isClone = costItemEditorMode === "clone";
  const defaults = costItemFormDefaults(source || {});
  if (!isEdit) {
    defaults.item_code = "";
    defaults.item_name = "";
  }
  const categories = systemCategories();
  const subcategories = systemSubcategories(defaults.category);
  return { isEdit, isClone, defaults, categories, subcategories };
}

function metrics() {
  const items = [...originalCostItems.values()];
  const drafts = changedCostItems();
  const latest = latestPublishLog();
  const metrics = [
    ["전체 원가 품목 수", `${items.length.toLocaleString("ko-KR")}개`],
    ["활성 품목 수", `${items.filter((item) => item.is_active).length.toLocaleString("ko-KR")}개`],
    ["변경 예정 품목 수", `${drafts.length.toLocaleString("ko-KR")}개`],
    ["최근 배포 버전", latest?.version || "-"],
    ["최근 배포 일시", latest?.published_at ? formatDateTime(latest.published_at) : "-"],
    ["저장된 견적 수", `${systemEstimateCount.toLocaleString("ko-KR")}건`],
  ];
  return metrics;
}
return { changedCostItems, latestPublishLog, systemCategories, rowsBySystemFilter, systemSubcategories, systemTradeSubcategories, systemCostRowsForAccordion, groupedSystemCostRows, costItemFormDefaults, accordion, rollback, editor, metrics };
}
