import { escapeHtml } from './utils.js';

export function createEstimateHistoryView({document, loadHistory, inputIds}) {
  let current = null, generation = 0, busy=false;
  const disabled = new Set();
  const host = document.createElement('section');
  host.className = 'estimate-history';
  host.innerHTML = '<p data-estimate-author></p><p role="status" data-estimate-permission></p><details><summary>견적 변경 이력</summary><div class="estimate-history-scroll" tabindex="0" aria-label="견적 변경 이력"><p>견적을 불러와 주세요.</p></div></details>';
  document.getElementById('saveStatus')?.after(host);
  const author = host.querySelector('[data-estimate-author]'), notice = host.querySelector('[data-estimate-permission]');
  const list = host.querySelector('.estimate-history-scroll');
  function sync() {
    const readonly = busy || Boolean(current?.id && current.canEdit !== true);
    for (const node of disabled) { if(!readonly) {node.disabled = false;delete node.dataset.estimateReadonly;} }
    if(!readonly) disabled.clear();
    const nodes = [...inputIds.filter(id=>!['projectSearch','projectSearchResults'].includes(id)).map(id=>document.getElementById(id)),
      document.getElementById('saveEstimateButton'),document.getElementById('applyLatestPreliminaryPolicyButton'),
      ...document.querySelectorAll('#client input, #client select, #client textarea, [data-item-input], [data-item-remove], [data-item-add], [data-item-choose], #client [data-site-policy] button, [data-manual-works] button')];
    if (readonly) for(const node of nodes) if(node && !node.disabled) {node.disabled=true;node.dataset.estimateReadonly='true';disabled.add(node);}
  }
  const observer = new MutationObserver(()=>sync());
  observer.observe(document.getElementById('client'),{childList:true,subtree:true});
  const value = (v,key)=> {
    if(v==null)return '—';
    if(key==='workflow_state')return ({draft:'작성 중',confirmed:'확정',revising:'수정본 작성 중'})[v]||String(v);
    if(typeof v==='boolean')return v?'선택':'해제';
    const input=key.startsWith('input:')?document.getElementById(key.slice(6)):null;
    if(input?.tagName==='SELECT')return [...input.options].find(option=>option.value===String(v))?.textContent||String(v);
    return typeof v==='number'?v.toLocaleString('ko-KR'):typeof v==='object'?JSON.stringify(v):String(v);
  };
  const label = change=>{
    if(!change.key.startsWith('input:'))return change.label;
    const input = document.getElementById(change.key.slice(6));
    const node = document.querySelector(`label[for="${change.key.slice(6)}"]`) || input?.closest('label');
    const copy=node?.cloneNode(true);copy?.querySelectorAll('input, select, button, small').forEach(n=>n.remove());
    return copy?.textContent?.replace(/\s+/g,' ').trim() || change.label;
  };
  async function showHistory() {
    const token=++generation,id=current?.id;
    if(!id){list.textContent='견적을 불러와 주세요.';return;}
    list.textContent='불러오는 중입니다.';
    try {
      const events = await loadHistory(id,current?.confirmation?.viewingVersion?.id);
      if(token!==generation||current?.id!==id)return;
      const actions={ESTIMATE_SAVE_CREATE:'견적 최초 작성',ESTIMATE_SAVE_DELETE:'견적 삭제',ESTIMATE_FLOW_CONFIRMED:'견적 확정',ESTIMATE_FLOW_REVISION_CREATED:'수정본 생성',ESTIMATE_FLOW_DENIED:'확정·수정본 생성 거부'};
      list.innerHTML=events.map(event=>`<article><strong>${escapeHtml(event.actor||'이름 미등록')}</strong> <time>${escapeHtml(new Date(event.at).toLocaleString('ko-KR'))}</time><div>${actions[event.action]||'견적 수정'}${event.versionNo?' V'+escapeHtml(event.versionNo):''} · 개정 ${escapeHtml(event.revision)}</div>${event.changes.map(c=>`<dl><dt>${escapeHtml(label(c))}</dt><dd>${escapeHtml(value(c.before,c.key))} → ${escapeHtml(value(c.after,c.key))}</dd></dl>`).join('')}</article>`).join('')||'<p>기록된 변경 이력이 없습니다. 과거 이력은 생성하지 않습니다.</p>';
    } catch(error){if(token===generation)list.textContent=error.message||'이력을 불러오지 못했습니다.';}
  }
  host.querySelector('details').addEventListener('toggle',event=>{if(event.target.open)showHistory();});
  return {sync,setBusy(value){busy=value;sync();},update(estimate){current=estimate;generation++;const a=estimate?.authorship;
    author.textContent=estimate?.id?`최초 작성: ${a?.creatorName||'작성자 미확인'} · ${a?.createdAt?new Date(a.createdAt).toLocaleString('ko-KR'):'—'} / 최종 수정: ${a?.editorName||'수정자 미확인'}${a?.editedAt?' · '+new Date(a.editedAt).toLocaleString('ko-KR'):''}`:'새 견적';
    notice.textContent=estimate?.confirmation?.state==='confirmed'?'확정된 견적입니다. 수정본에서 변경할 수 있습니다.':estimate?.id&&estimate.canEdit!==true?'이 견적은 수정 권한이 없습니다.':'';
    sync();if(host.querySelector('details').open)showHistory();else list.textContent='이력을 열어 확인해 주세요.';
  }};
}
