export const shellAccountAuditCases = [
  ...["admin", "manager", "staff"].flatMap(role => ["loading", "empty", "normal", "error"].map(state => ({ name: `account ${role} ${state}`, kind: "account", role, state }))),
  ...["edit", "reset", "busy-edit", "busy-reset", "missing-edit", "missing-reset", "cancel"].map(state => ({ name: `account panel ${state}`, kind: "account", role: "admin", state })),
  ...["loading", "empty", "normal", "error", "legacy"].map(state => ({ name: `audit ${state}`, kind: "audit", role: "admin", state })),
  ...["manager", "staff"].map(role => ({ name: `audit ${role} denied`, kind: "audit", role, state: "normal" })),
  ...["client", "quote", "admin", "internal", "system"].map(tab => ({ name: `navigation ${tab}`, kind: "navigation", role: "admin", tab })),
  ...["admin", "manager", "staff"].map(role => ({ name: `shell ${role}`, kind: "shell", role })),
  ...[false, true].flatMap(session => [false, true].map(required => ({ name: `password session=${session} required=${required}`, kind: "password", session, required }))),
  { name: "static labels and shared panels", kind: "labels", role: "admin" },
  { name: "authentication locked", kind: "authenticated", authenticated: false },
  { name: "authentication unlocked", kind: "authenticated", authenticated: true },
  { name: "missing optional targets", kind: "missing", role: "admin" },
];

export function accountUsers() {
  return [
    { id: "synthetic-admin", name: "합성 관리자 <test>", email: "admin@example.invalid", role: "admin", is_active: true, must_change_password: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
    { id: "synthetic-manager", name: "합성 매니저", email: "manager@example.invalid", role: "manager", is_active: false, must_change_password: true },
    { id: "synthetic-staff", name: "", email: "staff@example.invalid", role: "staff", is_active: true, must_change_password: true },
    { id: "synthetic-legacy", name: "합성 legacy", email: "legacy@example.invalid", role: "unknown", is_active: false, must_change_password: false },
  ];
}

export function auditRows() {
  return [
    { created_at: "2026-01-01T00:00:00Z", actor_name: "합성 관리자", actor_email: "admin@example.invalid", actor_role: "admin", action: "USER_CREATED", target_label: "합성 직원", result: "SUCCESS", reason: "합성 생성" },
    { actor_email: "manager@example.invalid", actor_role: "manager", action: "UNKNOWN_LEGACY", target_id: "synthetic-target", result: "FAILURE", reason: "<합성 실패>" },
    { actor_role: "unknown", action: "", target_type: "synthetic-resource" },
  ];
}
