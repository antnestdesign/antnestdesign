import { STANDARD_ITEMS } from "../../../../../public/os-app/src/detailed-standard-items.js";
const basisFor = (unit: string) => unit === "평" || unit === "㎡" ? "floorArea" : unit === "m" ? "walls" : "manual";
export function standardCatalog(masters: Array<{code?: string; item_code?: string; costUnit?: number | null; cost_price?: number | null; unit?: string; is_active?: boolean}>, privileged = false) {
  return STANDARD_ITEMS.map(item => {
    const master = item.sourceCode ? masters.find(m => (m.code ?? m.item_code) === item.sourceCode && m.is_active !== false) : undefined;
    const cost = master ? (master.costUnit ?? master.cost_price) : undefined;
    const valid = cost != null && Number.isSafeInteger(Number(cost)) && Number(cost) >= 0;
    const sale = item.initialSale ?? (valid ? Math.round(Number(cost) / .75) : null);
    const unit = valid && master && typeof master.unit === "string" && master.unit.trim() ? master.unit : item.unit;
    return { ...item, unit, quantityBasis: item.quantityBasis === "manual" ? "manual" : basisFor(unit), masterCode: valid ? item.sourceCode : "", linked: Boolean(valid), saleUnitPrice: sale,
      ...(privileged ? { costUnit: valid ? Number(cost) : null } : {}) };
  });
}
