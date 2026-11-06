export const expressionKind = node => Object.hasOwn(node,'value') ? 'number' : Object.hasOwn(node,'variable') ? 'variable' : node.operator;
export const expressionModes = {
  number:'숫자 직접 입력', variable:'연결된 기준값',
  add:'합계 구하기 (+)', subtract:'차감하기 (−)', multiply:'곱해서 계산 (×)', divide:'나누어 계산 (÷)',
  ceil:'소수점 올림', floor:'소수점 내림', round:'소수점 반올림',
  min:'두 값 중 작은 값', max:'두 값 중 큰 값', if:'조건에 따라 다르게 계산',
  gt:'기준값 초과인지 확인 (>)', gte:'기준값 이상인지 확인 (≥)',
};
export function expressionVariables(rule) {
  return Object.fromEntries(Object.entries(rule.variables).map(([key,label])=>[key,key==='count' ? rule.key==='tile.masonry' ? '조적칸막이 개소' : /^tile\./.test(rule.key) ? '욕실 칸 수' : '공사 개소' : key==='waste' ? '자재 소요 비율(여유분 포함)' : label]));
}
export function expressionRole(node,index,rule) {
  const kind=expressionKind(node);
  const roles={add:['합산할 첫 번째 값','합산할 두 번째 값'],subtract:['기준 수량','차감할 수량'],multiply:['곱할 첫 번째 값','곱할 두 번째 값'],divide:['나눌 전체 수량','나누는 기준'],ceil:['올림할 계산값'],floor:['내림할 계산값'],round:['반올림할 계산값'],min:['비교할 첫 번째 값','비교할 두 번째 값'],max:['비교할 첫 번째 값','비교할 두 번째 값'],if:['판단 조건','조건에 맞을 때 결과','조건에 맞지 않을 때 결과'],gt:['비교할 값','초과 기준값'],gte:['비교할 값','이상 기준값']};
  if(kind==='multiply'&&node.args.some(child=>child.variable==='count')){
    if(node.args[index].variable==='count')return expressionVariables(rule).count;
    return `${rule.key==='tile.masonry'?'조적칸막이 1개소':/^tile\./.test(rule.key)?'욕실 1칸':'공사 1개소'}당 투입량 (${rule.unit})`;
  }
  return roles[kind]?.[index] || `계산값 ${index+1}`;
}
export function expressionHelp(kind) {
  return {number:'고정된 수치',variable:'공사 수량·실측·자재 기준에 연결',add:'첫 번째 값 + 두 번째 값',subtract:'기준 수량 − 차감할 수량',multiply:'첫 번째 값 × 두 번째 값',divide:'전체 수량 ÷ 나누는 기준',ceil:'소수점이 남으면 위쪽 정수로 올림',floor:'소수점이 남으면 아래쪽 정수로 내림',round:'가장 가까운 정수로 반올림',min:'두 계산값 중 작은 값 적용',max:'두 계산값 중 큰 값 적용',if:'판단 조건이 0이 아니면 맞을 때 결과, 0이면 맞지 않을 때 결과',gt:'기준값보다 크면 1, 아니면 0',gte:'기준값과 같거나 크면 1, 아니면 0'}[kind] || '';
}
export function changeExpressionKind(node,kind,rule) {
  const old=expressionKind(node);
  if(old===kind)return structuredClone(node);
  if(!Object.hasOwn(expressionModes,kind))throw Error('지원하지 않는 계산 방식입니다.');
  if(kind==='number')return {value:0};
  if(kind==='variable'){const key=Object.keys(rule.variables)[0];if(!key)throw Error('연결할 수 있는 기준값이 없습니다.');return {variable:key};}
  if(['ceil','floor','round'].includes(kind))return {operator:kind,args:[structuredClone(['ceil','floor','round'].includes(old)?node.args[0]:node)]};
  if(kind==='if')return {operator:kind,args:[{value:1},structuredClone(node),{value:0}]};
  if(old==='if')return {operator:kind,args:[structuredClone(node),{value:1}]};
  const children=node.args?.map(child=>structuredClone(child)) || [structuredClone(node)];
  return {operator:kind,args:[children[0],children[1]||{value:1}]};
}
export function referencedExpressionValues(node,rule) {
  const keys=new Set();
  function collect(value){if(value.variable)keys.add(value.variable);for(const child of value.args||[])collect(child);}
  collect(node);const labels=expressionVariables(rule);return [...keys].map(key=>labels[key]);
}
