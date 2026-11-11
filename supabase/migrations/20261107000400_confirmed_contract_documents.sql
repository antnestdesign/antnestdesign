BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';
ALTER TABLE public.contract_package_snapshots
 ADD COLUMN preliminary_project_id uuid REFERENCES public.projects(id),
 ADD COLUMN preliminary_version_id uuid REFERENCES public.preliminary_estimate_versions(id),
 ADD COLUMN preliminary_series_id uuid REFERENCES public.contract_package_snapshots(id),
 ADD COLUMN preliminary_request_id uuid,
 ADD COLUMN preliminary_fingerprint text,
 ADD COLUMN preliminary_issued_at timestamptz,
 ADD COLUMN preliminary_issued_by uuid REFERENCES public.profiles(id),
 ADD COLUMN preliminary_issuer_name text,
 ADD CONSTRAINT preliminary_contract_source_complete CHECK(preliminary_version_id IS NULL OR
  (preliminary_project_id IS NOT NULL AND preliminary_series_id IS NOT NULL AND preliminary_request_id IS NOT NULL AND preliminary_fingerprint IS NOT NULL
   AND preliminary_issued_at IS NOT NULL AND preliminary_issued_by IS NOT NULL AND preliminary_issuer_name IS NOT NULL AND status IN ('READY','CONTRACTED')));
CREATE UNIQUE INDEX preliminary_contract_request_unique ON public.contract_package_snapshots(preliminary_issued_by,preliminary_request_id) WHERE preliminary_version_id IS NOT NULL;
CREATE UNIQUE INDEX preliminary_contract_content_unique ON public.contract_package_snapshots(preliminary_project_id,preliminary_fingerprint) WHERE preliminary_version_id IS NOT NULL;
CREATE INDEX preliminary_contract_project_idx ON public.contract_package_snapshots(preliminary_project_id,package_version DESC) WHERE preliminary_version_id IS NOT NULL;
ALTER TABLE public.contract_document_versions ADD COLUMN pdf_bytes bytea,ADD COLUMN pdf_sha256 text,
 ADD CONSTRAINT contract_pdf_integrity CHECK(pdf_bytes IS NULL OR
  (octet_length(pdf_bytes) BETWEEN 1000 AND 6000000 AND substring(pdf_bytes FROM 1 FOR 5)=convert_to('%PDF-','UTF8') AND pdf_sha256=encode(extensions.digest(pdf_bytes,'sha256'),'hex') AND mime_type='application/pdf'));
ALTER TABLE public.projects ADD COLUMN flow_contract_document_id uuid REFERENCES public.contract_document_versions(id);

CREATE OR REPLACE FUNCTION public.and_os_guard_project_flow_contract_document() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE pid uuid; active boolean;
BEGIN
 IF TG_OP='INSERT' OR (NEW.status='CONTRACTED' AND OLD.status IS DISTINCT FROM 'CONTRACTED') THEN
  pid:=public.and_os_preliminary_project(NEW.estimate_id);
  IF pid IS NOT NULL THEN
   SELECT flow_version_id IS NOT NULL INTO active FROM public.projects WHERE id=pid FOR SHARE;
   IF active AND (NEW.preliminary_project_id IS DISTINCT FROM pid OR NEW.preliminary_version_id IS NULL
     OR coalesce(current_setting('and_os.contract_document_actor',true),'')='') THEN
    RAISE EXCEPTION 'confirmed_contract_command_required' USING ERRCODE='42501';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION public.and_os_guard_confirmed_contract() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='DELETE' AND OLD.preliminary_version_id IS NOT NULL THEN RAISE EXCEPTION 'issued_contract_immutable' USING ERRCODE='42501';END IF;
 IF TG_OP='INSERT' AND NEW.preliminary_version_id IS NOT NULL AND coalesce(current_setting('and_os.contract_document_actor',true),'')='' THEN RAISE EXCEPTION 'confirmed_contract_command_required' USING ERRCODE='42501';END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.preliminary_version_id IS NOT NULL THEN
   IF (to_jsonb(NEW)-ARRAY['status','confirmed_by','confirmed_at','updated_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','confirmed_by','confirmed_at','updated_at'])
    OR NEW.status<> 'CONTRACTED' OR OLD.status<>'READY' OR coalesce(current_setting('and_os.contract_document_actor',true),'')='' THEN
     RAISE EXCEPTION 'issued_contract_immutable' USING ERRCODE='42501';END IF;
  ELSIF NEW.preliminary_version_id IS NOT NULL THEN RAISE EXCEPTION 'legacy_contract_source_immutable' USING ERRCODE='42501';END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE TRIGGER confirmed_contract_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.contract_package_snapshots FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_confirmed_contract();
CREATE FUNCTION public.and_os_guard_confirmed_contract_pdf() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE pid uuid;
BEGIN
 pid:=CASE WHEN TG_OP='DELETE' THEN OLD.package_id ELSE NEW.package_id END;
 IF EXISTS(SELECT 1 FROM public.contract_package_snapshots WHERE id=pid AND preliminary_version_id IS NOT NULL) THEN
  IF TG_OP<>'INSERT' OR coalesce(current_setting('and_os.contract_document_actor',true),'')='' OR NEW.pdf_bytes IS NULL OR NEW.pdf_sha256 IS NULL OR NEW.locked_at IS NULL THEN
   RAISE EXCEPTION 'issued_contract_pdf_immutable' USING ERRCODE='42501';END IF;
 END IF;
 IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM public.contract_package_snapshots WHERE id=OLD.package_id AND preliminary_version_id IS NOT NULL) THEN RAISE EXCEPTION 'issued_contract_pdf_immutable' USING ERRCODE='42501';END IF;
 IF TG_OP='DELETE' THEN RETURN OLD;END IF;RETURN NEW;
END $$;
CREATE TRIGGER confirmed_contract_pdf_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.contract_document_versions FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_confirmed_contract_pdf();
CREATE FUNCTION public.and_os_guard_contract_truncate() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN RAISE EXCEPTION 'contract_archive_immutable' USING ERRCODE='42501';END $$;
CREATE TRIGGER confirmed_contract_no_truncate BEFORE TRUNCATE ON public.contract_package_snapshots FOR EACH STATEMENT EXECUTE FUNCTION public.and_os_guard_contract_truncate();
CREATE TRIGGER confirmed_contract_pdf_no_truncate BEFORE TRUNCATE ON public.contract_document_versions FOR EACH STATEMENT EXECUTE FUNCTION public.and_os_guard_contract_truncate();

CREATE FUNCTION public.and_os_issue_confirmed_contract(p_actor uuid,p_project uuid,p_version uuid,p_revision bigint,p_request uuid,p_fingerprint text,p_snapshot jsonb,p_documents jsonb,p_mode text DEFAULT 'OFF')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.profiles;pr public.projects;v public.preliminary_estimate_versions;existing public.contract_package_snapshots;
 pid uuid:=gen_random_uuid();series uuid;no text;n integer;stamp timestamptz:=clock_timestamp();doc jsonb;bytes bytea;amt numeric;expected numeric;
BEGIN
 IF p_mode<>'ON' OR p_mode IS NULL THEN RAISE EXCEPTION 'confirmed_contract_read_only' USING ERRCODE='42501';END IF;
 SELECT * INTO a FROM public.profiles WHERE id=p_actor FOR SHARE;
 IF NOT FOUND OR a.role IS NULL OR a.role NOT IN ('admin','manager') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE THEN RAISE EXCEPTION 'confirmed_contract_access_denied' USING ERRCODE='42501';END IF;
 SELECT * INTO pr FROM public.projects WHERE id=p_project FOR UPDATE;
 IF NOT FOUND OR pr.flow_version_id IS DISTINCT FROM p_version THEN RAISE EXCEPTION 'confirmed_contract_source_conflict' USING ERRCODE='23514';END IF;
 SELECT * INTO v FROM public.preliminary_estimate_versions WHERE id=p_version AND project_id=p_project AND estimate_id=pr.flow_estimate_id FOR SHARE;
 IF NOT FOUND OR NOT public.and_os_estimate_can_edit(a.id,v.estimate_id) THEN RAISE EXCEPTION 'confirmed_contract_access_denied' USING ERRCODE='42501';END IF;
 IF p_request IS NULL OR p_fingerprint IS NULL OR p_fingerprint!~'^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'confirmed_contract_invalid_request' USING ERRCODE='22023';END IF;
 SELECT * INTO existing FROM public.contract_package_snapshots WHERE preliminary_issued_by=a.id AND preliminary_request_id=p_request;
 IF FOUND THEN
  IF existing.preliminary_project_id<>p_project OR existing.preliminary_fingerprint<>p_fingerprint THEN RAISE EXCEPTION 'confirmed_contract_request_conflict' USING ERRCODE='23514';END IF;
  RETURN jsonb_build_object('id',existing.id,'version',existing.package_version,'contractId',existing.preliminary_series_id);
 END IF;
 IF pr.flow_revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'confirmed_contract_revision_conflict' USING ERRCODE='40001';END IF;
 IF p_documents IS NULL OR jsonb_typeof(p_documents) IS DISTINCT FROM 'array' OR jsonb_array_length(p_documents)<>3 OR (SELECT count(DISTINCT value->>'document_type') FROM jsonb_array_elements(p_documents))<>3
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_documents) d WHERE d->>'document_type' NOT IN ('CONTRACT','QUOTE','SPEC')) THEN RAISE EXCEPTION 'confirmed_contract_three_pdfs_required' USING ERRCODE='23514';END IF;
 amt:=(p_snapshot#>>'{contract_info,total_amount}')::numeric;
 IF amt IS NULL OR amt<=0 OR amt<>trunc(amt) OR (p_snapshot#>>'{contract_info,preliminary_version_id}')::uuid IS DISTINCT FROM v.id
  OR (p_snapshot->>'estimate_id')::uuid IS DISTINCT FROM v.estimate_id OR (p_snapshot#>>'{contract_info,project_id}')::uuid IS DISTINCT FROM pr.id
  OR (p_snapshot#>>'{estimate_snapshot,total_price}')::numeric IS DISTINCT FROM v.total_amount
  OR (p_snapshot#>>'{contract_info,supply_amount}')::numeric+(p_snapshot#>>'{contract_info,vat_amount}')::numeric IS DISTINCT FROM amt THEN RAISE EXCEPTION 'confirmed_contract_amount_invalid' USING ERRCODE='23514';END IF;
 expected:=CASE WHEN p_snapshot#>>'{contract_info,amount_basis}'='supply' THEN v.supply_amount ELSE v.total_amount END;
 IF (CASE WHEN p_snapshot#>>'{contract_info,amount_basis}'='supply' THEN (p_snapshot#>>'{contract_info,supply_amount}')::numeric ELSE amt END)<>expected
   AND (a.role<>'admin' OR nullif(trim(p_snapshot#>>'{contract_info,amount_reason}'),'') IS NULL OR p_snapshot#>>'{contract_info,amount_approved_by}'<>a.id::text) THEN RAISE EXCEPTION 'confirmed_contract_amount_approval_required' USING ERRCODE='42501';END IF;
 IF (SELECT sum((x->>'amount')::numeric) FROM jsonb_array_elements(p_snapshot->'payment_schedule') x) IS DISTINCT FROM amt
  OR (SELECT sum((x->>'ratio')::numeric) FROM jsonb_array_elements(p_snapshot->'payment_schedule') x)<>100 THEN RAISE EXCEPTION 'confirmed_contract_payment_invalid' USING ERRCODE='23514';END IF;
 IF pr.flow_contract_at IS NOT NULL AND (amt IS DISTINCT FROM CASE WHEN pr.flow_amount_basis='supply' THEN pr.flow_contract_amount+round(pr.flow_contract_amount*.1) ELSE pr.flow_contract_amount END) THEN RAISE EXCEPTION 'confirmed_contract_signed_amount_locked' USING ERRCODE='23514';END IF;
 SELECT preliminary_series_id,contract_no INTO series,no FROM public.contract_package_snapshots WHERE preliminary_project_id=pr.id ORDER BY package_version LIMIT 1;
 IF series IS NULL THEN series:=pid;no:=p_snapshot->>'contract_no';END IF;
 IF no IS NULL OR no!~'^AND-\d{4}-\d{2}-\d{3}$' OR no IS DISTINCT FROM p_snapshot->>'contract_no' THEN RAISE EXCEPTION 'confirmed_contract_number_conflict' USING ERRCODE='23514';END IF;
 PERFORM pg_advisory_xact_lock(hashtext('contract-no:'||no));
 IF EXISTS(SELECT 1 FROM public.contract_package_snapshots WHERE contract_no=no AND coalesce(preliminary_project_id,'00000000-0000-0000-0000-000000000000')<>pr.id)
  OR EXISTS(SELECT 1 FROM public.estimate_document_options WHERE contract_no=no AND estimate_id<>v.estimate_id) THEN RAISE EXCEPTION 'confirmed_contract_number_conflict' USING ERRCODE='23505';END IF;
 IF EXISTS(SELECT 1 FROM public.contract_package_snapshots WHERE preliminary_project_id=pr.id AND preliminary_fingerprint=p_fingerprint) THEN RAISE EXCEPTION 'confirmed_contract_duplicate_content' USING ERRCODE='23505';END IF;
 SELECT coalesce(max(package_version),0)+1 INTO n FROM public.contract_package_snapshots WHERE estimate_id=v.estimate_id;
 PERFORM set_config('and_os.contract_document_actor',a.id::text,true);
 INSERT INTO public.contract_package_snapshots(id,estimate_id,estimate_revision,package_version,contract_no,status,contract_info,parties_info,site_manager,estimate_snapshot,document_options_snapshot,spec_snapshot,clause_snapshot,payment_schedule,template_version,rule_version,source_hash,package_manifest_hash,original_contract_amount,prior_approved_change_total,amount_delta,revised_contract_amount,created_by,preliminary_project_id,preliminary_version_id,preliminary_series_id,preliminary_request_id,preliminary_fingerprint,preliminary_issued_at,preliminary_issued_by,preliminary_issuer_name)
 VALUES(pid,v.estimate_id,v.source_revision::text,n,no,'READY',p_snapshot->'contract_info',p_snapshot->'parties',p_snapshot->'site_manager',p_snapshot->'estimate_snapshot',p_snapshot->'document_options_snapshot',p_snapshot->'spec_snapshot',p_snapshot->'clause_snapshot',p_snapshot->'payment_schedule',p_snapshot->>'template_version',p_snapshot->>'rule_version',p_snapshot->>'source_hash',encode(extensions.digest(p_documents::text,'sha256'),'hex'),amt,0,0,amt,a.id,pr.id,v.id,series,p_request,p_fingerprint,stamp,a.id,coalesce(a.name,'이름 미등록'));
 FOR doc IN SELECT value FROM jsonb_array_elements(p_documents) LOOP
  bytes:=(doc->>'pdf_bytes')::bytea;
  IF doc->>'pdf_sha256' IS DISTINCT FROM encode(extensions.digest(bytes,'sha256'),'hex') OR jsonb_typeof(doc->'content_json')<>'object' THEN RAISE EXCEPTION 'confirmed_contract_pdf_invalid' USING ERRCODE='23514';END IF;
  INSERT INTO public.contract_document_versions(id,package_id,document_type,package_version,generation_status,content_json,content_hash,mime_type,created_by,locked_at,pdf_bytes,pdf_sha256)
   VALUES(gen_random_uuid(),pid,doc->>'document_type',n,'GENERATED',doc->'content_json',doc->>'content_hash','application/pdf',a.id,stamp,bytes,doc->>'pdf_sha256');
 END LOOP;
 PERFORM set_config('and_os.project_flow_actor',a.id::text,true);
 UPDATE public.projects SET flow_revision=flow_revision+1 WHERE id=pr.id;
 INSERT INTO public.os_audit_logs(actor_user_id,actor_name,actor_role,action,target_type,target_id,result,reason,before_data,after_data)
 VALUES(a.id,coalesce(a.name,'이름 미등록'),a.role,'PROJECT_FLOW_CONTRACT_DOCUMENT_ISSUED','project',pr.id::text,'SUCCESS',nullif(p_snapshot#>>'{contract_info,amount_reason}',''),jsonb_build_object('flow_revision',pr.flow_revision),jsonb_build_object('flow_revision',pr.flow_revision+1,'package_id',pid,'contract_id',series,'document_version',n,'flow_version_id',v.id,'amount',amt,'request_id',p_request));
 PERFORM set_config('and_os.project_flow_actor','',true);PERFORM set_config('and_os.contract_document_actor','',true);
 RETURN jsonb_build_object('id',pid,'version',n,'contractId',series);
END $$;

ALTER FUNCTION public.and_os_project_flow_command(uuid,uuid,text,bigint,uuid,jsonb,text) RENAME TO and_os_project_flow_command_phase4;
CREATE FUNCTION public.and_os_project_flow_command(p_actor uuid,p_project uuid,p_action text,p_revision bigint,p_request_id uuid,p_data jsonb DEFAULT '{}',p_mode text DEFAULT 'OFF')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE p public.contract_package_snapshots;pr public.projects;a public.profiles;r jsonb;doc_id uuid;
BEGIN
 IF p_action='contract' AND nullif(p_data->>'packageId','') IS NOT NULL THEN
  SELECT * INTO a FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF p_mode IS DISTINCT FROM 'ON' OR a.role IS NULL OR a.role NOT IN ('admin','manager') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE THEN RAISE EXCEPTION 'project_flow_access_denied' USING ERRCODE='42501';END IF;
  SELECT * INTO pr FROM public.projects WHERE id=p_project FOR UPDATE;
  SELECT * INTO p FROM public.contract_package_snapshots WHERE id=(p_data->>'packageId')::uuid FOR UPDATE;
  IF p.preliminary_version_id IS NOT NULL THEN
   IF p.preliminary_project_id IS DISTINCT FROM pr.id OR p.preliminary_version_id IS DISTINCT FROM pr.flow_version_id OR NOT public.and_os_estimate_can_edit(a.id,p.estimate_id)
    OR p_data->'signedAcknowledged' IS DISTINCT FROM 'true'::jsonb THEN RAISE EXCEPTION 'project_flow_document_scope_conflict' USING ERRCODE='42501';END IF;
   IF (p_data->>'amount')::numeric IS DISTINCT FROM (CASE WHEN p_data->>'amountBasis'='supply' THEN (p.contract_info->>'supply_amount')::numeric ELSE (p.contract_info->>'total_amount')::numeric END) THEN RAISE EXCEPTION 'project_flow_invalid_contract' USING ERRCODE='23514';END IF;
   IF p.status='READY' THEN
    IF pr.flow_revision IS DISTINCT FROM p_revision OR pr.flow_contract_at IS NOT NULL THEN RAISE EXCEPTION 'project_flow_revision_conflict' USING ERRCODE='40001';END IF;
    PERFORM set_config('and_os.contract_document_actor',a.id::text,true);
    UPDATE public.contract_package_snapshots SET status='CONTRACTED',confirmed_by=a.id,confirmed_at=clock_timestamp() WHERE id=p.id;
   END IF;
   r:=public.and_os_project_flow_command_phase4(p_actor,p_project,p_action,p_revision,p_request_id,p_data-'signedAcknowledged',p_mode);
   SELECT id INTO doc_id FROM public.contract_document_versions WHERE package_id=p.id AND document_type='CONTRACT';
   PERFORM set_config('and_os.project_flow_actor',a.id::text,true);
   IF pr.flow_contract_document_id IS DISTINCT FROM doc_id THEN
    UPDATE public.projects SET flow_contract_document_id=doc_id WHERE id=pr.id;
    INSERT INTO public.os_audit_logs(actor_user_id,actor_name,actor_role,action,target_type,target_id,result,before_data,after_data)
     VALUES(a.id,coalesce(a.name,'이름 미등록'),a.role,'PROJECT_FLOW_CONTRACT_DOCUMENT_LINKED','project',pr.id::text,'SUCCESS',jsonb_build_object('flow_contract_document_id',pr.flow_contract_document_id),jsonb_build_object('flow_contract_document_id',doc_id,'flow_package_id',p.id,'flow_version_id',p.preliminary_version_id,'signed_acknowledged',true));
   END IF;
   PERFORM set_config('and_os.project_flow_actor','',true);PERFORM set_config('and_os.contract_document_actor','',true);
   RETURN r;
  END IF;
 END IF;
 RETURN public.and_os_project_flow_command_phase4(p_actor,p_project,p_action,p_revision,p_request_id,p_data-'signedAcknowledged',p_mode);
END $$;
REVOKE ALL ON FUNCTION public.and_os_project_flow_command_phase4(uuid,uuid,text,bigint,uuid,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.and_os_guard_confirmed_contract(),public.and_os_guard_confirmed_contract_pdf(),public.and_os_guard_contract_truncate(),public.and_os_issue_confirmed_contract(uuid,uuid,uuid,bigint,uuid,text,jsonb,jsonb,text),public.and_os_project_flow_command(uuid,uuid,text,bigint,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_issue_confirmed_contract(uuid,uuid,uuid,bigint,uuid,text,jsonb,jsonb,text),public.and_os_project_flow_command(uuid,uuid,text,bigint,uuid,jsonb,text) TO service_role;
REVOKE ALL ON FUNCTION public.and_os_guard_confirmed_contract(),public.and_os_guard_confirmed_contract_pdf(),public.and_os_guard_contract_truncate() FROM service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
