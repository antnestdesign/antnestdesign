import { flooringProductLabel, FlooringInputError } from "../../../../../public/os-app/src/flooring-inputs.js";

const ceilDiv = (n, d) => (n + d - 1n) / d;
const quantities = { BOX: "박스", "2BOX": "묶음(2박스)", PYEONG: "평" };

// Integer arithmetic keeps an exact pack boundary from accidentally billing an extra unit.
export function calculateFlooring(zones, products) {
  const catalog = new Map(products.map(product => [product.sku, product]));
  const grouped = new Map();
  for (const zone of zones) {
    const product = catalog.get(zone.sku);
    if (!product) throw new FlooringInputError(`${zone.label} 제품이 판매 중이 아닙니다. 다른 제품을 선택해 주세요.`);
    const loss = Math.round(Number(zone.loss ?? product.loss_percent) * 100);
    const key = `${zone.sku}:${loss}`;
    const entry = grouped.get(key) || { product, loss, areaMilli: 0, zones: [] };
    entry.areaMilli += zone.areaMilli;
    entry.zones.push(zone.label);
    grouped.set(key, entry);
  }
  return [...grouped.values()].map(({ product, loss, areaMilli, zones: usedZones }) => {
    const unit = product.billing_unit;
    const basis = Number(unit === "PYEONG" ? product.supplier_pyeong_m2 : product.pack_m2);
    if (!Number.isFinite(basis) || basis <= 0 || !Object.hasOwn(quantities, unit)) throw new FlooringInputError("마루 과금 기준이 올바르지 않습니다.");
    const areaNumerator = BigInt(areaMilli) * 33058n * BigInt(10000 + loss);
    const divisor = BigInt(Math.round(basis * 10000)) * 10000000n;
    const needed = ceilDiv(areaNumerator, divisor);
    const units = Number(unit === "2BOX" ? ceilDiv(needed, 2n) : needed);
    const cost = units * Number(product.supply_cost);
    if (!Number.isSafeInteger(cost) || cost <= 0 || cost > 1e11) throw new FlooringInputError("마루 산출 금액이 허용 범위를 벗어났습니다.");
    const customerRevenue = Math.floor(cost * 130 / 100000) * 1000;
    const label = flooringProductLabel(product);
    const input = `${usedZones.join("·")} · ${areaMilli / 1000}평 · ${label}`;
    const quantity = `${units.toLocaleString("ko-KR")}${quantities[unit]}`;
    return {
      group: "flooring", item: `${product.brand} ${label}`, input, quantity, cost,
      unitPrice: Number(product.supply_cost), customerRevenue, fixedMarkup: 0.30,
      summary: { sku: product.sku, brand: product.brand, label, packM2: product.pack_m2 == null ? null : Number(product.pack_m2),
        unit, quantity, loss: loss / 100, defaultLoss: Number(product.loss_percent), supplierBasis: unit === "PYEONG" ? basis : null,
        zones: usedZones, customerRevenue },
    };
  });
}
