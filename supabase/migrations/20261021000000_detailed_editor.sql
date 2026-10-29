-- Phase 5B-2~4: draft-only editor. No preliminary, contract or master data rewrite.
BEGIN;
SET LOCAL search_path = pg_catalog, public;
ALTER TABLE public.detailed_estimate_drafts
  ADD COLUMN editor_public_json jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(editor_public_json)='object'),
  ADD COLUMN editor_internal_json jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(editor_internal_json)='object');

CREATE FUNCTION public.and_os_5b_editor(p_actor uuid, p_id uuid, p_action text,
  p_mode text DEFAULT 'OFF', p_context jsonb DEFAULT '{}', p_public jsonb DEFAULT '{}',
  p_internal jsonb DEFAULT '{}', p_revision bigint DEFAULT NULL, p_request_id uuid DEFAULT NULL,
  p_command_hash text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions AS $$
DECLARE r text; h public.detailed_estimates; d public.detailed_estimate_drafts;
  ev public.detailed_estimate_events; result jsonb;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id=p_actor AND is_active AND NOT must_change_password;
  IF coalesce(r,'') NOT IN ('admin','manager','staff') THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='접근 권한이 없습니다.';
  END IF;
  IF coalesce(p_mode,'') NOT IN ('ON','READ_ONLY') THEN RAISE EXCEPTION USING ERRCODE='P5F01', MESSAGE='본견적 기능이 비활성화됐습니다.'; END IF;
  IF p_action NOT IN ('get','save') OR p_action IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='명령을 확인해 주세요.'; END IF;
  IF p_action='save' AND p_mode<>'ON' THEN RAISE EXCEPTION USING ERRCODE='P5F02', MESSAGE='읽기 전용입니다.'; END IF;
  IF p_action='save' THEN
    IF p_request_id IS NULL OR coalesce(p_command_hash,'') !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='요청 식별자를 확인해 주세요.'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
  END IF;
  h:=public.and_os_5b_require_head(p_id,r,p_action='save');
  SELECT * INTO d FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=h.id;
  IF p_action='get' THEN
    RETURN jsonb_build_object('editor',d.editor_public_json,'internal',d.editor_internal_json,'context',d.public_context_json,'revision',d.revision);
  END IF;
  SELECT * INTO ev FROM public.detailed_estimate_events WHERE actor_id=p_actor AND request_id=p_request_id;
  IF FOUND THEN
    IF ev.action<>'save' OR ev.detailed_estimate_id IS DISTINCT FROM h.id OR ev.request_hash IS DISTINCT FROM p_command_hash THEN
      RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='같은 요청 식별자를 다른 내용에 사용할 수 없습니다.';
    END IF;
    RETURN ev.result_refs;
  END IF;
  SELECT * INTO d FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=h.id FOR UPDATE;
  IF p_revision IS NULL OR p_revision<>d.revision THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='다른 사용자가 수정했습니다. 다시 불러와 주세요.'; END IF;
  IF jsonb_typeof(p_context) IS DISTINCT FROM 'object' OR jsonb_typeof(p_public) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_internal) IS DISTINCT FROM 'object' OR octet_length(p_public::text)>1000000
    OR octet_length(p_internal::text)>1000000 OR p_public->>'version' IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='작성본 형식을 확인해 주세요.';
  END IF;
  -- Server-calculated public/private projections are persisted atomically under the existing guard/CAS.
  PERFORM set_config('request.and_os_5b','on',true);
  UPDATE public.detailed_estimate_drafts SET public_context_json=p_context,
    editor_public_json=p_public,editor_internal_json=p_internal,revision=revision+1,updated_by=p_actor,updated_at=now()
    WHERE detailed_estimate_id=h.id;
  result:=jsonb_build_object('id',h.id,'project_id',h.project_id,'revision',d.revision+1);
  INSERT INTO public.detailed_estimate_events(project_id,detailed_estimate_id,action,actor_id,request_id,request_hash,expected_revision,result_revision,result_refs)
    VALUES(h.project_id,h.id,'save',p_actor,p_request_id,p_command_hash,p_revision,d.revision+1,result);
  RETURN result;
END $$;
ALTER FUNCTION public.and_os_5b_editor(uuid,uuid,text,text,jsonb,jsonb,jsonb,bigint,uuid,text) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.and_os_5b_editor(uuid,uuid,text,text,jsonb,jsonb,jsonb,bigint,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_5b_editor(uuid,uuid,text,text,jsonb,jsonb,jsonb,bigint,uuid,text) TO service_role;
COMMIT;
