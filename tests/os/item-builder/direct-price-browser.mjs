import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {artifactRoot} from './runtime.mjs';
import {assertContainer,sql} from '../db/rebuild/stack.mjs';
import {ACCOUNTS,ACCOUNT_PASSWORD} from '../db/fixtures.mjs';

const APP='http://127.0.0.1:3111',AUTH='http://127.0.0.1:56321';
assertContainer();mkdirSync(artifactRoot,{recursive:true});
const protectedState=()=>sql("BEGIN READ ONLY; SELECT md5(coalesce(string_agg(t::text,'' ORDER BY id),'')) FROM public.estimate_item_templates t WHERE draft_config->>'name'='타일 테스트'; SELECT md5(coalesce(string_agg(t::text,'' ORDER BY id),'')) FROM public.estimate_item_versions t WHERE template_id IN(SELECT id FROM public.estimate_item_templates WHERE draft_config->>'name'='타일 테스트'); ROLLBACK;");
const original=protectedState(),errors=[];let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++;};
const require=createRequire(join(homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/item-builder.cjs'));
const browser=await require('playwright').chromium.launch({channel:'msedge',headless:true});
async function login(role,width=1440){
  const context=await browser.newContext({viewport:{width,height:1000}});
  await context.route('**/*',r=>[APP,AUTH].includes(new URL(r.request().url()).origin)?r.continue():r.abort());
  const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(APP+'/os-app/index.html');await page.locator('#loginEmail').fill(ACCOUNTS.find(a=>a.label===role).email);await page.locator('#loginPassword').fill(ACCOUNT_PASSWORD);await page.locator('#loginForm button[type=submit]').click();await page.locator('#appShell:not(.app-locked)').waitFor();
  return {context,page};
}
let active;
try{
  const {context,page}=await login('admin-active');active=page;
  await page.locator('[data-tab=system]').click();await page.locator('[data-builder-new]').click();
  const name='SYSTEM_DIRECT_PRICE 타일 '+Date.now();await page.locator('[data-builder-form] [name=name]').fill(name);await page.locator('[name=trade]').selectOption('bathroom');await page.locator('[data-builder-form] [name=unit]').selectOption('㎡');
  check(await page.locator('[name=directCost]').inputValue()==='','blank cost is not invented as zero');
  check(await page.locator('[data-builder-component-add],[data-builder-component]').count()===0,'no composition controls required');
  await page.locator('[name=directCost]').fill('30000');
  const command=action=>page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/estimate-items'&&r.request().postDataJSON()?.action===action);
  let pending=command('save');await page.locator('[data-builder-form] button[type=submit]').click();let response=await pending;check(response.status()===200,'direct price saved');const head=await response.json();
  await page.locator('[data-builder-trial=quantity]').fill('4');pending=command('preview');await page.locator('[data-builder-preview]').click();response=await pending;check(response.status()===200,'direct price trial');const preview=await response.json();
  check(preview.costUnit===30000&&preview.preliminaryUnit===39000&&preview.detailedUnit===40000,'existing policies applied once');check(preview.preliminarySale===156000,'trial quantity and amount');
  await page.waitForFunction(()=>document.querySelector('[data-builder-preliminary-unit]')?.textContent.includes('39,000'));check((await page.locator('[data-builder-preliminary-unit]').textContent()).includes('39,000'),'preliminary unit visible');check((await page.locator('[data-builder-detailed-unit]').textContent()).includes('40,000'),'detailed unit visible');
  await page.locator('[data-builder-reason]').fill('직접 단가 입력 검증');pending=command('publish');await page.locator('[data-builder-publish]').click();response=await pending;check(response.status()===200,'direct price published');const v1=(await response.json()).current_version;
  await page.waitForFunction(()=>document.querySelector('[data-builder-status]')?.textContent==='게시 완료'&&document.querySelector('[data-builder-preliminary-unit]')?.textContent.includes('39,000'));check((await page.locator('[data-builder-detailed-unit]').textContent()).includes('40,000'),'published prices remain visible');
  for(const width of[1440,375,360]){await page.setViewportSize({width,height:1000});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);await page.locator('.item-builder').screenshot({path:new URL(`direct-price-${width}.png`,artifactRoot).pathname.replace(/^\//,'')});}
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-tab=client]').click();await page.locator('#projectName').fill(name);await page.locator('#clientName').fill('합성 고객');await page.locator('#areaPyeong').fill('30');await page.locator('#preliminary-sectionBathroomEnabled-button').click();
  const option=page.locator(`[data-item-choose=bathroom] option[value="${v1}"]`);check(await option.isEnabled(),'priced tile selectable');await page.locator('[data-item-choose=bathroom]').selectOption(v1);await page.locator('[data-item-add=bathroom]').click();await page.locator('[data-item-key=quantity]').fill('4');await page.locator('[data-item-key=quantity]').blur();
  await page.waitForFunction(()=>document.querySelector('[data-item-output]')?.textContent.includes('156,000'));check((await page.locator('[data-item-output]').textContent()).includes('39,000'),'quantity unit price and amount visible');
  pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/os/estimates'&&r.request().method()==='POST');await page.locator('#saveEstimateButton').click();response=await pending;check(response.status()===201,'actual quote save');const saved=await response.json();
  check(saved.estimate_data.itemBuilder.privateRows[0].version.frozen.costUnit===30000,'frozen direct cost saved');
  await page.reload();await page.locator('#appShell:not(.app-locked)').waitFor();await page.locator(`#projectSearchResults option[value="${saved.id}"]`).waitFor({state:'attached'});await page.locator('#projectSearchResults').selectOption(saved.id);await page.getByRole('button',{name:'불러오기',exact:true}).click();await page.locator('[data-item-key=quantity]').waitFor({state:'attached'});check(await page.locator('[data-item-key=quantity]').inputValue()==='4','saved inputs restored');check((await page.locator('[data-item-output]').textContent()).includes('156,000'),'saved price restored');
  await page.locator('[data-tab=system]').click();await page.locator(`[data-builder-open="${head.id}"]`).click();check(await page.locator('[name=directCost]').inputValue()==='30000','definition direct price restored');check((await page.locator('[data-builder-preliminary-unit]').textContent()).includes('39,000'),'reopened definition shows its sales price');await page.locator('[name=directCost]').fill('45000');check((await page.locator('[data-builder-preliminary-unit]').textContent())==='시험 계산 전','editing price invalidates previous display');pending=command('save');await page.locator('[data-builder-form] button[type=submit]').click();await pending;pending=command('preview');await page.locator('[data-builder-preview]').click();await pending;await page.locator('[data-builder-reason]').fill('새 직접 단가 버전');pending=command('publish');await page.locator('[data-builder-publish]').click();check((await pending).status()===200,'new price version published');
  const frozen=JSON.parse(sql(`BEGIN READ ONLY; SELECT json_build_object('price',frozen->'costUnit','definition',frozen->'definition'->'pricing'->'costUnit') FROM public.estimate_item_versions WHERE id='${v1}'; ROLLBACK;`));check(frozen.price===30000&&frozen.definition===30000,'V1 direct price immutable');
  check(protectedState()===original,'user tile test unchanged');await context.close();
  for(const role of['manager-active','staff-active']){
    const actor=await login(role,375);
    if(role==='manager-active'){await actor.page.locator('[data-tab=system]').click();await actor.page.locator(`[data-builder-open="${head.id}"]`).click();check(await actor.page.locator('[name=directCost]').isDisabled(),'manager cannot change company unit cost');}
    else {check(await actor.page.locator('.item-builder').count()===0,'staff no internal pricing form');const data=await actor.page.evaluate(async()=>{const {requestEstimateItems}=await import('/os-app/src/storage.js');return requestEstimateItems('catalog');});check(!JSON.stringify(data).match(/costUnit|pricing|components|targetMargin/),'staff catalog excludes direct cost and internal policy');}
    await actor.context.close();
  }
  check(errors.length===0,'browser errors absent');writeFileSync(new URL('direct-price-result.json',artifactRoot),JSON.stringify({result:'PASS',checks,templateId:head.id,estimateId:saved.id,userItemUnchanged:true,productionAccess:0},null,2));console.log(JSON.stringify({result:'PASS',checks,userItemUnchanged:true,productionAccess:0}));
}catch(error){if(active&&!active.isClosed())await active.screenshot({path:new URL('direct-price-failure.png',artifactRoot).pathname.replace(/^\//,''),fullPage:true});throw error;}finally{await browser.close();}
