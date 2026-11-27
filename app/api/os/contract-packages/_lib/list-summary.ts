type Row = Record<string, unknown>;
const fields = ["id", "estimate_id", "preliminary_project_id", "contract_no", "status", "package_version", "created_at", "updated_at"];
const infoFields = ["contract_no", "project_name", "site_address", "contract_date", "construction_type", "total_amount"];
const estimateFields = ["project_name", "customer_name", "customer_phone", "site_address", "total_price"];
const customerFields = ["name", "phone", "address"];
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[key]]));
const aliases = (prefix: string, path: string, keys: string[]) =>
  keys.map(key => `${prefix}_${key}:${path}${key.endsWith("_amount") || key === "total_price" ? "->" : "->>"}${key}`);
const fromAliases = (row: Row, prefix: string, keys: string[]) => Object.fromEntries(keys.map(key => [key, row[`${prefix}_${key}`]]));
const obj = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};

export const contractPackageListSelect = [
  ...fields,
  ...aliases("info", "contract_info", infoFields),
  ...aliases("estimate", "estimate_snapshot", estimateFields),
  ...aliases("customer", "parties_info->customer", customerFields),
].join(",");

export function contractPackageListRow(row: Row, compact = false): Row {
  return {
    ...pick(row, fields),
    contract_info: compact ? fromAliases(row, "info", infoFields) : pick(obj(row.contract_info), infoFields),
    estimate_snapshot: compact ? fromAliases(row, "estimate", estimateFields) : pick(obj(row.estimate_snapshot), estimateFields),
    parties_info: { customer: compact
      ? fromAliases(row, "customer", customerFields)
      : pick(obj(obj(row.parties_info).customer), customerFields) },
  };
}
