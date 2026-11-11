BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
CREATE FUNCTION public.and_os_link_confirmed_contract(p_actor uuid,p_project uuid,p_package uuid,p_revision bigint,p_request uuid,p_signed boolean,p_mode text DEFAULT 'OFF')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.profiles;pr public.projects;p public.contract_package_snapshots;doc uuid;previous public.os_audit_logs;r jsonb;
BEGIN
 IF p_mode IS DISTINCT FROM 'ON' THEN RAISE EXCEPTION 'confirmed_contract_read_only' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.profiles WHERE id=p_actor FOR SHARE;
 IF NOT FOUND OR a.role IS NULL OR a.role NOT IN ('admin','manager') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE OR p_signed IS NOT TRUE OR p_request IS NULL THEN RAISE EXCEPTION 'confirmed_contract_access_denied' USING ERRCODE='42501';END IF;
 SELECT * INTO pr FROM public.projects WHERE id=p_project FOR UPDATE;
 SELECT * INTO p FROM public.contract_package_snapshots WHERE id=p_package FOR UPDATE;
 IF pr.id IS NULL OR p.id IS NULL OR pr.flow_contract_at IS NULL OR p.preliminary_project_id IS DISTINCT FROM pr.id OR p.preliminary_version_id IS DISTINCT FROM pr.flow_version_id
  OR NOT public.and_os_estimate_can_edit(a.id,p.estimate_id) THEN RAISE EXCEPTION 'confirmed_contract_source_conflict' USING ERRCODE='42501';END IF;
 SELECT * INTO previous FROM public.os_audit_logs WHERE actor_user_id=a.id AND action='PROJECT_FLOW_CONTRACT_DOCUMENT_LINKED' AND after_data->>'request_id'=p_request::text;
 IF FOUND THEN
  IF previous.target_id<>pr.id::text OR previous.after_data->>'flow_package_id'<>p.id::text THEN RAISE EXCEPTION 'confirmed_contract_request_conflict' USING ERRCODE='23514';END IF;
  RETURN previous.after_data->'result';
 END IF;
 IF pr.flow_revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'confirmed_contract_revision_conflict' USING ERRCODE='40001';END IF;
 IF pr.flow_package_id IS NOT NULL OR pr.flow_contract_document_id IS NOT NULL OR p.status<>'READY' THEN RAISE EXCEPTION 'confirmed_contract_signed_link_locked' USING ERRCODE='23514';END IF;
 IF pr.flow_contract_amount IS DISTINCT FROM (CASE WHEN pr.flow_amount_basis='supply' THEN (p.contract_info->>'supply_amount')::numeric ELSE (p.contract_info->>'total_amount')::numeric END) THEN RAISE EXCEPTION 'confirmed_contract_signed_amount_locked' USING ERRCODE='23514';END IF;
 SELECT id INTO doc FROM public.contract_document_versions WHERE package_id=p.id AND document_type='CONTRACT' AND pdf_bytes IS NOT NULL;
 IF doc IS NULL THEN RAISE EXCEPTION 'confirmed_contract_pdf_invalid' USING ERRCODE='23514';END IF;
 PERFORM set_config('and_os.contract_document_actor',a.id::text,true);
 UPDATE public.contract_package_snapshots SET status='CONTRACTED',confirmed_by=a.id,confirmed_at=clock_timestamp() WHERE id=p.id;
 PERFORM set_config('and_os.project_flow_actor',a.id::text,true);
 UPDATE public.projects SET flow_package_id=p.id,flow_contract_document_id=doc,flow_revision=flow_revision+1 WHERE id=pr.id;
 r:=jsonb_build_object('projectId',pr.id,'revision',(pr.flow_revision+1)::text,'packageId',p.id,'documentId',doc);
 INSERT INTO public.os_audit_logs(actor_user_id,actor_name,actor_role,action,target_type,target_id,result,before_data,after_data)
 VALUES(a.id,coalesce(a.name,'이름 미등록'),a.role,'PROJECT_FLOW_CONTRACT_DOCUMENT_LINKED','project',pr.id::text,'SUCCESS',jsonb_build_object('flow_package_id',pr.flow_package_id,'flow_contract_document_id',pr.flow_contract_document_id),jsonb_build_object('flow_package_id',p.id,'flow_contract_document_id',doc,'flow_version_id',pr.flow_version_id,'signed_acknowledged',true,'request_id',p_request,'result',r));
 PERFORM set_config('and_os.contract_document_actor','',true);PERFORM set_config('and_os.project_flow_actor','',true);
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.and_os_link_confirmed_contract(uuid,uuid,uuid,bigint,uuid,boolean,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_link_confirmed_contract(uuid,uuid,uuid,bigint,uuid,boolean,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
