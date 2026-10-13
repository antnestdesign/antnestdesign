import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { pathToFileURL } from "node:url";
import { ACCOUNTS, ACCOUNT_PASSWORD, profileSql } from "../fixtures.mjs";
import { assertContainer, cli, cleanEnv, command, CONTAINER, forgetContainer, ORIGIN, ROOT, settings, sql, STACK, WORKDIR } from "./stack.mjs";

const artifacts = resolve(WORKDIR, "artifacts");
const copied = resolve(WORKDIR, "supabase/migrations");
const canonical = resolve(ROOT, "supabase/migrations");
const files = readdirSync(canonical).filter((name) => /^20261013000[0-4]00_[a-z_]+\.sql$/.test(name)).sort();
if (files.length !== 5 || readdirSync(canonical).filter((name) => name.endsWith(".sql")).length !== 5) throw new Error("Unexpected migration chain");
mkdirSync(copied, { recursive:true }); mkdirSync(artifacts, { recursive:true });
const report = { stack:STACK, host:"127.0.0.1", apiPort:56321, dbPort:56322, linked:false, productionCredentialsLoaded:false,
  migrationFiles:files, manualSchemaPatch:0, archiveExecution:0, historicalSchemaExecution:0, runs:[] };
const PYTHON = process.env.AND_OS_PDF_PYTHON || "C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const parserEnv = { ...cleanEnv(), PYTHONDONTWRITEBYTECODE:"1", PYTHONPATH:"C:/Users/user/Documents/Codex/phase4-sql-tools" };
const captureSql = readFileSync(resolve(ROOT,"scripts/db/capture-app-catalog.sql"),"utf8");
function save(name, value) { writeFileSync(resolve(artifacts,name), JSON.stringify(value,null,2)+"\n"); }
function fail(message) { save("report.json", report); throw new Error(message); }
function apply() {
  const result = cli(["migration","up","--local"],120000);
  if (result.status !== 0) fail(`Migration replay failed: ${result.stderr.replace(/(?:eyJ|sb_secret_|sb_publishable_)[A-Za-z0-9._-]+/g,"[REDACTED]")}`);
}
function capture(run, label, final=false) {
  const data = JSON.parse(sql(captureSql));
  const path = resolve(artifacts,`run-${run}-${label}.json`); save(`run-${run}-${label}.json`,data);
  const result = command(PYTHON,[resolve(ROOT,"scripts/db/compare-rebuilt-catalog.py"),path,...(final?["--final"]:[])],{env:parserEnv,cwd:ROOT});
  if (result.status !== 0) fail(`Catalog ${label} comparison failed: ${result.stderr}`);
  return JSON.parse(result.stdout);
}
async function auth(s, path, body, token=s.SERVICE_ROLE_KEY, method="POST") {
  const response = await fetch(`${ORIGIN}/auth/v1/${path}`, { method, redirect:"error", signal:AbortSignal.timeout(20000),
    headers:{apikey:s.ANON_KEY,Authorization:`Bearer ${token}`,"Content-Type":"application/json"},
    ...(body!==undefined?{body:JSON.stringify(body)}:{}) });
  if (!response.ok) fail(`Local synthetic Auth ${method} failed (${response.status}); credentials suppressed`);
  return response.json();
}
async function startApp(env) {
  const child = spawn(process.execPath,[resolve(ROOT,"node_modules/next/dist/bin/next"),"dev","--hostname","127.0.0.1","--port","3044"],
    {cwd:ROOT,env:{...env,NEXT_TELEMETRY_DISABLED:"1",NODE_OPTIONS:`--import=${pathToFileURL(resolve(WORKDIR,"network-guard.mjs")).href}`},windowsHide:true,stdio:["ignore","pipe","pipe"]});
  child.stdout.on("data",()=>{}); child.stderr.on("data",()=>{}); // No server credential/header logs persisted.
  for(let n=0;n<90;n++) {
    if(child.exitCode!==null) fail("Owned app server exited before readiness");
    try { const r=await fetch("http://127.0.0.1:3044/os",{redirect:"error",signal:AbortSignal.timeout(1500)}); if(r.ok)return child; } catch { /* readiness only */ }
    await new Promise((done)=>setTimeout(done,1000));
  }
  child.kill(); fail("Owned app readiness timeout");
}
async function stopApp(child) {
  if(child?.exitCode===null) {
    const closed=once(child,"exit");
    if(process.platform==="win32") command("taskkill",["/PID",String(child.pid),"/T","/F"]);
    else child.kill("SIGTERM");
    await closed;
  }
}

try {
  for(let run=1;run<=2;run++) {
    const existing=command("docker",["inspect",CONTAINER]);
    if(existing.status===0) { assertContainer(); const stopped=cli(["stop","--no-backup"],120000); if(stopped.status!==0)fail("Owned stack removal failed"); }
    forgetContainer();
    const oldVolumes=command("docker",["volume","ls","--format","{{.Name}}"]);
    if(oldVolumes.stdout.split(/\r?\n/).some((name)=>name.includes(STACK)))fail("Old rebuild volume still exists");
    for(const name of readdirSync(copied)) { if(!files.includes(name))fail("Unexpected generated migration file"); rmSync(resolve(copied,name)); }
    console.log(`RUN ${run}: start new PG17 volume; no app schema inputs.`);
    const started=cli(["start"],600000); if(started.status!==0)fail("New owned PG17 stack start failed; credential output suppressed");
    const owner=assertContainer();
    const version=sql("SELECT current_setting('server_version');"); if(!/^17\./.test(version))fail("PostgreSQL 17 required");
    const blank=JSON.parse(sql(captureSql));
    for(const key of ["tables","functions","views","sequences","types"])if(blank[key].length)fail(`Not blank: ${key}`);
    const entry={run,version,containerId:owner.id,volumes:owner.volumes,blankAppObjects:0,migrationResult:"PENDING",suites:[]}; report.runs.push(entry); save(`run-${run}-blank.json`,blank);
    copyFileSync(resolve(canonical,files[0]),resolve(copied,files[0])); apply();
    entry.baseline=capture(run,"baseline");
    for(const name of files.slice(1))copyFileSync(resolve(canonical,name),resolve(copied,name));
    for(const name of files)if(!readFileSync(resolve(copied,name)).equals(readFileSync(resolve(canonical,name))))fail("Migration copy differs from canonical bytes");
    apply(); entry.migrationResult="PASS";
    const history=sql("SELECT coalesce(json_agg(version ORDER BY version),'[]'::json) FROM supabase_migrations.schema_migrations;");
    entry.history=JSON.parse(history); if(JSON.stringify(entry.history)!==JSON.stringify(files.map((name)=>name.slice(0,14))))fail("Migration history mismatch");
    entry.final=capture(run,"final",true);
    const countSql="SELECT "+JSON.parse(readFileSync(resolve(ROOT,"docs/db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json"),"utf8")).tables.map((t)=>`(SELECT count(*) FROM public.\"${t.name}\")`).join("+")+";";
    entry.preFixtureRows=Number(sql(countSql)); if(entry.preFixtureRows!==0)fail("Migration inserted business rows");
    const s=settings(), accounts={};
    for(const account of ACCOUNTS) {
      const user=await auth(s,"admin/users",{email:account.email,password:ACCOUNT_PASSWORD,email_confirm:true});
      const id=user.id||user.user?.id; sql(profileSql(account,id),true);
      const session=await auth(s,"token?grant_type=password",{email:account.email,password:ACCOUNT_PASSWORD},s.ANON_KEY);
      accounts[account.label]={...account,id,token:session.access_token};
    }
    const env={...cleanEnv(),AND_OS_DB_TEST:"1",AND_OS_DB_REBUILD:"1",AND_OS_DB_ANON:s.ANON_KEY,AND_OS_DB_SERVICE:s.SERVICE_ROLE_KEY,
      AND_OS_DB_ACCOUNTS:JSON.stringify(accounts),SUPABASE_URL:ORIGIN,NEXT_PUBLIC_SUPABASE_URL:ORIGIN,SUPABASE_SERVICE_ROLE_KEY:s.SERVICE_ROLE_KEY,SUPABASE_SERVICE_KEY:""};
    sql("NOTIFY pgrst, 'reload schema';"); await new Promise((done)=>setTimeout(done,1000));
    let app;
    try {
      app=await startApp(env);
      for(const [label,config] of [["Security","vitest.db.config.mjs"],["Integrity","vitest.integrity.config.mjs"],["Staff Boundary","vitest.staff.config.mjs"]]) {
        console.log(`RUN ${run}: ${label} on canonical PG17 schema.`);
        const result=command(process.execPath,[resolve(ROOT,"node_modules/vitest/vitest.mjs"),"run","--config",config,"--reporter=default","--reporter=json",`--outputFile=${resolve(artifacts,`run-${run}-${label.replaceAll(" ","-")}.json`)}`],{cwd:ROOT,env,timeout:600000,stdio:"inherit"});
        if(result.status!==0)fail(`${label} failed; no patch or fixture bypass applied`);
        const data=JSON.parse(readFileSync(resolve(artifacts,`run-${run}-${label.replaceAll(" ","-")}.json`),"utf8"));
        entry.suites.push({name:label,passed:data.numPassedTests,failed:data.numFailedTests,pending:data.numPendingTests});
        if(data.numFailedTests||data.numPendingTests)fail("Failure/skip gate");
      }
      const ui=command(process.execPath,[resolve(WORKDIR,"ui-smoke.mjs")],{cwd:ROOT,env,timeout:180000,stdio:"inherit"});
      if(ui.status!==0)fail("Real browser UI smoke failed; no source/API mock repair applied");
      entry.ui=JSON.parse(readFileSync(resolve(artifacts,"ui-report.json"),"utf8"));
    } finally { await stopApp(app); }
    process.env.AND_OS_DB_REBUILD="1";
    sql(readFileSync(resolve(WORKDIR,"reset-integrity.sql"),"utf8"),true);
    entry.afterTests=capture(run,"after-tests",true);
    if(entry.afterTests.fingerprint!==entry.final.fingerprint)fail("Test schema leakage");
    save("report.json",report);
  }
  if(report.runs[0].final.fingerprint!==report.runs[1].final.fingerprint)fail("Fresh rebuild fingerprint mismatch");
  report.result="PASS";report.fingerprint=report.runs[0].final.fingerprint;
  report.archiveHashes=Object.fromEntries(["cost_items_v2_3.sql","rfc_003a_user_profiles.sql"].map((name)=>[name,createHash("sha256").update(readFileSync(resolve(ROOT,"supabase/archive",name))).digest("hex")]));
  save("report.json",report);console.log("Two fresh canonical rebuilds and runtime suites PASS; credentials never persisted.");
} catch(error) { report.result="FAIL";save("report.json",report);console.error(error.message);process.exitCode=1; }
