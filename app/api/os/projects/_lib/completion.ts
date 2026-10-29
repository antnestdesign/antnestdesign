import { ApiError } from "../../_lib/server";
import { PrivateEditor, calculateEditor } from "./editor-model";
import { quantityConfirmed, lossReviews } from "../../../../../public/os-app/src/detailed-completion.js";
type Editor = ReturnType<typeof calculateEditor>["publicEditor"];
type Obj = Record<string, unknown>;
const content = (v: Obj) => JSON.stringify(Object.fromEntries(Object.entries(v).filter(([key]) => !["actor", "at"].includes(key)).sort(([a],[b])=>a.localeCompare(b))));
export function normalizeCompletion(editor: Editor, previous: Obj, internal: PrivateEditor, before: PrivateEditor, actor: string, save: boolean) {
  const oldItems = (previous.items || []) as Editor["items"];
  const now = new Date().toISOString();
  for (const i of editor.items) {
    const old = oldItems.find(row => row.id === i.id)?.quantityConfirmation;
    if(!i.quantityConfirmation&&old)i.quantityConfirmation=structuredClone(old);
    const c = i.quantityConfirmation;
    if (c) {
      const unchanged = old && content(c) === content(old);
      delete c.actor; delete c.at;
      if (unchanged) { if (old.actor) c.actor = old.actor; if (old.at) c.at = old.at; }
      else if (save && quantityConfirmed(i,editor.spaces)) { c.actor = actor; c.at = now; }
    }
    const a = internal.items[i.id].priceApproval, previousApproval = before?.items?.[i.id]?.priceApproval;
    if (a) {
      const unchanged = previousApproval && a.stamp === previousApproval.stamp && a.reason === previousApproval.reason && !(previousApproval.invalidated && !a.invalidated);
      delete a.actor; delete a.at;
      if (unchanged) { if (previousApproval.actor) a.actor = previousApproval.actor; if (previousApproval.at) a.at = previousApproval.at; }
      else if (save) { a.actor = actor; a.at = now; }
    }
  }
}
export function validatePricesIssuable(editor: Editor, internal: PrivateEditor) {
  const pending = lossReviews(editor, internal).filter((r: { approved: boolean }) => !r.approved);
  if (pending.length) throw new ApiError(400, `${pending[0].item.name}: 관리자 또는 매니저가 예외 판매가격을 확인하고 사유를 저장해 주세요.`);
}
