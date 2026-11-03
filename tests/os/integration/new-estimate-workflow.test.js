import { afterEach, expect, test, vi } from 'vitest';
import { latestEstimate, testProfile } from '../fixtures/estimates.js';
import { createEstimateDatabase, mountOs, flushAsyncWork } from '../helpers/os-harness.js';
import { mutations, jsonResponse } from '../helpers/network.js';

const button = () => document.getElementById('newEstimateButton');
const setName = value => { const input=document.getElementById('projectName');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true})); };
afterEach(async()=>{await new Promise(resolve=>setTimeout(resolve,200));await flushAsyncWork();});
for(const role of ['admin','manager','staff']){
 test(`${role}: new estimate clears form and saved identity without changing the original`,async()=>{
  const fixture=latestEstimate(),db=createEstimateDatabase(fixture),before=structuredClone(db.row);
  const {main,storage}=await mountOs(db,testProfile(role));main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));await flushAsyncWork();
  vi.mocked(confirm).mockClear();button().click();
  expect(confirm).not.toHaveBeenCalled();expect(document.getElementById('projectName').value).toBe('');expect(document.getElementById('clientName').value).toBe('');expect(document.getElementById('clientPhone').value).toBe('');expect(document.getElementById('areaPyeong').value).toBe('34');expect(document.getElementById('estimateStatus').value).toBe('견적');
  expect([...document.querySelectorAll('.section-toggle input')].every(n=>!n.checked)).toBe(true);expect(document.getElementById('projectSearchResults').value).toBe('');expect(document.getElementById('client').classList.contains('active')).toBe(true);expect(document.getElementById('saveEstimateButton').textContent).toBe('견적 저장');expect(document.activeElement.id).toBe('projectName');
  expect(db.row).toEqual(before);expect(mutations()).toEqual([]);
 });
 test(`${role}: cancel keeps unsaved edits; accepting starts new without writing`,async()=>{
  const fixture=latestEstimate(),db=createEstimateDatabase(fixture),before=structuredClone(db.row),{main,storage}=await mountOs(db,testProfile(role));main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));await flushAsyncWork();
  setName('저장 전 변경');vi.mocked(confirm).mockReturnValue(false);button().click();expect(document.getElementById('projectName').value).toBe('저장 전 변경');expect(confirm).toHaveBeenCalledWith(expect.stringContaining('저장하지 않은 변경사항'));
  vi.mocked(confirm).mockReturnValue(true);button().click();expect(document.getElementById('projectName').value).toBe('');expect(db.row).toEqual(before);expect(mutations()).toEqual([]);
 });
 test(`${role}: first save after starting new inserts instead of patching the loaded estimate`,async()=>{
  const fixture=latestEstimate(),db=createEstimateDatabase(fixture),before=structuredClone(db.row),handle=db.handle,newId='10000000-0000-4000-8000-000000000099';let insert;
  db.handle=async request=>{if(request.method==='POST'&&['/rest/v1/estimates','/api/os/estimates'].includes(request.url.pathname)){insert=request;const data=request.body.estimate_data||{...fixture,inputs:request.body.inputs,projectName:request.body.inputs.projectName};const result={...data,id:newId,created_at:'2026-11-03T00:00:00Z',savedAt:'2026-11-03T00:00:00Z'};return jsonResponse(request.url.pathname.startsWith('/rest/')?[{...before,...request.body,id:newId,estimate_data:result}]:result,201);}return handle(request);};
  const {main,storage}=await mountOs(db,testProfile(role));main.loadEstimateIntoUi(await storage.getEstimate(fixture.id));await flushAsyncWork();button().click();setName('SYSTEM_NEW_BUTTON');
  await main.handleSaveEstimate('new');await flushAsyncWork();
  expect(insert?.method).toBe('POST');expect(insert?.url.pathname).toBe(role==='staff'?'/api/os/estimates':'/rest/v1/estimates');expect(mutations().filter(r=>r.method==='PATCH')).toHaveLength(0);expect(mutations().filter(r=>r.method==='POST')).toHaveLength(1);expect(db.row).toEqual(before);
 });
}
test('late contract lookup cannot reconnect the previous estimate after starting new',async()=>{
 const fixture=latestEstimate(),db=createEstimateDatabase(fixture),original=db.handle;let resolve;
 db.handle=async request=>request.url.pathname==='/api/os/contract-options'?new Promise(done=>{resolve=()=>done(jsonResponse({estimate_id:fixture.id}));}):original(request);
 const {main}=await mountOs(db,testProfile('admin'));
 main.loadEstimateIntoUi(fixture);await flushAsyncWork();expect(resolve).toBeTruthy();button().click();resolve();await flushAsyncWork();
 expect(document.getElementById('projectName').value).toBe('');expect(document.getElementById('contractOptionsForm')?.textContent||'').not.toContain(fixture.projectName);expect(mutations()).toEqual([]);
});
test('new estimate action stays disabled until the current save finishes',async()=>{
 const fixture=latestEstimate(),db=createEstimateDatabase(fixture),handle=db.handle;let release;
 db.handle=async request=>request.method==='POST'&&request.url.pathname==='/rest/v1/estimates'?new Promise(done=>{release=()=>done(jsonResponse([{...db.row,...request.body,id:'10000000-0000-4000-8000-000000000098'}],201));}):handle(request);
 const {main}=await mountOs(db,testProfile('admin'));main.loadEstimateIntoUi(fixture);await flushAsyncWork();setName('SYSTEM_SAVE_BUSY');const saving=main.handleSaveEstimate('new');for(let n=0;n<20&&!release;n++)await flushAsyncWork();expect(release).toBeTruthy();expect(button().disabled).toBe(true);button().click();expect(document.getElementById('projectName').value).toBe('SYSTEM_SAVE_BUSY');release();await saving;expect(button().disabled).toBe(false);
});
test('late pipe-cleaning calculation cannot restore the previous saved quote',async()=>{
 const fixture=latestEstimate(),db=createEstimateDatabase(fixture),handle=db.handle;let release;
 db.handle=async request=>request.url.pathname==='/api/os/estimates/calculate'&&request.method==='POST'&&request.body.inputs.existingPipeCleaningEnabled===true?new Promise(done=>{release=()=>done(jsonResponse({snapshot:fixture}));}):handle(request);
 const {main}=await mountOs(db,testProfile('admin'));main.loadEstimateIntoUi(fixture);await flushAsyncWork();const checkbox=document.getElementById('existingPipeCleaningEnabled');checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}));for(let n=0;n<20&&!release;n++)await flushAsyncWork();expect(release).toBeTruthy();vi.mocked(confirm).mockReturnValue(true);button().click();release();await main.ensureServerCalculation();await flushAsyncWork();expect(document.getElementById('projectName').value).toBe('');expect(document.getElementById('clientTotal').textContent).not.toBe('3,770,000원');expect(db.row.estimate_data.projectName).toBe(fixture.projectName);expect(mutations()).toEqual([]);
});
