import { supabaseFetch } from "./server";
import { calculateFlooring } from "./calculation/flooring.js";
import { flooringZones } from "../../../../public/os-app/src/flooring-inputs.js";

export const FLOORING_PUBLIC_FIELDS = "sku,brand,product_group,short_name,width_mm,length_mm,thickness_mm,pack_m2,billing_unit,supplier_pyeong_m2,loss_percent";
export const FLOORING_ADMIN_FIELDS = FLOORING_PUBLIC_FIELDS + ",official_name,source_version,source_notes,supply_cost,active,revision";
const table = "/rest/v1/os_flooring_products";

export function listFlooringProducts(admin) {
  return supabaseFetch(`${table}?select=${admin ? FLOORING_ADMIN_FIELDS : FLOORING_PUBLIC_FIELDS}&order=brand.asc,short_name.asc,sku.asc${admin ? "" : "&active=eq.true"}`);
}

export async function resolveFlooring(inputs, saved = []) {
  // Only trust SKU prices fetched here or stored by a previous server-side calculation.
  const zones = flooringZones(inputs);
  if (!zones) return { rows: null, snapshot: saved, summary: [] };
  const skus = new Set(zones.map(zone => zone.sku));
  const old = saved.filter(product => skus.has(product.sku));
  const pinned = new Set(old.map(product => product.sku));
  const missing = [...skus].filter(sku => !pinned.has(sku));
  const current = missing.length
    ? await supabaseFetch(`${table}?select=${FLOORING_ADMIN_FIELDS}&active=eq.true&sku=in.(${missing.join(",")})`)
    : [];
  const snapshot = [...old, ...current];
  const rows = calculateFlooring(zones, snapshot);
  return { rows, snapshot, summary: rows.map(row => row.summary) };
}

export function publicFlooringSummary(value) {
  return (Array.isArray(value) ? value : []).map(row => ({
    sku: String(row.sku), brand: String(row.brand), label: String(row.label),
    packM2: row.packM2 == null ? null : Number(row.packM2), unit: String(row.unit), quantity: String(row.quantity),
    loss: Number(row.loss), defaultLoss: Number(row.defaultLoss), supplierBasis: row.supplierBasis ?? null,
    zones: (row.zones || []).map(String), customerRevenue: Number(row.customerRevenue),
  }));
}
