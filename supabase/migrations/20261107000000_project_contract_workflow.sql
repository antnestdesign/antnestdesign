BEGIN;
SET LOCAL lock_timeout='3s';
SET LOCAL statement_timeout='30s';

ALTER TABLE public.projects
  ADD COLUMN flow_revision bigint NOT NULL DEFAULT 0 CHECK(flow_revision>=0),
  ADD COLUMN flow_estimate_id uuid REFERENCES public.estimates(id) ON DELETE RESTRICT,
  ADD COLUMN flow_version_id uuid,
  ADD COLUMN flow_transferred_by uuid,
  ADD COLUMN flow_transferred_name text,
  ADD COLUMN flow_transferred_at timestamptz,
  ADD COLUMN flow_planned_contract_date date,
  ADD COLUMN flow_contract_date date,
  ADD COLUMN flow_contract_amount numeric,
  ADD COLUMN flow_amount_basis text CHECK(flow_amount_basis IN ('supply','vat_included')),
  ADD COLUMN flow_amount_reason text,
  ADD COLUMN flow_contract_by uuid,
  ADD COLUMN flow_contract_name text,
  ADD COLUMN flow_contract_at timestamptz,
  ADD COLUMN flow_package_id uuid REFERENCES public.contract_package_snapshots(id) ON DELETE RESTRICT,
  ADD COLUMN flow_start_date date,
  ADD COLUMN flow_planned_completion_date date,
  ADD COLUMN flow_start_by uuid,
  ADD COLUMN flow_start_name text,
  ADD COLUMN flow_start_at timestamptz,
  ADD COLUMN flow_completion_date date,
  ADD COLUMN flow_completion_by uuid,
  ADD COLUMN flow_completion_name text,
  ADD COLUMN flow_completion_at timestamptz,
  ADD COLUMN flow_completion_note text,
  ADD CONSTRAINT project_flow_version_scope FOREIGN KEY(flow_version_id,flow_estimate_id,id)
    REFERENCES public.preliminary_estimate_versions(id,estimate_id,project_id) ON DELETE RESTRICT,
  ADD CONSTRAINT project_flow_pair CHECK(
    (flow_version_id IS NULL AND flow_estimate_id IS NULL AND flow_revision=0 AND flow_transferred_at IS NULL
      AND flow_contract_at IS NULL AND flow_start_at IS NULL AND flow_completion_at IS NULL)
    OR (flow_version_id IS NOT NULL AND flow_estimate_id IS NOT NULL AND flow_revision>0
      AND flow_transferred_by IS NOT NULL AND flow_transferred_name IS NOT NULL AND flow_transferred_at IS NOT NULL)),
  ADD CONSTRAINT project_flow_contract_pair CHECK(
    (flow_contract_at IS NULL AND flow_contract_date IS NULL AND flow_contract_amount IS NULL AND flow_amount_basis IS NULL AND flow_contract_by IS NULL AND flow_package_id IS NULL)
    OR (flow_contract_at IS NOT NULL AND flow_contract_date IS NOT NULL AND flow_contract_amount IS NOT NULL AND flow_contract_amount>0
      AND flow_contract_amount<=1000000000000 AND flow_contract_amount=trunc(flow_contract_amount)
      AND flow_amount_basis IS NOT NULL AND flow_contract_by IS NOT NULL AND flow_contract_name IS NOT NULL AND flow_version_id IS NOT NULL)),
  ADD CONSTRAINT project_flow_start_pair CHECK(
    (flow_start_at IS NULL AND flow_start_date IS NULL AND flow_start_by IS NULL)
    OR (flow_start_at IS NOT NULL AND flow_start_date IS NOT NULL AND flow_start_date>=flow_contract_date AND flow_contract_at IS NOT NULL AND flow_start_by IS NOT NULL AND flow_start_name IS NOT NULL)),
  ADD CONSTRAINT project_flow_completion_pair CHECK(
    (flow_completion_at IS NULL AND flow_completion_date IS NULL AND flow_completion_by IS NULL)
    OR (flow_completion_at IS NOT NULL AND flow_completion_date IS NOT NULL AND flow_completion_date>=flow_start_date AND flow_start_at IS NOT NULL AND flow_completion_by IS NOT NULL AND flow_completion_name IS NOT NULL));
CREATE INDEX projects_flow_estimate_idx ON public.projects(flow_estimate_id) WHERE flow_estimate_id IS NOT NULL;
CREATE UNIQUE INDEX project_flow_request_idx ON public.os_audit_logs(actor_user_id,(after_data->>'request_id'))
  WHERE action LIKE 'PROJECT_FLOW_%';

CREATE FUNCTION public.and_os_project_stage(p_status text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT CASE
    WHEN coalesce(trim(p_status),'') IN ('','견적','상담','상담중','검토','견적전','NEW','ESTIMATE') THEN 'estimate'
    WHEN p_status='계약 준비' THEN 'preparation'
    WHEN p_status IN ('계약','계약완료','CONTRACTED','계약 체결') THEN 'contracted'
    WHEN p_status IN ('착공','공사중','진행중','IN_PROGRESS') THEN 'started'
    WHEN p_status IN ('준공','완료','COMPLETED') THEN 'completed'
    ELSE 'unknown' END
$$;

CREATE FUNCTION public.and_os_project_flow_fields(p_row jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path=public,pg_temp AS $$
  SELECT coalesce(jsonb_object_agg(key,value),'{}'::jsonb) FROM jsonb_each(p_row)
    WHERE key='status' OR key LIKE 'flow\_%' ESCAPE '\'
$$;
CREATE FUNCTION public.and_os_guard_project_flow() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF jsonb_strip_nulls(public.and_os_project_flow_fields(to_jsonb(NEW))-ARRAY['status','flow_revision'])<>'{}'::jsonb
      OR NEW.flow_revision<>0 OR public.and_os_project_stage(NEW.status)<>'estimate' THEN
      RAISE EXCEPTION 'project_flow_command_required' USING ERRCODE='42501'; END IF;
  ELSIF public.and_os_project_flow_fields(to_jsonb(NEW)) IS DISTINCT FROM public.and_os_project_flow_fields(to_jsonb(OLD))
    AND coalesce(current_setting('and_os.project_flow_actor',true),'')='' THEN
    RAISE EXCEPTION 'project_flow_command_required' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER project_flow_command_guard BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_project_flow();

CREATE FUNCTION public.and_os_guard_project_flow_audit() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP<>'INSERT' AND OLD.action LIKE 'PROJECT_FLOW_%' THEN
    RAISE EXCEPTION 'project_flow_history_immutable' USING ERRCODE='42501'; END IF;
  IF TG_OP<>'DELETE' AND NEW.action LIKE 'PROJECT_FLOW_%' AND
    (TG_OP<>'INSERT' OR coalesce(current_setting('and_os.project_flow_actor',true),'') IS DISTINCT FROM NEW.actor_user_id::text) THEN
    RAISE EXCEPTION 'project_flow_command_required' USING ERRCODE='42501'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER project_flow_audit_guard BEFORE INSERT OR UPDATE OR DELETE ON public.os_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_project_flow_audit();

CREATE FUNCTION public.and_os_project_flow_command(p_actor uuid,p_project uuid,p_action text,p_revision bigint,p_request_id uuid,p_data jsonb DEFAULT '{}',p_mode text DEFAULT 'OFF')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.profiles; pr public.projects; old_pr public.projects; e public.estimates; v public.preliminary_estimate_versions;
  pack public.contract_package_snapshots; previous public.os_audit_logs; stamp timestamptz:=clock_timestamp();
  today date:=(clock_timestamp() AT TIME ZONE 'Asia/Seoul')::date; expected_amount numeric; actual_amount numeric;
  actual_date date; planned_date date; stage text; corrected text; reason text; hash text; result jsonb; event text;
  eid uuid; vid uuid; existing_packages integer;
BEGIN
  IF coalesce(p_mode,'') NOT IN ('ON','READ_ONLY') THEN RAISE EXCEPTION 'project_flow_off' USING ERRCODE='P5F01'; END IF;
  IF p_mode<>'ON' THEN RAISE EXCEPTION 'project_flow_read_only' USING ERRCODE='P5F02'; END IF;
  SELECT * INTO a FROM public.profiles WHERE id=p_actor FOR SHARE;
  IF NOT FOUND OR a.role IS NULL OR a.role NOT IN ('admin','manager') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE THEN
    RAISE EXCEPTION 'project_flow_access_denied' USING ERRCODE='42501'; END IF;
  IF p_action IS NULL OR p_action NOT IN ('transfer','basis','contract','start','complete','correct') OR p_revision IS NULL OR p_request_id IS NULL
    OR jsonb_typeof(p_data) IS DISTINCT FROM 'object' OR octet_length(p_data::text)>8000 THEN
    RAISE EXCEPTION 'project_flow_invalid_command' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT FROM jsonb_object_keys(p_data) k WHERE NOT k=ANY(CASE p_action
    WHEN 'transfer' THEN ARRAY['estimateId','versionId','plannedContractDate']
    WHEN 'basis' THEN ARRAY['versionId','reason']
    WHEN 'contract' THEN ARRAY['date','amount','amountBasis','reason','approveDifference','packageId']
    WHEN 'start' THEN ARRAY['date','plannedCompletionDate']
    WHEN 'complete' THEN ARRAY['date','note'] ELSE ARRAY['status','reason'] END)) THEN
    RAISE EXCEPTION 'project_flow_invalid_command' USING ERRCODE='22023'; END IF;
  SELECT * INTO pr FROM public.projects WHERE id=p_project FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'project_flow_not_found' USING ERRCODE='P0002'; END IF;
  old_pr:=pr;
  IF p_action='transfer' THEN
    eid:=(p_data->>'estimateId')::uuid;vid:=(p_data->>'versionId')::uuid;
  ELSE eid:=pr.flow_estimate_id;vid:=pr.flow_version_id; END IF;
  IF eid IS NULL OR vid IS NULL THEN RAISE EXCEPTION 'project_flow_confirmed_version_required' USING ERRCODE='23514'; END IF;
  SELECT * INTO e FROM public.estimates WHERE id=eid FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'project_flow_confirmed_version_required' USING ERRCODE='23514'; END IF;
  PERFORM 1 FROM public.profiles WHERE id=e.creator_id FOR SHARE;
  IF NOT public.and_os_estimate_can_edit(a.id,e.id) THEN RAISE EXCEPTION 'project_flow_access_denied' USING ERRCODE='42501'; END IF;
  IF public.and_os_preliminary_project(e.id) IS DISTINCT FROM pr.id THEN RAISE EXCEPTION 'project_flow_scope_conflict' USING ERRCODE='23514'; END IF;
  SELECT * INTO v FROM public.preliminary_estimate_versions WHERE id=vid AND estimate_id=e.id AND project_id=pr.id;
  IF NOT FOUND THEN RAISE EXCEPTION 'project_flow_confirmed_version_required' USING ERRCODE='23514'; END IF;
  hash:=encode(extensions.digest(jsonb_build_object('project',p_project,'action',p_action,'revision',p_revision,'data',p_data)::text,'sha256'),'hex');
  SELECT * INTO previous FROM public.os_audit_logs WHERE actor_user_id=a.id AND after_data->>'request_id'=p_request_id::text AND action LIKE 'PROJECT_FLOW_%';
  IF FOUND THEN
    IF previous.after_data->>'command_hash' IS DISTINCT FROM hash THEN RAISE EXCEPTION 'project_flow_request_conflict' USING ERRCODE='23514'; END IF;
    RETURN previous.after_data->'result';
  END IF;
  IF pr.flow_revision<>p_revision THEN RAISE EXCEPTION 'project_flow_revision_conflict' USING ERRCODE='40001'; END IF;
  stage:=public.and_os_project_stage(pr.status);
  reason:=nullif(trim(p_data->>'reason'),'');
  IF length(coalesce(reason,''))>1000 THEN RAISE EXCEPTION 'project_flow_invalid_command' USING ERRCODE='22023'; END IF;
  PERFORM set_config('and_os.project_flow_actor',a.id::text,true);
  IF p_action='transfer' THEN
    IF pr.flow_version_id IS NOT NULL OR stage<>'estimate' THEN RAISE EXCEPTION 'project_flow_already_transferred' USING ERRCODE='23514'; END IF;
    IF EXISTS(SELECT FROM public.contract_package_snapshots cp JOIN public.estimates ce ON ce.id=cp.estimate_id
      LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=ce.id
      WHERE coalesce(l.project_id,ce.project_id,ce.confirmation_project_id)=pr.id AND cp.status='CONTRACTED' AND cp.parent_package_id IS NULL) THEN
      RAISE EXCEPTION 'project_flow_existing_signed_contract' USING ERRCODE='23514'; END IF;
    planned_date:=nullif(p_data->>'plannedContractDate','')::date;
    UPDATE public.projects SET status='계약 준비',flow_estimate_id=e.id,flow_version_id=v.id,
      flow_transferred_by=a.id,flow_transferred_name=coalesce(nullif(a.name,''),'이름 미등록'),flow_transferred_at=stamp,
      flow_planned_contract_date=planned_date,flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_TRANSFERRED';
  ELSIF p_action='basis' THEN
    IF stage<>'preparation' OR pr.flow_contract_at IS NOT NULL THEN RAISE EXCEPTION 'project_flow_basis_locked' USING ERRCODE='23514'; END IF;
    IF reason IS NULL THEN RAISE EXCEPTION 'project_flow_reason_required' USING ERRCODE='22023'; END IF;
    SELECT * INTO v FROM public.preliminary_estimate_versions WHERE id=(p_data->>'versionId')::uuid AND estimate_id=e.id AND project_id=pr.id;
    IF NOT FOUND OR v.id=pr.flow_version_id THEN RAISE EXCEPTION 'project_flow_confirmed_version_required' USING ERRCODE='23514'; END IF;
    UPDATE public.projects SET flow_version_id=v.id,flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_BASIS_CHANGED';
  ELSIF p_action='contract' THEN
    IF stage<>'preparation' OR pr.flow_contract_at IS NOT NULL THEN RAISE EXCEPTION 'project_flow_invalid_transition' USING ERRCODE='23514'; END IF;
    actual_date:=(p_data->>'date')::date;actual_amount:=(p_data->>'amount')::numeric;
    IF actual_date IS NULL OR actual_date>today OR actual_amount IS NULL OR actual_amount<=0 OR actual_amount>1000000000000 OR actual_amount<>trunc(actual_amount)
      OR coalesce(p_data->>'amountBasis','') NOT IN ('supply','vat_included') THEN RAISE EXCEPTION 'project_flow_invalid_contract' USING ERRCODE='22023'; END IF;
    expected_amount:=CASE WHEN p_data->>'amountBasis'='supply' THEN v.supply_amount ELSE v.total_amount END;
    IF actual_amount<>expected_amount AND (a.role<>'admin' OR reason IS NULL OR p_data->'approveDifference' IS DISTINCT FROM 'true'::jsonb) THEN
      RAISE EXCEPTION 'project_flow_amount_admin_approval_required' USING ERRCODE='42501'; END IF;
    SELECT count(*) INTO existing_packages FROM public.contract_package_snapshots cp JOIN public.estimates ce ON ce.id=cp.estimate_id
      LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=ce.id
      WHERE coalesce(l.project_id,ce.project_id,ce.confirmation_project_id)=pr.id AND cp.status='CONTRACTED' AND cp.parent_package_id IS NULL;
    IF existing_packages>0 AND nullif(p_data->>'packageId','') IS NULL THEN RAISE EXCEPTION 'project_flow_existing_contract_required' USING ERRCODE='23514'; END IF;
    IF existing_packages>1 THEN RAISE EXCEPTION 'project_flow_existing_contract_review' USING ERRCODE='23514'; END IF;
    IF nullif(p_data->>'packageId','') IS NOT NULL THEN
      SELECT * INTO pack FROM public.contract_package_snapshots WHERE id=(p_data->>'packageId')::uuid FOR SHARE;
      IF NOT FOUND OR pack.estimate_id<>e.id OR pack.status<>'CONTRACTED' OR pack.parent_package_id IS NOT NULL THEN
        RAISE EXCEPTION 'project_flow_document_scope_conflict' USING ERRCODE='23514'; END IF;
    END IF;
    UPDATE public.projects SET status='계약 체결',flow_contract_date=actual_date,flow_contract_amount=actual_amount,
      flow_amount_basis=p_data->>'amountBasis',flow_amount_reason=CASE WHEN actual_amount<>expected_amount THEN reason ELSE NULL END,
      flow_contract_by=a.id,flow_contract_name=coalesce(nullif(a.name,''),'이름 미등록'),flow_contract_at=stamp,flow_package_id=pack.id,
      flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_CONTRACT_RECORDED';
  ELSIF p_action='start' THEN
    IF stage<>'contracted' OR pr.flow_contract_at IS NULL OR pr.flow_start_at IS NOT NULL THEN RAISE EXCEPTION 'project_flow_invalid_transition' USING ERRCODE='23514'; END IF;
    actual_date:=(p_data->>'date')::date;planned_date:=nullif(p_data->>'plannedCompletionDate','')::date;
    IF actual_date IS NULL OR actual_date<pr.flow_contract_date OR actual_date>today OR planned_date<actual_date THEN RAISE EXCEPTION 'project_flow_invalid_date' USING ERRCODE='22023'; END IF;
    UPDATE public.projects SET status='착공',flow_start_date=actual_date,flow_planned_completion_date=planned_date,
      flow_start_by=a.id,flow_start_name=coalesce(nullif(a.name,''),'이름 미등록'),flow_start_at=stamp,
      flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_STARTED';
  ELSIF p_action='complete' THEN
    IF stage<>'started' OR pr.flow_start_at IS NULL OR pr.flow_completion_at IS NOT NULL THEN RAISE EXCEPTION 'project_flow_invalid_transition' USING ERRCODE='23514'; END IF;
    actual_date:=(p_data->>'date')::date;
    IF actual_date IS NULL OR actual_date<pr.flow_start_date OR actual_date>today OR length(coalesce(p_data->>'note',''))>1000 THEN RAISE EXCEPTION 'project_flow_invalid_date' USING ERRCODE='22023'; END IF;
    UPDATE public.projects SET status='준공',flow_completion_date=actual_date,flow_completion_note=nullif(trim(p_data->>'note'),''),
      flow_completion_by=a.id,flow_completion_name=coalesce(nullif(a.name,''),'이름 미등록'),flow_completion_at=stamp,
      flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_COMPLETED';
  ELSE
    IF a.role<>'admin' THEN RAISE EXCEPTION 'project_flow_access_denied' USING ERRCODE='42501'; END IF;
    IF reason IS NULL THEN RAISE EXCEPTION 'project_flow_reason_required' USING ERRCODE='22023'; END IF;
    corrected:=CASE WHEN pr.flow_completion_at IS NOT NULL THEN '준공' WHEN pr.flow_start_at IS NOT NULL THEN '착공'
      WHEN pr.flow_contract_at IS NOT NULL THEN '계약 체결' ELSE '계약 준비' END;
    IF p_data->>'status' IS DISTINCT FROM corrected OR pr.status=corrected THEN RAISE EXCEPTION 'project_flow_correction_requires_evidence' USING ERRCODE='23514'; END IF;
    UPDATE public.projects SET status=corrected,flow_revision=flow_revision+1,updated_at=stamp WHERE id=pr.id RETURNING * INTO pr;
    event:='PROJECT_FLOW_CORRECTED';
  END IF;
  result:=jsonb_build_object('projectId',pr.id,'revision',pr.flow_revision::text,'status',pr.status,'versionId',pr.flow_version_id);
  INSERT INTO public.os_audit_logs(created_at,actor_user_id,actor_name,actor_role,action,target_type,target_id,result,reason,before_data,after_data)
    VALUES(stamp,a.id,coalesce(nullif(a.name,''),'이름 미등록'),a.role,event,'project',pr.id::text,'SUCCESS',reason,
      public.and_os_project_flow_fields(to_jsonb(old_pr)),
      public.and_os_project_flow_fields(to_jsonb(pr))||jsonb_build_object('project_id',pr.id,'request_id',p_request_id,'command_hash',hash,'result',result));
  PERFORM set_config('and_os.project_flow_actor','',true);
  RETURN result;
END $$;

REVOKE ALL ON FUNCTION public.and_os_project_stage(text),public.and_os_project_flow_fields(jsonb),
  public.and_os_guard_project_flow(),public.and_os_guard_project_flow_audit(),
  public.and_os_project_flow_command(uuid,uuid,text,bigint,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_project_flow_command(uuid,uuid,text,bigint,uuid,jsonb,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
