-- Additive registry only. Existing estimates, policies and contracts are not rewritten.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
CREATE TABLE public.estimate_item_templates (
  id uuid PRIMARY KEY,
  draft_config jsonb NOT NULL CHECK(jsonb_typeof(draft_config)='object' AND octet_length(draft_config::text)<30000),
  revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
  current_version uuid,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.estimate_item_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.estimate_item_templates(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK(version>0),
  frozen jsonb NOT NULL CHECK(jsonb_typeof(frozen)='object' AND frozen->>'engine'='estimate-item-v1'),
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 500),
  published_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_id,version), UNIQUE(template_id,id)
);
ALTER TABLE public.estimate_item_templates ADD CONSTRAINT estimate_item_current_version_fk
  FOREIGN KEY(id,current_version) REFERENCES public.estimate_item_versions(template_id,id) ON DELETE RESTRICT;
CREATE TABLE public.estimate_item_events (
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.estimate_item_templates(id) ON DELETE RESTRICT,
  command_hash text NOT NULL,
  action text NOT NULL CHECK(action IN('save','publish','active')),
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(actor_id,request_id)
);
ALTER TABLE public.estimate_item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_item_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_item_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.estimate_item_templates,public.estimate_item_versions,public.estimate_item_events FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.estimate_item_templates,public.estimate_item_versions TO service_role;

CREATE FUNCTION public.and_os_estimate_item_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME IN('estimate_item_versions','estimate_item_events') AND TG_OP<>'INSERT' THEN
    RAISE EXCEPTION '게시 항목과 이력은 변경할 수 없습니다.' USING ERRCODE='42501';
  END IF;
  IF coalesce(current_setting('and_os.item_builder',true),'')<>'on' THEN
    RAISE EXCEPTION '승인된 항목 명령이 필요합니다.' USING ERRCODE='42501';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER estimate_item_template_guard BEFORE INSERT OR UPDATE OR DELETE ON public.estimate_item_templates FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_guard();
CREATE TRIGGER estimate_item_version_guard BEFORE INSERT OR UPDATE OR DELETE ON public.estimate_item_versions FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_guard();
CREATE TRIGGER estimate_item_event_guard BEFORE INSERT OR UPDATE OR DELETE ON public.estimate_item_events FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_guard();

CREATE FUNCTION public.and_os_estimate_item_command(
  p_actor uuid,p_mode text,p_action text,p_id uuid DEFAULT NULL,p_revision bigint DEFAULT NULL,
  p_config jsonb DEFAULT NULL,p_frozen jsonb DEFAULT NULL,p_reason text DEFAULT NULL,
  p_request uuid DEFAULT NULL,p_active boolean DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public SET lock_timeout='2s' SET statement_timeout='10s' AS $$
DECLARE role_name text; h public.estimate_item_templates; e public.estimate_item_events;
  result jsonb; fingerprint text; v_id uuid; v_number integer; c jsonb; m public.cost_items; total numeric:=0;
BEGIN
  SELECT role INTO role_name FROM public.profiles WHERE id=p_actor AND is_active AND NOT must_change_password FOR SHARE;
  IF role_name IS NULL OR role_name NOT IN('admin','manager') OR (p_action<>'list' AND role_name<>'admin') THEN
    RAISE EXCEPTION '항목 관리 권한이 없습니다.' USING ERRCODE='42501';
  END IF;
  IF p_mode IS NULL OR p_mode NOT IN('ON','READ_ONLY') OR (p_action<>'list' AND p_mode<>'ON') THEN
    RAISE EXCEPTION '항목 관리가 비활성 또는 읽기 전용입니다.' USING ERRCODE='42501';
  END IF;
  IF p_action='replay' THEN
    SELECT * INTO e FROM public.estimate_item_events WHERE actor_id=p_actor AND request_id=p_request;
    RETURN CASE WHEN FOUND THEN to_jsonb(e) ELSE NULL END;
  END IF;
  IF p_action='list' THEN
    RETURN jsonb_build_object('items',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.updated_at DESC),'[]') FROM public.estimate_item_templates t),
      'versions',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'template_id',template_id,'version',version,'published_at',published_at,'reason',reason) ORDER BY published_at DESC),'[]') FROM public.estimate_item_versions));
  END IF;
  IF p_action NOT IN('save','publish','active') OR p_request IS NULL OR p_id IS NULL THEN RAISE EXCEPTION '항목 명령을 확인해 주세요.' USING ERRCODE='22023'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('and-os-item:'||p_id::text,0));
  fingerprint:=encode(extensions.digest(jsonb_build_object('action',p_action,'id',p_id,'revision',p_revision,'config',p_config,'frozen',p_frozen,'reason',p_reason,'active',p_active)::text,'sha256'),'hex');
  SELECT * INTO e FROM public.estimate_item_events WHERE actor_id=p_actor AND request_id=p_request;
  IF FOUND THEN
    IF e.command_hash<>fingerprint THEN RAISE EXCEPTION '같은 요청에 다른 내용을 사용할 수 없습니다.' USING ERRCODE='23514'; END IF;
    RETURN e.result;
  END IF;
  SELECT * INTO h FROM public.estimate_item_templates WHERE id=p_id FOR UPDATE;
  IF NOT FOUND THEN
    IF p_action<>'save' OR p_revision IS DISTINCT FROM 0 THEN RAISE EXCEPTION '항목을 찾지 못했습니다.' USING ERRCODE='P0002'; END IF;
  ELSIF p_revision IS DISTINCT FROM h.revision THEN RAISE EXCEPTION '항목 개정 충돌입니다. 다시 불러와 주세요.' USING ERRCODE='40001'; END IF;
  PERFORM set_config('and_os.item_builder','on',true);
  IF p_action='save' THEN
    IF jsonb_typeof(p_config)<>'object' OR p_config->>'schema'<>'1' OR p_config->>'trade' NOT IN('demolition','electrical','bathroom','wallpaper','film','flooring','carpentry','furniture','finish') OR length(btrim(p_config->>'name')) NOT BETWEEN 1 AND 100 THEN
      RAISE EXCEPTION '항목 정의를 확인해 주세요.' USING ERRCODE='22023';
    END IF;
    IF h.id IS NULL THEN INSERT INTO public.estimate_item_templates(id,draft_config,updated_by) VALUES(p_id,p_config,p_actor) RETURNING * INTO h;
    ELSE UPDATE public.estimate_item_templates SET draft_config=p_config,revision=revision+1,updated_by=p_actor,updated_at=now() WHERE id=p_id RETURNING * INTO h; END IF;
  ELSIF p_action='active' THEN
    IF p_active IS NULL THEN RAISE EXCEPTION '사용 상태를 확인해 주세요.' USING ERRCODE='22023'; END IF;
    UPDATE public.estimate_item_templates SET is_active=p_active,revision=revision+1,updated_by=p_actor,updated_at=now() WHERE id=p_id RETURNING * INTO h;
  ELSE
    IF NOT h.is_active OR p_frozen->'definition' IS DISTINCT FROM h.draft_config OR p_frozen->>'engine' IS DISTINCT FROM 'estimate-item-v1'
      OR coalesce(length(btrim(p_reason)),0) NOT BETWEEN 1 AND 500 OR jsonb_typeof(p_frozen->'components') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION '게시 기준을 확인해 주세요.' USING ERRCODE='22023';
    END IF;
    IF EXISTS(SELECT FROM public.estimate_item_versions WHERE id=h.current_version AND frozen=p_frozen) THEN
      RAISE EXCEPTION '이미 같은 내용이 게시되어 있습니다.' USING ERRCODE='23514';
    END IF;
    IF jsonb_array_length(p_frozen->'components')<>jsonb_array_length(h.draft_config->'components') THEN RAISE EXCEPTION '구성 원가가 일치하지 않습니다.' USING ERRCODE='23514'; END IF;
    FOR c IN SELECT value FROM jsonb_array_elements(p_frozen->'components') ORDER BY value->>'code' LOOP
      SELECT * INTO m FROM public.cost_items WHERE item_code=c->>'code' AND is_active FOR SHARE;
      IF NOT FOUND OR m.cost_price IS NULL OR m.cost_price IS DISTINCT FROM (c->>'costPrice')::numeric OR m.unit IS DISTINCT FROM c->>'unit'
        OR m.item_name IS DISTINCT FROM c->>'name' OR m.updated_at IS DISTINCT FROM (c->>'updatedAt')::timestamptz
        OR NOT EXISTS(SELECT FROM jsonb_array_elements(h.draft_config->'components') x WHERE x->>'code'=c->>'code' AND x->'quantity'=c->'quantity') THEN
        RAISE EXCEPTION '원가가 변경됐습니다. 다시 시험 계산해 주세요.' USING ERRCODE='40001';
      END IF;
      total:=total+round((c->>'quantity')::numeric*m.cost_price);
    END LOOP;
    IF (jsonb_array_length(p_frozen->'components')=0 AND p_frozen->'costUnit'<>'null'::jsonb) OR
      (jsonb_array_length(p_frozen->'components')>0 AND total IS DISTINCT FROM (p_frozen->>'costUnit')::numeric) THEN
      RAISE EXCEPTION '구성 원가 합계가 일치하지 않습니다.' USING ERRCODE='23514';
    END IF;
    SELECT coalesce(max(version),0)+1 INTO v_number FROM public.estimate_item_versions WHERE template_id=p_id;
    INSERT INTO public.estimate_item_versions(template_id,version,frozen,reason,published_by) VALUES(p_id,v_number,p_frozen,btrim(p_reason),p_actor) RETURNING id INTO v_id;
    UPDATE public.estimate_item_templates SET current_version=v_id,revision=revision+1,updated_by=p_actor,updated_at=now() WHERE id=p_id RETURNING * INTO h;
  END IF;
  result:=jsonb_build_object('id',h.id,'revision',h.revision,'current_version',h.current_version,'active',h.is_active);
  INSERT INTO public.estimate_item_events(actor_id,request_id,template_id,command_hash,action,result) VALUES(p_actor,p_request,p_id,fingerprint,p_action,result);
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.and_os_estimate_item_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.and_os_estimate_item_command(uuid,text,text,uuid,bigint,jsonb,jsonb,text,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.and_os_estimate_item_command(uuid,text,text,uuid,bigint,jsonb,jsonb,text,uuid,boolean) TO service_role;
-- Old browser versions must not silently overwrite an estimate containing extension rows.
CREATE FUNCTION public.and_os_estimate_item_estimate_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF (NEW.estimate_data ? 'itemBuilder' OR (TG_OP='UPDATE' AND OLD.estimate_data ? 'itemBuilder'))
    AND coalesce(auth.role(),'')<>'service_role' THEN
    RAISE EXCEPTION '추가 공사가 있는 견적은 최신 화면에서 저장해 주세요.' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER estimate_item_estimate_guard BEFORE INSERT OR UPDATE ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_estimate_guard();
REVOKE ALL ON FUNCTION public.and_os_estimate_item_estimate_guard() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
