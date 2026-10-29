import { escapeHtml as esc } from "./utils.js";
import { quantityModes, QUANTITY_LABELS, selectedSpaceIds, measuredSelection, quantityState } from "./detailed-measurement.js";
import { standardById } from "./detailed-standard-items.js";
import { quantityConfirmed, quantityNeedsReview } from "./detailed-completion.js";
const n = value => Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 6 });

export function renderPreliminaryPanel(plan, editor, trades, readOnly) {
  if (!plan?.sourceId) return "";
  const applied = new Set(editor.preliminaryImport?.keys || []), hasItems = editor.items.length > 0;
  return `<details class="preliminary-import" data-preliminary-panel ${!hasItems && !editor.preliminaryImport && !readOnly ? "open" : ""}><summary>${hasItems || editor.preliminaryImport ? "가견적에서 누락 항목 가져오기" : "가견적 기반 본견적 초기안"}${plan.reviews.length ? ` · 원본 공사 구성 ${plan.reviews.length}종` : ""}</summary>
    <p>저장된 참고 가견적의 공사·수량만 가져옵니다. 판매단가는 본견적 기준으로 계산합니다.</p>
    ${trades.map(([trade, label]) => { const rows = plan.rows.filter(r => r.trade === trade); return rows.length ? `<fieldset><legend>${esc(label)}</legend>${rows.map(r => {
      const used = applied.has(r.key) || editor.items.some(i => i.origin?.key === r.key), similar = editor.items.some(i => i.standardId === r.standardId);
      return `<label class="preliminary-choice"><input type="checkbox" data-import-key="${esc(r.key)}" ${used || readOnly ? "disabled" : ""} ${!used && !similar ? "checked" : ""}><span><strong>${esc(r.name)}</strong> · ${n(r.quantity)}${esc(r.unit)}${r.spec ? ` · ${esc(r.spec)}` : ""}<small>${used ? "이미 가져옴" : similar ? "유사 기존 품목 있음 · 추가 여부 확인" : r.origin.kind === "estimate" ? "실측 확인 필요" : "가견적에서 가져옴"} · ${esc(r.origin.label)}</small></span></label>`;
    }).join("")}</fieldset>` : ""; }).join("")}
    ${!plan.rows.length ? "<p>수량까지 확인되는 자동 연결 항목이 없습니다.</p>" : ""}
    ${!readOnly ? '<div class="detailed-actions"><button type="button" data-apply-preliminary>선택 공사 일괄 구성</button><button type="button" data-skip-preliminary>선택 없이 직접 작성</button></div>' : ""}</details>`;
}

export function renderQuantityPanel(item, spaces, choice, readOnly) {
  const ids = selectedSpaceIds(item), modes = quantityModes(item), basis = choice.basis;
  const measured = basis === "preliminary" && item.origin ? item.origin.unit === item.unit ? { value: item.origin.quantity, explanation: item.origin.label } : null
    : measuredSelection(item, spaces, basis, choice);
  const disabled = readOnly ? "disabled" : "";
  const spaceDisabled = readOnly || standardById(item.standardId)?.spaceAllowed === false ? "disabled" : "";
  return `<h4>수량 비교·보정</h4><p data-quantity-state>${quantityConfirmed(item,spaces) ? item.quantityConfirmation?.method==="keep"?"현재 수량 유지·확정":"수량 확인됨" : `${esc(quantityState(item, spaces))} · ${quantityNeedsReview(item, spaces) ? "수량 확인 필요" : "입력 수량"}`}</p>
    <dl class="quantity-comparison"><div><dt>가견적 수량</dt><dd>${item.origin ? item.origin.kind === "review" ? `원본 수량 미확정 · ${esc(item.origin.label)}` : `${n(item.origin.quantity)}${esc(item.origin.unit)} · ${esc(item.origin.label)}` : "가져온 수량 없음"}</dd></div><div><dt>현재 본견적 수량</dt><dd>${n(item.quantity)}${esc(item.unit)}</dd></div></dl>
    <fieldset class="quantity-spaces"><legend>실제 시공 공간</legend>${spaces.map(s => `<label><input type="checkbox" data-measure-space="${esc(s.id)}" ${ids.includes(s.id) ? "checked" : ""} ${spaceDisabled}>${esc(s.name)}</label>`).join("")}</fieldset>
    <label>수량 산정 기준<select data-measure="${item.id}" ${disabled}>${modes.map(m => `<option value="${m}" ${m === basis ? "selected" : ""}>${QUANTITY_LABELS[m]}</option>`).join("")}</select></label>
    ${["floorArea", "ceilingArea", "wallArea", "surfaceArea"].includes(basis) ? `<label>시공 제외 면적 (㎡)<input data-measure-param="excludeArea" type="number" min="0" step="any" value="${esc(choice.excludeArea ?? "")}" ${disabled}></label>` : ""}
    ${["롤", "장"].includes(item.unit) && ["floorArea", "ceilingArea", "wallArea", "surfaceArea"].includes(basis) ? `<div class="detailed-fields"><label>1${esc(item.unit)}당 적용 면적 (㎡)<input data-measure-param="coverage" type="number" min="0.001" step="any" value="${esc(choice.coverage ?? "")}" ${disabled}></label><label>자재 여유율 (%)<input data-measure-param="waste" type="number" min="0" step="any" value="${choice.waste == null ? "" : n((choice.waste - 1) * 100)}" ${disabled}></label></div>` : ""}
    <p data-measured-result>${measured ? `${esc(measured.explanation)}${measured.needsCoverage ? "" : ` = ${n(measured.value)}${esc(item.unit)}`}` : basis === "manual" ? "품목표에서 수량을 직접 수정할 수 있습니다." : "시공 공간과 해당 실측값을 확인해 주세요. 전체 공간을 자동 선택하지 않습니다."}</p>
    <div class="detailed-actions"><button type="button" data-apply-quantity ${readOnly || !measured || measured.needsCoverage || basis === "manual" ? "disabled" : ""}>확인 수량 적용</button><button type="button" data-keep-quantity ${disabled}>현재 수량 유지·확정</button><button type="button" data-manual-quantity ${disabled}>직접 수정</button><button type="button" data-confirm-manual-quantity ${disabled}>입력 수량 확정</button></div>`;
}
