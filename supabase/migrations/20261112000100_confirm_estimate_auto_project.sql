BEGIN;

CREATE FUNCTION public.and_os_estimate_project_matches(p_actor uuid,p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public.estimates; site text; addr text;
BEGIN
  IF NOT EXISTS(SELECT FROM public.profiles WHERE id=p_actor AND role IN ('admin','manager')
    AND is_active AND NOT must_change_password)
    OR NOT coalesce(public.and_os_estimate_can_edit(p_actor,p_id),false) THEN
    RETURN '[]'::jsonb;
  END IF;
  SELECT * INTO e FROM public.estimates WHERE id=p_id;
  IF NOT FOUND OR public.and_os_preliminary_project(p_id) IS NOT NULL THEN RETURN '[]'::jsonb; END IF;
  site:=regexp_replace(lower(coalesce(e.project_name,'')),'[[:space:]]+','','g');
  addr:=regexp_replace(lower(coalesce(e.address,'')),'[[:space:],]+','','g');
  RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',p.id,'project_name',p.project_name,'address',p.address,
    'archived',EXISTS(SELECT FROM public.os_list_archive a WHERE a.kind='contract' AND a.target_id=p.id)) ORDER BY p.created_at DESC NULLS LAST,p.id)
    FROM public.projects p
    WHERE (site<>'' AND regexp_replace(lower(p.project_name),'[[:space:]]+','','g')=site)
       OR (addr<>'' AND regexp_replace(lower(coalesce(p.address,'')),'[[:space:],]+','','g')=addr)), '[]'::jsonb);
END $$;

CREATE FUNCTION public.and_os_confirm_estimate_with_project(
  p_actor uuid,p_id uuid,p_revision bigint,p_request_id uuid,p_fingerprint text,p_project uuid,p_feature_mode text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public.estimates; actual uuid; matches jsonb; created jsonb; result jsonb; actor_role text;
BEGIN
  SELECT role INTO actor_role FROM public.profiles
    WHERE id=p_actor AND is_active AND NOT must_change_password FOR SHARE;
  IF actor_role IS NULL THEN RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE='42501'; END IF;
  IF actor_role NOT IN ('admin','manager') OR NOT coalesce(public.and_os_estimate_can_edit(p_actor,p_id),false) THEN
    RETURN public.and_os_preliminary_command(p_actor,p_id,'confirm',p_revision,p_request_id,p_fingerprint,p_project);
  END IF;
  actual:=public.and_os_preliminary_project(p_id);
  IF actual IS NOT NULL THEN
    RETURN public.and_os_preliminary_command(p_actor,p_id,'confirm',p_revision,p_request_id,p_fingerprint,coalesce(p_project,actual));
  END IF;
  IF p_feature_mode IS DISTINCT FROM 'ON' THEN RAISE EXCEPTION 'preliminary_project_read_only' USING ERRCODE='42501'; END IF;

  -- Serialize matching and creation with ordinary project inserts; reads remain available.
  LOCK TABLE public.projects IN SHARE ROW EXCLUSIVE MODE;
  SELECT * INTO STRICT e FROM public.estimates WHERE id=p_id FOR UPDATE;
  actual:=public.and_os_preliminary_project(p_id);
  IF actual IS NOT NULL THEN
    RETURN public.and_os_preliminary_command(p_actor,p_id,'confirm',p_revision,p_request_id,p_fingerprint,coalesce(p_project,actual));
  END IF;
  IF e.revision IS DISTINCT FROM p_revision
    OR p_fingerprint IS DISTINCT FROM public.and_os_preliminary_fingerprint(p_id) THEN
    RAISE EXCEPTION 'estimate_revision_conflict' USING ERRCODE='40001';
  END IF;
  IF NOT coalesce(public.and_os_estimate_can_edit(p_actor,p_id),false) THEN
    RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE='42501';
  END IF;
  matches:=public.and_os_estimate_project_matches(p_actor,p_id);
  IF p_project IS NOT NULL THEN
    IF NOT EXISTS(SELECT FROM jsonb_array_elements(matches) AS m WHERE m->>'id'=p_project::text AND m->>'archived'='false') THEN
      RAISE EXCEPTION 'preliminary_project_candidate_changed' USING ERRCODE='23514';
    END IF;
    actual:=p_project;
  ELSIF jsonb_array_length(matches)>0 THEN
    RAISE EXCEPTION 'preliminary_project_match_required' USING ERRCODE='23514';
  ELSE
    created:=public.and_os_5b_command(p_actor,'create-project',jsonb_build_object('selection',jsonb_build_object(
      'mode','new','project_name',e.project_name,'address',e.address,'area_pyeong',e.area_pyeong,
      'customer_mode',CASE WHEN nullif(btrim(e.client_name),'') IS NULL THEN 'undecided' ELSE 'new' END,
      'client_name',e.client_name,'phone',e.phone)),p_request_id,p_feature_mode);
    actual:=(created->>'project_id')::uuid;
  END IF;
  result:=public.and_os_preliminary_command(p_actor,p_id,'confirm',p_revision,p_request_id,p_fingerprint,actual);
  IF result->>'state' IS DISTINCT FROM 'confirmed' THEN
    RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE='42501';
  END IF;
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.and_os_estimate_project_matches(uuid,uuid),
  public.and_os_confirm_estimate_with_project(uuid,uuid,bigint,uuid,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_estimate_project_matches(uuid,uuid),
  public.and_os_confirm_estimate_with_project(uuid,uuid,bigint,uuid,text,uuid,text) TO service_role;
COMMIT;
