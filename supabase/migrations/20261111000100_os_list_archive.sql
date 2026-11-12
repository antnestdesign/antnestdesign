BEGIN;
CREATE TABLE public.os_list_archive (
  kind text NOT NULL CHECK (kind IN ('estimate','contract','legacy_contract')),
  target_id uuid NOT NULL,
  estimate_id uuid REFERENCES public.estimates(id),
  project_id uuid REFERENCES public.projects(id),
  deleted_by uuid NOT NULL,
  deleted_at timestamptz NOT NULL,
  PRIMARY KEY (kind,target_id),
  CHECK ((kind='contract' AND project_id IS NOT NULL AND project_id=target_id AND estimate_id IS NULL)
      OR (kind<>'contract' AND estimate_id IS NOT NULL AND estimate_id=target_id AND project_id IS NULL))
);
CREATE INDEX ON public.os_list_archive(estimate_id);
CREATE INDEX ON public.os_list_archive(project_id);
ALTER TABLE public.os_list_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.os_list_archive FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.os_list_archive TO service_role;

CREATE FUNCTION public.and_os_archive_list_item(p_actor uuid,p_kind text,p_id uuid,p_restore boolean,p_revision bigint DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE actor public.profiles; label text; rev bigint; stamp timestamptz := clock_timestamp(); prior jsonb;
BEGIN
  SELECT * INTO actor FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF NOT FOUND OR actor.role IS DISTINCT FROM 'admin' OR actor.is_active IS NOT TRUE OR actor.must_change_password IS NOT FALSE THEN
    RAISE EXCEPTION 'archive_admin_required' USING ERRCODE='42501';
  END IF;
  IF p_kind IS NULL OR p_kind NOT IN ('estimate','contract','legacy_contract') OR p_restore IS NULL THEN
    RAISE EXCEPTION 'archive_invalid_request' USING ERRCODE='22023';
  END IF;
  IF p_kind='contract' THEN
    SELECT project_name INTO label FROM public.projects WHERE id=p_id FOR UPDATE;
  ELSE
    SELECT project_name,revision INTO label,rev FROM public.estimates WHERE id=p_id FOR UPDATE;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'archive_not_found' USING ERRCODE='P0002'; END IF;
  IF p_kind='estimate' AND NOT p_restore AND rev IS DISTINCT FROM p_revision THEN
    RAISE EXCEPTION 'archive_revision_conflict' USING ERRCODE='40001';
  END IF;
  SELECT jsonb_build_object('deleted_by',deleted_by,'deleted_at',deleted_at) INTO prior
    FROM public.os_list_archive WHERE kind=p_kind AND target_id=p_id;
  IF p_restore THEN
    DELETE FROM public.os_list_archive WHERE kind=p_kind AND target_id=p_id;
  ELSE
    INSERT INTO public.os_list_archive(kind,target_id,estimate_id,project_id,deleted_by,deleted_at)
    VALUES(p_kind,p_id,CASE WHEN p_kind<>'contract' THEN p_id END,CASE WHEN p_kind='contract' THEN p_id END,p_actor,stamp)
    ON CONFLICT DO NOTHING;
  END IF;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO public.os_audit_logs(id,created_at,actor_user_id,actor_name,actor_role,action,target_type,target_id,target_label,before_data,after_data,result)
  VALUES(gen_random_uuid(),stamp,p_actor,actor.name,actor.role,CASE WHEN p_restore THEN 'LIST_ITEM_RESTORED' ELSE 'LIST_ITEM_ARCHIVED' END,
    p_kind,p_id::text,label,prior,CASE WHEN NOT p_restore THEN jsonb_build_object('deleted_by',p_actor,'deleted_at',stamp) END,'SUCCESS');
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.and_os_archive_list_item(uuid,text,uuid,boolean,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_archive_list_item(uuid,text,uuid,boolean,bigint) TO service_role;

-- Older application instances still call the original delete branch during a rollout.
CREATE OR REPLACE FUNCTION public.and_os_save_estimate(p_actor uuid,p_id uuid,p_expected_revision bigint,p_row jsonb,p_delete boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE state text;
BEGIN
  IF p_delete THEN
    RETURN jsonb_build_object('deleted',public.and_os_archive_list_item(p_actor,'estimate',p_id,false,p_expected_revision));
  END IF;
  PERFORM 1 FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF p_id IS NOT NULL THEN
    SELECT confirmation_state INTO state FROM public.estimates WHERE id=p_id FOR UPDATE;
    IF state='confirmed' THEN RAISE EXCEPTION 'estimate_locked' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN public.and_os_save_estimate_phase1(p_actor,p_id,p_expected_revision,p_row,p_delete);
END $$;
COMMIT;
