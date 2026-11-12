import { staffEstimateInputs } from "./estimate-inputs.js";
﻿const SUPABASE_URL = "https://lzsxboaqliuwjzwsnnwf.supabase.co";
const SUPABASE_KEY = "sb_publishable_2lbgZkij5jLbtE6JVBfB1Q_MCvzOcVr";
const ESTIMATES_ENDPOINT = `${SUPABASE_URL}/rest/v1/estimates`;
const COST_ITEMS_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_items`;
const COST_ITEM_HISTORY_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_item_history`;
const COST_PUBLISH_LOG_ENDPOINT = `${SUPABASE_URL}/rest/v1/cost_publish_log`;
const AUTH_STORAGE_KEY = "and-os.auth-session";

let authSession = null;
let refreshRequest = null;

const baseHeaders = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
};

function authHeaders(session = authSession) {
  return {
    ...baseHeaders,
    Authorization: `Bearer ${session?.access_token || SUPABASE_KEY}`,
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

function sessionWithExpiry(session) {
  const expiresAt = Number(session.expires_at);
  const expiresIn = Number(session.expires_in);
  return {
    ...session,
    ...(expiresAt > 0 ? { expires_at: expiresAt } : expiresIn > 0
      ? { expires_at: Math.floor(Date.now() / 1000) + expiresIn } : {}),
  };
}

async function refreshAuthSession(source) {
  if (!source?.refresh_token) throw new Error("로그인이 필요합니다.");
  if (refreshRequest?.source === source) return refreshRequest.promise;
  const request = { source, promise: null };
  request.promise = (async () => {
    let response;
    try {
      response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ refresh_token: source.refresh_token }),
      });
    } catch {
      throw new Error("로그인 세션을 갱신하지 못했습니다.");
    }
    // Logout or a new login must never be overwritten by an older refresh.
    if (authSession !== source) throw new Error("로그인이 필요합니다.");
    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) {
        persistSession(null);
        verifiedEstimateRole = null;
        throw new Error("로그인이 필요합니다.");
      }
      throw new Error("로그인 세션을 갱신하지 못했습니다.");
    }
    const renewed = await response.json().catch(() => null);
    if (authSession !== source) throw new Error("로그인이 필요합니다.");
    if (!renewed?.access_token || !renewed?.refresh_token
      || (renewed.user?.id && renewed.user.id !== source.user?.id)) {
      throw new Error("로그인 세션을 갱신하지 못했습니다.");
    }
    const session = sessionWithExpiry({ ...renewed, user: renewed.user || source.user });
    persistSession(session);
    return session;
  })().finally(() => {
    if (refreshRequest === request) refreshRequest = null;
  });
  refreshRequest = request;
  return request.promise;
}

async function fetchAuthenticated(url, options = {}) {
  options = {...options,cache:"no-store"};
  let session = getAuthSession();
  const expiry = Number(session?.expires_at);
  if (session && expiry > 0 && expiry <= Date.now() / 1000 + 30) {
    session = await refreshAuthSession(session);
  }
  const send = (current) => fetch(url, {
    ...options,
    headers: { ...baseHeaders, ...(options.headers || {}), Authorization: authHeaders(current).Authorization },
  });
  let response = await send(session);
  // Only authentication rejection is replayed, once. Permission and network
  // errors must not retry writes or relax role checks.
  if (response.status === 401 && session?.refresh_token) {
    const current = getAuthSession();
    if (!current || current.user?.id !== session.user?.id) throw new Error("로그인이 필요합니다.");
    session = current.access_token !== session.access_token ? current : await refreshAuthSession(current);
    response = await send(session);
  }
  return response;
}

function userFacingApiError(status, message) {
  if (status === 401) return "로그인이 필요합니다.";
  if (status === 403 && message) return message;
  if (status === 403) return "접근 권한이 없습니다.";
  if (status === 409) return "이미 사용 중인 정보가 있습니다.";
  if (status >= 500) return "서버 요청을 처리하지 못했습니다.";
  return message || "요청을 처리하지 못했습니다.";
}

async function requestOsApi(path, options = {}, preserveMessage = false) {
  const session = getAuthSession();
  if (!session?.access_token) {
    throw new Error("로그인이 필요합니다.");
  }
  const response = await fetchAuthenticated(`/api/os${path}`, {
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
    let code = "";
    try {
      const body = JSON.parse(text);
      message = body?.error || "";
      code = body?.code || "";
    } catch {
      message = "";
    }
    const error = new Error(preserveMessage && /^[가-힣]/.test(message) ? message : userFacingApiError(response.status, message));
    if (preserveMessage) { error.status = response.status; error.code = code; }
    throw error;
  }
  if (response.status === 204 || !text.trim()) return null;
  return JSON.parse(text);
}

let verifiedEstimateRole = null;
export function loadProjectFoundationMode() {
  return requestOsApi("/features/project-foundation");
}
export function requestProjectFoundation(path, options = {}) {
  if (!/^\/(projects|detailed-estimates)(\/|$|\?)/.test(path)) throw new Error("본견적 요청 경로가 올바르지 않습니다.");
  return requestOsApi(path, options, true);
}
export async function loadConfirmedContractPdf(projectId,packageId,type) {
  const response=await fetchAuthenticated(`/api/os/projects/${encodeURIComponent(projectId)}/contracts/${encodeURIComponent(packageId)}/${encodeURIComponent(type)}`);
  if(!response.ok)throw new Error('저장된 계약 PDF를 조회하지 못했습니다.');
  return response.blob();
}
export function requestPreliminaryPolicy(body) {
  return requestOsApi('/preliminary-policy',body===undefined?{}:{method:'POST',body:JSON.stringify(body)},true);
}
export function requestEstimateItems(view='state',body) {
  return requestOsApi(`/estimate-items?view=${encodeURIComponent(view)}`,body===undefined?{}:{method:'POST',body:JSON.stringify(body)},true);
}

export async function loadCurrentOsUser() {
  const profile = await requestOsApi("/me");
  verifiedEstimateRole = profile.role;
  return profile;
}

function staffEstimateBody(estimate) {
  return {
    inputs: ["admin","manager"].includes(verifiedEstimateRole) ? estimate.inputs : staffEstimateInputs(estimate.inputs),
    ...(estimate.address != null ? { address: estimate.address } : {}),
    ...(estimate.itemSelections!==undefined||estimate.itemBuilder?{itemSelections:estimate.itemSelections??estimate.itemBuilder.selections}:{}),
    ...(estimate.manualWorks!==undefined||estimate.itemBuilder?{manualWorks:estimate.manualWorks??estimate.itemBuilder.manualWorks??[]}:{}),
  };
}

export async function previewStaffEstimate(inputs, estimateId = null, itemSelections, manualWorks) {
  return requestOsApi("/estimates/preview", {
    method: "POST", body: JSON.stringify({ inputs: staffEstimateInputs(inputs), estimateId, ...(itemSelections!==undefined?{itemSelections}:{}), ...(manualWorks!==undefined?{manualWorks}:{}) }),
  });
}
export async function previewInternalEstimate(body) {
  return requestOsApi('/estimates/calculate',{method:'POST',body:JSON.stringify(body)});
}
export async function loadPrivateEstimateDefaults() {
  return requestOsApi('/estimates/calculate');
}

export async function loadOsUsers() {
  return requestOsApi("/users");
}

export async function loadOsAuditLogs(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.action) query.set("action", params.action);
  if (params.actor) query.set("actor", params.actor);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return requestOsApi(`/audit-logs${suffix}`);
}

export async function createOsAuditLog(payload) {
  return requestOsApi("/audit-logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loadContractOptions(estimateId) {
  const query = new URLSearchParams({ estimateId });
  return requestOsApi(`/contract-options?${query.toString()}`);
}

export async function saveContractOptions(estimateId, payload) {
  return requestOsApi("/contract-options", {
    method: "PUT",
    body: JSON.stringify({ estimate_id: estimateId, ...payload }),
  });
}

export async function loadContractPackages(estimateId, params = {}) {
  const query = new URLSearchParams();
  if (estimateId) query.set("estimateId", estimateId);
  if (params.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return requestOsApi(`/contract-packages${suffix}`);
}

export async function loadContractPackage(packageId, estimateId) {
  const query = estimateId ? `?${new URLSearchParams({ estimateId }).toString()}` : "";
  return requestOsApi(`/contract-packages/${encodeURIComponent(packageId)}${query}`);
}

export async function previewContractPackage(estimateId, options) {
  return requestOsApi("/contract-packages/preview", {
    method: "POST",
    body: JSON.stringify({ estimate_id: estimateId, options }),
  });
}

export async function createContractPackage(estimateId, options) {
  return requestOsApi("/contract-packages", {
    method: "POST",
    body: JSON.stringify({ estimate_id: estimateId, options }),
  });
}

export async function confirmContractPackage(packageId) {
  return requestOsApi(`/contract-packages/${encodeURIComponent(packageId)}/confirm`, {
    method: "POST",
  });
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
  const session = sessionWithExpiry(await response.json());
  verifiedEstimateRole = null;
  persistSession(session);
  return session;
}

export async function signOut() {
  const session = getAuthSession();
  persistSession(null);
  verifiedEstimateRole = null;
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session),
    }).catch(() => {});
  }
}

async function requestGeneric(path, options = {}) {
  const response = await fetchAuthenticated(`${SUPABASE_URL}${path}`, {
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
    authorship: row.authorship,
    revision: row.revision,
    canEdit: row.canEdit,
    canConfirm: row.canConfirm,
    canCreateRevision: row.canCreateRevision,
    confirmation: row.confirmation,
    projectId: row.projectId || row.project_id || row.confirmation?.projectId || null,
    updatedAt: row.updated_at,
    id: row.id,
    projectName: row.project_name || data.projectName || "",
    clientName,
    phone,
    clientPhone: phone,
    address: row.address || data.address || "",
    areaPyeong: row.area_pyeong ?? data.areaPyeong ?? 0,
    total: row.total_price ?? data.total ?? 0,
    totalText: data.totalText || `${(Math.floor((row.total_price || 0) / 1000) * 1000).toLocaleString("ko-KR")}원`,
    costTotal: data.costIncomplete?null:row.cost_total ?? data.costTotal ?? 0,
    marginRate: data.costIncomplete?null:row.margin_rate ?? data.marginRate ?? 0,
    status: row.status || data.status || "견적",
    savedAt,
    customerQuote: data.customerQuote
      ? { ...data.customerQuote, clientName, phone, savedAt }
      : data.customerQuote,
  };
}

function estimateRequestBody(estimate) {
  return staffEstimateBody(estimate);
}
function estimateResponse(row) {
  if(!row || typeof row.id !== 'string' || !row.id)throw new Error('견적 저장 결과를 확인하지 못했습니다. 목록에서 다시 확인해 주세요.');
  return row.estimate_data ? normalizeEstimate(row) : row;
}
export async function saveEstimate(estimate) {
  const body=estimateRequestBody(estimate);body.inputs={...body.inputs,estimateStatus:'견적'};
  return estimateResponse(await requestOsApi('/estimates', {
    method:'POST',body:JSON.stringify(body),
  },true));
}
export async function updateEstimate(id, estimate) {
  if(!id)throw new Error('수정할 견적을 찾지 못했습니다.');
  return estimateResponse(await requestOsApi(`/estimates/${encodeURIComponent(id)}`, {
    method:'PATCH',body:JSON.stringify({...estimateRequestBody(estimate),expectedRevision:estimate.revision}),
  },true));
}
export async function updateEstimateFinancials(id,expectedRevision,financialAdjustment){
  return estimateResponse(await requestOsApi(`/estimates/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({expectedRevision,financialAdjustment})},true));
}
export async function loadEstimates({contracts=false}={}) {
  return (await requestOsApi(contracts?'/estimates?view=contracts':'/estimates')).map(estimateResponse);
}
export async function getEstimate(id) {
  return estimateResponse(await requestOsApi(`/estimates/${encodeURIComponent(id)}`));
}
export async function deleteEstimate(id, expectedRevision) {
  const profile=await loadCurrentOsUser();
  if(profile.role!=='admin')throw new Error('관리자만 견적을 삭제할 수 있습니다.');
  if(typeof expectedRevision!=='string')throw new Error('삭제할 견적을 목록에서 다시 불러와 주세요.');
  await requestOsApi(`/estimates/${encodeURIComponent(id)}`, {
    method:'DELETE',body:JSON.stringify({expectedRevision}),
  },true);
}
export async function loadEstimateHistory(id,versionId) {
  return requestOsApi(`/estimates/${encodeURIComponent(id)}/history${versionId?'?versionId='+encodeURIComponent(versionId):''}`);
}

export function loadEstimateConfirmations(id,versionId) {
  return requestOsApi(`/estimates/${encodeURIComponent(id)}/confirmations${versionId?'/'+encodeURIComponent(versionId):''}`,{},true)
    .then(row=>versionId?estimateResponse(row):row);
}
export function confirmEstimate(id,body) {
  return requestOsApi(`/estimates/${encodeURIComponent(id)}/confirmations`,{method:'POST',body:JSON.stringify(body)},true);
}
export function createEstimateRevision(id,body) {
  return requestOsApi(`/estimates/${encodeURIComponent(id)}/revision`,{method:'POST',body:JSON.stringify(body)},true);
}

async function requestCostItems(path = "", options = {}) {
  const response = await fetchAuthenticated(`${COST_ITEMS_ENDPOINT}${path}`, {
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
  const response = await fetchAuthenticated(`${COST_ITEM_HISTORY_ENDPOINT}${path}`, {
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
  const response = await fetchAuthenticated(`${COST_PUBLISH_LOG_ENDPOINT}${path}`, {
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
  const response = await fetchAuthenticated(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
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
  const response = await fetchAuthenticated(`${ESTIMATES_ENDPOINT}?select=id`, {
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

export async function createCostItem(payload) {
  return requestOsApi("/cost-items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cloneCostItem(payload) {
  return requestOsApi("/cost-items/clone", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePendingCostItem(id, payload) {
  return requestOsApi(`/cost-items/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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


