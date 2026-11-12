import {escapeHtml as esc} from './utils.js';
import {mountConfirmedContracts} from './confirmed-contract-view.js';
export const PROJECT_FLOW_LABELS={PROJECT_FLOW_TRANSFERRED:'계약관리 전환',PROJECT_FLOW_BASIS_CHANGED:'계약 기준 견적 변경',PROJECT_FLOW_CONTRACT_RECORDED:'계약 체결 기록',PROJECT_FLOW_STARTED:'착공 처리',PROJECT_FLOW_COMPLETED:'준공 처리',PROJECT_FLOW_CORRECTED:'상태 정정'};
const money=n=>`${Number(n).toLocaleString('ko-KR')}원`;
const time=s=>s?new Date(s).toLocaleString('ko-KR'):'—';
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function contractProposal(basis,amountBasis){return amountBasis==='supply'?basis.supply:basis.total;}
export function contractPriceDifference(basis,amountBasis,value){return Number(value)-Number(contractProposal(basis,amountBasis));}

export function mountProjectWorkflow({document,request,getPdf,role,isEstimateDirty,isBusy,onBusy,onTransferred,onChanged,onOpen,onViewVersion,onLoadContract,onLoadBasis}){
  const quote=document.createElement('section');quote.className='project-flow-transfer';quote.hidden=true;
  const controls=document.getElementById('estimateManagementControls');
  controls.insertBefore(quote,controls.querySelector('.estimate-history'));
  const panel=document.createElement('section');panel.id='projectWorkflowPanel';panel.className='project-workflow-panel';panel.hidden=true;
  document.querySelector('.contract-project-list').after(panel);
  let selected=null,quoteData=null,flow=null,quoteGeneration=0,generation=0,busy=false,loading=false,pending=null,baseline='';
  const contractDocuments=getPdf?mountConfirmedContracts({document,request,getPdf,role,onBusy:value=>{busy=value;syncBusy();onBusy(value);},onIssued:async id=>{await open(id);await onChanged();await updateEstimate(selected);}}):null;
  const syncBusy=()=>{for(const host of [quote,panel])host.querySelectorAll('form input,form select,form textarea,form button').forEach(n=>{n.disabled=busy||loading;});};
  const formState=()=>JSON.stringify([...panel.querySelectorAll('form')].map(f=>[...new FormData(f)]));
  const status=(host,text)=>{host.querySelector('[data-flow-status]').textContent=text||'';};
  const projectPath=id=>`/projects/${id}/workflow`;
  const versionOptions=(rows,current)=>rows.map(v=>`<option value="${esc(v.id)}" ${v.id===current?'selected':''}>확정 V${v.versionNo} · 공급가액 ${money(v.supply)}</option>`).join('');
  const amountText=v=>`공급가액 ${money(v.supply)} · 부가세 ${money(v.vat)} · 공급대가 ${money(v.total)}`;
  function renderQuote(){
    if(!selected?.id||!selected.confirmation?.latestId){quote.hidden=true;return;}quote.hidden=false;
    quote.innerHTML='<h3>계약관리 전환</h3><p role="status" data-flow-status></p>';
    if(!quoteData){status(quote,'계약 전환 정보를 불러오는 중입니다.');return;}
    if(quoteData.basis){quote.insertAdjacentHTML('beforeend',`<p>계약 기준 확정 V${quoteData.basis.versionNo} · ${esc(quoteData.status)}</p><button type="button" data-flow-open="${esc(quoteData.project.id)}">계약 진행 보기</button>`);return;}
    if(!quoteData.canTransfer){status(quote,quoteData.legacy?'기존 계약·공사 프로젝트입니다. 과거 자료를 계약관리에서 조회할 수 있습니다.':'계약관리 전환 권한이 없거나 현재 단계에서 전환할 수 없습니다.');return;}
    const picked=selected.confirmation.viewingVersion?.id||quoteData.versions[0]?.id;
    quote.insertAdjacentHTML('beforeend',`<form data-flow-action="transfer"><label>계약 기준 확정 견적<select name="versionId">${versionOptions(quoteData.versions,picked)}</select></label><p data-transfer-amount></p><p data-transfer-warning role="status"></p><label>계약 예정일(선택)<input type="date" name="plannedContractDate"></label><button type="submit">계약관리로 전환</button></form>`);
    transferSummary();
    syncBusy();
  }
  function transferSummary(){
    const form=quote.querySelector('form');if(!form)return;
    const v=quoteData.versions.find(v=>v.id===form.elements.versionId.value);if(!v)return;
    quote.querySelector('[data-transfer-amount]').textContent=amountText(v);
    quote.querySelector('[data-transfer-warning]').textContent=v.id!==quoteData.versions[0]?.id?'과거 확정 버전을 선택했습니다. 현재 작성 중인 수정본은 계약 기준으로 사용하지 않습니다.':'';
  }
  async function updateEstimate(estimate){
    selected=estimate;quoteData=null;const token=++quoteGeneration;renderQuote();
    const project=estimate?.projectId||estimate?.confirmation?.projectId;
    if(!project||!estimate?.confirmation?.latestId)return;
    try{const data=await request(`${projectPath(project)}?estimateId=${estimate.id}`);if(token!==quoteGeneration)return;quoteData=data;renderQuote();}
    catch(error){if(token===quoteGeneration)status(quote,error.message);}
  }
  function historyHtml(data){
    const labels={status:'진행 상태',flow_version_id:'계약 기준 견적',flow_contract_date:'계약일',flow_contract_amount:'계약금액',flow_amount_basis:'금액 구분',flow_start_date:'착공일',flow_planned_completion_date:'예정 준공일',flow_completion_date:'준공일'};
    const display=(key,value)=>value==null?'—':key==='flow_version_id'?`확정 V${data.versions.find(v=>v.id===value)?.versionNo||'기록'}`:key==='flow_contract_amount'?money(value):key==='flow_amount_basis'?value==='supply'?'부가세 별도':'부가세 포함':String(value);
    return data.history.map(h=>`<article><strong>${esc(PROJECT_FLOW_LABELS[h.action]||'진행 기록')}</strong><small>${esc(h.actor||'이름 미등록')} · ${esc(time(h.at))}</small>${Object.keys(labels).filter(k=>JSON.stringify(h.before[k])!==JSON.stringify(h.after[k])).map(k=>`<p>${labels[k]}: ${esc(display(k,h.before[k]))} → ${esc(display(k,h.after[k]))}</p>`).join('')}${h.reason?`<p>사유: ${esc(h.reason)}</p>`:''}</article>`).join('')||'<p>기록된 진행 이력이 없습니다.</p>';
  }
  function render(){
    const d=flow;if(!d){panel.hidden=true;return;}panel.hidden=false;
    const b=d.basis;
    panel.innerHTML=`<header><div><h2>${esc(d.project.name)}</h2><p>${esc(d.project.customer||'고객명 미등록')} · ${esc(d.status)} · 최초 작성 ${esc(d.project.creator)} · 담당자 ${esc(d.project.assignee||'미지정')}</p></div><button type="button" data-flow-reload>새로고침</button></header><p role="status" data-flow-status></p>
      ${d.legacy?'<p class="project-flow-notice">기존 계약 — 신규 확정 견적 연결 없음. 기존 자료는 보존되며 새 전환 규칙을 자동 적용하지 않습니다. 미연결 과거 상태 정정은 별도 검토가 필요합니다.</p>':''}
      ${b?`<section class="project-flow-basis"><h3>계약 기준 확정 V${b.versionNo}</h3><p>${amountText(b)}</p><p>${esc(b.actor)} · ${esc(time(b.at))}</p><button type="button" data-flow-version>계약 기준 확정본 보기</button></section>`:''}
      ${d.contractDate?`<p><strong>실제 계약:</strong> ${esc(d.contractDate)} · ${money(d.contractAmount)} (${d.amountBasis==='supply'?'부가세 별도':'부가세 포함'})${d.amountReason?` · 차이 승인 사유: ${esc(d.amountReason)}`:''}</p>`:''}
      ${d.packageId?'<p>기존 계약 문서가 연결되어 있습니다.</p>':b?'<p>연결된 계약 문서 없음 · 진행 기록만으로 계약서가 생성되지는 않습니다.</p>':''}
      ${d.canManage&&d.stage==='preparation'?`<form data-flow-action="contract"><h3>계약 체결 사실 기록</h3><div class="project-flow-fields"><label>실제 계약일<input name="date" type="date" required max="${today()}" value="${today()}"></label><label>금액 구분<select name="amountBasis"><option value="vat_included">부가세 포함</option><option value="supply">부가세 별도</option></select></label><label>실제 계약금액(원)<input name="amount" type="number" min="1" max="1000000000000" step="1" required value="${b.total}"></label><label>기존 체결 계약 문서<select name="packageId"><option value="">연결 문서 없음</option>${d.documents.map(p=>`<option value="${esc(p.id)}">${esc(p.contract_no||'기존 계약')}</option>`).join('')}</select></label></div><p data-contract-difference role="status"></p><label data-contract-reason hidden>금액 차이 사유<textarea name="reason" maxlength="1000"></textarea></label>${role()==='admin'?'<label data-contract-approval hidden><input type="checkbox" name="approveDifference">확정 견적과 다른 계약금액을 명시적으로 승인합니다.</label>':''}<button type="submit">계약 체결 기록</button></form>
        <details class="project-flow-basis-change"><summary>계약 기준 견적 변경</summary><form data-flow-action="basis"><label>확정 버전<select name="versionId">${versionOptions(d.versions,b.id)}</select></label><label>변경 사유<textarea name="reason" maxlength="1000" required></textarea></label><button type="submit">기준 견적 변경</button></form></details>`:''}
      ${d.canManage&&d.stage==='contracted'?`<form data-flow-action="start"><h3>착공 처리</h3><div class="project-flow-fields"><label>실제 착공일<input name="date" type="date" min="${esc(d.contractDate)}" max="${today()}" value="${today()}" required></label><label>예정 준공일(선택)<input name="plannedCompletionDate" type="date" min="${esc(d.contractDate)}"></label></div><button type="submit">착공 처리</button></form>`:''}
      ${d.canManage&&d.stage==='started'?`<form data-flow-action="complete"><h3>준공 처리</h3><label>실제 준공일<input name="date" type="date" min="${esc(d.startDate)}" max="${today()}" value="${today()}" required></label><label>비고(선택)<textarea name="note" maxlength="1000"></textarea></label><button type="submit">준공 처리</button></form>`:''}
      ${d.canCorrect?`<details><summary>기록에 따른 상태 정정</summary><p>기록된 사실에 맞춰 ${esc(d.correctionTarget)} 상태로 정정합니다. 계약 취소·단계 되돌리기는 지원하지 않습니다.</p><form data-flow-action="correct"><label>정정 사유<textarea name="reason" required maxlength="1000"></textarea></label><button type="submit">상태 표시 정정</button></form></details>`:''}
      ${b&&!d.canManage?'<p>진행 정보 조회 전용입니다.</p>':''}
      <dl class="project-flow-milestones">${d.milestones.map(m=>`<div><dt>${esc(m.label)}</dt><dd>${esc(String(m.date).slice(0,10))} · ${esc(m.actor)}<small>시스템 기록 ${esc(time(m.at))}</small></dd></div>`).join('')}${d.plannedCompletionDate?`<div><dt>예정 준공일</dt><dd>${esc(d.plannedCompletionDate)}</dd></div>`:''}</dl>
      <details><summary>진행 변경 이력</summary><div class="project-flow-history" tabindex="0">${historyHtml(d)}</div></details>`;
    const contractForm=panel.querySelector('[data-flow-action="contract"]');
    if(contractForm&&d.documents.some(p=>p.issued)){
      for(const option of contractForm.elements.packageId.options){const doc=d.documents.find(p=>p.id===option.value);if(doc?.issued)option.textContent=`${doc.contract_no} · 문서 V${doc.version} (발행·미체결)`;}
      const signed=document.createElement('label');signed.dataset.signedAcknowledgement='';signed.hidden=true;signed.innerHTML='<input name="signedAcknowledged" type="checkbox">선택한 발행 계약서의 서명·실제 체결을 확인했습니다.';contractForm.querySelector('button[type="submit"]').before(signed);
    }
    priceSummary();baseline=formState();syncBusy();
  }
  function priceSummary(reset=false){
    const form=panel.querySelector('[data-flow-action="contract"]');if(!form||!flow?.basis)return;
    if(reset)form.elements.amount.value=contractProposal(flow.basis,form.elements.amountBasis.value);
    const diff=contractPriceDifference(flow.basis,form.elements.amountBasis.value,form.elements.amount.value),hasDifference=diff!==0;
    panel.querySelector('[data-contract-difference]').textContent=hasDifference?`확정 견적 기준과 ${money(diff)} 차이 · 관리자 명시 승인 및 사유 필요`:'확정 견적 기준과 금액이 같습니다.';
    const reason=panel.querySelector('[data-contract-reason]');reason.hidden=!hasDifference;reason.querySelector('textarea').required=hasDifference;
    const approval=panel.querySelector('[data-contract-approval]');if(approval){approval.hidden=!hasDifference;approval.querySelector('input').required=hasDifference;}
  }
  async function open(projectId,loadContract=false){
    const token=++generation;loading=true;syncBusy();
    try{const next=await request(projectPath(projectId));if(token!==generation)return false;flow=next;render();
      if(next.basis)await contractDocuments?.open(projectId,loadContract?{linkedId:next.packageId,loadSaved:id=>onLoadContract?.(id,next.estimateId),loadBasis:id=>onLoadBasis?.(next.estimateId,id,()=>token===generation)}:null);
      else contractDocuments?.clear();return token===generation;}
    catch(error){if(token===generation){flow=null;baseline='';panel.hidden=false;panel.innerHTML='<p role="status" data-flow-status></p>';status(panel,error.message);}return false;}
    finally{if(token===generation){loading=false;syncBusy();}}
  }
  async function submit(event,host){
    const form=event.target.closest('form[data-flow-action]');if(!form)return;event.preventDefault();if(busy||loading||isBusy?.())return;
    const action=form.dataset.flowAction,source=action==='transfer'?quoteData:flow;
    if(action==='transfer'&&isEstimateDirty()){status(host,'저장하지 않은 견적 변경사항이 있습니다. 먼저 저장해 주세요.');return;}
    const values=Object.fromEntries(new FormData(form));let data={...values};
    if(action==='transfer')data.estimateId=selected.id;
    if(action==='contract'){data.amount=Number(values.amount);data.approveDifference=form.elements.approveDifference?.checked===true;if(form.elements.signedAcknowledged)data.signedAcknowledged=form.elements.signedAcknowledged.checked;}
    if(action==='correct')data.status=flow.correctionTarget;
    const message=action==='transfer'?`확정 V${source.versions.find(v=>v.id===data.versionId)?.versionNo}을 기준으로 계약 준비 단계로 전환할까요? 작성 중인 수정본이나 확정 견적은 변경하지 않습니다.`:action==='contract'?`${money(data.amount)} 계약 체결 사실을 기록할까요? 계약서 생성·서명·발행과는 별개입니다.`:action==='basis'?'계약 기준 확정 버전을 변경할까요?':action==='start'?'입력한 실제 착공일로 착공 처리할까요?':action==='complete'?'입력한 실제 준공일로 준공 처리할까요?':'기록된 사실에 맞춰 상태 표시를 정정할까요?';
    if(!document.defaultView.confirm(message))return;
    const key=JSON.stringify([source.project.id,action,source.revision,data]);if(pending?.key!==key)pending={key,id:crypto.randomUUID()};
    busy=true;onBusy(true);form.querySelectorAll('input,select,textarea,button').forEach(n=>{n.disabled=true;});status(host,'처리 중입니다.');
    try{
      await request(projectPath(source.project.id),{method:'POST',body:JSON.stringify({action,expectedRevision:source.revision,requestId:pending.id,data})});
      pending=null;baseline=formState();
      if(action==='transfer'){await onTransferred(source.project.id);await updateEstimate(selected);}
      else {await open(source.project.id);await onChanged();await updateEstimate(selected);}
    }catch(error){status(host,error.message);form.querySelectorAll('input,select,textarea,button').forEach(n=>{n.disabled=false;});}
    finally{busy=false;syncBusy();onBusy(false);}
  }
  quote.addEventListener('submit',e=>submit(e,quote));panel.addEventListener('submit',e=>submit(e,panel));
  quote.addEventListener('change',transferSummary);
  panel.addEventListener('input',()=>priceSummary());panel.addEventListener('change',e=>{
    const form=panel.querySelector('[data-flow-action="contract"]'),doc=flow?.documents.find(p=>p.id===form?.elements.packageId.value),signed=panel.querySelector('[data-signed-acknowledgement]');
    if(signed){signed.hidden=!doc?.issued;form.elements.signedAcknowledged.required=Boolean(doc?.issued);if(e.target.name==='packageId')form.elements.signedAcknowledged.checked=false;}
    if(doc?.issued&&['packageId','amountBasis'].includes(e.target.name)){form.elements.amount.value=form.elements.amountBasis.value==='supply'?doc.supply:doc.total;priceSummary();}else priceSummary(e.target.name==='amountBasis');
  });
  quote.addEventListener('click',e=>{const b=e.target.closest('[data-flow-open]');if(b)onOpen(b.dataset.flowOpen);});
  panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||busy)return;if(b.hasAttribute('data-flow-reload')){if(!isDirty()||document.defaultView.confirm('저장하지 않은 진행 입력을 버리고 새로고침할까요?'))open(flow.project.id);}if(b.hasAttribute('data-flow-version'))onViewVersion(flow.estimateId,flow.basis.id);});
  function isDirty(){return Boolean(contractDocuments?.isDirty()||flow&&!busy&&!loading&&formState()!==baseline);}
  return {updateEstimate,open,isDirty,hide(){generation++;loading=false;flow=null;baseline='';panel.hidden=true;contractDocuments?.clear();syncBusy();},clear(){quoteGeneration++;generation++;loading=false;flow=null;selected=null;quoteData=null;baseline='';quote.hidden=true;panel.hidden=true;contractDocuments?.clear();syncBusy();},projectId:()=>flow?.project.id};
}
