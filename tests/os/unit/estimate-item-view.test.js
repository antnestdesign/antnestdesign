import {expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import {mountEstimateItemBuilder} from '../../../public/os-app/src/estimate-item-builder.js';
const row={id:'11111111-1111-4111-8111-111111111111',versionId:'22222222-2222-4222-8222-222222222222',name:'합성 바닥',trade:'flooring',unit:'평',quantity:2,saleUnitPrice:30000,amount:60000,inputs:[{key:'quantity',label:'수량',unit:'평'}]};
const stored={itemSelections:[{id:row.id,versionId:row.versionId,inputs:{quantity:2}}],itemRows:[row]};
const dom=()=>new JSDOM('<section class="system-cost-card"></section><section id="preliminary-sectionFlooringEnabled"></section>');
it('does not clear a restored estimate when delayed management initialization completes',async()=>{
  const d=dom();let finish;const masters=new Promise(resolve=>{finish=resolve;});
  const request=async view=>view==='state'?{mode:'ON'}:view==='catalog'?[{...row,id:row.versionId}]:view==='masters'?masters:{items:[],versions:[]};
  const view=mountEstimateItemBuilder({document:d.window.document,request,role:()=> 'admin',changed:()=>{}});
  await view.loadCatalog();const pending=view.load();view.restore(stored);finish([]);await pending;
  expect(view.selections()).toEqual(stored.itemSelections);expect(d.window.document.querySelector('[data-item-input]').disabled).toBe(false);
});
it('updates amounts without replacing an active quantity input',async()=>{
  const d=dom(),view=mountEstimateItemBuilder({document:d.window.document,request:async v=>v==='state'?{mode:'ON'}:[],role:()=> 'staff',changed:()=>{}});
  await view.loadCatalog();view.restore(stored);const input=d.window.document.querySelector('[data-item-input]');input.focus();input.value='3';
  view.result({itemRows:[{...row,quantity:3,amount:90000}]});expect(d.window.document.querySelector('[data-item-input]')).toBe(input);expect(input.value).toBe('3');expect(d.window.document.activeElement).toBe(input);expect(d.window.document.querySelector('output').textContent).toContain('90,000');
});
it('ignores a catalog response from an earlier login',async()=>{
  const d=dom();let finish,count=0;const first=new Promise(resolve=>{finish=resolve;});
  const view=mountEstimateItemBuilder({document:d.window.document,request:async v=>v==='state'?(++count===1?first:{mode:'OFF'}):[],role:()=> 'staff',changed:()=>{}});
  const pending=view.loadCatalog();await view.loadCatalog();finish({mode:'ON'});await pending;expect(d.window.document.querySelector('[data-item-add]')).toBeNull();
});
it('saves a directly entered price without exposing composition controls',async()=>{
  const d=dom(),commands=[],item={id:row.id,revision:1,draft_config:{schema:1,name:'타일 테스트',trade:'bathroom',spec:'',unit:'㎡',recipe:{kind:'quantity',step:1,waste:0},components:[]}};
  const request=async(view,body)=>{if(body){commands.push(body);return {id:row.id,revision:2};}return view==='state'?{mode:'ON'}:view==='manage'?{items:[item],versions:[]}:[];};
  const view=mountEstimateItemBuilder({document:d.window.document,request,role:()=> 'admin',changed:()=>{}});await view.loadCatalog();await view.load();d.window.document.querySelector('[data-builder-open]').click();
  const input=d.window.document.querySelector('[name=directCost]');expect(input.value).toBe('');expect(d.window.document.querySelector('[data-builder-component-add]')).toBeNull();input.value='30000';input.dispatchEvent(new d.window.Event('input',{bubbles:true}));d.window.document.querySelector('form').dispatchEvent(new d.window.Event('submit',{bubbles:true,cancelable:true}));
  await vi.waitFor(()=>expect(commands).toHaveLength(1));expect(commands[0].config.pricing).toEqual({kind:'direct',costUnit:30000});expect(commands[0].config.components).toEqual([]);
});
it('keeps direct company price editing unavailable to managers',async()=>{
  const d=dom(),item={id:row.id,revision:1,draft_config:{schema:1,name:'타일 테스트',trade:'bathroom',spec:'',unit:'㎡',recipe:{kind:'quantity',step:1,waste:0},components:[],pricing:{kind:'direct',costUnit:30000}}};
  const view=mountEstimateItemBuilder({document:d.window.document,request:async v=>v==='state'?{mode:'ON'}:v==='manage'?{items:[item],versions:[]}:[],role:()=> 'manager',changed:()=>{}});await view.loadCatalog();await view.load();d.window.document.querySelector('[data-builder-open]').click();expect(d.window.document.querySelector('[name=directCost]').disabled).toBe(true);expect(d.window.document.querySelector('[name=directCost]').value).toBe('30000');
});
