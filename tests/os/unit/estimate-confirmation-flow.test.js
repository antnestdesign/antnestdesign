import { expect, test, vi } from "vitest";
import { createEstimateConfirmationView } from "../../../public/os-app/src/estimate-confirmation-view.js";
import { mountProjectWorkflow } from "../../../public/os-app/src/project-workflow-view.js";

function mount(overrides={}) {
  document.body.innerHTML='<div id="estimateManagementControls"><section class="estimate-history"></section></div><section class="contract-project-list"></section>';
  const estimate={id:"estimate",revision:"7",total:10000,canConfirm:true};
  const confirm=vi.fn(async()=>{});
  const projects=vi.fn(async()=>[{id:"existing",project_name:"Existing site"}]);
  const onLoad=vi.fn(async()=>{});
  vi.spyOn(window,"confirm").mockReturnValue(true);
  const view=createEstimateConfirmationView({document,load:async()=>({projectId:"existing",fingerprint:"saved",issues:[]}),
    confirm,revise:vi.fn(),projects,isDirty:()=>false,onLoad,onBusy:vi.fn(),...overrides});
  view.update(estimate);
  return {estimate,confirm,projects,onLoad};
}

const confirmButton=()=>document.querySelector("[data-estimate-confirm]");

test("a connected estimate confirms immediately without fetching or showing a project picker",async()=>{
  const {confirm,projects,onLoad}=mount();
  await vi.waitFor(()=>expect(confirmButton().disabled).toBe(false));
  expect(document.querySelector("[data-confirmation-project]")).toBeNull();
  expect(projects).not.toHaveBeenCalled();
  confirmButton().click();
  await vi.waitFor(()=>expect(onLoad).toHaveBeenCalledWith("estimate"));
  expect(confirm).toHaveBeenCalledWith("estimate",expect.objectContaining({projectId:"existing",expectedRevision:"7",fingerprint:"saved"}));
});

test("an unlinked estimate requires selection and explicitly created projects are selected without confirming",async()=>{
  let rows=[{id:"existing",project_name:"Existing site"}];
  const createProject=vi.fn(async(_estimate,onCreated)=>{
    rows=[...rows,{id:"new",project_name:"New site"}];
    await onCreated({project_id:"new",id:null});
  });
  const {confirm}=mount({load:async()=>({projectId:null,fingerprint:"saved",issues:[]}),projects:async()=>rows,createProject});
  await vi.waitFor(()=>expect(document.querySelector("[data-confirmation-project]")).not.toBeNull());
  const picker=()=>document.querySelector("[data-confirmation-project]");
  expect(confirmButton().disabled).toBe(true);
  picker().value="existing";
  picker().dispatchEvent(new Event("change",{bubbles:true}));
  expect(confirmButton().disabled).toBe(false);
  document.querySelector("[data-confirmation-new-project]").click();
  await vi.waitFor(()=>expect(picker().value).toBe("new"));
  expect(confirm).not.toHaveBeenCalled();
  confirmButton().click();
  await vi.waitFor(()=>expect(confirm).toHaveBeenCalledWith("estimate",expect.objectContaining({projectId:"new"})));
});

test("a confirmed estimate presents explicit contract transfer ahead of history",async()=>{
  const {estimate}=mount();
  const request=vi.fn(async()=>({project:{id:"existing"},canTransfer:true,revision:"1",versions:[{id:"v1",versionNo:1,supply:100,vat:10,total:110}]}));
  const workflow=mountProjectWorkflow({document,request,role:()=>"admin",isEstimateDirty:()=>false,isBusy:()=>false,onBusy:vi.fn()});
  await workflow.updateEstimate({...estimate,projectId:"existing",confirmation:{latestId:"v1"}});
  const transfer=document.querySelector('[data-flow-action="transfer"]');
  expect(transfer.querySelector("button").textContent).toBe("계약관리로 전환");
  expect(transfer.closest("section").nextElementSibling.matches(".estimate-history")).toBe(true);
  expect(request.mock.calls).toEqual([["/projects/existing/workflow?estimateId=estimate"]]);
});
