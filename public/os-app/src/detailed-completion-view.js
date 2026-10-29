import { escapeHtml as esc } from "./utils.js";
import { quantityNeedsReview, lossReviews } from "./detailed-completion.js";
const money = n => `${Math.round(Number(n)||0).toLocaleString("ko-KR")}원`;
export function renderQuantityReviews(editor, readOnly) {
  const pending=editor.items.filter(i=>quantityNeedsReview(i,editor.spaces,editor));
  return `<h3>수량 확인 필요 ${pending.length}개</h3>${pending.length?`<button type="button" data-confirm-selected-quantities ${readOnly?"disabled":""}>선택 수량 일괄 확인</button><ul>${pending.map(i=>`<li><label><input type="checkbox" data-quantity-select="${i.id}" ${readOnly?"disabled":""}>${esc(i.name)}</label> · ${i.quantity}${esc(i.unit)} <button type="button" data-review-item="${i.id}">수량 검토</button><button type="button" data-confirm-kept="${i.id}" ${readOnly?"disabled":""}>현재 수량 유지·확정</button></li>`).join("")}</ul>`:""}`;
}
export function renderPriceReviews(editor, internal, readOnly) {
  if(!internal)return "";
  const losses=lossReviews(editor,internal),unknown=editor.items.filter(i=>!i.excluded&&internal.items?.[i.id]?.cost==null).length;
  return `<h3>판매금액 확인 필요 ${losses.filter(r=>!r.approved).length}개</h3>${unknown?`<p>원가 미등록 ${unknown}개 · 판매단가 미확정과는 별도로 관리합니다.</p>`:""}${losses.map(r=>`<section class="price-review-row"><strong>${esc(r.item.name)} · 원가 이하 판매</strong><p>판매금액 ${money(r.revenue)} · 직접원가 ${money(r.cost)} · 이익 ${money(r.profit)}</p>${r.approved?`<p>예외 가격 확인됨 · ${esc(r.approval.reason)}${r.approval.actor?" · 승인 기록 저장됨":" · 저장 필요"}</p>`:`<label>예외 판매 사유<input data-loss-reason="${r.item.id}" maxlength="500" ${readOnly?"disabled":""}></label><button type="button" data-approve-price="${r.item.id}" ${readOnly?"disabled":""}>예외 판매가격 확인</button>`}</section>`).join("")}`;
}
