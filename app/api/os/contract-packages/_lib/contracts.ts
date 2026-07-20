import { createHash } from "crypto";
import { ApiError, UserContext, UserRole, supabaseFetch } from "../../_lib/server";

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
  contract_no?: string | null;
  contract_info: Record<string, unknown>;
  customer_info: Record<string, unknown>;
  contractor_info: Record<string, unknown>;
  site_manager: Record<string, unknown>;
  admin_tasks: Record<string, boolean>;
  protection_options: Record<string, boolean>;
  item_options: Record<string, unknown>;
  notes: string | null;
};

const MAX_JSON_BYTES = 120_000;
const MAX_ARRAY_ITEMS = 300;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONTRACT_NO_PATTERN = /^[A-Za-z0-9가-힣._-]{1,50}$/;
const PHONE_PATTERN = /^[0-9+\-()\s.]{0,30}$/;

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

export function assertUuid(value: unknown, label: string) {
  const text = stringValue(value);
  if (!UUID_PATTERN.test(text)) throw new ApiError(400, `${label} 형식이 올바르지 않습니다.`);
  return text;
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

function nullableString(value: unknown, maxLength: number, label: string) {
  if (value == null) return null;
  if (typeof value !== "string") throw new ApiError(400, `${label}은 문자로 입력해 주세요.`);
  const text = value.trim();
  if (!text) return null;
  if (text.length > maxLength) throw new ApiError(400, `${label}은 ${maxLength}자 이하로 입력해 주세요.`);
  return text;
}

function requiredString(value: unknown, maxLength: number, label: string) {
  const text = nullableString(value, maxLength, label);
  if (!text) throw new ApiError(400, `${label}을 입력해 주세요.`);
  return text;
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function moneyValue(value: unknown, label: string, allowNegative = false) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ApiError(400, `${label} 금액이 올바르지 않습니다.`);
  if (!allowNegative && number < 0) throw new ApiError(400, `${label} 금액은 0 이상이어야 합니다.`);
  if (Math.abs(number) > 10_000_000_000) throw new ApiError(400, `${label} 금액이 허용 범위를 초과했습니다.`);
  return Math.round(number);
}

function dateString(value: unknown, label: string, required = false) {
  const text = nullableString(value, 10, label);
  if (!text) {
    if (required) throw new ApiError(400, `${label}을 입력해 주세요.`);
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new ApiError(400, `${label}은 YYYY-MM-DD 형식이어야 합니다.`);
  const date = new Date(`${text}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${label}이 올바르지 않습니다.`);
  return text;
}

function emailString(value: unknown, label: string) {
  const text = nullableString(value, 120, label);
  if (!text) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) throw new ApiError(400, `${label} 형식이 올바르지 않습니다.`);
  return text;
}

function phoneString(value: unknown, label: string) {
  const text = nullableString(value, 30, label);
  if (!text) return null;
  if (!PHONE_PATTERN.test(text)) throw new ApiError(400, `${label} 형식이 올바르지 않습니다.`);
  return text;
}

function booleanValue(value: unknown) {
  return value === true;
}

function limitedJsonObject(value: unknown, label: string, maxBytes = MAX_JSON_BYTES) {
  const object = objectValue(value);
  const size = Buffer.byteLength(JSON.stringify(object), "utf8");
  if (size > maxBytes) throw new ApiError(400, `${label} 데이터가 너무 큽니다.`);
  return object;
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

export function normalizeContractNo(value: unknown, required = false) {
  const text = nullableString(value, 50, "계약번호");
  if (!text) {
    if (required) throw new ApiError(400, "계약번호를 입력해 주세요.");
    return null;
  }
  if (!CONTRACT_NO_PATTERN.test(text)) {
    throw new ApiError(400, "계약번호는 한글, 영문, 숫자, -, _, . 만 사용할 수 있습니다.");
  }
  return text;
}

function normalizeContractInfo(source: Record<string, unknown>, contractNo: string | null) {
  const startDate = dateString(source.start_date, "착공일");
  const plannedCompletionDate = dateString(source.planned_completion_date, "준공예정일");
  if (startDate && plannedCompletionDate && startDate > plannedCompletionDate) {
    throw new ApiError(400, "착공일은 준공예정일보다 늦을 수 없습니다.");
  }
  return {
    contract_no: contractNo,
    contract_date: dateString(source.contract_date, "계약일"),
    construction_type: nullableString(source.construction_type, 80, "공사유형"),
    start_date: startDate,
    planned_completion_date: plannedCompletionDate,
  };
}

function normalizeCustomerInfo(source: Record<string, unknown>) {
  return {
    customer_address: nullableString(source.customer_address, 200, "고객 주소"),
    customer_email: emailString(source.customer_email, "고객 이메일"),
  };
}

function normalizeContractorInfo(source: Record<string, unknown>) {
  return {
    company_name: nullableString(source.company_name, 120, "시공자 상호"),
    business_no: nullableString(source.business_no, 40, "사업자등록번호"),
    representative: nullableString(source.representative, 80, "대표자"),
    address: nullableString(source.address, 200, "시공자 주소"),
    phone: phoneString(source.phone, "시공자 연락처"),
  };
}

function normalizeSiteManager(source: Record<string, unknown>) {
  return {
    name: nullableString(source.name, 80, "공사담당자 이름"),
    title: nullableString(source.title, 80, "공사담당자 직책"),
    phone: phoneString(source.phone, "공사담당자 연락처"),
  };
}

function normalizeAdminTasks(source: Record<string, unknown>) {
  return {
    admin_office_filing_included: booleanValue(source.admin_office_filing_included),
    resident_consent_included: booleanValue(source.resident_consent_included),
    permit_filing_included: booleanValue(source.permit_filing_included),
  };
}

function normalizeProtectionOptions(source: Record<string, unknown>) {
  return {
    existing_finish_protection_included: booleanValue(source.existing_finish_protection_included),
    existing_pipe_cleaning_included: booleanValue(source.existing_pipe_cleaning_included),
    new_finish_protection_required: true,
  };
}

function normalizeItemOptions(source: unknown) {
  const object = limitedJsonObject(source, "품목 옵션", 80_000);
  const entries = Object.entries(object).slice(0, MAX_ARRAY_ITEMS);
  return Object.fromEntries(entries.map(([key, value]) => {
    const safeKey = key.replace(/[^\w가-힣.-]/g, "").slice(0, 80);
    return [safeKey, limitedJsonObject(value, "품목 옵션 상세", 8_000)];
  }));
}

export function normalizeContractOptions(body: Record<string, unknown>): ContractOptionsPayload {
  const rawContractInfo = objectValue(body.contract_info);
  const contractNo = normalizeContractNo(body.contract_no ?? rawContractInfo.contract_no);
  return {
    contract_no: contractNo,
    contract_info: normalizeContractInfo(rawContractInfo, contractNo),
    customer_info: normalizeCustomerInfo(objectValue(body.customer_info)),
    contractor_info: normalizeContractorInfo(objectValue(body.contractor_info)),
    site_manager: normalizeSiteManager(objectValue(body.site_manager)),
    admin_tasks: normalizeAdminTasks(objectValue(body.admin_tasks)),
    protection_options: normalizeProtectionOptions(objectValue(body.protection_options)),
    item_options: normalizeItemOptions(body.item_options),
    notes: nullableString(body.notes, 1000, "메모"),
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

export async function assertContractNoAvailable(estimateId: string, contractNo: string | null) {
  if (!contractNo) return;
  const encodedNo = encodeURIComponent(contractNo);
  const encodedEstimateId = encodeURIComponent(estimateId);
  const optionRows = await supabaseFetch<Array<{ id: string }>>(
    `/rest/v1/estimate_document_options?contract_no=eq.${encodedNo}&estimate_id=neq.${encodedEstimateId}&select=id&limit=1`,
  );
  if (optionRows[0]) throw new ApiError(409, "이미 다른 견적에서 사용 중인 계약번호입니다.");
  const packageRows = await supabaseFetch<Array<{ id: string }>>(
    `/rest/v1/contract_package_snapshots?contract_no=eq.${encodedNo}&estimate_id=neq.${encodedEstimateId}&select=id&limit=1`,
  );
  if (packageRows[0]) throw new ApiError(409, "이미 다른 계약 패키지에서 사용 중인 계약번호입니다.");
}

export async function assertNoContractedPackage(estimateId: string) {
  const rows = await supabaseFetch<Array<{ id: string }>>(
    `/rest/v1/contract_package_snapshots?estimate_id=eq.${encodeURIComponent(estimateId)}&status=in.(CONTRACTED,SUPERSEDED,CANCELLED)&select=id&limit=1`,
  );
  if (rows[0]) throw new ApiError(409, "계약확정된 견적은 변경견적으로 처리해 주세요.");
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
  return (aliases[spec.spec_code] || []).some((alias) => source.includes(alias));
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
  const adminTasks = options.admin_tasks;
  const protection = options.protection_options;
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

function optionsFromSaved(savedOptions: Record<string, unknown> | null): ContractOptionsPayload {
  return {
    contract_no: savedOptions?.contract_no == null ? null : String(savedOptions.contract_no),
    contract_info: objectValue(savedOptions?.contract_info),
    customer_info: objectValue(savedOptions?.customer_info),
    contractor_info: objectValue(savedOptions?.contractor_info),
    site_manager: objectValue(savedOptions?.site_manager),
    admin_tasks: objectValue(savedOptions?.admin_tasks) as Record<string, boolean>,
    protection_options: objectValue(savedOptions?.protection_options) as Record<string, boolean>,
    item_options: objectValue(savedOptions?.item_options),
    notes: typeof savedOptions?.notes === "string" ? savedOptions.notes : null,
  };
}

export async function buildContractPackageSnapshot(estimateId: string, optionsOverride?: ContractOptionsPayload) {
  const estimate = await loadEstimateRow(estimateId);
  const savedOptions = await loadDocumentOptions(estimateId);
  const options = {
    ...optionsFromSaved(savedOptions),
    ...optionsOverride,
  };
  const contractNo = normalizeContractNo(options.contract_no, true);
  const estimateSnapshot = limitedEstimateSnapshot(estimate);
  const specs = await loadActiveSpecs();
  const specSnapshot = buildSpecSnapshot(estimateSnapshot.quote_items, specs);
  const clauseSnapshot = evaluateClauses(options);
  const totalAmount = numberValue(estimateSnapshot.total_price);
  const startDate = stringValue(options.contract_info.start_date);
  const snapshot = {
    estimate_id: estimate.id,
    estimate_revision: estimateSnapshot.estimate_revision,
    contract_no: contractNo,
    contract_info: {
      ...options.contract_info,
      contract_no: contractNo,
      project_name: estimateSnapshot.project_name,
      site_address: estimateSnapshot.site_address,
      area_pyeong: estimateSnapshot.area_pyeong,
      total_amount: totalAmount,
    },
    parties: {
      customer: {
        name: estimateSnapshot.customer_name,
        phone: estimateSnapshot.customer_phone,
        address: stringValue(options.customer_info.customer_address),
        email: stringValue(options.customer_info.customer_email),
      },
      contractor: options.contractor_info,
    },
    site_manager: options.site_manager,
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

function projectDocument(row: Record<string, unknown>, role: UserRole) {
  if (role === "staff") {
    return {
      id: row.id,
      document_type: row.document_type,
      package_version: row.package_version,
      generation_status: row.generation_status,
      content_json: row.content_json,
      file_path: row.file_path,
      file_url: row.file_url,
      mime_type: row.mime_type,
      created_at: row.created_at,
    };
  }
  return row;
}

export function projectContractOptions(row: Record<string, unknown> | null, role: UserRole, estimateId?: string) {
  const fallback = { estimate_id: estimateId || null };
  if (!row) return fallback;
  if (role === "staff") {
    return {
      id: row.id,
      estimate_id: row.estimate_id,
      contract_no: row.contract_no,
      contract_info: row.contract_info,
      customer_info: row.customer_info,
      contractor_info: row.contractor_info,
      site_manager: row.site_manager,
      admin_tasks: row.admin_tasks,
      protection_options: row.protection_options,
      item_options: row.item_options,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  return row;
}

export function projectContractPackage(row: Record<string, unknown>, role: UserRole) {
  const documents = Array.isArray(row.contract_document_versions)
    ? row.contract_document_versions.map((item) => projectDocument(objectValue(item), role))
    : [];
  if (role === "staff") {
    return {
      id: row.id,
      estimate_id: row.estimate_id,
      estimate_revision: row.estimate_revision,
      package_version: row.package_version,
      status: row.status,
      contract_no: row.contract_no,
      contract_info: row.contract_info,
      parties_info: row.parties_info,
      site_manager: row.site_manager,
      estimate_snapshot: row.estimate_snapshot,
      spec_snapshot: row.spec_snapshot,
      clause_snapshot: row.clause_snapshot,
      payment_schedule: row.payment_schedule,
      template_version: row.template_version,
      rule_version: row.rule_version,
      contract_document_versions: documents,
      confirmed_at: row.confirmed_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
  return {
    ...row,
    contract_document_versions: documents,
  };
}

export function sanitizePackageList(rows: Array<Record<string, unknown>>, role: UserRole) {
  return rows.map((row) => projectContractPackage(row, role));
}

export function normalizeChangeOrderBody(body: Record<string, unknown>) {
  const packageId = assertUuid(body.package_id, "계약 패키지 ID");
  const title = nullableString(body.title, 120, "변경견적 제목") || "변경견적";
  const afterSnapshot = limitedJsonObject(body.after_snapshot, "변경 후 스냅샷");
  const amountDelta = moneyValue(body.amount_delta, "변경금액", true);
  const scheduleImpact = limitedJsonObject(body.schedule_impact, "일정 영향", 20_000);
  return { packageId, title, afterSnapshot, amountDelta, scheduleImpact };
}

export function normalizeApprovalBody(body: Record<string, unknown>) {
  const customerName = requiredString(body.customer_name, 80, "고객 성명");
  const approvalMethod = requiredString(body.approval_method, 80, "승인방식");
  const customerSignedAt = dateString(body.customer_signed_at, "고객 승인일", true);
  const approvedDocumentHash = requiredString(body.approved_document_hash, 128, "승인 대상 문서 해시");
  const approvedPackageVersion = Math.trunc(numberValue(body.approved_package_version, 0));
  if (approvedPackageVersion <= 0) throw new ApiError(400, "승인 대상 패키지 버전이 올바르지 않습니다.");
  const evidenceFileId = nullableString(body.evidence_file_id, 120, "증적 파일 ID");
  const evidenceUrl = nullableString(body.evidence_url, 500, "증적 URL");
  if (!evidenceFileId && !evidenceUrl) throw new ApiError(400, "증적 파일 또는 증적 URL이 필요합니다.");
  return {
    customerName,
    approvalMethod,
    customerSignedAt,
    approvedDocumentHash,
    approvedPackageVersion,
    evidenceFileId,
    evidenceUrl,
    notes: nullableString(body.notes, 1000, "승인 메모"),
  };
}

export function revisedContractAmount(original: number, priorApprovedChangeTotal: number, amountDelta: number) {
  const revised = original + priorApprovedChangeTotal + amountDelta;
  if (!Number.isFinite(revised) || revised < 0) throw new ApiError(400, "변경 후 계약금액이 올바르지 않습니다.");
  return Math.round(revised);
}
