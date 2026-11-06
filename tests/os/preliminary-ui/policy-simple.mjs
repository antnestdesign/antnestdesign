import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { assertContainer, settings, sql, ORIGIN } from '../db/rebuild/stack.mjs';
import { ACCOUNTS, ACCOUNT_PASSWORD } from '../db/fixtures.mjs';
assertContainer();assert.equal(ORIGIN,'http://127.0.0.1:56321');
const APP='http://127.0.0.1:3103',s=settings(),tokens={},out=join(homedir(),'Documents/Codex/2026-07-06/new-chat/outputs/policy-simple');mkdirSync(out,{recursive:true});
let checks=0,browser,ownedDraft=false,expectedDraft;
const check=(value,label)=>{assert.ok(value,label);checks++;};
const protectedRows=()=>sql("BEGIN READ ONLY; SET LOCAL statement_timeout='5s'; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.estimates t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.cost_items t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.detailed_estimate_versions t; SELECT md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY id)::text,'[]')) FROM public.contract_document_versions t; ROLLBACK;");
const protectedBefore=protectedRows();
async function policy(role='admin-active',body){const r=await fetch(APP+'/api/os/preliminary-policy',{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(tokens[role]?{Authorization:`Bearer ${tokens[role]}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json()};}
async function login(page,role){await page.goto(APP+'/os-app/index.html');await page.locator('#loginEmail').fill(ACCOUNTS.find(a=>a.label===role).email);await page.locator('#loginPassword').fill(ACCOUNT_PASSWORD);await page.locator('#loginForm button[type=submit]').click();await page.locator('#appShell:not(.app-locked)').waitFor();}
async function trade(page,name,tab='rules'){await page.locator(`[data-policy-trade="${name}"]`).click();await page.locator(`[data-policy-tab="${tab}"]`).click();}
async function fill(page,selector,value){await page.locator(selector).fill(String(value));await page.locator(selector).blur();}
const errors=[];
try{
 for(const role of['admin-active','manager-active','staff-active']){const a=ACCOUNTS.find(a=>a.label===role),r=await fetch(ORIGIN+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:s.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({email:a.email,password:ACCOUNT_PASSWORD})});assert.equal(r.status,200,'Synthetic auth');tokens[role]=(await r.json()).access_token;}
 const initial=await policy();check(initial.status===200&&initial.data.draft===null,'no existing draft is overwritten');const baseline=structuredClone(initial.data.current);
 const require=createRequire(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/policy-simple.cjs'));
 browser=await require('playwright').chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/*',r=>[APP,ORIGIN].includes(new URL(r.request().url()).origin)?r.continue():r.abort());
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('dialog',d=>d.accept());page.on('pageerror',e=>errors.push(e.message));
 await login(page,'admin-active');await page.locator('[data-tab="system"]').click();await page.locator('[data-policy-trade="철거"]').waitFor();
 for(const width of[1440,375,360]){
  await page.setViewportSize({width,height:1000});const prices=new Set(),params=new Set(),rules=new Set();
  for(const name of['철거','전기·조명','욕실·타일','도배','필름','바닥','목공','가구','마감·기타']){
   for(const tab of['prices','rules']){await trade(page,name,tab);for(const key of await page.locator('[data-policy-price]').evaluateAll(ns=>ns.map(n=>n.dataset.policyPrice)))prices.add(key);for(const key of await page.locator('[data-policy-parameter]').evaluateAll(ns=>ns.map(n=>n.dataset.policyParameter)))params.add(key);for(const key of await page.locator('[data-policy-basic-rule]').evaluateAll(ns=>ns.map(n=>n.dataset.policyBasicRule)))rules.add(key);check(await page.locator('[data-expression-kind]:visible').count()===0,'no formula programming controls on basic screen');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page-wide horizontal overflow');}
  }
  check(prices.size===109&&params.size===29&&rules.size===39,'all nine-trade settings retained at '+width);
  await trade(page,'도배');await page.locator('[data-preliminary-policy]').screenshot({path:join(out,`wallpaper-${width}.png`)});
  await trade(page,'욕실·타일');check(await page.locator('[data-policy-simple-rule="tile.worker"]').inputValue()===String(baseline.rules['tile.worker'].args[1].value),'bathroom per-room coefficient');check(await page.locator('[data-policy-parameter="fixtureValueMultiplier"]').inputValue()===String(Number((baseline.parameters.fixtureValueMultiplier*100).toFixed(8))),'bathroom value percent not raw multiplier');await page.locator('[data-preliminary-policy]').screenshot({path:join(out,`bathroom-${width}.png`)});
 }
 await page.setViewportSize({width:1440,height:1000});
 await trade(page,'도배');await fill(page,'[data-policy-simple-rule="wallpaper.p20.basic"]',baseline.rules['wallpaper.p20.basic'].value+1);await fill(page,'[data-policy-parameter="finishWaste"]',20);
 await trade(page,'욕실·타일');await fill(page,'[data-policy-simple-rule="tile.worker"]',4);await fill(page,'[data-policy-parameter="fixtureValueMultiplier"]',80);
 await trade(page,'목공');await fill(page,'[data-policy-simple-rule="bom.coffer.WOOD_LABOR_WORKER"]',3);check(await page.locator('[data-policy-simple-rule="bom.coffer.WOOD_MACHINE_DAY"]').inputValue()==='3','equipment paired with worker');
 await trade(page,'가구');await fill(page,'[data-policy-parameter="counterMinimumM"]',1500);
 let response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().method()==='POST'&&r.request().postDataJSON()?.action==='save');await page.locator('[data-policy-action="save"]').click();let saved=await response;check(saved.status()===200,'simple changes saved through original API');ownedDraft=true;expectedDraft=(await saved.json()).draft;
 check(expectedDraft.rules['tile.worker'].args[1].value===4&&expectedDraft.parameters.fixtureValueMultiplier===.8&&expectedDraft.parameters.finishWaste===1.2&&expectedDraft.parameters.counterMinimumM===1.5,'stored values preserve original units and AST');
 response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().postDataJSON()?.action==='preview');await page.locator('[data-policy-action="preview"]').click();const trial=await response;check(trial.status()===200,'original engine trial succeeds');const trialData=await trial.json();check(new Set(trialData.examples.map(e=>e.trade)).size===9,'trial covers all nine trades');check(trialData.examples.some(e=>e.after.cost!==e.before.cost),'direct field changes affect actual calculation');
 await page.reload();await page.locator('#appShell:not(.app-locked)').waitFor();await page.locator('[data-tab="system"]').click();await page.locator('[data-policy-trade="철거"]').waitFor();await trade(page,'욕실·타일');check(await page.locator('[data-policy-simple-rule="tile.worker"]').inputValue()==='4','saved quantity restored');check(await page.locator('[data-policy-parameter="fixtureValueMultiplier"]').inputValue()==='80','saved percentage restored');
 response=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/preliminary-policy'&&r.request().postDataJSON()?.action==='cancel');await page.locator('[data-policy-action="cancel"]').click();check((await response).status()===200,'owned draft cancelled without publication');ownedDraft=false;
 const final=await policy();check(final.data.draft===null&&JSON.stringify(final.data.current)===JSON.stringify(baseline)&&final.data.version===initial.data.version,'published company policy unchanged');check(protectedRows()===protectedBefore,'existing quotes masters issued versions and contracts unchanged');
 for(const role of['manager-active','staff-active']){
  const c=await browser.newContext({viewport:{width:375,height:1000}});await c.route('**/*',r=>[APP,ORIGIN].includes(new URL(r.request().url()).origin)?r.continue():r.abort());const p=await c.newPage();p.setDefaultTimeout(45000);p.on('pageerror',e=>errors.push(e.message));await login(p,role);
  if(role==='manager-active'){await p.locator('[data-tab="system"]').click();await p.locator('[data-policy-trade="철거"]').waitFor();await trade(p,'욕실·타일');check(await p.locator('[data-policy-simple-rule="tile.worker"]').isDisabled(),'manager direct quantity is read-only');check(await p.locator('[data-policy-parameter="fixtureValueMultiplier"]').isDisabled(),'manager percentage is read-only');check(await p.locator('[data-policy-action="save"]').count()===0,'no manager save command');await p.locator('[data-preliminary-policy]').screenshot({path:join(out,'manager-375.png')});check((await policy(role,{action:'cancel',revision:final.data.revision})).status===403,'manager write API denied');}
  else{check(await p.locator('[data-tab="system"]').isHidden(),'staff system entry hidden');check(await p.locator('[data-policy-simple-rule],[data-policy-parameter]').count()===0,'staff receives no private fields');check((await policy(role)).status===403,'staff private API denied');}
  await c.close();
 }
 check(errors.length===0,'no browser errors');check(protectedRows()===protectedBefore,'protected data still unchanged after role checks');
 const result={result:'PASS',checks,widths:[1440,375,360],trades:9,prices:109,parameters:29,rules:39,savedAndRestored:true,trialWithExistingEngine:true,pricesPublished:false,protectedDataUnchanged:true,productionAccess:0};writeFileSync(join(out,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{
 if(ownedDraft){const state=await policy();if(JSON.stringify(state.data.draft)===JSON.stringify(expectedDraft)){const cancelled=await policy('admin-active',{action:'cancel',revision:state.data.revision});assert.equal(cancelled.status,200,'owned test draft cleanup');}}
 if(browser)await browser.close();
}
