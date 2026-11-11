BEGIN;
CREATE FUNCTION public.and_os_guard_project_flow_contract_options() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE pid uuid; active boolean;
BEGIN
  pid:=public.and_os_preliminary_project(NEW.estimate_id);
  IF pid IS NOT NULL THEN
    SELECT flow_version_id IS NOT NULL INTO active FROM public.projects WHERE id=pid FOR SHARE;
    IF active THEN RAISE EXCEPTION '확정 견적 기준이 고정된 프로젝트의 구형 계약 옵션·계약번호 예약은 변경할 수 없습니다.' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER project_flow_contract_options_guard BEFORE INSERT OR UPDATE ON public.estimate_document_options
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_project_flow_contract_options();
REVOKE ALL ON FUNCTION public.and_os_guard_project_flow_contract_options() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
