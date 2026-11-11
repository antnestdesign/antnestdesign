import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json, supabaseFetch } from "../../_lib/server";
import {
  assertPackageEstimateScope,
  assertUuid,
  projectContractPackage,
  requireEstimateScopeForStaff,
} from "../_lib/contracts";
import { issuedLinks, readIssuedPackage } from "../_lib/issued-access";
import {confirmedContractAccess} from '../_lib/confirmed-source';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getUserContext(request);
    const { id } = await params;
    const packageId = assertUuid(id, "계약 패키지 ID");
    if ((await issuedLinks(packageId)).length) {
      return json(projectContractPackage(await readIssuedPackage(context, packageId), context.profile.role));
    }
    const url = new URL(request.url);
    const estimateId = url.searchParams.get("estimateId")
      ? assertUuid(url.searchParams.get("estimateId"), "저장 견적 ID")
      : null;
    requireEstimateScopeForStaff(context, estimateId);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?id=eq.${encodeURIComponent(packageId)}&select=*,contract_document_versions(id,package_id,document_type,package_version,generation_status,content_json,content_hash,file_path,file_url,mime_type,created_by,locked_at,created_at,pdf_sha256)&limit=1`,
    );
    const item = rows[0];
    if (!item) throw new ApiError(404, "계약 패키지를 찾지 못했습니다.");
    if(item.preliminary_project_id)await confirmedContractAccess(context,String(item.preliminary_project_id));
    assertPackageEstimateScope(item, estimateId);
    return json(projectContractPackage(item, context.profile.role));
  } catch (error) {
    return errorResponse(error);
  }
}
