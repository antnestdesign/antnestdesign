import { ApiError, supabaseFetch } from "../../_lib/server";
import { EditorValidationError } from "./editor-model";
import { newWorkState, workDefinitions, workReadiness, workCanonical, taskProblem, scopeSnapshot, cleanWorkReview } from "../../../../../public/os-app/src/detailed-work-review.js";
import { reviewDetailedItems } from "../../../../../public/os-app/src/detailed-item-review.js";
import { requiredWorkScopes, taskCoverage } from "../../../../../public/os-app/src/detailed-work-scope.js";

type Obj = Record<string, unknown>;
export async function frozenWorkSource(headId: string) {
  const refs = await supabaseFetch<Array<{ reference_public_json: Obj; source_estimate_id: string }>>(`/rest/v1/detailed_estimate_references?detailed_estimate_id=eq.${headId}&select=reference_public_json,source_estimate_id`);
  if (refs.length !== 1) throw new ApiError(409, "가견적 참고 사본을 확인할 수 없습니다.");
  return { reference: refs[0].reference_public_json, sourceId: refs[0].source_estimate_id };
}
export function normalizeWorkReview(editor: Obj, previous: Obj, reference: Obj, sourceId: string, actor: string, save: boolean) {
  const state = editor.workReview as ReturnType<typeof cleanWorkReview> | undefined;
  const before = previous.workReview as ReturnType<typeof cleanWorkReview> | undefined;
  if (!state) { if (previous.workReview) throw new EditorValidationError("저장된 공사 확인 기록을 삭제할 수 없습니다."); return; }
  const fail = (message = "원본 공사 확인 근거가 일치하지 않습니다."): never => { throw new EditorValidationError(message); };
  if (state.sourceId !== sourceId) fail();
  const canonical = newWorkState(reference, sourceId, editor), definitions = workDefinitions(reference, sourceId, editor);
  for (const task of canonical.tasks) if (task.id.startsWith("missing:") && !state.tasks.some((t: Obj) => t.id === task.id)) state.tasks.push(task);
  if (state.tasks.length !== canonical.tasks.length) fail();
  if (before?.tasks.some((old: Obj) => !state.tasks.some((t: Obj) => t.id === old.id))) fail("저장된 공사 확인 이력을 삭제할 수 없습니다.");
  const now = new Date().toISOString();
  for (const t of state.tasks) {
    const expected = canonical.tasks.find(x => x.id === t.id), d = definitions.find(x => x.id === t.id);
    if (!expected || !d || workCanonical(expected.evidence) !== workCanonical(t.evidence)) fail();
    if (t.coverage?.some((c: Obj)=>!requiredWorkScopes(d,reference).some(s=>s.id===c.id))) fail("원본에 없는 공사 범위 확인 기록입니다.");
    const old = before?.tasks.find((x: Obj) => x.id === t.id);
    const content = (x: Obj) => workCanonical(Object.fromEntries(Object.entries(x).filter(([k]) => !["actor", "at"].includes(k))));
    const unchanged = old && content(t) === content(old);
    const problem = taskProblem(d, t, editor);
    if (["applied", "excluded"].includes(t.status) && problem) {
      if (unchanged) t.status = "pending";
      else fail(`${d.label}: ${problem}`);
    }
    if (t.status === "applied" && t.coverage !== undefined && taskCoverage(d,t,editor,reference).some(c=>c.problem) && !unchanged) fail("공사 범위별 실제 반영 품목과 제외 사유를 확인해 주세요.");
    if (unchanged && t.status === old.status) { if (old.actor) t.actor = old.actor; else delete t.actor; if (old.at) t.at = old.at; else delete t.at; }
    else { delete t.actor; delete t.at; if (save) { t.actor = actor; t.at = now; } }
  }
  const notices = reviewDetailedItems(editor.items);
  state.scopeConfirmations = state.scopeConfirmations.filter((a: Obj) => notices.some(n => workCanonical(scopeSnapshot(n, editor)) === workCanonical(a.rows)) || !before?.scopeConfirmations.some((old: Obj) => workCanonical(old.rows) === workCanonical(a.rows) && old.reason === a.reason));
  for (const a of state.scopeConfirmations) {
    if (!notices.some(n => workCanonical(scopeSnapshot(n, editor)) === workCanonical(a.rows))) fail("시공 범위 확인 품목이 변경됐습니다. 다시 확인해 주세요.");
    const old = before?.scopeConfirmations.find((x: Obj) => x.reason === a.reason && workCanonical(x.rows) === workCanonical(a.rows));
    delete a.actor; delete a.at;
    if (old) { if (old.actor) a.actor = old.actor; if (old.at) a.at = old.at; }
    else if (save) { a.actor = actor; a.at = now; }
  }
}
export function validateWorkIssuable(editor: Obj, reference: Obj, sourceId: string) {
  const ready = workReadiness(reference, sourceId, editor);
  if (ready.unresolved) throw new ApiError(400, `미확정 공사 ${ready.unresolved}건을 처리하고 저장해 주세요. ${ready.tasks.filter(t => t.problem).slice(0, 3).map(t => t.label).join(" · ")}`);
  if (ready.missingSale.length) throw new ApiError(400, `${ready.missingSale[0].name}: 수량·판매단가를 확정해 주세요.`);
  if (ready.coveragePending.length) throw new ApiError(400, `${ready.coveragePending[0].label}: 원본 공사 범위의 반영·제외와 연결 품목을 확인하고 저장해 주세요.`);
  if (ready.quantityPending.length) throw new ApiError(400, `${ready.quantityPending[0].name}: 수량을 검토한 뒤 실측 적용·현재 수량 유지·직접 수정 중 하나로 확인하고 저장해 주세요.`);
  if (ready.scopes.length) throw new ApiError(400, "동일 시공 범위의 중복 가능성을 확인하고 사유를 저장해 주세요.");
}
