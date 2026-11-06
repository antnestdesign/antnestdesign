-- Company preliminary-estimate settings. No existing estimate or contract is rewritten.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';

CREATE TABLE public.preliminary_policy_versions (
  version integer PRIMARY KEY CHECK(version>0),
  config jsonb NOT NULL CHECK(jsonb_typeof(config)='object'),
  reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 1 AND 500),
  published_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at timestamptz NOT NULL DEFAULT now(),
  cost_version text
);
CREATE TABLE public.preliminary_policy_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  current_version integer REFERENCES public.preliminary_policy_versions(version),
  revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
  draft_config jsonb,
  draft_master_hash text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK((draft_config IS NULL)=(draft_master_hash IS NULL))
);
INSERT INTO public.preliminary_policy_state(singleton) VALUES(true);
ALTER TABLE public.preliminary_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preliminary_policy_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.preliminary_policy_versions,public.preliminary_policy_state FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.preliminary_policy_versions,public.preliminary_policy_state TO service_role;

CREATE FUNCTION public.and_os_preliminary_policy_role(p_write boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_active=true AND must_change_password=false AND
    CASE WHEN p_write THEN role='admin' ELSE role IN('admin','manager') END) THEN
    RAISE EXCEPTION '산정 기준에 접근할 권한이 없습니다.' USING ERRCODE='42501';
  END IF;
END $$;

CREATE FUNCTION public.and_os_preliminary_policy_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF TG_TABLE_NAME='preliminary_policy_versions' AND TG_OP<>'INSERT' THEN
    RAISE EXCEPTION '게시된 산정 기준은 변경할 수 없습니다.';
  END IF;
  IF coalesce(current_setting('request.and_os_preliminary_policy',true),'')<>'on' THEN
    RAISE EXCEPTION '승인된 산정 기준 명령을 사용해야 합니다.';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER preliminary_policy_versions_guard BEFORE INSERT OR UPDATE OR DELETE ON public.preliminary_policy_versions FOR EACH ROW EXECUTE FUNCTION public.and_os_preliminary_policy_guard();
CREATE TRIGGER preliminary_policy_state_guard BEFORE INSERT OR UPDATE OR DELETE ON public.preliminary_policy_state FOR EACH ROW EXECUTE FUNCTION public.and_os_preliminary_policy_guard();

CREATE FUNCTION public.and_os_preliminary_policy_manifest() RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $manifest$ SELECT '{"prices":["BASEBOARD_MATERIAL","BASIC_DEMOLITION_NORMAL","BASIC_DEMOLITION_SPECIAL","BATH_BATHTUB","BATH_FAN_NORMAL","BATH_FIXTURE_INSTALL","BATH_FIXTURE_SET","BATH_GLASS_BOOTH","BATH_GLASS_PARTITION","BATH_HUGENT_INSTALL_EXTRA","BATH_HUGENT_MACHINE","BATH_MASONRY_LABOR","BATH_PLUMBING_RELOCATION","BATH_PORCELAIN_TILE_MATERIAL","BATH_PREMIUM_EXTRA","BATH_SMC_CEILING","CABINET_BUILT_IN_WARDROBE","CABINET_DRAWER","CABINET_EP_DEEP","CABINET_EP_SHALLOW","CABINET_FRIDGE_LAUNDRY","CABINET_HANGER_WARDROBE","CABINET_HOMEBAR_BUILD","CABINET_ISLAND","CABINET_LOWER","CABINET_PANTRY","CABINET_PANTRY_DRAWER","CABINET_RICE","CABINET_SHOE","CABINET_TALL","CABINET_UPPER","COUNTER_CERAMIC_FACTORY","COUNTER_CERAMIC_INSTALL","COUNTER_CERAMIC_SLAB","COUNTER_EP_PANEL_PER_M","COUNTER_HIMACS_PER_M","COUNTER_KHANSTONE_FACTORY","COUNTER_KHANSTONE_INSTALL","COUNTER_KHANSTONE_SLAB","DEMO_BATHROOM_WATERPROOF","DEMO_CABINET_PER_JA","DEMO_CEILING_PER_PYEONG","DEMO_ELEVATOR_PROTECT","DEMO_ELEVATOR_PROTECT_REMOVAL","DEMO_FLOOR_DECOTILE","DEMO_FLOOR_WOOD","DEMO_VINYL","DRYWALL_FALLBACK","ELEC_BACHMANN_OUTLET","ELEC_BED_WALL_LIGHT","ELEC_CYLINDER_LIGHT","ELEC_DAYS_OVER10","ELEC_DAYS_UNDER10","ELEC_DOWNLIGHT","ELEC_LABOR_HELPER","ELEC_LABOR_WORKER","ELEC_SQUARE_LIGHT","ELEC_STANDARD_SWITCH","ELEC_T3_PER_M","ELEC_WIRING","FAN_INSTALL_APPROVED","FILM_LABOR","FILM_WOOD","FINISH_ELASTIC_BASE","FINISH_ELASTIC_EXTRA_ROOM","FINISH_SILICONE","FLOORING_SHEET_18T","FLOORING_SHEET_20T","FLOORING_SHEET_22T","FLOORING_SHEET_32T","FLOORING_SHEET_45T","FLOORING_SHEET_50T","FLOORING_WOOD_PER_PYEONG","FLOORING_WOOD_STANDARD","GENERAL_WASTE","INTERIOR_PROTECTION","KITCHEN_FAUCET","KITCHEN_HOOD","KITCHEN_SINK_BOWL","KITCHEN_STANDARD_INSTALL","LIGHT_LINE_CABINET","LIGHT_T3_CABINET","MIDDLE_DOOR","MISC_EXISTING_PIPE_CLEANING","MOLDING_MATERIAL","MOVE_IN_CLEANING","OUTLET_MOVE","PERMIT_CONSENT","PERMIT_CONSTRUCTION","SLIDING_DOOR","STANDARD_DOOR","SWITCH_MOVE","TILE_GROUT","TILE_LABOR_HELPER","TILE_LABOR_WORKER","WALLPAPER_LABOR","WALLPAPER_MATERIAL_PER_PYEONG","WALLPAPER_ROLL_BESTI","WALLPAPER_ROLL_DIAMANT","WALLPAPER_ROLL_FORTIS","WOOD_CEILING_FAN","WOOD_DRYWALL_SHEET","WOOD_LABOR_WORKER","WOOD_LIFTING","WOOD_MACHINE_DAY","WOOD_MDF_SHEET","WOOD_PLYWOOD_SHEET","WOOD_STUD_BUNDLE","WOOD_SUBSIDIARY"],"parameters":["artwallDays","baseboardDays","boardHeight","boardWidth","cofferLegacyChange","cofferLegacyNew","counterMinimumM","curtainLegacyDays","dropLegacyDays","filmRollArea","finishHeight","finishWaste","fixtureValueMultiplier","hiddenDoorDays","homebarBaseJa","indirectLegacyDays","islandLongSideM","islandSideThreshold","islandWideMultiplier","islandWideThreshold","lineLightDays","moldingDays","partitionSides","studBundleCount","studLength","studSpacing","tvPlywood","wallpaperRollArea","woodWaste"],"rules":{"wallpaper.p20.basic":[],"wallpaper.p20.base":[],"wallpaper.p30.basic":[],"wallpaper.p30.base":[],"wallpaper.p40.basic":[],"wallpaper.p40.base":[],"wallpaper.p50.basic":[],"wallpaper.p50.base":[],"film.p20":[],"film.p30":[],"film.p40":[],"film.p50":[],"tile.worker":["count"],"tile.helper":["count"],"tile.masonry":["count"],"wallpaper.area":["lengthMm","heightMm","ceilingArea","waste"],"wallpaper.rolls":["area","rollArea"],"film.area":["lengthMm","heightMm","waste"],"film.rolls":["area","rollArea"],"furniture.ja":["lengthMm"],"carpentry.t3":["lengthMm"],"carpentry.laborRound":["rawDays"],"carpentry.boardWaste":["quantity","waste"],"carpentry.wallBoards":["area","boardArea"],"carpentry.verticalStuds":["lengthMm","spacingMm"],"carpentry.studBundles":["lengthMm","waste","bundleLength"],"bom.coffer.WOOD_LABOR_WORKER":["count"],"bom.coffer.WOOD_MACHINE_DAY":["count"],"bom.coffer.WOOD_DRYWALL_SHEET":["count"],"bom.coffer.WOOD_STUD_BUNDLE":["count"],"bom.coffer.WOOD_MDF_SHEET":["count"],"bom.curtain.WOOD_LABOR_WORKER":["count"],"bom.curtain.WOOD_MACHINE_DAY":["count"],"bom.curtain.WOOD_STUD_BUNDLE":["count"],"bom.curtain.WOOD_PLYWOOD_SHEET":["count"],"bom.drop.WOOD_LABOR_WORKER":["count"],"bom.drop.WOOD_MACHINE_DAY":["count"],"bom.drop.WOOD_STUD_BUNDLE":["count"],"bom.drop.WOOD_DRYWALL_SHEET":["count"]}}'::jsonb $manifest$;

CREATE FUNCTION public.and_os_preliminary_policy_valid(p_config jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog,public AS $$
DECLARE v_count integer; v_bad integer; v_manifest jsonb:=public.and_os_preliminary_policy_manifest(); v_area text; v_work text; v_actual text[]; v_expected text[];
BEGIN
  IF p_config IS NULL OR jsonb_typeof(p_config)<>'object' OR pg_column_size(p_config)>150000 OR p_config->'schema'<>'1'::jsonb OR
    (SELECT array_agg(key ORDER BY key) FROM jsonb_object_keys(p_config) key)<>ARRAY['parameters','prices','rules','schema']::text[] THEN RETURN false; END IF;
  IF jsonb_typeof(p_config->'prices')<>'object' OR jsonb_typeof(p_config->'parameters')<>'object' OR jsonb_typeof(p_config->'rules')<>'object' THEN RETURN false; END IF;
  FOREACH v_area IN ARRAY ARRAY['prices','parameters','rules'] LOOP
    SELECT array_agg(key ORDER BY key) INTO v_actual FROM jsonb_object_keys(p_config->v_area) key;
    IF v_area='rules' THEN SELECT array_agg(key ORDER BY key) INTO v_expected FROM jsonb_object_keys(v_manifest->'rules') key;
    ELSE SELECT array_agg(value ORDER BY value) INTO v_expected FROM jsonb_array_elements_text(v_manifest->v_area); END IF;
    IF v_actual IS DISTINCT FROM v_expected THEN RETURN false; END IF;
  END LOOP;
  IF EXISTS(SELECT 1 FROM jsonb_each(p_config->'prices') e WHERE CASE WHEN jsonb_typeof(e.value)='number' THEN (e.value::text)::numeric<0 OR (e.value::text)::numeric>1000000000 ELSE true END) THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(p_config->'parameters') e WHERE CASE WHEN jsonb_typeof(e.value)='number' THEN (e.value::text)::numeric<0 OR (e.value::text)::numeric>10000000 ELSE true END) THEN RETURN false; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(p_config->'parameters') e WHERE key IN('wallpaperRollArea','filmRollArea','boardWidth','boardHeight','studSpacing','studLength','studBundleCount') AND (value::text)::numeric<=0) THEN RETURN false; END IF;
  FOREACH v_work IN ARRAY ARRAY['coffer','curtain','drop'] LOOP
    IF p_config->'rules'->('bom.'||v_work||'.WOOD_LABOR_WORKER') IS DISTINCT FROM p_config->'rules'->('bom.'||v_work||'.WOOD_MACHINE_DAY') THEN RETURN false; END IF;
  END LOOP;
  WITH RECURSIVE nodes(rule_key,node,depth) AS (
    SELECT key,value,0 FROM jsonb_each(p_config->'rules')
    UNION ALL
    SELECT rule_key,child,depth+1 FROM nodes CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(node->'args')='array' AND depth<13 THEN node->'args' ELSE '[]'::jsonb END) child
  ) SELECT count(*),count(*) FILTER(WHERE depth>12 OR jsonb_typeof(node)<>'object' OR (node->>'operator'='divide' AND node->'args'->1->'value'='0'::jsonb) OR NOT (
    (node ? 'value' AND (SELECT count(*) FROM jsonb_object_keys(node))=1 AND jsonb_typeof(node->'value')='number' AND abs((node->>'value')::numeric)<=1000000000) OR
    (node ? 'variable' AND (SELECT count(*) FROM jsonb_object_keys(node))=1 AND jsonb_typeof(node->'variable')='string' AND (v_manifest->'rules'->rule_key) ? (node->>'variable')) OR
    (node->>'operator' IN('add','subtract','multiply','divide','ceil','floor','round','min','max','if','gt','gte') AND (SELECT count(*) FROM jsonb_object_keys(node))=2 AND jsonb_typeof(node->'args')='array' AND jsonb_array_length(node->'args')=CASE WHEN node->>'operator' IN('ceil','floor','round') THEN 1 WHEN node->>'operator'='if' THEN 3 ELSE 2 END)
  )) INTO v_count,v_bad FROM nodes;
  RETURN v_count BETWEEN 1 AND 10000 AND v_bad=0;
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE FUNCTION public.get_preliminary_policy_state() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.preliminary_policy_state; v_masters jsonb; v_hash text;
BEGIN
  PERFORM public.and_os_preliminary_policy_role(false);
  PERFORM pg_advisory_xact_lock(hashtext('and_os_cost_publish'));
  SELECT * INTO s FROM public.preliminary_policy_state WHERE singleton FOR SHARE;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'item_code',item_code,'item_name',item_name,'unit',unit,'cost_price',cost_price,'is_active',is_active) ORDER BY item_code),'[]'::jsonb),
    md5(coalesce(jsonb_object_agg(item_code,jsonb_build_array(cost_price,unit,is_active,default_margin_rate))::text,'{}')) INTO v_masters,v_hash FROM public.cost_items WHERE NOT is_pending_new;
  RETURN jsonb_build_object('version',coalesce(s.current_version,0),'revision',s.revision,'draft',s.draft_config,'draft_master_hash',s.draft_master_hash,'master_hash',v_hash,'masters',v_masters,
    'current',(SELECT config FROM public.preliminary_policy_versions WHERE version=s.current_version),
    'history',(SELECT coalesce(jsonb_agg(jsonb_build_object('version',version,'reason',reason,'published_at',published_at,'published_by',published_by) ORDER BY version DESC),'[]'::jsonb) FROM (SELECT * FROM public.preliminary_policy_versions ORDER BY version DESC LIMIT 30) v));
END $$;

CREATE FUNCTION public.save_preliminary_policy_draft(p_config jsonb,p_expected_revision integer,p_master_hash text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.preliminary_policy_state; v_hash text;
BEGIN
  PERFORM public.and_os_preliminary_policy_role(true);
  IF NOT public.and_os_preliminary_policy_valid(p_config) THEN RAISE EXCEPTION '산정 기준 형식을 확인해 주세요.' USING ERRCODE='22023'; END IF;
  SELECT * INTO s FROM public.preliminary_policy_state WHERE singleton FOR UPDATE;
  IF p_expected_revision IS NULL OR s.revision<>p_expected_revision THEN RAISE EXCEPTION '다른 사용자가 산정 기준을 변경했습니다. 다시 불러와 주세요.' USING ERRCODE='40001'; END IF;
  SELECT md5(coalesce(jsonb_object_agg(item_code,jsonb_build_array(cost_price,unit,is_active,default_margin_rate))::text,'{}')) INTO v_hash FROM public.cost_items WHERE NOT is_pending_new;
  IF p_master_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION '원가 DB가 변경되었습니다. 다시 불러와 주세요.' USING ERRCODE='40001'; END IF;
  PERFORM set_config('request.and_os_preliminary_policy','on',true);
  UPDATE public.preliminary_policy_state SET draft_config=p_config,draft_master_hash=p_master_hash,revision=revision+1,updated_by=auth.uid(),updated_at=now() WHERE singleton RETURNING revision INTO p_expected_revision;
  RETURN p_expected_revision;
END $$;

CREATE FUNCTION public.cancel_preliminary_policy_draft(p_expected_revision integer) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_revision integer;
BEGIN
  PERFORM public.and_os_preliminary_policy_role(true);
  SELECT revision INTO v_revision FROM public.preliminary_policy_state WHERE singleton FOR UPDATE;
  IF p_expected_revision IS NULL OR v_revision<>p_expected_revision THEN RAISE EXCEPTION '산정 기준 개정 충돌입니다.' USING ERRCODE='40001'; END IF;
  PERFORM set_config('request.and_os_preliminary_policy','on',true);
  UPDATE public.preliminary_policy_state SET draft_config=null,draft_master_hash=null,revision=revision+1,updated_by=auth.uid(),updated_at=now() WHERE singleton RETURNING revision INTO v_revision;
  RETURN v_revision;
END $$;

CREATE FUNCTION public.publish_preliminary_policy(p_expected_revision integer,p_reason text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE s public.preliminary_policy_state; v_hash text; r record; v_cost_version text; v_changed boolean:=false; v_version integer;
BEGIN
  PERFORM public.and_os_preliminary_policy_role(true);
  IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION '게시 사유를 입력해 주세요.' USING ERRCODE='22023'; END IF;
  -- Same order as the existing publisher: company publish lock, policy head, cost rows.
  PERFORM pg_advisory_xact_lock(hashtext('and_os_cost_publish'));
  SELECT * INTO s FROM public.preliminary_policy_state WHERE singleton FOR UPDATE;
  IF p_expected_revision IS NULL OR s.revision<>p_expected_revision THEN RAISE EXCEPTION '산정 기준 개정 충돌입니다.' USING ERRCODE='40001'; END IF;
  IF s.draft_config IS NULL OR NOT public.and_os_preliminary_policy_valid(s.draft_config) THEN RAISE EXCEPTION '유효한 임시저장 기준이 없습니다.' USING ERRCODE='22023'; END IF;
  PERFORM 1 FROM public.cost_items ORDER BY id FOR UPDATE;
  SELECT md5(coalesce(jsonb_object_agg(item_code,jsonb_build_array(cost_price,unit,is_active,default_margin_rate))::text,'{}')) INTO v_hash FROM public.cost_items WHERE NOT is_pending_new;
  IF v_hash IS DISTINCT FROM s.draft_master_hash THEN RAISE EXCEPTION '원가 DB가 변경되었습니다. 다시 불러와 주세요.' USING ERRCODE='40001'; END IF;
  IF EXISTS(SELECT 1 FROM public.cost_items WHERE is_pending_new OR draft_cost_price IS NOT NULL OR draft_margin_rate IS NOT NULL OR draft_is_active IS NOT NULL) THEN
    RAISE EXCEPTION '기존 원가 임시저장 항목을 먼저 게시하거나 취소해 주세요.' USING ERRCODE='40001';
  END IF;
  FOR r IN SELECT c.id,c.cost_price,(e.value::text)::numeric AS next_price FROM public.cost_items c JOIN jsonb_each(s.draft_config->'prices') e ON e.key=c.item_code WHERE jsonb_typeof(e.value)='number' AND c.cost_price IS DISTINCT FROM (e.value::text)::numeric ORDER BY c.id LOOP
    PERFORM public.save_cost_item_draft(r.id,r.next_price,null,null);v_changed:=true;
  END LOOP;
  IF v_changed THEN SELECT version INTO v_cost_version FROM public.publish_cost_drafts(p_reason,'가견적 산정 기준과 원가 단가 동시 게시'); END IF;
  v_version:=coalesce(s.current_version,0)+1;
  PERFORM set_config('request.and_os_preliminary_policy','on',true);
  INSERT INTO public.preliminary_policy_versions(version,config,reason,published_by,cost_version) VALUES(v_version,s.draft_config,btrim(p_reason),auth.uid(),v_cost_version);
  UPDATE public.preliminary_policy_state SET current_version=v_version,draft_config=null,draft_master_hash=null,revision=revision+1,updated_by=auth.uid(),updated_at=now() WHERE singleton;
  RETURN v_version;
END $$;

REVOKE ALL ON FUNCTION public.and_os_preliminary_policy_role(boolean),public.and_os_preliminary_policy_guard(),public.and_os_preliminary_policy_valid(jsonb),public.get_preliminary_policy_state(),public.save_preliminary_policy_draft(jsonb,integer,text),public.cancel_preliminary_policy_draft(integer),public.publish_preliminary_policy(integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_preliminary_policy_state(),public.save_preliminary_policy_draft(jsonb,integer,text),public.cancel_preliminary_policy_draft(integer),public.publish_preliminary_policy(integer,text) TO authenticated;
REVOKE ALL ON FUNCTION public.and_os_preliminary_policy_manifest() FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
