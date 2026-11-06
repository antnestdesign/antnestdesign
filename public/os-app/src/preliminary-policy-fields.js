const numberText = value => Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 8 });
const precise = value => Number(value.toFixed(8));
const parameterLabels = {
  fixtureValueMultiplier: ['실속형 도기·수전 세트 적용률', '%', 'percent'],
  finishWaste: ['도배·필름 자재 여유분', '%', 'allowance'],
  woodWaste: ['목공 자재 여유분', '%', 'allowance'],
  finishHeight: ['도배·필름 계산 높이', 'mm'],
  counterMinimumM: ['하이막스 상판 최소 청구 길이', 'mm', 'millimetres'],
  islandLongSideM: ['긴 아일랜드 측면 계산 길이', 'mm', 'millimetres'],
  islandWideMultiplier: ['넓은 하이막스 상판 적용률', '%', 'percent'],
  artwallDays: ['목공벽·가벽 1,000mm당 목수 작업량', '품'],
  lineLightDays: ['천장 라인조명 1,000mm당 목수 작업량', '품'],
  cofferLegacyNew: ['기존 견적 우물천장 신설 작업량', '품'],
  cofferLegacyChange: ['기존 견적 우물천장 변경 작업량', '품'],
  curtainLegacyDays: ['기존 견적 커튼박스 2개소당 작업량', '품'],
  indirectLegacyDays: ['기존 견적 간접등 1개소당 작업량', '품'],
  dropLegacyDays: ['기존 견적 단내림 1개소당 작업량', '품'],
  moldingDays: ['천장몰딩 기본 목수 작업량', '품'],
  baseboardDays: ['걸레받이 기본 목수 작업량', '품'],
  partitionSides: ['가벽 시공하는 면 수', '면'],
  tvPlywood: ['TV 1개소당 합판', '장'],
};

export function parameterField(parameter, config) {
  const [label = parameter.label, unit = parameter.unit, transform = 'identity'] = parameterLabels[parameter.key] || [];
  const value = config.parameters[parameter.key];
  let shown = transform === 'percent' ? precise(value * 100) : transform === 'allowance' ? precise((value - 1) * 100) : transform === 'millimetres' ? precise(value * 1000) : value;
  if (Object.is(shown, -0)) shown = 0;
  return { label, unit, transform, value: shown, min: transform === 'allowance' ? -100 : 0 };
}

export function parameterStoredValue(transform, value) {
  return transform === 'percent' ? value / 100 : transform === 'allowance' ? 1 + value / 100 : transform === 'millimetres' ? value / 1000 : value;
}

export function parameterBasis(key, config) {
  const value = config.parameters[key];
  if (key === 'fixtureValueMultiplier') {
    const base = config.prices.BATH_FIXTURE_SET;
    return `기본형 1칸 ${numberText(base)}원 × ${numberText(precise(value * 100))}% = 실속형 1칸 ${numberText(base * value)}원`;
  }
  if (key === 'finishWaste' || key === 'woodWaste') return `필요 자재량의 ${numberText(precise(value * 100))}% 반영`;
  if (key === 'islandWideMultiplier') return `상판 폭 ${numberText(config.parameters.islandWideThreshold)}mm 초과 시 적용`;
  if (/Legacy/.test(key)) return '기존 견적 기준 유지 항목';
  return '';
}

const tileLabels = {
  'tile.worker': ['욕실 1칸당 타일 기공', '욕실 칸 수'],
  'tile.helper': ['욕실 1칸당 타일 조공', '욕실 칸 수'],
  'tile.masonry': ['조적칸막이 1개소당 추가 타일 기공', '조적칸막이 개소'],
};
const works = { coffer: '우물천장 신설·평탄화', curtain: '커튼박스', drop: '에어컨 단내림' };
const parts = { WOOD_LABOR_WORKER: '목수', WOOD_MACHINE_DAY: '목수 장비', WOOD_DRYWALL_SHEET: '석고보드', WOOD_STUD_BUNDLE: '다루끼', WOOD_MDF_SHEET: 'MDF', WOOD_PLYWOOD_SHEET: '합판' };
const leaf = node => node && Object.keys(node).length === 1 && Number.isFinite(node.value);
const variable = (node, name) => node && Object.keys(node).length === 1 && node.variable === name;

export function ruleField(rule, node) {
  let label = rule.label;
  const bom = /^bom\.([^.]+)\.(.+)$/.exec(rule.key);
  if (rule.key.startsWith('film.')) label = rule.label.replace(/ 품수$/, ' 필름 작업 품수');
  if (leaf(node)) return { label: rule.variables.count ? `${rule.label} · 고정 총량` : label, unit: rule.unit, path: '', value: node.value, min: 0, ...(rule.variables.count ? { basis: '공사 개수와 무관한 고정 수량' } : {}) };
  if (node?.operator === 'multiply' && node.args?.length === 2) {
    const index = variable(node.args[0], 'count') && leaf(node.args[1]) ? 1 : variable(node.args[1], 'count') && leaf(node.args[0]) ? 0 : -1;
    if (index >= 0 && (tileLabels[rule.key] || bom)) return { label: tileLabels[rule.key]?.[0] || `${works[bom[1]]} 1개소당 ${parts[bom[2]]}`, unit: rule.unit, path: `args.${index}`, value: node.args[index].value, min: 0, basis: `${tileLabels[rule.key]?.[1] || '공사 개소'} × 1개당 투입량` };
  }
  if (['furniture.ja', 'carpentry.t3'].includes(rule.key)) {
    const rounded = node?.operator === 'ceil' && node.args?.length === 1;
    const division = rounded ? node.args[0] : node;
    if (division?.operator === 'divide' && division.args?.length === 2 && variable(division.args[0], 'lengthMm') && leaf(division.args[1]) && division.args[1].value > 0) {
      return { label: rule.key === 'furniture.ja' ? '가구 1자 환산 길이' : '간접등(T3) 1라인 길이', unit: 'mm', path: rounded ? 'args.0.args.1' : 'args.1', value: division.args[1].value, min: 0.000001, basis: rounded ? '필요 수량의 소수점 올림' : '입력 길이에 비례해 계산' };
    }
  }
  return { label, unit: rule.unit };
}

export function ruleFormulaText(node, rule, formatNumber = numberText) {
  if (leaf(node)) return formatNumber(node.value);
  if (node?.variable) return node.variable === 'count' ? tileLabels[rule.key]?.[1] || '공사 개소' : rule.variables[node.variable] || node.variable;
  const args = (node?.args || []).map(child => ruleFormulaText(child, rule, formatNumber));
  const signs = { add: '+', subtract: '−', multiply: '×', divide: '÷', gt: '>', gte: '≥' };
  if (signs[node?.operator]) return `(${args.join(` ${signs[node.operator]} `)})`;
  if (['ceil', 'floor', 'round'].includes(node?.operator)) return `${args[0]} · 소수점 ${{ ceil: '올림', floor: '내림', round: '반올림' }[node.operator]}`;
  if (node?.operator === 'if') return `${args[0]}일 때 ${args[1]}, 그 외 ${args[2]}`;
  return `${node?.operator === 'min' ? '작은 값' : '큰 값'}(${args.join(', ')})`;
}

const summaries = {
  'wallpaper.area': '벽면적과 천장면적에 자재 여유분 반영',
  'wallpaper.rolls': '필요 면적을 1롤 시공면적으로 나누어 계산 · 소수점 올림',
  'film.area': '시공 길이와 계산 높이에 자재 여유분 반영',
  'film.rolls': '필요 면적을 1롤 시공면적으로 나누어 계산 · 소수점 올림',
  'carpentry.laborRound': '공사별 목수 작업량 합산 · 소수점 올림',
  'carpentry.boardWaste': '보드 장수에 자재 여유분 반영 · 소수점 올림',
  'carpentry.wallBoards': '벽면적을 보드 1장 면적으로 나누어 계산 · 소수점 올림',
  'carpentry.verticalStuds': '벽 길이를 다루끼 간격으로 나누어 계산 · 소수점 올림',
  'carpentry.studBundles': '필요 총 길이에 여유분 반영 후 단 수량 계산 · 소수점 올림',
};
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
export function ruleDescription(rule, node) {
  return summaries[rule.key] && JSON.stringify(canonical(node)) === JSON.stringify(canonical(rule.formula)) ? summaries[rule.key] : ruleFormulaText(node,rule);
}
