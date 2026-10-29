import { supabaseFetch, UserContext } from "../../_lib/server";
import { requireFoundationAction } from "../../projects/_lib/feature-state";

export async function issuedLinks(packageId?: string) {
  try {
    return await supabaseFetch<Array<{ package_id: string }>>(`/rest/v1/contract_issued_sources?select=package_id${packageId ? `&package_id=eq.${packageId}` : ""}`);
  } catch (error) {
    // Existing installations without the additive migration keep their legacy contracts.
    try { if (["42P01", "PGRST205"].includes(JSON.parse((error as Error).message).code)) return []; } catch { /* Not a capability absence. */ }
    throw error;
  }
}
export async function readIssuedPackage(user: UserContext, packageId: string) {
  return supabaseFetch<Record<string, unknown>>("/rest/v1/rpc/and_os_5b_contract", { method: "POST", body: JSON.stringify({
    p_actor: user.authUser.id, p_action: "get", p_package: packageId, p_mode: requireFoundationAction("get"),
  }) });
}
