import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json } from "../../_lib/server";
import {
  DOCUMENT_TYPES,
  assertCanCreateContractPreview,
  buildContractPackageSnapshot,
  normalizeContractOptions,
  renderDocumentJson,
} from "../_lib/contracts";

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    assertCanCreateContractPreview(context);
    const body = (await request.json()) as Record<string, unknown>;
    const estimateId = String(body.estimate_id || "").trim();
    if (!estimateId) throw new ApiError(400, "저장 견적 ID가 필요합니다.");
    const options = body.options && typeof body.options === "object"
      ? normalizeContractOptions(body.options as Record<string, unknown>)
      : undefined;
    const snapshot = await buildContractPackageSnapshot(estimateId, options);
    const documents = DOCUMENT_TYPES.map((type) => ({
      document_type: type,
      generation_status: "GENERATED",
      content_json: renderDocumentJson(type, snapshot),
    }));
    return json({
      status: "PREVIEWED",
      snapshot,
      documents,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
