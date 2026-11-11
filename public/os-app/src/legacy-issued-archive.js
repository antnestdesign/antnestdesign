import {mountDetailedVersions} from './detailed-version-view.js';
import {escapeHtml as esc} from './utils.js';

export function mountLegacyIssuedArchive({document,request,onContract,role}) {
  const host=document.getElementById('legacyIssuedArchive'),project=host.querySelector('[data-archive-project]'),head=host.querySelector('[data-archive-head]'),status=host.querySelector('[data-archive-status]');
  let generation=0,versions=null;
  const run=async action=>{try{await action();}catch(error){status.textContent=error.message;}};
  project.addEventListener('change',()=>run(async()=>{
    const token=++generation;versions?.destroy();host.querySelector('[data-archive-versions]').replaceChildren();head.innerHTML='<option value="">견적 선택</option>';if(!project.value)return;
    const data=await request(`/projects/${project.value}`);if(token!==generation)return;
    head.innerHTML='<option value="">견적 선택</option>'+(data.drafts||[]).map(d=>`<option value="${esc(d.id)}">${esc(d.title)}</option>`).join('');
    status.textContent=(data.drafts||[]).length?'':'과거 본견적이 없습니다.';
  }));
  head.addEventListener('change',()=>run(async()=>{
    generation++;versions?.destroy();const target=host.querySelector('[data-archive-versions]');target.replaceChildren();if(!head.value)return;
    versions=mountDetailedVersions({host:target,draftId:head.value,canIssue:false,readOnly:true,isDirty:()=>false,request,run,message:text=>{status.textContent=text;},onContract:role()==='admin'?onContract:undefined});await versions.refresh();
  }));
}
