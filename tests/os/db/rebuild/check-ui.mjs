// Diagnostic UI retry against the already-verified owned schema; not a fresh rebuild verdict.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ACCOUNTS, ACCOUNT_PASSWORD } from "../fixtures.mjs";
import { command, cleanEnv, ORIGIN, ROOT, WORKDIR, settings } from "./stack.mjs";
const s=settings(),accounts={};
for(const a of ACCOUNTS) {
  const r=await fetch(`${ORIGIN}/auth/v1/token?grant_type=password`,{method:"POST",redirect:"error",headers:{apikey:s.ANON_KEY,"Content-Type":"application/json"},body:JSON.stringify({email:a.email,password:ACCOUNT_PASSWORD})});
  if(!r.ok)throw new Error("Owned synthetic session unavailable");const v=await r.json();accounts[a.label]={...a,id:v.user.id,token:v.access_token};
}
const env={...cleanEnv(),AND_OS_DB_TEST:"1",AND_OS_DB_REBUILD:"1",AND_OS_DB_ANON:s.ANON_KEY,AND_OS_DB_SERVICE:s.SERVICE_ROLE_KEY,
  AND_OS_DB_ACCOUNTS:JSON.stringify(accounts),SUPABASE_URL:ORIGIN,NEXT_PUBLIC_SUPABASE_URL:ORIGIN,SUPABASE_SERVICE_ROLE_KEY:s.SERVICE_ROLE_KEY,SUPABASE_SERVICE_KEY:"",
  NEXT_TELEMETRY_DISABLED:"1",NODE_OPTIONS:`--import=${pathToFileURL(resolve(WORKDIR,"network-guard.mjs")).href}`};
const child=spawn(process.execPath,[resolve(ROOT,"node_modules/next/dist/bin/next"),"dev","--hostname","127.0.0.1","--port","3044"],{cwd:ROOT,env,windowsHide:true,stdio:["ignore","pipe","pipe"]});
child.stdout.on("data",()=>{});child.stderr.on("data",()=>{});
try {
  let ready=false;
  for(let i=0;i<60;i++) {
    try {const r=await fetch("http://127.0.0.1:3044/os",{signal:AbortSignal.timeout(1000)});if(r.ok){ready=true;break;}}catch { /* readiness */ }
    if(child.exitCode!==null)throw new Error("Owned app startup failed");await new Promise((done)=>setTimeout(done,1000));
  }
  if(!ready)throw new Error("Owned app readiness timeout");
  const result=command(process.execPath,[resolve(WORKDIR,"ui-smoke.mjs")],{cwd:ROOT,env,stdio:"inherit",timeout:180000});
  process.exitCode=result.status===0?0:1;
} finally {
  if(child.exitCode===null) {const closed=once(child,"exit");command("taskkill",["/PID",String(child.pid),"/T","/F"]);await closed;}
}
