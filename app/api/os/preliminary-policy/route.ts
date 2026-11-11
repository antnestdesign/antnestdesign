import { NextRequest } from 'next/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import {ApiError,errorResponse,getUserContext,json,readBearerToken,requireAdmin,requireServiceRoleKey,supabaseUserFetch,supabaseFetch} from '../_lib/server';
import {defaultPolicy,policyCatalog,policyRateValues,policyScenario,PreliminaryPolicyError,validatePolicy} from '../_lib/calculation/preliminary-policy.js';
import {createEstimateCalculation} from '../_lib/calculation/calculator/estimate-core.js';
import {PRELIMINARY_POLICY_EXAMPLES} from '../_lib/calculation/preliminary-policy-examples.js';
type PolicyState={version:number;revision:number;draft:unknown;draft_master_hash:string|null;master_hash:string;masters:Array<{id:string;item_code:string;item_name:string;unit:string;cost_price:number;is_active:boolean}>;current:unknown;history:Array<{version:number;reason:string;published_at:string;published_by:string}>};

async function state(request:NextRequest) {
  const context=await getUserContext(request);
  if(!['admin','manager'].includes(context.profile.role))throw new ApiError(403,'산정 기준 조회 권한이 없습니다.');
  const data=await supabaseUserFetch<PolicyState>('/rest/v1/rpc/get_preliminary_policy_state',readBearerToken(request),{method:'POST',body:'{}'});
  const core=createEstimateCalculation();
  const config=structuredClone(data.current||defaultPolicy(core.policyDefaults(),data.masters));
  const policy=config as {prices:Record<string,number>};
  for(const row of data.masters as Array<{item_code:string,cost_price:number}>)if(Object.hasOwn(policy.prices,row.item_code))policy.prices[row.item_code]=Number(row.cost_price);
  return {...data,current:validatePolicy(config),catalog:policyCatalog(),can_edit:context.profile.role==='admin'};
}
function safeError(error:unknown) {
  if(error instanceof PreliminaryPolicyError)return json({error:error.message},{status:400});
  if(error instanceof ApiError){let status=error.status,message=error.message;try{const parsed=JSON.parse(message);if(parsed.code==='40001')status=409;else if(parsed.code==='42501')status=403;else if(parsed.code==='22023')status=400;message=typeof parsed.message==='string'&&/^[가-힣]/.test(parsed.message)?parsed.message:'산정 기준 요청을 처리하지 못했습니다.';}catch{if(!/^[가-힣]/.test(message))message='산정 기준 요청을 처리하지 못했습니다.';}return json({error:message},{status});}
  return errorResponse(error);
}
export async function GET(request:NextRequest) {try{return json(await state(request));}catch(error){return safeError(error);}}
export async function POST(request:NextRequest) {
  try{
    const actor=await requireAdmin(request);
    const token=readBearerToken(request),body=await request.json();
    if(!body||Array.isArray(body)||JSON.stringify(body).length>180000)throw new ApiError(400,'산정 기준 요청을 확인해 주세요.');
    const action=body.action;
    if(!['save','preview','publish','cancel','restore'].includes(action)||Object.keys(body).some(k=>!['action','config','revision','master_hash','inputs','reason','version','preview_token'].includes(k)))throw new ApiError(400,'허용되지 않은 산정 기준 요청입니다.');
    if(action==='preview'){
      const data=await state(request),next=validatePolicy(body.config),inputs=policyScenario(body.inputs||{});
      const run=(config:ReturnType<typeof validatePolicy>)=>{const core=createEstimateCalculation({preliminaryPolicy:config,rateValues:policyRateValues(config),carpentryPrices:Object.fromEntries(Object.entries(config.prices).filter(([code])=>code.startsWith('WOOD_')).map(([code,price])=>[code,{price,source:'시험 계산 기준'}]))}),r=core.calculate(core.readState(inputs)),groups=core.groupedCustomerItems(r.details,r.quoteLines);return {cost:r.directCost,total:groups.reduce((sum:number,g:{total:number})=>sum+g.total,0),details:r.details,groups};};
      const trial=(config:ReturnType<typeof validatePolicy>,scenario:Record<string,unknown>)=>{const core=createEstimateCalculation({preliminaryPolicy:config,carpentryPrices:Object.fromEntries(Object.entries(config.prices).filter(([code])=>code.startsWith('WOOD_')).map(([code,price])=>[code,{price,source:'시험 계산 기준'}]))}),r=core.calculate(core.readState(scenario)),groups=core.groupedCustomerItems(r.details,r.quoteLines);return {cost:r.directCost,total:groups.reduce((sum:number,g:{total:number})=>sum+g.total,0)};};
      const examples=PRELIMINARY_POLICY_EXAMPLES.map(s=>({label:s.label,trade:s.trade,before:trial(data.current,s.inputs),after:trial(next,s.inputs)}));
      return json({before:run(data.current),after:run(next),examples,changes:changes(data.current,next),preview_token:previewToken(actor.authUser.id,next,data.master_hash,data.revision,Date.now())});
    }
    if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new ApiError(400,'개정번호를 확인해 주세요.');
    if(action==='save'||action==='restore'){
      let config=body.config;
      if(action==='restore'){
        if(!Number.isSafeInteger(body.version)||body.version<1)throw new ApiError(400,'복원 기준 버전을 확인해 주세요.');
        const rows=await supabaseFetch<Array<{config:unknown}>>(`/rest/v1/preliminary_policy_versions?version=eq.${body.version}&select=config`);
        if(!rows[0])throw new ApiError(404,'산정 기준 버전을 찾지 못했습니다.');config=rows[0].config;
      }
      validatePolicy(config);
      await supabaseUserFetch('/rest/v1/rpc/save_preliminary_policy_draft',token,{method:'POST',body:JSON.stringify({p_config:config,p_expected_revision:body.revision,p_master_hash:body.master_hash})});
    }else if(action==='publish'){
      const data=await state(request);if(!data.draft)throw new ApiError(400,'임시저장된 산정 기준이 없습니다.');validatePolicy(data.draft);
      const parts=typeof body.preview_token==='string'?body.preview_token.split('.'):[],issued=Number(parts[0]);
      if(parts.length!==2||!Number.isSafeInteger(issued)||Date.now()-issued>600000||issued>Date.now()+1000)throw new ApiError(409,'임시저장된 기준을 다시 시험 계산한 뒤 게시해 주세요.');
      const expected=previewToken(actor.authUser.id,data.draft,data.master_hash,data.revision,issued),actual=Buffer.from(body.preview_token),wanted=Buffer.from(expected);
      if(actual.length!==wanted.length||!timingSafeEqual(actual,wanted))throw new ApiError(409,'시험 계산 이후 기준이 변경되었습니다. 다시 확인해 주세요.');
      await supabaseUserFetch('/rest/v1/rpc/publish_preliminary_policy',token,{method:'POST',body:JSON.stringify({p_expected_revision:body.revision,p_reason:body.reason})});
    }else await supabaseUserFetch('/rest/v1/rpc/cancel_preliminary_policy_draft',token,{method:'POST',body:JSON.stringify({p_expected_revision:body.revision})});
    return json(await state(request));
  }catch(error){return safeError(error);}
}
function canonical(value:unknown):unknown {if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical((value as Record<string,unknown>)[k])]));return value;}
function previewToken(actor:string,config:unknown,hash:unknown,revision:unknown,time:number) {return `${time}.${createHmac('sha256',requireServiceRoleKey()).update(JSON.stringify([actor,canonical(config),hash,revision,time])).digest('base64url')}`;}
function changes(before:ReturnType<typeof validatePolicy>,after:ReturnType<typeof validatePolicy>) {
  const out=[];for(const area of ['prices','parameters','rules'] as const)for(const key of Object.keys(before[area]))if(JSON.stringify(before[area][key])!==JSON.stringify(after[area][key]))out.push({area,key,before:before[area][key],after:after[area][key]});return out;
}
