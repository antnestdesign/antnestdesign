import { isDeepStrictEqual } from "node:util";
import { buildPreliminaryPlan, PRELIMINARY_MAPPING_VERSION } from "../../../../../public/os-app/src/detailed-preliminary.js";
import { EditorValidationError } from "./editor-model";
type Obj = Record<string, unknown>;
const fail = (): never => { throw new EditorValidationError("가견적 이관 출처가 일치하지 않습니다. 작성본을 다시 확인해 주세요."); };
export function validatePreliminaryInput(input: Obj, previous: Obj, reference: unknown, sourceId: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) fail();
  const old = previous.preliminaryImport as Obj | undefined, state = input.preliminaryImport as Obj | undefined;
  const items = input.items as Obj[], oldItems = (previous.items || []) as Obj[];
  if (!Array.isArray(items) || items.some(row => !row || typeof row !== "object" || Array.isArray(row))) return fail();
  const plan = buildPreliminaryPlan(reference, sourceId), candidates = new Map([...plan.rows, ...plan.suggestions].map(r => [r.key, r]));
  if (old && !state) fail();
  if (state) {
    if (state.sourceId !== sourceId || state.mappingVersion !== PRELIMINARY_MAPPING_VERSION || !Array.isArray(state.keys)) fail();
    const oldKeys = (old?.keys || []) as string[];
    if (oldKeys.some(k => !(state.keys as string[]).includes(k)) || (state.keys as string[]).some(k => !oldKeys.includes(k) && !candidates.has(k))) fail();
  }
  for (const row of items) {
    const before = oldItems.find(r => r.id === row.id);
    if (before?.origin && (!isDeepStrictEqual(before.origin, row.origin) || before.standardId !== row.standardId)) fail();
    if (!row.origin) continue;
    const origin = row.origin as Obj, expected = candidates.get(String(origin.key));
    if (!state || !(state.keys as string[]).includes(String(origin.key)) || origin.sourceId !== sourceId) fail();
    if (!before?.origin && (!expected || !isDeepStrictEqual(origin, expected.origin) || row.standardId !== expected.standardId)) fail();
  }
}
