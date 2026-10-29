import { escapeHtml as esc } from "./utils.js";
import { WORK_STATUS, newWorkState, workReadiness, confirmWorkTask, scopeSnapshot, relatedWorkRows, workRowSnapshot } from "./detailed-work-review.js";
import { measuredSelection, quantityModes, QUANTITY_LABELS } from "./detailed-measurement.js";
import { reviewDetailedItems } from "./detailed-item-review.js";
import { mountCoverage } from "./detailed-work-scope-view.js";
import { confirmQuantity, quantityNeedsReview } from "./detailed-completion.js";
const money = n => `${Number(n || 0).toLocaleString("ko-KR")}원`;
const field = (name, value, type = "text") => `<input data-work-field="${name}" type="${type}" ${type === "number" ? 'min="0" step="any"' : 'maxlength="500"'} value="${esc(value ?? "")}" aria-label="${({spec:"규격",quantity:"수량",saleUnitPrice:"판매단가",workScope:"적용 부위"})[name] || name}">`;
const evidenceNames = { bathroomUnits:"욕실 개수", bathroomFixtureGrade:"도기·수전 등급", tileEnabled:"타일 선택", tileGroutEnabled:"줄눈 선택", bathroomMasonryWallUnits:"조적 개수", wallpaperPublicMaterialGrade:"공용부 벽지", wallpaperRoomMaterialGrade:"각방 벽지", wallpaperPublicWallLengthM:"공용부 벽 길이(mm)", wallpaperRoomWallLengthM:"각방 벽 길이(mm)", areaPyeong:"평형", wallpaperPreset:"도배 작업 기준", wallpaperBaseCoatEnabled:"기초 작업", filmMaterialLengthM:"필름 길이(mm)", filmPreset:"필름 작업 난이도", carpentryCofferType:"우물천장", carpentryMoldingEnabled:"몰딩", carpentryBaseboardEnabled:"걸레받이", carpentryCeilingHeight:"천장높이" };
export function renderWorkList(reference, sourceId, editor, exceptionsOnly = false) {
  if (!sourceId) return "";
  const ready = workReadiness(reference, sourceId, editor);
  const tasks=exceptionsOnly?ready.tasks.filter(t=>t.problem||ready.coveragePending.some(c=>c.taskId===t.id)):ready.tasks;
  return `<h3>공사 구성 확인 · 미처리 <span data-work-count>${ready.unresolved}</span>건</h3><p>원본 공사 범위 확인 필요 ${ready.coveragePending.length}건</p><div class="work-task-list">${tasks.map(t => `<button type="button" data-work-open="${esc(t.id)}"><strong>${esc(t.label)}</strong><span>${WORK_STATUS[t.status]}</span>${t.task?.actor ? '<small>처리 기록 저장됨</small>' : ""}</button>`).join("")}</div>`;
}

// One staged panel for every construction task. Cancel never mutates the working editor.
export function mountWorkPanel({ host, editor, reference, sourceId, standards, definition, readOnly, apply, message, cancel, canPrice = true }) {
  const state = editor.workReview || newWorkState(reference, sourceId, editor), prior = state.tasks.find(t => t.id === definition.id);
  const staged = structuredClone(prior || newWorkState(reference, sourceId, editor).tasks.find(t => t.id === definition.id));
  const evidenceKeys = [...new Set([...definition.inputs, ...(definition.trade === "carpentry" ? ["carpentryCurtainBoxUnits", "carpentryArtwallM"].filter(k=>Number(reference.inputs?.[k])>0) : [])])];
  const evidenceLabel = k => ({carpentryCurtainBoxUnits:"커튼박스(개소)",carpentryArtwallM:"아트월 길이(mm)",filmPreset:"필름 시공 기준"})[k] || evidenceNames[k] || "원본 선택 정보";
  const evidenceValue = k => ({value:"AND실속(대림급)",standard:"AND표준",premium:"AND고급",diamant:"디아망",besti:"베스띠",fortis:"디아망 포티스",p20:"20평대",p30:"30평대",p40:"40평대",p50:"50평 이상",true:"선택",false:"미선택"})[String(reference.inputs?.[k])] ?? reference.inputs?.[k] ?? "미기록";
  const selected = new Set(staged.itemIds), rows = editor.items.filter(i => i.trade === definition.trade || selected.has(i.id)).map(i => structuredClone(i));
  const choices = new Map();
  const opt = (values, selected) => values.map(([v,n]) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(n)}</option>`).join("");
  const rowHtml = i => `<tr data-work-row="${i.id}"><td><label><input type="checkbox" data-work-use="${i.id}" ${selected.has(i.id) ? "checked" : ""}>${esc(i.name)}${editor.items.some(r=>r.id===i.id) ? " · 기존" : " · 추가 예정"}</label></td><td><fieldset aria-label="적용 공간">${editor.spaces.map(s=>`<label><input type="checkbox" data-work-space="${s.id}" ${(i.spaceIds || (i.spaceId ? [i.spaceId] : [])).includes(s.id) ? "checked" : ""}>${esc(s.name)}</label>`).join("")}</fieldset></td><td>${field("spec",i.spec)}${field("workScope",i.workScope || "")}</td><td>${esc(i.unit)}</td><td>${field("quantity",i.quantity,"number")}</td><td>${field("saleUnitPrice",i.saleUnitPrice ?? "","number")}<output data-work-amount>${money(Math.round(i.quantity * (i.saleUnitPrice || 0)))}</output></td><td>${quantityModes(i).some(m=>["wallArea","surfaceArea","ceilingArea","floorArea"].includes(m)) ? `<label>실측 기준<select data-work-measure>${opt([["manual","직접 수량 확정"],...quantityModes(i).filter(m=>["wallArea","surfaceArea","ceilingArea","floorArea"].includes(m)).map(m=>[m,QUANTITY_LABELS[m]])],"manual")}</select></label><label>제외 면적(㎡)<input data-work-param="excludeArea" type="number" min="0" step="any"></label>${["롤","장"].includes(i.unit) ? '<label>1개당 시공면적(㎡)<input data-work-param="coverage" type="number" min="0" step="any"></label><label>여유율(%)<input data-work-param="waste" type="number" min="0" step="any"></label>' : ""}<p data-work-measured></p><button type="button" data-work-measure-apply>확인 수량 적용</button>` : "직접 수량 확인"}</td></tr>`;
  let coverage;
  const renderRows = () => { host.querySelector("[data-work-rows]").innerHTML = rows.map(rowHtml).join("") || '<tr><td colspan="7">관련 기존 품목 없음</td></tr>';for(const n of host.querySelectorAll('[data-work-row]')){const i=rows.find(i=>i.id===n.dataset.workRow);n.lastElementChild.insertAdjacentHTML('beforeend',`<p data-work-quantity-status>${quantityNeedsReview(i,editor.spaces)?"수량 확인 필요":"입력 수량"}</p><button type="button" data-work-quantity-confirm>현재 수량 확정</button>`);}if(!canPrice)host.querySelectorAll('[data-work-field="saleUnitPrice"]').forEach(n=>n.readOnly=true);coverage?.render(); };
  host.innerHTML = `<h3>${esc(definition.label)}</h3><p>${esc(definition.reason)}</p><dl class="work-evidence">${evidenceKeys.map(k=>`<div><dt>${esc(evidenceLabel(k))}</dt><dd>${esc(evidenceValue(k))}</dd></div>`).join("")}</dl>
    <div class="detailed-fields"><label>시공 범위<input data-work-scope maxlength="200" value="${esc(staged.scope)}"></label><label>적용·제외 사유<input data-work-reason maxlength="500" value="${esc(staged.reason)}"></label>${definition.trade === "carpentry" ? `<label>목공 산정 방식<select data-work-method>${opt([["","선택"],["finished","완성 시공단가"],["inputs","실제 투입 인력·자재"],["manual","현장 직접 판매단가"]],staged.method)}</select></label>` : ""}</div>
    <div class="work-candidates">${(definition.standardIds || []).map(id=>{const s=standards.find(s=>s.id===id);return s?`<button type="button" data-work-add="${esc(id)}">${esc(s.name)} 선택</button>`:"";}).join("")}</div>
    <div class="editor-table-scroll"><table class="work-item-table"><thead><tr><th>반영 품목</th><th>적용 공간</th><th>규격·부위</th><th>단위</th><th>수량</th><th>판매단가·금액</th><th>실측 확인</th></tr></thead><tbody data-work-rows></tbody></table></div>
    <section data-work-coverage></section><section data-work-overlap></section><p data-work-error role="status"></p><div class="detailed-actions"><button type="button" data-work-apply>견적 반영</button><button type="button" data-work-exclude>시공 제외</button><button type="button" data-work-working>작업 중으로 저장</button><button type="button" data-work-cancel>확인 취소</button></div>`;
  renderRows();
  if(!canPrice)host.querySelectorAll('[data-work-field="saleUnitPrice"]').forEach(n=>n.readOnly=true);
  coverage=mountCoverage({host:host.querySelector('[data-work-coverage]'),definition,reference,staged,rows,selected});
  const effective = () => ({ ...editor, items: [...editor.items.filter(i => !selected.has(i.id)), ...rows.filter(i => selected.has(i.id))] });
  const overlaps = () => reviewDetailedItems(effective().items).filter(n=>n.scopeKnown && n.itemIds.some(id=>selected.has(id)));
  const renderOverlap = () => { host.querySelector('[data-work-overlap]').innerHTML = overlaps().map((n,index)=>`<label><input type="checkbox" data-work-ack="${index}">${esc(n.message)} 별도 공사 범위·포함 항목을 확인했습니다.</label>`).join(""); };
  const showError = error => { host.querySelector('[data-work-error]').textContent=error.message; message(error.message,true); };
  const choice = i => { if (!choices.has(i.id)) choices.set(i.id,{basis:"manual"}); return choices.get(i.id); };
  const measured = (i,node) => { const v=measuredSelection(i,editor.spaces,choice(i).basis,choice(i));const output=node.querySelector('[data-work-measured]');if(output)output.textContent=v ? `${v.explanation}${v.needsCoverage?"":` = ${v.value}${i.unit}`}`:"실측 공간·기준을 확인해 주세요.";return v; };
  const input = event => {
    event.stopPropagation(); const n=event.target,d=n.dataset,tr=n.closest('[data-work-row]'),i=rows.find(r=>r.id===tr?.dataset.workRow);
    if(!i)return;
    if(d.workUse){if(n.checked)selected.add(i.id);else selected.delete(i.id);}
    if(d.workField){if(!canPrice&&d.workField==="saleUnitPrice")return;i[d.workField]=n.type==="number"?(n.value===""?null:Number(n.value)):n.value;if(d.workField==="quantity"){i.quantityManual=true;delete i.measurement;}tr.querySelector('[data-work-amount]').textContent=money(Math.round(i.quantity*(i.saleUnitPrice||0)));}
    if(d.workSpace){const ids=new Set(i.spaceIds || (i.spaceId?[i.spaceId]:[]));if(n.checked)ids.add(d.workSpace);else ids.delete(d.workSpace);i.spaceIds=editor.spaces.filter(s=>ids.has(s.id)).map(s=>s.id);i.spaceId=i.spaceIds[0]||"";}
    if(d.workMeasure!==undefined)choice(i).basis=n.value;
    if(d.workParam){if(n.value==="")delete choice(i)[d.workParam];else choice(i)[d.workParam]=Number(n.value)*(d.workParam==="waste"?.01:1)+(d.workParam==="waste"?1:0);}
    measured(i,tr);const q=tr.querySelector('[data-work-quantity-status]');if(q)q.textContent=quantityNeedsReview(i,editor.spaces)?"수량 확인 필요":"수량 확인됨";coverage.render();renderOverlap();
  };
  const click = event => {
    const b=event.target.closest('button');if(!b)return;event.stopPropagation();const d=b.dataset;
    try {
      if(d.workCancel!==undefined){cancel();return;}if(readOnly)return;
      if(d.workQuantityConfirm!==undefined){const tr=b.closest('[data-work-row]'),i=rows.find(i=>i.id===tr.dataset.workRow);i.quantityConfirmation=confirmQuantity(i,editor.spaces,"manual");tr.querySelector('[data-work-quantity-status]').textContent="수량 확인됨";return;}
      if(d.workAdd){const s=standards.find(s=>s.id===d.workAdd);let i=rows.find(r=>r.standardId===s.id&&!r.excluded);if(!i){i={id:crypto.randomUUID(),trade:s.trade,spaceId:"",spaceIds:[],standardId:s.id,name:s.name,spec:s.spec||"",unit:s.unit,quantity:0,saleUnitPrice:s.saleUnitPrice??0,memo:"",masterCode:s.masterCode,kind:s.pricing==="tile"?"tile":"quantity",basis:"manual",parentId:"",excluded:false,workScope:"",quantityManual:true};rows.push(i);}selected.add(i.id);renderRows();renderOverlap();return;}
      if(d.workMeasureApply!==undefined){const tr=b.closest('[data-work-row]'),i=rows.find(i=>i.id===tr.dataset.workRow),v=measured(i,tr);if(!v||v.needsCoverage)throw new Error("실측·시공면적·여유율 기준을 확인해 주세요.");i.quantity=v.value;i.measurement=v;i.quantityManual=false;i.basis=v.basis;i.quantityConfirmation=confirmQuantity(i,editor.spaces,"measured");tr.querySelector('[data-work-quantity-status]').textContent="수량 확인됨";tr.querySelector('[data-work-field="quantity"]').value=i.quantity;tr.querySelector('[data-work-amount]').textContent=money(Math.round(i.quantity*(i.saleUnitPrice||0)));renderOverlap();return;}
      const status=d.workApply!==undefined?"applied":d.workExclude!==undefined?"excluded":d.workWorking!==undefined?"working":null;if(!status)return;
      const next={...staged,status,itemIds:[...selected],scope:host.querySelector('[data-work-scope]').value,reason:host.querySelector('[data-work-reason]').value,method:host.querySelector('[data-work-method]')?.value||""};
      if(status==="excluded"&&!next.reason.trim())throw new Error("시공 제외 사유를 입력해 주세요.");
      if(status==="excluded"){
        for(const id of selected)if(!editor.items.some(i=>i.id===id))selected.delete(id);
        const related=relatedWorkRows(definition,editor),ids=new Set([...related.map(i=>i.id),...staged.itemIds,...selected]);
        const affected=rows.filter(i=>ids.has(i.id));
        if(affected.some(i=>!i.excluded)&&!host.ownerDocument.defaultView.confirm(`${affected.filter(i=>!i.excluded).length}개 관련 품목을 합산 제외할까요? 품목·수량·단가는 보존하며, 다른 확인 항목에서 공유하는 품목은 재확인이 필요합니다.`))return;
        for(const i of affected){Object.assign(i,structuredClone(editor.items.find(r=>r.id===i.id)),{excluded:true});selected.add(i.id);}next.itemIds=affected.map(i=>i.id);next.confirmedRows=affected.map(i=>workRowSnapshot(i,editor.spaces));
      }
      const merged=effective();
      const records=coverage.collect(status,next,merged);if(records.length)next.coverage=records;
      if(status==="applied" && overlaps().some((n,index)=>!host.querySelector(`[data-work-ack="${index}"]`)?.checked))throw new Error("동일 부위의 중복 가능성을 확인하거나 적용 부위를 구분해 주세요.");
      const confirmed=status==="applied"?confirmWorkTask(definition,next,merged):next;
      const confirmations=status==="applied"?overlaps().map(n=>({reason:next.reason,rows:scopeSnapshot(n,merged)})):[];
      apply(confirmed,rows.filter(i=>selected.has(i.id)),confirmations);
    }catch(error){showError(error);}
  };
  renderOverlap();host.addEventListener('input',input);host.addEventListener('change',input);host.addEventListener('click',click);
  if(readOnly)host.querySelectorAll('input,select,button:not([data-work-cancel])').forEach(n=>n.disabled=true);
  return { destroy(){coverage.destroy();host.removeEventListener('input',input);host.removeEventListener('change',input);host.removeEventListener('click',click);} };
}
