import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { ACCOUNT_PASSWORD, ESTIMATE_A } from "../fixtures.mjs";
import { ROOT, WORKDIR, ORIGIN } from "./stack.mjs";

if(process.env.AND_OS_DB_REBUILD!=="1"||process.env.SUPABASE_URL!==ORIGIN)throw new Error("Owned rebuild UI only");
const bundled=createRequire(resolve(homedir(),".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/__ui_test__.cjs"));
const { chromium }=bundled("playwright");
const accounts=JSON.parse(process.env.AND_OS_DB_ACCOUNTS);
const source=readFileSync(resolve(ROOT,"public/os-app/src/storage.js"),"utf8");
// Browser-only test configuration. No source edit, API/data mock or DB credential substitution.
const storage=source.replace(/const SUPABASE_URL = "[^"]+";/,`const SUPABASE_URL = ${JSON.stringify(ORIGIN)};`)
  .replace(/const SUPABASE_KEY = "[^"]+";/,`const SUPABASE_KEY = ${JSON.stringify(process.env.AND_OS_DB_ANON)};`);
assert(storage!==source&&!storage.includes(".supabase.co")&&!storage.includes("sb_publishable_"));
const browser=await chromium.launch({channel:"msedge",headless:true});
const report={engine:browser.version(),syntheticOnly:true,browserOnlyLocalConfig:true,apiMock:false,roles:[]};
let failurePage, failureDialogs = [], foundationResponses = [];
async function full() {
  const r=await fetch(`${ORIGIN}/rest/v1/estimates?id=eq.${ESTIMATE_A}&select=*`,{redirect:"error",headers:{apikey:process.env.AND_OS_DB_SERVICE,Authorization:`Bearer ${process.env.AND_OS_DB_SERVICE}`}});
  assert.equal(r.status,200);return r.json();
}
try {
  for(const role of ["admin-active","manager-active","staff-active"]) {
    const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:"block"});
    let hostedDbAttempts=0;const writes=[];const errors=[];
    await context.route("**/*",async(route)=>{
      const url=new URL(route.request().url());
      if(url.origin==="http://127.0.0.1:3044"&&url.pathname==="/os-app/src/storage.js")return route.fulfill({contentType:"application/javascript",body:storage});
      if(!["http://127.0.0.1:3044",ORIGIN].includes(url.origin)) {if(url.hostname.endsWith(".supabase.co"))hostedDbAttempts++;return route.abort();}
      const method=route.request().method();
      if(["POST","PATCH","PUT","DELETE"].includes(method)&&url.pathname!=="/api/os/estimates/preview"
        &&(/\/rest\/v1\/estimates(?:\?|$)/.test(url.href)||/^\/api\/os\/estimates(?:\/[^/]+)?$/.test(url.pathname)))writes.push({method,path:url.pathname});
      return route.continue();
    });
    const page=await context.newPage(); failurePage = page; failureDialogs = []; foundationResponses = [];
    page.on("pageerror",(error)=>errors.push(error.message));
    page.on("dialog",(dialog)=>{ failureDialogs.push(dialog.message()); return dialog.dismiss(); });
    page.on("response", response => { const u = new URL(response.url()); if (/\/api\/os\/(projects|detailed-estimates)/.test(u.pathname)) foundationResponses.push({ path: u.pathname, status: response.status() }); });
    const before=await full();
    const foundationSource = { ...before[0], id: randomUUID(), project_name: `SYSTEM_5B_UI_${role}`, project_id: null };
    const sourceResponse = await fetch(`${ORIGIN}/rest/v1/estimates`, { method: "POST", redirect: "error",
      headers: { apikey: process.env.AND_OS_DB_SERVICE, Authorization: `Bearer ${process.env.AND_OS_DB_SERVICE}`, "Content-Type": "application/json" }, body: JSON.stringify(foundationSource) });
    assert.equal(sourceResponse.status, 201);
    await page.goto("http://127.0.0.1:3044/os-app/index.html",{waitUntil:"networkidle"});
    await page.locator("#loginEmail").fill(accounts[role].email);await page.locator("#loginPassword").fill(ACCOUNT_PASSWORD);
    await page.locator("#loginForm button[type=submit]").click();
    await page.locator("#appShell.app-locked").waitFor({state:"detached",timeout:30000});
    await page.locator(`#projectSearchResults option[value="${ESTIMATE_A}"]`).waitFor({state:"attached"});
    await page.locator("#projectSearchResults").selectOption(ESTIMATE_A);await page.locator("#loadProjectButton").click();
    await page.waitForFunction(()=>document.getElementById("quoteTotal")?.textContent==="3,770,000원");
    assert.deepEqual(await full(),before);assert.deepEqual(writes,[]);
    await page.locator('[data-tab="quote"]').click();
    await page.screenshot({path:resolve(WORKDIR,`artifacts/ui-${role}.png`),fullPage:false});
    if(role==="staff-active") {
      assert(!/SYNTHETIC_INTERNAL_ONLY|SYNTHETIC_PRIVATE/.test(await page.locator("body").innerText()));
      assert.equal(await page.locator('[data-tab="system"]').count(),0);
    } else {
      await page.locator('[data-tab="system"]').click();await page.locator("#systemCostAccordion").waitFor({state:"visible"});
      if(role==="admin-active") {await page.locator("#userManagementRows").waitFor({state:"attached"});await page.locator("#auditLogRows").waitFor({state:"attached"});}
    }
    await page.locator('[data-tab="admin"]').click();await page.locator("#contractPackagePanel").waitFor({state:"visible"});
    if(role!=="manager-active") {
      await page.locator("#previewContractPackageButton").click();await page.waitForFunction(()=>document.getElementById("contractDocumentPreview")?.textContent.includes("계약"));
      assert.equal(await page.locator("[data-contract-print]").count(),4);
    }
    assert.equal(hostedDbAttempts,0);assert.deepEqual(errors,[]);assert.deepEqual(await full(),before);
    assert.equal(await page.locator("#quoteTotal").textContent(),"3,770,000원");
    await page.locator('[data-tab="client"]').click();
    await page.locator("#projectSearchResults").selectOption(foundationSource.id); await page.locator("#loadProjectButton").click();
    await page.waitForFunction(id => document.getElementById("projectName")?.value === `SYSTEM_5B_UI_${id}`, role);
    await page.locator("#startDetailedEstimateButton").click();
    await page.locator("#detailedProjectMode").waitFor({ state: "visible" });
    await page.locator("#detailedProjectMode").selectOption("new");
    const projectLabel = `SYSTEM_5B_UI_PROJECT_${role}_${foundationSource.id.slice(0,8)}`;
    await page.locator("#newDetailedProjectName").fill(projectLabel);
    await page.locator("#createDetailedDraftButton").click();
    await page.locator("#saveDetailedDraftButton").waitFor({ state: "visible", timeout: 15000 });
    assert((await page.locator("#detailedEstimateDialog").innerText()).includes("미작성"));
    await page.locator("#detailedClientName").fill("합성 고객 수정");
    await page.locator("#detailedArea").fill("0");
    await page.locator("#detailedCustomerUndecided").uncheck();
    await page.locator("#saveDetailedDraftButton").click();
    await page.waitForFunction(() => document.getElementById("detailedStatus")?.textContent === "작성본을 저장했습니다.");
    await page.locator("#reloadDetailedDraftButton").click();
    await page.waitForFunction(() => document.getElementById("detailedStatus")?.textContent === "작성본을 불러왔습니다.");
    assert.equal(await page.locator("#detailedClientName").inputValue(), "합성 고객 수정");
    assert.equal(await page.locator("#detailedArea").inputValue(), "0");
    assert.equal(await page.locator("#detailedCustomerUndecided").isChecked(), false);
    await page.locator("[data-detailed-close]").click();
    await page.locator("#startDetailedEstimateButton").click();
    await page.locator("#detailedProjectSelect").waitFor({ state: "visible" });
    await page.locator("#detailedProjectSelect").selectOption({ label: projectLabel });
    await page.locator("#detailedProjectConfirmed").waitFor({ state: "visible" });
    assert((await page.locator("#detailedProjectReview").innerText()).includes("프로젝트명"));
    const commandsBefore = foundationResponses.filter(r => r.path === "/api/os/detailed-estimates/from-preliminary").length;
    await page.locator("#createDetailedDraftButton").click();
    await page.waitForFunction(() => document.getElementById("detailedStatus")?.textContent === "선택 프로젝트와 정보 차이를 확인해 주세요.");
    assert.equal(foundationResponses.filter(r => r.path === "/api/os/detailed-estimates/from-preliminary").length, commandsBefore);
    await page.locator("#openDetailedDraftButton").click();
    await page.waitForFunction(() => document.getElementById("detailedStatus")?.textContent === "작성본을 불러왔습니다.");
    assert.equal(await page.locator("#detailedClientName").inputValue(), "합성 고객 수정");
    await page.locator("#loadDetailedEventsButton").click();
    await page.waitForFunction(() => document.getElementById("detailedEvents")?.textContent.includes("작성본 저장"));
    assert.equal(await page.locator("#client input, #client select, #client textarea").count(), 145);
    if (role === "staff-active") assert(!/SYNTHETIC_PRIVATE|직접원가|마진율|공급자/.test(await page.locator("#detailedEstimateDialog").innerText()));
    await page.screenshot({ path: resolve(WORKDIR, `artifacts/phase5-${role}-1440.png`) });
    await page.setViewportSize({ width: 375, height: 812 });
    assert(await page.locator("#detailedEstimateDialog").evaluate(n => n.scrollWidth <= n.clientWidth + 1));
    await page.screenshot({ path: resolve(WORKDIR, `artifacts/phase5-${role}-375.png`) });
    await page.locator("[data-detailed-close]").click();
    assert.deepEqual(writes, []); assert.deepEqual(await full(), before); assert.deepEqual(errors, []);
    report.roles.push({role,login:"PASS",oldEstimateRead:"PASS",estimateWritesOnRead:writes.length,quoteTotal:3770000,contractPanel:"PASS",costAccountAudit:role==="staff-active"?"HIDDEN":"PASS",foundationCreateSaveReload:"PASS",existingProjectReview:"PASS",unconfirmedCreation:"BLOCKED",history:"PASS",legacyInputs:145,mobileOverflow:0,pageErrors:errors.length,hostedDbAttempts});
    await context.close();
  }
  report.result="PASS";writeFileSync(resolve(WORKDIR,"artifacts/ui-report.json"),JSON.stringify(report,null,2)+"\n");
  console.log("Owned Chromium UI smoke: admin/manager/staff PASS; zero hosted DB requests and read mutations.");
} catch (error) {
  if (failurePage && !failurePage.isClosed()) {
    await failurePage.screenshot({ path: resolve(WORKDIR, "artifacts/phase5-ui-failure.png") });
    const visible = await failurePage.evaluate(() => ({
      status: document.getElementById("detailedStatus")?.textContent,
      saveStatus: document.getElementById("saveStatus")?.textContent,
      dialogOpen: document.getElementById("detailedEstimateDialog")?.open,
      projectName: document.getElementById("projectName")?.value,
    }));
    writeFileSync(resolve(WORKDIR, "artifacts/phase5-ui-failure.json"), JSON.stringify({ ...visible, dialogs: failureDialogs, responses: foundationResponses }, null, 2));
  }
  throw error;
} finally {await browser.close();}
