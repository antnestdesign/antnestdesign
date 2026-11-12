BEGIN;
DO $$
DECLARE a uuid; e public.estimates; p public.projects; log_count bigint; version_count bigint; doc_count bigint;
BEGIN
  SELECT id INTO STRICT a FROM public.profiles WHERE role='admin' AND is_active AND NOT must_change_password LIMIT 1;
  SELECT * INTO STRICT e FROM public.estimates LIMIT 1;
  INSERT INTO public.projects(id,project_name) VALUES(gen_random_uuid(),'Synthetic archive contract') RETURNING * INTO p;
  SELECT count(*) INTO log_count FROM public.os_audit_logs;
  SELECT count(*) INTO version_count FROM public.preliminary_estimate_versions;
  SELECT count(*) INTO doc_count FROM public.contract_document_versions;
  BEGIN
    PERFORM public.and_os_archive_list_item(gen_random_uuid(),'estimate',e.id,false,e.revision);
    RAISE EXCEPTION 'unauthorized operation succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.and_os_archive_list_item(a,'estimate',e.id,false,e.revision+1);
    RAISE EXCEPTION 'stale revision succeeded';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  ASSERT NOT has_function_privilege('authenticated','public.and_os_archive_list_item(uuid,text,uuid,boolean,bigint)','execute');
  ASSERT NOT has_table_privilege('service_role','public.os_list_archive','insert,update,delete');
  ASSERT public.and_os_archive_list_item(a,'estimate',e.id,false,e.revision);
  ASSERT NOT public.and_os_archive_list_item(a,'estimate',e.id,false,e.revision);
  ASSERT public.and_os_archive_list_item(a,'legacy_contract',e.id,false);
  ASSERT public.and_os_archive_list_item(a,'contract',p.id,false);
  ASSERT (SELECT count(*)=3 AND bool_and(deleted_by=a AND deleted_at IS NOT NULL) FROM public.os_list_archive);
  ASSERT public.and_os_archive_list_item(a,'estimate',e.id,true);
  ASSERT public.and_os_archive_list_item(a,'legacy_contract',e.id,true);
  ASSERT public.and_os_archive_list_item(a,'contract',p.id,true);
  ASSERT NOT EXISTS (SELECT FROM public.os_list_archive);
  ASSERT (SELECT to_jsonb(s)=to_jsonb(e) FROM public.estimates s WHERE id=e.id);
  ASSERT (SELECT to_jsonb(s)=to_jsonb(p) FROM public.projects s WHERE id=p.id);
  ASSERT (SELECT count(*)=version_count FROM public.preliminary_estimate_versions);
  ASSERT (SELECT count(*)=doc_count FROM public.contract_document_versions);
  ASSERT (SELECT count(*)=log_count+6 FROM public.os_audit_logs);
  ASSERT public.and_os_save_estimate(a,e.id,e.revision,NULL,true)->>'deleted'='true';
  ASSERT EXISTS (SELECT FROM public.estimates WHERE id=e.id);
END $$;
ROLLBACK;
