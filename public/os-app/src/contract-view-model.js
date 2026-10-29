export function createContractViewModel({ contractOptionsState, contractPreviewState, contractPackagesState, allContractPackagesState, contractSelectedDocumentType }) {
function contractOptionSource() {
  return contractOptionsState && typeof contractOptionsState === "object" ? contractOptionsState : {};
}

function contractNested(path, fallback = "") {
  const source = contractOptionSource();
  return path.reduce((value, key) => value && typeof value === "object" ? value[key] : undefined, source) ?? fallback;
}

function contractOptionValue(path, fallback = "") {
  const value = contractNested(path, fallback);
  return value == null ? "" : String(value);
}

function contractOptionChecked(path) {
  return contractNested(path, false) === true;
}

function areaM2Text(areaPyeong) {
  const area = Number(areaPyeong) || 0;
  return area ? `${(area * 3.3058).toFixed(2)}㎡` : "-";
}

function contractDocumentLabel(type) {
  return { CONTRACT: "계약서", QUOTE: "견적서", SPEC: "공사사양서" }[type] || type || "-";
}

function contractPackageSummary(item = {}) {
  const info = item.contract_info || {};
  const estimate = item.estimate_snapshot || {};
  const parties = item.parties_info || {};
  const customer = parties.customer || {};
  return {
    contractNo: item.contract_no || info.contract_no || "-",
    projectName: info.project_name || estimate.project_name || "저장 계약",
    customerName: customer.name || estimate.customer_name || "-",
    customerPhone: customer.phone || estimate.customer_phone || "-",
    siteAddress: info.site_address || estimate.site_address || "-",
    contractDate: info.contract_date || "-",
    totalAmount: info.total_amount ?? estimate.total_price ?? 0,
    constructionType: info.construction_type || "-",
    status: item.status || "-",
    updatedAt: item.updated_at || item.created_at || null,
  };
}

function optionFields(estimate) {
  const fields = [];
  const setContractField = (id, value) => fields.push({ id, value, type: "value" });
  const setContractChecked = (id, value) => fields.push({ id, value, type: "checked" });
  const issuedContractNo = contractPreviewState?.snapshot?.contract_no || contractOptionValue(["contract_no"]);
  setContractField("contractNo", issuedContractNo && issuedContractNo !== "미발급" ? issuedContractNo : "자동 생성");
  setContractField("contractDate", contractOptionValue(["contract_info", "contract_date"]));
  setContractField("constructionType", contractOptionValue(["contract_info", "construction_type"]));
  setContractField("contractSiteAddress", estimate?.address || "");
  setContractField("contractAreaPyeong", estimate?.areaPyeong ? `${estimate.areaPyeong}평` : "-");
  setContractField("contractAreaM2", areaM2Text(estimate?.areaPyeong));
  setContractField("contractStartDate", contractOptionValue(["contract_info", "start_date"]));
  setContractField("contractCompletionDate", contractOptionValue(["contract_info", "planned_completion_date"]));
  setContractField("contractCustomerName", estimate?.clientName || "");
  setContractField("contractCustomerPhone", estimate?.phone || estimate?.clientPhone || "");
  setContractField("customerAddress", contractOptionValue(["customer_info", "customer_address"]));
  setContractField("customerEmail", contractOptionValue(["customer_info", "customer_email"]));
  setContractField("siteManagerName", contractOptionValue(["site_manager", "name"]));
  setContractField("siteManagerTitle", contractOptionValue(["site_manager", "title"]));
  setContractField("siteManagerPhone", contractOptionValue(["site_manager", "phone"]));
  setContractChecked("residentConsentIncluded", (
    contractOptionChecked(["admin_tasks", "admin_office_filing_included"]) ||
    contractOptionChecked(["admin_tasks", "resident_consent_included"])
  ));
  setContractChecked("permitFilingIncluded", contractOptionChecked(["admin_tasks", "permit_filing_included"]));
  setContractChecked("existingFinishProtectionIncluded", contractOptionChecked(["protection_options", "existing_finish_protection_included"]));
  return fields;
}
return { contractPreviewState, contractPackagesState, allContractPackagesState, contractSelectedDocumentType, optionFields, areaM2Text, contractDocumentLabel, contractPackageSummary };
}

export function contractPrintValue(value, fallback = "-") {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  return String(value);
}

export function contractPrintMoney(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function contractPrintDate(value) {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value).replaceAll("-", ". ");
  return contractPrintValue(value);
}

export function contractPrintInfo(snapshot = {}) {
  const info = snapshot.contract_info || {};
  const parties = snapshot.parties || snapshot.parties_info || {};
  const customer = parties.customer || {};
  const estimate = snapshot.estimate_snapshot || {};
  return {
    contractNo: contractPrintValue(info.contract_no || snapshot.contract_no),
    issuedVersion: info.issued_version_id || null,
    issuedSourceLabel: info.issued_version_id ? `${info.issued_quote_number} · V${info.issued_version}` : "",
    supplyAmount: info.supply_amount,
    vatAmount: info.vat_amount,
    projectName: contractPrintValue(info.project_name || estimate.project_name || "계약 프로젝트"),
    siteAddress: contractPrintValue(info.site_address || estimate.site_address),
    areaPyeong: contractPrintValue(info.area_pyeong || estimate.area_pyeong),
    totalAmount: Number(info.total_amount || estimate.total_price || 0),
    contractDate: contractPrintDate(info.contract_date),
    constructionType: contractPrintValue(info.construction_type || "인테리어 공사"),
    startDate: contractPrintDate(info.start_date),
    completionDate: contractPrintDate(info.planned_completion_date),
    customerName: contractPrintValue(customer.name || estimate.customer_name),
    customerPhone: contractPrintValue(customer.phone || estimate.customer_phone),
    customerAddress: contractPrintValue(customer.address),
    customerEmail: contractPrintValue(customer.email),
    siteManager: snapshot.site_manager || {},
    clauses: snapshot.clause_snapshot || {},
    paymentSchedule: Array.isArray(snapshot.payment_schedule) ? snapshot.payment_schedule : [],
    specSnapshot: Array.isArray(snapshot.spec_snapshot) ? snapshot.spec_snapshot : [],
    customerQuote: estimate.customer_quote || {},
  };
}

export function normalizeContractPaymentSchedule(info) {
  const schedule = Array.isArray(info.paymentSchedule) ? info.paymentSchedule : [];
  const total = Number(info.totalAmount) || 0;
  const defaults = [
    { label: "계약금", ratio: 10, due_basis: "계약 체결 시", amount: Math.floor(total * 0.1) },
    { label: "1차 중도금", ratio: 40, due_basis: "착공일 3일 전까지", amount: Math.floor(total * 0.4) },
    { label: "2차 중도금", ratio: 40, due_basis: "목공공사 착수일까지", amount: Math.floor(total * 0.4) },
    { label: "잔금", ratio: 10, due_basis: "준공확인 후 목적물 인도 전", amount: total - Math.floor(total * 0.9) },
  ];
  return defaults.map((item, index) => {
    const saved = schedule[index] || {};
    return {
      ...item,
      label: saved.label ?? item.label,
      ratio: saved.ratio ?? item.ratio,
      due_basis: saved.due_basis ?? item.due_basis,
      amount: Number(saved.amount ?? item.amount) || 0,
    };
  });
}
