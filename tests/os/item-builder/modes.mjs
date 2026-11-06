import {artifactRoot} from './runtime.mjs';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {assertContainer,settings,sql,ORIGIN} from '../db/rebuild/stack.mjs';
import {ACCOUNTS,ACCOUNT_PASSWORD} from '../db/fixtures.mjs';
assertContainer();assert.equal(ORIGIN,'http://127.0.0.1:56321');
const s=settings(),saved=JSON.parse(readFileSync(new URL('api-result.json',artifactRoot),'utf8'));
const a=ACCOUNTS.find(a=>a.label==='admin-active'),auth=await fetch(ORIGIN+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:s.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:ACCOUNT_PASSWORD})});assert.equal(auth.status,200);const token=(await auth.json()).access_token;
const state=()=>sql("BEGIN READ ONLY; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.estimates t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.estimate_item_templates t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.estimate_item_versions t; SELECT count(*) FROM public.estimate_item_events; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY detailed_estimate_id)::text,'[]')) FROM public.detailed_estimate_drafts t; ROLLBACK;");
const before=state();let checks=0;const check=(x,label)=>{assert.ok(x,label);checks++;};
async function api(port,path,body,method=body?'POST':'GET'){const r=await fetch(`http://127.0.0.1:${port}/api/os${path}`,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()};}
for(const [port,mode,status]of[[3112,'OFF',503],[3113,'READ_ONLY',423]]){
  check((await api(port,'/estimate-items?view=state')).data.mode===mode,'actual process mode '+mode);
  check((await api(port,'/estimate-items?view=catalog')).status===(mode==='OFF'?503:200),'catalog policy '+mode);
  check((await api(port,'/estimate-items',{action:'save',id:randomUUID(),revision:0,config:saved.config,request_id:randomUUID()})).status===status,'definition write blocked '+mode);
  const quote=await api(port,'/estimates/'+saved.estimateId),d=quote.data.estimate_data;
  const legacyInputs={projectName:'SYSTEM_BUILDER 기능 상태 확인',areaPyeong:'30',...Object.fromEntries(['Demolition','Electrical','Bathroom','Wallpaper','Film','Flooring','Carpentry','Furniture','Finish'].map(t=>[`section${t}Enabled`,false]))};
  check((await api(port,'/estimates/calculate',{inputs:legacyInputs})).status===200,'legacy calculation unaffected '+mode);
  const kept=await api(port,'/estimates/calculate',{estimateId:saved.estimateId,inputs:d.inputs,itemSelections:d.itemBuilder.selections});check(kept.status===200,'adopted unchanged quote preserved '+mode+' '+JSON.stringify({status:kept.status,error:kept.data.error}));
  const selections=structuredClone(d.itemBuilder.selections);selections[0].inputs.quantity+=1;
  check((await api(port,'/estimates/calculate',{estimateId:saved.estimateId,inputs:d.inputs,itemSelections:selections})).status===status,'new item quantity edit blocked '+mode);
  const head=saved.start.id,loaded=await api(port,`/detailed-estimates/${head}/editor`);check(loaded.status===200,'saved detailed read preserved '+mode);
  const editor=loaded.data.editor;editor.items=editor.items.map(i=>{const row={...i};delete row.amount;row.quantity+=1;return row;});
  check((await api(port,`/detailed-estimates/${head}/editor`,{editor,context:loaded.data.context,expected_revision:loaded.data.revision,request_id:randomUUID()},'PATCH')).status===status,'adopted template write blocked '+mode);
}
check(state()===before,'all blocked calls have zero data/history changes');
writeFileSync(new URL('mode-result.json',artifactRoot),JSON.stringify({result:'PASS',checks,modes:['OFF','READ_ONLY'],productionAccess:0,dataChanged:false},null,2));console.log(JSON.stringify({result:'PASS',checks,dataChanged:false}));
