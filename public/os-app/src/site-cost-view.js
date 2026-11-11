import { escapeHtml as esc } from "./utils.js";
const n = value => Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 6 });
const groupTrades = { demolition: "Demolition", electrical: "Electrical", standardLighting: "Electrical", bathroom: "Bathroom", tile: "Bathroom", wallpaper: "Wallpaper", film: "Film", flooring: "Flooring", carpentry: "Carpentry", door: "Carpentry", misc: "Finish", silicone: "Finish", elastic: "Finish" };
const labels = { Demolition: "철거", Electrical: "전기·조명", Bathroom: "욕실·타일", Wallpaper: "도배", Film: "필름", Flooring: "바닥", Carpentry: "목공", Furniture: "가구", Finish: "마감·기타" };
export function mountSiteCostView({ document, canView, canStandardEdit, readConfig, writeConfig, changed, openStandard }) {
  let rows = [], ready = false;
  const hosts = new Map();
  for (const trade of Object.keys(labels)) {
    const panel = document.getElementById(`preliminary-section${trade}Enabled`);
    if (!panel) continue;
    const node = document.createElement("details"); node.className = "site-cost-composition"; node.hidden = true;
    node.dataset.siteCostTrade = trade; panel.append(node); hosts.set(trade, node);
  }
  const config = () => { try { return JSON.parse(readConfig() || '{"version":1,"rows":{}}'); } catch { return { version: 1, rows: {} }; } };
  const peer = row => ["WOOD_LABOR_WORKER","WOOD_MACHINE_DAY"].includes(row.code) ? rows.find(r=>r.work===row.work&&r.code!==row.code&&["WOOD_LABOR_WORKER","WOOD_MACHINE_DAY"].includes(r.code)) : null;
  function clear() { rows = []; ready = false; for (const node of hosts.values()) { node.replaceChildren(); node.hidden = true; } }
  function render(nextRows) {
    if (!canView()) { clear(); return; }
    rows = nextRows || []; ready = true;
    for (const [trade, node] of hosts) {
      const list = rows.filter(r => (groupTrades[r.group] || "Furniture") === trade);
      const works = [...new Set(list.map(r => r.work))]; node.hidden = false;
      node.innerHTML = `<summary>현장 원가 구성${list.length ? ` · ${list.length}개` : ""}</summary><div class="site-cost-heading"><strong>${labels[trade]} · 현재 견적에만 적용</strong><button type="button" data-site-standard="${trade}">${canStandardEdit() ? "회사 표준 원가 수정" : "회사 표준 원가 조회"}</button></div>${works.map(work => {
        const items = list.filter(r => r.work === work), totals = kind => items.filter(r => r.kind === kind).reduce((s,r)=>s+r.amount,0);
        return `<section class="site-cost-work"><h4>${esc(items[0].workLabel)}</h4><div class="site-cost-scroll"><table><thead><tr><th>항목·산출 근거</th><th>적용 수량</th><th>단위</th><th>현장 단가</th><th>원가</th><th>상태·복원</th></tr></thead><tbody>${items.map(r => `<tr><td><strong>${esc(r.name)}</strong><small>${esc(r.formula)}</small><small>${esc(r.source)}${r.missing ? " · 가격 미등록" : ""}</small></td><td><input type="number" min="0" max="1000000" step="any" data-site-key="${esc(r.key)}" data-site-field="quantity" value="${r.quantity}" ${r.adjustable ? "" : "readonly"} aria-label="${esc(r.name)} 현장 수량"></td><td>${esc(r.unit)}</td><td><input type="number" min="0" max="1000000000" step="any" data-site-key="${esc(r.key)}" data-site-field="price" value="${r.price ?? ""}" placeholder="미등록" ${r.adjustable ? "" : "readonly"} aria-label="${esc(r.name)} 현장 단가"></td><td>${r.missing ? "미산정" : `${n(r.amount)}원`}</td><td><small>${r.manualQuantity ? "수동 수량" : "자동 산출"}${r.manualPrice ? " · 현장 단가" : ""}${r.stale ? " · 공사 수량 변경 확인 필요" : ""}</small><div class="site-cost-actions">${r.manualQuantity ? `<button type="button" data-site-action="auto" data-site-key="${esc(r.key)}">자동 재산출</button>` : ""}${r.stale ? `<button type="button" data-site-action="keep" data-site-key="${esc(r.key)}">수동값 유지</button>` : ""}${r.manualPrice || r.manualQuantity ? `<button type="button" data-site-action="reset" data-site-key="${esc(r.key)}">기준값 복원</button>` : ""}</div></td></tr>`).join("")}</tbody></table></div><dl class="site-cost-totals"><div><dt>노무</dt><dd>${n(totals("labor"))}원</dd></div><div><dt>장비</dt><dd>${n(totals("equipment"))}원</dd></div><div><dt>자재·기타</dt><dd>${n(totals("material"))}원</dd></div><div><dt>총원가</dt><dd>${n(items.reduce((s,r)=>s+r.amount,0))}원</dd></div><div><dt>고객 판매금액</dt><dd>${n(items.reduce((s,r)=>s+r.sale,0))}원</dd></div></dl>${items.some(r=>r.missing)?'<p class="site-cost-warning">미등록 단가가 있어 금액이 완성되지 않았습니다.</p>':""}${work === "fan" ? '<p class="site-cost-warning">실링팬 보강 자재 구성은 별도 확인이 필요합니다.</p>' : ""}</section>`;
      }).join("") || "<p>현재 선택된 공사의 산출 내역이 없습니다.</p>"}`;
    }
  }
  function input(event) {
    const node = event.target, field = node.dataset?.siteField;
    if (!field || !canView() || !ready) return;
    event.stopPropagation();
    const row = rows.find(r => r.key === node.dataset.siteKey); if (!row?.adjustable) return;
    const value = node.value === "" ? undefined : Number(node.value);
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > (field === "price" ? 1e9 : 1e6))) { node.setCustomValidity("허용 범위의 수치를 입력해 주세요."); node.reportValidity(); return; }
    node.setCustomValidity("");
    const next = config(), entry = next.rows[row.key] || {};
    if (value === undefined) delete entry[field]; else entry[field] = value;
    if (field === "quantity") entry.basis = row.basis;
    next.rows[row.key] = entry;
    const linked=peer(row);if(field==="quantity"&&linked){const value=next.rows[linked.key]||{};if(entry.quantity===undefined){delete value.quantity;delete value.basis;}else{value.quantity=entry.quantity;value.basis=linked.basis;}next.rows[linked.key]=value;}
    writeConfig(JSON.stringify(next)); changed();
  }
  function click(event) {
    const button = event.target.closest("[data-site-action],[data-site-standard]"); if (!button || !canView()) return;
    event.preventDefault(); event.stopPropagation();
    if (button.dataset.siteStandard) { openStandard(labels[button.dataset.siteStandard]); return; }
    const row = rows.find(r=>r.key===button.dataset.siteKey); if (!row) return;
    const next = config(), entry = next.rows[row.key] || {};
    if (button.dataset.siteAction === "reset") delete next.rows[row.key];
    else if (button.dataset.siteAction === "auto") { delete entry.quantity; delete entry.basis; next.rows[row.key] = entry; }
    else { entry.basis = row.basis; next.rows[row.key] = entry; }
    const linked=peer(row);
    if(linked){const other=next.rows[linked.key]||{};if(button.dataset.siteAction==="keep")other.basis=linked.basis;else{delete other.quantity;delete other.basis;}next.rows[linked.key]=other;}
    writeConfig(JSON.stringify(next)); changed();
  }
  // Stop local numeric controls before the application's global input adapter.
  for (const node of hosts.values()) { node.addEventListener("input", e=>e.stopPropagation()); node.addEventListener("change", input); node.addEventListener("click", click); }
  return { render, clear };
}
