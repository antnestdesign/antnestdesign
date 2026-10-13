import { createRequire } from "node:module";

if(process.env.AND_OS_DB_REBUILD!=="1"||process.env.SUPABASE_URL!=="http://127.0.0.1:56321")throw new Error("Owned rebuilt environment required");
// Keep the actual Next app, but prevent it loading ignored Production env files.
const require=createRequire(import.meta.url);
const envPath=require.resolve("@next/env");
const envModule=require(envPath);
require.cache[envPath].exports={...envModule,loadEnvConfig:()=>({combinedEnv:process.env,parsedEnv:{},loadedEnvFiles:[]})};
const nativeFetch=globalThis.fetch;
globalThis.fetch=(input,init={})=>{
  const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
  if(url.origin!=="http://127.0.0.1:56321"||(!url.pathname.startsWith("/auth/v1/")&&!url.pathname.startsWith("/rest/v1/")))throw new Error("Hosted/network escape blocked in rebuilt app");
  return nativeFetch(input,{...init,redirect:"error"});
};
