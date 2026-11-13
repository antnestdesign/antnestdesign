import {escapeHtml as esc} from './utils.js';

export function createEstimateConfirmationView({document,load,confirm,revise,isDirty,onLoad,onBusy}) {
  const host=document.createElement('section');host.className='preliminary-confirmation';
  document.querySelector('.estimate-history')?.after(host);
  let current=null,data=null,generation=0,busy=false,notice='',selectedProject='',pending=null;
  const money=n=>Number(n).toLocaleString('ko-KR')+'원';
  const time=s=>new Date(s).toLocaleString('ko-KR');
  function render(){
    if(!current?.id){host.hidden=true;return;}host.hidden=false;
    const state=current.confirmation||{state:'draft',draftVersion:1},frozen=state.viewingVersion;
    const latest=data?.versions?.[0],canConfirm=current.canConfirm&&!frozen,canRevise=current.canCreateRevision&&!frozen;
    const versionsOpen=Boolean(host.querySelector('details')?.open);
    const candidates=!data?.projectId ? data?.projectCandidates||[] : [];
    const needsProject=canConfirm&&candidates.length>0;
    host.innerHTML=`<h3>${frozen?`확정 V${frozen.versionNo} 조회`:state.state==='confirmed'?`확정 V${state.draftVersion}`:state.state==='revising'?`수정본 V${state.draftVersion} 작성 중`:'미확정'}</h3>
      ${state.state==='confirmed'&&(frozen||latest)?`<p>${esc((frozen||latest).confirmedBy)} · ${esc(time((frozen||latest).confirmedAt))}</p>`:''}
      ${notice?`<p role="status" data-confirmation-status>${esc(notice)}</p>`:'<p role="status" data-confirmation-status></p>'}
      ${needsProject?`<div class="management-filters"><label>같은 현장 확인<select data-confirmation-project ${busy?'disabled':''}><option value="">연결할 기존 현장 선택</option>${candidates.map(p=>`<option value="${esc(p.id)}" ${p.archived?'disabled':''} ${p.id===selectedProject?'selected':''}>${esc(p.project_name)}${p.address?' · '+esc(p.address):''}${p.archived?' · 보관됨':''}</option>`).join('')}</select></label></div>${candidates.every(p=>p.archived)?'<p>같은 현장이 보관 중입니다. 복구 후 확정할 수 있습니다.</p>':''}`:''}
      ${canConfirm&&data?.issues?.length?`<ul>${data.issues.map(issue=>`<li>${esc(issue)}</li>`).join('')}</ul>`:''}
      <div class="preliminary-confirmation-actions">
        ${canConfirm?`<button type="button" data-estimate-confirm ${busy||!data||(needsProject&&!selectedProject)?'disabled':''}>견적 확정</button>`:''}
        ${canRevise?`<button type="button" data-estimate-revise ${busy?'disabled':''}>수정본 만들기</button>`:''}
        ${frozen?'<button type="button" data-estimate-current>현재 견적 보기</button>':''}
      </div>
      ${(data?.versions||[]).length?`<details ${frozen||versionsOpen?'open':''}><summary>확정 버전</summary><div class="preliminary-version-list">${data.versions.map(v=>`<div><span>확정 V${v.versionNo} · ${esc(money(v.supply))}<small>${esc(v.confirmedBy)} · ${esc(time(v.confirmedAt))}</small></span><button type="button" data-estimate-version="${esc(v.id)}" ${busy?'disabled':''}>확정본 보기</button></div>`).join('')}</div></details>`:''}`;
  }
  async function refresh(token,id){
    try{
      const next=await load(id);if(token!==generation)return;
      data=next;
      if(!data.projectCandidates?.some(p=>!p.archived&&p.id===selectedProject))selectedProject='';
      render();
    }catch(error){if(token===generation){notice=error.message||'확정 상태를 불러오지 못했습니다.';render();}}
  }
  async function command(action){
    if(busy||!current)return;
    if(isDirty()){notice='저장하지 않은 변경사항이 있습니다. 먼저 견적을 저장해 주세요.';render();return;}
    if(action==='confirm'&&data?.issues?.length){notice='확정 전 확인사항을 해결하고 저장해 주세요.';render();return;}
    if(action==='confirm'&&!data)return;
    const candidates=!data?.projectId ? data?.projectCandidates||[] : [];
    const candidate=candidates.find(p=>!p.archived&&p.id===selectedProject);
    if(action==='confirm'&&candidates.length&&!candidate){notice='같은 현장 후보를 확인해 주세요.';render();return;}
    const id=current.id,token=generation;
    const message=action==='confirm'?`${candidate?candidate.project_name+' 현장에 연결하고 ':''}${money(current.total)} 견적을 확정할까요? 확정 후에는 직접 수정할 수 없으며 수정본을 만들어야 합니다.`:'직전 확정본을 기준으로 수정본을 만들까요? 기존 확정본은 변경되지 않습니다.';
    if(!document.defaultView.confirm(message))return;
    const body={expectedRevision:current.revision,requestId:pending?.action===action?pending.id:crypto.randomUUID(),
      ...(action==='confirm'?{fingerprint:data.fingerprint,projectId:data.projectId||candidate?.id||null}:{})};
    pending={action,id:body.requestId};busy=true;onBusy(true);notice='처리 중입니다.';render();
    try{
      await (action==='confirm'?confirm:revise)(id,body);
      pending=null;if(token===generation)await onLoad(id);
    }catch(error){if(token===generation){notice=error.message||'요청을 완료하지 못했습니다.';if(error.status===409)await refresh(token,id);else render();}}
    finally{busy=false;onBusy(false);render();}
  }
  host.addEventListener('change',event=>{if(event.target.matches('[data-confirmation-project]')){
    selectedProject=event.target.value;pending=null;
    const button=host.querySelector('[data-estimate-confirm]');if(button)button.disabled=!selectedProject||busy;
  }});
  host.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button||busy)return;
    if(button.hasAttribute('data-estimate-confirm'))return command('confirm');
    if(button.hasAttribute('data-estimate-revise'))return command('revise');
    const version=button.dataset.estimateVersion;
    if(version||button.hasAttribute('data-estimate-current')){
      if(isDirty()&&!document.defaultView.confirm('저장하지 않은 변경사항을 버리고 조회할까요?'))return;
      try{await onLoad(current.id,version);}catch(error){notice=error.message;render();}
    }
  });
  return {update(estimate){current=estimate;data=null;notice='';selectedProject='';pending=null;const token=++generation;render();if(estimate?.id)refresh(token,estimate.id);}};
}
