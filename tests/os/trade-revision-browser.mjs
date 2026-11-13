import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { cleanEnv, command, ORIGIN, ROOT, settings, sql } from "./db/rebuild/stack.mjs";
import { ACCOUNTS, ACCOUNT_PASSWORD, ESTIMATE_A } from "./db/fixtures.mjs";

const APP="http://127.0.0.1:3097";
const config=settings();
const env={...cleanEnv(),AND_OS_DB_REBUILD:"1",SUPABASE_URL:ORIGIN,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,
  AND_OS_PROJECT_FOUNDATION_MODE:"ON",NEXT_TELEMETRY_DISABLED:"1"};
const child=spawn(process.execPath,["--import","./tests/os/db/rebuild/network-guard.mjs","./node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3097"],
  {cwd:ROOT,env,windowsHide:true,stdio:"ignore"});
const storage=readFileSync("public/os-app/src/storage.js","utf8")
  .replace(/const SUPABASE_URL = "[^"]+";/,`const SUPABASE_URL = ${JSON.stringify(ORIGIN)};`)
  .replace(/const SUPABASE_KEY = "[^"]+";/,`const SUPABASE_KEY = ${JSON.stringify(config.ANON_KEY)};`);
assert(!storage.includes(".supabase.co"));
const existing=()=>sql(`SELECT md5(to_jsonb(e)::text) FROM public.estimates e WHERE id='${ESTIMATE_A}'`);
let browser;
try{
  for(let i=0;i<45;i++){
    if(child.exitCode!==null)throw Error("Isolated server exited");
    if(await fetch(APP+"/os",{signal:AbortSignal.timeout(1000)}).then(r=>r.ok).catch(()=>false))break;
    if(i===44)throw Error("Isolated server unavailable");
    await new Promise(r=>setTimeout(r,1000));
  }
  const before=existing();assert(before);
  browser=await chromium.launch({channel:"msedge",headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:"block"});
  await context.route("**/*",route=>{
    const u=new URL(route.request().url());
    if(u.origin===APP&&u.pathname==="/os-app/src/storage.js")return route.fulfill({contentType:"application/javascript",body:storage});
    return [APP,ORIGIN].includes(u.origin)?route.continue():route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("dialog",d=>d.accept());
  const el=id=>page.locator("#"+id);
  const response=(path,method)=>page.waitForResponse(r=>new URL(r.url()).pathname===path&&r.request().method()===method);
  const check=async(id,yes=true)=>el(id).setChecked(yes);
  const fill=(id,value)=>el(id).fill(String(value));
  const select=(id,value)=>el(id).selectOption(value);
  const trade=async name=>{
    const id="section"+name+"Enabled";
    await check(id);
    const b=el("preliminary-"+id+"-button");
    if(await b.getAttribute("aria-expanded")==="false")await b.click();
  };
  async function calc(change){
    const received=[];
    const listener=r=>{if(new URL(r.url()).pathname==="/api/os/estimates/calculate"&&r.request().method()==="POST")received.push(r);};
    page.on("response",listener);
    await change();
    const desired=await page.locator("#client input[id],#client select[id]").evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.id,n.type==="checkbox"?n.checked:n.value])));
    let r;
    try{
      for(let i=0;i<100;i++){
        await new Promise(resolve=>setTimeout(resolve,100));
        r=received.findLast(r=>{
          const actual=r.request().postDataJSON().inputs;
          return ["tradeFormulaVersion","sectionDemolitionEnabled","demolitionBasicEnabled","demolitionBasicArea","demolitionMode","demoKitchenMm","demoBathFull","demoBathFixtures","sectionElectricalEnabled","electricalEnabled","electricalMode","electricBasic","electricRecessed","sectionWallpaperEnabled","wallpaperRoomPyeong","filmWallMm","vanityMm","vanityTop","vanityDepthMm","countertopTransport","countertopLadder","carrySelected"].every(k=>!(k in desired)||String(actual[k])===String(desired[k]));
        });
        if(r)break;
      }
      if(!r)throw Error("No completed calculation");
    }finally{page.off("response",listener);}
    if(!r.ok())throw Error(`Calculation returned ${r.status()}: ${(await r.json()).error}`);
    const rows=(await r.json()).snapshot.internalDetails;
    if(desired.demolitionBasicArea==="11"&&desired.demolitionMode==="full")console.log(JSON.stringify(rows.map(({item,cost})=>({item,cost}))));
    return rows;
  }
  const row=(rows,pattern)=>rows.find(r=>pattern.test(r.item));
  const cost=(rows,pattern,value)=>{
    const d=row(rows,pattern);assert(d,`missing ${pattern}`);assert.equal(d.cost,value,String(pattern));
    assert(Math.abs(d.revenue-value*1.3)<.01,String(pattern)+" markup");
  };
  await page.goto(APP+"/os-app/index.html");
  await fill("loginEmail",ACCOUNTS.find(a=>a.label==="admin-active").email);
  await fill("loginPassword",ACCOUNT_PASSWORD);
  await page.locator("#loginForm button[type=submit]").click();
  await page.locator("#appShell:not(.app-locked)").waitFor();
  await fill("projectName","SYSTEM_TRADE_REVISION_"+Date.now());
  await trade("Demolition");
  await check("demolitionBasicEnabled");await fill("demolitionBasicArea",10);
  assert(row(await calc(()=>fill("demolitionBasicArea",11)),/기본철거/));
  await select("demolitionMode","partial");
  let rows=await calc(()=>fill("demoKitchenMm",2000));
  cost(rows,/주방 가구철거/,20000);assert(!row(rows,/기본철거/));
  rows=await calc(()=>fill("demoBathFull",1));cost(rows,/화장실 전체철거/,650000);
  await fill("demoBathFull",0);
  rows=await calc(()=>fill("demoBathFixtures",1));cost(rows,/집기만/,150000);assert(!row(rows,/화장실 전체철거/));
  await trade("Electrical");
  rows=await calc(()=>check("electricalEnabled"));assert(row(rows,/전기 인건비/));
  await select("electricalMode","partial");
  rows=await calc(()=>check("electricBasic"));assert.equal(row(rows,/기본형 전기공사/).quantity,"1.5품");
  rows=await calc(()=>fill("electricRecessed",2));cost(rows,/매입등 추가/,56000);assert(!row(rows,/전기 인건비/));
  rows=await calc(()=>check("electricBasic",false));assert(!row(rows,/기본형 전기공사/));
  await trade("Wallpaper");await fill("areaPyeong",34);
  rows=await calc(()=>fill("wallpaperRoomPyeong",15));
  assert.equal(row(rows,/공용부 도배지/).quantity,"10롤");assert.equal(row(rows,/별도 벽지 방/).quantity,"8롤");
  await trade("Film");await check("filmWindow");await select("filmWindowArea","20");await fill("filmDoorCount",2);
  rows=await calc(()=>fill("filmWallMm",400));assert.equal(row(rows,/필름 인건비/).quantity,"6품");
  await trade("Furniture");await fill("furnitureTallDoors",1);await fill("furnitureMoldingMm",1000);
  await check("vanityToggle");
  rows=await calc(()=>fill("vanityMm",900));cost(rows,/키큰장 문짝/,70000);cost(rows,/가구 몰딩/,20000);assert(row(rows,/화장대 하부장/));
  await fill("vanityMm",3000);
  for(const [material,amount] of [["ceramic",1714285],["khanstone",1371428],["himacs",857142]]){
    await select("vanityTop",material);await fill("vanityDepthMm",700);
    rows=await calc(()=>fill("vanityDepthMm",1000));cost(rows,/화장대 상판/,amount);
  }
  rows=await calc(()=>check("countertopTransport"));cost(rows,/상판 운반비/,300000);
  rows=await calc(()=>check("countertopLadder"));cost(rows,/상판 사다리차/,120000);
  rows=await calc(()=>check("countertopTransport",false));assert(!row(rows,/상판 운반비/));
  await trade("Finish");await fill("carryFloor",2);await check("carryNoElevator");
  rows=await calc(()=>check("carrySelected"));cost(rows,/소운반비/,1800000);
  assert.equal(await el("wallpaperRoomPyeong").inputValue(),"15");
  const saved=response("/api/os/estimates","POST");await el("saveEstimateButton").click();
  const save=await saved;assert.equal(save.status(),201);const created=await save.json();
  await page.goto(APP+`/os-app/index.html?view=estimates&estimateId=${created.id}`);
  await page.waitForFunction(id=>!!document.querySelector(`[data-open-estimate="${id}"]`),created.id);
  await page.locator(`[data-open-estimate="${created.id}"]`).click();
  await page.waitForFunction(()=>document.querySelector("#carrySelected").checked);
  for(const [id,value] of [["demoKitchenMm","2000"],["demoBathFixtures","1"],["electricRecessed","2"],["wallpaperRoomPyeong","15"],["filmWallMm","400"],["vanityDepthMm","1000"],["carryFloor","2"]])assert.equal(await el(id).inputValue(),value,id);
  await page.locator("#estimateManagementScope").selectOption("all");
  await page.locator(`[data-open-estimate="${ESTIMATE_A}"]`).click();
  await page.waitForFunction(()=>document.querySelector("#tradeFormulaVersion").value==="legacy");
  assert.equal(existing(),before);
  assert.deepEqual(errors,[]);
  console.log("PASS: six trades, browser recalculation, one save and reload, legacy row unchanged");
}finally{
  await browser?.close();
  if(child.exitCode===null)command("taskkill",["/PID",String(child.pid),"/T","/F"]);
}
