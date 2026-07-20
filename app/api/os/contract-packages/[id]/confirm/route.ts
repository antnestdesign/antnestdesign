import { NextRequest } from "next/server";
import {
  errorResponse,
  json,
  requireAdmin,
  supabaseFetch,
  writeAuditLog,
} from "../../../_lib/server";
import { assertUuid } from "../../_lib/contracts";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const context = await requireAdmin(request);
    const { id } = await params;
    const packageId = assertUuid(id, "계약 패키지 ID");
    const result = await supabaseFetch<Record<string, unknown>>(
      "/rest/v1/rpc/confirm_contract_package_snapshot",
      {
        method: "POST",
        body: JSON.stringify({
          p_package_id: packageId,
          p_actor_user_id: context.authUser.id,
        }),
      },
    );
    await writeAuditLog(context, {
      action: "CONTRACT_PACKAGE_CONFIRMED",
      target_type: "contract_package",
      target_id: packageId,
      target_label: String(result.contract_no || result.package_version || packageId),
      after_data: {
        status: "CONTRACTED",
        confirmed_at: result.confirmed_at,
      },
    });
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
