const tabs={client:'client',estimates:'quote',contracts:'admin',system:'system'};
const views=Object.fromEntries(Object.entries(tabs).map(([k,v])=>[v,k]));
const validId=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export function workspaceLocation(href){
  const url=new URL(href),legacy=['detailed','editor','detailed-estimate'].includes(url.searchParams.get('view'))||['draftId','detailedId','editor'].some(k=>url.searchParams.has(k));
  return {tab:legacy?'quote':tabs[url.searchParams.get('view')]||'client',estimateId:validId(url.searchParams.get('estimateId'))?url.searchParams.get('estimateId'):null,
    versionId:validId(url.searchParams.get('versionId'))?url.searchParams.get('versionId'):null,contractId:validId(url.searchParams.get('contractId'))?url.searchParams.get('contractId'):null,projectId:validId(url.searchParams.get('projectId'))?url.searchParams.get('projectId'):null,legacy};
}
export function createWorkspaceNavigation({window,canLeave,onRestore}){
  let restoring=false,current=workspaceLocation(window.location.href),index=Number(window.history.state?.andOsIndex)||0;
  function write(tab,estimateId,versionId,replace=false,contractId=null,projectId=null){
    current={tab,estimateId:estimateId||null,versionId:versionId||null,contractId,projectId,legacy:false};if(restoring)return;
    const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('view',views[tab]||'client');if(estimateId)url.searchParams.set('estimateId',estimateId);if(versionId)url.searchParams.set('versionId',versionId);
    if(contractId)url.searchParams.set('contractId',contractId);
    if(projectId)url.searchParams.set('projectId',projectId);
    if(!replace&&url.href===window.location.href)replace=true;
    if(!replace)index++;
    window.history[replace?'replaceState':'pushState']({andOsIndex:index},'',url);
    if(window.parent!==window){try{if(window.parent.location.origin===window.location.origin){const parent=new URL(window.parent.location.href);parent.search=url.search;window.parent.history.replaceState(null,'',parent);}}catch{/* Cross-origin embeds keep their own local route. */}}
  }
  window.history.replaceState({andOsIndex:index},'',window.location.href);
  window.addEventListener('popstate',async event=>{
    if(restoring){restoring=false;return;}
    const next=workspaceLocation(window.location.href),nextIndex=Number(event.state?.andOsIndex)||0;
    if(!canLeave()){restoring=true;window.history.go(index-nextIndex||1);return;}
    index=nextIndex;restoring=true;
    try{await onRestore(next);}finally{restoring=false;write(current.tab,current.estimateId,current.versionId,true,current.contractId,current.projectId);}
  });
  return {initial:current,write};
}
