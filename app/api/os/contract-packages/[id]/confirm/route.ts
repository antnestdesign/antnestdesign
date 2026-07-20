import { NextRequest } from "next/server";
import {
  ApiError,
  errorResponse,
  json,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../../../_lib/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await requireAdmin(request);
    const { id } = await params;
    const packages = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?id=eq.${encodeURIComponent(id)}&select=*`,
    );
    const contractPackage = packages[0];
    if (!contractPackage) throw new ApiError(404, "계약 패키지를 찾지 못했습니다.");
    if (contractPackage.status !== "READY") {
      throw new ApiError(409, "READY 상태의 계약 패키지만 확정할 수 있습니다.");
    }
    const documents = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_document_versions?package_id=eq.${encodeURIComponent(id)}&package_version=eq.${encodeURIComponent(String(contractPackage.package_version))}&select=id,document_type,generation_status`,
    );
    const generatedTypes = new Set(documents.filter((item) => item.generation_status === "GENERATED").map((item) => item.document_type));
    for (const type of ["CONTRACT", "QUOTE", "SPEC"]) {
      if (!generatedTypes.has(type)) {
        throw new ApiError(409, "계약서·견적서·공사사양서 3종이 모두 생성되어야 계약확정할 수 있습니다.");
      }
    }
    const now = new Date().toISOString();
    const updatedPackages = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          status: "CONTRACTED",
          confirmed_by: context.authUser.id,
          confirmed_at: now,
        }),
      },
    );
    const updatedDocuments = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_document_versions?package_id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          generation_status: "FINAL",
          locked_at: now,
        }),
      },
    );
    await writeAuditLog(context, {
      action: "CONTRACT_PACKAGE_CONFIRMED",
      target_type: "contract_package",
      target_id: id,
      target_label: String(contractPackage.package_version || id),
      before_data: { status: contractPackage.status },
      after_data: { status: "CONTRACTED", confirmed_at: now },
    });
    return json({ ...updatedPackages[0], contract_document_versions: updatedDocuments });
  } catch (error) {
    return errorResponse(error);
  }
}
