import { escapeHtml as esc } from "./utils.js";

export function mountStandardPicker({ host, items, spaces, recommended = [], readOnly, onAdd, message, privileged = true }) {
  const selected = new Set(), hints = new Set(recommended);
  let search = "", group = "", onlyRecommended = false;
  const money = n => n == null ? "단가 확인 필요" : `${Number(n).toLocaleString("ko-KR")}원`;
  host.innerHTML = `<section class="standard-picker" hidden><div class="standard-picker-heading"><h4>표준 시공 품목</h4><button type="button" data-standard-close>닫기</button></div>
    <div class="standard-picker-filters"><label>품목 검색<input type="search" data-standard-search></label><label>세부분류<select data-standard-group><option value="">전체</option>${[...new Set(items.map(i => i.group))].map(g => `<option>${esc(g)}</option>`).join("")}</select></label><label>추가할 공간<select data-standard-space><option value="">공통</option>${spaces.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></label></div>
    ${items.some(i => hints.has(i.id)) ? '<label class="standard-recommended-filter"><input type="checkbox" data-standard-recommended>가견적 참고 품목만</label>' : ""}
    <div data-standard-list class="standard-picker-list"></div><div class="standard-picker-footer"><span data-standard-count></span><button type="button" data-standard-add>선택 항목 추가</button></div></section>`;
  const panel = host.firstElementChild;
  function count() { host.querySelector("[data-standard-count]").textContent = `${selected.size}개 선택`; host.querySelector("[data-standard-add]").disabled = readOnly || selected.size === 0; }
  function renderRows() {
    const list = items.filter(i => (!group || i.group === group) && (!onlyRecommended || hints.has(i.id)) && `${i.name} ${i.spec} ${i.group}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
    host.querySelector("[data-standard-list]").innerHTML = list.map(i => `<label class="standard-picker-row"><input type="checkbox" data-standard-id="${i.id}" ${selected.has(i.id) ? "checked" : ""} ${readOnly ? "disabled" : ""}>
      <span><strong>${esc(i.name)}</strong><small>${privileged ? `${esc(i.estimationType || i.scope)} · ` : ""}${esc(i.group)} · ${esc(i.unit)}${privileged ? ` · ${i.linked ? "회사 품목 연결" : i.pricing === "tile" ? "타일 산식 적용" : "직접 단가"}` : ""}${hints.has(i.id) ? " · 가견적 참고" : ""}</small>${privileged ? `<small>${esc(i.note)}</small>` : ""}</span>
      <span class="standard-picker-price">${money(i.saleUnitPrice)}${privileged && Object.hasOwn(i, "costUnit") ? `<small>${i.costUnit == null ? i.pricing === "tile" ? "기존 타일 기준" : "원가 미등록" : `기준 원가 ${money(i.costUnit)}`}</small>` : ""}</span></label>`).join("") || '<p class="muted">일치하는 품목 없음</p>';
    count();
  }
  const input = event => {
    const n = event.target;
    if (n.matches("[data-standard-search]")) { search = n.value; renderRows(); }
    if (n.matches("[data-standard-group]")) { group = n.value; renderRows(); }
    if (n.matches("[data-standard-recommended]")) { onlyRecommended = n.checked; renderRows(); }
    if (n.dataset.standardId) { if (n.checked) selected.add(n.dataset.standardId); else selected.delete(n.dataset.standardId); count(); }
  };
  const click = event => {
    const button = event.target.closest("button"); if (!button) return;
    event.stopPropagation();
    if (button.hasAttribute("data-standard-close")) panel.hidden = true;
    if (button.hasAttribute("data-standard-add") && !readOnly) {
      const rows = items.filter(i => selected.has(i.id));
      if (!rows.length) { message("추가할 표준 품목을 선택해 주세요.", true); return; }
      const spaceId = host.querySelector("[data-standard-space]").value;
      if (onAdd(rows, spaceId)) { selected.clear(); count(); panel.hidden = true; }
    }
  };
  host.addEventListener("input", input); host.addEventListener("change", input); host.addEventListener("click", click); renderRows();
  return { open(id) { if(id&&items.some(i=>i.id===id)){selected.add(id);renderRows();}panel.hidden = false; host.querySelector("[data-standard-search]").focus({ preventScroll: true }); }, destroy() { host.removeEventListener("input", input); host.removeEventListener("change", input); host.removeEventListener("click", click); } };
}
