BEGIN;
DO $$
DECLARE a uuid; staff uuid; seed jsonb; e uuid; old_e uuid; failed uuid; p uuid; rid uuid;
  rev bigint; fp text; result jsonb; before_projects bigint; before_customers bigint;
  title text:='Synthetic auto project '||gen_random_uuid()::text;
BEGIN
  SELECT id INTO STRICT a FROM public.profiles WHERE role='admin' AND is_active AND NOT must_change_password LIMIT 1;
  SELECT id INTO STRICT staff FROM public.profiles WHERE role='staff' AND is_active AND NOT must_change_password LIMIT 1;
  SELECT to_jsonb(x) INTO STRICT seed FROM public.estimates x
    WHERE public.and_os_preliminary_issues(to_jsonb(x))='[]' LIMIT 1;
  seed:=seed||jsonb_build_object('project_name',title,'client_name','Synthetic customer','phone','01000000000','address',title,'status','견적');
  e:=(public.and_os_save_estimate(a,NULL,NULL,seed)->>'id')::uuid;
  old_e:=(public.and_os_save_estimate(a,NULL,NULL,seed)->>'id')::uuid;
  failed:=(public.and_os_save_estimate(a,NULL,NULL,
    seed||jsonb_build_object('project_name',title||' failed','address',title||' failed','total_price',0))->>'id')::uuid;

  ASSERT NOT has_function_privilege('authenticated','public.and_os_confirm_estimate_with_project(uuid,uuid,bigint,uuid,text,uuid,text)','EXECUTE');
  ASSERT NOT has_function_privilege('anon','public.and_os_estimate_project_matches(uuid,uuid)','EXECUTE');
  ASSERT public.and_os_estimate_project_matches(a,e)='[]'::jsonb;
  SELECT revision INTO rev FROM public.estimates WHERE id=e;
  fp:=public.and_os_preliminary_fingerprint(e);
  SELECT count(*) INTO before_projects FROM public.projects;
  SELECT count(*) INTO before_customers FROM public.customers;
  ASSERT public.and_os_confirm_estimate_with_project(staff,e,rev,gen_random_uuid(),fp,NULL,'ON')->>'blocked'='403';
  BEGIN
    PERFORM public.and_os_confirm_estimate_with_project(a,e,rev,gen_random_uuid(),fp,NULL,'READ_ONLY');
    RAISE EXCEPTION 'read-only mode created a project';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.and_os_confirm_estimate_with_project(a,e,rev+1,gen_random_uuid(),fp,NULL,'ON');
    RAISE EXCEPTION 'stale revision succeeded';
  EXCEPTION WHEN serialization_failure THEN NULL;
  END;
  BEGIN
    PERFORM public.and_os_confirm_estimate_with_project(a,failed,(SELECT revision FROM public.estimates WHERE id=failed),
      gen_random_uuid(),public.and_os_preliminary_fingerprint(failed),NULL,'ON');
    RAISE EXCEPTION 'invalid total succeeded';
  EXCEPTION WHEN check_violation THEN
    ASSERT SQLERRM='preliminary_validation_failed';
  END;
  ASSERT (SELECT count(*)=before_projects FROM public.projects);
  ASSERT (SELECT count(*)=before_customers FROM public.customers);

  rid:=gen_random_uuid();
  result:=public.and_os_confirm_estimate_with_project(a,e,rev,rid,fp,NULL,'ON');
  ASSERT result->>'state'='confirmed';
  ASSERT public.and_os_confirm_estimate_with_project(a,e,rev,rid,fp,NULL,'ON')=result;
  p:=public.and_os_preliminary_project(e);
  ASSERT p IS NOT NULL;
  ASSERT (SELECT count(*)=before_projects+1 FROM public.projects);
  ASSERT (SELECT count(*)=before_customers+1 FROM public.customers);
  ASSERT public.and_os_estimate_project_matches(a,old_e)->0->>'id'=p::text;
  SELECT revision INTO rev FROM public.estimates WHERE id=old_e;
  fp:=public.and_os_preliminary_fingerprint(old_e);
  BEGIN
    PERFORM public.and_os_confirm_estimate_with_project(a,old_e,rev,gen_random_uuid(),fp,NULL,'ON');
    RAISE EXCEPTION 'duplicate candidate was ignored';
  EXCEPTION WHEN check_violation THEN
    ASSERT SQLERRM='preliminary_project_match_required';
  END;
  ASSERT public.and_os_confirm_estimate_with_project(a,old_e,rev,gen_random_uuid(),fp,p,'ON')->>'state'='confirmed';
  ASSERT public.and_os_preliminary_project(old_e)=p;
  ASSERT (SELECT count(*)=before_projects+1 FROM public.projects);
END $$;
ROLLBACK;
