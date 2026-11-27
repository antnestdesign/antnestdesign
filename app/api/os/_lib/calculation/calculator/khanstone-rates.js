import { KHANSTONE_PRODUCTS } from "../../../../../../public/os-app/src/khanstone-products.js";

const costForArea700000Mm2 = Object.fromEntries([
  [["snowfield","denver","luna-white","ash-concrete","luna-shadow"], { "12": 320000, "20": 350000 }],
  [["eden","eden-gray","patagonia","cremosa"], { "12": 400000, "20": 450000 }],
  [["cristallo","matterhorn","boa-vista"], { "12": 450000, "20": 500000 }],
].flatMap(([skus, prices]) => skus.map(sku => [sku, prices])));

export function khanstonePrice(product, thickness) {
  return Object.hasOwn(costForArea700000Mm2, product) ? costForArea700000Mm2[product][thickness] : undefined;
}

export function countertopProductLabel(material, baseLabel, product) {
  return material === "khanstone" && Object.hasOwn(KHANSTONE_PRODUCTS, product)
    ? `${baseLabel} ${KHANSTONE_PRODUCTS[product]}`
    : baseLabel;
}
