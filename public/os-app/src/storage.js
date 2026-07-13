const SUPABASE_URL = "https://lzsxboaqliuwjzwsnnwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_2lbgZkij5jLbtE6JVBfB1Q_MCvzOcVr";
const ESTIMATES_ENDPOINT = `${SUPABASE_URL}/rest/v1/estimates`;
const AUTH_STORAGE_KEY = "and-os.auth-session";

let authSession = null;

const baseHeaders = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
};

function authHeaders() {
  return {
    ...baseHeaders,
    Authorization: `Bearer ${authSession?.access_token || SUPABASE_KEY}`,
  };
}

function persistSession(session) {
  authSession = session;
  if (session) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function loadStoredSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    authSession = raw ? JSON.parse(raw) : null;
    return authSession;
  } catch {
    return null;
  }
}

export function getAuthSession() {
  return authSession || loadStoredSession();
}

export async function signIn(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "로그인에 실패했습니다.");
  }
  const session = await response.json();
  persistSession(session);
  return session;
}

export async function signOut() {
  const session = getAuthSession();
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(),
    }).catch(() => {});
  }
  persistSession(null);
}

async function requestGeneric(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function loadProfile() {
  const session = getAuthSession();
  if (!session?.user?.id) return null;
  const userId = encodeURIComponent(session.user.id);
  const emailRaw = String(session.user.email || "").trim();
  const email = encodeURIComponent(emailRaw);
  const profileQueries = [
    email ? `/rest/v1/profiles?email=eq.${email}&select=*&limit=1` : "",
    `/rest/v1/profiles?id=eq.${userId}&select=*&limit=1`,
    `/rest/v1/profiles?user_id=eq.${userId}&select=*&limit=1`,
    `/rest/v1/profiles?auth_user_id=eq.${userId}&select=*&limit=1`,
  ].filter(Boolean);

  let profile = null;
  for (const query of profileQueries) {
    try {
      const rows = await requestGeneric(query);
      if (rows[0]) {
        profile = rows[0];
        break;
      }
    } catch (error) {
      console.warn("profiles 조회 기준 건너뜀", query, error);
    }
  }
  profile ||= {};
  const role = String(profile.role || "staff").trim().toLowerCase();
  return {
    ...profile,
    id: session.user.id,
    email: emailRaw,
    role: role === "admin" ? "admin" : "staff",
  };
}

function normalizeEstimate(row) {
  const data = row.estimate_data || {};
  const savedAt = row.created_at || data.savedAt || new Date().toISOString();
  const clientName = row.client_name || data.clientName || data.inputs?.clientName || "";
  const phone = row.phone || data.phone || data.clientPhone || data.inputs?.clientPhone || "";
  return {
    ...data,
    id: row.id,
    projectName: row.project_name || data.projectName || "",
    clientName,
    phone,
    clientPhone: phone,
    address: row.address || data.address || "",
    areaPyeong: row.area_pyeong ?? data.areaPyeong ?? 0,
    total: row.total_price ?? data.total ?? 0,
    totalText: data.totalText || `${(Math.floor((row.total_price || 0) / 1000) * 1000).toLocaleString("ko-KR")}원`,
    costTotal: row.cost_total ?? data.costTotal ?? 0,
    marginRate: row.margin_rate ?? data.marginRate ?? 0,
    status: row.status || data.status || "견적",
    savedAt,
    customerQuote: data.customerQuote
      ? { ...data.customerQuote, clientName, phone, savedAt }
      : data.customerQuote,
  };
}
async function request(path = "", options = {}) {
  const response = await fetch(`${ESTIMATES_ENDPOINT}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function insertEstimatePayload(payload) {
  const response = await fetch(ESTIMATES_ENDPOINT, {
    method: "POST",
    headers: {
      ...authHeaders(),
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase insert failed: ${response.status}`);
  }
}

async function insertWithFallbacks(payload, fallbacks) {
  const errors = [];
  for (const candidate of [payload, ...fallbacks]) {
    try {
      await insertEstimatePayload(candidate);
      return;
    } catch (error) {
      errors.push(error?.message || String(error));
    }
  }
  throw new Error(errors.filter(Boolean).join("\n") || "Supabase estimate save failed.");
}
export async function saveEstimate(estimate) {
  const projectName = estimate.projectName?.trim();
  if (!projectName) {
    throw new Error("Project name is required.");
  }
  const clientName = estimate.clientName || estimate.inputs?.clientName || "";
  const phone = estimate.phone || estimate.clientPhone || estimate.inputs?.clientPhone || "";
  const status = estimate.status || "견적";

  const payload = {
    project_name: projectName,
    client_name: clientName,
    phone,
    address: estimate.address || "",
    area_pyeong: estimate.areaPyeong || 0,
    total_price: estimate.total || 0,
    cost_total: estimate.costTotal || 0,
    margin_rate: estimate.marginRate || 0,
    estimate_data: {
      ...estimate,
      projectName,
      clientName,
      phone,
      clientPhone: phone,
      status,
    },
    status,
  };

  await insertWithFallbacks(payload, [
    {
      project_name: projectName,
      total_price: estimate.total || 0,
      estimate_data: payload.estimate_data,
      status,
    },
    {
      project_name: projectName,
      estimate_data: payload.estimate_data,
    },
  ]);
  return normalizeEstimate({
    ...payload,
    id: estimate.id || "",
    created_at: new Date().toISOString(),
  });
}

export async function updateEstimate(id, estimate) {
  if (!id) {
    throw new Error("Estimate id is required.");
  }
  const projectName = estimate.projectName?.trim();
  if (!projectName) {
    throw new Error("Project name is required.");
  }
  const clientName = estimate.clientName || estimate.inputs?.clientName || "";
  const phone = estimate.phone || estimate.clientPhone || estimate.inputs?.clientPhone || "";
  const status = estimate.status || "견적";
  const payload = {
    project_name: projectName,
    client_name: clientName,
    phone,
    address: estimate.address || "",
    area_pyeong: estimate.areaPyeong || 0,
    total_price: estimate.total || 0,
    cost_total: estimate.costTotal || 0,
    margin_rate: estimate.marginRate || 0,
    estimate_data: {
      ...estimate,
      id,
      projectName,
      clientName,
      phone,
      clientPhone: phone,
      status,
    },
    status,
  };
  const rows = await request(`?id=eq.${encodeURIComponent(id)}&select=*`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return normalizeEstimate(rows?.[0] || { ...payload, id, created_at: estimate.savedAt || new Date().toISOString() });
}

export async function loadEstimates() {
  const rows = await request("?select=*&order=created_at.desc");
  return rows.map(normalizeEstimate);
}

export async function getEstimate(id) {
  const rows = await request(`?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return rows[0] ? normalizeEstimate(rows[0]) : null;
}

export async function deleteEstimate(id) {
  await request(`?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
