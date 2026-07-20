import { createHash } from "crypto";
import { ApiError, UserContext, supabaseFetch } from "../../_lib/server";

export const CONTRACT_TEMPLATE_VERSION = "RFC-005-2026.07.20";
export const CONTRACT_RULE_VERSION = "RFC-006-2026.07.20";
export const DOCUMENT_TYPES = ["CONTRACT", "QUOTE", "SPEC"] as const;

export type ContractDocumentType = (typeof DOCUMENT_TYPES)[number];

type EstimateRow = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  phone: string | null;
  address: string | null;
  area_pyeong: number | null;
  total_price: number | null;
  estimate_data: Record<string, unknown> | null;
  status: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SpecRow = {
  spec_code: string;
  work_category?: string | null;
  item_name: string;
  default_grade?: string | null;
  spec_text?: string | null;
  version?: string | null;
};

export type ContractOptionsPayload = {
  contract_info?: Record<string, unknown>;
  customer_info?: Record<string, unknown>;
  contractor_info?: Record<string, unknown>;
  site_manager?: Record<string, unknown>;
  admin_tasks?: Record<string, unknown>;
  protection_options?: Record<string, unknown>;
  item_options?: Record<string, unknown>;
  notes?: string | null;
};

export function assertCanWriteContractOptions(context: UserContext) {
  if (context.profile.role !== "admin" && context.profile.role !== "staff") {
    throw new ApiError(403, "계약 옵션을 수정할 권한이 없습니다.");
  }
}

export function assertCanCreateContractPreview(context: UserContext) {
  if (context.profile.role !== "admin" && context.profile.role !== "staff") {
    throw new ApiError(403, "계약 패키지를 생성할 권한이 없습니다.");
  }
}

export function assertCanManageChangeOrder(context: UserContext) {
  if (context.profile.role !== "admin") {
    throw new ApiError(403, "변경견적과 변경승인은 관리자만 처리할 수 있습니다.");
  }
}

export function hashJson(value: unknown) {
  return createHash("sha256").update(JSON.stringify(sortForHash(value))).digest("hex");
}

function sortForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForHash);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => [key, sortForHash(item)]),
  );
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function dateMinusDays(dateText: string, days: number) {
  if (!dateText) return "";
  const date = new Date(`${dateText}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function paymentSchedule(totalAmount: number, startDate: string) {
  const raw = [
    { label: "계약금", ratio: 10, due_basis: "계약 시", due_date: "" },
    { label: "착공 전 중도금", ratio: 40, due_basis: "착공 3일 전", due_date: dateMinusDays(startDate, 3) },
    { label: "목공공사 착수 전 중도금", ratio: 40, due_basis: "목공공사 착수 전", due_date: "" },
    { label: "잔금", ratio: 10, due_basis: "준공확인 및 목적물 인도 시", due_date: "" },
  ];
  let allocated = 0;
  return raw.map((item, index) => {
    const amount = index === raw.length - 1
      ? totalAmount - allocated
      : Math.floor((totalAmount * item.ratio) / 100);
    allocated += amount;
    return { ...item, amount };
  });
}

export function normalizeContractOptions(body: Record<string, unknown>): ContractOptionsPayload {
  return {
    contract_info: objectValue(body.contract_info),
    customer_info: objectValue(body.customer_info),
    contractor_info: objectValue(body.contractor_info),
    site_manager: objectValue(body.site_manager),
    admin_tasks: objectValue(body.admin_tasks),
    protection_options: objectValue(body.protection_options),
    item_options: objectValue(body.item_options),
    notes: typeof body.notes === "string" ? body.notes.trim() || null : null,
  };
}

export async function loadEstimateRow(estimateId: string) {
  const rows = await supabaseFetch<EstimateRow[]>(
    `/rest/v1/estimates?id=eq.${encodeURIComponent(estimateId)}&select=*`,
  );
  const estimate = rows[0];
  if (!estimate) throw new ApiError(404, "저장 견적을 찾지 못했습니다.");
  return estimate;
}

export async function loadDocumentOptions(estimateId: string) {
  const rows = await supabaseFetch<Array<Record<string, unknown>>>(
    `/rest/v1/estimate_document_options?estimate_id=eq.${encodeURIComponent(estimateId)}&select=*&limit=1`,
  );
  return rows[0] || null;
}

export async function assertNoContractedPackage(estimateId: string) {
  const rows = await supabaseFetch<Array<{ id: string }>>(
    `/rest/v1/contract_package_snapshots?estimate_id=eq.${encodeURIComponent(estimateId)}&status=in.(CONTRACTED,SUPERSEDED,CANCELLED)&select=id&limit=1`,
  );
  if (rows[0]) {
    throw new ApiError(409, "계약확정된 견적은 변경견적으로 처리해 주세요.");
  }
}

async function loadActiveSpecs() {
  return supabaseFetch<SpecRow[]>(
    "/rest/v1/standard_spec_catalog?is_active=eq.true&select=*&order=sort_order.asc,item_name.asc",
  );
}

function customerQuoteItems(estimateData: Record<string, unknown>) {
  const quote = objectValue(estimateData.customerQuote);
  const groups = Array.isArray(quote.groups) ? quote.groups : [];
  return groups.flatMap((group) => {
    const groupObject = objectValue(group);
    const items = Array.isArray(groupObject.items) ? groupObject.items : [];
    return items.map((item) => {
      const itemObject = objectValue(item);
      return {
        work_category: stringValue(groupObject.label, "기타"),
        item_name: stringValue(itemObject.name, "항목"),
        sales_amount_text: stringValue(itemObject.amountText, ""),
        sales_amount: numberValue(itemObject.amount, 0),
      };
    });
  });
}

function limitedEstimateSnapshot(estimate: EstimateRow) {
  const data = objectValue(estimate.estimate_data);
  const quote = objectValue(data.customerQuote);
  const savedAt = stringValue(data.savedAt, estimate.created_at || "");
  return {
    estimate_id: estimate.id,
    estimate_revision: savedAt || estimate.updated_at || estimate.created_at || "",
    project_name: estimate.project_name || stringValue(data.projectName),
    area_pyeong: estimate.area_pyeong ?? numberValue(data.areaPyeong),
    site_address: estimate.address || "",
    customer_name: estimate.client_name || stringValue(data.clientName),
    customer_phone: estimate.phone || stringValue(data.phone),
    total_price: estimate.total_price ?? numberValue(data.total),
    total_text: stringValue(data.totalText),
    status: estimate.status || stringValue(data.status, "견적"),
    customer_quote: quote,
    quote_items: customerQuoteItems(data),
  };
}

function specMatchesItem(spec: SpecRow, itemName: string, category: string) {
  const source = `${itemName} ${category}`;
  const specName = spec.item_name || "";
  if (specName && source.includes(specName)) return true;
  const code = spec.spec_code || "";
  const aliases: Record<string, string[]> = {
    KITCHEN_FAUCET: ["싱크수전", "주방수전"],
    KITCHEN_SINK: ["싱크볼"],
    KITCHEN_HOOD: ["후드"],
    KITCHEN_COUNTERTOP: ["상판", "칸스톤", "세라믹"],
    FURNITURE_DOOR: ["도어", "문짝", "가구문"],
    FURNITURE_HARDWARE: ["하드웨어", "힌지", "레일", "서랍"],
    BATH_FIXTURE: ["욕실 기본기기", "도기", "수전", "샤워기"],
    BATH_CABINET: ["욕실장", "장식장"],
    BATH_FAN: ["환풍기", "휴젠트"],
    TILE_WALL: ["타일"],
    TILE_ENTRY: ["현관", "타일"],
    FLOORING: ["바닥", "마루"],
    FILM: ["필름"],
    SILICONE: ["실리콘"],
    SWITCH_OUTLET: ["콘센트", "스위치"],
    DOWNLIGHT: ["다운라이트"],
    SQUARE_LIGHT: ["사각", "매입등"],
    INDIRECT_LIGHT: ["간접조명", "T3"],
    DOOR: ["일반도어", "방문", "문틀", "목재문"],
    MIDDLE_DOOR: ["중문"],
    BUILT_IN_STORAGE: ["붙박이장", "수납장", "제작"],
  };
  return (aliases[code] || []).some((alias) => source.includes(alias));
}

function buildSpecSnapshot(items: ReturnType<typeof customerQuoteItems>, specs: SpecRow[]) {
  return items.flatMap((item) => {
    const matches = specs.filter((spec) => specMatchesItem(spec, item.item_name, item.work_category));
    return matches.map((spec) => ({
      spec_code: spec.spec_code,
      work_category: item.work_category,
      item_name: item.item_name,
      sales_amount: item.sales_amount,
      sales_amount_text: item.sales_amount_text,
      standard_item_name: spec.item_name,
      selected_grade: spec.default_grade || "",
      specification: spec.spec_text || "",
      spec_version: spec.version || "",
    }));
  });
}

function evaluateClauses(options: ContractOptionsPayload) {
  const adminTasks = objectValue(options.admin_tasks);
  const protection = objectValue(options.protection_options);
  const enabled = (key: string) => adminTasks[key] === true;
  const customerTasks = [
    ["관리사무소 공사신고", !enabled("admin_office_filing_included")],
    ["입주민 동의", !enabled("resident_consent_included")],
    ["행위허가·신고 및 관계기관 절차", !enabled("permit_filing_included")],
  ].filter(([, required]) => required).map(([label]) => label);
  const contractorTasks = [
    ["관리사무소 공사신고", enabled("admin_office_filing_included")],
    ["입주민 동의", enabled("resident_consent_included")],
    ["행위허가·신고 및 관계기관 절차", enabled("permit_filing_included")],
  ].filter(([, included]) => included).map(([label]) => label);

  return {
    customer_admin_tasks: customerTasks,
    contractor_admin_tasks: contractorTasks,
    existing_finish_exclusion: protection.existing_finish_protection_included === true
      ? null
      : "기존 마감재 보양은 계약 범위에서 제외되며, 정상 작업 중 불가피한 기존 마감재의 경미한 손상은 하자로 보지 않습니다.",
    existing_pipe_cleaning_exclusion: protection.existing_pipe_cleaning_included === true
      ? null
      : "기존 배관 청소·준설은 계약 금액에 포함되지 않습니다.",
    new_finish_protection_required: true,
  };
}

export async function buildContractPackageSnapshot(estimateId: string, optionsOverride?: ContractOptionsPayload) {
  const estimate = await loadEstimateRow(estimateId);
  const savedOptions = await loadDocumentOptions(estimateId);
  const options = {
    contract_info: objectValue(savedOptions?.contract_info),
    customer_info: objectValue(savedOptions?.customer_info),
    contractor_info: objectValue(savedOptions?.contractor_info),
    site_manager: objectValue(savedOptions?.site_manager),
    admin_tasks: objectValue(savedOptions?.admin_tasks),
    protection_options: objectValue(savedOptions?.protection_options),
    item_options: objectValue(savedOptions?.item_options),
    notes: typeof savedOptions?.notes === "string" ? savedOptions.notes : null,
    ...optionsOverride,
  };
  const estimateSnapshot = limitedEstimateSnapshot(estimate);
  const specs = await loadActiveSpecs();
  const specSnapshot = buildSpecSnapshot(estimateSnapshot.quote_items, specs);
  const clauseSnapshot = evaluateClauses(options);
  const contractInfo = objectValue(options.contract_info);
  const totalAmount = numberValue(estimateSnapshot.total_price);
  const startDate = stringValue(contractInfo.start_date);
  const snapshot = {
    estimate_id: estimate.id,
    estimate_revision: estimateSnapshot.estimate_revision,
    contract_info: {
      ...contractInfo,
      project_name: estimateSnapshot.project_name,
      site_address: estimateSnapshot.site_address,
      area_pyeong: estimateSnapshot.area_pyeong,
      total_amount: totalAmount,
    },
    parties: {
      customer: {
        name: estimateSnapshot.customer_name,
        phone: estimateSnapshot.customer_phone,
        address: stringValue(options.customer_info?.customer_address),
        email: stringValue(options.customer_info?.customer_email),
      },
      contractor: objectValue(options.contractor_info),
    },
    site_manager: objectValue(options.site_manager),
    estimate_snapshot: estimateSnapshot,
    document_options_snapshot: options,
    spec_snapshot: specSnapshot,
    clause_snapshot: clauseSnapshot,
    payment_schedule: paymentSchedule(totalAmount, startDate),
    template_version: CONTRACT_TEMPLATE_VERSION,
    rule_version: CONTRACT_RULE_VERSION,
  };
  return {
    ...snapshot,
    source_hash: hashJson(snapshot),
  };
}

export function renderDocumentJson(type: ContractDocumentType, snapshot: Record<string, unknown>) {
  const contractInfo = objectValue(snapshot.contract_info);
  const estimateSnapshot = objectValue(snapshot.estimate_snapshot);
  const titleMap = {
    CONTRACT: "인테리어 공사계약서",
    QUOTE: "공사 견적서",
    SPEC: "공사사양서",
  };
  return {
    document_type: type,
    title: titleMap[type],
    template_version: snapshot.template_version,
    rule_version: snapshot.rule_version,
    project_name: contractInfo.project_name,
    contract_no: contractInfo.contract_no || "",
    estimate_id: snapshot.estimate_id,
    estimate_revision: snapshot.estimate_revision,
    total_amount: contractInfo.total_amount,
    generated_sections: type === "SPEC"
      ? snapshot.spec_snapshot
      : type === "QUOTE"
        ? estimateSnapshot.customer_quote
        : {
          contract_info: snapshot.contract_info,
          parties: snapshot.parties,
          site_manager: snapshot.site_manager,
          clauses: snapshot.clause_snapshot,
          payment_schedule: snapshot.payment_schedule,
        },
  };
}
