import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError, getUserContext, json, requireServiceRoleKey, supabaseFetch, type UserContext } from '../../_lib/server';
import { definition, freezeDefinition, evaluateItem, itemCatalog, priceUnits, object, ItemDefinitionError, RESERVED_COST_CODES } from './model.js';
import { createEstimateCalculation } from '../../_lib/calculation/calculator/estimate-core.js';

export function builderMode() {const value=process.env.AND_OS_ESTIMATE_ITEM_BUILDER_MODE;return value==='ON'||value==='READ_ONLY'?value:'OFF';}
export function requireBuilder(write=false) {const mode=builderMode();if(mode==='OFF'||write&&mode!=='ON')throw new ApiError(mode==='OFF'?503:423,mode==='OFF'?'견적 항목 만들기가 비활성화되어 있습니다.':'견적 항목 만들기는 현재 읽기 전용입니다.');return mode;}
export async function assertBuilderActor(user:UserContext) {
  const rows=await supabaseFetch<Array<{role:string|null;is_active:boolean;must_change_password:boolean}>>(`/rest/v1/profiles?id=eq.${itemId(user.authUser.id)}&select=role,is_active,must_change_password`);
  const p=rows[0];if(!p||!['admin','manager','staff'].includes(p.role||'')||p.role!==user.profile.role||p.is_active!==true||p.must_change_password!==false)throw new ApiError(403,'현재 견적 항목 접근 권한이 없습니다. 다시 로그인하거나 관리자에게 확인해 주세요.');
}
export function itemId(value:unknown):string {if(typeof value!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new ApiError(400,'항목 식별자를 확인해 주세요.');return value;}
const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical((value as Record<string,unknown>)[k])])):value;
function receipt(actor:string,id:string,revision:number,frozen:unknown,time:number) {return `${time}.${createHmac('sha256',requireServiceRoleKey()).update(JSON.stringify([actor,id,revision,canonical(frozen),time])).digest('base64url')}`;}
function pricingBase(raw:unknown){const d=definition(raw);if(d.pricing){delete d.pricing.preliminarySaleUnit;delete d.pricing.detailedSaleUnit;}return JSON.stringify(canonical(d));}
type Row={id:string;template_id:string;version:number;frozen:ReturnType<typeof freezeDefinition>};
export async function publishedItems(privileged=false) {
  requireBuilder();
  const rows=await supabaseFetch<Array<{current_version:string|null}>>('/rest/v1/estimate_item_templates?is_active=eq.true&select=current_version');
  const ids=rows.map(r=>r.current_version).filter(Boolean);
  if(!ids.length)return [];
  return (await supabaseFetch<Row[]>(`/rest/v1/estimate_item_versions?select=*&id=in.(${ids.join(',')})&order=published_at.desc`)).map(r=>itemCatalog(r,privileged));
}
export async function versionForAdoption(id:string) {
  requireBuilder(true);itemId(id);
  const rows=await supabaseFetch<Row[]>(`/rest/v1/estimate_item_versions?id=eq.${id}&select=*`);
  const row=rows[0];if(!row)throw new ApiError(404,'게시 항목을 찾지 못했습니다.');
  const heads=await supabaseFetch<Array<{id:string}>>(`/rest/v1/estimate_item_templates?id=eq.${row.template_id}&is_active=eq.true&current_version=eq.${id}&select=id`);
  if(!heads.length)throw new ApiError(409,'항목이 변경·비활성화되었습니다. 목록을 다시 확인해 주세요.');
  return row;
}
export function builderFailure(error:unknown) {
  if(error instanceof ItemDefinitionError)return json({error:error.message},{status:400});
  if(error instanceof ApiError){let status=error.status,message=error.message;try {const d=JSON.parse(message);status=({'42501':403,'40001':409,'23505':409,'23514':409,'22023':400,'55P03':409,'57014':503,P0002:404} as Record<string,number>)[d.code]||500;message=d.message;}catch{/* Only Korean business errors are returned. */}return json({error:status<500&&/^[가-힣]/.test(message)?message:status===503?'항목 기능을 사용할 수 없습니다. 잠시 후 다시 확인해 주세요.':'항목 요청을 처리하지 못했습니다.'},{status});}
  return json({error:'항목 요청을 처리하지 못했습니다.'},{status:500});
}
export async function builderRoute(request:NextRequest) {
  try {
    const user=await getUserContext(request),role=user.profile.role;
    await assertBuilderActor(user);
    if(!['admin','manager','staff'].includes(role))throw new ApiError(403,'접근 권한이 없습니다.');
    const url=new URL(request.url);
    if(request.method==='GET'&&url.searchParams.get('view')==='state')return json({mode:builderMode(),canManage:role==='admin',canInspect:role!=='staff'});
    if(url.searchParams.get('view')==='catalog'&&request.method==='GET')return json(await publishedItems(role!=='staff'));
    if(!['admin','manager'].includes(role))throw new ApiError(403,'항목 산정 기준에 접근할 권한이 없습니다.');
    const mode=requireBuilder(request.method!=='GET');
    if(request.method==='GET'&&url.searchParams.get('view')==='masters')return json((await supabaseFetch<Array<{item_code:string}>>('/rest/v1/cost_items?is_active=eq.true&select=item_code,item_name,unit,cost_price&order=category.asc,item_name.asc')).filter(m=>!RESERVED_COST_CODES.has(m.item_code)));
    const call=(action:string,extra:Record<string,unknown>={})=>supabaseFetch('/rest/v1/rpc/and_os_estimate_item_command',{method:'POST',body:JSON.stringify({p_actor:user.authUser.id,p_mode:mode,p_action:action,...extra})});
    if(request.method==='GET'){
      const result=await call('list') as {items:Array<{draft_config:unknown}>;versions:unknown[]};
      const core=createEstimateCalculation(),margin=core.readState({}).targetMargin;
      return json({...result,items:result.items.map(h=>{const d=definition(h.draft_config),cost=d.pricing?.costUnit;return {...h,...(cost===undefined?{}:{priceSummary:priceUnits({definition:d,costUnit:cost},margin)})};})});
    }
    const raw=await request.text();if(raw.length>30000)throw new ApiError(413,'항목 요청이 너무 큽니다.');
    const b=object(JSON.parse(raw),['action','id','revision','config','inputs','preview','reason','request_id','active']);
    if(!['save','preview','publish','active'].includes(b.action))throw new ApiError(400,'지원하지 않는 항목 작업입니다.');
    const id=itemId(b.id);if(!Number.isSafeInteger(b.revision)||b.revision<0)throw new ApiError(400,'항목 개정번호를 확인해 주세요.');
    if(role==='manager'){
      if(!['save','preview','publish'].includes(b.action))throw new ApiError(403,'관리자만 견적 항목의 사용 상태를 변경할 수 있습니다.');
      const heads=await supabaseFetch<Array<{draft_config:unknown;current_version:string|null}>>(`/rest/v1/estimate_item_templates?id=eq.${id}&select=draft_config,current_version`),h=heads[0];
      if(!h?.current_version||!definition(h.draft_config).pricing)throw new ApiError(403,'매니저는 게시된 직접 입력 항목의 판매단가만 변경할 수 있습니다.');
      const versions=await supabaseFetch<Row[]>(`/rest/v1/estimate_item_versions?id=eq.${itemId(h.current_version)}&select=*`);
      if(!versions[0]||pricingBase(h.draft_config)!==pricingBase(versions[0].frozen.definition)||b.action==='save'&&pricingBase(b.config)!==pricingBase(h.draft_config))throw new ApiError(403,'항목 정보와 원가 변경은 관리자에게 요청해 주세요.');
    }
    if(b.action==='save')return json(await call('save',{p_id:id,p_revision:b.revision,p_config:definition(b.config),p_request:itemId(b.request_id)}));
    if(b.action==='active'){if(typeof b.active!=='boolean')throw new ApiError(400,'사용 상태를 확인해 주세요.');return json(await call('active',{p_id:id,p_revision:b.revision,p_active:b.active,p_request:itemId(b.request_id)}));}
    if(b.action==='publish'){
      const replay=await call('replay',{p_request:itemId(b.request_id)}) as {result:{current_version:string};action:string}|null;
      if(replay&&replay.action==='publish'){
        const versions=await supabaseFetch<Row[]>(`/rest/v1/estimate_item_versions?id=eq.${itemId(replay.result.current_version)}&select=*`);
        const time=typeof b.preview==='string'?Number(b.preview.split('.')[0]):NaN;
        if(!versions[0]||!Number.isSafeInteger(time))throw new ApiError(409,'게시 재시도 정보를 확인해 주세요.');
        const expected=Buffer.from(receipt(user.authUser.id,id,b.revision,versions[0].frozen,time)),actual=Buffer.from(b.preview);
        if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new ApiError(409,'게시 재시도 내용이 일치하지 않습니다.');
        return json(await call('publish',{p_id:id,p_revision:b.revision,p_frozen:versions[0].frozen,p_reason:b.reason,p_request:itemId(b.request_id)}));
      }
    }
    const rows=await supabaseFetch<Array<{draft_config:unknown;revision:number}>>(`/rest/v1/estimate_item_templates?id=eq.${id}&select=draft_config,revision`);
    if(!rows[0]||rows[0].revision!==b.revision)throw new ApiError(409,'항목이 변경됐습니다. 다시 불러와 주세요.');
    const config=definition(rows[0].draft_config);
    const masters=config.pricing?[]:await supabaseFetch<Array<Record<string,unknown>>>('/rest/v1/cost_items?select=item_code,item_name,unit,cost_price,is_active,updated_at');
    const frozen=freezeDefinition(config,masters);
    if(b.action==='preview'){
      const evaluated=evaluateItem(frozen,b.inputs),core=createEstimateCalculation(),margin=core.readState({}).targetMargin,units=priceUnits(frozen,margin);
      const manual=frozen.definition.pricing?.preliminarySaleUnit!=null;
      const line=units.preliminaryUnit===null?null:core.makeDetail({group:'misc',item:frozen.definition.name,input:'시험 계산',quantity:`${evaluated.quantity}${frozen.definition.unit}`,unitPrice:frozen.costUnit,cost:evaluated.cost??0,margin,customerRevenue:manual?core.floorThousand(evaluated.quantity*units.preliminaryUnit):undefined});
      return json({quantity:evaluated.quantity,unit:frozen.definition.unit,costUnit:frozen.costUnit,...units,preliminarySale:line?.customerRevenue??null,preview:receipt(user.authUser.id,id,b.revision,frozen,Date.now())});
    }
    const units=priceUnits(frozen);if(units.preliminaryUnit===null||units.detailedUnit===null)throw new ApiError(400,'원가를 입력하거나 가견적·본견적 판매단가를 모두 입력해 주세요.');
    const time=typeof b.preview==='string'?Number(b.preview.split('.')[0]):NaN;
    if(!Number.isSafeInteger(time)||time>Date.now()+1000||Date.now()-time>600000)throw new ApiError(409,'저장한 기준으로 시험 계산을 다시 실행해 주세요.');
    const expected=Buffer.from(receipt(user.authUser.id,id,b.revision,frozen,time)),actual=Buffer.from(b.preview);
    if(expected.length!==actual.length||!timingSafeEqual(expected,actual))throw new ApiError(409,'시험 이후 항목·원가가 변경됐습니다. 다시 시험 계산해 주세요.');
    return json(await call('publish',{p_id:id,p_revision:b.revision,p_frozen:frozen,p_reason:b.reason,p_request:itemId(b.request_id)}));
  }catch(error){return builderFailure(error);}
}
