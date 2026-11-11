import {escapeHtml as esc} from './utils.js';
import {normalizeManualWorks,manualWorkInput,manualWorkAmount} from './manual-work.js';

const won=value=>`${Number(value).toLocaleString('ko-KR')}원`;
export function mountManualWorkView({document,panels,canEdit,canViewCost=canEdit,mode,changed}) {
  let rows=[],editable=true;
  const drafts=new Map();
  const writable=()=>editable&&canEdit()&&mode()==='ON';
  function render(){
    for(const [trade,key] of Object.entries(panels)){
      const panel=document.getElementById(`preliminary-section${key}Enabled`);if(!panel)continue;
      let host=panel.querySelector('[data-manual-works]');
      if(!host){host=document.createElement('section');host.className='manual-works';host.dataset.manualWorks=trade;panel.append(host);}
      const own=rows.filter(r=>r.trade===trade),draft=drafts.get(trade),write=writable(),privateView=canViewCost();
      host.hidden=!own.length&&!write;
      host.innerHTML=`<header><h4>직접 추가 공사</h4>${write&&!draft?'<button type="button" data-manual-new>+ 직접 공사 추가</button>':''}</header><div class="manual-work-list">${own.map(r=>`<div class="manual-work-row"><div><strong>${esc(r.name)}</strong>${r.note?`<small>${esc(r.note)}</small>`:''}</div><div><span>판매금액</span><strong>${won(manualWorkAmount(r.amount))}</strong>${r.amount!==manualWorkAmount(r.amount)?`<small>입력 ${won(r.amount)} · 천 원 미만 절사</small>`:''}${privateView?`<small data-manual-cost>${r.costAmount==null?'원가 미확정':`내부 원가 ${won(r.costAmount)} · 이익 ${won(manualWorkAmount(r.amount)-r.costAmount)}`}</small>`:''}</div>${write?`<div class="manual-work-actions"><button type="button" data-manual-edit="${r.id}">수정</button><button type="button" data-manual-remove="${r.id}" title="공사 삭제" aria-label="${esc(r.name)} 삭제">삭제</button></div>`:''}</div>`).join('')}</div>${draft&&write?`<form data-manual-form><label>공사명<input name="name" maxlength="100" required value="${esc(draft.name)}"></label><label>고객 판매금액 (원)<input name="amount" type="number" min="0" max="1000000000" step="1" inputmode="numeric" required value="${esc(draft.amount)}"></label><label>내부 원가 (원, 선택)<input name="costAmount" type="number" min="0" max="1000000000" step="1" inputmode="numeric" placeholder="원가 미확정" value="${esc(draft.costAmount??'')}"></label><label>고객 표시 비고 (선택)<input name="note" maxlength="300" value="${esc(draft.note)}"></label><output data-manual-preview>${draft.amount===''?'판매금액 미입력':`견적 반영금액 ${won(manualWorkAmount(Number(draft.amount)))}`}</output><div class="manual-work-actions"><button type="submit">${rows.some(r=>r.id===draft.id)?'적용':'추가'}</button><button type="button" data-manual-cancel>취소</button></div><p role="status" data-manual-error></p></form>`:''}`;
      host.oninput=event=>{event.stopPropagation();const n=event.target,d=drafts.get(trade);if(!d||!['name','amount','note','costAmount'].includes(n.name))return;d[n.name]=n.value;const preview=host.querySelector('[data-manual-preview]');if(preview)preview.textContent=d.amount===''?'판매금액 미입력':`견적 반영금액 ${won(manualWorkAmount(Number(d.amount)))}${Number(d.amount)%1000?' · 천 원 미만 절사':''}`;};
      host.onchange=event=>event.stopPropagation();
      host.onsubmit=event=>{event.preventDefault();event.stopPropagation();if(!writable()||!event.target.reportValidity())return;const d=drafts.get(trade);try{const row=normalizeManualWorks([{...d,trade,amount:Number(d.amount),costAmount:d.costAmount==null||d.costAmount===''?null:Number(d.costAmount)}])[0],index=rows.findIndex(r=>r.id===row.id);if(index<0)rows.push(row);else rows[index]=row;drafts.delete(trade);render();changed();}catch(error){host.querySelector('[data-manual-error]').textContent=error.message;}};
      host.onclick=event=>{const n=event.target.closest('button');if(!n)return;event.stopPropagation();if(!writable()||n.type==='submit')return;
        if(n.hasAttribute('data-manual-new'))drafts.set(trade,{id:crypto.randomUUID(),name:'',amount:'',note:''});
        else if(n.hasAttribute('data-manual-cancel')){drafts.delete(trade);}
        else if(n.dataset.manualEdit){if(drafts.has(trade)&&!document.defaultView.confirm('입력 중인 직접 공사를 닫을까요?'))return;drafts.set(trade,{...rows.find(r=>r.id===n.dataset.manualEdit)});}
        else if(n.dataset.manualRemove){if(!document.defaultView.confirm('이 직접 공사를 삭제할까요?'))return;rows=rows.filter(r=>r.id!==n.dataset.manualRemove);if(drafts.get(trade)?.id===n.dataset.manualRemove)drafts.delete(trade);render();changed();return;}
        render();host.querySelector('[name="name"]')?.focus();
      };
    }
  }
  return {render,rows:()=>structuredClone(rows),isDirty:()=>drafts.size>0,
    restore(estimate){rows=(estimate?.manualWorks??estimate?.itemBuilder?.manualWorks??[]).map(manualWorkInput);editable=!estimate?.id||estimate.canEdit!==false&&estimate.confirmation?.state!=='confirmed';drafts.clear();render();},
    reset(){rows=[];editable=true;drafts.clear();render();},
  };
}
