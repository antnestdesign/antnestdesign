import { NextRequest } from "next/server";
import {
  errorResponse,
  getUserContext,
  json,
  supabaseFetch,
  writeAuditLog,
} from "../_lib/server";
import {
  assertCanCreateContractPackage,
  assertContractNoAvailable,
  assertPackageEstimateScope,
  assertUuid,
  buildContractDocuments,
  buildContractPackageSnapshot,
  assertNoContractedPackage,
  assertNoSavedContractPackage,
  issueContractNoForEstimate,
  normalizeContractOptions,
  projectContractPackage,
  requireEstimateScopeForStaff,
  sanitizePackageList,
} from "./_lib/contracts";

export async function GET(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    const url = new URL(request.url);
    const estimateId = url.searchParams.get("estimateId")
      ? assertUuid(url.searchParams.get("estimateId"), "저장 견적 ID")
      : null;
    const keyword = (url.searchParams.get("q") || "").trim().toLowerCase();
    requireEstimateScopeForStaff(context, estimateId);
    const filters = [
      "select=*,contract_document_versions(*)",
      "order=created_at.desc",
    ];
    if (estimateId) filters.push(`estimate_id=eq.${encodeURIComponent(estimateId)}`);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      `/rest/v1/contract_package_snapshots?${filters.join("&")}`,
    );
    const filteredRows = keyword
      ? rows.filter((row) => {
        const contractInfo = row.contract_info && typeof row.contract_info === "object"
          ? row.contract_info as Record<string, unknown>
          : {};
        const estimateSnapshot = row.estimate_snapshot && typeof row.estimate_snapshot === "object"
          ? row.estimate_snapshot as Record<string, unknown>
          : {};
        const partiesInfo = row.parties_info && typeof row.parties_info === "object"
          ? row.parties_info as Record<string, unknown>
          : {};
        const customer = partiesInfo.customer && typeof partiesInfo.customer === "object"
          ? partiesInfo.customer as Record<string, unknown>
          : {};
        const haystack = [
          row.contract_no,
          contractInfo.project_name,
          contractInfo.site_address,
          contractInfo.construction_type,
          estimateSnapshot.project_name,
          estimateSnapshot.customer_name,
          estimateSnapshot.customer_phone,
          estimateSnapshot.site_address,
          customer.name,
          customer.phone,
          customer.address,
        ].map((value) => String(value || "").toLowerCase()).join(" ");
        return haystack.includes(keyword);
      })
      : rows;
    return json(sanitizePackageList(filteredRows, context.profile.role));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await getUserContext(request);
    assertCanCreateContractPackage(context);
    const body = (await request.json()) as Record<string, unknown>;
    const estimateId = assertUuid(body.estimate_id, "저장 견적 ID");
    await assertNoContractedPackage(estimateId);
    await assertNoSavedContractPackage(estimateId);
    const options = body.options && typeof body.options === "object"
      ? normalizeContractOptions(body.options as Record<string, unknown>)
      : normalizeContractOptions({});
    const contractNo = await issueContractNoForEstimate(estimateId, options, context.authUser.id);
    if (options.contract_no) await assertContractNoAvailable(estimateId, options.contract_no);
    const snapshot = await buildContractPackageSnapshot(estimateId, options, contractNo);
    const documents = buildContractDocuments(snapshot);
    const rows = await supabaseFetch<Array<Record<string, unknown>>>(
      "/rest/v1/rpc/create_contract_package_snapshot",
      {
        method: "POST",
        body: JSON.stringify({
          p_actor_user_id: context.authUser.id,
          p_payload: {
            estimate_id: estimateId,
            contract_no: snapshot.contract_no,
            estimate_revision: snapshot.estimate_revision,
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
            documents,
          },
        }),
      },
    );
    const contractPackage = Array.isArray(rows) ? rows[0] : rows;
    if (!contractPackage) throw new Error("계약 패키지 생성 결과가 비어 있습니다.");
    assertPackageEstimateScope(contractPackage || {}, estimateId);
    await writeAuditLog(context, {
      action: "CONTRACT_PACKAGE_CREATED",
      target_type: "contract_package",
      target_id: contractPackage?.id ? String(contractPackage.id) : null,
      target_label: `${snapshot.contract_no} v${contractPackage?.package_version || ""}`,
      after_data: {
        estimate_id: estimateId,
        contract_no: snapshot.contract_no,
        package_version: contractPackage?.package_version,
        status: "READY",
        source_hash: snapshot.source_hash,
      },
    });
    return json(projectContractPackage(contractPackage, context.profile.role), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
