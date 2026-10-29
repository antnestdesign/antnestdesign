import { escapeHtml as esc } from "./utils.js";
import { detailedLineAmount } from "./detailed-money.js";
import { STANDARD_ITEMS, standardById, recommendedStandardIds } from "./detailed-standard-items.js";
import { mountStandardPicker } from "./detailed-standard-picker.js";
import { reviewDetailedItems, itemReviewText } from "./detailed-item-review.js";
import { buildPreliminaryPlan, preliminaryComparison, PRELIMINARY_MAPPING_VERSION } from "./detailed-preliminary.js";
import { quantityModes, selectedSpaceIds, measuredSelection, quantityState as originalQuantityState, measurementChanged, QUANTITY_LABELS } from "./detailed-measurement.js";
import { renderPreliminaryPanel, renderQuantityPanel } from "./detailed-quantity-view.js";
import { workReadiness, newWorkState, scopeSnapshot, workCanonical } from "./detailed-work-review.js";
import { renderWorkList, mountWorkPanel } from "./detailed-work-panel.js";
import { confirmQuantity, quantityConfirmed, lossReviews, priceStamp } from "./detailed-completion.js";
import { renderQuantityReviews, renderPriceReviews } from "./detailed-completion-view.js";
import { renderSaleReview, renderSaleProposal } from "./detailed-sale-view.js";

export const EDITOR_TRADES = [
  ["demolition", "철거·인허가"], ["electrical", "전기·조명"], ["bathroom", "욕실·타일"],
  ["wallpaper", "도배"], ["film", "필름"], ["flooring", "바닥"], ["carpentry", "목공"], ["furniture", "가구"], ["finish", "마감·기타"],
];
const money = v => `${Math.round(Number(v) || 0).toLocaleString("ko-KR")}원`;
const quantityState=(item,spaces)=>quantityConfirmed(item,spaces)?item.quantityConfirmation?.method==="keep"?"현재 수량 유지·확정":item.quantityConfirmation?.method==="manual"?"직접 입력 수량 확정":"실측 수량 확인됨":originalQuantityState(item,spaces);
export function publicEditorInput(editor) {
  const copy = structuredClone(editor);
  copy.items = copy.items.map(item => { const row = { ...item }; delete row.amount; return row; });
  return copy;
}
export function editorPublicTotals(editor) {
  const groups = EDITOR_TRADES.map(([trade]) => ({ trade, total: editor.items.filter(i => i.trade === trade && !i.excluded)
    .reduce((sum, i) => sum + detailedLineAmount(i.kind === "fixed" ? 1 : i.quantity, i.saleUnitPrice || 0), 0) }));
  const subtotal = groups.reduce((sum, g) => sum + g.total, 0), rawSupply = subtotal + editor.addition - editor.discount;
  const supply = Math.floor(rawSupply / 1000) * 1000, vat = Math.round(supply * .1);
  return { groups, subtotal, rawSupply, supply, rounding: supply - rawSupply, vat, total: supply + vat };
}

export function mountDetailedEditor({ host, initial, catalog, standards, reference, sourceId, request, draftId, readOnly, changed, message, summaryChanged = () => {}, uiState = {} }) {
  let editor = structuredClone(initial.editor), internal = initial.internal, generation = 0, pricedGeneration = 0, timer;
  let trade = uiState.trade || "demolition", section = uiState.section || "items";
  let spaceId = editor.spaces.some(s => s.id === uiState.spaceId) ? uiState.spaceId : editor.spaces[0]?.id;
  let itemId = uiState.itemId || null, search = "", catalogCode = "";
  const changes = {}, privileged = internal !== undefined, invalid = new Set(), priceReasons = new Map();
  const priceCommands=[],quantitySelection=new Set();let priceReview=initial.priceReview||{requests:[],needsReview:[]};
  const changedPrice = id => {
    if(changes.priceApprovals)delete changes.priceApprovals[id];
    if(internal?.items?.[id]?.priceApproval){
      internal.items[id].priceApproval.invalidated=true;
      changes.revokedPriceApprovals ||= [];
      if(!changes.revokedPriceApprovals.includes(id))changes.revokedPriceApprovals.push(id);
    }
  };
  const standardItems = standards || STANDARD_ITEMS.map(i=>({...i,masterCode:"",linked:false,saleUnitPrice:null})), recommendations = recommendedStandardIds(reference);
  const plan = buildPreliminaryPlan(reference, sourceId || initial.editor.preliminaryImport?.sourceId || ""), measureChoices = new Map();
  let picker, workPanel;
  const input = (label, attrs, value = "", type = "text") => `<label>${label}<input ${attrs} type="${type}" ${type === "number" ? 'min="0" step="any"' : 'maxlength="500"'} value="${esc(label === "수량 근거" ? QUANTITY_LABELS[value] || value || "" : value ?? "")}"></label>`;
  const price = (label, attrs, value) => input(label, `${attrs} data-money inputmode="numeric"`, value == null ? "" : Number(value).toLocaleString("ko-KR"));
  const options = (values, selected) => values.map(([value, label]) => `<option value="${esc(value)}" ${value === selected ? "selected" : ""}>${esc(label)}</option>`).join("");
  const selectedSpace = () => editor.spaces.find(s => s.id === spaceId);
  const rows = () => editor.items.filter(i => i.trade === trade);
  const selectedItem = () => editor.items.find(i => i.id === itemId);
  const choiceFor = i => {
    const modes = quantityModes(i);
    if (!measureChoices.has(i.id)) measureChoices.set(i.id, { ...(i.measurement || {}), basis: i.measurement?.basis || modes.find(m => !["preliminary", "manual"].includes(m)) || "manual" });
    const choice = measureChoices.get(i.id); if (!modes.includes(choice.basis)) choice.basis = "manual";
    return choice;
  };
  const measurementFor = i => { const choice = choiceFor(i); return choice.basis === "preliminary" ? i.origin && i.origin.unit === i.unit ? { value: i.origin.quantity, explanation: i.origin.label } : null : measuredSelection(i, editor.spaces, choice.basis, choice); };
  const quantityPanel = () => { const i = selectedItem(), node = host.querySelector("[data-quantity-panel]"); if (i && node) node.innerHTML = renderQuantityPanel(i, editor.spaces, choiceFor(i), readOnly); };
  const measuredResult = () => {
    const i = selectedItem(), value = i && measurementFor(i), node = host.querySelector("[data-measured-result]");
    if (node) node.textContent = value ? `${value.explanation}${value.needsCoverage ? "" : ` = ${value.value.toLocaleString("ko-KR")}${i.unit}`}` : "시공 공간과 산정 기준을 확인해 주세요.";
    const button = host.querySelector("[data-apply-quantity]"); if (button) button.disabled = readOnly || !value || value.needsCoverage;
  };
  const missingCost = i => !i.excluded && !i.masterCode && i.kind !== "tile" && changes.items?.[i.id]?.costUnit === undefined && (!internal?.items?.[i.id] || internal.items[i.id].costConfigured === false);
  const fieldKey = n => `${n.dataset.item || n.dataset.private || n.dataset.tile || "summary"}:${n.dataset.field || n.dataset.editorField}`;
  const lock = () => {
    if (readOnly) host.querySelectorAll("input,select,button:not([data-editor-trade]):not([data-editor-section]):not([data-select-space]):not([data-select-item]):not([data-work-open])").forEach(n => { n.disabled = true; });
  };
  const totals = () => {
    const s = editorPublicTotals(editor);
    const hasMissing = privileged && editor.items.some(missingCost);
    host.querySelector("[data-editor-totals]").innerHTML = `<dl class="editor-totals"><div><dt>공정 합계</dt><dd>${money(s.subtotal)}</dd></div><div><dt>최종 견적 단위조정</dt><dd>${money(s.rounding)}</dd></div><div><dt>공급가액</dt><dd>${money(s.supply)}</dd></div><div><dt>부가세</dt><dd>${money(s.vat)}</dd></div><div><dt>공급대가</dt><dd>${money(s.total)}</dd></div></dl>${privileged && internal?.costTotal !== undefined ? `<dl class="editor-totals"><div><dt>직접원가</dt><dd>${hasMissing || internal.costTotal == null ? "미설정 항목 있음" : money(internal.costTotal)}</dd></div><div><dt>이익</dt><dd>${hasMissing || internal.profit == null ? "—" : money(internal.profit)}</dd></div><div><dt>매출이익률</dt><dd>${hasMissing || internal.marginRate == null ? "—" : `${(internal.marginRate * 100).toFixed(1)}%`}</dd></div></dl>` : ""}`;
    summaryChanged(s);
    const comparison = host.querySelector("[data-preliminary-comparison]"), amounts = preliminaryComparison(reference, s);
    const readiness = workReadiness(reference, plan.sourceId, editor);
    const pricePending=privileged?lossReviews(editor,internal).filter(r=>!r.approved).length:0,complete=readiness.ready&&!pricePending;
    if (comparison) comparison.innerHTML = amounts.comparable ? `<span>참고 가견적 ${money(amounts.referenceAmount)}</span><span>${complete ? "최종 본견적" : "현재 산정된 본견적"} ${money(amounts.currentAmount)}</span><span>공사 구성 미처리 ${readiness.unresolved}건 · 범위 확인 ${readiness.coveragePending.length}건</span><span>수량 확인 필요 ${readiness.quantityPending.length}개 · 판매금액 확인 필요 ${readiness.missingSale.length+pricePending}개</span><strong>${complete ? "최종 차이" : "잠정 차이"} ${money(amounts.difference)} · ${amounts.rate == null ? "증감률 —" : `${(amounts.rate * 100).toFixed(1)}%`}</strong><small>공급가액끼리 비교 · 부가세 별도</small>${complete ? "" : '<p>공사 구성·수량·판매금액 확인이 남아 있습니다.</p>'}${privileged?"":"<small>공식 발행은 매니저·관리자 확인 후 진행됩니다.</small>"}` : `<span>참고 가견적 ${amounts.referenceAmount == null ? "금액 확인 필요" : money(amounts.referenceAmount)}</span><small>금액·세금 기준이 확인되지 않아 차이와 증감률은 표시하지 않습니다.</small>`;
    if(comparison&&!privileged)comparison.innerHTML=`<span>참고 가견적 ${amounts.referenceAmount==null?"금액 확인 필요":money(amounts.referenceAmount)}</span><span>현재 본견적 공급가액 ${money(s.supply)}</span>`;
    const workList = host.querySelector('[data-work-list]'); if (workList) workList.innerHTML = renderWorkList(reference, plan.sourceId, editor,!privileged);
    const quantities=host.querySelector('[data-quantity-reviews]');if(quantities)quantities.innerHTML=renderQuantityReviews(editor,readOnly);
    for(const n of host.querySelectorAll('[data-quantity-select]'))n.checked=quantitySelection.has(n.dataset.quantitySelect);
    const prices=host.querySelector('[data-price-reviews]');if(prices){prices.innerHTML=renderPriceReviews(editor,internal,readOnly||generation!==pricedGeneration);for(const n of prices.querySelectorAll('[data-loss-reason]'))n.value=priceReasons.get(n.dataset.lossReason)||"";}
    const sale=host.querySelector('[data-sale-reviews]');if(sale)sale.innerHTML=renderSaleReview(editor,priceReview,privileged,readOnly||generation!==pricedGeneration);
    const review=host.querySelector('[data-simple-review]');if(review)review.innerHTML=`<h3>본견적 검토</h3><p>공사 구성 ${readiness.unresolved||readiness.coveragePending.length?"확인 필요":"완료"} · 시공 수량 확인 필요 ${readiness.quantityPending.length}개 · 판매가격 요청 승인 대기 ${(priceReview.requests||[]).filter(r=>r.state==="pending"&&!r.stale).length}개</p><button type="button" data-request-review ${readOnly?"disabled":""}>검토 요청</button>${priceReview.reviewRequested?'<span>검토 요청됨</span>':""}`;
    host.querySelectorAll("[data-quantity-badge]").forEach(n => { const i = editor.items.find(i => i.id === n.dataset.quantityBadge); if (i) n.textContent = quantityState(i, editor.spaces); });
    const itemReview = host.querySelector("[data-item-review]");
    if (itemReview) {
      const notices = reviewDetailedItems(editor.items); itemReview.hidden = !notices.length;
      itemReview.innerHTML = notices.length ? `<summary>시공 범위 확인 필요 ${notices.length}건</summary><ul>${notices.map((n,index) => `<li>${esc(n.message)} ${n.itemIds.map((id, index) => `<button type="button" data-review-item="${esc(id)}">${esc(n.names[index])} 확인</button>`).join(" ")}${n.scopeKnown ? editor.workReview?.scopeConfirmations.some(a=>workCanonical(a.rows)===workCanonical(scopeSnapshot(n,editor))) ? '<strong>별도 범위 확인됨</strong>' : `<label>별도 시공 범위·포함 항목 확인 사유<input data-scope-reason="${index}" maxlength="500" ${readOnly?"disabled":""}></label><button type="button" data-confirm-scope="${index}" ${readOnly?"disabled":""}>범위 확인 기록</button>` : ""}</li>`).join("")}</ul>` : "";
    }
    for (const [key] of EDITOR_TRADES) { const n=host.querySelector(`[data-trade-total="${key}"]`); if(n)n.textContent=money(s.groups.find(g=>g.trade===key).total); }
    const node=host.querySelector("[data-trade-internal]"), group=internal?.groups?.find(g=>g.trade===trade);
    if(node)node.textContent=rows().some(i=>!i.excluded) ? rows().some(missingCost) ? "원가 미설정 항목 있음 · 이익 — · 매출이익률 —" : group ? group.cost == null ? "원가 미설정 항목 있음 · 이익 — · 매출이익률 —" : `공정 직접원가 ${money(group.cost)} · 이익 ${money(group.profit)} · 매출이익률 ${((group.marginRate||0)*100).toFixed(1)}%` : "공정 금액 확인 중" : "공정 직접원가 — · 이익 — · 매출이익률 —";
    const rowAmounts=new Map([...host.querySelectorAll("[data-row-amount]")].map(n=>[n.dataset.rowAmount,n]));
    const details=new Map([...host.querySelectorAll("[data-row-internal]")].map(n=>[n.dataset.rowInternal,n]));
    const spaceSummaries=new Map([...host.querySelectorAll("[data-space-summary]")].map(n=>[n.dataset.spaceSummary,n]));
    for(const i of editor.items){const n=rowAmounts.get(i.id);if(n)n.textContent=money(i.excluded?0:detailedLineAmount(i.kind==="fixed"?1:i.quantity,i.saleUnitPrice||0));
      const summary=spaceSummaries.get(i.id),ids=selectedSpaceIds(i);if(summary){summary.hidden=ids.length<2;summary.textContent=ids.map(id=>editor.spaces.find(s=>s.id===id)?.name).filter(Boolean).join(" · ");}
      const detail=details.get(i.id),v=internal?.items?.[i.id];if(detail&&v?.cost!==undefined)detail.textContent=v.cost == null ? "원가 미설정 · 이익 — · 매출이익률 —" : `직접원가 ${money(v.cost)} · 이익 ${money(v.profit)} · 매출이익률 ${((v.marginRate||0)*100).toFixed(1)}%`;
    }
  };
  const preview=async()=>{
    if(invalid.size)return;const current=++generation;
    try{const result=await request(`/detailed-estimates/${draftId}/editor/preview`,{method:"POST",body:JSON.stringify({editor:publicEditorInput(editor),...(privileged?{internalChanges:changes}:{}),priceCommands})});
      if(current!==generation||!host.isConnected)return;internal=result.internal;priceReview=result.priceReview||priceReview;
      for(const row of editor.items){const value=result.editor.items.find(i=>i.id===row.id);if(value&&(row.saleUnitPrice==null||changes.reprice?.includes(row.id)||priceCommands.some(c=>c.action==="approve"))){
        row.saleUnitPrice=value.saleUnitPrice;const n=host.querySelector(`[data-item="${row.id}"][data-field="saleUnitPrice"]`);if(n)n.value=host.ownerDocument.activeElement===n?row.saleUnitPrice:Number(row.saleUnitPrice).toLocaleString("ko-KR");
        if(changes.reprice?.includes(row.id)){changes.items ||= {};changes.items[row.id] ||= {};changes.items[row.id].targetMargin=result.internal.items[row.id].targetMargin;}
      }}changes.reprice=[];pricedGeneration=current;totals();
    }catch(error){if(current===generation)message(error.message||"입력값을 확인해 주세요.",true);}
  };
  const touch=()=>{generation++;changed();if(editor.workReview){const notices=reviewDetailedItems(editor.items);editor.workReview.scopeConfirmations=editor.workReview.scopeConfirmations.filter(a=>notices.some(n=>workCanonical(scopeSnapshot(n,editor))===workCanonical(a.rows)));}totals();clearTimeout(timer);if(!readOnly)timer=setTimeout(preview,350);};
  const spaceMetrics=()=>{
    const s=selectedSpace();if(!s)return;
    s.walls.forEach((length,index)=>{const area=host.querySelector(`[data-wall-area="${index}"]`),height=host.querySelector(`[data-wall-height="${index}"]`);
      if(area)area.textContent=`${(length*s.height/1000).toLocaleString("ko-KR",{maximumFractionDigits:3})}㎡`;if(height)height.textContent=`${Number(s.height).toLocaleString("ko-KR")}mm`;
    });const total=host.querySelector("[data-wall-total]");if(total)total.textContent=`${s.walls.reduce((sum,length)=>sum+length*s.height/1000,0).toLocaleString("ko-KR",{maximumFractionDigits:3})}㎡`;
  };
  const renderSpaces=()=>{
    host.querySelector("[data-space-list]").innerHTML=editor.spaces.map(s=>`<button type="button" data-select-space="${s.id}" aria-pressed="${s.id===spaceId}">${esc(s.name)}</button>`).join("")+'<button type="button" data-add-space>공간 추가</button>';
    const s=selectedSpace();host.querySelector("[data-space-panel]").innerHTML=s?`<h3 data-space-heading>${esc(s.name)}</h3><div class="detailed-fields">${input("공간명",`data-space="${s.id}" data-field="name"`,s.name)}${input("바닥면적 (㎡)",`data-space="${s.id}" data-field="floorArea"`,s.floorArea,"number")}${input("천장면적 (㎡)",`data-space="${s.id}" data-field="ceilingArea"`,s.ceilingArea,"number")}${input("천장·벽 적용 높이 (mm)",`data-space="${s.id}" data-field="height"`,s.height,"number")}${input("메모",`data-space="${s.id}" data-field="memo"`,s.memo)}</div>
      <div class="editor-wall-heading"><h4>벽체 구간</h4><strong data-wall-total></strong><button type="button" data-add-wall="${s.id}">벽 구간 추가</button></div><div class="editor-wall-list">${s.walls.map((v,index)=>`<div class="editor-wall-row">${input(`벽 ${index+1} 길이 (m)`,`data-space="${s.id}" data-wall="${index}"`,v,"number")}<span>적용 높이 <output data-wall-height="${index}"></output></span><strong data-wall-area="${index}"></strong><button type="button" data-delete-wall="${index}">구간 삭제</button></div>`).join("")||'<p class="muted">등록된 벽 구간 없음</p>'}</div><button type="button" data-delete-space="${s.id}">공간 삭제</button>`:'<p>공간을 추가해 주세요.</p>';
    spaceMetrics();lock();
  };
  const renderCatalog=()=>{if(!privileged)return;host.querySelector("[data-catalog-select]").innerHTML=options([["","품목 선택"],...catalog.filter(c=>!/^SYSTEM_DB_|^SYNTHETIC_/i.test(c.code)&&!/^Synthetic cost$/i.test(c.name)&&`${c.name} ${c.category}`.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(c=>[c.code,`${c.name} · ${c.unit}`])],catalogCode);};
  const renderItemDetail=()=>{
    const i=editor.items.find(i=>i.id===itemId&&i.trade===trade),node=host.querySelector("[data-item-detail]");node.hidden=!i;if(!i){node.innerHTML="";totals();return;}
    const standard = standardById(i.standardId);
    const fixedSale = internal?.items?.[i.id]?.salePolicy === "pipe-fixed-v1" || (!internal?.items?.[i.id] && standard?.salePolicy === "pipe-fixed-v1");
    node.innerHTML=`<h4>선택 품목 상세</h4>${standard ? `<p class="muted">회사 표준 품목${privileged?` · ${esc(standard.estimationType || standard.scope)} · ${esc(standard.note)}`:""}</p>` : '<p class="muted">현장 품목</p>'}<div class="detailed-fields">${input("품목명",`data-item="${i.id}" data-field="name"`,i.name)}<label>금액 방식<select ${privileged?"":"disabled"} data-item="${i.id}" data-field="kind">${options(i.kind==="tile"?[["tile","비욕실 타일 면적"]]:[["quantity","수량 × 판매단가"],["fixed","정액"]],i.kind)}</select></label>${input("수량 근거",`data-item="${i.id}" data-field="basis"`,i.basis)}${input("적용 부위",`data-item="${i.id}" data-field="workScope" maxlength="200"`,i.workScope || "")}
      ${privileged?`${price("적용 원가단가",`data-private="${i.id}" data-field="costUnit"`,changes.items?.[i.id]?.costUnit??internal?.items?.[i.id]?.costUnit??catalog.find(c=>c.code===i.masterCode)?.costUnit??null)}${fixedSale ? '<p>기본 판매단가 300,000원 · 목표 이익률 자동 적용 제외</p>' : input("목표 매출이익률 (%)",`data-private="${i.id}" data-field="targetMargin"`,100*(changes.items?.[i.id]?.targetMargin??internal?.items?.[i.id]?.targetMargin??0),"number")}<button type="button" data-reprice="${i.id}">${fixedSale ? "기준 판매가 적용" : "판매가 재산정"}</button>`:""}</div>
      ${privileged?`<p data-row-internal="${i.id}"></p>${i.kind==="tile"?`<div class="detailed-fields">${[["labor","타일 노무비 (원/㎡)",""],["waste","자재 여유배율",""],["boxArea","박스 면적 (㎡)",""],["boxCost","박스 원가",""]].map(([key,label,fallback])=>input(label,`data-tile="${i.id}" data-field="${key}"`,changes.items?.[i.id]?.tileRule?.[key]??internal?.items?.[i.id]?.tileRule?.[key]??fallback,"number")).join("")}</div>`:""}`:""}
      ${renderSaleProposal(i,readOnly)}<section class="quantity-panel" data-quantity-panel></section><div class="editor-line-actions"><label><input type="checkbox" data-item="${i.id}" data-field="excluded" ${i.excluded?"checked":""}>합산 제외</label><button type="button" data-split="${i.id}">묶음 분리</button><button type="button" data-delete-item="${i.id}">삭제</button></div>`;
    if(privileged){const panel=host.ownerDocument.createElement('details');panel.className='editor-private-panel';panel.innerHTML='<summary>내부 원가·가격 관리</summary>';for(const n of [...node.querySelectorAll('[data-private],[data-reprice],[data-tile],[data-row-internal]')])panel.append(n.closest('label')||n);node.insertBefore(panel,node.querySelector('[data-quantity-panel]'));}
    quantityPanel();
    if(!privileged){
      const panel=host.ownerDocument.createElement('details');panel.dataset.staffItemDetails='';
      const title=host.ownerDocument.createElement('summary');title.textContent='품목 상세 · 수량 확인 · 가격 변경 요청';panel.append(title);
      while(node.firstChild)panel.append(node.firstChild);
      node.append(panel);
    }
    lock();totals();
  };
  const renderItems=()=>{
    picker?.destroy();
    const list=rows();if(!list.some(i=>i.id===itemId))itemId=list[0]?.id||null;
    host.querySelector("[data-items-panel]").innerHTML=`<h3>${EDITOR_TRADES.find(([key])=>key===trade)[1]}</h3>${privileged?'<p data-trade-internal></p>':""}
      <div class="editor-item-actions"><button type="button" data-open-standards>표준 품목 추가</button><button type="button" data-add-custom>현장 전용 품목</button>${trade==="bathroom"?'<button type="button" data-add-tile>비욕실 타일</button>':""}</div><div data-standard-host></div>
      ${privileged?`<details class="editor-master-direct"><summary>원가 품목 직접 선택</summary><div class="editor-add"><label>품목 검색<input type="search" data-catalog-search placeholder="품목명·공정 검색" value="${esc(search)}"></label><label>원가 품목<select data-catalog-select></select></label><button type="button" data-add-master>선택 품목 추가</button></div></details>`:""}
      <div class="editor-table-scroll" tabindex="0" aria-label="공정 품목 목록"><table class="editor-item-table"><colgroup><col style="width:18%"><col style="width:10%"><col style="width:14%"><col style="width:5%"><col style="width:8%"><col style="width:12%"><col style="width:12%"><col style="width:21%"></colgroup><thead><tr><th>품목명</th><th>공간</th><th>규격</th><th>단위</th><th>수량</th><th>판매단가</th><th>판매금액</th><th>비고</th></tr></thead><tbody>${list.map(i=>`<tr class="editor-line" data-line="${i.id}" aria-selected="${i.id===itemId}"><td><button type="button" data-select-item="${i.id}">${esc(i.name)}${i.excluded?" · 합산 제외":""}</button></td><td><label>공간<select data-item="${i.id}" data-field="spaceId">${options([["","공통"],...editor.spaces.map(s=>[s.id,s.name])],i.spaceId)}</select></label></td><td>${input("규격",`data-item="${i.id}" data-field="spec"`,i.spec)}</td><td>${input("단위",`data-item="${i.id}" data-field="unit"`,i.unit)}</td><td>${input("수량",`data-item="${i.id}" data-field="quantity" ${i.kind==="fixed"?"readonly":""}`,i.quantity,"number")}</td><td>${price(privileged?"판매단가":"표준 판매단가",`data-item="${i.id}" data-field="saleUnitPrice" ${privileged?"":"readonly"}`,i.saleUnitPrice)}</td><td class="editor-number"><strong data-row-amount="${i.id}"></strong></td><td>${input("비고",`data-item="${i.id}" data-field="memo"`,i.memo)}</td></tr>`).join("")||'<tr><td colspan="8">등록된 공사내역 없음</td></tr>'}</tbody></table></div><section class="editor-item-detail" data-item-detail></section>`;
    picker = mountStandardPicker({ host: host.querySelector("[data-standard-host]"), items: standardItems.filter(i=>i.trade===trade), spaces: editor.spaces, recommended: recommendations, readOnly, message, privileged,
      onAdd: (selected, space) => {
        if(editor.items.length+selected.length>500){message("작성본은 최대 500개 품목까지 추가할 수 있습니다.",true);return false;}
        const candidates=selected.map((s,index)=>({id:`pending-${index}`,standardId:s.id,name:s.name,spaceId:s.spaceAllowed?space:"",excluded:false}));
        const ids=new Set(candidates.map(i=>i.id)), notices=reviewDetailedItems([...editor.items,...candidates]).filter(n=>n.itemIds.some(id=>ids.has(id)));
        if(notices.length&&!host.ownerDocument.defaultView.confirm(`${itemReviewText(notices)}\n별도 시공 범위를 확인하고 추가할까요?`))return false;
        for(const standard of selected){add({name:standard.name,unit:standard.unit,code:standard.masterCode},standard.pricing==="tile"?"tile":"quantity");const i=editor.items.at(-1);i.standardId=standard.id;i.spec=standard.spec;i.spaceId=standard.spaceAllowed?space:"";if(!privileged)i.saleUnitPrice=standard.saleUnitPrice??0;else if(!standard.linked&&standard.pricing!=="tile")i.saleUnitPrice=0;}
        renderItems();touch();message(`${selected.length}개 표준 품목을 추가했습니다.`);return true;
      } });
    renderCatalog();renderItemDetail();lock();
    for (const i of list) {
      const badge = host.ownerDocument.createElement("small"); badge.dataset.quantityBadge = i.id; badge.textContent = quantityState(i, editor.spaces);
      host.querySelector(`[data-select-item="${i.id}"]`).parentElement.append(badge);
      const spaces=host.ownerDocument.createElement("small"),ids=selectedSpaceIds(i);spaces.dataset.spaceSummary=i.id;spaces.hidden=ids.length<2;spaces.textContent=ids.map(id=>editor.spaces.find(s=>s.id===id)?.name).filter(Boolean).join(" · ");host.querySelector(`[data-item="${i.id}"][data-field="spaceId"]`).parentElement.append(spaces);
    }
    for (const i of list) if (standardById(i.standardId)?.spaceAllowed === false) host.querySelector(`[data-item="${i.id}"][data-field="spaceId"]`).disabled = true;
  };
  const setSection=value=>{section=value;host.querySelector(".editor-layout").hidden=value!=="items";host.querySelector(".editor-spaces").hidden=value!=="spaces";host.querySelectorAll("[data-editor-section]").forEach(n=>n.setAttribute("aria-pressed",String(n.dataset.editorSection===value)));if(value==="items")quantityPanel();};
  const render=()=>{
    workPanel?.destroy();
    host.innerHTML=`<div class="preliminary-comparison" data-preliminary-comparison></div>${renderPreliminaryPanel(plan, editor, EDITOR_TRADES, readOnly)}<section data-simple-review></section><details class="work-review-list"><summary>확인 필요 항목 보기</summary><section data-work-list></section><section data-quantity-reviews></section></details><details class="work-review-list"><summary>판매가격 요청·처리 내역</summary><section data-sale-reviews></section></details>${privileged?'<section class="work-review-list" data-price-reviews></section>':""}<section class="work-review-panel" data-work-panel hidden></section><div class="editor-section-tabs" role="group" aria-label="편집 영역"><button type="button" data-editor-section="items">공정·품목</button><button type="button" data-editor-section="spaces">공간·실측</button><button type="button" data-review-quantities ${readOnly ? "disabled" : ""}>실측 변경 일괄 검토</button></div><div data-batch-quantities hidden></div><section class="editor-spaces"><nav class="editor-space-list" aria-label="공간 선택" data-space-list></nav><section data-space-panel></section></section>
      <div class="editor-layout"><nav aria-label="본견적 공정">${EDITOR_TRADES.map(([key,label])=>`<button type="button" data-editor-trade="${key}" aria-pressed="${trade===key}"><span>${label}</span><strong data-trade-total="${key}"></strong></button>`).join("")}</nav><section class="editor-items" data-items-panel></section></div>
      <details data-item-review hidden></details><section class="editor-summary"><h3>견적 합계</h3><div class="detailed-fields">${privileged?price("추가금액","data-editor-field=addition",editor.addition)+price("할인금액","data-editor-field=discount",editor.discount):`<p>추가금액 ${money(editor.addition)} · 할인금액 ${money(editor.discount)}</p>`}${privileged?input("회사 기본 매출이익률 (%)","data-company-margin",(changes.companyMargin??internal?.policy?.companyMargin??0)*100,"number")+input("선택 공정 매출이익률 (%)",`data-trade-margin="${trade}"`,(changes.tradeMargins?.[trade]??internal?.policy?.tradeMargins?.[trade]??internal?.policy?.companyMargin??0)*100,"number"):""}<label>창호 별도견적<select data-separate="windows">${options([["undecided","미정"],["included","포함"],["excluded","제외"]],editor.separateQuotes.windows)}</select></label><label>냉난방기 별도견적<select data-separate="hvac">${options([["undecided","미정"],["included","포함"],["excluded","제외"]],editor.separateQuotes.hvac)}</select></label></div><div data-editor-totals></div></section>`;
    renderSpaces();renderItems();setSection(section);lock();
    if(privileged){const panel=host.ownerDocument.createElement('details');panel.className='editor-private-panel';panel.innerHTML='<summary>회사·공정 가격정책</summary>';for(const n of [...host.querySelectorAll('[data-company-margin],[data-trade-margin]')])panel.append(n.closest('label')||n);host.querySelector('.editor-summary').append(panel);}
    for (const [key] of EDITOR_TRADES) { const count = plan.reviews.filter(r => r.trade === key).length; if (count) { const n = host.ownerDocument.createElement("small"); n.textContent = `가견적 확인 ${count}건`; host.querySelector(`[data-editor-trade="${key}"]`).append(n); } }
  };
  const add=(master,kind="quantity")=>{const i={id:crypto.randomUUID(),trade,spaceId:"",name:master?.name||(kind==="tile"?"비욕실 타일":"현장 전용 품목"),spec:"",unit:master?.unit||(kind==="tile"?"㎡":"식"),quantity:1,saleUnitPrice:master||kind==="tile"?null:0,memo:"",masterCode:master?.code||"",kind,basis:"manual",parentId:"",excluded:false};editor.items.push(i);itemId=i.id;};
  const applyQuantity = (i, value) => {
    changedPrice(i.id);
    i.quantity = value.value; i.quantityManual = false; i.basis = choiceFor(i).basis;
    if (i.basis === "preliminary") delete i.measurement; else i.measurement = { ...value };
    i.quantityConfirmation=confirmQuantity(i,editor.spaces,i.basis==="preliminary"?"keep":"measured");
  };
  const onInput=event=>{
    const n=event.target,d=n.dataset;if(d.catalogSearch!==undefined){catalogCode=host.querySelector("[data-catalog-select]").value || catalogCode;search=n.value;renderCatalog();return;}if(d.catalogSelect!==undefined){catalogCode=n.value;return;}if(readOnly)return;
    if(d.quantitySelect){if(n.checked)quantitySelection.add(d.quantitySelect);else quantitySelection.delete(d.quantitySelect);return;}
    if(!privileged&&((d.item&&d.field==="saleUnitPrice")||d.private||d.tile||d.companyMargin!==undefined||d.tradeMargin||d.editorField)){message("가격 변경은 변경 요청을 이용해 주세요.",true);return;}
    if(d.lossReason){priceReasons.set(d.lossReason,n.value);return;}
    if((d.item&&["quantity","unit","saleUnitPrice","kind","excluded"].includes(d.field))||d.private||d.tile)changedPrice(d.item||d.private||d.tile);
    let value=n.type==="checkbox"?n.checked:n.type==="number"?Number(n.value):n.value;
    if(d.measure!==undefined){choiceFor(selectedItem()).basis=value;quantityPanel();return;}
    if(d.measureParam){const choice=choiceFor(selectedItem());if(n.value==="")delete choice[d.measureParam];else choice[d.measureParam]=d.measureParam==="waste"?1+Number(n.value)/100:Number(n.value);measuredResult();return;}
    if(d.measureSpace){const i=selectedItem(),ids=new Set(selectedSpaceIds(i));if(n.checked)ids.add(d.measureSpace);else ids.delete(d.measureSpace);i.spaceIds=editor.spaces.filter(s=>ids.has(s.id)).map(s=>s.id);i.spaceId=i.spaceIds[0]||"";const select=host.querySelector(`[data-item="${i.id}"][data-field="spaceId"]`);if(select)select.value=i.spaceId;quantityPanel();touch();return;}
    if(d.money!==undefined){const raw=n.value.replaceAll(",","");if(!/^\d*$/.test(raw)||(d.private&&d.field==="costUnit"&&raw==="")){invalid.add(fieldKey(n));n.setAttribute("aria-invalid","true");message("금액은 0 이상의 원 단위 숫자로 입력해 주세요.",true);return;}invalid.delete(fieldKey(n));n.removeAttribute("aria-invalid");value=Number(raw);}
    if(d.space){const s=editor.spaces.find(s=>s.id===d.space);if(d.wall!==undefined)s.walls[Number(d.wall)]=value;else s[d.field]=value;spaceMetrics();if(d.field==="name"){host.querySelector(`[data-select-space="${s.id}"]`).textContent=s.name;host.querySelector("[data-space-heading]").textContent=s.name;}}
    else if(d.item){const i=editor.items.find(i=>i.id===d.item);if(["quantity","unit"].includes(d.field)&&!i.quantityConfirmation&&i.quantity>0)i.quantityConfirmation=confirmQuantity(i,editor.spaces,"keep");i[d.field]=value;if(d.field==="quantity")i.quantityManual=true;if(d.field==="spaceId"&&i.spaceIds)i.spaceIds=value?[value]:[];if(["spaceId","quantity","unit"].includes(d.field)&&i.id===itemId)quantityPanel();if(d.field==="saleUnitPrice"&&changes.reprice)changes.reprice=changes.reprice.filter(id=>id!==i.id);if(d.field==="kind"){if(value==="fixed")i.quantity=1;renderItems();}const cell=host.querySelector(`[data-cell-${d.field==="spaceId"?"space":d.field}="${i.id}"]`);if(cell)cell.textContent=d.field==="spaceId"?editor.spaces.find(s=>s.id===value)?.name||"공통":value;if(d.field==="name")host.querySelector(`[data-select-item="${i.id}"]`).textContent=value;if(d.field==="excluded")renderItems();}
    else if(d.private){changes.items ||= {};changes.items[d.private] ||= {};changes.items[d.private][d.field]=d.field==="targetMargin"?value/100:value;}
    else if(d.tile){if(!internal?.items?.[d.tile]?.tileRule){message("현재 품목 계산이 완료된 뒤 수정해 주세요.",true);return;}changes.items ||= {};changes.items[d.tile] ||= {};changes.items[d.tile].tileRule ||= {...(internal.items[d.tile].tileRule)};changes.items[d.tile].tileRule[d.field]=value;changes.items[d.tile].tileRule.version="project-tile-v1";}
    else if(d.companyMargin!==undefined)changes.companyMargin=value/100;
    else if(d.tradeMargin){changes.tradeMargins ||= {...internal?.policy?.tradeMargins};changes.tradeMargins[d.tradeMargin]=value/100;}
    else if(d.editorField)editor[d.editorField]=value;else if(d.separate)editor.separateQuotes[d.separate]=value;
    else return;touch();
  };
  const onClick=event=>{
    const b=event.target.closest("button");if(!b||!host.contains(b))return;event.stopPropagation();const d=b.dataset;
    if(d.workOpen){
      const definition=workReadiness(reference,plan.sourceId,editor).tasks.find(t=>t.id===d.workOpen),node=host.querySelector('[data-work-panel]');
      if(!definition)return;workPanel?.destroy();node.hidden=false;
      const close=()=>{workPanel?.destroy();node.hidden=true;node.innerHTML="";};
      workPanel=mountWorkPanel({host:node,editor,reference,sourceId:plan.sourceId,standards:standardItems,definition,readOnly,message,cancel:close,canPrice:privileged,
        apply:(task,selected,confirmations)=>{
          if(editor.items.length+selected.filter(i=>!editor.items.some(r=>r.id===i.id)).length>500){message("작성본은 최대 500개 품목까지 추가할 수 있습니다.",true);return;}
          editor.workReview ||= newWorkState(reference,plan.sourceId,editor);
          const expected=newWorkState(reference,plan.sourceId,editor).tasks;
          for(const t of expected)if(!editor.workReview.tasks.some(r=>r.id===t.id))editor.workReview.tasks.push(t);
          for(const i of selected){changedPrice(i.id);const index=editor.items.findIndex(r=>r.id===i.id);if(index<0)editor.items.push(i);else editor.items[index]=i;}
          const index=editor.workReview.tasks.findIndex(t=>t.id===task.id);if(index<0)editor.workReview.tasks.push(task);else editor.workReview.tasks[index]=task;
          for(const a of confirmations){editor.workReview.scopeConfirmations=editor.workReview.scopeConfirmations.filter(old=>workCanonical(old.rows)!==workCanonical(a.rows));editor.workReview.scopeConfirmations.push(a);}
          trade=definition.trade;section="items";close();render();touch();message("공사 확인 내용을 반영했습니다. 작성본을 저장해 주세요.");
        }});const header=host.ownerDocument.querySelector('.detailed-page-header');node.style.scrollMarginTop=`${(header?.getBoundingClientRect().height||0)+12}px`;node.scrollIntoView?.({block:"start"});return;
    }
    if(d.editorSection){setSection(d.editorSection);return;}if(d.selectSpace){spaceId=d.selectSpace;renderSpaces();return;}
    if(d.reviewItem){const i=editor.items.find(i=>i.id===d.reviewItem);if(i){trade=i.trade;itemId=i.id;section="items";render();const panel=host.querySelector('[data-staff-item-details]');if(panel)panel.open=true;host.querySelector("[data-item-detail]")?.scrollIntoView?.({block:"nearest"});}return;}
    if(d.selectItem){itemId=d.selectItem;host.querySelectorAll("[data-line]").forEach(n=>n.setAttribute("aria-selected",String(n.dataset.line===itemId)));renderItemDetail();const panel=host.querySelector('[data-staff-item-details]');if(panel)panel.open=true;return;}
    if(d.openStandards!==undefined){picker.open();return;}
    if(d.editorTrade){trade=d.editorTrade;itemId=null;render();return;}if(readOnly)return;
    if(d.confirmSelectedQuantities!==undefined){try{let count=0;for(const i of editor.items)if(quantitySelection.has(i.id)){i.quantityConfirmation=confirmQuantity(i,editor.spaces,"keep");count++;}quantitySelection.clear();touch();message(`${count}개 품목의 현재 수량을 확인했습니다. 작성본을 저장해 주세요.`);}catch(error){message(error.message,true);}return;}
    if(d.requestReview!==undefined){priceCommands.push({action:"review"});touch();message("검토 요청을 작성했습니다. 작성본을 저장해 주세요.");return;}
    if(d.saleRequest){const proposed=host.querySelector('[data-sale-proposed]').value.replaceAll(",",""),reason=host.querySelector('[data-sale-reason]').value.trim();if(!/^\d+$/.test(proposed)||!reason){message("요청 판매단가와 사유를 입력해 주세요.",true);return;}priceCommands.push({action:"request",id:crypto.randomUUID(),itemId:d.saleRequest,proposed:Number(proposed),reason});touch();message("가격 변경 요청을 작성했습니다. 저장 후 검토자에게 반영됩니다.");return;}
    if(d.saleApprove||d.saleReject){if(!privileged)return;const id=d.saleApprove||d.saleReject,reason=host.querySelector(`[data-sale-decision-reason="${id}"]`).value.trim();if(!reason){message("처리 사유를 입력해 주세요.",true);return;}priceCommands.push({action:d.saleApprove?"approve":"reject",id,reason});touch();message("가격 처리 내용을 확인하고 작성본을 저장해 주세요.");return;}
    if(d.confirmKept||d.confirmManualQuantity!==undefined){const i=d.confirmKept?editor.items.find(i=>i.id===d.confirmKept):selectedItem();try{i.quantityConfirmation=confirmQuantity(i,editor.spaces,d.confirmKept?"keep":"manual");quantityPanel();touch();message("수량 확인을 기록했습니다. 작성본을 저장해 주세요.");}catch(error){message(error.message,true);}return;}
    if(d.approvePrice){const i=editor.items.find(i=>i.id===d.approvePrice),reason=priceReasons.get(i.id)?.trim();if(!privileged||generation!==pricedGeneration){message("현재 금액 확인이 끝난 뒤 다시 승인해 주세요.",true);return;}if(!reason){message("예외 판매 사유를 입력해 주세요.",true);return;}changes.revokedPriceApprovals=changes.revokedPriceApprovals?.filter(id=>id!==i.id)||[];changes.priceApprovals||={};changes.priceApprovals[i.id]={reason,stamp:priceStamp(i,internal.items[i.id])};touch();return;}
    if(d.confirmScope!==undefined){const notice=reviewDetailedItems(editor.items)[Number(d.confirmScope)],reason=host.querySelector(`[data-scope-reason="${d.confirmScope}"]`)?.value.trim();if(!notice||!reason){message("별도 시공 범위와 포함 항목의 확인 사유를 입력해 주세요.",true);return;}editor.workReview ||= newWorkState(reference,plan.sourceId,editor);editor.workReview.scopeConfirmations.push({reason,rows:scopeSnapshot(notice,editor)});touch();return;}
    if(d.reviewStandard){const s=standardById(d.reviewStandard);if(s){trade=s.trade;itemId=null;render();picker.open(s.id);}return;}
    if(d.applyPreliminary!==undefined||d.skipPreliminary!==undefined||d.importSuggestion){
      const applied=new Set(editor.preliminaryImport?.keys||[]),keys=d.importSuggestion?[d.importSuggestion]:d.skipPreliminary!==undefined?[]:[...host.querySelectorAll('[data-import-key]:checked:not(:disabled)')].map(n=>n.dataset.importKey);
      const incoming=[...plan.rows,...plan.suggestions].filter(r=>keys.includes(r.key)&&!applied.has(r.key)&&!editor.items.some(i=>i.origin?.key===r.key));
      if(!incoming.length&&editor.preliminaryImport){message("선택 항목은 이미 반영됐거나 추가 선택된 항목이 없습니다.");return;}
      if(editor.items.length+incoming.length>500){message("작성본은 최대 500개 품목까지 추가할 수 있습니다.",true);return;}
      const candidates=[];
      for(const r of incoming){const s=standardItems.find(s=>s.id===r.standardId);if(!s||s.unit!==r.unit){message(`${r.name}: 표준 품목 단위가 달라 직접 확인이 필요합니다.`,true);return;}candidates.push({id:crypto.randomUUID(),trade:r.trade,spaceId:"",spaceIds:[],name:r.name,spec:r.spec,unit:r.unit,quantity:r.quantity,saleUnitPrice:s.linked||s.pricing==="tile"?null:s.initialSale??0,memo:"",masterCode:s.masterCode,kind:s.pricing==="tile"?"tile":"quantity",basis:"preliminary",parentId:"",excluded:false,standardId:r.standardId,workScope:r.workScope,origin:structuredClone(r.origin),quantityManual:false});}
      const ids=new Set(candidates.map(i=>i.id)),notices=reviewDetailedItems([...editor.items,...candidates]).filter(n=>n.itemIds.some(id=>ids.has(id)));
      if(notices.length&&!host.ownerDocument.defaultView.confirm(`${itemReviewText(notices)}\n시공 범위를 확인하고 초기안을 구성할까요?`))return;
      for(const r of incoming)applied.add(r.key);
      editor.items.push(...candidates);editor.preliminaryImport={sourceId:plan.sourceId,mappingVersion:PRELIMINARY_MAPPING_VERSION,keys:[...applied]};
      if(candidates.length){trade=candidates[0].trade;itemId=candidates[0].id;section="items";}
      render();touch();message(`${candidates.length}개 공사를 초기안에 구성했습니다. 확인 후 작성본을 저장해 주세요.`);return;
    }
    if(d.applyQuantity!==undefined||d.keepQuantity!==undefined){
      const i=selectedItem(),value=measurementFor(i);
      if(d.keepQuantity!==undefined){try{i.quantityConfirmation=confirmQuantity(i,editor.spaces,"keep");}catch(error){message(error.message,true);return;}}
      else {if(!value||value.needsCoverage)return;if(!host.ownerDocument.defaultView.confirm(`${i.name}: 현재 ${i.quantity}${i.unit} → ${value.value}${i.unit}을 적용할까요? 판매단가는 유지됩니다.`))return;applyQuantity(i,value);}
      renderItems();touch();return;
    }
    if(d.manualQuantity!==undefined){host.querySelector(`[data-item="${itemId}"][data-field="quantity"]`)?.focus();return;}
    if(d.reviewQuantities!==undefined){
      const pending=editor.items.filter(i=>!i.excluded&&measurementChanged(i,editor.spaces)),node=host.querySelector('[data-batch-quantities]');node.hidden=false;
      node.innerHTML=`<h4>실측 변경 수량 검토</h4>${pending.map(i=>{const v=measuredSelection(i,editor.spaces,i.measurement.basis,i.measurement);return `<label class="preliminary-choice"><input type="checkbox" data-batch-quantity="${i.id}" ${!v||v.needsCoverage?"disabled":"checked"}><span>${esc(i.name)} · 현재 ${i.quantity}${esc(i.unit)} → ${v&&!v.needsCoverage?`${v.value}${esc(i.unit)}`:"산정 기준 확인 필요"}</span></label>`;}).join("")||"<p>재확인이 필요한 적용 실측 수량이 없습니다.</p>"}<button type="button" data-apply-batch-quantities>선택 수량 적용</button>`;return;
    }
    if(d.applyBatchQuantities!==undefined){
      const ids=[...host.querySelectorAll('[data-batch-quantity]:checked:not(:disabled)')].map(n=>n.dataset.batchQuantity),pending=editor.items.filter(i=>ids.includes(i.id));
      if(!pending.length)return;if(!host.ownerDocument.defaultView.confirm(`${pending.length}개 품목의 변경된 실측 수량을 적용할까요? 판매단가는 유지됩니다.`))return;
      for(const i of pending){const v=measuredSelection(i,editor.spaces,i.measurement.basis,i.measurement);if(v&&!v.needsCoverage){measureChoices.set(i.id,{...i.measurement});applyQuantity(i,v);}}
      host.querySelector('[data-batch-quantities]').hidden=true;renderItems();touch();return;
    }
    if(d.addSpace!==undefined){const s={id:crypto.randomUUID(),name:"새 공간",floorArea:0,ceilingArea:0,height:2400,walls:[],memo:""};editor.spaces.push(s);spaceId=s.id;renderSpaces();}
    else if(d.addWall){spaceId=d.addWall;selectedSpace().walls.push(0);renderSpaces();}
    else if(d.deleteWall!==undefined){selectedSpace().walls.splice(Number(d.deleteWall),1);renderSpaces();}
    else if(d.deleteSpace){editor.spaces=editor.spaces.filter(s=>s.id!==d.deleteSpace);editor.items.forEach(i=>{if(i.spaceIds){i.spaceIds=i.spaceIds.filter(id=>id!==d.deleteSpace);i.spaceId=i.spaceIds[0]||"";}else if(i.spaceId===d.deleteSpace){i.spaceId="";i.basis="manual";}});spaceId=editor.spaces[0]?.id;renderSpaces();renderItems();}
    else if(d.addMaster!==undefined){const c=catalog.find(c=>c.code===host.querySelector("[data-catalog-select]").value);if(!c){message("표준 품목을 선택해 주세요.",true);return;}add(c);renderItems();}
    else if(d.addCustom!==undefined){add();renderItems();}else if(d.addTile!==undefined){add(null,"tile");renderItems();}
    else if(d.deleteItem){if(editor.items.some(i=>i.parentId===d.deleteItem)){message("분리 품목을 먼저 삭제해 주세요.",true);return;}changedPrice(d.deleteItem);editor.items=editor.items.filter(i=>i.id!==d.deleteItem);if(changes.items)delete changes.items[d.deleteItem];if(changes.reprice)changes.reprice=changes.reprice.filter(id=>id!==d.deleteItem);for(const key of invalid)if(key.startsWith(`${d.deleteItem}:`))invalid.delete(key);renderItems();}
    else if(d.reprice){changedPrice(d.reprice);changes.reprice ||= [];if(!changes.reprice.includes(d.reprice))changes.reprice.push(d.reprice);}
    else if(d.split){const parent=editor.items.find(i=>i.id===d.split);if(parent.parentId)return;parent.excluded=true;add();const child=editor.items.at(-1);child.parentId=parent.id;child.name=`${parent.name} 세부 항목`;renderItems();}
    else return;touch();
  };
  const focusMoney=event=>{const n=event.target;if(n.dataset.money!==undefined)n.value=n.value.replaceAll(",","");};
  const blurMoney=event=>{const n=event.target;if(n.dataset.money!==undefined&&n.value!==""&&!invalid.has(fieldKey(n)))n.value=Number(n.value.replaceAll(",","")).toLocaleString("ko-KR");};
  host.addEventListener("input",onInput);host.addEventListener("change",onInput);host.addEventListener("click",onClick);host.addEventListener("focusin",focusMoney);host.addEventListener("focusout",blurMoney);render();
  return {confirmReview:()=>{const notices=reviewDetailedItems(editor.items);return !notices.length||host.ownerDocument.defaultView.confirm(`${itemReviewText(notices)}\n시공 범위를 확인한 내용으로 저장할까요?`);},collect:()=>{if(invalid.size)throw new Error("잘못 입력한 금액을 먼저 확인해 주세요.");return{editor:publicEditorInput(editor),...(privileged?{internalChanges:structuredClone(changes)}:{}),priceCommands:structuredClone(priceCommands)};},uiState:()=>({trade,section,spaceId,itemId}),
    destroy(){clearTimeout(timer);generation++;picker?.destroy();workPanel?.destroy();host.removeEventListener("input",onInput);host.removeEventListener("change",onInput);host.removeEventListener("click",onClick);host.removeEventListener("focusin",focusMoney);host.removeEventListener("focusout",blurMoney);}
  };
}
