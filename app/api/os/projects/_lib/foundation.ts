import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json, requireServiceRoleKey, supabaseFetch } from "../../_lib/server";
import { FoundationModeError, requireFoundationAction } from "./feature-state";

type RecordValue = Record<string, unknown>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function id(value: unknown): string {
  if (typeof value !== "string" || !UUID.test(value)) throw new ApiError(400, "식별자가 올바르지 않습니다.");
  return value;
}
export function object(value: unknown, keys: string[]): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) {
    throw new ApiError(400, "허용되지 않은 요청 정보입니다.");
  }
  return value as RecordValue;
}
function text(value: unknown, required = false) {
  if (typeof value !== "string" || value.length > 500 || (required && !value.trim())) throw new ApiError(400, "입력 내용을 확인해 주세요.");
  return value;
}
export function context(value: unknown) {
  const data = object(value, ["project_name", "client_name", "phone", "address", "area_pyeong", "customer_undecided"]);
  for (const [key, val] of Object.entries(data)) {
    if (key === "customer_undecided") {
      if (typeof val !== "boolean") throw new ApiError(400, "고객 미정 값은 선택값이어야 합니다.");
    } else if (key === "area_pyeong") {
      if (val !== "" && (typeof val !== "number" || !Number.isFinite(val) || val < 0 || val > 100000)) throw new ApiError(400, "평형을 확인해 주세요.");
    } else text(val);
  }
  return data;
}
export function seal(actor: string, purpose: string, target: string, fingerprint: string) {
  const iv = randomBytes(12), key = createHash("sha256").update(requireServiceRoleKey()).digest();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ actor, purpose, target, fingerprint, expires: Date.now() + 15 * 60_000 }), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function unseal(value: unknown, actor: string, purpose: string, target: string): string {
  try {
    if (typeof value !== "string" || value.length > 2000) throw new Error();
    const bytes = Buffer.from(value, "base64url"), key = createHash("sha256").update(requireServiceRoleKey()).digest();
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(12, 28));
    const decoded = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8"));
    if (decoded.actor !== actor || decoded.purpose !== purpose || decoded.target !== target || decoded.expires < Date.now()) throw new Error();
    return decoded.fingerprint;
  } catch { throw new ApiError(409, "확인 정보가 만료되었거나 대상이 다릅니다. 다시 확인해 주세요."); }
}
function selection(value: unknown, actor: string) {
  const data = object(value, ["mode", "project_id", "confirmation", "confirmed", "project_name", "address", "area_pyeong", "customer_mode", "customer_id", "client_name", "phone"]);
  if (data.mode === "existing") {
    object(data, ["mode", "project_id", "confirmation", "confirmed"]);
    const projectId = id(data.project_id);
    if (data.confirmed !== true) throw new ApiError(400, "프로젝트 정보 차이를 확인해 주세요.");
    return { mode: "existing", project_id: projectId, confirmed: true, fingerprint: unseal(data.confirmation, actor, "project", projectId) };
  }
  if (data.mode !== "new") throw new ApiError(400, "프로젝트 선택 방법을 확인해 주세요.");
  object(data, ["mode", "project_name", "address", "area_pyeong", "customer_mode", "customer_id", "client_name", "phone"]);
  text(data.project_name, true);
  if (String(data.project_name).length > 200) throw new ApiError(400, "프로젝트명은 200자 이내로 입력해 주세요.");
  if (data.address !== undefined) text(data.address);
  if (data.area_pyeong !== undefined) context({ area_pyeong: data.area_pyeong });
  if (!["new", "existing", "undecided"].includes(String(data.customer_mode))) throw new ApiError(400, "고객 연결 방법을 선택해 주세요.");
  if (data.customer_mode === "existing") id(data.customer_id);
  else if (data.customer_id !== undefined) throw new ApiError(400, "고객 연결 방법이 중복되었습니다.");
  if (data.customer_mode === "new") { text(data.client_name, true); if (data.phone !== undefined) text(data.phone); }
  else if (data.client_name !== undefined || data.phone !== undefined) throw new ApiError(400, "고객 연결 방법이 중복되었습니다.");
  return data;
}
export async function handle(request: NextRequest, action: string, routeId?: string) {
  try {
    const user = await getUserContext(request), actor = user.authUser.id;
    if (!["admin", "manager", "staff"].includes(user.profile.role)) throw new ApiError(403, "접근 권한이 없습니다.");
    const mode = requireFoundationAction(action);
    if (routeId) id(routeId);
    const reads = ["projects", "customers", "project", "get", "events"];
    const body = reads.includes(action) ? {} : object(await request.json(), action === "preview" ? ["estimate_id"]
      : action === "start" ? ["estimate_id", "confirmation", "selection", "title", "request_id"]
      : action === "save" ? ["context", "expected_revision", "request_id"]
      : action === "adopt-project" ? ["confirmation", "request_id"] : ["selection", "request_id"]);
    if (JSON.stringify(body).length > 64000) throw new ApiError(413, "요청 내용이 너무 큽니다.");
    let payload: RecordValue = {}, requestId: string | null = null;
    if (action === "preview") payload = { estimate_id: id(body.estimate_id) };
    if (action === "project") payload = { project_id: routeId };
    if (action === "get" || action === "events") payload = { id: routeId };
    if (["start", "create-project", "adopt-project", "save"].includes(action)) requestId = id(body.request_id);
    if (action === "start" || action === "create-project") {
      payload = { selection: selection(body.selection, actor) };
      if (action === "create-project" && (payload.selection as RecordValue).mode !== "new") throw new ApiError(400, "새 프로젝트 정보가 필요합니다.");
    }
    if (action === "start") {
      const estimateId = id(body.estimate_id);
      const title = text(body.title, true);
      if (title.length > 200) throw new ApiError(400, "본견적 제목은 200자 이내로 입력해 주세요.");
      payload = { ...payload, estimate_id: estimateId, source_fingerprint: unseal(body.confirmation, actor, "source", estimateId), title };
    }
    if (action === "adopt-project") {
      if (user.profile.role === "staff") throw new ApiError(403, "프로젝트 도입 권한이 없습니다.");
      payload = { project_id: routeId, fingerprint: unseal(body.confirmation, actor, "project", routeId!) };
    }
    if (action === "save") {
      if (!Number.isSafeInteger(body.expected_revision) || Number(body.expected_revision) < 1) throw new ApiError(400, "작성 개정번호가 필요합니다.");
      payload = { id: routeId, expected_revision: body.expected_revision, context: context(body.context) };
    }
    const result = await supabaseFetch<RecordValue>("/rest/v1/rpc/and_os_5b_command", {
      method: "POST", body: JSON.stringify({ p_actor: actor, p_action: action, p_payload: payload, p_request_id: requestId, p_feature_mode: mode }),
    });
    if (action === "preview") {
      const sourceId = String(payload.estimate_id);
      const [sources, links, references] = await Promise.all([
        supabaseFetch<Array<{ project_id: string | null }>>(`/rest/v1/estimates?id=eq.${sourceId}&select=project_id`),
        supabaseFetch<Array<{ project_id: string }>>(`/rest/v1/project_preliminary_estimates?estimate_id=eq.${sourceId}&select=project_id`),
        supabaseFetch<Array<{ project_id: string; detailed_estimate_id: string }>>(`/rest/v1/detailed_estimate_references?source_estimate_id=eq.${sourceId}&select=project_id,detailed_estimate_id`),
      ]);
      const linked = [...new Set([...sources, ...links, ...references].map(row => row.project_id).filter(Boolean))];
      if (linked.length > 1) return json({ error: "가견적의 프로젝트 연결이 충돌합니다. 관리자에게 확인해 주세요.", code: "PROJECT_LINK_CONFLICT" }, { status: 409 });
      return json({ snapshot: result.snapshot, confirmation: seal(actor, "source", sourceId, String(result.fingerprint)),
        connection: linked.length ? { project_id: linked[0], draft_ids: references.map(row => row.detailed_estimate_id) } : null,
        notice: "저장된 가견적만 참고합니다. 미저장 입력과 본견적 판매가는 자동 반영하지 않습니다." });
    }
    if (action === "project") {
      return json({ project: result.project, drafts: result.drafts, estimates: result.estimates,
        confirmation: seal(actor, "project", routeId!, String(result.fingerprint)) });
    }
    return json(result, { status: action === "start" || action === "create-project" ? 201 : 200 });
  } catch (error) {
    if (error instanceof FoundationModeError) return json({ error: error.message,
      code: error.mode === "READ_ONLY" ? "FOUNDATION_READ_ONLY" : "FOUNDATION_OFF" }, { status: error.status });
    if (error instanceof ApiError) {
      try {
        const detail = JSON.parse(error.message);
        if (detail.code === "P5F01" || detail.code === "P5F02") {
          const blocked = new FoundationModeError(detail.code === "P5F02" ? "READ_ONLY" : "OFF");
          return json({ error: blocked.message, code: detail.code === "P5F02" ? "FOUNDATION_READ_ONLY" : "FOUNDATION_OFF" }, { status: blocked.status });
        }
        const status = ({ "42501": 403, P0002: 404, "23514": 409, "23505": 409, "22023": 400, "22P02": 400, "23503": 409, "55P03": 409, "57014": 409 } as Record<string, number>)[detail.code];
        if (status) return json({ error: detail.code === "23503" ? "참조 중인 자료는 삭제하거나 변경할 수 없습니다." :
          typeof detail.message === "string" && /^[가-힣]/.test(detail.message) ? detail.message : "요청 정보를 다시 확인해 주세요." }, { status });
      } catch { /* Do not expose raw database errors or rejected row contents. */ }
      if (error.message.trim().startsWith("{")) return json({ error: "본견적 요청을 처리하지 못했습니다." }, { status: 500 });
    }
    return errorResponse(error);
  }
}
