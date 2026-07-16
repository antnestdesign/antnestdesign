const SUPABASE_URL = "https://lzsxboaqliuwjzwsnnwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_2lbgZkij5jLbtE6JVBfB1Q_MCvzOcVr";
const ESTIMATES_ENDPOINT = `${SUPABASE_URL}/rest/v1/estimates`;
const COST_ITEMS_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_items`;
const COST_ITEM_HISTORY_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_item_history`;
const COST_PUBLISH_LOG_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_publish_log`;
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

function userFacingApiError(status, message) {
  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403 && message) return message;
  if (status === 403) return "접근 권한이 없습니다.";
  if (status === 409) return "이미 사용 중인 정보가 있습니다.";
  if (status >= 500) return "서버 요청을 처리하지 못했습니다.";
  return message || "요청을 처리하지 못했습니다.";
}

async function requestOsApi(path, options = {}) {
  const session = getAuthSession();
  if (!session?.access_token) {
    throw new Error("로그인이 필요합니다.");
  }
  const response = await fetch(`/api/os${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    let message = "";
    try {
      message = JSON.parse(text)?.error || "";
    } catch {
      message = "";
    }
    throw new Error(userFacingApiError(response.status, message));
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

export async function loadCurrentOsUser() {
  return requestOsApi("/me");
}

export async function loadOsUsers() {
  return requestOsApi("/users");
}

export async function createOsUser(payload) {
  return requestOsApi("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateOsUser(id, payload) {
  return requestOsApi(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function resetOsUserPassword(id, initialPassword) {
  return requestOsApi(`/users/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ initialPassword }),
  });
}

export async function changeOwnPassword(newPassword) {
  return requestOsApi("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

export async function signIn(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    await response.text();
    throw new Error("로그인에 실패했습니다.");
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
    await response.text();
    throw new Error(`데이터 요청에 실패했습니다. (${response.status})`);
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
      console.warn("profiles 議고쉶 湲곗? 嫄대꼫?", query, error);
    }
  }
  profile ||= {};
  const role = String(profile.role || "staff").trim().toLowerCase();
  return {
    ...profile,
    id: session.user.id,
    email: emailRaw,
    role: ["admin", "manager", "staff"].includes(role) ? role : "staff",
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
    await response.text();
    throw new Error(`데이터 요청에 실패했습니다. (${response.status})`);
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
    await response.text();
    throw new Error(`데이터 저장에 실패했습니다. (${response.status})`);
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
  throw new Error(errors.filter(Boolean).join("\n") || "견적 저장에 실패했습니다.");
}
export async function saveEstimate(estimate) {
  const projectName = estimate.projectName?.trim();
  if (!projectName) {
    throw new Error("프로젝트명을 입력해 주세요.");
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
    throw new Error("수정할 견적을 찾지 못했습니다.");
  }
  const projectName = estimate.projectName?.trim();
  if (!projectName) {
    throw new Error("프로젝트명을 입력해 주세요.");
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

async function requestCostItems(path = "", options = {}) {
  const response = await fetch(`${COST_ITEMS_ENDPOINT}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`원가 품목 조회에 실패했습니다. (${response.status})`);
    error.status = response.status;
    error.body = text;
    error.endpoint = "cost_items";
    error.method = options.method || "GET";
    throw error;
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

export async function loadCostItems() {
  return requestCostItems("?is_active=eq.true&select=*&order=sort_order.asc,category.asc");
}

export async function loadSystemCostItems() {
  return requestCostItems("?select=*&order=sort_order.asc,category.asc");
}

async function requestCostHistory(path = "", options = {}) {
  const response = await fetch(`${COST_ITEM_HISTORY_ENDPOINT}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`변경 이력 조회에 실패했습니다. (${response.status})`);
    error.status = response.status;
    error.body = text;
    error.endpoint = "cost_item_history";
    error.method = options.method || "GET";
    throw error;
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

async function requestCostPublishLog(path = "", options = {}) {
  const response = await fetch(`${COST_PUBLISH_LOG_ENDPOINT}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`배포 기록 조회에 실패했습니다. (${response.status})`);
    error.status = response.status;
    error.body = text;
    error.endpoint = "cost_publish_log";
    error.method = options.method || "GET";
    throw error;
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

async function requestRpc(functionName, payload = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: { ...authHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`요청 처리에 실패했습니다. (${response.status})`);
    error.status = response.status;
    error.body = text;
    error.endpoint = functionName;
    error.method = "POST";
    throw error;
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

export async function loadCostItemHistory(limit = 200) {
  return requestCostHistory(`?select=*,cost_items(item_code,item_name,category,unit)&order=changed_at.desc&limit=${encodeURIComponent(limit)}`);
}

export async function loadCostPublishLogs(limit = 100) {
  return requestCostPublishLog(`?select=*&order=published_at.desc&limit=${encodeURIComponent(limit)}`);
}

export async function loadEstimateCount() {
  const response = await fetch(`${ESTIMATES_ENDPOINT}?select=id`, {
    method: "HEAD",
    headers: { ...authHeaders(), Prefer: "count=exact" },
  });
  if (!response.ok) {
    await response.text();
    throw new Error(`저장 견적 수 조회에 실패했습니다. (${response.status})`);
  }
  return Number(response.headers.get("content-range")?.split("/").pop()) || 0;
}

export async function saveCostItemDraft(costItemId, draftCostPrice, draftMarginRate, draftIsActive) {
  return requestRpc("save_cost_item_draft", {
    p_cost_item_id: costItemId,
    p_draft_cost_price: draftCostPrice,
    p_draft_margin_rate: draftMarginRate,
    p_draft_is_active: draftIsActive,
  });
}

export async function cancelCostItemDraft(costItemId) {
  return requestRpc("cancel_cost_item_draft", { p_cost_item_id: costItemId });
}

export async function cancelAllCostDrafts() {
  return requestRpc("cancel_all_cost_drafts", {});
}

export async function publishCostDrafts(reason, memo = null) {
  return requestRpc("publish_cost_drafts", { p_reason: reason, p_memo: memo });
}

export async function saveCostItemChanges(changes) {
  const saved = [];
  for (const change of changes) {
    saved.push(await saveCostItemDraft(
      change.id,
      change.new_cost_price,
      change.new_margin_rate,
      change.new_is_active ?? change.is_active ?? null,
    ));
  }
  return saved;
}


