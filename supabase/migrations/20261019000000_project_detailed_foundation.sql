-- Phase 5B-1. Additive foundation; no business backfill or contract/cost RPC changes.
BEGIN;
SET LOCAL search_path = pg_catalog, public, extensions;

ALTER TABLE public.projects ADD COLUMN os_managed_at timestamptz,
  ADD COLUMN os_managed_by uuid REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT projects_managed_pair CHECK ((os_managed_at IS NULL) = (os_managed_by IS NULL));
CREATE INDEX projects_managed_idx ON public.projects(os_managed_at, id);

CREATE TABLE public.project_preliminary_estimates (
  estimate_id uuid PRIMARY KEY REFERENCES public.estimates(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  linked_by uuid NOT NULL REFERENCES auth.users(id), linked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(estimate_id, project_id)
);
CREATE TABLE public.detailed_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  origin_kind text NOT NULL DEFAULT 'PRELIMINARY' CHECK (origin_kind = 'PRELIMINARY'),
  created_by uuid NOT NULL REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id, project_id)
);
CREATE TABLE public.detailed_estimate_drafts (
  detailed_estimate_id uuid PRIMARY KEY REFERENCES public.detailed_estimates(id) ON DELETE RESTRICT,
  revision bigint NOT NULL CHECK (revision >= 1), public_context_json jsonb NOT NULL CHECK (jsonb_typeof(public_context_json) = 'object'),
  updated_by uuid NOT NULL REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.detailed_estimate_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), detailed_estimate_id uuid NOT NULL UNIQUE,
  project_id uuid NOT NULL, source_estimate_id uuid NOT NULL,
  source_updated_at timestamptz, reference_schema_version text NOT NULL CHECK (reference_schema_version = '5b1-public-v1'),
  reference_public_json jsonb NOT NULL, source_public_hash text NOT NULL,
  captured_by uuid NOT NULL REFERENCES auth.users(id), captured_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(detailed_estimate_id, project_id) REFERENCES public.detailed_estimates(id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY(source_estimate_id, project_id) REFERENCES public.project_preliminary_estimates(estimate_id, project_id) ON DELETE RESTRICT
);
CREATE TABLE public.detailed_estimate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  detailed_estimate_id uuid, action text NOT NULL CHECK (action IN ('create-project','adopt-project','start','save')),
  actor_id uuid NOT NULL REFERENCES auth.users(id), request_id uuid NOT NULL, request_hash text NOT NULL,
  expected_revision bigint, result_revision bigint, result_refs jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(actor_id, request_id),
  FOREIGN KEY(detailed_estimate_id, project_id) REFERENCES public.detailed_estimates(id, project_id) ON DELETE RESTRICT
);
CREATE INDEX project_preliminary_project_idx ON public.project_preliminary_estimates(project_id);
CREATE INDEX detailed_estimates_project_idx ON public.detailed_estimates(project_id, created_at DESC);
CREATE INDEX detailed_events_head_idx ON public.detailed_estimate_events(detailed_estimate_id, created_at);

CREATE FUNCTION public.and_os_5b_public_object(p_value jsonb, p_keys text[]) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog, public AS $$
  SELECT coalesce(jsonb_object_agg(key, value), '{}'::jsonb) FROM jsonb_each(
    CASE WHEN jsonb_typeof(p_value) = 'object' THEN p_value ELSE '{}'::jsonb END)
  WHERE key = ANY(p_keys) AND jsonb_typeof(value) IN ('string','number','boolean','null');
$$;

CREATE FUNCTION public.and_os_5b_source(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = pg_catalog, public, extensions AS $$
DECLARE e public.estimates; q jsonb; snap jsonb;
BEGIN
  SELECT * INTO e FROM public.estimates WHERE id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='저장 가견적을 찾을 수 없습니다.'; END IF;
  q := e.estimate_data->'customerQuote';
  IF jsonb_typeof(q->'groups') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='고객 견적이 저장된 가견적에서 시작해 주세요.';
  END IF;
  snap := jsonb_build_object('schema_version','5b1-public-v1', 'header',
    jsonb_build_object('project_name',e.project_name,'client_name',e.client_name,'phone',e.phone,'address',e.address,
      'area_pyeong',e.area_pyeong,'total_price',e.total_price,'status',e.status),
    'inputs', public.and_os_5b_public_object(e.estimate_data->'inputs', string_to_array(
      'projectName,areaPyeong,clientName,clientPhone,sectionDemolitionEnabled,sectionElectricalEnabled,sectionBathroomEnabled,sectionWallpaperEnabled,sectionFilmEnabled,sectionFlooringEnabled,sectionCarpentryEnabled,sectionFurnitureEnabled,sectionFinishEnabled,baseEnabled,lowerCabinetM,upperCabinetM,tallCabinetM,riceCabinetUnits,baseEndPanels,baseEpDepth,baseCountertopEnabled,baseCountertop,baseLightingUnits,baseT3Units,islandEnabled,islandM,islandDepthMm,islandCountertop,islandSideFinish,islandSideFinishCount,islandDrawers,islandRiceCabinetEnabled,islandBachmannOutletEnabled,islandLightingUnits,islandT3Units,homebarEnabled,homebarM,homebarCountertop,homebarMidway,homebarDrawers,homebarEndPanels,homebarEpDepth,homebarLightingUnits,homebarT3Units,shoeEnabled,shoeM,shoeDepth,shoeEndPanels,shoeLightingUnits,shoeT3Units,fridgeLaundryEnabled,fridgeLaundryM,fridgeLaundryDepth,fridgeLaundryEndPanels,fridgeLaundryLightingUnits,fridgeLaundryT3Units,pantryEnabled,pantryM,pantryDepth,pantryEndPanels,pantryDrawerUnits,builtInEnabled,builtInM,builtInDepth,builtInEndPanels,builtInLightingUnits,builtInT3Units,hangerEnabled,hangerM,hangerDepth,hangerLightingUnits,hangerT3Units,demolitionFloorEnabled,demolitionFloorMaterial,demolitionFurnitureEnabled,demolitionFurnitureM,demolitionBathroomEnabled,demolitionBathroomUnits,demolitionCeilingEnabled,demolitionElevatorProtectEnabled,demolitionElevatorProtectRemovalEnabled,demolitionPermitEnabled,demolitionConsentEnabled,electricalEnabled,electricalAgeType,standardSwitchEnabled,standardLightingEnabled,standardDownlightUnits,standardSquareLightUnits,standardCylinderLightUnits,standardT3M,standardBedWallLightEnabled,tileEnabled,tileGroutEnabled,wallpaperPreset,wallpaperBaseCoatEnabled,filmPreset,flooringArea,flooringMaterialType,flooringSheetGrade,flooringWoodGrade,bathroomPlumbingRelocationEnabled,bathroomFixtureGrade,bathroomUnits,bathroomFanType,bathroomBathtubUnits,bathroomGlassBoothUnits,bathroomGlassPartitionUnits,bathroomMasonryWallUnits,kitchenEnabled,kitchenSinkBowlUnits,kitchenFaucetUnits,kitchenHoodUnits,kitchenCustomAppliancePrice,kitchenStandardInstallEnabled,middleDoorUnits,standardDoorUnits,slidingDoorUnits,windowNoticeEnabled,wallpaperPublicMaterialGrade,wallpaperPublicWallLengthM,wallpaperRoomMaterialGrade,wallpaperRoomWallLengthM,filmMaterialLengthM,generalWasteEnabled,interiorProtectionEnabled,moveInCleaningEnabled,existingPipeCleaningEnabled,siliconeEnabled,elasticEnabled,elasticExtraRooms,carpentryCurtainBoxUnits,carpentryCofferType,carpentryArtwallM,carpentryPartitionM,carpentryHiddenDoorUnits,carpentryLineLightM,carpentryIndirectLightUnits,carpentryCeilingFanUnits,carpentryDropCeilingUnits,carpentryMoldingEnabled,carpentryBaseboardEnabled,carpentryCeilingHeight,carpentryTvUnits',',')),
    'customerQuote', public.and_os_5b_public_object(q, ARRAY['projectName','clientName','phone','areaPyeong','savedAt','total','totalText','status']) ||
      jsonb_build_object('groups', coalesce((SELECT jsonb_agg(
        public.and_os_5b_public_object(g, ARRAY['label','total','totalText']) || jsonb_build_object('items',
          coalesce((SELECT jsonb_agg(public.and_os_5b_public_object(i, ARRAY['name','amount','amountText']))
            FROM jsonb_array_elements(CASE WHEN jsonb_typeof(g->'items')='array' THEN g->'items' ELSE '[]'::jsonb END) i),'[]'::jsonb)))
        FROM jsonb_array_elements(q->'groups') g),'[]'::jsonb)));
  RETURN jsonb_build_object('snapshot',snap,'fingerprint',encode(extensions.digest(snap::text,'sha256'::text),'hex'));
END $$;

CREATE FUNCTION public.and_os_5b_project(p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SET search_path = pg_catalog, public AS $$
  SELECT jsonb_build_object('id',p.id,'project_name',p.project_name,'address',p.address,'area_pyeong',p.area_pyeong,
    'customer_id',p.customer_id,'client_name',c.name,'phone',c.phone,'managed',p.os_managed_at IS NOT NULL)
  FROM public.projects p LEFT JOIN public.customers c ON c.id=p.customer_id WHERE p.id=p_id;
$$;

CREATE FUNCTION public.and_os_5b_require_project(p_id uuid, p_role text, p_managed boolean, p_lock boolean DEFAULT false)
RETURNS public.projects LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE pr public.projects;
BEGIN
  IF p_lock THEN SELECT * INTO pr FROM public.projects WHERE id=p_id FOR SHARE;
  ELSE SELECT * INTO pr FROM public.projects WHERE id=p_id; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='프로젝트를 찾을 수 없습니다.'; END IF;
  IF (p_managed OR p_role='staff') AND (pr.os_managed_at IS NULL OR pr.os_managed_by IS NULL) THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='도입되지 않은 프로젝트입니다.';
  END IF;
  RETURN pr;
END $$;

CREATE FUNCTION public.and_os_5b_require_head(p_id uuid, p_role text, p_lock boolean DEFAULT false)
RETURNS public.detailed_estimates LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE head public.detailed_estimates;
BEGIN
  SELECT * INTO head FROM public.detailed_estimates WHERE id=p_id;
  IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='본견적을 찾을 수 없습니다.'; END IF;
  -- Project before head/draft, consistent with start/adoption and revocation UPDATE.
  PERFORM public.and_os_5b_require_project(head.project_id,p_role,true,p_lock);
  IF p_lock THEN SELECT * INTO head FROM public.detailed_estimates WHERE id=p_id FOR UPDATE; END IF;
  IF NOT EXISTS(SELECT FROM public.detailed_estimate_references r
    JOIN public.project_preliminary_estimates l ON l.estimate_id=r.source_estimate_id AND l.project_id=r.project_id
    JOIN public.estimates e ON e.id=l.estimate_id
    WHERE r.detailed_estimate_id=head.id AND r.project_id=head.project_id
      AND (e.project_id IS NULL OR e.project_id=head.project_id)) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='본견적 출처 연결을 확인해 주세요.';
  END IF;
  RETURN head;
END $$;

CREATE FUNCTION public.and_os_5b_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE linked uuid;
BEGIN
  IF TG_TABLE_NAME='estimates' THEN
    SELECT project_id INTO linked FROM public.project_preliminary_estimates WHERE estimate_id=NEW.id;
    IF linked IS NOT NULL AND NEW.project_id IS NOT NULL AND NEW.project_id<>linked THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='기존 프로젝트 연결과 충돌합니다.';
    END IF;
    RETURN NEW;
  END IF;
  IF current_setting('request.and_os_5b',true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='승인된 본견적 명령을 사용해 주세요.';
  END IF;
  IF TG_OP='DELETE' OR (TG_OP='UPDATE' AND TG_TABLE_NAME<>'detailed_estimate_drafts') THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='본견적 출처와 이력은 변경하거나 삭제할 수 없습니다.';
  END IF;
  IF TG_TABLE_NAME='project_preliminary_estimates' THEN
    SELECT project_id INTO linked FROM public.estimates WHERE id=NEW.estimate_id FOR UPDATE;
    IF linked IS NOT NULL AND linked<>NEW.project_id THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='기존 프로젝트 연결과 충돌합니다.';
    END IF;
  END IF;
  IF TG_TABLE_NAME='detailed_estimate_drafts' THEN
    IF TG_OP='UPDATE' THEN
      IF NEW.detailed_estimate_id<>OLD.detailed_estimate_id OR NEW.revision<>OLD.revision+1 THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='작성 개정번호가 올바르지 않습니다.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER estimates_project_consistency BEFORE UPDATE OF project_id ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_guard();

CREATE FUNCTION public.and_os_5b_complete() RETURNS trigger LANGUAGE plpgsql
SET search_path = pg_catalog, public AS $$
BEGIN
  IF NOT EXISTS(SELECT FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=NEW.id)
    OR NOT EXISTS(SELECT FROM public.detailed_estimate_references WHERE detailed_estimate_id=NEW.id) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='본견적 작성본과 참고 사본이 필요합니다.';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER detailed_estimate_complete AFTER INSERT ON public.detailed_estimates
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_complete();

CREATE FUNCTION public.and_os_5b_command(p_actor uuid, p_action text, p_payload jsonb DEFAULT '{}', p_request_id uuid DEFAULT NULL,
  p_feature_mode text DEFAULT 'OFF')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, extensions AS $$
DECLARE r text; e public.estimates; pr public.projects; head public.detailed_estimates; dr public.detailed_estimate_drafts;
  ev public.detailed_estimate_events; src jsonb; pj jsonb; selected jsonb; result jsonb; ctx jsonb; req_hash text;
  pid uuid; did uuid; cid uuid; original_project uuid; expected bigint; k text; val jsonb;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id=p_actor AND is_active AND NOT must_change_password;
  IF coalesce(r,'') NOT IN ('admin','manager','staff') THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='접근 권한이 없습니다.';
  END IF;
  -- Trusted server argument only: browser roles cannot EXECUTE this RPC.
  IF coalesce(p_feature_mode,'') NOT IN ('ON','READ_ONLY') THEN
    RAISE EXCEPTION USING ERRCODE='P5F01', MESSAGE='프로젝트·본견적 기능은 현재 비활성화되어 있습니다.';
  END IF;
  IF p_feature_mode='READ_ONLY' AND coalesce(p_action,'') NOT IN ('preview','projects','customers','project','get','events') THEN
    RAISE EXCEPTION USING ERRCODE='P5F02', MESSAGE='프로젝트·본견적 기능은 현재 읽기 전용입니다.';
  END IF;
  IF jsonb_typeof(p_payload) IS DISTINCT FROM 'object' OR octet_length(p_payload::text)>100000 THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='요청 형식이 올바르지 않습니다.';
  END IF;
  IF p_action='preview' THEN RETURN public.and_os_5b_source((p_payload->>'estimate_id')::uuid); END IF;
  IF p_action='projects' THEN
    RETURN coalesce((SELECT jsonb_agg(public.and_os_5b_project(p.id) ORDER BY p.created_at DESC,p.id)
      FROM public.projects p WHERE r<>'staff' OR p.os_managed_at IS NOT NULL),'[]'::jsonb);
  END IF;
  IF p_action='customers' THEN
    RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'name',name,'phone',phone) ORDER BY id)
      FROM public.customers c WHERE r<>'staff' OR EXISTS(SELECT FROM public.projects p WHERE p.customer_id=c.id AND p.os_managed_at IS NOT NULL)),'[]'::jsonb);
  END IF;
  IF p_action='project' THEN
    pid:=(p_payload->>'project_id')::uuid;
    PERFORM public.and_os_5b_require_project(pid,r,false);
    pj:=public.and_os_5b_project(pid);
    RETURN jsonb_build_object('project',pj,'fingerprint',encode(extensions.digest(pj::text,'sha256'::text),'hex'),
      'estimates',coalesce((SELECT jsonb_agg(estimate_id) FROM public.project_preliminary_estimates WHERE project_id=pid),'[]'::jsonb),
      'drafts',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title)) FROM public.detailed_estimates WHERE project_id=pid),'[]'::jsonb));
  END IF;
  IF p_action IN ('get','events') THEN
    head:=public.and_os_5b_require_head((p_payload->>'id')::uuid,r);
    pj:=public.and_os_5b_project(head.project_id);
    IF p_action='events' THEN
      RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('action',action,'expected_revision',expected_revision,
        'result_revision',result_revision,'created_at',created_at) ORDER BY created_at,id)
        FROM public.detailed_estimate_events WHERE detailed_estimate_id=head.id),'[]'::jsonb);
    END IF;
    SELECT * INTO dr FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=head.id;
    RETURN jsonb_build_object('id',head.id,'title',head.title,'project',pj,'revision',dr.revision,
      'context',dr.public_context_json,'reference',(SELECT jsonb_build_object('source_estimate_id',source_estimate_id,
        'captured_at',captured_at,'snapshot',reference_public_json) FROM public.detailed_estimate_references WHERE detailed_estimate_id=head.id));
  END IF;
  IF coalesce(p_action,'') NOT IN ('create-project','adopt-project','start','save') OR p_request_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='명령 또는 요청 식별자가 올바르지 않습니다.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
  req_hash:=encode(extensions.digest(jsonb_build_object('action',p_action,'payload',p_payload)::text,'sha256'::text),'hex');
  SELECT * INTO ev FROM public.detailed_estimate_events WHERE actor_id=p_actor AND request_id=p_request_id;
  IF FOUND THEN
    IF ev.action IN ('start','save') THEN
      PERFORM public.and_os_5b_require_head(ev.detailed_estimate_id,r,true);
    ELSE
      PERFORM public.and_os_5b_require_project(ev.project_id,r,true,true);
    END IF;
    IF ev.action='adopt-project' AND r='staff' THEN
      RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='프로젝트 도입 권한이 없습니다.';
    END IF;
    IF ev.request_hash<>req_hash THEN RAISE EXCEPTION USING ERRCODE='23505', MESSAGE='같은 요청 식별자를 다른 내용에 사용할 수 없습니다.'; END IF;
    RETURN ev.result_refs;
  END IF;
  PERFORM set_config('request.and_os_5b','on',true);
  IF p_action='start' THEN
    SELECT * INTO e FROM public.estimates WHERE id=(p_payload->>'estimate_id')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='가견적을 찾을 수 없습니다.'; END IF;
    src:=public.and_os_5b_source(e.id);
    IF src->>'fingerprint' IS DISTINCT FROM p_payload->>'source_fingerprint' THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='가견적이 변경됐습니다. 다시 확인해 주세요.';
    END IF;
    SELECT project_id INTO original_project FROM public.project_preliminary_estimates WHERE estimate_id=e.id;
    IF original_project IS NOT NULL AND e.project_id IS NOT NULL AND original_project<>e.project_id THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='기존 프로젝트 연결과 충돌합니다.';
    END IF;
  END IF;
  IF p_action IN ('start','create-project') THEN
    selected:=p_payload->'selection';
    IF selected->>'mode'='existing' AND p_action='start' THEN
      pr:=public.and_os_5b_require_project((selected->>'project_id')::uuid,r,true,true);
      IF pr.customer_id IS NOT NULL THEN PERFORM 1 FROM public.customers WHERE id=pr.customer_id FOR SHARE; END IF;
      pj:=public.and_os_5b_project(pr.id);
      IF selected->>'fingerprint' IS DISTINCT FROM encode(extensions.digest(pj::text,'sha256'::text),'hex')
        OR selected->'confirmed' IS DISTINCT FROM 'true'::jsonb THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='선택 프로젝트를 다시 확인해 주세요.';
      END IF;
      pid:=pr.id;
    ELSIF selected->>'mode'='new' THEN
      IF coalesce(trim(selected->>'project_name'),'')='' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='프로젝트명을 입력해 주세요.'; END IF;
      IF p_action='start' AND coalesce(original_project,e.project_id) IS NOT NULL THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='이미 연결된 프로젝트를 선택해 주세요.';
      END IF;
      IF selected->>'customer_mode'='existing' THEN
        cid:=(selected->>'customer_id')::uuid;
        IF NOT EXISTS(SELECT FROM public.customers WHERE id=cid) THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='고객을 찾을 수 없습니다.'; END IF;
        IF r='staff' AND NOT EXISTS(SELECT FROM public.projects WHERE customer_id=cid AND os_managed_at IS NOT NULL) THEN
          RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='선택할 수 없는 고객입니다.';
        END IF;
      ELSIF selected->>'customer_mode'='new' THEN
        IF coalesce(trim(selected->>'client_name'),'')='' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='고객명을 입력해 주세요.'; END IF;
        cid:=gen_random_uuid();
        INSERT INTO public.customers(id,name,phone,created_at,updated_at) VALUES(cid,selected->>'client_name',selected->>'phone',now(),now());
      ELSIF selected->>'customer_mode' IS DISTINCT FROM 'undecided' THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='고객 연결 방법을 확인해 주세요.';
      END IF;
      pid:=gen_random_uuid();
      INSERT INTO public.projects(id,customer_id,project_name,address,area_pyeong,os_managed_at,os_managed_by,created_at,updated_at)
        VALUES(pid,cid,selected->>'project_name',selected->>'address',nullif(selected->>'area_pyeong','')::numeric,now(),p_actor,now(),now());
    ELSE RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='프로젝트 선택 방법이 올바르지 않습니다.';
    END IF;
    IF p_action='start' THEN
      IF coalesce(original_project,e.project_id,pid)<>pid THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='기존 프로젝트 연결과 충돌합니다.'; END IF;
      INSERT INTO public.project_preliminary_estimates(estimate_id,project_id,linked_by) VALUES(e.id,pid,p_actor) ON CONFLICT(estimate_id) DO NOTHING;
      did:=gen_random_uuid();
      INSERT INTO public.detailed_estimates(id,project_id,title,created_by) VALUES(did,pid,p_payload->>'title',p_actor);
      pj:=public.and_os_5b_project(pid);
      ctx:=jsonb_build_object('project_name',pj->'project_name','client_name',coalesce(pj->>'client_name',''),
        'phone',coalesce(pj->>'phone',''),'address',coalesce(pj->>'address',''),'area_pyeong',CASE WHEN pj->'area_pyeong'='null'::jsonb THEN '""'::jsonb ELSE pj->'area_pyeong' END,
        'customer_undecided',pj->'customer_id'='null'::jsonb);
      INSERT INTO public.detailed_estimate_drafts VALUES(did,1,ctx,p_actor,now());
      INSERT INTO public.detailed_estimate_references(detailed_estimate_id,project_id,source_estimate_id,source_updated_at,
        reference_schema_version,reference_public_json,source_public_hash,captured_by)
        VALUES(did,pid,e.id,e.updated_at,'5b1-public-v1',src->'snapshot',src->>'fingerprint',p_actor);
    END IF;
    result:=jsonb_build_object('project_id',pid,'id',did,'revision',CASE WHEN did IS NOT NULL THEN 1 ELSE NULL END);
  ELSIF p_action='adopt-project' THEN
    IF r='staff' THEN RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='프로젝트 도입 권한이 없습니다.'; END IF;
    pid:=(p_payload->>'project_id')::uuid;
    SELECT * INTO pr FROM public.projects WHERE id=pid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002', MESSAGE='프로젝트를 찾을 수 없습니다.'; END IF;
    pj:=public.and_os_5b_project(pid);
    IF p_payload->>'fingerprint' IS DISTINCT FROM encode(extensions.digest(pj::text,'sha256'::text),'hex') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='프로젝트가 변경됐습니다. 다시 확인해 주세요.';
    END IF;
    UPDATE public.projects SET os_managed_at=coalesce(os_managed_at,now()),os_managed_by=coalesce(os_managed_by,p_actor) WHERE id=pid;
    result:=jsonb_build_object('project_id',pid);
  ELSE
    did:=(p_payload->>'id')::uuid;
    head:=public.and_os_5b_require_head(did,r,true);
    pid:=head.project_id;
    SELECT * INTO dr FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=did FOR UPDATE;
    expected:=(p_payload->>'expected_revision')::bigint;
    IF expected IS NULL OR expected<>dr.revision THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='다른 사용자가 수정했습니다. 다시 불러와 주세요.'; END IF;
    ctx:=p_payload->'context';
    IF jsonb_typeof(ctx) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='작성 정보 형식이 올바르지 않습니다.'; END IF;
    FOR k,val IN SELECT * FROM jsonb_each(ctx) LOOP
      IF k NOT IN ('project_name','client_name','phone','address','area_pyeong','customer_undecided')
        OR (k='customer_undecided' AND jsonb_typeof(val)<>'boolean')
        OR (k='area_pyeong' AND NOT ((jsonb_typeof(val)='number' AND (val::text)::numeric BETWEEN 0 AND 100000) OR val='""'::jsonb))
        OR (k NOT IN ('customer_undecided','area_pyeong') AND (jsonb_typeof(val)<>'string' OR length(val#>>'{}')>500)) THEN
        RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='허용되지 않은 작성 정보입니다.';
      END IF;
    END LOOP;
    UPDATE public.detailed_estimate_drafts SET public_context_json=public_context_json||ctx,revision=revision+1,updated_by=p_actor,updated_at=now()
      WHERE detailed_estimate_id=did;
    result:=jsonb_build_object('project_id',pid,'id',did,'revision',dr.revision+1);
  END IF;
  INSERT INTO public.detailed_estimate_events(project_id,detailed_estimate_id,action,actor_id,request_id,request_hash,expected_revision,result_revision,result_refs)
    VALUES(pid,did,p_action,p_actor,p_request_id,req_hash,expected,(result->>'revision')::bigint,result);
  RETURN result;
END $$;

DO $$ DECLARE t text; f record;
BEGIN
  FOREACH t IN ARRAY ARRAY['project_preliminary_estimates','detailed_estimates','detailed_estimate_drafts','detailed_estimate_references','detailed_estimate_events'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated',t);
    EXECUTE format('REVOKE ALL ON public.%I FROM service_role',t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO service_role',t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_guard()',t||'_guard',t);
  END LOOP;
  FOR f IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname LIKE 'and_os_5b_%' LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO postgres',f.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',f.signature);
  END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.and_os_5b_command(uuid,text,jsonb,uuid,text) TO service_role;
COMMIT;
