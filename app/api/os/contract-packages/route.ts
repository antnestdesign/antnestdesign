import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  getUserContext,
  json,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";
import {
  DOCUMENT_TYPES,
  assertCanCreateContractPreview,
  buildContractPackageSnapshot,
  hashJson,
  normalizeContractOptions,
  renderDocumentJson,
} from "./_lib/contracts";

function documentRows(packageId: string, packageVersion: number, snapshot: Record<string, unknown>, userId: string) {
  return DOCUMENT_TYPES.map((type) => {
    const content = renderDocumentJson(type, snapshot);
    return {
      package_id: packageId,
      document_type: type,
      package_version: packageVersion,
      generation_status: "GENERATED",
      content_json: content,
      content_hash: hashJson(content),
      file_path: null,
      file_url: null,
      mime_type: null,
      created_by: userId,
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    await getUserContext(request);
    const url = new URL(request.url);
    const estimateId = url.searchParams.get("estimateId")?.trim();
    const filters = [
      "select=*,contract_document_versions(*)",
      "order=created_at.desc",
    ];
    if (estimateId) filters.push(`estimate_id=eq.${encodeURIComponent(estimateId)}`);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?${filters.join("&")}`,
    );
    return json(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

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
    const existing = await supabaseFetch<Array<{ package_version: number }>>(
      `/rest/v1/contract_package_snapshots?estimate_id=eq.${encodeURIComponent(estimateId)}&select=package_version&order=package_version.desc&limit=1`,
    );
    const packageVersion = Number(existing[0]?.package_version || 0) + 1;
    const packageRows = await supabaseFetch<Array<Record<string, unknown>>>(
      "/rest/v1/contract_package_snapshots?select=*",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          estimate_id: estimateId,
          estimate_revision: snapshot.estimate_revision,
          package_version: packageVersion,
          status: "READY",
          contract_info: snapshot.contract_info,
          parties_info: snapshot.parties,
          site_manager: snapshot.site_manager,
          estimate_snapshot: snapshot.estimate_snapshot,
          document_options_snapshot: snapshot.document_options_snapshot,
          spec_snapshot: snapshot.spec_snapshot,
          clause_snapshot: snapshot.clause_snapshot,
          payment_schedule: snapshot.payment_schedule,
          template_version: snapshot.template_version,
          rule_version: snapshot.rule_version,
          source_hash: snapshot.source_hash,
          created_by: context.authUser.id,
        }),
      },
    );
    const contractPackage = packageRows[0];
    const packageId = String(contractPackage.id || "");
    const documents = documentRows(packageId, packageVersion, snapshot, context.authUser.id);
    const documentVersions = await supabaseFetch<Array<Record<string, unknown>>>(
      "/rest/v1/contract_document_versions?select=*",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(documents),
      },
    );
    if (documentVersions.length !== DOCUMENT_TYPES.length) {
      throw new ApiError(500, "계약 기준 문서 3종을 모두 생성하지 못했습니다.");
    }
    const projectName = String(snapshot.contract_info.project_name || estimateId);
    await writeAuditLog(context, {
      action: "CONTRACT_PACKAGE_CREATED",
      target_type: "contract_package",
      target_id: packageId,
      target_label: `${projectName} v${packageVersion}`,
      after_data: {
        estimate_id: estimateId,
        package_version: packageVersion,
        status: "READY",
        source_hash: snapshot.source_hash,
      },
    });
    return json({ ...contractPackage, contract_document_versions: documentVersions }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
