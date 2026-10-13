import { latestEstimate } from "./estimates.js";

export const contractViewCases = [
  { name: "contract defaults" }, { name: "contract saved false", saved: true },
  { name: "contract legacy options", legacy: true }, { name: "contract zero empty", zero: true },
  ...["DRAFT", "PREVIEWED", "READY", "CONTRACTED", "SUPERSEDED", "CHANGE_PENDING", "CANCELLED"].map((status) => ({ name: `contract status ${status}`, status })),
  { name: "contract manager", role: "manager", status: "CONTRACTED" },
  { name: "contract staff", role: "staff", saved: true },
  { name: "contract empty workspace", empty: true }, { name: "contract missing preview", noPreview: true },
  { name: "contract quote tab", tab: "QUOTE" }, { name: "contract spec tab", tab: "SPEC" },
  { name: "contract saved document sections", generated: true },
  { name: "contract legacy parties fallback", legacy: true },
  { name: "contract payment override", payment: true, generated: true },
  { name: "contract payment explicit zeros", paymentZero: true },
  { name: "contract change pending content", status: "CHANGE_PENDING", change: true },
];
export const costViewCases = [
  { name: "cost closed" }, { name: "cost open furniture", expanded: "가구" },
  { name: "cost open merged wallpaper", expanded: "도배·필름" }, { name: "cost open merged misc", expanded: "마감·기타" },
  { name: "cost empty", empty: true }, { name: "cost no drafts", noDraft: true },
  { name: "cost inactive filter", filter: { active: "inactive" } },
  { name: "cost active filter", filter: { active: "active" } },
  { name: "cost pending filter", filter: { state: "pending" } },
  { name: "cost draft filter", filter: { state: "draft" } },
  { name: "cost published filter", filter: { state: "published" } },
  { name: "cost search auto expand", filter: { keyword: "FILM" } },
  { name: "cost search absent", filter: { keyword: "NOT_A_REAL_ITEM" } },
  { name: "cost subcategory filter", filter: { subcategory: "합성자재" } },
  { name: "cost updated sort", expanded: "가구", filter: { sort: "updated" } },
  { name: "cost editor create", mode: "create" }, { name: "cost editor pending edit", mode: "edit" },
  { name: "cost editor clone", mode: "clone" }, { name: "cost editor zero", mode: "edit", zero: true },
  { name: "cost editor busy", mode: "edit", busy: true },
  { name: "cost margin boundaries", boundaries: true, expanded: "가구" },
  { name: "cost no history", noHistory: true }, { name: "cost multiple history", multiple: true, version: "SYNTHETIC-001" },
  { name: "cost rollback selected", version: "SYNTHETIC-001" }, { name: "cost rollback conflict", version: "SYNTHETIC-001", conflict: true },
  { name: "cost rollback missing item", version: "SYNTHETIC-001", missing: true },
  { name: "cost rollback absent version", version: "NOT_FOUND" },
  { name: "cost manager readonly", role: "manager", expanded: "가구", mode: "edit", version: "SYNTHETIC-001" },
  { name: "cost staff absent", role: "staff", expanded: "가구", mode: "edit" },
];

export function contractFixture(entry, fixedTerms) {
  const estimate = latestEstimate();
  estimate.inputs.demolitionConsentEnabled = true;
  estimate.inputs.demolitionPermitEnabled = true;
  estimate.inputs.interiorProtectionEnabled = true;
  const options = entry.saved ? { id: "synthetic-option", contract_no: "AND-2026-01-001", admin_tasks: { resident_consent_included: false, permit_filing_included: false }, protection_options: { existing_finish_protection_included: false }, customer_info: { customer_address: "합성 주소", customer_email: "synthetic@example.invalid" } }
    : entry.legacy ? { admin_tasks: { admin_office_filing_included: true }, site_manager: { name: "합성 담당", title: "담당자", phone: "000-0000" } }
    : entry.zero ? { contract_info: { contract_date: "", construction_type: "" }, admin_tasks: { resident_consent_included: false }, customer_info: { customer_address: null }, site_manager: { name: "" } } : {};
  const contractor = { company_name: "SYNTHETIC CONTRACTOR", representative: "합성 대표", business_no: "000-00-00000", phone: "000-0000", address: "합성 사업장" };
  const parties = { customer: { name: estimate.clientName, phone: estimate.phone, address: "합성 고객 주소", email: "synthetic@example.invalid" }, contractor };
  const snapshot = {
    id: "synthetic-package", estimate_id: estimate.id, contract_no: "AND-2026-01-001", package_version: 1,
    status: entry.status || "READY", created_at: "2026-01-01T00:00:00.000Z",
    contract_info: { contract_no: "AND-2026-01-001", project_name: estimate.projectName, site_address: estimate.address, area_pyeong: 33, total_amount: estimate.total, contract_date: "2026-01-01", start_date: "2026-01-10", planned_completion_date: "2026-02-10", construction_type: "합성 공사" },
    parties_info: parties, site_manager: { name: "합성 담당자", title: "담당", phone: "000-0000" },
    estimate_snapshot: { estimate_id: estimate.id, project_name: estimate.projectName, customer_name: estimate.clientName, customer_phone: estimate.phone, total_price: estimate.total, customer_quote: estimate.customerQuote },
    clause_snapshot: { admin_task_exclusions: ["합성 조건"], protection: false },
    payment_schedule: entry.payment ? [{ label: "SAVED LABEL", ratio: 0, amount: 0, due_basis: "SAVED BASIS" }, { label: "저장 중도금", ratio: 35, amount: 123456, due_basis: "저장 지급시점" }] : entry.paymentZero ? [{ label: "", ratio: 0, amount: 0, due_basis: "" }] : [],
    spec_snapshot: [{ work_category: "도배", item_name: "합성 벽지", standard_item_name: "합성 표준", selected_grade: "합성 등급", spec_version: "1", quantity: 0, unit: "롤", specification: "합성 사양", changed_specification: "" }],
  };
  const generated = { contract_info: { ...snapshot.contract_info, project_name: "SAVED DOCUMENT PROJECT" }, parties: { ...parties, contractor: { ...contractor, company_name: "SAVED DOCUMENT CONTRACTOR" } }, site_manager: snapshot.site_manager, clauses: snapshot.clause_snapshot, payment_schedule: snapshot.payment_schedule, fixed_term_lines: fixedTerms.slice() };
  const contents = { message: "합성 공개 정보", costTotal: 999, internalDetails: [{ secret: "SYNTHETIC_INTERNAL" }], source_hash: "SYNTHETIC_HASH", created_by: "SYNTHETIC_ACTOR", change_orders: entry.change ? [{ status: "APPROVED", description: "합성 변경 승인 내역" }] : [] };
  const documents = ["CONTRACT", "QUOTE", "SPEC"].map((document_type) => ({ document_type, generation_status: "GENERATED", content_json: { ...contents, ...(entry.generated && document_type === "CONTRACT" ? { generated_sections: generated } : {}) } }));
  snapshot.contract_document_versions = documents;
  return { estimate: entry.empty ? null : estimate, options, preview: entry.noPreview ? null : { status: snapshot.status, snapshot, documents }, packages: entry.empty ? [] : [snapshot], selectedType: entry.tab || "CONTRACT" };
}

export function costFixture(entry) {
  const categories = ["가구", "가구", "도배", "필름", "마감", "상판", "인허가", "전기", "타일"];
  const rows = categories.map((category, index) => ({
    id: `synthetic-cost-${index}`, item_code: index === 3 ? "FILM_SYNTHETIC" : `SYNTHETIC_${index}`, item_name: `합성 원가 ${index}`, category,
    subcategory: index % 2 ? "합성인건비" : "합성자재", unit: "식", cost_price: 10000 + index * 1000, default_margin_rate: 0.3,
    is_active: index !== 1, is_pending_new: index === 1, sort_order: index, updated_at: `2026-01-${String(index + 1).padStart(2,"0")}T00:00:00.000Z`,
    draft_cost_price: !entry.noDraft && index < 2 ? (entry.zero ? 0 : 15000) : null,
    draft_margin_rate: !entry.noDraft && index === 0 ? (entry.boundaries ? 0.99 : 0.3) : null,
    draft_is_active: !entry.noDraft && index === 1 ? false : null,
  }));
  if (entry.zero) Object.assign(rows[1], { cost_price: 0, default_margin_rate: 0, min_quantity: 0, memo: "", customer_name: "" });
  if (entry.boundaries) rows[1].default_margin_rate = 0;
  const history = [{ cost_version: "SYNTHETIC-001", cost_items: { item_code: rows[0].item_code, item_name: rows[0].item_name, category: rows[0].category }, old_cost_price: 8000, new_cost_price: 10000, old_margin_rate: 0.25, new_margin_rate: 0.3, old_is_active: true, new_is_active: true, reason: "합성 변경", changed_by: "SYNTHETIC_ACTOR", changed_at: "2026-01-01T00:00:00.000Z" }];
  if (entry.multiple) history.push({ ...history[0], cost_version: "SYNTHETIC-002", reason: "두 번째 합성 변경" });
  if (entry.conflict) rows[0].cost_price = 99000;
  const logs = history.map((item) => ({ version: item.cost_version, changed_item_count: 1, reason: item.reason, published_by: "SYNTHETIC_ACTOR", published_at: item.changed_at }));
  return { rows: entry.empty ? [] : entry.missing ? rows.slice(1) : rows, history: entry.noHistory ? [] : history, logs: entry.noHistory ? [] : logs,
    filters: { keyword: "", category: "", subcategory: "", active: "all", state: "all", sort: "sort", ...(entry.filter || {}) }, expanded: entry.expanded || "", mode: entry.mode || null, source: entry.mode ? "SYNTHETIC_1" : null };
}
