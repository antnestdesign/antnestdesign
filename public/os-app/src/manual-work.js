export const MANUAL_WORK_TRADES = ['demolition','electrical','bathroom','wallpaper','film','flooring','carpentry','furniture','finish'];
export function normalizeManualWorks(value) {
  if (!Array.isArray(value) || value.length > 100) throw new Error('직접 공사는 100개까지 추가할 수 있습니다.');
  const ids = new Set();
  return value.map(row => {
    if (!row || typeof row !== 'object' || Array.isArray(row) || Object.keys(row).some(key => !['id','trade','name','amount','note','costAmount'].includes(key))) throw new Error('직접 공사 입력 형식을 확인해 주세요.');
    if (typeof row.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id) || ids.has(row.id.toLowerCase())) throw new Error('직접 공사 식별자가 중복되었거나 올바르지 않습니다.');
    ids.add(row.id.toLowerCase());
    if (!MANUAL_WORK_TRADES.includes(row.trade) || typeof row.name !== 'string' || !row.name.trim() || row.name.length > 100 || typeof row.note !== 'string' || row.note.length > 300) throw new Error('공정·공사명·비고를 확인해 주세요.');
    if (typeof row.amount !== 'number' || !Number.isSafeInteger(row.amount) || row.amount < 0 || row.amount > 1e9) throw new Error('판매금액을 원 단위 숫자로 입력해 주세요.');
    if (row.costAmount != null && (typeof row.costAmount !== 'number' || !Number.isSafeInteger(row.costAmount) || row.costAmount < 0 || row.costAmount > 1e9)) throw new Error('내부 원가는 원 단위 숫자로 입력하거나 비워 주세요.');
    return {...publicManualWork(row),...(Object.hasOwn(row,'costAmount')?{costAmount:row.costAmount}: {})};
  });
}
export const publicManualWork = row => ({id:row.id.toLowerCase(),trade:row.trade,name:row.name.trim(),amount:row.amount,note:row.note.trim()});
export const manualWorkAmount = amount => Math.floor(amount / 1000) * 1000;
export const manualWorkName = row => row.note ? `${row.name} (${row.note})` : row.name;
