import { COST_ITEM_DEFINITIONS } from "../../../../../public/os-app/src/cost-item-definitions.js";
import { policyRule } from './preliminary-policy.js';

const plain = value => value && typeof value === "object" && !Array.isArray(value);
export class SiteCostValidationError extends Error {}
export function parseSiteCostConfig(text = "") {
  if (!text) return { version: 1, rows: {} };
  let config;
  try { config = JSON.parse(text); } catch { throw new Error("현장 원가 설정 형식을 확인해 주세요."); }
  if (!plain(config) || config.version !== 1 || !plain(config.rows) || Object.keys(config).some(k => !["version", "rows"].includes(k)) || Object.keys(config.rows).length > 300) throw new Error("현장 원가 설정 형식을 확인해 주세요.");
  for (const [key, row] of Object.entries(config.rows)) {
    if (!key || key.length > 240 || ["__proto__", "constructor", "prototype"].includes(key) || !plain(row) || Object.keys(row).some(k => !["quantity", "price", "basis"].includes(k))) throw new Error("현장 원가 항목을 확인해 주세요.");
    for (const field of ["quantity", "price"]) if (row[field] !== undefined && (typeof row[field] !== "number" || !Number.isFinite(row[field]) || row[field] < 0 || row[field] > (field === "price" ? 1e9 : 1e6))) throw new Error("현장 수량·단가의 허용 범위를 확인해 주세요.");
    if (row.basis !== undefined && (typeof row.basis !== "string" || row.basis.length > 2000)) throw new Error("수동 수량의 산출 기준을 확인해 주세요.");
    if (row.quantity !== undefined && !row.basis) throw new Error("수동 수량의 산출 기준이 필요합니다.");
  }
  return config;
}

export function carpentryAssemblies(state, prices, policy=null) {
  if (state.carpentryCostMode !== "assembly-v1" || !state.carpentryCurtainBoxEnabled) return [];
  const p = (code, fallback) => {
    const value = prices?.[code];
    if (value && Number.isFinite(value.price) && value.price >= 0) return { price: value.price, source: value.source, standardPrice: value.standardPrice };
    return { price: fallback ?? null, source: fallback === undefined ? "미등록" : "승인된 기본값", standardPrice: value?.standardPrice ?? null };
  };
  const works = [
    ["coffer", state.carpentryCofferType === "new" ? "우물천장 신설" : "우물천장 평탄화", ["new", "change"].includes(state.carpentryCofferType) ? state.carpentryCofferUnits : 0, [["WOOD_LABOR_WORKER", 2], ["WOOD_MACHINE_DAY", 2], ["WOOD_DRYWALL_SHEET", 10], ["WOOD_STUD_BUNDLE", 4], ["WOOD_MDF_SHEET", 4]]],
    ["curtain", "커튼박스", state.carpentryCurtainBoxUnits, [["WOOD_LABOR_WORKER", 1], ["WOOD_MACHINE_DAY", 1], ["WOOD_STUD_BUNDLE", .5], ["WOOD_PLYWOOD_SHEET", 1]]],
    ["drop", "에어컨 단내림", state.carpentryDropCeilingUnits, [["WOOD_LABOR_WORKER", .5], ["WOOD_MACHINE_DAY", .5], ["WOOD_STUD_BUNDLE", .5], ["WOOD_DRYWALL_SHEET", 3]]],
    ["fan", "실링팬 보강 설치(자재 별도)", state.carpentryCeilingFanUnits, [["FAN_INSTALL_APPROVED", 1]]],
  ];
  return works.filter(([, , count]) => count > 0).flatMap(([work, label, count, parts]) => parts.map(([code, per]) => {
    const def = COST_ITEM_DEFINITIONS.find(d => d.itemCode === code);
    const info = code === "FAN_INSTALL_APPROVED" ? { price: policy?.prices.FAN_INSTALL_APPROVED ?? 100000, source: "승인된 설치 기준 · 보강 자재 별도", standardPrice: null } : p(code, code === "WOOD_DRYWALL_SHEET" ? policy?.prices.DRYWALL_FALLBACK ?? 3500 : undefined);
    const name = code === "FAN_INSTALL_APPROVED" ? "설치비" : code === "WOOD_LABOR_WORKER" ? "목수 인건비" : code === "WOOD_MACHINE_DAY" ? "목수 장비비" : def.itemName.replace(/ 1장$| 1묶음$/, "");
    const quantity=work==='fan'?per*count:policyRule(policy,`bom.${work}.${code}`,{count},()=>per*count);
    return { key: `assembly:${work}:${code}`, work, workLabel: label, count, code, name, unit: code === "WOOD_STUD_BUNDLE" ? "단" : code === "FAN_INSTALL_APPROVED" ? "개소" : def.unit, quantity, formula: policy&&work!=='fan'?`${count}개소 · 게시된 투입량 산식`:`${per}${code === "WOOD_STUD_BUNDLE" ? "단(기존 DB 묶음 기준)" : def?.unit || "개소"}/개소 × ${count}개소`, ...info };
  }));
}

export function describeSiteRows(details) {
  return details.filter(d => d.group !== "adjustment").map(d => {
    const part = d.assembly;
    const baseQuantity = d.siteBaseQuantity ?? part?.quantity ?? (d.unitPrice > 0 ? d.cost / d.unitPrice : 0);
    const basePrice = d.siteBasePrice !== undefined ? d.siteBasePrice : part ? part.price : d.unitPrice;
    const aliases = { "목공 간접조명(T3)": "LIGHT_T3_CABINET", "목공 인건비": "WOOD_LABOR_WORKER", "목공 기계품": "WOOD_MACHINE_DAY", MDF: "WOOD_MDF_SHEET", "합판": "WOOD_PLYWOOD_SHEET", "다루끼": "WOOD_STUD_BUNDLE" };
    const definition = part ? COST_ITEM_DEFINITIONS.find(i => i.itemCode === part.code) : COST_ITEM_DEFINITIONS.find(i => i.itemName === d.item || i.itemCode === aliases[d.item]);
    const unit = part?.unit || (/^[\d.,]+(평|㎡|품|일|개소|개|장|자|m|롤|묶음|식|통|라인|세트|칸)$/.exec(d.quantity)?.[1]) || "산출량";
    const key = part?.key || `detail:${d.group}:${d.item}`;
    const basis = JSON.stringify([part?.count ?? null, d.input, baseQuantity]);
    return { key, group: d.group, work: part?.work || d.group, workLabel: part?.workLabel || "기존 산출 내역", name: part?.name || d.item, code: definition?.itemCode || "", unit,
      baseQuantity, basePrice, quantity: d.siteQuantity ?? baseQuantity, price: d.sitePrice ?? basePrice,
      basis, formula: part?.formula || d.input, source: part?.source || "기존 적용 원가", standardPrice: part?.standardPrice ?? null,
      amount: d.cost, sale: d.customerRevenue, manualQuantity: d.siteQuantity !== undefined, manualPrice: d.sitePrice !== undefined,
      stale: Boolean(d.siteStale), missing: part?.price == null && d.sitePrice === undefined && baseQuantity > 0,
      adjustable: d.item !== "기존 배관 청소" && Boolean(part || d.unitPrice > 0), kind: part?.code === "WOOD_LABOR_WORKER" || /인건비|기공|조공/.test(d.item) ? "labor" : part?.code === "WOOD_MACHINE_DAY" || /기계품/.test(d.item) ? "equipment" : "material" };
  });
}

export function applySiteCostOverrides(details, state, makeDetail) {
  const config = parseSiteCostConfig(state.siteCostConfig);
  const rows = describeSiteRows(details);
  for (const row of rows.filter(r=>r.code === "WOOD_LABOR_WORKER")) {
    const peer = rows.find(r=>r.work===row.work&&r.code==="WOOD_MACHINE_DAY");
    if (!peer) continue;
    const a=config.rows[row.key],b=config.rows[peer.key];
    if(a?.quantity!==undefined&&b?.quantity!==undefined&&a.quantity!==b.quantity)throw new SiteCostValidationError("목수 인건비와 장비비는 동일한 품수를 적용해야 합니다.");
    const selected=a?.quantity!==undefined?a:b?.quantity!==undefined?b:null;
    if(selected){config.rows[row.key]={...a,quantity:selected.quantity,basis:selected.basis};config.rows[peer.key]={...b,quantity:selected.quantity,basis:selected.basis};}
  }
  for (let index = 0; index < details.length; index++) {
    const d = details[index], row = rows.find(r => r.key === (d.assembly?.key || `detail:${d.group}:${d.item}`));
    const override = row && config.rows[row.key];
    if (!override || !row.adjustable) continue;
    const quantity = override.quantity ?? row.baseQuantity, price = override.price ?? row.basePrice;
    if (price == null) {
      details[index] = { ...d, siteBaseQuantity: row.baseQuantity, siteBasePrice: row.basePrice,
        ...(override.quantity !== undefined ? { siteQuantity: quantity, siteStale: override.basis !== row.basis } : {}) };
      continue;
    }
    if (!Number.isFinite(quantity*price) || quantity*price>1e12) throw new SiteCostValidationError("현장 원가가 허용 범위를 벗어났습니다.");
    const result = makeDetail({ ...d, unitPrice: price, quantity: `${quantity}${row.unit}`, margin: state.targetMargin, cost: quantity * price,
      ...(d.item === "기존 배관 청소" ? { customerRevenue: d.customerRevenue } : {}) });
    details[index] = { ...d, ...result, siteBaseQuantity: row.baseQuantity, siteBasePrice: row.basePrice, ...(override.quantity !== undefined ? { siteQuantity: quantity, siteStale: override.basis !== row.basis } : {}), ...(override.price !== undefined ? { sitePrice: price } : {}) };
  }
}
