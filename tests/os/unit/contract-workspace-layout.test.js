import { expect, test, vi } from "vitest";
import { createContractView } from "../../../public/os-app/src/contract-view.js";
import { createContractViewModel } from "../../../public/os-app/src/contract-view-model.js";
import { mountConfirmedContracts } from "../../../public/os-app/src/confirmed-contract-view.js";
import { estimateContractInclusions } from "../../../public/os-app/src/contract-estimate-inclusions.js";

test("contract list and estimate lead; output, specs and archive follow the preview", () => {
  document.body.innerHTML='<section id="admin"><section class="contract-project-list"></section><section class="internal-card" id="estimate"><div id="adminStandardSelectedItems"></div></section><section class="internal-card" id="orders"><table><tbody id="purchaseOrderRows"></tbody></table></section></section>';
  const estimate={id:"e1",projectName:"Synthetic"};
  const model=createContractViewModel({contractOptionsState:{},contractPackagesState:[],allContractPackagesState:[],contractPreviewState:null});
  createContractView({document,model,permissions:{view:true,edit:true,create:true},selectedEstimate:estimate,formatDateTime:String}).renderContractPackagePanel();
  const admin=document.querySelector("#admin");
  const before=(a,b)=>Boolean(admin.querySelector(a).compareDocumentPosition(admin.querySelector(b))&Node.DOCUMENT_POSITION_FOLLOWING);
  expect(admin.firstElementChild.classList.contains("contract-project-list")).toBe(true);
  expect(before("#estimate","#contractDocumentPreview")).toBe(true);
  expect(before("#contractDocumentPreview","#createContractPackageButton")).toBe(true);
  expect(before("#createContractPackageButton","#orders")).toBe(true);
  expect(before("#orders","#contractSpecSnapshot")).toBe(true);
  expect(admin.lastElementChild.matches("details.contract-package-archive")).toBe(true);
  expect(admin.querySelector("#previewContractPackageButton,#saveContractOptionsButton")).toBeNull();
  expect(admin.querySelector("#residentConsentIncluded").disabled).toBe(true);
  expect(admin.querySelector("#createContractPackageButton").disabled).toBe(true);
});

test("saved contract selection is a read and prefers the linked version", async () => {
  document.body.innerHTML='<section id="projectWorkflowPanel"></section>';
  const request=vi.fn(async()=>({version:{id:"quote-2",no:2,supply:100,vat:10},canManage:true,packages:[
    {id:"latest",quoteVersionId:"quote-2",at:"2026-11-12"},{id:"linked",quoteVersionId:"quote-1",at:"2026-11-11"},
  ]}));
  const loadSaved=vi.fn();
  const view=mountConfirmedContracts({document,request,role:()=>"admin",onBusy:vi.fn()});
  await view.open("project",{linkedId:"linked",loadSaved});
  expect(loadSaved).toHaveBeenCalledExactlyOnceWith("linked");
  expect(request.mock.calls).toEqual([["/projects/project/contracts"]]);
  expect(document.querySelector("[data-confirmed-form]")).toBeNull();
});

test("new contract preview runs without issuing; editing invalidates the preview",async()=>{
  document.body.innerHTML='<section id="projectWorkflowPanel"></section>';
  const defaults={customerName:"Customer",customerPhone:"000",customerAddress:"Address",contractDate:"2026-11-12",startDate:"2026-11-13",completionDate:"2026-11-14",constructionType:"Interior",companyName:"Company",businessNo:"000",representative:"Rep",companyAddress:"Office",companyPhone:"000",amount:110,amountBasis:"vat_included",consentIncluded:true};
  const request=vi.fn(async(_path,options)=>options?{type:"CONTRACT",html:"<p>Draft</p>",fingerprint:"draft-hash"}:{version:{id:"v1",no:1,supply:100,vat:10,total:110},revision:"1",defaults,canManage:true,packages:[]});
  const view=mountConfirmedContracts({document,request,role:()=>"admin",onBusy:vi.fn()});
  await view.open("project",{loadSaved:vi.fn()});
  await vi.waitFor(()=>expect(document.querySelector("[data-confirmed-preview]").hidden).toBe(false),{timeout:2000});
  expect(JSON.parse(request.mock.calls[1][1].body)).toMatchObject({action:"preview",versionId:"v1"});
  expect(document.querySelector("[data-confirmed-issue]").disabled).toBe(false);
  expect(document.querySelector("[name=consentIncluded]").disabled).toBe(true);
  const address=document.querySelector("[name=customerAddress]");
  address.value="";
  address.dispatchEvent(new Event("input",{bubbles:true}));
  expect(document.querySelector("[data-confirmed-issue]").disabled).toBe(true);
  expect(document.querySelector("[data-confirmed-preview]").hidden).toBe(true);
  expect(request).toHaveBeenCalledTimes(2);
  view.clear();
});

test("stored quote switches take precedence over stale contract options",()=>{
  expect(estimateContractInclusions({demolitionConsentEnabled:true,sectionDemolitionEnabled:false,demolitionPermitEnabled:true,interiorProtectionEnabled:false},{consentIncluded:true,protectionIncluded:true}))
    .toEqual({adminOfficeIncluded:false,consentIncluded:false,permitIncluded:false,protectionIncluded:false});
  expect(estimateContractInclusions({}, {permitIncluded:true}).permitIncluded).toBe(true);
});
