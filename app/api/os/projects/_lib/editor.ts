import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { ApiError, getUserContext, json, supabaseFetch } from "../../_lib/server";
import { FoundationModeError, requireFoundationAction } from "./feature-state";
import { context, id, object } from "./foundation";
import { calculateEditor, editorInput, EditorValidationError, emptyEditor, Master, PrivateEditor } from "./editor-model";
import { standardCatalog } from "./standard-catalog";
import { reviewDetailedItems } from "../../../../../public/os-app/src/detailed-item-review.js";
import { validatePreliminaryInput } from "./preliminary";
import { frozenWorkSource, normalizeWorkReview } from "./work-review";
import { normalizeCompletion } from "./completion";
import { staffStandards, staffEditor, prepareStaffInput, processSaleCommands, applySaleApprovals, saleProjection } from "./sale-access";

async function catalog() {
  return supabaseFetch<Master[]>("/rest/v1/cost_items?select=item_code,item_name,category,unit,cost_price,is_active&is_active=eq.true&order=sort_order.asc,item_code.asc");
}
function noticesForRole(items: unknown[], role: string) {
  const notices=reviewDetailedItems(items);
  return role==="staff"?notices.map(n=>({itemIds:n.itemIds,names:n.names,scopeKnown:n.scopeKnown,message:"동일 시공 범위가 중복되지 않는지 확인해 주세요."})):notices;
}
function failure(error: unknown) {
  if (error instanceof FoundationModeError) return json({ error: error.message, code: error.mode === "READ_ONLY" ? "FOUNDATION_READ_ONLY" : "FOUNDATION_OFF" }, { status: error.status });
  if (error instanceof EditorValidationError) return json({ error: error.message }, { status: 400 });
  if (error instanceof ApiError) {
    try {
      const data = JSON.parse(error.message);
      const status = ({ "42501": 403, P0002: 404, "23514": 409, "23505": 409, "22023": 400, P5F01: 503, P5F02: 423 } as Record<string, number>)[data.code] || 500;
      return json({ error: status === 409 ? "연결 또는 개정 충돌입니다. 입력을 보관한 뒤 다시 불러와 주세요." : status === 403 ? "현재 프로젝트 접근 권한이 없습니다." : status === 423 ? "현재 읽기 전용입니다." : "본견적 요청을 처리하지 못했습니다." }, { status });
    } catch { return json({ error: /^[가-힣]/.test(error.message) ? error.message : "본견적 요청에 실패했습니다." }, { status: error.status }); }
  }
  // Never log raw rejected payloads, master rows or internal calculations.
  return json({ error: "본견적 요청을 처리하지 못했습니다." }, { status: 500 });
}
export async function editorRoute(request: NextRequest, draftId?: string, preview = false) {
  try {
    const user = await getUserContext(request), role = user.profile.role;
    if (!["admin", "manager", "staff"].includes(role)) throw new ApiError(403, "접근 권한이 없습니다.");
    const write = request.method !== "GET";
    const mode = requireFoundationAction(write ? "save" : "get");
    if (!draftId) {
      const profiles = await supabaseFetch<Array<{role: string}>>(`/rest/v1/profiles?id=eq.${id(user.authUser.id)}&select=role`);
      if (!profiles.length || !["admin", "manager", "staff"].includes(profiles[0].role)) throw new ApiError(403, "접근 권한이 없습니다.");
      if(role==="staff"&&new URL(request.url).searchParams.get("view")!=="standards")throw new ApiError(403,"표준 품목 검색을 이용해 주세요.");
      const rows = await catalog();
      if(role==="staff")return json(staffStandards(rows));
      if (new URL(request.url).searchParams.get("view") === "standards") return json(standardCatalog(rows, true));
      return json(rows.map(row => ({ code: row.item_code, name: row.item_name, category: row.category, unit: row.unit,
        saleUnitPrice: row.item_code === "MISC_EXISTING_PIPE_CLEANING" ? 300000 : Math.round(Number(row.cost_price) / .75), costUnit: Number(row.cost_price) })));
    }
    id(draftId);
    const args = { p_actor: user.authUser.id, p_id: draftId, p_mode: mode };
    const current = await supabaseFetch<{ editor: Record<string, unknown>; internal: PrivateEditor; context: Record<string, unknown>; revision: number }>("/rest/v1/rpc/and_os_5b_editor", { method: "POST", body: JSON.stringify({ ...args, p_action: "get" }) });
    if (!write) { const value=Object.keys(current.editor).length ? current.editor : emptyEditor();return json({ editor: role==="staff"?staffEditor(value as ReturnType<typeof calculateEditor>["publicEditor"]):value, priceReview:saleProjection(value as ReturnType<typeof calculateEditor>["publicEditor"],current.internal,user.authUser.id,role!=="staff"),notices: noticesForRole((current.editor.items || []) as unknown[],role), context: current.context, revision: current.revision,
      ...(role !== "staff" ? { internal: current.internal } : {}) }); }
    const raw = await request.text();
    if (raw.length > 1000000) throw new ApiError(413, "작성본이 너무 큽니다.");
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw new ApiError(400, "요청 형식을 확인해 주세요."); }
    const body = object(parsed, ["editor", "context", "expected_revision", "request_id", "internalChanges", "priceCommands"]);
    if (role === "staff" && body.internalChanges !== undefined) throw new ApiError(403, "원가·가격 기준 변경 권한이 없습니다.");
    if(role==="staff"&&Array.isArray(body.priceCommands)&&body.priceCommands.some(c=>c.action!=="request"&&c.action!=="review"))throw new ApiError(403,"가격 처리 권한이 없습니다.");
    const hash = createHash("sha256").update(JSON.stringify({ id: draftId, body })).digest("hex");
    if(!preview&&body.request_id){
      const events=await supabaseFetch<Array<{request_hash:string;detailed_estimate_id:string;result_refs:Record<string,unknown>}>>(`/rest/v1/detailed_estimate_events?actor_id=eq.${id(user.authUser.id)}&request_id=eq.${id(body.request_id)}&select=request_hash,detailed_estimate_id,result_refs`);
      if(Array.isArray(events)&&events.length){if(events[0].request_hash!==hash||events[0].detailed_estimate_id!==draftId)throw new ApiError(409,"같은 요청 식별자를 다른 내용에 사용할 수 없습니다.");return json(events[0].result_refs);}
    }
    const masters=await catalog();
    if(role==="staff")body.editor=prepareStaffInput(body.editor,current.editor as ReturnType<typeof calculateEditor>["publicEditor"],masters);
    const editor = body.editor as Record<string, unknown> | undefined;
    let frozen;
    if (editor?.preliminaryImport || current.editor.preliminaryImport || editor?.workReview || current.editor.workReview || (Array.isArray(editor?.items) && editor.items.some(i => i?.origin))) {
      frozen = await frozenWorkSource(draftId);
      validatePreliminaryInput(editor!, current.editor, frozen.reference, frozen.sourceId);
    }
    let calculated = calculateEditor(body.editor, current.internal, masters, role, body.internalChanges);
    const saleState=processSaleCommands(calculated.publicEditor,calculated.internal,current.editor as ReturnType<typeof calculateEditor>["publicEditor"],current.internal,body.priceCommands,user.authUser.id,role);
    if(Array.isArray(body.priceCommands)&&body.priceCommands.some(c=>c.action==="approve"))calculated=calculateEditor(editorInput(calculated.publicEditor),calculated.internal,masters,role);
    normalizeCompletion(calculated.publicEditor, current.editor, calculated.internal, current.internal, user.authUser.id, !preview);
    applySaleApprovals(calculated.publicEditor,calculated.internal,saleState,user.authUser.id,!preview,Array.isArray(body.priceCommands)?body.priceCommands.filter(c=>c.action==="approve").map(c=>c.id):[]);
    if (frozen) normalizeWorkReview(calculated.publicEditor, current.editor, frozen.reference, frozen.sourceId, user.authUser.id, !preview);
    const notices = noticesForRole(calculated.publicEditor.items,role);
    if (preview) return json({ editor: role==="staff"?staffEditor(calculated.publicEditor):calculated.publicEditor, priceReview:saleProjection(calculated.publicEditor,calculated.internal,user.authUser.id,role!=="staff"),notices, ...(role !== "staff" ? { internal: calculated.internal } : {}) });
    if (!Number.isSafeInteger(body.expected_revision) || Number(body.expected_revision) < 1) throw new ApiError(400, "개정번호가 필요합니다.");
    const requestId = id(body.request_id), ctx = context(body.context);
    const saved = await supabaseFetch<Record<string, unknown>>("/rest/v1/rpc/and_os_5b_editor", { method: "POST", body: JSON.stringify({ ...args, p_action: "save", p_context: ctx,
      p_public: calculated.publicEditor, p_internal: calculated.internal, p_revision: body.expected_revision, p_request_id: requestId, p_command_hash: hash }) });
    return json({ ...saved, notices });
  } catch (error) { return failure(error); }
}
