import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {assertContainer,settings,sql,ORIGIN} from '../db/rebuild/stack.mjs';
import {ACCOUNTS,ACCOUNT_PASSWORD} from '../db/fixtures.mjs';
assertContainer();assert.equal(ORIGIN,'http://127.0.0.1:56321');
const APP='http://127.0.0.1:3103',s=settings(),tokens={},out=join(homedir(),'Documents/Codex/2026-07-06/new-chat/outputs/policy-advanced');mkdirSync(out,{recursive:true});
let checks=0,browser,page,ownedDraft=false,expectedDraft;
const check=(value,label)=>{assert.ok(value,label);checks++;};
const protectedRows=()=>sql("BEGIN READ ONLY; SET LOCAL statement_timeout='5s'; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.estimates t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.cost_items t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.detailed_estimate_versions t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.contract_document_versions t; ROLLBACK;");
const before=protectedRows(),errors=[],actions=[];
async function policy(role='admin-active',body){const r=await fetch(APP+'/api/os/preliminary-policy',{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:`Bearer ${tokens[role]}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()};}
async function login(page,role){await page.goto(APP+'/os-app/index.html');await page.locator('#loginEmail').fill(ACCOUNTS.find(a=>a.label===role).email);await page.locator('#loginPassword').fill(ACCOUNT_PASSWORD);await page.locator('#loginForm button[type=submit]').click();await page.locator('#appShell:not(.app-locked)').waitFor();}
async function trade(page,name){await page.locator(`[data-policy-trade="${name}"]`).click();await page.locator('[data-policy-tab="rules"]').click();}
const selector=(path,kind)=>`[data-rule="tile.worker"][data-node="${path}"][data-expression-${kind}]`;
try{
 for(const role of['admin-active','manager-active','staff-active']){const a=ACCOUNTS.find(a=>a.label===role),r=await fetch(ORIGIN+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:s.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:ACCOUNT_PASSWORD})});assert.equal(r.status,200,'Synthetic auth');tokens[role]=(await r.json()).access_token;}
 const initial=await policy();check(initial.status===200&&initial.data.draft===null,'preserve existing drafts');const baseline=structuredClone(initial.data.current);
 const require=createRequire(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/policy-advanced.cjs'));browser=await require('playwright').chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/*',r=>[APP,ORIGIN].includes(new URL(r.request().url()).origin)?r.continue():r.abort());
 page=await context.newPage();page.setDefaultTimeout(45000);let dismissNext=false;page.on('dialog',d=>{if(dismissNext){dismissNext=false;return d.dismiss();}return d.accept();});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url()===APP+'/api/os/preliminary-policy'&&r.method()==='POST')actions.push(r.postDataJSON().action);});
 await login(page,'admin-active');await page.locator('[data-tab="system"]').click();await page.locator('[data-policy-trade="철거"]').waitFor();
 for(const width of[1440,375,360]){
  await page.setViewportSize({width,height:1000});let inspected=0;
  for(const name of[...new Set(initial.data.catalog.rules.map(r=>r.trade))]){
   await trade(page,name);await page.locator('[data-policy-advanced] > summary').click();
   for(const rule of initial.data.catalog.rules.filter(r=>r.trade===name)){
    const item=page.locator(`[data-policy-rule="${rule.key}"]`);await item.locator('> summary').click();check((await item.locator('[data-rule-preview]').innerText()).length>0,'complete expression is visible');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no advanced editor horizontal overflow');check(await item.locator('[data-expression-kind]').count()>0,'named calculation controls available');await item.locator('> summary').click();inspected++;
   }
  }
  check(inspected===39,'every advanced rule inspected at '+width);await trade(page,'욕실·타일');await page.locator('[data-policy-advanced] > summary').click();await page.locator('[data-policy-rule="tile.worker"] > summary').click();check((await page.locator('[data-policy-rule="tile.worker"]').innerText()).includes('욕실 1칸당 투입량 (품)'),'bathroom operand roles');await page.locator('[data-policy-rule="tile.worker"]').screenshot({path:join(out,`bathroom-${width}.png`)});
 }
 check(actions.length===0,'inspection does not save any settings');
 dismissNext=true;await page.locator(selector('','kind')).selectOption('number');check(await page.locator(selector('','kind')).inputValue()==='multiply','destructive simplification cancelled');
 await page.locator(selector('','kind')).selectOption('if');check(await page.locator('[data-policy-rule="tile.worker"]').getAttribute('open')!==null,'opened expression retained');
 await page.locator(selector('args.0','kind')).selectOption('gt');await page.locator(selector('args.0.args.0','kind')).selectOption('variable');await page.locator(selector('args.0.args.1','value')).fill('1');await page.locator(selector('args.0.args.1','value')).blur();
 const text=await page.locator('[data-rule-preview="tile.worker"]').innerText();check(text.includes('욕실 칸 수')&&text.includes('일 때')&&text.includes('그 외'),'conditional complete formula');check((await page.locator('[data-policy-rule="tile.worker"]').innerText()).includes('조건에 맞지 않을 때 결과'),'conditional branch names');await page.locator('[data-policy-rule="tile.worker"]').screenshot({path:join(out,'condition-360.png')});
 let response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().method()==='POST'&&r.request().postDataJSON()?.action==='save');await page.locator('[data-policy-action="save"]').click();let saved=await response;check(saved.status()===200,'conditional draft saved through original API');ownedDraft=true;expectedDraft=(await saved.json()).draft;check(expectedDraft.rules['tile.worker'].args[1].operator==='multiply','previous complete calculation preserved as the true branch');
 response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().postDataJSON()?.action==='preview');await page.locator('[data-policy-action="preview"]').click();check((await response).status()===200,'conditional trial uses original engine');
 await page.reload();await page.locator('#appShell:not(.app-locked)').waitFor();await page.locator('[data-tab="system"]').click();await page.locator('[data-policy-trade="철거"]').waitFor();await trade(page,'욕실·타일');await page.locator('[data-policy-advanced] > summary').click();await page.locator('[data-policy-rule="tile.worker"] > summary').click();check(await page.locator(selector('','kind')).inputValue()==='if','saved conditional restored');
 response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().postDataJSON()?.action==='cancel');await page.locator('[data-policy-action="cancel"]').click();check((await response).status()===200,'only owned draft cancelled');ownedDraft=false;
 const final=await policy();check(final.data.draft===null&&JSON.stringify(final.data.current)===JSON.stringify(baseline)&&final.data.version===initial.data.version,'no company policy publication');
 for(const role of['manager-active','staff-active']){
  const c=await browser.newContext({viewport:{width:375,height:1000}});await c.route('**/*',r=>[APP,ORIGIN].includes(new URL(r.request().url()).origin)?r.continue():r.abort());const p=await c.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));await login(p,role);
  if(role==='manager-active'){await p.locator('[data-tab="system"]').click();await p.locator('[data-policy-trade="철거"]').waitFor();await trade(p,'욕실·타일');await p.locator('[data-policy-advanced] > summary').click();await p.locator('[data-policy-rule="tile.worker"] > summary').click();check(await p.locator('[data-policy-rule="tile.worker"] input, [data-policy-rule="tile.worker"] select').evaluateAll(ns=>ns.every(n=>n.disabled)),'manager nested controls read-only');}
  else{check(await p.locator('[data-tab="system"]').isHidden(),'staff management hidden');check(await p.locator('[data-expression-kind]').count()===0,'staff receives no advanced private controls');check((await policy(role)).status===403,'staff private API blocked');}
  await c.close();
 }
 check(errors.length===0,'no browser errors');check(protectedRows()===before,'existing prices estimates versions contracts unchanged');
 const result={result:'PASS',checks,rules:39,widths:[1440,375,360],conditionalSavedRestored:true,originalEngineTrial:true,managerReadOnly:true,staffPrivateAccessBlocked:true,pricesPublished:false,protectedDataUnchanged:true,productionAccess:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(error){if(page&&!page.isClosed()){await page.screenshot({path:join(out,'failure.png'),fullPage:false});console.error(JSON.stringify({error:error.message,clientErrors:errors,visibleTrade:await page.locator('[data-policy-trade][aria-selected="true"]').textContent(),ruleKeys:await page.locator('[data-policy-rule]').evaluateAll(ns=>ns.map(n=>n.dataset.policyRule))}));}throw error;}finally{
 if(ownedDraft){const state=await policy();if(JSON.stringify(state.data.draft)===JSON.stringify(expectedDraft)){const r=await policy('admin-active',{action:'cancel',revision:state.data.revision});assert.equal(r.status,200,'owned draft cleanup');}}
 if(browser)await browser.close();
}
