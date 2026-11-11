BEGIN;

ALTER TABLE public.estimates
  ADD COLUMN confirmation_state text NOT NULL DEFAULT 'draft' CHECK (confirmation_state IN ('draft','confirmed','revising')),
  ADD COLUMN draft_version integer NOT NULL DEFAULT 1 CHECK (draft_version > 0),
  ADD COLUMN confirmation_project_id uuid REFERENCES public.projects(id) ON DELETE RESTRICT,
  ADD COLUMN latest_confirmation_id uuid,
  ADD COLUMN revision_parent_id uuid,
  ADD COLUMN revision_started_by uuid,
  ADD COLUMN revision_starter_name text,
  ADD COLUMN revision_started_at timestamptz;

CREATE TABLE public.preliminary_estimate_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  version_no integer NOT NULL CHECK (version_no > 0),
  source_revision bigint NOT NULL CHECK (source_revision >= 0),
  confirmed_by uuid NOT NULL, confirmer_name text NOT NULL,
  confirmed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),
  snapshot_hash text NOT NULL CHECK (snapshot_hash ~ '^[a-f0-9]{64}$'),
  supply_amount numeric NOT NULL CHECK (supply_amount>0),
  vat_amount numeric NOT NULL CHECK (vat_amount>=0),
  total_amount numeric NOT NULL,
  request_id uuid NOT NULL,
  UNIQUE(estimate_id,version_no), UNIQUE(estimate_id,source_revision), UNIQUE(confirmed_by,request_id),
  UNIQUE(id,estimate_id,project_id), CHECK(total_amount=supply_amount+vat_amount)
);
ALTER TABLE public.estimates
  ADD FOREIGN KEY(latest_confirmation_id,id,confirmation_project_id) REFERENCES public.preliminary_estimate_versions(id,estimate_id,project_id) ON DELETE RESTRICT,
  ADD FOREIGN KEY(revision_parent_id,id,confirmation_project_id) REFERENCES public.preliminary_estimate_versions(id,estimate_id,project_id) ON DELETE RESTRICT,
  ADD CONSTRAINT preliminary_confirmation_state_pair CHECK (
    (confirmation_state='draft' AND latest_confirmation_id IS NULL AND revision_parent_id IS NULL AND confirmation_project_id IS NULL AND draft_version=1)
    OR (confirmation_state='confirmed' AND latest_confirmation_id IS NOT NULL AND confirmation_project_id IS NOT NULL)
    OR (confirmation_state='revising' AND latest_confirmation_id IS NOT NULL AND revision_parent_id=latest_confirmation_id AND confirmation_project_id IS NOT NULL)
  );
ALTER TABLE public.preliminary_estimate_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.preliminary_estimate_versions FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.preliminary_estimate_versions TO service_role;
CREATE INDEX preliminary_versions_project_idx ON public.preliminary_estimate_versions(project_id,estimate_id,version_no DESC);
CREATE UNIQUE INDEX preliminary_command_request_idx ON public.os_audit_logs(actor_user_id,(after_data->>'request_id'))
  WHERE action IN ('ESTIMATE_FLOW_CONFIRMED','ESTIMATE_FLOW_REVISION_CREATED');

-- Validate frozen stored amounts; never reprice against the current cost master.
CREATE FUNCTION public.and_os_preliminary_issues(p_row jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE issues jsonb:='[]'; d jsonb:=p_row->'estimate_data'; g jsonb; item jsonb; subtotal numeric; grand numeric:=0; count_items integer:=0; sale numeric;
BEGIN
  IF coalesce(trim(p_row->>'project_name'),'')='' THEN issues:=issues||'"현장명을 입력하고 저장해 주세요."'::jsonb; END IF;
  IF coalesce(trim(p_row->>'client_name'),'')='' THEN issues:=issues||'"고객명을 입력하고 저장해 주세요."'::jsonb; END IF;
  IF coalesce((p_row->>'area_pyeong')::numeric,0)<=0 THEN issues:=issues||'"평형을 확인하고 저장해 주세요."'::jsonb; END IF;
  sale:=(p_row->>'total_price')::numeric;
  IF sale IS NULL OR sale<=0 OR sale>1000000000000 OR sale<>trunc(sale) THEN issues:=issues||'"저장 견적금액을 확인해 주세요."'::jsonb; END IF;
  IF p_row->'cost_total' IS NOT NULL AND p_row->'cost_total'<>'null'::jsonb THEN
    IF jsonb_typeof(p_row->'cost_total')<>'number' OR (p_row->>'cost_total')::numeric<0 THEN
      issues:=issues||'"저장된 산정 금액 형식을 확인해 주세요."'::jsonb;
    END IF;
  END IF;
  IF d ? 'costTotal' AND d->'costTotal' IS DISTINCT FROM p_row->'cost_total' THEN
    issues:=issues||'"저장된 산정 금액과 견적 스냅샷이 일치하지 않습니다."'::jsonb;
  END IF;
  IF jsonb_typeof(d#>'{customerQuote,groups}') IS DISTINCT FROM 'array' THEN RETURN issues||'"저장된 고객 견적 내역이 없습니다."'::jsonb; END IF;
  FOR g IN SELECT value FROM jsonb_array_elements(d#>'{customerQuote,groups}') LOOP
    IF jsonb_typeof(g->'items') IS DISTINCT FROM 'array' THEN RETURN issues||'"공정별 공사 내역을 확인해 주세요."'::jsonb; END IF;
    subtotal:=0;
    FOR item IN SELECT value FROM jsonb_array_elements(g->'items') LOOP
      IF coalesce(trim(item->>'name'),'')='' OR jsonb_typeof(item->'amount') IS DISTINCT FROM 'number'
        OR (item->>'amount')::numeric<0 OR (item->>'amount')::numeric<>trunc((item->>'amount')::numeric) THEN
        RETURN issues||'"품목명 또는 판매금액이 미설정된 공사 항목을 확인해 주세요."'::jsonb;
      END IF;
      count_items:=count_items+1; subtotal:=subtotal+(item->>'amount')::numeric;
    END LOOP;
    IF jsonb_typeof(g->'total') IS DISTINCT FROM 'number' OR (g->>'total')::numeric<>subtotal THEN
      RETURN issues||'"공정 소계와 품목 판매금액이 일치하지 않습니다."'::jsonb;
    END IF;
    grand:=grand+subtotal;
  END LOOP;
  IF count_items=0 THEN issues:=issues||'"최소 한 개의 공사 항목을 저장해 주세요."'::jsonb; END IF;
  IF grand IS DISTINCT FROM sale OR (d->>'total')::numeric IS DISTINCT FROM sale OR (d#>>'{customerQuote,total}')::numeric IS DISTINCT FROM sale THEN
    issues:=issues||'"저장 총액과 고객 견적 내역의 합계가 일치하지 않습니다."'::jsonb;
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(d#>'{itemBuilder,publicRows}','[]')) LOOP
    IF jsonb_typeof(item->'saleUnitPrice') IS DISTINCT FROM 'number' OR (item->>'saleUnitPrice')::numeric<0
      OR jsonb_typeof(item->'quantity') IS DISTINCT FROM 'number' OR (item->>'quantity')::numeric<0 THEN
      issues:=issues||'"추가 공사의 판매단가와 수량을 확인해 주세요."'::jsonb; EXIT;
    END IF;
  END LOOP;
  IF coalesce(d->'pendingPriceRequests','[]'::jsonb)<>'[]'::jsonb OR coalesce(d->'unresolvedWorks','[]'::jsonb)<>'[]'::jsonb THEN
    issues:=issues||'"처리되지 않은 공사 확인 또는 가격 변경 요청을 먼저 해결해 주세요."'::jsonb;
  END IF;
  RETURN issues;
EXCEPTION WHEN invalid_text_representation OR numeric_value_out_of_range THEN
  RETURN '["저장된 수량·단가·금액 형식을 확인해 주세요."]'::jsonb;
END $$;

CREATE FUNCTION public.and_os_preliminary_project(p_id uuid) RETURNS uuid
LANGUAGE plpgsql STABLE SET search_path=public,pg_temp AS $$
DECLARE ids uuid[];
BEGIN
  SELECT array_agg(DISTINCT project_id) INTO ids FROM (
    SELECT project_id FROM public.estimates WHERE id=p_id AND project_id IS NOT NULL
    UNION SELECT project_id FROM public.project_preliminary_estimates WHERE estimate_id=p_id
    UNION SELECT project_id FROM public.detailed_estimate_references WHERE source_estimate_id=p_id
    UNION SELECT confirmation_project_id FROM public.estimates WHERE id=p_id AND confirmation_project_id IS NOT NULL
  ) links;
  IF cardinality(ids)>1 THEN RAISE EXCEPTION 'preliminary_project_conflict' USING ERRCODE='23514'; END IF;
  RETURN ids[1];
END $$;

CREATE FUNCTION public.and_os_preliminary_fingerprint(p_id uuid) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
  SELECT encode(extensions.digest(public.and_os_estimate_business(to_jsonb(e))::text,'sha256'),'hex') FROM public.estimates e WHERE id=p_id
$$;

CREATE FUNCTION public.and_os_guard_preliminary_workflow() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE command text:=current_setting('and_os.preliminary_command',true); v public.preliminary_estimate_versions;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.confirmation_state<>'draft' OR NEW.draft_version<>1 OR NEW.latest_confirmation_id IS NOT NULL OR NEW.confirmation_project_id IS NOT NULL THEN
      RAISE EXCEPTION 'preliminary_invalid_state' USING ERRCODE='42501'; END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='DELETE' THEN
    IF OLD.latest_confirmation_id IS NOT NULL THEN RAISE EXCEPTION 'estimate_locked' USING ERRCODE='42501'; END IF;
    RETURN OLD;
  END IF;
  IF command IS NULL OR command NOT IN ('confirm','revise') THEN
    IF OLD.confirmation_state='confirmed' THEN RAISE EXCEPTION 'estimate_locked' USING ERRCODE='42501'; END IF;
    IF ROW(NEW.confirmation_state,NEW.draft_version,NEW.latest_confirmation_id,NEW.confirmation_project_id,NEW.revision_parent_id,NEW.revision_started_by,NEW.revision_starter_name,NEW.revision_started_at)
      IS DISTINCT FROM ROW(OLD.confirmation_state,OLD.draft_version,OLD.latest_confirmation_id,OLD.confirmation_project_id,OLD.revision_parent_id,OLD.revision_started_by,OLD.revision_starter_name,OLD.revision_started_at) THEN
      RAISE EXCEPTION 'preliminary_command_required' USING ERRCODE='42501'; END IF;
  ELSE
    IF public.and_os_estimate_business(to_jsonb(NEW))<>public.and_os_estimate_business(to_jsonb(OLD)) THEN
      RAISE EXCEPTION 'preliminary_content_changed' USING ERRCODE='42501'; END IF;
    SELECT * INTO v FROM public.preliminary_estimate_versions WHERE id=NEW.latest_confirmation_id;
    IF v.estimate_id IS DISTINCT FROM NEW.id OR v.project_id IS DISTINCT FROM NEW.confirmation_project_id
      OR NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'preliminary_invalid_state' USING ERRCODE='23514'; END IF;
    IF command='confirm' AND (OLD.confirmation_state NOT IN ('draft','revising') OR NEW.confirmation_state<>'confirmed' OR v.version_no<>NEW.draft_version OR v.source_revision<>OLD.revision) THEN
      RAISE EXCEPTION 'preliminary_invalid_state' USING ERRCODE='23514'; END IF;
    IF command='revise' AND (OLD.confirmation_state<>'confirmed' OR NEW.confirmation_state<>'revising' OR NEW.draft_version<>v.version_no+1 OR NEW.revision_parent_id<>v.id OR NEW.latest_confirmation_id<>OLD.latest_confirmation_id) THEN
      RAISE EXCEPTION 'preliminary_invalid_state' USING ERRCODE='23514'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER and_os_preliminary_workflow_guard BEFORE INSERT OR UPDATE OR DELETE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_preliminary_workflow();

CREATE FUNCTION public.and_os_guard_preliminary_version() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'preliminary_version_immutable' USING ERRCODE='42501'; END IF;
  IF current_setting('and_os.preliminary_command',true) IS DISTINCT FROM 'confirm'
    OR NEW.snapshot->>'id' IS DISTINCT FROM NEW.estimate_id::text
    OR NEW.snapshot->>'revision' IS DISTINCT FROM NEW.source_revision::text
    OR NEW.snapshot_hash<>encode(extensions.digest(NEW.snapshot::text,'sha256'),'hex') THEN
    RAISE EXCEPTION 'preliminary_command_required' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preliminary_version_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.preliminary_estimate_versions
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_preliminary_version();
CREATE TRIGGER preliminary_version_no_truncate BEFORE TRUNCATE ON public.preliminary_estimate_versions
  FOR EACH STATEMENT EXECUTE FUNCTION public.and_os_guard_preliminary_version();

-- Wrap, rather than duplicate, the Phase 1 save transaction. The old entry is no longer callable by API roles.
ALTER FUNCTION public.and_os_save_estimate(uuid,uuid,bigint,jsonb,boolean) RENAME TO and_os_save_estimate_phase1;
REVOKE ALL ON FUNCTION public.and_os_save_estimate_phase1(uuid,uuid,bigint,jsonb,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.and_os_save_estimate(p_actor uuid,p_id uuid,p_expected_revision bigint,p_row jsonb,p_delete boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE state text;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF p_id IS NOT NULL THEN
    SELECT confirmation_state INTO state FROM public.estimates WHERE id=p_id FOR UPDATE;
    IF state='confirmed' THEN RAISE EXCEPTION 'estimate_locked' USING ERRCODE='42501'; END IF;
  END IF;
  RETURN public.and_os_save_estimate_phase1(p_actor,p_id,p_expected_revision,p_row,p_delete);
END $$;

CREATE OR REPLACE FUNCTION public.and_os_guard_estimate_audit() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP<>'INSERT' AND (OLD.action LIKE 'ESTIMATE_SAVE_%' OR OLD.action LIKE 'ESTIMATE_FLOW_%') THEN
    RAISE EXCEPTION 'estimate_history_immutable' USING ERRCODE='42501'; END IF;
  IF TG_OP<>'DELETE' AND (NEW.action LIKE 'ESTIMATE_SAVE_%' OR NEW.action LIKE 'ESTIMATE_FLOW_%')
    AND (TG_OP<>'INSERT' OR coalesce(current_setting('and_os.estimate_save_actor',true),'') IS DISTINCT FROM NEW.actor_user_id::text) THEN
    RAISE EXCEPTION 'estimate_history_command_required' USING ERRCODE='42501'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE FUNCTION public.and_os_preliminary_command(p_actor uuid,p_id uuid,p_action text,p_revision bigint,p_request_id uuid,p_fingerprint text DEFAULT NULL,p_project uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.profiles; e public.estimates; v public.preliminary_estimate_versions; pr uuid; actual uuid;
  issues jsonb; fp text; command_hash text; previous public.os_audit_logs; result jsonb; stamp timestamptz:=clock_timestamp();
BEGIN
  SELECT * INTO a FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF NOT FOUND OR a.role IS NULL OR a.role NOT IN ('admin','manager','staff') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE THEN
    RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE='42501'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('confirm','revise') OR p_request_id IS NULL OR p_revision IS NULL THEN RAISE EXCEPTION 'preliminary_invalid_command' USING ERRCODE='22023'; END IF;
  SELECT * INTO e FROM public.estimates WHERE id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'estimate_not_found' USING ERRCODE='P0002'; END IF;
  PERFORM set_config('and_os.estimate_save_actor',a.id::text,true);
  IF a.role='staff' OR NOT public.and_os_estimate_can_edit(a.id,e.id) THEN
    INSERT INTO public.os_audit_logs(created_at,actor_user_id,actor_name,actor_role,action,target_type,target_id,result,reason,before_data,after_data)
      VALUES(stamp,a.id,coalesce(a.name,'이름 미등록'),a.role,'ESTIMATE_FLOW_DENIED','estimate',e.id::text,'DENIED','확정 또는 수정본 생성 권한 없음',
      jsonb_build_object('revision',e.revision,'state',e.confirmation_state,'changes','{}'::jsonb),
      jsonb_build_object('revision',e.revision,'state',e.confirmation_state,'version_no',e.draft_version,
        'project_id',coalesce(e.confirmation_project_id,e.project_id,(SELECT project_id FROM public.project_preliminary_estimates WHERE estimate_id=e.id)),
        'attempted_action',p_action,'changes','{}'::jsonb));
    PERFORM set_config('and_os.estimate_save_actor','',true);
    RETURN jsonb_build_object('blocked',403);
  END IF;
  pr:=coalesce(public.and_os_preliminary_project(p_id),p_project);
  IF pr IS NULL THEN RAISE EXCEPTION 'preliminary_project_required' USING ERRCODE='23514'; END IF;
  PERFORM 1 FROM public.projects WHERE id=pr FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'preliminary_project_required' USING ERRCODE='23514'; END IF;
  SELECT * INTO e FROM public.estimates WHERE id=p_id FOR UPDATE;
  PERFORM 1 FROM public.profiles WHERE id=e.creator_id FOR SHARE;
  IF NOT public.and_os_estimate_can_edit(a.id,e.id) THEN RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE='42501'; END IF;
  actual:=public.and_os_preliminary_project(p_id);
  IF (actual IS NOT NULL AND actual<>pr) OR (p_project IS NOT NULL AND p_project<>pr) THEN RAISE EXCEPTION 'preliminary_project_conflict' USING ERRCODE='23514'; END IF;
  command_hash:=encode(extensions.digest(jsonb_build_object('estimate',p_id,'action',p_action,'revision',p_revision,'fingerprint',p_fingerprint,'project',p_project)::text,'sha256'),'hex');
  SELECT * INTO previous FROM public.os_audit_logs WHERE actor_user_id=a.id AND after_data->>'request_id'=p_request_id::text
    AND action IN ('ESTIMATE_FLOW_CONFIRMED','ESTIMATE_FLOW_REVISION_CREATED');
  IF FOUND THEN
    IF previous.after_data->>'command_hash'<>command_hash THEN RAISE EXCEPTION 'preliminary_request_conflict' USING ERRCODE='23514'; END IF;
    PERFORM set_config('and_os.estimate_save_actor','',true); RETURN previous.after_data->'result';
  END IF;
  IF e.revision<>p_revision THEN RAISE EXCEPTION 'estimate_revision_conflict' USING ERRCODE='40001'; END IF;
  fp:=encode(extensions.digest(public.and_os_estimate_business(to_jsonb(e))::text,'sha256'),'hex');
  PERFORM set_config('and_os.preliminary_command',p_action,true);
  IF p_action='confirm' THEN
    IF e.confirmation_state NOT IN ('draft','revising') THEN RAISE EXCEPTION 'estimate_locked' USING ERRCODE='42501'; END IF;
    IF p_fingerprint IS DISTINCT FROM fp THEN RAISE EXCEPTION 'estimate_revision_conflict' USING ERRCODE='40001'; END IF;
    issues:=public.and_os_preliminary_issues(to_jsonb(e));
    IF jsonb_array_length(issues)>0 THEN RAISE EXCEPTION 'preliminary_validation_failed' USING ERRCODE='23514'; END IF;
    IF NOT EXISTS(SELECT FROM public.project_preliminary_estimates WHERE estimate_id=e.id) THEN
      PERFORM set_config('request.and_os_5b','on',true);
      INSERT INTO public.project_preliminary_estimates(estimate_id,project_id,linked_by) VALUES(e.id,pr,a.id);
      PERFORM set_config('request.and_os_5b','',true);
    END IF;
    INSERT INTO public.preliminary_estimate_versions(estimate_id,project_id,version_no,source_revision,confirmed_by,confirmer_name,snapshot,snapshot_hash,supply_amount,vat_amount,total_amount,request_id)
      VALUES(e.id,pr,e.draft_version,e.revision,a.id,coalesce(nullif(a.name,''),'이름 미등록'),to_jsonb(e),
        encode(extensions.digest(to_jsonb(e)::text,'sha256'),'hex'),e.total_price,round(e.total_price*.1),e.total_price+round(e.total_price*.1),p_request_id) RETURNING * INTO v;
    UPDATE public.estimates SET confirmation_state='confirmed',latest_confirmation_id=v.id,confirmation_project_id=pr,revision=revision+1 WHERE id=e.id;
  ELSE
    IF e.confirmation_state<>'confirmed' THEN RAISE EXCEPTION 'preliminary_revision_exists' USING ERRCODE='23514'; END IF;
    SELECT * INTO v FROM public.preliminary_estimate_versions WHERE id=e.latest_confirmation_id;
    IF public.and_os_estimate_business(v.snapshot)<>public.and_os_estimate_business(to_jsonb(e)) THEN
      RAISE EXCEPTION 'preliminary_content_changed' USING ERRCODE='23514'; END IF;
    UPDATE public.estimates SET confirmation_state='revising',draft_version=v.version_no+1,revision_parent_id=v.id,
      revision_started_by=a.id,revision_starter_name=coalesce(nullif(a.name,''),'이름 미등록'),revision_started_at=stamp,revision=revision+1 WHERE id=e.id;
  END IF;
  result:=jsonb_build_object('versionId',v.id,'versionNo',CASE WHEN p_action='confirm' THEN e.draft_version ELSE v.version_no+1 END,
    'revision',(e.revision+1)::text,'state',CASE WHEN p_action='confirm' THEN 'confirmed' ELSE 'revising' END);
  INSERT INTO public.os_audit_logs(created_at,actor_user_id,actor_name,actor_role,action,target_type,target_id,result,before_data,after_data)
    VALUES(stamp,a.id,coalesce(a.name,'이름 미등록'),a.role,CASE WHEN p_action='confirm' THEN 'ESTIMATE_FLOW_CONFIRMED' ELSE 'ESTIMATE_FLOW_REVISION_CREATED' END,
      'estimate',e.id::text,'SUCCESS',jsonb_build_object('revision',e.revision,'changes',jsonb_build_object('workflow_state',e.confirmation_state,'version_no',e.draft_version)),
      jsonb_build_object('revision',e.revision+1,'request_id',p_request_id,'command_hash',command_hash,'project_id',pr,'result',result,
        'changes',jsonb_build_object('workflow_state',result->>'state','version_no',result->'versionNo')));
  PERFORM set_config('and_os.estimate_save_actor','',true);PERFORM set_config('and_os.preliminary_command','',true);
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.and_os_preliminary_issues(jsonb),public.and_os_preliminary_project(uuid),
  public.and_os_preliminary_fingerprint(uuid),
  public.and_os_guard_preliminary_workflow(),public.and_os_guard_preliminary_version(),
  public.and_os_save_estimate(uuid,uuid,bigint,jsonb,boolean),public.and_os_preliminary_command(uuid,uuid,text,bigint,uuid,text,uuid)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_preliminary_issues(jsonb),public.and_os_preliminary_project(uuid),
  public.and_os_preliminary_fingerprint(uuid),
  public.and_os_save_estimate(uuid,uuid,bigint,jsonb,boolean),public.and_os_preliminary_command(uuid,uuid,text,bigint,uuid,text,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
