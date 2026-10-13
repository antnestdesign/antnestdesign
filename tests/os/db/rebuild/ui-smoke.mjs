import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
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
    const page=await context.newPage();page.on("pageerror",(error)=>errors.push(error.message));page.on("dialog",(dialog)=>dialog.dismiss());
    const before=await full();
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
    report.roles.push({role,login:"PASS",oldEstimateRead:"PASS",estimateWritesOnRead:writes.length,quoteTotal:3770000,contractPanel:"PASS",costAccountAudit:role==="staff-active"?"HIDDEN":"PASS",pageErrors:errors.length,hostedDbAttempts});
    await context.close();
  }
  report.result="PASS";writeFileSync(resolve(WORKDIR,"artifacts/ui-report.json"),JSON.stringify(report,null,2)+"\n");
  console.log("Owned Chromium UI smoke: admin/manager/staff PASS; zero hosted DB requests and read mutations.");
} finally {await browser.close();}
