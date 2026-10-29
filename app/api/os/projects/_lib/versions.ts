import { isDeepStrictEqual } from "node:util";
import { NextRequest } from "next/server";
import { ApiError, getUserContext, json, supabaseFetch } from "../../_lib/server";
import { id, object, seal, unseal } from "./foundation";
import { FoundationModeError, requireFoundationAction } from "./feature-state";
import { calculateEditor, editorInput, EditorValidationError, PrivateEditor } from "./editor-model";
import { reviewDetailedItems } from "../../../../../public/os-app/src/detailed-item-review.js";
import { validateSaleRequests } from "./sale-access";
import { frozenWorkSource, validateWorkIssuable } from "./work-review";
import { validatePricesIssuable } from "./completion";

// Same company identity currently printed on customer quotes, captured at issue time.
export const ISSUE_COMPANY = {
  brand: "AND / ANTNEST DESIGN", name: "주식회사 앤트네스트디자인", representative: "이민영",
  businessNumber: "149-85-03105", phone: "032.321.6722", fax: "032.321.6895", email: "antnestdesign@naver.com",
  address: "인천 서구 중봉대로 612번길 10-20 506호 (청라동, 청라프라자1)",
};
function pick(value: unknown, keys: string[]): Record<string, unknown> {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return Object.fromEntries(keys.filter(k => Object.hasOwn(source, k)).map(k => [k, source[k]]));
}
export function publicIssuedDocument(value: unknown) {
  const doc = pick(value, ["id", "schemaVersion", "title", "quoteNumber", "version", "issuedAt", "issuedBy"]);
  const source = value as Record<string, unknown>, editor = source.editor as Record<string, unknown>;
  doc.company = pick(source.company, ["brand", "name", "representative", "businessNumber", "phone", "fax", "email", "address"]);
  doc.context = pick(source.context, ["project_name", "client_name", "phone", "address", "area_pyeong", "customer_undecided"]);
  doc.calculation = pick(source.calculation, ["version", "lineRounding", "supplyFloor", "vatRate"]);
  doc.editor = {
    ...pick(editor, ["version", "addition", "discount"]),
    spaces: (editor.spaces as unknown[]).map(s => pick(s, ["id", "name", "floorArea", "ceilingArea", "height", "walls", "memo"])),
    items: (editor.items as unknown[]).map(i => pick(i, ["id", "trade", "spaceId", "spaceIds", "name", "spec", "unit", "quantity", "saleUnitPrice", "amount", "memo", "kind", "excluded"])),
    separateQuotes: pick(editor.separateQuotes, ["windows", "hvac"]),
    summary: { ...pick(editor.summary, ["subtotal", "rawSupply", "rounding", "supply", "vat", "total"]),
      groups: ((editor.summary as Record<string, unknown>).groups as unknown[]).map(g => pick(g, ["trade", "total"])) },
  };
  return doc;
}
export function validateIssuable(saved: { editor: Record<string, unknown>; internal: PrivateEditor; context: Record<string, unknown> }) {
  const c = saved.context;
  for (const [key, label] of [["project_name", "현장명"], ["client_name", "고객명"], ["address", "현장 주소"]]) {
    if (typeof c[key] !== "string" || !String(c[key]).trim()) throw new ApiError(400, `${label}을 입력하고 작성본을 저장해 주세요.`);
  }
  if (c.customer_undecided !== false) throw new ApiError(400, "고객 미정 상태를 해제하고 작성본을 저장해 주세요.");
  const calculated = calculateEditor(editorInput(saved.editor), saved.internal, [], "admin");
  if (!isDeepStrictEqual(calculated.publicEditor, saved.editor)) throw new ApiError(409, "저장된 품목·합계가 일치하지 않습니다. 작성본을 확인한 뒤 다시 저장해 주세요.");
  const included = calculated.publicEditor.items.filter(i => !i.excluded);
  if (!included.length) throw new ApiError(400, "공사항목을 한 개 이상 추가하고 저장해 주세요.");
  for (const i of included) if (i.quantity <= 0 || i.saleUnitPrice <= 0 || i.amount <= 0) throw new ApiError(400, `${i.name}: 수량·판매단가·금액을 확인해 주세요.`);
  if (calculated.publicEditor.summary.supply <= 0) throw new ApiError(400, "할인 후 공급가액이 0원보다 커야 합니다.");
  return calculated.publicEditor;
}
function failure(error: unknown) {
  if (error instanceof FoundationModeError) return json({ error: error.message, code: error.mode === "READ_ONLY" ? "FOUNDATION_READ_ONLY" : "FOUNDATION_OFF" }, { status: error.status });
  if (error instanceof EditorValidationError) return json({ error: error.message }, { status: 400 });
  if (error instanceof ApiError) {
    try {
      const detail = JSON.parse(error.message);
      const status = ({ "42501": 403, P0002: 404, "23514": 409, "23505": 409, "22023": 400, P5F01: 503, P5F02: 423 } as Record<string, number>)[detail.code] || 500;
      return json({ error: status !== 500 && /^[가-힣]/.test(detail.message) ? detail.message : "발행 요청을 처리하지 못했습니다." }, { status });
    } catch { return json({ error: /^[가-힣]/.test(error.message) ? error.message : "발행 요청을 처리하지 못했습니다." }, { status: error.status }); }
  }
  return json({ error: "발행 요청을 처리하지 못했습니다." }, { status: 500 });
}
export async function versionsRoute(request: NextRequest, headId: string, action: "list" | "get" | "preview" | "issue", versionId?: string) {
  try {
    const user = await getUserContext(request), actor = user.authUser.id, role = user.profile.role;
    if (!["admin", "manager", "staff"].includes(role) || (["preview", "issue"].includes(action) && !["admin", "manager"].includes(role))) throw new ApiError(403, "공식 발행 권한이 없습니다.");
    const mode = requireFoundationAction(action === "issue" ? "issue" : "get");
    const args = { p_actor: actor, p_id: id(headId), p_action: action, p_mode: mode, p_company: ISSUE_COMPANY };
    if (action === "list" || action === "get") {
      const value = await supabaseFetch("/rest/v1/rpc/and_os_5b_versions", { method: "POST", body: JSON.stringify({ ...args, ...(versionId ? { p_version_id: id(versionId) } : {}) }) });
      return json(action === "get" ? publicIssuedDocument(value) : (value as unknown[]).map(v => pick(v, ["id", "version", "quoteNumber", "issuedAt", "issuedBy", "total"])));
    }
    const raw = await request.text();
    if (raw.length > 8000) throw new ApiError(413, "발행 요청이 너무 큽니다.");
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new ApiError(400, "발행 요청을 확인해 주세요."); }
    const b = object(parsed, action === "preview" ? ["expected_revision"] : ["expected_revision", "confirmation", "confirmed", "request_id"]);
    if (!Number.isSafeInteger(b.expected_revision) || Number(b.expected_revision) < 1) throw new ApiError(400, "저장 개정번호를 확인해 주세요.");
    const saved = await supabaseFetch<{ editor: Record<string, unknown>; internal: PrivateEditor; context: Record<string, unknown>; revision: number }>("/rest/v1/rpc/and_os_5b_editor", { method: "POST", body: JSON.stringify({ p_actor: actor, p_id: headId, p_action: "get", p_mode: mode }) });
    if (saved.revision !== b.expected_revision) throw new ApiError(409, "작성본이 변경됐습니다. 다시 불러와 주세요.");
    validateIssuable(saved);
    validateSaleRequests(saved.editor as ReturnType<typeof calculateEditor>["publicEditor"],saved.internal);
    validatePricesIssuable(saved.editor as ReturnType<typeof calculateEditor>["publicEditor"], saved.internal);
    const frozen = await frozenWorkSource(headId);
    validateWorkIssuable(saved.editor, frozen.reference, frozen.sourceId);
    if (action === "preview") {
      const prepared = await supabaseFetch<{ document: unknown; fingerprint: string; revision: number }>("/rest/v1/rpc/and_os_5b_versions", { method: "POST", body: JSON.stringify({ ...args, p_revision: b.expected_revision }) });
      return json({ document: publicIssuedDocument(prepared.document), notices: reviewDetailedItems(saved.editor.items || []), confirmation: seal(actor, "detailed-issue", headId, `${prepared.revision}:${prepared.fingerprint}`) });
    }
    if (b.confirmed !== true) throw new ApiError(400, "최종 금액을 확인하고 발행을 승인해 주세요.");
    const proof = unseal(b.confirmation, actor, "detailed-issue", headId).split(":");
    if (Number(proof[0]) !== b.expected_revision || !/^[a-f0-9]{64}$/.test(proof[1])) throw new ApiError(409, "발행 확인 정보가 만료됐습니다. 다시 확인해 주세요.");
    const document = await supabaseFetch("/rest/v1/rpc/and_os_5b_versions", { method: "POST", body: JSON.stringify({ ...args,
      p_revision: b.expected_revision, p_request_id: id(b.request_id), p_fingerprint: proof[1] }) });
    return json(publicIssuedDocument(document), { status: 201 });
  } catch (error) { return failure(error); }
}
