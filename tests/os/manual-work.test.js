import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../../app/api/os/_lib/server',()=>({ApiError:class extends Error{constructor(status,message){super(message);this.status=status;}}}));
vi.mock('../../app/api/os/estimate-items/_lib/service',()=>({
  assertBuilderActor:vi.fn(),builderMode:()=>process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE||'ON',
  itemId:v=>v,requireBuilder:()=>{throw new Error('read only');},versionForAdoption:vi.fn(),
}));
import {appendEstimateItems,baseEstimate} from '../../app/api/os/estimate-items/_lib/preliminary';
import {publicItemState} from '../../app/api/os/estimate-items/_lib/model.js';
import {normalizeManualWorks,publicManualWork,MANUAL_WORK_TRADES} from '../../public/os-app/src/manual-work.js';
import {storedEstimateSummary,buildAdminMarginGroups} from '../../public/os-app/src/estimate-summary.js';
import {mountManualWorkView} from '../../public/os-app/src/manual-work-view.js';
import {versionForAdoption} from '../../app/api/os/estimate-items/_lib/service';
const id='20000000-0000-4000-8000-000000000001';
const row=(trade='carpentry',amount=350500)=>({id,trade,name:'추가 보강',amount,note:'현장 요청'});
const actor=role=>({authUser:{id:'actor'},profile:{role}});
const base=()=>({inputs:{targetMargin:'30'},total:100000,totalText:'100,000원',costTotal:80000,marginRate:25,savedAt:'synthetic',internalDetails:[],internalSummary:{directCost:80000},costBreakdown:[],reviewNotice:false,customerQuote:{total:100000,totalText:'100,000원',groups:[{label:'철거',total:100000,items:[{name:'기존 공사',amount:100000}]}]}});
beforeEach(()=>{delete process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE;vi.clearAllMocks();});
describe('manual work shares existing atomic estimate snapshots',()=>{
  it.each(['admin','manager'])('%s uses entered selling amount without markup or invented cost',async role=>{
    const result=await appendEstimateItems(base(),[],null,actor(role),[row()]);
    expect(result.total).toBe(450000);expect(result.itemBuilder.manualWorks[0].amount).toBe(350500);
    expect(result.costTotal).toBeNull();expect(result.marginRate).toBeNull();expect(result.internalSummary.profit).toBeNull();
    expect(result.internalDetails.at(-1)).toMatchObject({cost:null,profit:null,customerRevenue:350000,quantity:'1식'});
    expect(result.customerQuote.groups.at(-1).items[0]).toMatchObject({name:'추가 보강 (현장 요청)',amount:350000});
    expect(versionForAdoption).not.toHaveBeenCalled();
  });
  it('covers all nine trades and never accumulates on re-save',async()=>{
    for(const trade of MANUAL_WORK_TRADES){
      const first=await appendEstimateItems(base(),[],null,actor('admin'),[row(trade)]),original={estimate_data:first};
      const next=await appendEstimateItems(baseEstimate(original).estimate_data,undefined,original,actor('manager'));
      expect(next.total).toBe(first.total);expect(next.itemBuilder.publicRows).toHaveLength(1);
      const removed=await appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('admin'),[]);
      expect(removed.total).toBe(100000);expect(removed.costTotal).toBe(80000);expect(removed.costIncomplete).toBe(false);
    }
  });
  it('staff preserves existing authorized work but cannot add, edit, move or remove it',async()=>{
    const first=await appendEstimateItems(base(),[],null,actor('manager'),[row()]),original={estimate_data:first};
    expect((await appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('staff'),[row()])).total).toBe(450000);
    for(const value of [[],[{...row(),amount:1}],[{...row(),trade:'flooring'}],[{...row(),name:'변경'}]])
      await expect(appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('staff'),value)).rejects.toMatchObject({status:403});
    await expect(appendEstimateItems(base(),[],null,actor('staff'),[row()])).rejects.toMatchObject({status:403});
  });
  it.each([null,'',NaN,Infinity,-1,1.5,1000000001])('rejects missing or invalid amount %s',amount=>expect(()=>normalizeManualWorks([row('carpentry',amount)])).toThrow());
  it('rejects forged roles, costs, duplicate IDs and unknown trade; explicit free work is not an unset price',()=>{
    for(const value of [[{...row(),role:'admin'}],[{...row(),costUnit:0}],[row(),row()],[row('unknown')]])expect(()=>normalizeManualWorks(value)).toThrow();
    expect(normalizeManualWorks([row('carpentry',0)])[0].amount).toBe(0);
  });
  it('staff projection contains only public manual values',async()=>{
    const result=await appendEstimateItems(base(),[],null,actor('admin'),[row()]);
    result.itemBuilder.manualWorks[0].secretCost=777777;
    const publicState=publicItemState(result.itemBuilder);
    expect(publicState.manualWorks).toEqual([row()]);
    expect(JSON.stringify(publicState)).not.toMatch(/secretCost|777777|privateRows|costTotal|margin/);
  });
  it('OFF/READ_ONLY accepts untouched saved work but blocks a changed amount',async()=>{
    const first=await appendEstimateItems(base(),[],null,actor('admin'),[row()]),original={estimate_data:first};
    process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE='READ_ONLY';
    expect((await appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('manager'))).total).toBe(450000);
    await expect(appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('manager'),[{...row(),amount:400000}])).rejects.toThrow();
  });
  it('uses optional actual cost without changing the selling amount; cost-only edits and resaves remain stable',async()=>{
    const withCost={...row(),costAmount:200123};
    const first=await appendEstimateItems(base(),[],null,actor('manager'),[withCost]);
    expect(first.total).toBe(450000);expect(first.costTotal).toBe(280123);expect(first.costIncomplete).toBe(false);
    expect(first.internalDetails.at(-1)).toMatchObject({unitPrice:200123,cost:200123,profit:149877,customerRevenue:350000});
    const edited=await appendEstimateItems(baseEstimate({estimate_data:first}).estimate_data,[],{estimate_data:first},actor('admin'),[{...withCost,costAmount:300000}]);
    expect(edited.total).toBe(first.total);expect(edited.costTotal).toBe(380000);expect(edited.internalSummary.profit).toBe(70000);
    const saved=await appendEstimateItems(baseEstimate({estimate_data:edited}).estimate_data,undefined,{estimate_data:edited},actor('manager'));
    expect(saved.total).toBe(450000);expect(saved.costTotal).toBe(380000);
    const legacyClient=await appendEstimateItems(baseEstimate({estimate_data:saved}).estimate_data,[],{estimate_data:saved},actor('manager'),[row()]);
    expect(legacyClient.costTotal).toBe(380000);expect(legacyClient.itemBuilder.manualWorks[0].costAmount).toBe(300000);
  });
  it('distinguishes unknown cost, explicit zero and mixed known/unknown amounts',async()=>{
    for(const costAmount of [null,0]){const result=await appendEstimateItems(base(),[],null,actor('admin'),[{...row(),costAmount}]);expect(result.costTotal).toBe(costAmount===null?null:80000);}
    const result=await appendEstimateItems(base(),[],null,actor('admin'),[{...row(),costAmount:100000},{...row('flooring'),id:'20000000-0000-4000-8000-000000000002'}]);
    const summary=storedEstimateSummary(result,{groupLabels:{},groupOrder:[]});expect(summary.costIncomplete).toBe(true);expect(summary.missingCostCount).toBe(1);
    const groups=buildAdminMarginGroups(result,{groupLabels:{},groupOrder:[]});expect(groups.find(g=>g.label==='carpentry').cost).toBe(100000);expect(groups.find(g=>g.label==='flooring').cost).toBeNull();
    for(const costAmount of [-1,1.5,NaN,Infinity,'200000',1000000001])expect(()=>normalizeManualWorks([{...row(),costAmount}])).toThrow();
  });
  it('staff cannot see or forge cost and public-only saves preserve the private original',async()=>{
    const first=await appendEstimateItems(base(),[],null,actor('manager'),[{...row(),costAmount:234567}]),original={estimate_data:first};
    const exposed=publicItemState(first.itemBuilder);expect(exposed.manualWorks).toEqual([row()]);expect(JSON.stringify(exposed)).not.toMatch(/costAmount|234567/);
    for(const requested of [undefined,exposed.manualWorks]){const saved=await appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('staff'),requested);expect(saved.itemBuilder.manualWorks[0].costAmount).toBe(234567);expect(saved.costTotal).toBe(314567);}
    for(const costAmount of [0,null,234567])await expect(appendEstimateItems(baseEstimate(original).estimate_data,[],original,actor('staff'),[{...publicManualWork(row()),costAmount}])).rejects.toMatchObject({status:403});
  });
});
describe('manual work inline entry',()=>{
  let view,changed,role;
  beforeEach(()=>{
    document.body.innerHTML='<section id="preliminary-sectionCarpentryEnabled"></section>';
    changed=vi.fn();role='manager';
    view=mountManualWorkView({document,panels:{carpentry:'Carpentry'},canEdit:()=>role!=='staff',mode:()=>'ON',changed});view.render();
  });
  const click=selector=>document.querySelector(selector).click();
  const set=(name,value)=>{const e=document.querySelector(`[name=${name}]`);e.value=value;e.dispatchEvent(new Event('input',{bubbles:true}));};
  it('has no preset zero price, applies only on submit and restores without duplication',()=>{
    click('[data-manual-new]');expect(document.querySelector('[name=amount]').value).toBe('');expect(view.isDirty()).toBe(true);expect(view.rows()).toEqual([]);
    set('name','<img src=x>');set('amount','350500');set('note','보강');click('[type=submit]');
    expect(changed).toHaveBeenCalledOnce();expect(view.rows()[0]).toMatchObject({name:'<img src=x>',amount:350500});expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('.manual-work-row').textContent).toContain('350,000원');
    const saved=view.rows();view.restore({manualWorks:saved,id,canEdit:true});expect(view.rows()).toEqual(saved);expect(view.isDirty()).toBe(false);
    click('[data-manual-edit]');set('amount','400000');click('[type=submit]');expect(view.rows()).toHaveLength(1);expect(view.rows()[0].id).toBe(saved[0].id);
  });
  it('staff and confirmed snapshots have no entry, modification or deletion buttons',()=>{
    role='staff';view.restore({manualWorks:[{...row(),costAmount:234567}],id,canEdit:true});expect(document.querySelector('button')).toBeNull();expect(document.body.textContent).not.toMatch(/234,567|원가|이익/);
    role='manager';view.restore({manualWorks:[row()],id,canEdit:false,confirmation:{state:'confirmed'}});expect(document.querySelector('button')).toBeNull();
  });
  it('has a blank optional cost and changes it independently of the selling amount',()=>{
    click('[data-manual-new]');expect(document.querySelector('[name=costAmount]').value).toBe('');
    set('name','수기 공사');set('amount','350500');set('costAmount','200123');click('[type=submit]');expect(view.rows()[0]).toMatchObject({costAmount:200123,amount:350500});
    expect(document.querySelector('[data-manual-cost]').textContent).toContain('200,123원');
    click('[data-manual-edit]');set('costAmount','');click('[type=submit]');expect(view.rows()[0].costAmount).toBeNull();expect(view.rows()[0].amount).toBe(350500);expect(document.body.textContent).toContain('원가 미확정');
  });
});
