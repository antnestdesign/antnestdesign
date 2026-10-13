-- Fixture/fault-injection cleanup ONLY, after migrations have succeeded.
DO $$ BEGIN
  IF current_setting('and_os.test_stack',true) IS DISTINCT FROM 'and-os-migration-rebuild-test' THEN
    RAISE EXCEPTION 'Owned PG17 test session required';
  END IF;
END $$;
DROP TRIGGER IF EXISTS test_integrity_document_failure ON public.contract_document_versions;
DROP TRIGGER IF EXISTS test_integrity_publish_failure ON public.cost_publish_log;
DROP TRIGGER IF EXISTS test_integrity_history_gate ON public.cost_item_history;
DROP FUNCTION IF EXISTS public.test_integrity_fail();
DROP FUNCTION IF EXISTS public.test_integrity_history_check();
SELECT set_config('request.and_os_cost_rpc','on',true);
DELETE FROM public.cost_item_history WHERE cost_item_id IN
  ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');
DELETE FROM public.cost_items WHERE id IN
  ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000004');
ALTER TABLE public.contract_package_snapshots DISABLE TRIGGER contract_package_state_guard;
ALTER TABLE public.contract_package_snapshots DISABLE TRIGGER and_os_contract_manifest_guard;
ALTER TABLE public.contract_document_versions DISABLE TRIGGER contract_document_lock_guard;
ALTER TABLE public.change_orders DISABLE TRIGGER change_order_lock_guard;
ALTER TABLE public.change_order_approvals DISABLE TRIGGER change_order_approval_immutable_guard;
DELETE FROM public.os_audit_logs WHERE target_id IN (SELECT id::text FROM public.contract_package_snapshots WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012'));
DELETE FROM public.change_order_approvals WHERE change_order_id IN (SELECT id FROM public.change_orders WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012'));
UPDATE public.contract_package_snapshots SET originating_change_order_id=null WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
DELETE FROM public.change_orders WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
DELETE FROM public.contract_document_versions WHERE package_id IN (SELECT id FROM public.contract_package_snapshots WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012'));
DELETE FROM public.contract_package_snapshots WHERE parent_package_id IS NOT NULL AND estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
DELETE FROM public.contract_package_snapshots WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
DELETE FROM public.estimate_document_options WHERE estimate_id IN
  ('10000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000012');
ALTER TABLE public.contract_package_snapshots ENABLE TRIGGER contract_package_state_guard;
ALTER TABLE public.contract_package_snapshots ENABLE TRIGGER and_os_contract_manifest_guard;
ALTER TABLE public.contract_document_versions ENABLE TRIGGER contract_document_lock_guard;
ALTER TABLE public.change_orders ENABLE TRIGGER change_order_lock_guard;
ALTER TABLE public.change_order_approvals ENABLE TRIGGER change_order_approval_immutable_guard;
