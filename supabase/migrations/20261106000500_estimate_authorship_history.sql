BEGIN;

ALTER TABLE public.estimates
  ADD COLUMN creator_id uuid,
  ADD COLUMN creator_name text,
  ADD COLUMN creator_role text CHECK (creator_role IN ('admin','manager','staff')),
  ADD COLUMN creator_recorded_at timestamptz,
  ADD COLUMN last_editor_id uuid,
  ADD COLUMN last_editor_name text,
  ADD COLUMN last_edited_at timestamptz,
  ADD COLUMN revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0);

-- Historical JSON authors were client writable. Do not infer ownership from them.
CREATE FUNCTION public.and_os_estimate_can_edit(p_actor uuid, p_estimate uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE((SELECT a.is_active IS TRUE AND a.must_change_password IS FALSE
    AND (a.role = 'admin' OR (e.creator_id IS NOT NULL AND c.role = e.creator_role
      AND c.is_active IS TRUE AND c.must_change_password IS FALSE
      AND ((a.id = e.creator_id AND a.role = e.creator_role)
        OR (a.role = 'manager' AND e.creator_role = 'staff'))))
    FROM public.estimates e JOIN public.profiles a ON a.id = p_actor
    LEFT JOIN public.profiles c ON c.id = e.creator_id WHERE e.id = p_estimate), false)
$$;

CREATE FUNCTION public.and_os_estimate_canonical(p_value jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE v jsonb;
BEGIN
  IF jsonb_typeof(p_value) = 'object' THEN
    SELECT COALESCE(jsonb_object_agg(key, public.and_os_estimate_canonical(value)), '{}'::jsonb) INTO v
      FROM jsonb_each(p_value) WHERE key NOT IN ('savedAt','capturedAt','author','actor','projectSearch','projectSearchResults');
    RETURN v;
  ELSIF jsonb_typeof(p_value) = 'array' THEN
    SELECT COALESCE(jsonb_agg(public.and_os_estimate_canonical(value) ORDER BY ord), '[]'::jsonb) INTO v
      FROM jsonb_array_elements(p_value) WITH ORDINALITY AS t(value,ord);
    RETURN v;
  END IF;
  RETURN p_value;
END $$;

CREATE FUNCTION public.and_os_estimate_business(p_row jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
  SELECT public.and_os_estimate_canonical(jsonb_build_object(
    'project_name',p_row->'project_name','client_name',p_row->'client_name','phone',p_row->'phone',
    'address',p_row->'address','area_pyeong',p_row->'area_pyeong','status',p_row->'status',
    'total_price',p_row->'total_price','cost_total',p_row->'cost_total','margin_rate',p_row->'margin_rate',
    'estimate_data',p_row->'estimate_data'))
$$;

CREATE FUNCTION public.and_os_estimate_history_values(p_row jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp AS $$
DECLARE v jsonb; k text; x jsonb;
BEGIN
  v := COALESCE(p_row - ARRAY['id','project_id','created_at','updated_at','estimate_data',
    'creator_id','creator_name','creator_role','creator_recorded_at','last_editor_id','last_editor_name','last_edited_at','revision'], '{}'::jsonb);
  IF v ? 'phone' THEN v := jsonb_set(v,'{phone}',to_jsonb(CASE WHEN COALESCE(v->>'phone','') = '' THEN '' ELSE '연락처 변경' END)); END IF;
  FOR k,x IN SELECT key,value FROM jsonb_each(COALESCE(p_row#>'{estimate_data,inputs}','{}'::jsonb)) LOOP
    IF k NOT IN ('projectSearch','projectSearchResults','clientPhone','clientName','projectName') THEN
      v := v || jsonb_build_object('input:' || k,x);
    END IF;
  END LOOP;
  v := v || jsonb_build_object('customer_items',p_row#>'{estimate_data,customerQuote,groups}',
    'additional_items',p_row#>'{estimate_data,itemBuilder,publicRows}');
  RETURN public.and_os_estimate_canonical(v);
END $$;

CREATE FUNCTION public.and_os_guard_estimate_save()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF COALESCE(current_setting('and_os.estimate_save_actor',true),'') = '' THEN
    RAISE EXCEPTION 'estimate_command_required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND ROW(NEW.creator_id,NEW.creator_name,NEW.creator_role,NEW.creator_recorded_at,NEW.created_at,NEW.project_id)
    IS DISTINCT FROM ROW(OLD.creator_id,OLD.creator_name,OLD.creator_role,OLD.creator_recorded_at,OLD.created_at,OLD.project_id) THEN
    RAISE EXCEPTION 'estimate_identity_immutable' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER and_os_estimate_save_guard BEFORE INSERT OR UPDATE OR DELETE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_estimate_save();

CREATE FUNCTION public.and_os_guard_estimate_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.action LIKE 'ESTIMATE_SAVE_%' THEN
    RAISE EXCEPTION 'estimate_history_immutable' USING ERRCODE = '42501';
  END IF;
  IF TG_OP <> 'DELETE' AND NEW.action LIKE 'ESTIMATE_SAVE_%'
    AND (TG_OP <> 'INSERT' OR COALESCE(current_setting('and_os.estimate_save_actor',true),'') IS DISTINCT FROM NEW.actor_user_id::text) THEN
    RAISE EXCEPTION 'estimate_history_command_required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER and_os_estimate_audit_guard BEFORE INSERT OR UPDATE OR DELETE ON public.os_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.and_os_guard_estimate_audit();
REVOKE TRUNCATE ON public.os_audit_logs FROM service_role;
REVOKE INSERT, UPDATE, DELETE ON public.estimates FROM authenticated, anon;
CREATE INDEX os_audit_estimate_history_idx ON public.os_audit_logs(target_id,created_at DESC,id)
  WHERE action LIKE 'ESTIMATE_SAVE_%';

CREATE FUNCTION public.and_os_save_estimate(p_actor uuid, p_id uuid, p_expected_revision bigint, p_row jsonb, p_delete boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE a public.profiles; old_row public.estimates; saved public.estimates;
  old_values jsonb; new_values jsonb; before_diff jsonb; after_diff jsonb; stamp timestamptz := clock_timestamp();
BEGIN
  SELECT * INTO a FROM public.profiles WHERE id = p_actor FOR SHARE;
  IF NOT FOUND OR a.role IS NULL OR a.role NOT IN ('admin','manager','staff') OR a.is_active IS NOT TRUE OR a.must_change_password IS NOT FALSE THEN
    RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE = '42501';
  END IF;
  IF p_id IS NOT NULL THEN
    SELECT * INTO old_row FROM public.estimates WHERE id = p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'estimate_not_found' USING ERRCODE = 'P0002'; END IF;
    PERFORM 1 FROM public.profiles WHERE id = old_row.creator_id FOR SHARE;
    IF NOT public.and_os_estimate_can_edit(p_actor,p_id) OR (p_delete AND a.role <> 'admin') THEN
      RAISE EXCEPTION 'estimate_access_denied' USING ERRCODE = '42501';
    END IF;
    IF p_expected_revision IS NULL OR p_expected_revision <> old_row.revision THEN
      RAISE EXCEPTION 'estimate_revision_conflict' USING ERRCODE = '40001';
    END IF;
    IF NOT p_delete AND public.and_os_estimate_business(to_jsonb(old_row)) = public.and_os_estimate_business(p_row) THEN
      RETURN to_jsonb(old_row);
    END IF;
  ELSIF p_delete OR p_expected_revision IS NOT NULL THEN
    RAISE EXCEPTION 'estimate_invalid_command' USING ERRCODE = '22023';
  END IF;
  PERFORM set_config('and_os.estimate_save_actor',p_actor::text,true);
  IF p_delete THEN
    DELETE FROM public.estimates WHERE id = p_id;
    saved := old_row;
  ELSIF p_id IS NULL THEN
    INSERT INTO public.estimates(project_name,client_name,phone,address,area_pyeong,status,total_price,cost_total,margin_rate,estimate_data,
      creator_id,creator_name,creator_role,creator_recorded_at,last_editor_id,last_editor_name,last_edited_at,revision)
    VALUES (p_row->>'project_name',p_row->>'client_name',p_row->>'phone',p_row->>'address',(p_row->>'area_pyeong')::numeric,
      p_row->>'status',(p_row->>'total_price')::numeric,(p_row->>'cost_total')::numeric,(p_row->>'margin_rate')::numeric,p_row->'estimate_data',
      a.id,COALESCE(NULLIF(a.name,''),'이름 미등록'),a.role,stamp,a.id,COALESCE(NULLIF(a.name,''),'이름 미등록'),stamp,1) RETURNING * INTO saved;
  ELSE
    UPDATE public.estimates SET project_name=p_row->>'project_name',client_name=p_row->>'client_name',phone=p_row->>'phone',
      address=p_row->>'address',area_pyeong=(p_row->>'area_pyeong')::numeric,status=p_row->>'status',total_price=(p_row->>'total_price')::numeric,
      cost_total=(p_row->>'cost_total')::numeric,margin_rate=(p_row->>'margin_rate')::numeric,estimate_data=p_row->'estimate_data',
      last_editor_id=a.id,last_editor_name=COALESCE(NULLIF(a.name,''),'이름 미등록'),last_edited_at=stamp,updated_at=stamp,revision=revision+1
      WHERE id=p_id RETURNING * INTO saved;
  END IF;
  old_values := public.and_os_estimate_history_values(CASE WHEN p_id IS NULL THEN '{}'::jsonb ELSE to_jsonb(old_row) END);
  new_values := public.and_os_estimate_history_values(CASE WHEN p_delete THEN '{}'::jsonb ELSE to_jsonb(saved) END);
  SELECT COALESCE(jsonb_object_agg(k,old_values->k),'{}'::jsonb),COALESCE(jsonb_object_agg(k,new_values->k),'{}'::jsonb)
    INTO before_diff,after_diff FROM (SELECT jsonb_object_keys(old_values || new_values) k) keys
    WHERE old_values->k IS DISTINCT FROM new_values->k;
  IF p_id IS NULL THEN
    before_diff := '{}'::jsonb;
    after_diff := jsonb_build_object('total_price',saved.total_price);
  END IF;
  IF p_id IS NOT NULL AND old_row.phone IS DISTINCT FROM saved.phone THEN
    before_diff := before_diff || jsonb_build_object('phone','이전 연락처 (비공개)');
    after_diff := after_diff || jsonb_build_object('phone','연락처 변경 (비공개)');
  END IF;
  INSERT INTO public.os_audit_logs(created_at,actor_user_id,actor_name,actor_role,action,target_type,target_id,before_data,after_data,result)
    VALUES (stamp,a.id,COALESCE(NULLIF(a.name,''),'이름 미등록'),a.role,
      CASE WHEN p_delete THEN 'ESTIMATE_SAVE_DELETE' WHEN p_id IS NULL THEN 'ESTIMATE_SAVE_CREATE' ELSE 'ESTIMATE_SAVE_UPDATE' END,
      'estimate',saved.id::text,jsonb_build_object('revision',COALESCE(old_row.revision,0),'changes',before_diff),
      jsonb_build_object('revision',saved.revision,'changes',after_diff),'SUCCESS');
  PERFORM set_config('and_os.estimate_save_actor','',true);
  RETURN to_jsonb(saved);
END $$;

REVOKE ALL ON FUNCTION public.and_os_estimate_can_edit(uuid,uuid), public.and_os_estimate_canonical(jsonb),
  public.and_os_estimate_business(jsonb), public.and_os_estimate_history_values(jsonb), public.and_os_guard_estimate_save(),
  public.and_os_guard_estimate_audit(), public.and_os_save_estimate(uuid,uuid,bigint,jsonb,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_estimate_can_edit(uuid,uuid), public.and_os_save_estimate(uuid,uuid,bigint,jsonb,boolean) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
