-- TEST FIXTURE CLEANUP ONLY: never run against a hosted/non-owned DB.
-- Locked synthetic contracts require privileged, transaction-scoped cleanup.
do $$ begin
  if not exists (select 1 from public.and_os_2b_test_marker where project_id='and-os-security-test') then
    raise exception 'Test ownership marker required';
  end if;
end $$;
drop trigger if exists test_integrity_document_failure on public.contract_document_versions;
drop trigger if exists test_integrity_publish_failure on public.cost_publish_log;
drop trigger if exists test_integrity_history_gate on public.cost_item_history;
drop function if exists public.test_integrity_fail();
drop function if exists public.test_integrity_history_check();
select set_config('request.and_os_cost_rpc','on',true);
delete from public.cost_item_history where cost_item_id in
  ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');
delete from public.cost_items where id in
  ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');
alter table public.contract_package_snapshots disable trigger contract_package_state_guard;
alter table public.contract_package_snapshots disable trigger proposed_contract_manifest_guard;
alter table public.contract_document_versions disable trigger contract_document_lock_guard;
alter table public.change_orders disable trigger change_order_lock_guard;
alter table public.change_order_approvals disable trigger change_order_approval_immutable_guard;
delete from public.os_audit_logs where target_id in (
  select id::text from public.contract_package_snapshots where estimate_id in
    ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012')
);
delete from public.change_order_approvals where change_order_id in (
  select id from public.change_orders where estimate_id in
    ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012')
);
update public.contract_package_snapshots set originating_change_order_id=null
  where estimate_id in ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
delete from public.change_orders where estimate_id in
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
delete from public.contract_document_versions where package_id in (
  select id from public.contract_package_snapshots where estimate_id in
    ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012')
);
delete from public.contract_package_snapshots where parent_package_id is not null and estimate_id in
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
delete from public.contract_package_snapshots where estimate_id in
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
delete from public.estimate_document_options where estimate_id in
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
alter table public.contract_package_snapshots enable trigger contract_package_state_guard;
alter table public.contract_package_snapshots enable trigger proposed_contract_manifest_guard;
alter table public.contract_document_versions enable trigger contract_document_lock_guard;
alter table public.change_orders enable trigger change_order_lock_guard;
alter table public.change_order_approvals enable trigger change_order_approval_immutable_guard;
