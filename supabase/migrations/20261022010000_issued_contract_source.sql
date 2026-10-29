BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

-- A contract still uses the existing package/documents and confirmation RPC.
CREATE TABLE public.contract_issued_sources (
  package_id uuid PRIMARY KEY REFERENCES public.contract_package_snapshots(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  version_id uuid NOT NULL REFERENCES public.detailed_estimate_versions(id) ON DELETE RESTRICT,
  scope_label text NOT NULL CHECK(length(trim(scope_label)) BETWEEN 1 AND 200),
  scope_trades text[] NOT NULL CHECK(cardinality(scope_trades) BETWEEN 1 AND 9),
  independent_scope boolean NOT NULL DEFAULT false,
  separate_quotes jsonb NOT NULL CHECK(jsonb_typeof(separate_quotes)='object'),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL,
  request_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(created_by,request_id), UNIQUE(version_id)
);
ALTER TABLE public.contract_issued_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.contract_issued_sources FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.contract_issued_sources TO service_role;

CREATE FUNCTION public.and_os_5b_contract_source_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  IF TG_OP <> 'INSERT' OR current_setting('and_os.issued_contract',true) IS DISTINCT FROM NEW.version_id::text THEN
    RAISE EXCEPTION '발행 견적 계약 참조는 변경·삭제할 수 없습니다.' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS(SELECT FROM public.detailed_estimate_versions v
    JOIN public.detailed_estimate_references r ON r.detailed_estimate_id=v.detailed_estimate_id
    JOIN public.contract_package_snapshots p ON p.id=NEW.package_id AND p.estimate_id=r.source_estimate_id
    WHERE v.id=NEW.version_id AND v.project_id=NEW.project_id
      AND p.estimate_snapshot->>'issued_version_id'=v.id::text) THEN
    RAISE EXCEPTION '계약 기준과 프로젝트 연결이 다릅니다.' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER contract_issued_source_guard BEFORE INSERT OR UPDATE OR DELETE ON public.contract_issued_sources
  FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_contract_source_guard();

CREATE FUNCTION public.and_os_5b_contract_package_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE link public.contract_issued_sources%rowtype; pid uuid; marker text; scope text[]; independent boolean;
BEGIN
  IF TG_OP='INSERT' AND NEW.parent_package_id IS NULL THEN
    IF NEW.estimate_snapshot ? 'issued_version_id' AND current_setting('and_os.issued_contract',true)
      IS DISTINCT FROM NEW.estimate_snapshot->>'issued_version_id' THEN
      RAISE EXCEPTION '발행 견적 계약 생성 경로를 사용해 주세요.' USING ERRCODE='42501';
    END IF;
    SELECT coalesce(l.project_id,e.project_id) INTO pid FROM public.estimates e
      LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=e.id WHERE e.id=NEW.estimate_id;
    IF pid IS NOT NULL THEN
      PERFORM pg_advisory_xact_lock(hashtextextended('original-contract:'||pid::text,0));
      marker:=current_setting('and_os.issued_contract',true);
      independent:=coalesce(current_setting('and_os.contract_independent',true),'')='true';
      scope:=string_to_array(coalesce(current_setting('and_os.contract_scope',true),''),',');
      IF EXISTS(SELECT FROM public.contract_package_snapshots p
        JOIN public.estimates e ON e.id=p.estimate_id
        LEFT JOIN public.project_preliminary_estimates l ON l.estimate_id=e.id
        LEFT JOIN public.contract_issued_sources s ON s.package_id=p.id
        WHERE coalesce(l.project_id,e.project_id)=pid AND p.parent_package_id IS NULL
          AND p.status<>'CANCELLED'
          AND (coalesce(marker,'')='' OR NOT independent OR s.package_id IS NULL
            OR NOT s.independent_scope OR s.scope_trades && scope)) THEN
        RAISE EXCEPTION '동일 공사범위의 원계약이 이미 있습니다. 기존 계약을 확인해 주세요.' USING ERRCODE='23505';
      END IF;
    END IF;
  ELSIF TG_OP='UPDATE' THEN
    SELECT * INTO link FROM public.contract_issued_sources WHERE package_id=OLD.id;
    IF FOUND THEN
      IF NEW.estimate_snapshot IS DISTINCT FROM OLD.estimate_snapshot OR NEW.contract_info IS DISTINCT FROM OLD.contract_info
        OR NEW.document_options_snapshot IS DISTINCT FROM OLD.document_options_snapshot OR NEW.estimate_id IS DISTINCT FROM OLD.estimate_id THEN
        RAISE EXCEPTION '계약 기준 발행본과 계약 내용은 변경할 수 없습니다.' USING ERRCODE='42501';
      END IF;
      IF NEW.status='CONTRACTED' AND OLD.status IS DISTINCT FROM 'CONTRACTED' THEN
        IF current_setting('and_os.confirm_issued',true) IS DISTINCT FROM OLD.id::text THEN
          RAISE EXCEPTION '발행 견적 계약의 확인 경로를 사용해 주세요.' USING ERRCODE='42501';
        END IF;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER issued_contract_package_guard BEFORE INSERT OR UPDATE ON public.contract_package_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_contract_package_guard();

-- Legacy visibility stays unchanged. New source contracts must use the checked API.
CREATE FUNCTION public.and_os_5b_legacy_contract_visible(p_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT NOT EXISTS(SELECT FROM public.contract_issued_sources WHERE package_id=p_id)
$$;
CREATE POLICY issued_contract_api_only ON public.contract_package_snapshots AS RESTRICTIVE FOR SELECT TO authenticated
  USING(public.and_os_5b_legacy_contract_visible(id));
CREATE POLICY issued_contract_documents_api_only ON public.contract_document_versions AS RESTRICTIVE FOR SELECT TO authenticated
  USING(public.and_os_5b_legacy_contract_visible(package_id));

CREATE FUNCTION public.and_os_5b_contract(
  p_actor uuid, p_action text, p_mode text DEFAULT 'OFF', p_head uuid DEFAULT NULL,
  p_estimate uuid DEFAULT NULL, p_version uuid DEFAULT NULL, p_package uuid DEFAULT NULL,
  p_request uuid DEFAULT NULL, p_payload jsonb DEFAULT '{}'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE role_name text; v public.detailed_estimate_versions%rowtype; head public.detailed_estimates%rowtype;
  link public.contract_issued_sources%rowtype; result jsonb; scope text[]; label text; independent boolean;
  request_hash text; source_id uuid; latest integer; decision jsonb; sv public.detailed_estimate_versions%rowtype;
  key text; summary jsonb; prefix text; next_no integer; package_row public.contract_package_snapshots%rowtype;
BEGIN
  SELECT lower(role) INTO role_name FROM public.profiles WHERE id=p_actor AND is_active AND NOT must_change_password FOR SHARE;
  IF coalesce(role_name,'') NOT IN ('admin','manager','staff') THEN
    RAISE EXCEPTION '현재 접근 권한이 없습니다.' USING ERRCODE='42501';
  END IF;
  IF p_mode NOT IN ('ON','READ_ONLY') OR p_mode IS NULL THEN
    RAISE EXCEPTION '본견적 기능은 비활성화 상태입니다.' USING ERRCODE='P5F01';
  END IF;
  IF p_action NOT IN ('source','get','create','confirm') OR p_action IS NULL THEN
    RAISE EXCEPTION '계약 작업을 확인해 주세요.' USING ERRCODE='22023';
  END IF;
  IF p_action IN ('create','confirm') THEN
    IF role_name<>'admin' THEN RAISE EXCEPTION '원계약 저장·확정은 관리자만 가능합니다.' USING ERRCODE='42501'; END IF;
    IF p_mode<>'ON' THEN RAISE EXCEPTION '현재 읽기 전용입니다.' USING ERRCODE='P5F02'; END IF;
  END IF;
  IF p_action IN ('get','confirm') THEN
    SELECT * INTO link FROM public.contract_issued_sources WHERE package_id=p_package;
    IF NOT FOUND THEN RAISE EXCEPTION '발행 견적 계약이 없습니다.' USING ERRCODE='P0002'; END IF;
    p_version:=link.version_id;
  END IF;
  IF p_version IS NOT NULL THEN
    SELECT * INTO v FROM public.detailed_estimate_versions WHERE id=p_version;
    IF NOT FOUND OR (p_head IS NOT NULL AND p_head<>v.detailed_estimate_id) THEN
      RAISE EXCEPTION '계약 기준은 공식 발행본만 선택할 수 있습니다.' USING ERRCODE='P0002';
    END IF;
    p_head:=v.detailed_estimate_id;
  ELSIF p_head IS NULL THEN
    SELECT r.detailed_estimate_id INTO p_head FROM public.detailed_estimate_references r WHERE r.source_estimate_id=p_estimate ORDER BY r.captured_at DESC LIMIT 1;
    IF NOT FOUND THEN RETURN jsonb_build_object('versions','[]'::jsonb); END IF;
  END IF;
  -- Serialize project originals before head/package locks, including retries.
  IF p_action IN ('create','confirm') THEN
    SELECT project_id INTO source_id FROM public.detailed_estimates WHERE id=p_head;
    PERFORM pg_advisory_xact_lock(hashtextextended('original-contract:'||source_id::text,0));
  END IF;
  head:=public.and_os_5b_require_head(p_head,role_name,p_action IN ('create','confirm'));
  SELECT source_estimate_id INTO source_id FROM public.detailed_estimate_references WHERE detailed_estimate_id=head.id;
  IF p_estimate IS NOT NULL AND source_id<>p_estimate THEN RAISE EXCEPTION '가견적 연결이 다릅니다.' USING ERRCODE='42501'; END IF;
  IF p_action IN ('get','confirm') THEN
    SELECT * INTO package_row FROM public.contract_package_snapshots WHERE id=p_package FOR UPDATE;
    IF p_action='confirm' THEN
      PERFORM set_config('and_os.confirm_issued',p_package::text,true);
      IF package_row.status<>'CONTRACTED' THEN
        result:=public.confirm_contract_package_snapshot(p_package,p_actor);
      END IF;
    END IF;
    SELECT to_jsonb(p)||jsonb_build_object('contract_document_versions',(SELECT jsonb_agg(to_jsonb(d) ORDER BY document_type) FROM public.contract_document_versions d WHERE d.package_id=p.id))
      INTO result FROM public.contract_package_snapshots p WHERE p.id=p_package;
    RETURN result;
  END IF;
  IF p_version IS NULL THEN SELECT * INTO v FROM public.detailed_estimate_versions WHERE detailed_estimate_id=head.id ORDER BY version_no DESC LIMIT 1; END IF;
  SELECT max(version_no) INTO latest FROM public.detailed_estimate_versions WHERE detailed_estimate_id=head.id;
  IF p_action='source' THEN
    RETURN jsonb_build_object('head_id',head.id,'project_id',head.project_id,'estimate_id',source_id,'latest_version',latest,
      'document',v.public_snapshot,'linked_package_id',(SELECT package_id FROM public.contract_issued_sources WHERE version_id=v.id),
      'versions',coalesce((SELECT jsonb_agg(jsonb_build_object('id',x.id,'head_id',x.detailed_estimate_id,'version',x.version_no,'quoteNumber',x.quote_no,
        'issuedAt',x.issued_at,'total',(x.public_snapshot#>>'{editor,summary,total}')::numeric,'title',x.public_snapshot->>'title') ORDER BY x.issued_at DESC)
        FROM public.detailed_estimate_versions x WHERE x.project_id=head.project_id),'[]'::jsonb));
  END IF;
  IF v.id IS NULL OR p_request IS NULL THEN RAISE EXCEPTION '공식 발행본과 요청 식별자가 필요합니다.' USING ERRCODE='22023'; END IF;
  request_hash:=encode(extensions.digest((p_payload-ARRAY['contract_no','source_hash','documents','contract_info','document_options_snapshot'])::text,'sha256'),'hex');
  -- All semantic options are included; generated contract number is deliberately excluded.
  request_hash:=encode(extensions.digest(request_hash||((p_payload->'contract_info')-'contract_no')::text||((p_payload->'document_options_snapshot')-'contract_no'-'contract_info')::text,'sha256'),'hex');
  SELECT * INTO link FROM public.contract_issued_sources WHERE created_by=p_actor AND request_id=p_request;
  IF FOUND THEN
    IF link.version_id<>v.id OR link.request_hash<>request_hash THEN RAISE EXCEPTION '동일 요청의 내용이 다릅니다.' USING ERRCODE='23505'; END IF;
    SELECT to_jsonb(p)||jsonb_build_object('contract_document_versions',(SELECT jsonb_agg(to_jsonb(d)) FROM public.contract_document_versions d WHERE d.package_id=p.id)) INTO result FROM public.contract_package_snapshots p WHERE p.id=link.package_id;
    RETURN result;
  END IF;
  IF EXISTS(SELECT FROM public.contract_issued_sources WHERE version_id=v.id) THEN RAISE EXCEPTION '이 발행본으로 작성한 계약이 이미 있습니다.' USING ERRCODE='23505'; END IF;
  IF v.version_no<latest AND coalesce(p_payload->'older_version_confirmed','false')<>'true'::jsonb THEN RAISE EXCEPTION '과거 발행본 선택을 확인해 주세요.' USING ERRCODE='23514'; END IF;
  independent:=coalesce((p_payload#>>'{scope,independent}')::boolean,false);
  label:=trim(coalesce(p_payload#>>'{scope,label}','전체 공사'));
  IF length(label) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION '공사범위를 입력해 주세요.' USING ERRCODE='22023'; END IF;
  SELECT array_agg(DISTINCT i->>'trade' ORDER BY i->>'trade') INTO scope FROM jsonb_array_elements(v.public_snapshot#>'{editor,items}') i WHERE NOT (i->>'excluded')::boolean;
  IF NOT independent THEN scope:=ARRAY['demolition','electrical','bathroom','wallpaper','film','flooring','carpentry','furniture','finish']; END IF;
  IF independent AND coalesce(p_payload#>>'{scope,confirmed}','false')<>'true' THEN RAISE EXCEPTION '독립 공사범위 구분을 명시적으로 확인해 주세요.' USING ERRCODE='23514'; END IF;
  FOR key IN SELECT unnest(ARRAY['windows','hvac']) LOOP
    decision:=p_payload->'separate_quotes'->key;
    IF decision IS NULL OR coalesce(decision->>'state','') NOT IN ('included','excluded') THEN
      RAISE EXCEPTION '창호·냉난방기 포함/제외를 계약 전에 확정해 주세요.' USING ERRCODE='23514';
    END IF;
    IF decision->>'state'='included' THEN
      SELECT * INTO sv FROM public.detailed_estimate_versions WHERE id=(decision->>'version_id')::uuid AND project_id=head.project_id;
      IF NOT FOUND OR coalesce(decision->>'included_in_total','false')<>'true' THEN RAISE EXCEPTION '포함할 별도 견적 발행본과 계약금액 포함 여부를 확인해 주세요.' USING ERRCODE='23514'; END IF;
    ELSIF decision->>'version_id' IS NOT NULL THEN RAISE EXCEPTION '제외된 별도 견적은 포함할 수 없습니다.' USING ERRCODE='23514'; END IF;
  END LOOP;
  summary:=v.public_snapshot#>'{editor,summary}';
  IF (p_payload->>'estimate_id')::uuid IS DISTINCT FROM source_id
    OR p_payload#>>'{estimate_snapshot,issued_version_id}' IS DISTINCT FROM v.id::text
    OR p_payload#>'{contract_info,total_amount}' IS DISTINCT FROM summary->'total'
    OR p_payload#>'{contract_info,supply_amount}' IS DISTINCT FROM summary->'supply'
    OR p_payload#>'{contract_info,vat_amount}' IS DISTINCT FROM summary->'vat'
    OR p_payload#>'{estimate_snapshot,total_price}' IS DISTINCT FROM summary->'total'
    OR p_payload#>'{estimate_snapshot,customer_quote,total}' IS DISTINCT FROM summary->'total' THEN
    RAISE EXCEPTION '계약금액과 발행 견적 공급가액·부가세·공급대가가 다릅니다.' USING ERRCODE='23514';
  END IF;
  -- Allocate the existing AND-YYYY-MM-NNN format atomically across legacy/new callers.
  PERFORM pg_advisory_xact_lock(hashtextextended('issued-contract-number',0));
  prefix:='AND-'||to_char(now() AT TIME ZONE 'Asia/Seoul','YYYY-MM')||'-';
  SELECT coalesce(max(right(contract_no,3)::integer),0)+1 INTO next_no FROM (
    SELECT contract_no FROM public.contract_package_snapshots UNION SELECT contract_no FROM public.estimate_document_options
  ) n WHERE contract_no ~ ('^'||prefix||'[0-9]{3}$');
  IF next_no>999 THEN RAISE EXCEPTION '계약번호 범위를 확인해 주세요.' USING ERRCODE='23514'; END IF;
  IF p_payload->>'contract_no' IS DISTINCT FROM prefix||lpad(next_no::text,3,'0') THEN
    RAISE EXCEPTION '계약번호가 변경됐습니다. 다시 확인해 주세요.' USING ERRCODE='23505';
  END IF;
  PERFORM set_config('and_os.issued_contract',v.id::text,true);
  PERFORM set_config('and_os.contract_independent',independent::text,true);
  PERFORM set_config('and_os.contract_scope',array_to_string(scope,','),true);
  result:=public.create_contract_package_snapshot(p_actor,p_payload);
  INSERT INTO public.contract_issued_sources(package_id,project_id,version_id,scope_label,scope_trades,independent_scope,separate_quotes,created_by,request_id,request_hash)
    VALUES((result->>'id')::uuid,head.project_id,v.id,label,scope,independent,p_payload->'separate_quotes',p_actor,p_request,request_hash);
  RETURN result;
END $$;

ALTER TABLE public.contract_issued_sources OWNER TO postgres;
ALTER FUNCTION public.and_os_5b_legacy_contract_visible(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.and_os_5b_legacy_contract_visible(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.and_os_5b_legacy_contract_visible(uuid) TO authenticated;
ALTER FUNCTION public.and_os_5b_contract_source_guard() OWNER TO postgres;
ALTER FUNCTION public.and_os_5b_contract_package_guard() OWNER TO postgres;
ALTER FUNCTION public.and_os_5b_contract(uuid,text,text,uuid,uuid,uuid,uuid,uuid,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.and_os_5b_contract_source_guard(), public.and_os_5b_contract_package_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.and_os_5b_contract(uuid,text,text,uuid,uuid,uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.and_os_5b_contract(uuid,text,text,uuid,uuid,uuid,uuid,uuid,jsonb) TO service_role;
COMMIT;
