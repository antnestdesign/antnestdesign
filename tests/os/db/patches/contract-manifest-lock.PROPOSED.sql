-- PROPOSED only. Validate on owned local Test DB; never apply to production here.
-- TEST ONLY candidate: protects integrity evidence, amounts and lineage.
-- Original production trigger/SQL is not modified by this candidate.
-- Does not rewrite stored hashes or repair existing contracts.
-- Rollback: drop the trigger then function. Review all state transitions first.
do $$ begin
  if not exists (select 1 from public.and_os_2b_test_marker where project_id='and-os-security-test') then
    raise exception 'Owned local test DB required';
  end if;
end $$;
create or replace function public.proposed_contract_manifest_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status in ('CONTRACTED','CHANGE_PENDING','SUPERSEDED','CANCELLED')
    and (
      old.package_manifest_hash is distinct from new.package_manifest_hash or
      old.source_hash is distinct from new.source_hash or
      old.package_version is distinct from new.package_version or
      old.original_contract_amount is distinct from new.original_contract_amount or
      old.prior_approved_change_total is distinct from new.prior_approved_change_total or
      old.amount_delta is distinct from new.amount_delta or
      old.revised_contract_amount is distinct from new.revised_contract_amount or
      old.parent_package_id is distinct from new.parent_package_id or
      old.originating_change_order_id is distinct from new.originating_change_order_id or
      old.estimate_id is distinct from new.estimate_id or
      old.estimate_revision is distinct from new.estimate_revision or
      old.contract_no is distinct from new.contract_no or
      old.contract_info is distinct from new.contract_info or
      old.parties_info is distinct from new.parties_info or
      old.site_manager is distinct from new.site_manager or
      old.estimate_snapshot is distinct from new.estimate_snapshot or
      old.document_options_snapshot is distinct from new.document_options_snapshot or
      old.spec_snapshot is distinct from new.spec_snapshot or
      old.clause_snapshot is distinct from new.clause_snapshot or
      old.payment_schedule is distinct from new.payment_schedule or
      old.template_version is distinct from new.template_version or
      old.rule_version is distinct from new.rule_version
    ) then
    raise exception 'locked contract integrity fields cannot be changed';
  end if;
  return new;
end $$;
revoke all on function public.proposed_contract_manifest_guard() from public, anon, authenticated;
drop trigger if exists proposed_contract_manifest_guard on public.contract_package_snapshots;
create trigger proposed_contract_manifest_guard before update on public.contract_package_snapshots
  for each row execute function public.proposed_contract_manifest_guard();
