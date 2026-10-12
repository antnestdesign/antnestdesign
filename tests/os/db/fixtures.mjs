import { internalEstimate, estimateRow } from "../fixtures/estimates.js";

export const COST_ID = "40000000-0000-4000-8000-000000000002";
export const ESTIMATE_A = "10000000-0000-4000-8000-000000000011";
export const ESTIMATE_B = "10000000-0000-4000-8000-000000000012";
export const ESTIMATE_NEW = "10000000-0000-4000-8000-000000000013";
export const ACCOUNT_PASSWORD = "Synthetic-DB-only-731!";
export const ACCOUNTS = [
  ["admin-active", "admin", true, false], ["manager-active", "manager", true, false],
  ["staff-active", "staff", true, false], ["admin-inactive", "admin", false, false],
  ["staff-inactive", "staff", false, false], ["admin-must-change-password", "admin", true, true],
  ["manager-must-change-password", "manager", true, true], ["staff-must-change-password", "staff", true, true],
].map(([label, role, is_active, must_change_password]) => ({
  label, role, is_active, must_change_password, email: `db-2b-${label}@example.invalid`,
}));

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function estimatePayload(id = ESTIMATE_A) {
  const fixture = internalEstimate();
  fixture.id = id;
  fixture.projectName = `SYSTEM_DB_2B_${id === ESTIMATE_A ? "A" : "B"}`;
  // Nested injection verifies the view is whitelist-based, not top-level deletion.
  fixture.customerQuote.internalMemo = "SYNTHETIC_PRIVATE";
  fixture.customerQuote.groups[0].items[0].cost = 123456;
  return estimateRow(fixture);
}

export function seedSql() {
  const rows = [estimatePayload(ESTIMATE_A), estimatePayload(ESTIMATE_B)];
  return `${rows.map((row) => {
    const columns = Object.keys(row);
    const values = Object.values(row).map((value) => typeof value === "object" ? `${quote(JSON.stringify(value))}::jsonb` : quote(value));
    return `insert into public.estimates (${columns.join(",")}) values (${values.join(",")});`;
  }).join("\n")}
  insert into public.cost_items(id,category,item_code,item_name,unit,cost_price,default_margin_rate,is_active)
  values ('${COST_ID}','TEST','SYSTEM_DB_2B_COST','Synthetic cost','unit',100000,0.3,true);`;
}

export function profileSql(account, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid local fixture user UUID");
  return `insert into public.profiles(id,name,email,role,is_active,must_change_password)
    values (${quote(id)},'Synthetic user',${quote(account.email)},${quote(account.role)},${account.is_active},${account.must_change_password})
    on conflict(id) do update set role=excluded.role,is_active=excluded.is_active,must_change_password=excluded.must_change_password;`;
}
