import { NextRequest } from "next/server";
import { ApiError, getUserContext, json, supabaseFetch } from "../../_lib/server";
import { id, object } from "./foundation";
import { requireFoundationAction } from "./feature-state";
import { publicIssuedDocument } from "./versions";
import { TRADES, calculateEditor } from "./editor-model";
import { buildContractPackageSnapshot, buildContractDocuments, normalizeContractOptions, generateNextContractNo,
  projectContractPackage, projectContractPreview, hashJson, EstimateRow } from "../../contract-packages/_lib/contracts";

const LABELS = ["철거·인허가", "전기·조명", "욕실·타일", "도배", "필름", "바닥", "목공", "가구", "마감·기타"];
type Obj = Record<string, unknown>;
type Editor = ReturnType<typeof calculateEditor>["publicEditor"];
type IssuedDocument = { id: string; quoteNumber: string; version: number; issuedAt: string;
  context: { project_name: string; client_name: string; phone: string; address: string; area_pyeong: number }; editor: Editor };
type Source = { estimate_id: string; document: unknown; versions: Array<{ id: string; quoteNumber: string; version: number }> };
type Decision = { state?: string; version_id?: string; included_in_total?: boolean };
type Selection = { scope?: unknown; separate_quotes?: Record<string, Decision> };
export function issuedContractEstimate(value: unknown, estimateId: string): EstimateRow {
  const d = publicIssuedDocument(value) as unknown as IssuedDocument, e = d.editor, c = d.context;
  const groups = e.summary.groups.filter(g => e.items.some(i => !i.excluded && i.trade === g.trade)).map(g => ({ key: String(g.trade), label: LABELS[TRADES.indexOf(g.trade)], total: g.total,
    items: e.items.filter(i => !i.excluded && i.trade === g.trade).map(i => ({ name: `${i.name} · ${i.quantity}${i.unit}${i.spec ? ` · ${i.spec}` : ""}${i.memo ? ` · ${i.memo}` : ""}`, quantity: i.quantity, unit: i.unit, amount: i.amount, amountText: `${Number(i.amount).toLocaleString("ko-KR")}원` })) }));
  const adjustments: Array<[string, number]> = [["추가금액", e.addition], ["할인금액", -e.discount], ["최종 단위조정", e.summary.rounding], ["부가세", e.summary.vat]];
  groups.push({ key: "issued-adjustments", label: "견적 총액 내역", total: adjustments.reduce((n, [, v]) => n + Number(v), 0), items: adjustments.map(([name, amount]) => ({ name, quantity: 1, unit: "식", amount, amountText: `${Number(amount).toLocaleString("ko-KR")}원` })) });
  return { id: estimateId, project_name: c.project_name, client_name: c.client_name, phone: c.phone, address: c.address,
    area_pyeong: Number(c.area_pyeong) || 0, total_price: e.summary.total, status: "발행",
    estimate_data: { savedAt: d.issuedAt, total: e.summary.total, totalText: `${Number(e.summary.total).toLocaleString("ko-KR")}원`, customerQuote: { groups, total: e.summary.total } } };
}
export async function buildIssuedContract(source: Source, options: Obj, contractNo?: string, selection?: Selection) {
  const d = publicIssuedDocument(source.document) as unknown as IssuedDocument;
  const normalized = normalizeContractOptions(options);
  // Contractor remains the existing estimate_document_options source of truth, not the quote footer.
  const saved = await supabaseFetch<Array<{ contractor_info: Obj }>>(`/rest/v1/estimate_document_options?estimate_id=eq.${source.estimate_id}&select=contractor_info&limit=1`);
  normalized.contractor_info = saved[0]?.contractor_info || {};
  if (selection) normalized.item_options = { ...normalized.item_options, issued_contract: {
    version_id: d.id, quote_number: d.quoteNumber, version: d.version, scope: selection.scope,
    separate_quotes: selection.separate_quotes,
  } };
  const base = await buildContractPackageSnapshot(source.estimate_id, normalized, contractNo, issuedContractEstimate(d, source.estimate_id));
  const snapshot = { ...base, contract_info: { ...base.contract_info, supply_amount: d.editor.summary.supply, vat_amount: d.editor.summary.vat,
    issued_version_id: d.id, issued_quote_number: d.quoteNumber, issued_version: d.version },
    estimate_snapshot: { ...base.estimate_snapshot, issued_version_id: d.id, supply_amount: d.editor.summary.supply, vat_amount: d.editor.summary.vat },
    spec_snapshot: d.editor.items.filter(i => !i.excluded).map(i => ({ work_category: LABELS[(TRADES as readonly string[]).indexOf(i.trade)], item_name: i.name,
      selected_grade: i.spec, specification: i.memo || i.spec, sales_amount: i.amount, quantity: i.quantity, unit: i.unit })),
  };
  if (selection?.separate_quotes) for (const [key, label] of [["windows", "창호"], ["hvac", "냉난방기"]]) {
    const decision = selection.separate_quotes[key];
    snapshot.spec_snapshot.push({ work_category: "별도 견적 범위", item_name: label, selected_grade: decision?.state === "included" ? "포함" : decision?.state === "excluded" ? "제외" : "미정",
      specification: decision?.state === "included" ? `고정 발행본 ${source.versions.find(v => v.id === decision.version_id)?.quoteNumber || ""} V${source.versions.find(v => v.id === decision.version_id)?.version || ""} · 계약금액에 포함 (자동 가산 없음)` : "계약금액에서 제외", sales_amount: 0, quantity: 0, unit: "" });
  }
  const content: Record<string, unknown> = { ...snapshot }; delete content.source_hash;
  snapshot.source_hash = hashJson(content);
  return snapshot;
}
export async function contractSourceRoute(request: NextRequest, headId?: string) {
  try {
    const user = await getUserContext(request), actor = user.authUser.id;
    const write = request.method !== "GET";
    const b = write ? object(await request.json(), ["version_id", "action", "options", "request_id", "scope", "separate_quotes", "older_version_confirmed"]) : {};
    const mode = requireFoundationAction(write && b.action !== "preview" ? "contract" : "get");
    const url = new URL(request.url), estimateId = url.searchParams.get("estimateId");
    const versionId = write ? id(b.version_id) : url.searchParams.get("versionId");
    const rpc = (action: string, extra: Obj = {}) => supabaseFetch<Obj>("/rest/v1/rpc/and_os_5b_contract", { method: "POST", body: JSON.stringify({
      p_actor: actor, p_head: headId ? id(headId) : null, p_estimate: estimateId ? id(estimateId) : null,
      p_version: versionId ? id(versionId) : null, p_mode: mode, p_action: action, ...extra }) });
    const source = await rpc("source") as unknown as Source;
    if (!write) return json({ ...source, mode, document: source.document ? publicIssuedDocument(source.document) : null });
    if (!["preview", "create"].includes(String(b.action))) throw new ApiError(400, "계약 작업을 확인해 주세요.");
    if (user.profile.role !== "admin" && (b.action === "create" || user.profile.role !== "staff")) throw new ApiError(403, "기존 계약 작성 권한이 없습니다.");
    if (!source.document) throw new ApiError(404, "공식 발행본이 없습니다.");
    const snapshot = await buildIssuedContract(source, (b.options || {}) as Obj, b.action === "create" ? await generateNextContractNo() : undefined, b as Selection);
    const documents = buildContractDocuments(snapshot);
    if (b.action === "preview") return json(projectContractPreview(snapshot, documents, user.profile.role));
    const result = await rpc("create", { p_request: id(b.request_id), p_payload: {
      ...snapshot, parties_info: snapshot.parties, documents,
      scope: b.scope, separate_quotes: b.separate_quotes, older_version_confirmed: b.older_version_confirmed === true,
    } });
    return json(projectContractPackage(result, user.profile.role), { status: 201 });
  } catch (error) {
    let status = error instanceof ApiError ? error.status : 500, message = error instanceof Error ? error.message : "";
    try { const d = JSON.parse(message); status = ({ "42501": 403, P0002: 404, "23514": 409, "23505": 409, "22023": 400, P5F01: 503, P5F02: 423 } as Record<string, number>)[d.code] || 500; message = d.message; } catch { /* Safe API messages only. */ }
    return json({ error: status !== 500 && /^[가-힣]/.test(message) ? message : "계약 기준 견적 요청을 처리하지 못했습니다." }, { status });
  }
}
