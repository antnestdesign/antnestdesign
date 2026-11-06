import {beforeEach,expect,test,vi} from 'vitest';
import {changeExpressionKind,expressionHelp,expressionModes,expressionRole,expressionVariables,referencedExpressionValues} from '../../../public/os-app/src/preliminary-policy-expression.js';
import {mountPreliminaryPolicyView} from '../../../public/os-app/src/preliminary-policy-view.js';
import {defaultPolicy,policyCatalog,validatePolicy} from '../../../app/api/os/_lib/calculation/preliminary-policy.js';
import {createEstimateCalculation} from '../../../app/api/os/_lib/calculation/calculator/estimate-core.js';
const copy=v=>structuredClone(v),catalog=policyCatalog(),rule=key=>catalog.rules.find(r=>r.key===key);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const change=(selector,value)=>{const input=document.querySelector(selector);input.focus();input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:true}));};
beforeEach(()=>{document.body.innerHTML='<section class="system-cost-card"><div class="section-heading"></div></section>';vi.stubGlobal('confirm',vi.fn(()=>true));});
async function mount(editable=true,config=defaultPolicy(createEstimateCalculation().policyDefaults())){
 const calls=[],state={current:copy(config),draft:null,revision:0,master_hash:'synthetic',version:0,catalog,can_edit:editable,history:[]};
 const request=vi.fn(async body=>{if(body){calls.push(copy(body));if(body.action==='save'){validatePolicy(body.config);return {...state,draft:copy(body.config),revision:1};}}return copy(state);});
 const view=mountPreliminaryPolicyView({document,request,canView:()=>true,getInputs:()=>({}),onPublished:vi.fn()});await view.load();
 return{view,calls,config,request,state};
}
async function advanced(key,trade='욕실·타일'){
 document.querySelector(`[data-policy-trade="${trade}"]`).click();document.querySelector('[data-policy-tab="rules"]').click();const wrapper=document.querySelector('[data-policy-advanced]');wrapper.open=true;wrapper.dispatchEvent(new Event('toggle'));await tick();const item=document.querySelector(`[data-policy-rule="${key}"]`);item.open=true;return item;
}

test.each(Object.keys(expressionModes))('%s has an understandable Korean label and calculation explanation',kind=>{expect(expressionModes[kind]).toMatch(/[가-힣]/);expect(expressionHelp(kind)).toMatch(/[가-힣]/);});
test.each(catalog.rules)('$key gives every operand a role without changing the formula',r=>{const before=copy(r.formula);for(let index=0;index<(r.formula.args||[]).length;index++)expect(expressionRole(r.formula,index,r)).toBeTruthy();expect(r.formula).toEqual(before);});
test('bathroom and masonry use distinct connected quantities',()=>{expect(expressionVariables(rule('tile.worker')).count).toBe('욕실 칸 수');expect(expressionVariables(rule('tile.masonry')).count).toBe('조적칸막이 개소');expect(expressionRole(rule('tile.worker').formula,1,rule('tile.worker'))).toBe('욕실 1칸당 투입량 (품)');});
test('condition and comparison operands are explicitly named',()=>{const r=rule('tile.worker');expect([0,1,2].map(i=>expressionRole({operator:'if'},i,r))).toEqual(['판단 조건','조건에 맞을 때 결과','조건에 맞지 않을 때 결과']);expect(expressionRole({operator:'gte'},1,r)).toBe('이상 기준값');});
test('switching between binary operations retains both existing values and variables',()=>{const r=rule('tile.worker'),old=copy(r.formula),next=changeExpressionKind(old,'divide',r);expect(next).toEqual({operator:'divide',args:old.args});expect(next.args).not.toBe(old.args);expect(old).toEqual(r.formula);});
test('adding rounding wraps the existing calculation rather than dropping the divisor',()=>{const r=rule('furniture.ja'),division=copy(r.formula.args[0]);expect(changeExpressionKind(division,'ceil',r)).toEqual({operator:'ceil',args:[division]});expect(changeExpressionKind(r.formula,'floor',r)).toEqual({operator:'floor',args:[division]});});
test('conditional conversion retains the complete prior calculation as one branch',()=>{const r=rule('tile.worker'),next=changeExpressionKind(r.formula,'if',r);expect(next.args[1]).toEqual(r.formula);expect(changeExpressionKind(next,'add',r).args[0]).toEqual(next);});
test('variable references list only the values actually used by the stored formula',()=>{expect(referencedExpressionValues({value:7},rule('tile.worker'))).toEqual([]);expect(referencedExpressionValues(rule('tile.worker').formula,rule('tile.worker'))).toEqual(['욕실 칸 수']);});
test('unsupported operations and unavailable variable sources cannot silently form an invalid node',()=>{expect(()=>changeExpressionKind({value:1},'eval',rule('tile.worker'))).toThrow();expect(()=>changeExpressionKind({value:1},'variable',rule('wallpaper.p20.basic'))).toThrow();});

test('advanced UI exposes the complete formula and roles, with no change on open',async()=>{
 const c=await mount(),item=await advanced('tile.worker');expect(item.textContent).toContain('욕실 1칸당 투입량 (품)');expect(item.querySelector('[data-rule-preview]').textContent).toBe('(욕실 칸 수 × 3)');expect(item.textContent).not.toContain('욕실 또는 조적');expect(c.view.isDirty()).toBe(false);expect(c.calls).toEqual([]);
});
test('editing a value updates the completed formula and original simple input',async()=>{
 const c=await mount();await advanced('tile.worker');change('[data-rule="tile.worker"][data-node="args.1"][data-expression-value]',4);expect(document.querySelector('[data-rule-preview="tile.worker"]').textContent).toBe('(욕실 칸 수 × 4)');expect(document.querySelector('[data-policy-simple-rule="tile.worker"]').value).toBe('4');document.querySelector('[data-policy-action="save"]').click();await tick();expect(c.calls.at(-1).config.rules['tile.worker'].args[1].value).toBe(4);
});
test('operator selection keeps the opened item and keyboard focus',async()=>{
 const c=await mount();await advanced('tile.worker');change('[data-rule="tile.worker"][data-node=""][data-expression-kind]','divide');expect(document.querySelector('[data-policy-rule="tile.worker"]').open).toBe(true);expect(document.activeElement.dataset.rule).toBe('tile.worker');expect(document.activeElement.dataset.node).toBe('');expect(document.querySelector('[data-rule-preview="tile.worker"]').textContent).toBe('(욕실 칸 수 ÷ 3)');document.querySelector('[data-policy-action="save"]').click();await tick();expect(c.calls.at(-1).config.rules['tile.worker'].args).toEqual(c.config.rules['tile.worker'].args);
});
test('canceling destructive simplification keeps the complete previous expression',async()=>{
 const c=await mount();await advanced('tile.worker');vi.mocked(confirm).mockReturnValue(false);change('[data-rule="tile.worker"][data-node=""][data-expression-kind]','number');expect(confirm).toHaveBeenCalledOnce();expect(c.view.isDirty()).toBe(false);expect(document.querySelector('[data-rule-preview="tile.worker"]').textContent).toBe('(욕실 칸 수 × 3)');expect(document.querySelector('[data-rule="tile.worker"][data-node=""][data-expression-kind]').value).toBe('multiply');
});
test('manager can inspect the same complete formula but cannot edit any nested control',async()=>{
 await mount(false);const item=await advanced('tile.worker');expect([...item.querySelectorAll('input,select')].every(n=>n.disabled)).toBe(true);expect(item.querySelector('[data-rule-preview]').textContent).toBe('(욕실 칸 수 × 3)');expect(document.querySelector('[data-policy-action="save"]')).toBeNull();
});

test('a late system refresh preserves the open advanced section and rule',async()=>{
 const c=await mount();await advanced('tile.worker');let resolve;c.request.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));const loading=c.view.load();resolve(copy(c.state));await loading;await tick();expect(document.querySelector('[data-policy-advanced]').open).toBe(true);expect(document.querySelector('[data-policy-rule="tile.worker"]').open).toBe(true);expect(document.querySelector('[data-rule-preview="tile.worker"]').textContent).toBe('(욕실 칸 수 × 3)');
});
test('edits made while a refresh is in flight are not overwritten by its response',async()=>{
 const c=await mount();await advanced('tile.worker');let resolve;c.request.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));const loading=c.view.load();change('[data-rule="tile.worker"][data-node="args.1"][data-expression-value]',4);resolve(copy(c.state));await loading;expect(c.view.isDirty()).toBe(true);expect(document.querySelector('[data-rule-preview="tile.worker"]').textContent).toBe('(욕실 칸 수 × 4)');document.querySelector('[data-policy-action="save"]').click();await tick();expect(c.calls.at(-1).config.rules['tile.worker'].args[1].value).toBe(4);
});

test('a refresh started before save cannot restore the older unsaved server state afterward',async()=>{
 const c=await mount();await advanced('tile.worker');let resolve;c.request.mockImplementationOnce(()=>new Promise(done=>{resolve=done;}));const loading=c.view.load();document.querySelector('[data-policy-action="save"]').click();await tick();resolve(copy(c.state));await loading;expect(document.querySelector('[data-policy-action="preview"]').disabled).toBe(false);expect(document.querySelector('[data-policy-status]').textContent).toContain('임시저장');
});
