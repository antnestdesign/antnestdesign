import { buildPreliminaryPlan } from "./detailed-preliminary.js";
import { reviewDetailedItems } from "./detailed-item-review.js";
import { selectedSpaceIds } from "./detailed-measurement.js";
import { quantityNeedsReview } from "./detailed-completion.js";
import { taskCoverage } from "./detailed-work-scope.js";

export const WORK_STATUS = { pending: "확인 필요", working: "작업 중", applied: "공사 구성 확인", excluded: "시공 제외 확정" };
export const workCanonical = v => JSON.stringify(v, function (k, value) { return value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value; });
const same = (a, b) => workCanonical(a) === workCanonical(b);
const validSale = i => !i.excluded && Number.isFinite(i.quantity) && i.quantity > 0 && Number.isSafeInteger(i.saleUnitPrice) && i.saleUnitPrice > 0;
// Only public, construction-relevant fields participate. Internal costs never enter review evidence.
export function workRowSnapshot(i, spaces) {
  const ids = selectedSpaceIds(i);
  return { id: i.id, standardId: i.standardId || "", name: i.name, trade: i.trade, spaceIds: [...ids],
    spec: i.spec, unit: i.unit, quantity: i.quantity, saleUnitPrice: i.saleUnitPrice, excluded: i.excluded,
    workScope: i.workScope || "", measurement: i.measurement || null,
    spaces: ids.map(id => spaces.find(s => s.id === id)).filter(Boolean).map(s => ({ id: s.id, name: s.name, floorArea: s.floorArea, ceilingArea: s.ceilingArea, height: s.height, walls: s.walls })) };
}
export function workDefinitions(reference, sourceId, editor) {
  const plan = buildPreliminaryPlan(reference, sourceId);
  const tasks = plan.reviews.map(r => ({ ...r, id: `${r.trade}:${r.inputs.join("+") || r.label}` }));
  // An explicitly skipped/deleted imported work also needs a recorded construction decision.
  for (const r of plan.rows) if (editor.workReview?.tasks.some(t => t.id === `missing:${r.key}`) || !editor.items.some(i => i.origin?.key === r.key && (!i.excluded || editor.workReview?.tasks.some(t => t.status === "excluded" && t.reason.trim() && t.itemIds.includes(i.id))))) {
    tasks.push({ id: `missing:${r.key}`, trade: r.trade, label: `${r.name} 반영 여부`, reason: "선택된 원본 공사가 현재 견적에 없습니다. 기존 품목 연결 또는 시공 제외를 확인해 주세요.", inputs: r.origin.inputs, standardIds: [r.standardId] });
  }
  return tasks;
}
export function relatedWorkRows(definition, editor) {
  return editor.items.filter(i => definition.standardIds?.includes(i.standardId) || (definition.trade === "carpentry" && /^std-WOOD_/.test(i.standardId || "")));
}
export function newWorkState(reference, sourceId, editor) {
  return { version: 1, sourceId, tasks: workDefinitions(reference, sourceId, editor).map(t => ({ id: t.id, status: "pending", itemIds: [], reason: "", scope: "", method: "", confirmedRows: [], evidence: Object.fromEntries(t.inputs.map(k => [k, reference.inputs?.[k] ?? null])) })), scopeConfirmations: [] };
}
export function taskProblem(definition, task, editor) {
  if (!task || !["applied", "excluded"].includes(task.status)) return "공사 처리 여부를 확인해 주세요.";
  if (!task.reason?.trim()) return "적용 또는 제외 사유를 입력해 주세요.";
  if (task.status === "excluded") return relatedWorkRows(definition, editor).some(i => !i.excluded) || task.itemIds.some(id => editor.items.some(i => i.id === id && !i.excluded)) ? "관련 품목이 견적에 포함되어 있습니다. 시공 범위와 합산 제외를 확인해 주세요." : "";
  if (!task.scope?.trim() || !task.itemIds.length) return "시공 범위와 연결 품목을 확인해 주세요.";
  const rows = task.itemIds.map(id => editor.items.find(i => i.id === id));
  if (rows.some(i => !i || !validSale(i) || !i.spec.trim())) return "연결 품목의 수량·규격·판매단가를 다시 확인해 주세요.";
  if (!rows.some(i => i.trade === definition.trade)) return "해당 공정의 실제 품목을 연결해 주세요.";
  if (definition.trade === "wallpaper" && definition.standardIds?.some(id => /WALLPAPER_ROLL_/.test(id)) && !rows.some(i => definition.standardIds.includes(i.standardId) && selectedSpaceIds(i).length)) return "선택 벽지와 적용 공간을 확인해 주세요.";
  if (definition.trade === "bathroom" && !rows.some(i => selectedSpaceIds(i).length)) return "적용 욕실 또는 타일 공간을 확인해 주세요.";
  if (definition.trade === "carpentry" && !["finished", "inputs", "manual"].includes(task.method)) return "목공 산정 방식을 선택해 주세요.";
  const construction = r => [r.id,r.standardId,r.name,r.trade,r.spaceIds,r.spec,r.unit,r.excluded,r.workScope];
  if (!same(task.confirmedRows.map(construction), rows.map(i => construction(workRowSnapshot(i, editor.spaces))))) return "연결 품목의 사양·공간·시공 범위가 변경됐습니다. 구성을 재확인해 주세요.";
  return "";
}
export function confirmWorkTask(definition, task, editor) {
  const next = { ...task, confirmedRows: task.itemIds.map(id => editor.items.find(i => i.id === id)).filter(Boolean).map(i => workRowSnapshot(i, editor.spaces)) };
  const problem = taskProblem(definition, next, editor);
  if (problem) throw new Error(problem);
  return next;
}
export function scopeSnapshot(notice, editor) { return notice.itemIds.slice().sort().map(id => workRowSnapshot(editor.items.find(i => i.id === id), editor.spaces)); }
export function workReadiness(reference, sourceId, editor) {
  const definitions = sourceId ? workDefinitions(reference, sourceId, editor) : [];
  const tasks = definitions.map(d => {
    const stored = editor.workReview?.tasks.find(t => t.id === d.id);
    const problem = taskProblem(d, stored, editor);
    return { ...d, task: stored, problem, status: problem && ["applied", "excluded"].includes(stored?.status) ? "pending" : stored?.status || "pending" };
  });
  const scopes = reviewDetailedItems(editor.items).filter(n => n.scopeKnown && !editor.workReview?.scopeConfirmations.some(a => a.reason.trim() && same(a.rows, scopeSnapshot(n, editor))));
  const missingSale = editor.items.filter(i => !i.excluded && !(Number.isSafeInteger(i.saleUnitPrice)&&i.saleUnitPrice>0));
  const unresolved = tasks.filter(t => t.problem).length;
  const quantityPending = editor.items.filter(i=>quantityNeedsReview(i,editor.spaces,editor));
  const coveragePending = tasks.flatMap(t=>taskCoverage(t,t.task,editor,reference).filter(c=>c.problem).map(c=>({...c,taskId:t.id,taskLabel:t.label})));
  return { tasks, unresolved, missingSale, scopes, quantityPending, coveragePending, ready: !unresolved && !missingSale.length && !scopes.length && !quantityPending.length && !coveragePending.length };
}

// Strict public JSON schema. Reject arbitrary nested keys rather than echoing private data in metadata.
export function cleanWorkReview(value) {
  const fail = () => { throw new Error("공사 확인 기록 형식을 확인해 주세요."); };
  const obj = (v, keys) => { if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).some(k => !keys.includes(k))) fail(); return v; };
  const str = (v, max = 500) => { if (typeof v !== "string" || v.length > max) fail(); return v; };
  const list = (v, max = 500) => { if (!Array.isArray(v) || v.length > max) fail(); return v; };
  const num = v => { if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e12) fail(); return v; };
  const row = v => {
    const r = obj(v, ["id", "standardId", "name", "trade", "spaceIds", "spec", "unit", "quantity", "saleUnitPrice", "excluded", "workScope", "measurement", "spaces"]);
    if (typeof r.excluded !== "boolean") fail();
    // Measurement itself is already validated on the actual row; preserve only canonical public keys.
    if (r.measurement !== null) { const m = obj(r.measurement, ["basis", "spaceIds", "value", "stamp", "explanation", "coverage", "waste", "excludeArea"]); str(m.basis); str(m.stamp, 20000); str(m.explanation); list(m.spaceIds, 100).forEach(id => str(id, 80)); for (const k of ["value", "coverage", "waste", "excludeArea"]) if (m[k] !== undefined) num(m[k]); }
    list(r.spaces, 100).forEach(s => { obj(s, ["id", "name", "floorArea", "ceilingArea", "height", "walls"]); str(s.id); str(s.name); [s.floorArea, s.ceilingArea, s.height].forEach(num); list(s.walls, 100).forEach(num); });
    for (const k of ["id", "standardId", "name", "trade", "spec", "unit", "workScope"]) str(r[k]);
    list(r.spaceIds, 100).forEach(id => str(id, 80)); num(r.quantity); num(r.saleUnitPrice);
    return structuredClone(r);
  };
  const state = obj(value, ["version", "sourceId", "tasks", "scopeConfirmations"]);
  if (state.version !== 1) fail(); str(state.sourceId, 80);
  const tasks = list(state.tasks, 600).map(v => {
    const t = obj(v, ["id", "status", "itemIds", "reason", "scope", "method", "confirmedRows", "evidence", "actor", "at", "coverage"]);
    if (!Object.hasOwn(WORK_STATUS, t.status)) fail(); str(t.id); str(t.reason); str(t.scope, 200); str(t.method, 30);
    const ids = list(t.itemIds).map(id => str(id, 80)); if (new Set(ids).size !== ids.length) fail();
    if (!t.evidence || typeof t.evidence !== "object" || Array.isArray(t.evidence) || Object.keys(t.evidence).length > 30) fail();
    for (const [k, v] of Object.entries(t.evidence)) { str(k, 100); if (v !== null && !["string", "number", "boolean"].includes(typeof v)) fail(); if (typeof v === "string") str(v); }
    if (t.actor !== undefined) str(t.actor, 80); if (t.at !== undefined) str(t.at, 80);
    if (t.coverage !== undefined) {
      const records=list(t.coverage,30); const ids=[];
      for(const c of records){obj(c,["id","decision","itemIds","reason","stamp"]);str(c.id,100);ids.push(c.id);if(!["pending","included","excluded"].includes(c.decision))fail();str(c.reason);str(c.stamp,30000);const linked=list(c.itemIds).map(id=>str(id,80));if(new Set(linked).size!==linked.length)fail();}
      if(new Set(ids).size!==ids.length)fail();
    }
    return { ...structuredClone(t), confirmedRows: list(t.confirmedRows).map(row) };
  });
  if (new Set(tasks.map(t => t.id)).size !== tasks.length) fail();
  const scopeConfirmations = list(state.scopeConfirmations).map(v => { const a = obj(v, ["reason", "rows", "actor", "at"]); str(a.reason); if (!a.reason.trim()) fail(); if (a.actor !== undefined) str(a.actor, 80); if (a.at !== undefined) str(a.at, 80); return { ...a, rows: list(a.rows, 2).map(row) }; });
  return { version: 1, sourceId: state.sourceId, tasks, scopeConfirmations };
}
