import {escapeHtml as esc} from './utils.js';

export function matchesEstimateSearch(row,keyword='') {
  const haystack=[row.projectName,row.clientName,row.phone,row.address,row.authorship?.creatorName,row.authorship?.editorName].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(keyword.trim().toLowerCase());
}
export function projectStage(value) {
  const v=String(value||'').trim();
  if(['견적','상담','상담중','검토','견적전','NEW','ESTIMATE'].includes(v))return '견적';
  if(['계약 준비','계약 체결'].includes(v))return v;
  if(['계약','계약완료','CONTRACTED'].includes(v))return '계약';
  if(['착공','공사중','진행중','IN_PROGRESS'].includes(v))return '착공';
  if(['준공','완료','COMPLETED'].includes(v))return '준공';
  return '미분류';
}
export function estimateStage(row) {
  const c=row.confirmation||{};
  return c.state==='confirmed'?`확정 V${c.draftVersion||1}`:c.state==='revising'?`수정본 V${c.draftVersion} 작성 중 · 확정 V${Number(c.draftVersion)-1}`:'작성 중';
}

export function mountWorkspaceView({document,request,onFilter,onOpen,onEdit,onCreateProject,onProjectWorkflow}) {
  document.body.dataset.workflowLayout='phase3';
  const quote=document.getElementById('quote'),admin=document.getElementById('admin');
  document.querySelector('[data-tab="quote"]').textContent='견적관리';document.querySelector('[data-tab="admin"]').textContent='계약관리';
  const list=document.getElementById('savedEstimateRows').closest('.internal-card');list.id='estimateManagementList';
  const heading=list.querySelector('h2');if(heading)heading.textContent='견적 목록';list.querySelector('.section-heading p')?.remove();
  const filters=document.createElement('div');filters.className='management-filters';
  filters.innerHTML='<label>견적 검색<input id="estimateManagementSearch" type="search" placeholder="현장, 고객, 작성자 검색"></label><label>견적 상태<select id="estimateManagementFilter"><option value="all">전체</option><option value="draft">작성 중</option><option value="confirmed">확정</option><option value="revising">수정본 작성 중</option></select></label><button type="button" data-refresh-estimates>새로고침</button><button type="button" data-new-project>새 프로젝트</button>';
  list.querySelector('.table-wrap').before(filters);list.querySelector('.table-wrap').classList.add('management-list-scroll');
  const scope=document.createElement('label');scope.innerHTML='조회 범위<select id="estimateManagementScope"><option value="active">진행 중 견적</option><option value="all">전체·과거 견적</option></select>';filters.prepend(scope);
  const oldQuote=document.createElement('details');oldQuote.className='management-quote-preview';oldQuote.innerHTML='<summary>고객용 견적서</summary>';
  oldQuote.append(...quote.children);
  const selected=document.createElement('section');selected.className='management-selected';selected.id='estimateManagementSelected';
  selected.innerHTML='<header><div><h2 data-management-title>견적을 선택해 주세요.</h2><p data-management-meta></p></div><button type="button" data-management-edit hidden>견적 수정</button></header><p role="status" id="estimateManagementStatus"></p><div id="estimateManagementControls"></div>';
  selected.querySelector('#estimateManagementControls').append(document.querySelector('.estimate-history'),document.querySelector('.preliminary-confirmation'));
  selected.append(oldQuote);quote.append(list,selected);
  const printActions=document.getElementById('adminPrintActions');if(printActions)selected.append(printActions);
  const contractList=document.createElement('section');contractList.className='contract-project-list';contractList.innerHTML='<h2>계약·공사 프로젝트</h2><div class="management-filters"><label>프로젝트 검색<input id="contractProjectSearch" type="search" placeholder="현장, 고객 검색"></label><label>진행 상태<select id="contractProjectFilter"><option value="all">계약·착공·준공</option><option value="계약">계약</option><option value="착공">착공</option><option value="준공">준공</option><option value="unclassified">미분류</option><option value="everything">전체 프로젝트</option></select></label></div><div class="table-wrap"><table class="saved-table"><thead><tr><th>현장명</th><th>고객명</th><th>프로젝트 진행</th><th>견적금액</th><th>작업</th></tr></thead><tbody id="contractProjectRows"></tbody></table></div>';
  admin.prepend(contractList);
  contractList.querySelector('h2').textContent='계약·공사 진행';
  contractList.querySelector('.table-wrap').classList.add('project-flow-list-scroll');
  contractList.querySelector('thead tr').innerHTML='<th>현장명</th><th>고객명</th><th>최초 작성자</th><th>담당자</th><th>계약 기준 견적금액</th><th>진행 상태</th><th>계약일</th><th>착공일</th><th>준공일</th><th>관리 기능</th>';
  const contractFilter=contractList.querySelector('select');contractFilter.querySelector('[value="all"]').textContent='계약 준비·체결·착공·준공';
  for(const label of ['계약 준비','계약 체결']){const option=document.createElement('option');option.value=label;option.textContent=label;contractFilter.insertBefore(option,contractFilter.querySelector('[value="계약"]'));}
  const legacy=document.createElement('section');legacy.className='legacy-issued-archive';legacy.id='legacyIssuedArchive';
  legacy.innerHTML='<h2>과거 본견적 발행본</h2><div class="management-filters"><label>프로젝트<select data-archive-project><option value="">프로젝트 선택</option></select></label><label>과거 견적<select data-archive-head><option value="">견적 선택</option></select></label></div><p role="status" data-archive-status></p><div data-archive-versions></div>';
  admin.append(legacy);
  const notice=document.createElement('p');notice.id='consultationAccessNotice';notice.className='status-text';notice.setAttribute('role','status');document.getElementById('saveStatus')?.after(notice);
  const status=document.getElementById('estimateStatus');if(status){status.closest('label').hidden=true;status.disabled=true;}
  let projects=[],contractProjects=[],contractEstimates=[],packages=[],role='staff',current=null,busy=false;
  const archivePanels=[['estimate',list],['contract',contractList]].map(([kind,host])=>{
    const panel=document.createElement('details');panel.hidden=true;
    panel.innerHTML='<summary>삭제한 항목</summary><p role="status"></p><ul></ul>';
    host.append(panel);
    async function refresh(){
      const items=await request('/projects/list-archive');
      panel.querySelector('ul').innerHTML=items.filter(x=>kind==='estimate'?x.kind===kind:x.kind!=='estimate').map(x=>
        `<li>${esc(x.estimate?.project_name||x.project?.project_name||x.target_id)} · ${esc(new Date(x.deleted_at).toLocaleString('ko-KR'))} <button type="button" data-restore-list="${esc(x.target_id)}" data-kind="${esc(x.kind)}">복구</button></li>`).join('')||'<li>삭제한 항목이 없습니다.</li>';
    }
    panel.addEventListener('toggle',()=>{if(panel.open&&role==='admin')refresh().catch(error=>panel.querySelector('[role="status"]').textContent=error.message);});
    panel.addEventListener('click',async event=>{
      const button=event.target.closest('[data-restore-list]');
      if(!button||role!=='admin'||busy)return;
      button.disabled=true;
      try{await changeArchive(button.dataset.kind,button.dataset.restoreList,'restore');}
      catch(error){panel.querySelector('[role="status"]').textContent=error.message;}
      finally{button.disabled=false;}
    });
    return {panel,refresh};
  });
  async function changeArchive(kind,id,action){
    await request('/projects/list-archive',{method:'POST',body:JSON.stringify({kind,id,action})});
    await onOpen(null,'refresh');
  }
  const money=v=>Number(v||0).toLocaleString('ko-KR')+'원';
  const projectFor=row=>projects.find(p=>p.id===(row.projectId||row.confirmation?.projectId));
  function filtered(estimates){const term=document.getElementById('estimateManagementSearch').value,mode=document.getElementById('estimateManagementFilter').value;
    const scope=document.getElementById('estimateManagementScope').value;
    return estimates.filter(row=>{
      const project=projectFor(row),moved=project?.workflow||['계약 준비','계약 체결','계약','착공','준공'].includes(projectStage(project?.status||row.status));
      return (scope==='all'||term.trim()||!moved)&&matchesEstimateSearch(row,term)&&(mode==='all'||(row.confirmation?.state||'draft')===mode);
    });}
  function contractRows(){
    const term=document.getElementById('contractProjectSearch').value.trim().toLowerCase(),mode=document.getElementById('contractProjectFilter').value;
    const data=contractProjects.map(p=>({kind:'contract',targetId:p.id,project:p,estimates:contractEstimates.filter(e=>(e.projectId||e.confirmation?.projectId)===p.id)}));
    for(const e of contractEstimates)if(!e.projectId&&!e.confirmation?.projectId&&(projectStage(e.status)!=='견적'||packages.some(p=>p.estimate_id===e.id)))data.push({kind:'legacy_contract',targetId:e.id,project:{id:e.id,project_name:e.projectName,status:e.status,customer:{name:e.clientName}},estimates:[e]});
    const visible=data.filter(({project:p,estimates})=>{
      const stage=projectStage(p.status||estimates[0]?.status),contracted=packages.some(pack=>estimates.some(e=>e.id===pack.estimate_id));
      const status=mode==='everything'?true:mode==='unclassified'?stage==='미분류':mode==='all'?['계약 준비','계약 체결','계약','착공','준공'].includes(stage)||contracted:stage===mode;
      return status&&`${p.project_name} ${p.customer?.name||''} ${p.address||''}`.toLowerCase().includes(term);
    });
    document.getElementById('contractProjectRows').innerHTML=visible.map(({project:p,estimates,kind,targetId})=>{
      const flow=p.workflow,e=estimates.find(e=>e.id===flow?.estimateId)||estimates[0];
      return `<tr data-project-id="${esc(p.id)}"><td>${esc(p.project_name)}</td><td>${esc(p.customer?.name||e?.clientName||'—')}</td><td>${esc(flow?.creatorName||e?.authorship?.creatorName||'작성자 미확인')}</td><td>담당자 미지정</td><td>${flow?.basis?`${money(flow.basis.supply)}<small>확정 V${flow.basis.versionNo} · 부가세 별도</small>`:e?money(e.total):'—'}</td><td>${esc(p.status||e?.status||'미분류')}${!flow&&projectStage(p.status||e?.status)!=='견적'?'<small>기존 자료</small>':''}</td><td>${esc(flow?.contractDate||'—')}</td><td>${esc(flow?.startDate||'—')}</td><td>${esc(flow?.completionDate||'—')}</td><td>${projects.some(project=>project.id===p.id)?`<button type="button" data-project-workflow="${esc(p.id)}">진행 정보</button>`:''}${e?`<button type="button" data-contract-estimate="${esc(e.id)}">계약 자료</button>`:`<button type="button" data-archive-project-open="${esc(p.id)}">과거 자료</button>`}${role==='admin'?`<button type="button" data-contract-archive="${esc(targetId)}" data-kind="${esc(kind)}">삭제</button>`:''}</td></tr>`;
    }).join('')||'<tr><td colspan="10">해당 프로젝트가 없습니다.</td></tr>';
  }
  for(const id of ['estimateManagementSearch','estimateManagementFilter','estimateManagementScope'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',onFilter);
  for(const id of ['contractProjectSearch','contractProjectFilter'])document.getElementById(id).addEventListener(id.endsWith('Search')?'input':'change',contractRows);
  quote.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.hasAttribute('data-management-edit'))onEdit(current?.id);if(b.hasAttribute('data-refresh-estimates'))onOpen(null,'refresh');if(b.hasAttribute('data-new-project'))onCreateProject();});
  admin.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.projectWorkflow)onProjectWorkflow?.(b.dataset.projectWorkflow);if(b.dataset.contractEstimate)onOpen(b.dataset.contractEstimate,'contract');if(b.dataset.archiveProjectOpen){const select=legacy.querySelector('[data-archive-project]');select.value=b.dataset.archiveProjectOpen;select.dispatchEvent(new Event('change',{bubbles:true}));legacy.scrollIntoView?.({block:'start'});}});
  contractList.addEventListener('click',async event=>{
    const button=event.target.closest('[data-contract-archive]');
    if(!button||role!=='admin'||busy||!document.defaultView.confirm('계약 전체를 목록에서 삭제할까요? 연결된 프로젝트·견적과 발행 자료는 보존됩니다.'))return;
    button.disabled=true;
    try{await changeArchive(button.dataset.kind,button.dataset.contractArchive,'archive');}
    catch(error){document.defaultView.alert(error.message);}
    finally{button.disabled=false;}
  });
  return {filtered,projectFor,updateData(estimates,projectRows,contractPackages,visibleContractProjects,visibleContractEstimates){projects=projectRows;packages=contractPackages;
      if(visibleContractProjects&&visibleContractEstimates){contractProjects=visibleContractProjects;contractEstimates=visibleContractEstimates;contractRows();}
      for(const {panel,refresh} of archivePanels)if(role==='admin'&&panel.open)refresh().catch(error=>panel.querySelector('[role="status"]').textContent=error.message);
      const select=legacy.querySelector('[data-archive-project]'),value=select.value;select.innerHTML='<option value="">프로젝트 선택</option>'+projects.map(p=>`<option value="${esc(p.id)}">${esc(p.project_name)}</option>`).join('');select.value=value;},
    permissions(value){role=value;for(const {panel} of archivePanels){panel.hidden=role!=='admin';if(panel.hidden){panel.open=false;panel.querySelector('ul').textContent='';}}contractRows();const print=document.getElementById('adminPrintActions');if(print)print.hidden=role==='staff';document.getElementById('contractProjectFilter').querySelector('[value="everything"]').hidden=role==='staff';document.getElementById('contractProjectFilter').querySelector('[value="unclassified"]').hidden=role==='staff';},
    updateSelection(estimate){current=estimate;selected.querySelector('[data-management-title]').textContent=estimate?.projectName||'견적을 선택해 주세요.';
      const a=estimate?.authorship;selected.querySelector('[data-management-meta]').textContent=estimate?`${estimate.clientName||'고객명 없음'} · ${money(estimate.total)} · ${estimateStage(estimate)} · 프로젝트 ${projectFor(estimate)?.status||estimate.status||'미분류'} · 최초 작성 ${a?.creatorName||'작성자 미확인'} · 최종 수정 ${a?.editorName||'수정자 미확인'}`:'';
      selected.querySelector('[data-management-edit]').hidden=!estimate?.canEdit;
      selected.querySelector('[data-management-edit]').disabled=busy;
      oldQuote.hidden=!estimate?.id;
      notice.textContent=estimate?.id&&!estimate.canEdit?(estimate.confirmation?.state==='confirmed'?'확정된 견적입니다. 수정본은 견적관리에서 만들 수 있습니다.':'이 견적은 수정 권한이 없습니다.'):'';},
    showStatus(message){document.getElementById('estimateManagementStatus').textContent=message||'';},
    setBusy(value){busy=value;selected.querySelector('[data-management-edit]').disabled=busy;},
    async createProject(seed={}){
      const dialog=document.createElement('dialog');dialog.className='project-create-dialog';dialog.innerHTML=`<form><h2>새 프로젝트</h2><label>현장명<input name="project_name" maxlength="200" required value="${esc(seed.projectName||'')}"></label><label>주소<input name="address" maxlength="500" value="${esc(seed.address||'')}"></label><label>평형<input name="area_pyeong" type="number" min="0" step="0.1" value="${Number(seed.areaPyeong)||0}"></label><label>고객명<input name="client_name" maxlength="200" value="${esc(seed.clientName||'')}"></label><label>연락처<input name="phone" maxlength="100" value="${esc(seed.phone||'')}"></label><p role="status"></p><div><button type="submit">프로젝트 생성</button><button type="button" data-project-cancel>취소</button></div></form>`;document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-project-cancel]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());
      let pending=null;
      dialog.querySelector('form').onsubmit=async event=>{event.preventDefault();const button=dialog.querySelector('[type="submit"]');button.disabled=true;const values=Object.fromEntries(new FormData(event.target)),hasCustomer=String(values.client_name).trim();
        const selection={mode:'new',project_name:values.project_name,address:values.address,area_pyeong:Number(values.area_pyeong),customer_mode:hasCustomer?'new':'undecided',...(hasCustomer?{client_name:values.client_name,phone:values.phone}:{})};
        const key=JSON.stringify(selection);if(pending?.key!==key)pending={key,id:crypto.randomUUID()};
        try{const result=await request('/projects',{method:'POST',body:JSON.stringify({request_id:pending.id,selection})});dialog.close();await onOpen(null,'refresh');return result;}
        catch(error){dialog.querySelector('[role="status"]').textContent=error.message;button.disabled=false;}
      };
    },
  };
}
