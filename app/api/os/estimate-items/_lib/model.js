import { validateExpression, evaluateExpression } from '../../_lib/calculation/preliminary-policy.js';
import { detailedLineAmount } from '../../../../../public/os-app/src/detailed-money.js';

export const ITEM_TRADES = { demolition:'철거·인허가',electrical:'전기·조명',bathroom:'욕실·타일',wallpaper:'도배',film:'필름',flooring:'바닥',carpentry:'목공',furniture:'가구',finish:'마감·기타' };
export const ITEM_UNITS = ['개','식','평','㎡','m','품','일','장','통','롤','박스'];
export const RESERVED_COST_CODES = new Set(['ELEC_DAYS_UNDER10','ELEC_DAYS_OVER10','MISC_EXISTING_PIPE_CLEANING']);
export class ItemDefinitionError extends Error {}
const fail = message => { throw new ItemDefinitionError(message); };
export function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) fail('허용되지 않은 항목 정보입니다.');
  return value;
}
const label = (value, limit=100) => {
  if (typeof value !== 'string' || !value.trim() || value.length>limit || /[<>\u0000-\u001f]/.test(value)) fail('항목명·규격을 확인해 주세요.');
  return value.trim();
};
export const finite = (value, min=0, max=1000000) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value<min || value>max || Math.abs(value-Number(value.toFixed(6)))>1e-10) fail('수량·산정 기준의 허용 범위를 확인해 주세요.');
  return value;
};
export function definition(value) {
  const d=object(value,['schema','name','trade','spec','unit','recipe','components','pricing']);
  if (d.schema!==1 || !Object.hasOwn(ITEM_TRADES,d.trade) || !ITEM_UNITS.includes(d.unit)) fail('공정·단위를 확인해 주세요.');
  const r=object(d.recipe,['kind','step','waste']);
  if (!['quantity','length','area','pack'].includes(r.kind)) fail('지원하는 산정 방식을 선택해 주세요.');
  if (r.kind==='length' && d.unit!=='m') fail('길이 환산 품목의 결과 단위는 m입니다.');
  if (r.kind==='area' && !['㎡','평'].includes(d.unit)) fail('면적 환산 품목의 결과 단위는 ㎡ 또는 평입니다.');
  if (r.kind==='pack' && !['장','통','롤','박스','개'].includes(d.unit)) fail('묶음 산정 품목의 결과 단위를 확인해 주세요.');
  const recipe={kind:r.kind,step:finite(r.step,0.000001),waste:finite(r.waste,0,100)};
  if (r.kind!=='pack' && r.step!==1) fail('묶음 이외의 기준 수량은 1이어야 합니다.');
  if (!Array.isArray(d.components) || d.components.length>20) fail('원가 구성은 20개까지 등록할 수 있습니다.');
  const codes=new Set();
  const components=d.components.map(c=>{
    object(c,['code','quantity']);
    if (typeof c.code!=='string'||! /^[A-Z][A-Z0-9_]{1,99}$/.test(c.code)||codes.has(c.code)) fail('원가 품목 중복·연결을 확인해 주세요.');
    if(RESERVED_COST_CODES.has(c.code))fail('물량 기준 또는 전용 판매정책 항목은 원가 구성으로 사용할 수 없습니다. 기존 전용 항목을 이용해 주세요.');
    codes.add(c.code);return {code:c.code,quantity:finite(c.quantity,0.000001)};
  });
  /** @type {{kind:string,costUnit:number|null,preliminarySaleUnit?:number|null,detailedSaleUnit?:number|null}|undefined} */
  let pricing;
  if(d.pricing!==undefined){
    const p=object(d.pricing,['kind','costUnit','preliminarySaleUnit','detailedSaleUnit']);
    if(p.kind!=='direct'||components.length)fail('직접 입력 가격과 원가 구성을 함께 사용할 수 없습니다.');
    if(p.costUnit!==null&&(!Number.isSafeInteger(p.costUnit)||p.costUnit<0||p.costUnit>1e9))fail('단위 원가는 0원부터 10억원까지 원 단위로 입력해 주세요.');
    pricing={kind:'direct',costUnit:p.costUnit};
    for(const key of ['preliminarySaleUnit','detailedSaleUnit'])if(Object.hasOwn(p,key)){
      if(p[key]!==null&&(!Number.isSafeInteger(p[key])||p[key]<0||p[key]>1e9))fail('판매단가는 0원부터 10억원까지 원 단위로 입력해 주세요.');
      pricing[key]=p[key];
    }
  }
  return {schema:1,name:label(d.name),trade:d.trade,spec:d.spec===''?'':label(d.spec,200),unit:d.unit,recipe,components,...(pricing?{pricing}:{})};
}
const n=value=>({value}),v=variable=>({variable}),op=(operator,...args)=>({operator,args});
export function inputFields(d) {
  if (d.recipe.kind==='length') return [{key:'length',label:'길이',unit:'mm'}];
  if (d.recipe.kind==='area') return [{key:'width',label:'가로',unit:'mm'},{key:'height',label:'세로',unit:'mm'}];
  return [{key:'quantity',label:d.recipe.kind==='pack'?'시공면적':'수량',unit:d.recipe.kind==='pack'?'㎡':d.unit}];
}
export function quantity(d, values) {
  const fields=inputFields(d);object(values,fields.map(f=>f.key));
  const vars=Object.fromEntries(fields.map(f=>[f.key,finite(values[f.key])]));
  let expr=d.recipe.kind==='length'?op('divide',v('length'),n(1000)):
    d.recipe.kind==='area'?op('divide',op('multiply',v('width'),v('height')),n(d.unit==='평'?3305800:1000000)):v('quantity');
  expr=op('multiply',expr,n(1+d.recipe.waste/100));
  if (d.recipe.kind==='pack') expr=op('ceil',op('divide',expr,n(d.recipe.step)));
  validateExpression(expr,new Set(fields.map(f=>f.key)));
  const result=evaluateExpression(expr,vars);
  if (!Number.isFinite(result)||result<0||result>100000) fail('산출 수량이 허용 범위를 초과했습니다.');
  return Number(result.toFixed(6));
}
export function freezeDefinition(d, masters) {
  d=definition(d);
  const components=d.components.map(c=>{
    const m=masters.find(m=>m.item_code===c.code && m.is_active===true);
    if (!m || m.cost_price==null || !Number.isSafeInteger(Number(m.cost_price)) || Number(m.cost_price)<0) fail('연결 원가가 미등록·비활성 상태입니다. 원가관리에서 확인해 주세요.');
    return {...c,name:m.item_name,unit:m.unit,costPrice:Number(m.cost_price),updatedAt:m.updated_at};
  });
  const costUnit=d.pricing?.kind==='direct'?d.pricing.costUnit:components.length?components.reduce((sum,c)=>sum+detailedLineAmount(c.quantity,c.costPrice),0):null;
  if (costUnit!==null&&(!Number.isSafeInteger(costUnit)||costUnit>1e9)) fail('구성 원가가 허용 범위를 초과했습니다.');
  return {engine:'estimate-item-v1',definition:d,components,costUnit};
}
export function itemCatalog(row, privileged=false) {
  const f=row.frozen, d=definition(f.definition);
  return {id:row.id,templateId:row.template_id,version:row.version,name:d.name,trade:d.trade,spec:d.spec,unit:d.unit,
    inputs:inputFields(d),recipeLabel:({quantity:'수량 직접 입력',length:'길이 환산',area:'가로 × 세로',pack:'면적별 묶음 올림'})[d.recipe.kind],
    saleUnitPrice:priceUnits(f).detailedUnit,
    ...(privileged?{costUnit:f.costUnit,definition:d}: {})};
}
export function priceUnits(frozen,preliminaryMargin=.3,detailedMargin=.25){
  const p=definition(frozen.definition).pricing;
  return {preliminaryUnit:p?.preliminarySaleUnit??(frozen.costUnit===null?null:frozen.costUnit*(1+preliminaryMargin)),detailedUnit:p?.detailedSaleUnit??(frozen.costUnit===null?null:Math.round(frozen.costUnit/(1-detailedMargin)))};
}
export function evaluateItem(frozen, inputs) {
  if(frozen.engine!=='estimate-item-v1') fail('지원하지 않는 항목 계산 버전입니다.');
  const d=definition(frozen.definition), q=quantity(d,inputs);
  const cost=frozen.costUnit===null?null:detailedLineAmount(q,frozen.costUnit);
  if(cost!==null&&(!Number.isSafeInteger(cost)||cost>1e12))fail('공사 원가가 허용 범위를 초과했습니다. 수량을 확인해 주세요.');
  return {quantity:q,costUnit:frozen.costUnit,cost};
}
export function publicItemState(state) {
  const numeric=new Set(['version','quantity','saleUnitPrice','amount']);
  const pick=(row,keys)=>Object.fromEntries(keys.filter(k=>Object.hasOwn(row||{},k)&&(numeric.has(k)?typeof row[k]==='number'&&Number.isFinite(row[k])||k==='saleUnitPrice'&&row[k]===null:typeof row[k]==='string')).map(k=>[k,row[k]]));
  const valueKeys=['quantity','length','width','height'];
  const safeValues=raw=>Object.fromEntries(Object.entries(raw||{}).filter(([k,v])=>valueKeys.includes(k)&&typeof v==='number'&&Number.isFinite(v)));
  return {
    itemSelections:(state?.selections||[]).map(r=>({...pick(r,['id','versionId']),inputs:safeValues(r.inputs)})),
    itemRows:(state?.publicRows||[]).map(r=>({...pick(r,['id','versionId','templateId','version','name','trade','spec','unit','quantity','saleUnitPrice','amount']),
      inputs:(Array.isArray(r.inputs)?r.inputs:[]).filter(f=>valueKeys.includes(f.key)).map(f=>pick(f,['key','label','unit']))}))
  };
}
