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

type UserContext = {
  authUser: AuthUser;
  profile: Profile;
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
    throw new ApiError(response.status, message || "Supabase 요청에 실패했습니다.");
  }
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
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
    throw new ApiError(403, "비활성 사용자입니다.");
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
  if (password.length < 8) {
    throw new ApiError(400, "비밀번호는 8자 이상이어야 합니다.");
  }
  return password;
}

export async function countActiveAdmins() {
  const rows = await supabaseFetch<Array<{ id: string }>>(
    "/rest/v1/profiles?role=eq.admin&is_active=eq.true&select=id",
  );
  return rows.length;
}
