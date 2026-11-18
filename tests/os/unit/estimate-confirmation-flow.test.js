import { expect, test, vi } from "vitest";
import { createEstimateConfirmationView } from "../../../public/os-app/src/estimate-confirmation-view.js";
import { mountProjectWorkflow } from "../../../public/os-app/src/project-workflow-view.js";

function mount(overrides={}) {
  document.body.innerHTML='<div id="estimateManagementControls"><section class="estimate-history"></section></div><section class="contract-project-list"></section>';
  const estimate={id:"estimate",revision:"7",total:10000,canConfirm:true};
  const confirm=vi.fn(async()=>{});
  const onLoad=vi.fn(async()=>{});
  vi.spyOn(window,"confirm").mockReturnValue(true);
  const view=createEstimateConfirmationView({document,load:async()=>({projectId:"existing",fingerprint:"saved",issues:[]}),
    confirm,revise:vi.fn(),isDirty:()=>false,onLoad,onBusy:vi.fn(),...overrides});
  view.update(estimate);
  return {estimate,confirm,onLoad};
}

const confirmButton=()=>document.querySelector("[data-estimate-confirm]");

test("a connected estimate confirms immediately without fetching or showing a project picker",async()=>{
  const {confirm,onLoad}=mount();
  await vi.waitFor(()=>expect(confirmButton().disabled).toBe(false));
  expect(document.querySelector("[data-confirmation-project]")).toBeNull();
  confirmButton().click();
  await vi.waitFor(()=>expect(onLoad).toHaveBeenCalledWith("estimate"));
  expect(confirm).toHaveBeenCalledWith("estimate",expect.objectContaining({projectId:"existing",expectedRevision:"7",fingerprint:"saved"}));
});

test("an unlinked estimate with no matching site confirms without a picker",async()=>{
  const {confirm}=mount({load:async()=>({projectId:null,projectCandidates:[],fingerprint:"saved",issues:[]})});
  await vi.waitFor(()=>expect(confirmButton().disabled).toBe(false));
  expect(document.querySelector("[data-confirmation-project]")).toBeNull();
  confirmButton().click();
  await vi.waitFor(()=>expect(confirm).toHaveBeenCalledWith("estimate",expect.objectContaining({projectId:null})));
});

test("only matching sites can be selected and archived sites are not selectable",async()=>{
  const rows=[{id:"existing",project_name:"Existing site"},{id:"archived",project_name:"Archived",archived:true}];
  const {confirm}=mount({load:async()=>({projectId:null,projectCandidates:rows,fingerprint:"saved",issues:[]})});
  await vi.waitFor(()=>expect(document.querySelector("[data-confirmation-project]")).not.toBeNull());
  const picker=()=>document.querySelector("[data-confirmation-project]");
  expect(confirmButton().disabled).toBe(true);
  picker().value="existing";
  picker().dispatchEvent(new Event("change",{bubbles:true}));
  expect(confirmButton().disabled).toBe(false);
  expect(picker().querySelector('[value="archived"]').disabled).toBe(true);
  expect(confirm).not.toHaveBeenCalled();
  confirmButton().click();
  await vi.waitFor(()=>expect(confirm).toHaveBeenCalledWith("estimate",expect.objectContaining({projectId:"existing"})));
});

test("a confirmed estimate presents explicit contract transfer ahead of history",async()=>{
  const {estimate}=mount();
  const request=vi.fn(async()=>({project:{id:"existing"},canTransfer:true,revision:"1",versions:[{id:"v1",versionNo:1,supply:100,vat:10,total:110}]}));
  const workflow=mountProjectWorkflow({document,request,role:()=>"admin",isEstimateDirty:()=>false,isBusy:()=>false,onBusy:vi.fn()});
  await workflow.updateEstimate({...estimate,projectId:"existing",confirmation:{latestId:"v1"}});
  const transfer=document.querySelector('[data-flow-action="transfer"]');
  expect(transfer.querySelector("button").textContent).toBe("계약서 작성");
  expect(transfer.closest("section").nextElementSibling.matches(".estimate-history")).toBe(true);
  expect(request.mock.calls).toEqual([["/projects/existing/workflow?estimateId=estimate"]]);
});

test('contract writing confirms the saved estimate before continuing and is never automatic',async()=>{
  const onContract=vi.fn();const {confirm,onLoad}=mount({onContract});
  await vi.waitFor(()=>expect(document.querySelector('[data-estimate-contract]').disabled).toBe(false));
  expect(onContract).not.toHaveBeenCalled();expect(confirm).not.toHaveBeenCalled();
  document.querySelector('[data-estimate-contract]').click();
  await vi.waitFor(()=>expect(onContract).toHaveBeenCalledWith('estimate'));
  expect(confirm.mock.invocationCallOrder[0]).toBeLessThan(onLoad.mock.invocationCallOrder[0]);
  expect(onLoad.mock.invocationCallOrder[0]).toBeLessThan(onContract.mock.invocationCallOrder[0]);
});

test('opening a contract is clean; actual edits are dirty until reverted',async()=>{
  mount();
  const basis={id:'v1',versionNo:1,supply:100,vat:10,total:110};
  const request=vi.fn(async()=>({project:{id:'existing'},basis,versions:[basis],stage:'preparation',
    canManage:true,documents:[],history:[],milestones:[],revision:'1'}));
  const workflow=mountProjectWorkflow({document,request,role:()=>'admin',onBusy:vi.fn()});
  await workflow.open('existing');
  expect(workflow.isDirty()).toBe(false);
  const amount=document.querySelector('[data-flow-action="contract"] [name="amount"]');
  amount.value='111';
  amount.dispatchEvent(new Event('input',{bubbles:true}));
  expect(workflow.isDirty()).toBe(true);
  amount.value='110';
  amount.dispatchEvent(new Event('input',{bubbles:true}));
  expect(workflow.isDirty()).toBe(false);
});
