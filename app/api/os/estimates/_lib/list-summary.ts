type Row = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;

export const estimateListSelect = [
  "id", "project_name", "client_name", "phone", "address", "area_pyeong", "total_price",
  "status", "created_at", "updated_at", "project_id", "creator_id", "creator_name",
  "creator_role", "creator_recorded_at", "last_editor_id", "last_editor_name", "last_edited_at",
  "revision", "confirmation_state", "draft_version", "confirmation_project_id", "latest_confirmation_id",
  "snapshot_project:estimate_data->>projectName", "snapshot_client:estimate_data->>clientName",
  "snapshot_client_input:estimate_data->inputs->>clientName", "snapshot_phone:estimate_data->>phone",
  "snapshot_client_phone:estimate_data->>clientPhone", "snapshot_phone_input:estimate_data->inputs->>clientPhone",
  "snapshot_address:estimate_data->>address", "snapshot_saved:estimate_data->>savedAt",
  "snapshot_total_text:estimate_data->>totalText", "snapshot_total:estimate_data->>total",
  "snapshot_quote_total:estimate_data->customerQuote->>total",
  "snapshot_area:estimate_data->>areaPyeong", "snapshot_status:estimate_data->>status",
].join(",");

export function estimateListRow(row: Row, staff: boolean) {
  const total = number(row.total_price ?? row.snapshot_total ?? (staff ? row.snapshot_quote_total : null));
  const phone = text(row.phone || row.snapshot_phone || (!staff && (row.snapshot_client_phone || row.snapshot_phone_input)));
  return {
    id: row.id,
    projectName: text(row.project_name || row.snapshot_project),
    clientName: text(row.client_name || row.snapshot_client || (!staff && row.snapshot_client_input)),
    phone,
    clientPhone: phone,
    address: text(row.address || row.snapshot_address),
    areaPyeong: number(row.area_pyeong ?? row.snapshot_area),
    total,
    totalText: (staff ? "" : text(row.snapshot_total_text)) || `${(Math.floor(total / 1000) * 1000).toLocaleString("ko-KR")}원`,
    status: text(row.status || row.snapshot_status) || (staff ? "" : "견적"),
    savedAt: text(row.created_at || row.snapshot_saved),
    updatedAt: row.updated_at,
  };
}
