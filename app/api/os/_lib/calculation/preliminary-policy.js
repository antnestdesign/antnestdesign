import { COST_ITEM_DEFINITIONS } from '../../../../../public/os-app/src/cost-item-definitions.js';
import { ESTIMATE_INPUT_SCHEMA } from './estimate-inputs.js';

export class PreliminaryPolicyError extends Error {}
const number = value => ({ value });
const variable = name => ({ variable: name });
const op = (operator, ...args) => ({ operator, args });
const trade = category => ({전기:'전기·조명',조명:'전기·조명',욕실:'욕실·타일',타일:'욕실·타일','타일·욕실':'욕실·타일',상판:'가구',인허가:'철거',마감:'마감·기타'}[category] || category);
export const EXTRA_PRICES = [
  ['BASIC_DEMOLITION_NORMAL','철거','기본철거 일반','평',80000,'work.basicNormal'],
  ['BASIC_DEMOLITION_SPECIAL','철거','기본철거 특수','평',120000,'work.basicSpecial'],
  ['OUTLET_MOVE','전기·조명','콘센트 위치 이동','개',150000,'work.outletMove'],
  ['SWITCH_MOVE','전기·조명','스위치 위치 이동','개',150000,'work.switchMove'],
  ['MOLDING_MATERIAL','목공','천장몰딩 자재','m',1800,'work.moldingMaterial'],
  ['BASEBOARD_MATERIAL','목공','걸레받이 자재','m',2100,'work.baseboardMaterial'],
  ['FILM_WOOD','필름','필름 자재(AND 표준 우드)','롤',300000,'rates.finishMaterial.filmWood'],
  ['MIDDLE_DOOR','목공','중문','세트',1300000,'rates.door.middleDoor'],
  ['STANDARD_DOOR','목공','일반도어','개',450000,'rates.door.standardDoor'],
  ['SLIDING_DOOR','목공','슬라이딩도어','개',500000,'rates.door.slidingDoor'],
  ['GENERAL_WASTE','마감·기타','일반 폐기물','식',650000,'rates.misc.generalWaste'],
  ['INTERIOR_PROTECTION','마감·기타','세대 내 보양비','식',500000,'rates.misc.interiorProtection'],
  ['MOVE_IN_CLEANING','마감·기타','입주청소','식',500000,'rates.misc.moveInCleaning'],
  ['FAN_INSTALL_APPROVED','목공','실링팬 보강 설치(자재 별도)','개소',100000,''],
  ['DRYWALL_FALLBACK','목공','석고보드 DB 미등록 시 기본값','장',3500,''],
  ['BATH_PREMIUM_EXTRA','욕실·타일','고급 도기·수전 세트 추가금','칸',700000,''],
  ['BATH_MASONRY_LABOR','욕실·타일','조적칸막이 타일 기공 추가','품',350000,''],
  ['DEMO_VINYL','철거','장판 철거','평',0,''],
].map(([key,trade,label,unit,value,path])=>({key,trade,label,unit,value,path}));

export const PARAMETERS = [
  ['homebarBaseJa','가구','홈바장 기본 제작 길이','자',3,'rates.homebarStorageBaseJa'],
  ['wallpaperRollArea','도배','도배지 1롤 시공면적','㎡',15,'rates.finishMaterial.wallpaperRollArea'],
  ['finishHeight','도배','도배·필름 계산 높이','mm',2400,'rates.finishMaterial.ceilingHeightMm'],
  ['finishWaste','도배','도배·필름 자재 소요 배수','배',1.15,'rates.finishMaterial.wasteFactor'],
  ['filmRollArea','필름','필름 1롤 시공면적','㎡',27.5,'rates.finishMaterial.filmRollArea'],
  ['cofferLegacyNew','목공','기존 우물천장 신설 품수','품',2,'rates.carpentry.cofferNewDays'],
  ['cofferLegacyChange','목공','기존 우물천장 변경 품수','품',1.5,'rates.carpentry.cofferChangeDays'],
  ['curtainLegacyDays','목공','기존 커튼박스 2개소 품수','품',1,'rates.carpentry.curtainBoxDaysPerTwo'],
  ['artwallDays','목공','목공벽·가벽 1m 품수','품',.3,'rates.carpentry.artwallDaysPerM'],
  ['hiddenDoorDays','목공','히든도어 1개소 품수','품',1,'rates.carpentry.hiddenDoorDays'],
  ['lineLightDays','목공','천장 라인조명 1m 품수','품',.1,'rates.carpentry.lineLightDaysPerM'],
  ['indirectLegacyDays','목공','과거 간접등 1개소 품수','품',.1,'rates.carpentry.indirectLightDays'],
  ['dropLegacyDays','목공','기존 단내림 1개소 품수','품',.5,'rates.carpentry.dropCeilingDays'],
  ['moldingDays','목공','천장몰딩 기본 품수','품',2,'rates.carpentry.moldingDays'],
  ['baseboardDays','목공','걸레받이 기본 품수','품',1,'rates.carpentry.baseboardDays'],
  ['boardWidth','목공','보드 가로','mm',2400,'rates.carpentry.boardWidth'],
  ['boardHeight','목공','보드 세로','mm',1200,'rates.carpentry.boardHeight'],
  ['studSpacing','목공','다루끼 간격','mm',450,'rates.carpentry.studSpacing'],
  ['studLength','목공','다루끼 1개 길이','mm',3600,'rates.carpentry.studPieceLength'],
  ['studBundleCount','목공','다루끼 1단 구성 개수','개',12,'rates.carpentry.studPiecesPerBundle'],
  ['woodWaste','목공','목공 자재 소요 배수','배',1.15,'rates.carpentry.wasteFactor'],
  ['fixtureValueMultiplier','욕실·타일','실속 도기·수전 기본세트 배수','배',.75,''],
  ['counterMinimumM','가구','하이막스 최소 청구 길이','m',1,''],
  ['islandWideThreshold','가구','아일랜드 상판 폭 추가 기준','mm',720,''],
  ['islandWideMultiplier','가구','넓은 하이막스 상판 배수','배',2,''],
  ['islandSideThreshold','가구','아일랜드 측면 길이 구분 기준','mm',3000,''],
  ['islandLongSideM','가구','긴 아일랜드 측면 계산 길이','m',.9,''],
  ['partitionSides','목공','가벽 시공 면수','면',2,''],
  ['tvPlywood','목공','TV 1개소 합판','장',2,''],
].map(([key,trade,label,unit,value,path])=>({key,trade,label,unit,value,path}));

const rules=[];
function rule(key,trade,label,unit,formula,variables={}) { rules.push({key,trade,label,unit,formula,variables}); }
for(const[preset,basic,base]of[['p20',5,6],['p30',6,7],['p40',9,11],['p50',11,15]]){
  const label={p20:'20평대',p30:'30평대',p40:'40평대',p50:'50평 이상'}[preset];
  rule(`wallpaper.${preset}.basic`,'도배',`${label} 기본 품수`,'품',number(basic));
  rule(`wallpaper.${preset}.base`,'도배',`${label} 초배 포함 품수`,'품',number(base));
}
for(const[preset,days]of[['p20',6],['p30',9],['p40',12],['p50',15]])rule(`film.${preset}`,'필름',`${{p20:'20평대',p30:'30평대',p40:'40평대',p50:'50평 이상'}[preset]} 품수`,'품',number(days));
for(const[key,label,multiplier]of[['worker','욕실 타일 기공',3],['helper','욕실 타일 조공',1],['masonry','조적벽 타일 기공 추가',1]])rule(`tile.${key}`,'욕실·타일',label,'품',op('multiply',variable('count'),number(multiplier)),{count:'욕실 또는 조적 개소'});
rule('wallpaper.area','도배','벽·천장 자재 소요면적','㎡',op('multiply',op('add',op('divide',op('multiply',variable('lengthMm'),variable('heightMm')),number(1000000)),variable('ceilingArea')),variable('waste')),{lengthMm:'벽 길이(mm)',heightMm:'계산 높이(mm)',ceilingArea:'해당 천장면적(㎡)',waste:'소요 배수'});
rule('wallpaper.rolls','도배','도배지 롤 수량','롤',op('ceil',op('divide',variable('area'),variable('rollArea'))),{area:'소요면적(㎡)',rollArea:'1롤 면적(㎡)'});
rule('film.area','필름','필름 자재 소요면적','㎡',op('multiply',op('divide',op('multiply',variable('lengthMm'),variable('heightMm')),number(1000000)),variable('waste')),{lengthMm:'시공 길이(mm)',heightMm:'계산 높이(mm)',waste:'소요 배수'});
rule('film.rolls','필름','필름 롤 수량','롤',op('ceil',op('divide',variable('area'),variable('rollArea'))),{area:'소요면적(㎡)',rollArea:'1롤 면적(㎡)'});
rule('furniture.ja','가구','가구 길이 자 환산','자',op('ceil',op('divide',variable('lengthMm'),number(300))),{lengthMm:'가구 길이(mm)'});
rule('carpentry.t3','목공','간접등(T3) 길이 환산','라인',op('divide',variable('lengthMm'),number(1000)),{lengthMm:'T3 길이(mm)'});
rule('carpentry.laborRound','목공','기존 목공 합산 품수 올림','품',op('ceil',variable('rawDays')),{rawDays:'공사별 합산 품수'});
rule('carpentry.boardWaste','목공','목공 보드 소요량','장',op('ceil',op('multiply',variable('quantity'),variable('waste'))),{quantity:'기본 산출 장수',waste:'소요 배수'});
rule('carpentry.wallBoards','목공','벽 면적당 보드 장수','장',op('ceil',op('divide',variable('area'),variable('boardArea'))),{area:'벽 면적(㎟)',boardArea:'보드 1장 면적(㎟)'});
rule('carpentry.verticalStuds','목공','세로 다루끼 개수','개',op('ceil',op('divide',variable('lengthMm'),variable('spacingMm'))),{lengthMm:'벽 길이(mm)',spacingMm:'다루끼 간격(mm)'});
rule('carpentry.studBundles','목공','다루끼 단 수량','단',op('ceil',op('divide',op('multiply',variable('lengthMm'),variable('waste')),variable('bundleLength'))),{lengthMm:'필요 총 길이(mm)',waste:'소요 배수',bundleLength:'1단 총 길이(mm)'});
for(const[work,label,parts]of[
  ['coffer','우물천장 신설·평탄화',[['WOOD_LABOR_WORKER','목수',2],['WOOD_MACHINE_DAY','장비',2],['WOOD_DRYWALL_SHEET','석고보드',10],['WOOD_STUD_BUNDLE','다루끼',4],['WOOD_MDF_SHEET','MDF',4]]],
  ['curtain','커튼박스',[['WOOD_LABOR_WORKER','목수',1],['WOOD_MACHINE_DAY','장비',1],['WOOD_STUD_BUNDLE','다루끼',.5],['WOOD_PLYWOOD_SHEET','합판',1]]],
  ['drop','에어컨 단내림',[['WOOD_LABOR_WORKER','목수',.5],['WOOD_MACHINE_DAY','장비',.5],['WOOD_STUD_BUNDLE','다루끼',.5],['WOOD_DRYWALL_SHEET','석고보드',3]]],
])for(const[code,name,per]of parts)rule(`bom.${work}.${code}`,'목공',`${label} · ${name} 투입량`,/LABOR|MACHINE/.test(code)?'품':/BUNDLE/.test(code)?'단':'장',op('multiply',variable('count'),number(per)),{count:'공사 개소'});
export const RULES=rules;
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const policyRuleChanged=(policy,key)=>Boolean(policy&&JSON.stringify(canonical(policy.rules[key]))!==JSON.stringify(canonical(RULES.find(r=>r.key===key)?.formula)));
export const OPERATORS={add:'더하기',subtract:'빼기',multiply:'곱하기',divide:'나누기',ceil:'올림',floor:'내림',round:'반올림',min:'작은 값',max:'큰 값',if:'조건 선택',gt:'초과',gte:'이상'};
const unary=new Set(['ceil','floor','round']);
const fields=new Map([...COST_ITEM_DEFINITIONS.map(d=>[d.itemCode,{key:d.itemCode,label:d.itemName,trade:trade(d.category),unit:d.unit,inputId:d.inputId,source:'기존 원가 DB'}]),...EXTRA_PRICES.map(p=>[p.key,{...p,source:'가견적 추가 기준'}])]);
const positiveParameters=new Set(['wallpaperRollArea','filmRollArea','boardWidth','boardHeight','studSpacing','studLength','studBundleCount']);
export function policyCatalog() { return {prices:[...fields.values()].map(f=>({...f,...(f.key==='LIGHT_T3_CABINET'?{alsoTrades:['목공']}: {})})),parameters:PARAMETERS.map(p=>({...p,...(['finishHeight','finishWaste'].includes(p.key)?{alsoTrades:['필름']}: {})})),rules:RULES,operators:OPERATORS}; }
export function defaultPolicy(rateDefaults={},masters=[]) {
  const byCode=new Map(masters.map(m=>[m.item_code,m]));
  const prices=Object.fromEntries([...fields].map(([key,f])=>[key,byCode.has(key)?Number(byCode.get(key).cost_price):f.inputId?rateDefaults[f.inputId]??null:f.value]));
  prices.BATH_MASONRY_LABOR=prices.TILE_LABOR_WORKER;
  return {schema:1,prices,parameters:Object.fromEntries(PARAMETERS.map(p=>[p.key,p.value])),rules:Object.fromEntries(RULES.map(r=>[r.key,structuredClone(r.formula)]))};
}
function fail(message) { throw new PreliminaryPolicyError(message); }
export function validateExpression(node,allowed,depth=0,budget={count:0}) {
  if(++budget.count>128||depth>12||!node||typeof node!=='object'||Array.isArray(node))fail('산식의 크기 또는 형식이 올바르지 않습니다.');
  const keys=Object.keys(node);
  if(keys.length===1&&keys[0]==='value'){if(typeof node.value!=='number'||!Number.isFinite(node.value)||Math.abs(node.value)>1e9)fail('산식의 수치 범위를 확인해 주세요.');return;}
  if(keys.length===1&&keys[0]==='variable'){if(!allowed.has(node.variable))fail('허용되지 않은 산식 입력값입니다.');return;}
  if(keys.length!==2||!keys.includes('operator')||!keys.includes('args')||!Object.hasOwn(OPERATORS,node.operator)||!Array.isArray(node.args)||node.args.length!==(unary.has(node.operator)?1:node.operator==='if'?3:2))fail('산식의 연산 구성을 확인해 주세요.');
  for(const child of node.args)validateExpression(child,allowed,depth+1,budget);
}
export function evaluateExpression(node,vars) {
  let result;
  if(Object.hasOwn(node,'value'))result=node.value;
  else if(Object.hasOwn(node,'variable'))result=vars[node.variable];
  else if(node.operator==='if')result=evaluateExpression(node.args[0],vars)?evaluateExpression(node.args[1],vars):evaluateExpression(node.args[2],vars);
  else {const a=node.args.map(c=>evaluateExpression(c,vars));switch(node.operator){case'add':result=a[0]+a[1];break;case'subtract':result=a[0]-a[1];break;case'multiply':result=a[0]*a[1];break;case'divide':if(a[1]===0)fail('산식에서 0으로 나눌 수 없습니다.');result=a[0]/a[1];break;case'ceil':result=Math.ceil(a[0]);break;case'floor':result=Math.floor(a[0]);break;case'round':result=Math.round(a[0]);break;case'min':result=Math.min(...a);break;case'max':result=Math.max(...a);break;case'gt':result=Number(a[0]>a[1]);break;case'gte':result=Number(a[0]>=a[1]);break;default:fail('지원하지 않는 연산입니다.');}}
  if(typeof result!=='number'||!Number.isFinite(result)||Math.abs(result)>1e12)fail('산식 결과가 허용 범위를 벗어났습니다.');
  return result;
}
export function validatePolicy(config) {
  if(!config||config.schema!==1||Object.keys(config).sort().join(',')!=='parameters,prices,rules,schema'||JSON.stringify(config).length>150000)fail('산정 기준 형식을 확인해 주세요.');
  for(const[key,list]of[['prices',[...fields.keys()]],['parameters',PARAMETERS.map(p=>p.key)],['rules',RULES.map(r=>r.key)]]){
    const value=config[key];if(!value||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...list].sort().join(','))fail('산정 기준 항목이 누락되었거나 추가되었습니다.');
  }
  for(const value of Object.values(config.prices))if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e9)fail('게시 기준의 단가를 입력해 주세요. 0원과 미등록은 구분합니다.');
  for(const p of PARAMETERS){const v=config.parameters[p.key];if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1e7||(positiveParameters.has(p.key)&&v<=0))fail(`${p.label}의 허용 범위를 확인해 주세요.`);}
  for(const r of RULES){validateExpression(config.rules[r.key],new Set(Object.keys(r.variables)));for(const sample of[0,1,30,10000]){const v=evaluateExpression(config.rules[r.key],Object.fromEntries(Object.keys(r.variables).map(k=>[k,/Area|Length|spacing|Height|height|roll/.test(k)?Math.max(1,sample):sample])));if(v<0)fail(`${r.label}의 수량은 음수일 수 없습니다.`);}}
  // Equipment and worker quantities must have the same rule, not just the same sample result.
  for(const work of['coffer','curtain','drop'])if(JSON.stringify(config.rules[`bom.${work}.WOOD_LABOR_WORKER`])!==JSON.stringify(config.rules[`bom.${work}.WOOD_MACHINE_DAY`]))fail('목수 인건비와 장비비는 동일한 품수 산식을 적용해야 합니다.');
  return config;
}
export function policyRule(policy,key,vars,fallback) {
  if(!policy)return fallback();
  const value=evaluateExpression(policy.rules[key],vars);
  if(value<0)fail('산정 수량은 음수일 수 없습니다.');
  return value;
}
export function applyPolicySettings(context,policy) {
  if(!policy)return;
  for(const field of[...EXTRA_PRICES,...PARAMETERS]){
    if(!field.path)continue;const value=Object.hasOwn(policy.prices,field.key)?policy.prices[field.key]:policy.parameters[field.key];
    if(value===null)fail(`${field.label} 단가가 미등록 상태입니다.`);
    const path=field.path.split('.'),last=path.pop();path.reduce((v,k)=>v[k],context)[last]=value;
  }
}
export function policyRateValues(policy) { return Object.fromEntries(COST_ITEM_DEFINITIONS.filter(d=>policy?.prices[d.itemCode]!==null).map(d=>[d.inputId,policy.prices[d.itemCode]])); }
export function policyScenario(inputs) {
  const output={};for(const[id,value]of Object.entries(inputs||{})){if(!Object.hasOwn(ESTIMATE_INPUT_SCHEMA,id))fail('시험 계산 입력을 확인해 주세요.');output[id]=value;}return output;
}
