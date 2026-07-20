import { NextRequest } from "next/server";
import { ApiError, errorResponse, getUserContext, json, supabaseFetch } from "../../_lib/server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await getUserContext(request);
    const { id } = await params;
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?id=eq.${encodeURIComponent(id)}&select=*,contract_document_versions(*)&limit=1`,
    );
    const item = rows[0];
    if (!item) throw new ApiError(404, "계약 패키지를 찾지 못했습니다.");
    return json(item);
  } catch (error) {
    return errorResponse(error);
  }
}
