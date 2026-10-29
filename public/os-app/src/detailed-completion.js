import { measuredSelection, measurementChanged, selectedSpaceIds } from "./detailed-measurement.js";
import { detailedLineAmount } from "./detailed-money.js";

export function quantityStamp(item, spaces, method) {
  const live = method === "measured" && item.measurement ? measuredSelection(item, spaces, item.measurement.basis, item.measurement) : null;
  return JSON.stringify([item.quantity, item.unit, method === "measured" ? selectedSpaceIds(item) : [], method === "measured" ? live?.stamp || null : null]);
}
export function quantityConfirmed(item, spaces) {
  const c = item.quantityConfirmation;
  if (c) return c.quantity === item.quantity && c.unit === item.unit && c.stamp === quantityStamp(item, spaces, c.method)
    && (c.method !== "measured" || (item.measurement?.value === item.quantity && !measurementChanged(item, spaces)));
  // Earlier explicit measurement applications remain valid evidence; importing an estimate is not confirmation.
  return Boolean(item.measurement && !item.quantityManual && item.quantity === item.measurement.value && !measurementChanged(item, spaces));
}
export function quantityNeedsReview(item, spaces, editor) {
  const changedEvidence=editor?.workReview?.tasks.some(t=>t.confirmedRows.some(r=>r.id===item.id&&(r.quantity!==item.quantity||r.unit!==item.unit)));
  return !item.excluded && (!(item.quantity>0) || Boolean(item.quantityConfirmation || item.quantityManual || ["estimate", "review"].includes(item.origin?.kind) || item.measurement || changedEvidence) && !quantityConfirmed(item, spaces));
}
export function confirmQuantity(item, spaces, method) {
  if (!["keep", "manual", "measured"].includes(method) || !(item.quantity > 0) || !item.unit?.trim()) throw new Error("확정할 수량과 단위를 확인해 주세요.");
  if (method === "measured" && (!item.measurement || item.quantity !== item.measurement.value || measurementChanged(item, spaces))) throw new Error("현재 실측을 적용한 뒤 수량을 확인해 주세요.");
  return { method, quantity: item.quantity, unit: item.unit, stamp: quantityStamp(item, spaces, method) };
}
export function priceStamp(item, detail) {
  const r=detail.tileRule;
  return JSON.stringify([item.id, item.quantity, item.unit, item.saleUnitPrice, detail.cost, detail.costUnit, detail.masterCode || "", r?[r.version,r.labor,r.waste,r.boxArea,r.boxCost]:null]);
}
export function lossReviews(editor, internal) {
  if (!internal) return [];
  const amount=i=>detailedLineAmount(i.kind==="fixed"?1:i.quantity,i.saleUnitPrice||0);
  return editor.items.filter(i => !i.excluded && internal.items?.[i.id]?.cost != null && amount(i) < internal.items[i.id].cost).map(i => {
    const detail = internal.items[i.id], approval = detail.priceApproval;
    return { item: i, revenue: amount(i), cost: detail.cost, profit: amount(i) - detail.cost,
      approved: Boolean(!approval?.invalidated && approval?.reason?.trim() && approval.stamp === priceStamp(i, detail)), approval };
  });
}
