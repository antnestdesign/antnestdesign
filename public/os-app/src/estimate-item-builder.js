import { escapeHtml as esc } from './utils.js';
import {mountManualWorkView} from './manual-work-view.js';

const trades={demolition:'철거·인허가',electrical:'전기·조명',bathroom:'욕실·타일',wallpaper:'도배',film:'필름',flooring:'바닥',carpentry:'목공',furniture:'가구',finish:'마감·기타'};
const sectionKeys={demolition:'Demolition',electrical:'Electrical',bathroom:'Bathroom',wallpaper:'Wallpaper',film:'Film',flooring:'Flooring',carpentry:'Carpentry',furniture:'Furniture',finish:'Finish'};
const units=['개','식','평','㎡','m','품','일','장','통','롤','박스'];
const money=n=>n==null?'가격 미설정':`${Number(n).toLocaleString('ko-KR')}원`;
const quoteAmount=row=>`수량 ${row.quantity.toLocaleString('ko-KR',{maximumFractionDigits:6})}${row.unit}\n판매단가 ${money(row.saleUnitPrice)}/${row.unit}\n판매금액 ${money(row.amount)}`;
const options=(pairs,value)=>pairs.map(([v,l])=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(l)}</option>`).join('');
const recipes=[['quantity','수량 직접 입력'],['length','길이(mm) → m'],['area','가로·세로(mm) → 면적'],['pack','시공면적 → 묶음 수량 올림']];
const fresh=()=>({schema:1,name:'',trade:'finish',spec:'',unit:'개',recipe:{kind:'quantity',step:1,waste:0},components:[],pricing:{kind:'direct',costUnit:null}});
const fields=d=>d.recipe.kind==='length'?[['length','길이','mm']]:d.recipe.kind==='area'?[['width','가로','mm'],['height','세로','mm']]:[['quantity',d.recipe.kind==='pack'?'시공면적':'수량',d.recipe.kind==='pack'?'㎡':d.unit]];

export function mountEstimateItemBuilder({document,request,role,changed}) {
  let mode='OFF',catalog=[],selections=[],rows=[],data={items:[],versions:[]},masters=[],host=null,selected=null,config=null,dirty=false,busy=false,preview=null,trial={},notice='',commands=new Map(),generation=0;
  const mayEdit=()=>role()==='admin'&&mode==='ON'&&!busy;
  const mayPrice=()=>['admin','manager'].includes(role())&&mode==='ON'&&!busy;
  const manual=mountManualWorkView({document,panels:sectionKeys,canEdit:mayPrice,canViewCost:()=>['admin','manager'].includes(role()),mode:()=>mode,changed});
  function directCost(){
    if(config?.pricing?.kind==='direct')return config.pricing.costUnit;
    if(!config?.components.length)return null;
    const parts=config.components.map(c=>{const m=masters.find(m=>m.item_code===c.code);return m?.cost_price==null?null:Math.round(c.quantity*Number(m.cost_price));});
    return parts.some(v=>v===null)?null:parts.reduce((sum,v)=>sum+v,0);
  }
  function status(message,error=false){notice=message;const n=host?.querySelector('[data-builder-status]');if(n){n.textContent=message;n.dataset.error=String(error);}}
  function render(){
    if(!host)return;
    const writable=mayEdit(),h=data.items.find(i=>i.id===selected),history=data.versions.filter(v=>v.template_id===selected),prices=dirty?null:preview||h?.priceSummary;
    host.innerHTML=`<header class="item-builder-heading"><h3>견적 항목 만들기</h3>${role()==='admin'?`<button type="button" data-builder-new ${writable?'':'disabled'}>새 항목</button>`:''}<span>${mode==='READ_ONLY'?'읽기 전용':''}</span></header><p role="status" data-builder-status>${esc(notice)}</p><div class="item-builder-layout"><nav aria-label="등록 항목">${data.items.map(i=>`<button type="button" data-builder-open="${i.id}" aria-pressed="${i.id===selected}"><strong>${esc(i.draft_config.name)}</strong><small>${esc(trades[i.draft_config.trade])} · ${i.current_version?'게시됨':'작성 중'}${i.is_active?'':' · 사용 중지'}</small></button>`).join('')||'<p>등록된 항목 없음</p>'}</nav><div class="item-builder-editor">${config?`<form data-builder-form><div class="item-builder-fields"><label>항목명<input name="name" maxlength="100" required value="${esc(config.name)}"></label><label>공정<select name="trade">${options(Object.entries(trades),config.trade)}</select></label><label>규격<input name="spec" maxlength="200" value="${esc(config.spec)}"></label><label>견적 수량 단위<select name="unit">${options(units.map(v=>[v,v]),config.unit)}</select></label><label>산정 방식<select name="recipe">${options(recipes,config.recipe.kind)}</select></label>${config.recipe.kind==='pack'?`<label>1묶음 시공면적 (㎡)<input name="step" type="number" step="0.000001" min="0.000001" required value="${config.recipe.step}"></label>`:''}<label>할증 수량 (%)<input name="waste" type="number" step="0.01" min="0" max="100" required value="${config.recipe.waste}"></label></div><section class="item-builder-pricing"><h4>가격 설정</h4><label>단위 원가 (원/${esc(config.unit)})<input name="directCost" type="number" min="0" max="1000000000" step="1" inputmode="numeric" placeholder="가격 미설정" value="${directCost()??''}"></label><div class="item-builder-fields"><label>가견적 판매단가 (원/${esc(config.unit)})<input name="preliminarySaleUnit" type="number" min="0" max="1000000000" step="1" inputmode="numeric" value="${config.pricing?.preliminarySaleUnit??''}" placeholder="${prices?esc(money(prices.preliminaryUnit)):'자동 계산 또는 직접 입력'}"><output data-builder-preliminary-unit>${prices?money(prices.preliminaryUnit):directCost()===null?'가격 미설정':'시험 계산 전'}</output></label><label>본견적 판매단가 (원/${esc(config.unit)})<input name="detailedSaleUnit" type="number" min="0" max="1000000000" step="1" inputmode="numeric" value="${config.pricing?.detailedSaleUnit??''}" placeholder="${prices?esc(money(prices.detailedUnit)):'자동 계산 또는 직접 입력'}"><output data-builder-detailed-unit>${prices?money(prices.detailedUnit):directCost()===null?'가격 미설정':'시험 계산 전'}</output></label></div></section><div class="item-builder-command"><button type="submit">임시저장</button><span>${dirty?'저장되지 않은 변경':'저장됨'}</span></div></form><section class="item-builder-trial"><h4>시험 계산</h4><div class="item-builder-fields">${fields(config).map(([key,label,unit])=>`<label>${label} (${unit})<input type="number" min="0" max="1000000" step="0.000001" data-builder-trial="${key}" value="${trial[key]??1}"></label>`).join('')}</div><button type="button" data-builder-preview ${dirty||!h?'disabled':''}>시험 계산</button><div data-builder-result>${preview?`<dl><div><dt>산출 수량</dt><dd>${preview.quantity.toLocaleString('ko-KR')} ${esc(preview.unit)}</dd></div><div><dt>가견적 판매금액</dt><dd>${money(preview.preliminarySale)}</dd></div><div><dt>본견적 초기 판매단가</dt><dd>${money(preview.detailedUnit)}</dd></div></dl>`:''}</div><label>게시 사유<input data-builder-reason maxlength="500"></label><button type="button" data-builder-publish ${!preview||dirty?'disabled':''}>게시</button>${h?.current_version?`<button type="button" data-builder-active>${h.is_active?'신규 사용 중지':'신규 사용 재개'}</button>`:''}</section>${history.length?`<details><summary>게시 이력 ${history.length}개</summary><ul>${history.map(v=>`<li>V${v.version} · ${esc(new Date(v.published_at).toLocaleString('ko-KR'))} · ${esc(v.reason)}</li>`).join('')}</ul></details>`:''}`:'<p>항목을 선택해 주세요.</p>'}</div></div>`;
    const unitSelect=host.querySelector('[name=unit]');
    if(unitSelect){const allowed=config.recipe.kind==='length'?['m']:config.recipe.kind==='area'?['㎡','평']:config.recipe.kind==='pack'?['장','통','롤','박스','개']:units;unitSelect.innerHTML=options(allowed.map(v=>[v,v]),config.unit);}
    if(config?.components.length){const reload=document.createElement('button');reload.type='button';reload.dataset.builderRefreshMasters='';reload.textContent='연결 단가 새로고침';host.querySelector('.item-builder-heading').append(reload);}
    if(!writable)host.querySelectorAll('input,select,button:not([data-builder-open]):not([data-builder-refresh-masters])').forEach(n=>n.disabled=true);
    if(role()==='manager'&&mayPrice()&&h?.current_version&&config?.pricing)host.querySelectorAll('[name=preliminarySaleUnit],[name=detailedSaleUnit],[data-builder-trial],[data-builder-reason],button[type=submit],[data-builder-preview],[data-builder-publish]').forEach(n=>n.disabled=n.hasAttribute('data-builder-preview')?(dirty||!h):n.hasAttribute('data-builder-publish')?(!preview||dirty):false);
    host.querySelector('form')?.addEventListener('submit',event=>{event.preventDefault();event.stopPropagation();execute('save');});
  }
  async function refresh(){const epoch=generation,result=await request('manage');if(epoch!==generation||!['admin','manager'].includes(role()))return;data=result;const row=data.items.find(i=>i.id===selected);if(row&&!dirty)config=structuredClone(row.draft_config);render();}
  async function refreshMasters(){
    const epoch=generation;if(busy||!['admin','manager'].includes(role()))return;
    try{const next=await request('masters');if(epoch!==generation)return;masters=next;preview=null;render();status('게시된 원가 목록을 불러왔습니다.');}catch(error){if(epoch===generation)status(error.message,true);}
  }
  async function execute(action){
    if(!mayPrice()||!config)return;
    const form=host.querySelector('form');if(action==='save'&&!form.reportValidity())return;
    if(action==='publish'&&(!preview||dirty))return;
    if(action==='publish'&&(preview.preliminaryUnit===null||preview.detailedUnit===null)){status('원가를 입력하거나 가견적·본견적 판매단가를 모두 입력해 주세요.',true);host.querySelector('[name=preliminarySaleUnit]').focus();return;}
    const h=data.items.find(i=>i.id===selected),inputs=Object.fromEntries(fields(config).map(([k])=>[k,Number(host.querySelector(`[data-builder-trial="${k}"]`)?.value??trial[k]??1)]));trial=inputs;
    const body={action,id:selected,revision:h?.revision??0,...(action==='save'?{config}:{}),...(action==='preview'?{inputs}:{}),...(action==='publish'?{preview:preview.preview,reason:host.querySelector('[data-builder-reason]').value.trim()}:{}),...(action==='active'?{active:!h.is_active}:{})};
    if(action==='publish'&&!body.reason){status('게시 사유를 입력해 주세요.',true);host.querySelector('[data-builder-reason]').focus();return;}
    if(action==='publish'&&!document.defaultView.confirm('게시 후 새 견적에서 사용할 수 있습니다. 게시할까요?'))return;
    const key=JSON.stringify(body);if(action!=='preview'){if(!commands.has(key))commands.set(key,crypto.randomUUID());body.request_id=commands.get(key);}
    const epoch=generation;busy=true;host.querySelectorAll('button,input,select').forEach(n=>n.disabled=true);
    try {
      const result=await request('manage',body);
      if(epoch!==generation)return;
      if(action==='preview'){preview=result;notice='시험 계산 완료';}
      else {dirty=false;preview=null;notice=action==='save'?'임시저장 완료':action==='publish'?'게시 완료':'사용 상태 변경 완료';}
      busy=false;await refresh();
      if(action==='publish'||action==='active'){const next=await request('catalog');if(epoch!==generation)return;catalog=next;renderQuotes();}
    }catch(error){if(epoch!==generation)return;busy=false;render();status(error.message,true);}
  }
  function change(event){
    const n=event.target;if(!mayPrice()||!config)return;if(!mayEdit()&&!['preliminarySaleUnit','detailedSaleUnit'].includes(n.name)&&!n.dataset.builderTrial&&!n.hasAttribute('data-builder-reason'))return;event.stopPropagation();
    if(n.dataset.builderTrial){trial[n.dataset.builderTrial]=Number(n.value);return;}
    if(n.hasAttribute('data-builder-reason'))return;
    if(n.name==='directCost'){config.pricing={...config.pricing,kind:'direct',costUnit:n.value===''?null:Number(n.value)};config.components=[];}
    else if(['preliminarySaleUnit','detailedSaleUnit'].includes(n.name)){config.pricing={...config.pricing,kind:'direct',costUnit:directCost(),[n.name]:n.value===''?null:Number(n.value)};config.components=[];}
    else if(n.dataset.builderComponent!==undefined){const c=config.components[Number(n.dataset.builderComponent)];c[n.dataset.componentField]=n.dataset.componentField==='quantity'?Number(n.value):n.value;}
    else if(n.name==='recipe'){config.recipe={kind:n.value,step:1,waste:0};if(n.value==='length')config.unit='m';if(n.value==='area')config.unit='㎡';if(n.value==='pack')config.unit='박스';trial={};}
    else if(n.name==='step'||n.name==='waste')config.recipe[n.name]=Number(n.value);
    else if(n.name)config[n.name]=n.value;
    else return;
    dirty=true;preview=null;
    if(n.name==='recipe'||n.dataset.componentField==='code')render();
    else{host.querySelector('[data-builder-preview]').disabled=true;host.querySelector('[data-builder-publish]').disabled=true;host.querySelector('.item-builder-command span').textContent='저장되지 않은 변경';host.querySelector('[data-builder-result]').replaceChildren();host.querySelectorAll('[data-builder-preliminary-unit],[data-builder-detailed-unit]').forEach(n=>n.textContent='시험 계산 전');}
  }
  function click(event){const n=event.target.closest('button');if(!n)return;event.stopPropagation();
    if(n.hasAttribute('data-builder-refresh-masters')){void refreshMasters();return;}
    if(n.hasAttribute('data-builder-open')||n.hasAttribute('data-builder-new')){
      if(dirty&&!document.defaultView.confirm('저장하지 않은 항목 변경사항을 닫을까요?'))return;
      selected=n.dataset.builderOpen||crypto.randomUUID();config=structuredClone(data.items.find(i=>i.id===selected)?.draft_config||fresh());dirty=!n.dataset.builderOpen;trial={};preview=null;notice='';render();return;
    }
    if(!mayPrice()||!config)return;
    for(const action of['preview','publish','active'])if(n.hasAttribute(`data-builder-${action}`))execute(action);
  }
  function renderQuotes(){
    for(const [trade,key]of Object.entries(sectionKeys)){
      const panel=document.getElementById(`preliminary-section${key}Enabled`);if(!panel)continue;
      let node=panel.querySelector('[data-item-quote]');if(!node){node=document.createElement('section');node.className='item-quote';node.dataset.itemQuote=trade;panel.append(node);}
      const own=selections.filter(s=>catalog.find(c=>c.id===s.versionId)?.trade===trade||rows.find(r=>r.id===s.id)?.trade===trade);
      const available=catalog.filter(c=>c.trade===trade);
      node.hidden=mode==='OFF'&&!own.length;
      node.innerHTML=`<h4>추가 공사</h4>${mode==='ON'?`<div class="item-quote-add"><select aria-label="${esc(trades[trade])} 추가 공사" data-item-choose="${trade}"><option value="">항목 선택</option>${available.map(c=>`<option value="${c.id}" ${c.saleUnitPrice===null?'disabled':''}>${esc(c.name)}${c.saleUnitPrice===null?' · 가격 미설정':''}</option>`).join('')}</select><button type="button" data-item-add="${trade}">추가</button></div>`:''}<div>${own.map(s=>{const row=rows.find(r=>r.id===s.id),c=catalog.find(c=>c.id===s.versionId)||row;const inputs=Array.isArray(c?.inputs)?c.inputs:Object.keys(s.inputs).map(key=>({key,label:'수량',unit:c?.unit||''}));return `<div class="item-quote-row"><strong>${esc(c?.name||'저장 항목')}</strong>${inputs.map(f=>`<label>${esc(f.label)} (${esc(f.unit)})<input type="number" min="0" max="1000000" step="0.000001" data-item-input="${s.id}" data-item-key="${esc(f.key)}" value="${s.inputs[f.key]??0}" ${mode==='ON'?'':'disabled'}></label>`).join('')}<output data-item-output="${s.id}">${row?`${row.quantity.toLocaleString('ko-KR')}${esc(row.unit)} · ${money(row.amount)}`:'계산 대기'}</output><button type="button" data-item-remove="${s.id}" ${mode==='ON'?'':'disabled'}>삭제</button></div>`;}).join('')}</div>`;
      for(const row of rows){const output=node.querySelector(`[data-item-output="${row.id}"]`);if(output)output.textContent=quoteAmount(row);}
      node.onchange=e=>{const n=e.target;if(!n.dataset.itemInput||mode!=='ON')return;e.stopPropagation();const s=selections.find(s=>s.id===n.dataset.itemInput);s.inputs[n.dataset.itemKey]=Number(n.value);changed();};
      node.onclick=e=>{const n=e.target.closest('button');if(!n||mode!=='ON')return;e.stopPropagation();if(n.dataset.itemAdd){const id=node.querySelector('[data-item-choose]').value,c=catalog.find(c=>c.id===id);if(!c)return;selections.push({id:crypto.randomUUID(),versionId:id,inputs:Object.fromEntries(c.inputs.map(f=>[f.key,1]))});renderQuotes();changed();}else if(n.dataset.itemRemove){if(!document.defaultView.confirm('이 추가 공사를 삭제할까요?'))return;selections=selections.filter(s=>s.id!==n.dataset.itemRemove);renderQuotes();changed();}};
    }
    manual.render();
  }
  return {
    async loadCatalog(){
      const epoch=++generation;mode='OFF';catalog=[];masters=[];data={items:[],versions:[]};config=null;selected=null;dirty=false;busy=false;preview=null;
      if(host){host.hidden=true;host.replaceChildren();}document.getElementById('openEstimateItemBuilderButton')?.remove();
      try{
        const state=await request('state');if(epoch!==generation)return;
        const next=state.mode==='OFF'?[]:await request('catalog');if(epoch!==generation)return;mode=state.mode;catalog=next;
        renderQuotes();
      }catch{if(epoch!==generation)return;mode='OFF';renderQuotes();}
    },
    async load(){
      const epoch=generation;
      try{
        if(['admin','manager'].includes(role())&&mode!=='OFF'){
          const next=await request('masters');if(epoch!==generation)return;masters=next;
          if(!host){host=document.createElement('section');host.className='item-builder';host.addEventListener('click',click);host.addEventListener('input',change);host.addEventListener('change',e=>{if(e.target.tagName==='SELECT')change(e);});document.querySelector('.system-cost-card')?.append(host);}
          host.hidden=false;await refresh();
          if(!document.getElementById('openEstimateItemBuilderButton')){const button=document.createElement('button');button.type='button';button.id='openEstimateItemBuilderButton';button.textContent='견적 항목 만들기';button.addEventListener('click',()=>host.scrollIntoView({block:'start'}));document.querySelector('.system-cost-card > .section-heading')?.append(button);}
        }else if(host){host.hidden=true;host.replaceChildren();}
      }catch(error){if(epoch!==generation)return;if(host){host.hidden=false;host.textContent=error.message;}}
    },
    selections(){return structuredClone(selections);},
    manualWorks(){return manual.rows();},
    hasPendingManual(){return manual.isDirty();},
    restore(estimate){selections=structuredClone(estimate?.itemSelections??estimate?.itemBuilder?.selections??[]);rows=structuredClone(estimate?.itemRows??estimate?.itemBuilder?.publicRows??[]);manual.restore(estimate);renderQuotes();},
    result(estimate){rows=structuredClone(estimate?.itemRows??estimate?.itemBuilder?.publicRows??[]);for(const row of rows){const n=document.querySelector(`[data-item-output="${row.id}"]`);if(n)n.textContent=quoteAmount(row);}},
    reset(){selections=[];rows=[];manual.reset();renderQuotes();},
    canClose(){if(busy){document.defaultView.alert('항목 처리가 끝난 뒤 다시 시도해 주세요.');return false;}return !dirty&&!manual.isDirty()||document.defaultView.confirm('저장하지 않은 견적 항목 변경사항을 닫을까요?');},
    clear(){generation++;mode='OFF';catalog=[];masters=[];data={items:[],versions:[]};config=null;selected=null;dirty=false;busy=false;preview=null;selections=[];rows=[];manual.reset();if(host){host.hidden=true;host.replaceChildren();}document.getElementById('openEstimateItemBuilderButton')?.remove();renderQuotes();},
    isDirty(){return dirty||manual.isDirty();}
  };
}
