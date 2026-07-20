import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://lzsxboaqliuwjzwsnnwf.supabase.co";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export type UserRole = "admin" | "manager" | "staff";

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type AuthUser = {
  id: string;
  email?: string;
};

export type UserContext = {
  authUser: AuthUser;
  profile: Profile;
};

export type AuditLogPayload = {
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  target_label?: string | null;
  before_data?: Record<string, unknown> | null;
  after_data?: Record<string, unknown> | null;
  result?: string;
  reason?: string | null;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, { status: error.status });
  }
  console.error("AND OS API error", error);
  return json({ error: "서버 요청을 처리하지 못했습니다." }, { status: 500 });
}

export function requireServiceRoleKey() {
  if (!SERVICE_ROLE_KEY) {
    throw new ApiError(500, "서버 사용자관리 환경변수가 설정되지 않았습니다.");
  }
  return SERVICE_ROLE_KEY;
}

function serviceHeaders(extra?: HeadersInit) {
  const serviceKey = requireServiceRoleKey();
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function serviceUrl(path: string) {
  return `${SUPABASE_URL}${path}`;
}

function normalizeRole(role: unknown): UserRole {
  return role === "admin" || role === "manager" || role === "staff" ? role : "staff";
}

export function sanitizeProfile(profile: Profile) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    is_active: profile.is_active,
    must_change_password: profile.must_change_password,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

export function readBearerToken(request: NextRequest) {
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw new ApiError(401, "로그인이 필요합니다.");
  }
  return match[1];
}

export async function supabaseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(serviceUrl(path), {
    ...init,
    headers: serviceHeaders(init?.headers),
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || "요청 처리에 실패했습니다.");
  }
  const text = await response.text();
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

export async function supabaseUserFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const serviceKey = requireServiceRoleKey();
  const response = await fetch(serviceUrl(path), {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(response.status, message || "요청 처리에 실패했습니다.");
  }
  const text = await response.text();
  if (!text.trim()) return null as T;
  return JSON.parse(text) as T;
}

export async function getAuthUser(accessToken: string): Promise<AuthUser> {
  const serviceKey = requireServiceRoleKey();
  const response = await fetch(serviceUrl("/auth/v1/user"), {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError(401, "로그인이 필요합니다.");
  }
  const user = (await response.json()) as AuthUser;
  if (!user?.id) {
    throw new ApiError(401, "로그인 사용자를 확인하지 못했습니다.");
  }
  return user;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const rows = await supabaseFetch<Array<Record<string, unknown>>>(
    `/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=*`,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name == null ? null : String(row.name),
    email: row.email == null ? null : String(row.email),
    role: normalizeRole(row.role),
    is_active: row.is_active === true,
    must_change_password: row.must_change_password === true,
    created_at: row.created_at == null ? null : String(row.created_at),
    updated_at: row.updated_at == null ? null : String(row.updated_at),
  };
}

export async function getUserContext(request: NextRequest): Promise<UserContext> {
  const accessToken = readBearerToken(request);
  const authUser = await getAuthUser(accessToken);
  const profile = await getProfileById(authUser.id);
  if (!profile) {
    throw new ApiError(403, "사용자 프로필이 없습니다.");
  }
  if (!profile.is_active) {
    throw new ApiError(403, "비활성화된 계정입니다. 관리자에게 문의해 주세요.");
  }
  return { authUser, profile };
}

export async function requireAdmin(request: NextRequest): Promise<UserContext> {
  const context = await getUserContext(request);
  if (context.profile.role !== "admin") {
    throw new ApiError(403, "관리자 권한이 필요합니다.");
  }
  return context;
}

export function assertValidRole(role: unknown): UserRole {
  if (role !== "admin" && role !== "manager" && role !== "staff") {
    throw new ApiError(400, "역할 값이 올바르지 않습니다.");
  }
  return role;
}

export function assertNonEmptyString(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${label}을 입력해 주세요.`);
  }
  return value.trim();
}

export function assertPassword(value: unknown) {
  const password = assertNonEmptyString(value, "비밀번호");
  if (password !== password.trim()) {
    throw new ApiError(400, "비밀번호 앞뒤에 공백을 넣을 수 없습니다.");
  }
  if (password.length < 8) {
    throw new ApiError(400, "비밀번호는 8자 이상이어야 합니다.");
  }
  if (!/[A-Za-z]/.test(password)) {
    throw new ApiError(400, "비밀번호에는 영문이 포함되어야 합니다.");
  }
  if (!/\d/.test(password)) {
    throw new ApiError(400, "비밀번호에는 숫자가 포함되어야 합니다.");
  }
  return password;
}

export async function countActiveAdmins() {
  const rows = await supabaseFetch<Array<{ id: string }>>(
    "/rest/v1/profiles?role=eq.admin&is_active=eq.true&select=id",
  );
  return rows.length;
}

function sanitizeAuditValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeAuditValue);
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const blocked = new Set([
    "password",
    "initialPassword",
    "newPassword",
    "access_token",
    "refresh_token",
    "service_role_key",
    "authorization",
    "Authorization",
  ]);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !blocked.has(key))
      .map(([key, item]) => [key, sanitizeAuditValue(item)]),
  );
}

function sanitizeAuditData(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  return sanitizeAuditValue(value) as Record<string, unknown>;
}

export function profileAuditData(profile: Profile | null | undefined) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    is_active: profile.is_active,
    must_change_password: profile.must_change_password,
  };
}

export async function writeAuditLog(context: UserContext, payload: AuditLogPayload) {
  await supabaseFetch<null>("/rest/v1/os_audit_logs", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      actor_user_id: context.authUser.id,
      actor_email: context.profile.email || context.authUser.email || null,
      actor_name: context.profile.name || null,
      actor_role: context.profile.role,
      action: payload.action,
      target_type: payload.target_type || null,
      target_id: payload.target_id || null,
      target_label: payload.target_label || null,
      before_data: sanitizeAuditData(payload.before_data),
      after_data: sanitizeAuditData(payload.after_data),
      result: payload.result || "SUCCESS",
      reason: payload.reason || null,
    }),
  });
}

export function sanitizeAuditLog(row: Record<string, unknown>) {
  return {
    id: row.id,
    created_at: row.created_at,
    actor_user_id: row.actor_user_id,
    actor_email: row.actor_email,
    actor_name: row.actor_name,
    actor_role: row.actor_role,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    target_label: row.target_label,
    result: row.result,
    reason: row.reason,
  };
}
