BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.and_os_guard_project_flow_contract_document() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE pid uuid; active boolean;
BEGIN
  IF TG_OP='INSERT' OR (NEW.status='CONTRACTED' AND OLD.status IS DISTINCT FROM 'CONTRACTED') THEN
    pid:=public.and_os_preliminary_project(NEW.estimate_id);
    IF pid IS NOT NULL THEN
      SELECT flow_version_id IS NOT NULL INTO active FROM public.projects WHERE id=pid FOR SHARE;
      IF active THEN RAISE EXCEPTION '프로젝트의 계약 기준 확정 견적과 연결되지 않은 기존 문서 생성·확정 경로는 사용할 수 없습니다.' USING ERRCODE='42501'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER project_flow_contract_document_guard BEFORE INSERT OR UPDATE ON public.contract_package_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_project_flow_contract_document();
REVOKE ALL ON FUNCTION public.and_os_guard_project_flow_contract_document() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
