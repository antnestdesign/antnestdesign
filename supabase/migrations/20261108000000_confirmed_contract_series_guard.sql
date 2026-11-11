BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
-- Keep the legacy duplicate-root guard, with a narrow same-series version exception.
CREATE OR REPLACE FUNCTION public.and_os_5b_contract_package_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE link public.contract_issued_sources%rowtype; pid uuid; marker text; scope text[]; independent boolean;
 root public.contract_package_snapshots;
BEGIN
 IF TG_OP='INSERT' AND NEW.preliminary_version_id IS NOT NULL THEN
  IF current_setting('and_os.contract_document_actor',true) IS DISTINCT FROM NEW.preliminary_issued_by::text THEN RAISE EXCEPTION 'confirmed_contract_command_required' USING ERRCODE='42501';END IF;
  IF NEW.preliminary_series_id<>NEW.id THEN
   SELECT * INTO root FROM public.contract_package_snapshots WHERE id=NEW.preliminary_series_id FOR SHARE;
   IF NOT FOUND OR root.preliminary_series_id IS DISTINCT FROM root.id OR root.preliminary_project_id IS DISTINCT FROM NEW.preliminary_project_id
    OR root.estimate_id<>NEW.estimate_id OR root.contract_no<>NEW.contract_no OR NEW.parent_package_id IS NOT NULL THEN RAISE EXCEPTION 'confirmed_contract_series_conflict' USING ERRCODE='23514';END IF;
   PERFORM pg_advisory_xact_lock(hashtextextended('original-contract:'||NEW.preliminary_project_id::text,0));
   IF EXISTS(SELECT 1 FROM public.contract_package_snapshots p JOIN public.estimates e ON e.id=p.estimate_id LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=e.id
    WHERE coalesce(p.preliminary_project_id,l.project_id,e.project_id,e.confirmation_project_id)=NEW.preliminary_project_id AND p.parent_package_id IS NULL AND p.status<>'CANCELLED'
     AND p.preliminary_series_id IS DISTINCT FROM NEW.preliminary_series_id) THEN RAISE EXCEPTION 'confirmed_contract_other_root_exists' USING ERRCODE='23505';END IF;
   RETURN NEW;
  END IF;
 END IF;
 IF TG_OP='INSERT' AND NEW.parent_package_id IS NULL THEN
  IF NEW.estimate_snapshot ? 'issued_version_id' AND current_setting('and_os.issued_contract',true) IS DISTINCT FROM NEW.estimate_snapshot->>'issued_version_id' THEN
   RAISE EXCEPTION '발행 견적 계약 생성 경로를 사용해 주세요.' USING ERRCODE='42501';END IF;
  SELECT coalesce(l.project_id,e.project_id) INTO pid FROM public.estimates e LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=e.id WHERE e.id=NEW.estimate_id;
  IF pid IS NOT NULL THEN
   PERFORM pg_advisory_xact_lock(hashtextextended('original-contract:'||pid::text,0));
   marker:=current_setting('and_os.issued_contract',true);independent:=coalesce(current_setting('and_os.contract_independent',true),'')='true';scope:=string_to_array(coalesce(current_setting('and_os.contract_scope',true),''),',');
   IF EXISTS(SELECT FROM public.contract_package_snapshots p JOIN public.estimates e ON e.id=p.estimate_id LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=e.id LEFT JOIN public.contract_issued_sources s ON s.package_id=p.id
    WHERE coalesce(l.project_id,e.project_id)=pid AND p.parent_package_id IS NULL AND p.status<>'CANCELLED'
     AND (coalesce(marker,'')='' OR NOT independent OR s.package_id IS NULL OR NOT s.independent_scope OR s.scope_trades && scope)) THEN
    RAISE EXCEPTION '동일 공사범위의 원계약이 이미 있습니다. 기존 계약을 확인해 주세요.' USING ERRCODE='23505';END IF;
  END IF;
 ELSIF TG_OP='UPDATE' THEN
  SELECT * INTO link FROM public.contract_issued_sources WHERE package_id=OLD.id;
  IF FOUND THEN
   IF NEW.estimate_snapshot IS DISTINCT FROM OLD.estimate_snapshot OR NEW.contract_info IS DISTINCT FROM OLD.contract_info OR NEW.document_options_snapshot IS DISTINCT FROM OLD.document_options_snapshot OR NEW.estimate_id IS DISTINCT FROM OLD.estimate_id THEN RAISE EXCEPTION '계약 기준 발행본과 계약 내용은 변경할 수 없습니다.' USING ERRCODE='42501';END IF;
   IF NEW.status='CONTRACTED' AND OLD.status IS DISTINCT FROM 'CONTRACTED' THEN
    IF current_setting('and_os.confirm_issued',true) IS DISTINCT FROM OLD.id::text THEN RAISE EXCEPTION '발행 견적 계약의 확인 경로를 사용해 주세요.' USING ERRCODE='42501';END IF;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.and_os_5b_contract_package_guard() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
