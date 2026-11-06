import { beforeEach, expect, test, vi } from 'vitest';
import { mountPreliminaryPolicyView } from '../../../public/os-app/src/preliminary-policy-view.js';
import { parameterField, parameterStoredValue, ruleField, ruleDescription } from '../../../public/os-app/src/preliminary-policy-fields.js';
import { defaultPolicy, policyCatalog, validatePolicy } from '../../../app/api/os/_lib/calculation/preliminary-policy.js';
import { createEstimateCalculation } from '../../../app/api/os/_lib/calculation/calculator/estimate-core.js';

const base = () => defaultPolicy(createEstimateCalculation().policyDefaults());
const copy = value => structuredClone(value);
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const click = selector => document.querySelector(selector).click();
const change = (selector, value) => { const input=document.querySelector(selector);input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));return input; };
async function mount({editable=true,allowed=true,config=base()}={}) {
  let state={current:copy(config),draft:null,revision:0,master_hash:'synthetic',version:0,catalog:policyCatalog(),can_edit:editable,history:[]};
  const calls=[];
  const request=vi.fn(async body=>{
    if(!body)return copy(state);
    calls.push(copy(body));
    if(body.action==='save'){validatePolicy(body.config);state={...state,draft:copy(body.config),revision:state.revision+1};}
    if(body.action==='cancel')state={...state,draft:null,revision:state.revision+1};
    if(body.action==='preview')return{before:{cost:1,total:1},after:{cost:1,total:1},changes:[],examples:[],preview_token:'synthetic'};
    return copy(state);
  });
  const view=mountPreliminaryPolicyView({document,request,canView:()=>allowed,getInputs:()=>({}),onPublished:vi.fn()});
  await view.load();
  return{view,request,calls,original:copy(config)};
}
function trade(name,tab='rules'){click(`[data-policy-trade="${name}"]`);click(`[data-policy-tab="${tab}"]`);}
async function saved(context){click('[data-policy-action="save"]');await tick();return context.calls.at(-1).config;}
beforeEach(()=>{document.body.innerHTML='<section class="system-cost-card"><div class="section-heading"></div><div id="systemCostItemTools"></div><div id="systemCostAccordion"></div></section>';vi.stubGlobal('confirm',vi.fn(()=>true));});

test('all nine trades preserve 109 prices, 29 parameters and 39 rules without editing any setting',async()=>{
  const c=await mount(),prices=new Set(),parameters=new Set(),rules=new Set();
  for(const name of['철거','전기·조명','욕실·타일','도배','필름','바닥','목공','가구','마감·기타'])for(const tab of['prices','rules']){
    trade(name,tab);
    document.querySelectorAll('[data-policy-price]').forEach(n=>prices.add(n.dataset.policyPrice));
    document.querySelectorAll('[data-policy-parameter]').forEach(n=>parameters.add(n.dataset.policyParameter));
    document.querySelectorAll('[data-policy-basic-rule]').forEach(n=>rules.add(n.dataset.policyBasicRule));
    expect(document.querySelectorAll('[data-expression-kind]')).toHaveLength(0);
  }
  expect([prices.size,parameters.size,rules.size]).toEqual([109,29,39]);expect(c.view.isDirty()).toBe(false);expect(c.calls).toEqual([]);
});

test('wallpaper labor is directly editable without opening any formula editor',async()=>{
  const c=await mount();trade('도배');
  expect(document.querySelector('[data-policy-simple-rule="wallpaper.p20.basic"]').value).toBe('5');
  expect(document.querySelector('[data-policy-simple-rule="wallpaper.p20.base"]').value).toBe('6');
  change('[data-policy-simple-rule="wallpaper.p20.basic"]',7);
  const config=await saved(c);expect(config.rules['wallpaper.p20.basic']).toEqual({value:7});expect(config.rules['wallpaper.p20.base']).toEqual(c.original.rules['wallpaper.p20.base']);
});

test('bathroom coefficients keep the existing count multiplication and show specific units',async()=>{
  const c=await mount();trade('욕실·타일');
  const worker=document.querySelector('[data-policy-simple-rule="tile.worker"]');expect(worker.getAttribute('aria-label')).toBe('욕실 1칸당 타일 기공');expect(worker.value).toBe('3');
  change('[data-policy-simple-rule="tile.worker"]',4);const config=await saved(c);
  expect(config.rules['tile.worker']).toEqual({operator:'multiply',args:[{variable:'count'},{value:4}]});
  const core=createEstimateCalculation({preliminaryPolicy:config}),r=core.calculate(core.readState({sectionBathroomEnabled:true,tileEnabled:true,bathroomUnits:'2'}));
  const row=r.details.find(d=>d.item==='타일 기공');expect(row.quantity).toBe('8품');expect(row.cost).toBe(8*config.prices.TILE_LABOR_WORKER);
});

test('bathroom value grade uses percent with the actual set cost, never a displayed raw multiplier',async()=>{
  const c=await mount();trade('욕실·타일');
  const input=document.querySelector('[data-policy-parameter="fixtureValueMultiplier"]');expect(input.value).toBe('75');expect(input.closest('.policy-simple-field').textContent).toContain('기본형 1칸');
  change('[data-policy-parameter="fixtureValueMultiplier"]',80);const config=await saved(c);expect(config.parameters.fixtureValueMultiplier).toBe(.8);
});

test('blurring an unchanged rounded percentage does not rewrite a more precise stored value',async()=>{
  const config=base();config.parameters.fixtureValueMultiplier=.732234785634;
  const c=await mount({config});trade('욕실·타일');const input=document.querySelector('[data-policy-parameter="fixtureValueMultiplier"]');change('[data-policy-parameter="fixtureValueMultiplier"]',input.value);expect(c.view.isDirty()).toBe(false);expect((await saved(c)).parameters.fixtureValueMultiplier).toBe(config.parameters.fixtureValueMultiplier);
});

test.each(['finishWaste','woodWaste'])('%s shows a 15 percent allowance while preserving the multiplier on save',async key=>{
  const c=await mount();trade(key==='woodWaste'?'목공':'도배');expect(document.querySelector(`[data-policy-parameter="${key}"]`).value).toBe('15');
  change(`[data-policy-parameter="${key}"]`,20);expect((await saved(c)).parameters[key]).toBe(1.2);
});

test('electrical working days appear with quantities, not as a won-denominated price',async()=>{
  await mount();trade('전기·조명','prices');expect(document.querySelector('[data-policy-price="ELEC_DAYS_UNDER10"]')).toBeNull();
  trade('전기·조명');expect(document.querySelector('[data-policy-price="ELEC_DAYS_UNDER10"]')).not.toBeNull();expect(document.querySelector('[data-policy-price="ELEC_DAYS_UNDER10"]').closest('.policy-price-row').textContent).not.toContain('원/');
});

test('wood worker and equipment quantities stay linked after a direct edit',async()=>{
  const c=await mount();trade('목공');change('[data-policy-simple-rule="bom.coffer.WOOD_LABOR_WORKER"]',3);
  expect(document.querySelector('[data-policy-simple-rule="bom.coffer.WOOD_MACHINE_DAY"]').value).toBe('3');const config=await saved(c);expect(config.rules['bom.coffer.WOOD_LABOR_WORKER']).toEqual(config.rules['bom.coffer.WOOD_MACHINE_DAY']);
});

test('furniture and T3 conversion edit the existing divisor without changing rounding',async()=>{
  const c=await mount();trade('가구');change('[data-policy-simple-rule="furniture.ja"]',350);trade('목공');change('[data-policy-simple-rule="carpentry.t3"]',1200);
  const config=await saved(c);expect(config.rules['furniture.ja']).toEqual({operator:'ceil',args:[{operator:'divide',args:[{variable:'lengthMm'},{value:350}]}]});expect(config.rules['carpentry.t3'].args[1].value).toBe(1200);
});

test('millimetre display maps back to the original metre parameter',async()=>{
  const c=await mount();trade('가구');expect(document.querySelector('[data-policy-parameter="counterMinimumM"]').value).toBe('1000');change('[data-policy-parameter="counterMinimumM"]',1500);expect((await saved(c)).parameters.counterMinimumM).toBe(1.5);
});

test('custom formulas remain exact and are not replaced by a presumed standard coefficient',async()=>{
  const config=base();config.rules['tile.worker']={operator:'add',args:[copy(config.rules['tile.worker']),{value:1}]};
  const c=await mount({config});trade('욕실·타일');expect(document.querySelector('[data-policy-simple-rule="tile.worker"]')).toBeNull();expect(document.querySelector('[data-policy-basic-rule="tile.worker"]').textContent).toContain('욕실 칸 수');expect(await saved(c)).toEqual(config);
});

test('a custom fixed total must not be mislabeled as a quantity per bathroom or site',()=>{
  for(const key of['tile.worker','bom.coffer.WOOD_LABOR_WORKER']){const rule=policyCatalog().rules.find(r=>r.key===key),field=ruleField(rule,{value:7});expect(field.label).toContain('고정 총량');expect(field.label).not.toMatch(/1칸당|1개소당/);}
});

test('normal material calculations use a business description, while altered formulas retain their actual meaning',()=>{
  const rule=policyCatalog().rules.find(r=>r.key==='wallpaper.rolls');expect(ruleDescription(rule,rule.formula)).not.toContain('÷');expect(ruleDescription(rule,rule.formula)).toContain('소수점 올림');
  const changed={operator:'floor',args:[copy(rule.formula.args[0])]};expect(ruleDescription(rule,changed)).toContain('내림');expect(ruleDescription(rule,changed)).not.toContain('올림');
});

test('advanced and simple edits stay synchronized without two conflicting values',async()=>{
  const c=await mount();trade('도배');const advanced=document.querySelector('[data-policy-advanced]');advanced.open=true;advanced.dispatchEvent(new Event('toggle'));await tick();
  change('[data-policy-simple-rule="wallpaper.p20.basic"]',8);expect(document.querySelector('[data-rule="wallpaper.p20.basic"][data-expression-value]').value).toBe('8');
  change('[data-rule="wallpaper.p20.basic"][data-expression-value]',9);expect(document.querySelector('[data-policy-simple-rule="wallpaper.p20.basic"]').value).toBe('9');expect((await saved(c)).rules['wallpaper.p20.basic'].value).toBe(9);
});

test('editing a saved draft requires another save before trial and publish',async()=>{
  const c=await mount();trade('도배');change('[data-policy-simple-rule="wallpaper.p20.basic"]',7);await saved(c);expect(document.querySelector('[data-policy-action="preview"]').disabled).toBe(false);
  change('[data-policy-simple-rule="wallpaper.p20.basic"]',8);expect(document.querySelector('[data-policy-action="preview"]').disabled).toBe(true);expect(document.querySelector('[data-policy-action="publish"]').disabled).toBe(true);
});

test('invalid blank input cannot silently save the old value',async()=>{
  const c=await mount();trade('도배');change('[data-policy-simple-rule="wallpaper.p20.basic"]','');click('[data-policy-action="save"]');await tick();expect(c.calls).toEqual([]);expect(document.querySelector('[data-policy-status]').textContent).toContain('확인');
});

test('manager fields remain disabled and staff receives no policy UI',async()=>{
  const c=await mount({editable:false});trade('욕실·타일');expect([...document.querySelectorAll('[data-policy-simple-rule],[data-policy-parameter]')].every(n=>n.disabled)).toBe(true);expect(document.querySelector('[data-policy-action="save"]')).toBeNull();expect(c.calls).toEqual([]);
  c.view.clear();const staff=await mount({allowed:false});expect(staff.request).not.toHaveBeenCalled();expect(document.querySelector('[data-preliminary-policy]').textContent).toBe('');
});

test.each(policyCatalog().parameters)('parameter $key maps its current display back without a material change',p=>{
  const config=base(),shown=parameterField(p,config);expect(parameterStoredValue(shown.transform,shown.value)).toBeCloseTo(config.parameters[p.key],10);
});

test.each(policyCatalog().rules)('rule $key is represented without mutating its stored AST',rule=>{
  const config=base(),before=copy(config.rules[rule.key]),field=ruleField(rule,config.rules[rule.key]);expect(field.label).toBeTruthy();expect(config.rules[rule.key]).toEqual(before);
});
