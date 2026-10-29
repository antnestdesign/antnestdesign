-- Immutable draft publication. No contract linkage, delivery or business backfill.
BEGIN;
SET LOCAL search_path=pg_catalog,public;
CREATE SEQUENCE public.detailed_quote_number_seq;
REVOKE ALL ON SEQUENCE public.detailed_quote_number_seq FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE public.detailed_estimate_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  detailed_estimate_id uuid NOT NULL,
  project_id uuid NOT NULL,
  version_no integer NOT NULL CHECK(version_no>0),
  quote_no text NOT NULL,
  source_revision bigint NOT NULL CHECK(source_revision>0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  issued_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  issuer_label text NOT NULL,
  public_snapshot jsonb NOT NULL CHECK(jsonb_typeof(public_snapshot)='object'),
  internal_snapshot jsonb NOT NULL CHECK(jsonb_typeof(internal_snapshot)='object'),
  request_id uuid NOT NULL, request_hash text NOT NULL,
  UNIQUE(detailed_estimate_id,version_no), UNIQUE(detailed_estimate_id,source_revision),
  UNIQUE(quote_no,version_no), UNIQUE(issued_by,request_id),
  FOREIGN KEY(detailed_estimate_id,project_id) REFERENCES public.detailed_estimates(id,project_id) ON DELETE RESTRICT
);
CREATE INDEX detailed_versions_project_idx ON public.detailed_estimate_versions(project_id,detailed_estimate_id);
ALTER TABLE public.detailed_estimate_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.detailed_estimate_versions FROM PUBLIC,anon,authenticated,service_role;
-- All browser access is through role-checked server/RPC projections.
CREATE FUNCTION public.and_os_5b_version_guard() RETURNS trigger LANGUAGE plpgsql
SET search_path=pg_catalog,public AS $$
BEGIN
  IF TG_OP<>'INSERT' OR current_setting('request.and_os_5b_issue',true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION USING ERRCODE='42501', MESSAGE='발행본은 수정하거나 삭제할 수 없습니다.';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER detailed_versions_immutable BEFORE INSERT OR UPDATE OR DELETE ON public.detailed_estimate_versions
FOR EACH ROW EXECUTE FUNCTION public.and_os_5b_version_guard();

CREATE FUNCTION public.and_os_5b_versions(p_actor uuid,p_id uuid,p_action text,p_mode text DEFAULT 'OFF',
  p_version_id uuid DEFAULT NULL,p_revision bigint DEFAULT NULL,p_request_id uuid DEFAULT NULL,
  p_fingerprint text DEFAULT NULL,p_company jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions AS $$
DECLARE r text; actor_label text; h public.detailed_estimates; d public.detailed_estimate_drafts;
  v public.detailed_estimate_versions; fp text; rh text; n integer; qn text; doc jsonb; vid uuid; at_time timestamptz;
  row_sum numeric; group_sum numeric; supply numeric; raw_supply numeric; item jsonb; serial_no bigint;
BEGIN
  SELECT role,coalesce(nullif(trim(name),''),CASE role WHEN 'admin' THEN '관리자' ELSE '매니저' END)
    INTO r,actor_label FROM public.profiles WHERE id=p_actor AND is_active AND NOT must_change_password FOR SHARE;
  IF coalesce(r,'') NOT IN ('admin','manager','staff') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='접근 권한이 없습니다.'; END IF;
  IF coalesce(p_mode,'') NOT IN ('ON','READ_ONLY') THEN RAISE EXCEPTION USING ERRCODE='P5F01',MESSAGE='본견적 기능이 비활성화됐습니다.'; END IF;
  IF p_action NOT IN ('list','get','preview','issue') OR p_action IS NULL THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='발행 명령을 확인해 주세요.'; END IF;
  IF p_action IN ('preview','issue') AND r NOT IN ('admin','manager') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='공식 발행 권한이 없습니다.'; END IF;
  IF p_action='issue' THEN
    IF p_mode<>'ON' THEN RAISE EXCEPTION USING ERRCODE='P5F02',MESSAGE='현재 읽기 전용입니다.'; END IF;
    IF p_request_id IS NULL OR p_revision IS NULL OR coalesce(p_fingerprint,'') !~ '^[a-f0-9]{64}$' THEN
      RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='발행 확인 정보가 필요합니다.';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text||p_request_id::text,0));
  END IF;
  h:=public.and_os_5b_require_head(p_id,r,p_action='issue');
  IF p_action='list' THEN
    RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'version',version_no,'quoteNumber',quote_no,
      'issuedAt',issued_at,'issuedBy',issuer_label,'total',public_snapshot#>'{editor,summary,total}') ORDER BY version_no DESC)
      FROM public.detailed_estimate_versions WHERE detailed_estimate_id=h.id),'[]'::jsonb);
  END IF;
  IF p_action='get' THEN
    SELECT * INTO v FROM public.detailed_estimate_versions WHERE id=p_version_id AND detailed_estimate_id=h.id;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0002',MESSAGE='발행본을 찾을 수 없습니다.'; END IF;
    RETURN v.public_snapshot;
  END IF;
  rh:=encode(extensions.digest(jsonb_build_object('id',p_id,'revision',p_revision,'fingerprint',p_fingerprint)::text,'sha256'),'hex');
  IF p_action='issue' THEN
    SELECT * INTO v FROM public.detailed_estimate_versions WHERE issued_by=p_actor AND request_id=p_request_id;
    IF FOUND THEN
      IF v.detailed_estimate_id<>h.id OR v.request_hash<>rh THEN RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='동일 요청을 다른 발행에 사용할 수 없습니다.'; END IF;
      RETURN v.public_snapshot;
    END IF;
    SELECT * INTO d FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=h.id FOR UPDATE;
  ELSE SELECT * INTO d FROM public.detailed_estimate_drafts WHERE detailed_estimate_id=h.id; END IF;
  IF p_revision IS DISTINCT FROM d.revision THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='작성본이 변경됐습니다. 다시 확인해 주세요.'; END IF;
  IF coalesce(trim(d.public_context_json->>'project_name'),'')='' OR coalesce(trim(d.public_context_json->>'client_name'),'')=''
    OR coalesce(trim(d.public_context_json->>'address'),'')='' OR d.public_context_json->'customer_undecided' IS DISTINCT FROM 'false'::jsonb THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='현장명·고객명·주소와 고객 확정 상태를 확인해 주세요.';
  END IF;
  IF d.editor_public_json->>'version' IS DISTINCT FROM '1' OR jsonb_typeof(d.editor_public_json->'items') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='공사내역을 먼저 저장해 주세요.';
  END IF;
  row_sum:=0;n:=0;
  FOR item IN SELECT value FROM jsonb_array_elements(d.editor_public_json->'items') LOOP
    IF item->'excluded'='false'::jsonb THEN
      IF coalesce(trim(item->>'name'),'')='' OR (item->>'quantity')::numeric<=0 OR (item->>'saleUnitPrice')::numeric<=0
        OR (item->>'amount')::numeric IS DISTINCT FROM round((CASE WHEN item->>'kind'='fixed' THEN 1 ELSE (item->>'quantity')::numeric END)*(item->>'saleUnitPrice')::numeric) THEN
        RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='품목 수량·단가·금액을 확인해 주세요.';
      END IF;
      n:=n+1;row_sum:=row_sum+(item->>'amount')::numeric;
    END IF;
  END LOOP;
  IF n=0 THEN RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='유효한 공사항목이 한 개 이상 필요합니다.'; END IF;
  SELECT coalesce(sum((g->>'total')::numeric),0) INTO group_sum FROM jsonb_array_elements(d.editor_public_json#>'{summary,groups}') g;
  raw_supply:=row_sum+(d.editor_public_json->>'addition')::numeric-(d.editor_public_json->>'discount')::numeric;
  supply:=floor(raw_supply/1000)*1000;
  IF row_sum IS DISTINCT FROM group_sum OR row_sum IS DISTINCT FROM (d.editor_public_json#>>'{summary,subtotal}')::numeric
    OR raw_supply IS DISTINCT FROM (d.editor_public_json#>>'{summary,rawSupply}')::numeric
    OR supply<=0 OR supply IS DISTINCT FROM (d.editor_public_json#>>'{summary,supply}')::numeric
    OR supply-raw_supply IS DISTINCT FROM (d.editor_public_json#>>'{summary,rounding}')::numeric
    OR round(supply*.1) IS DISTINCT FROM (d.editor_public_json#>>'{summary,vat}')::numeric
    OR supply+round(supply*.1) IS DISTINCT FROM (d.editor_public_json#>>'{summary,total}')::numeric THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='저장된 합계가 맞지 않습니다. 작성본을 확인해 다시 저장해 주세요.';
  END IF;
  IF EXISTS(SELECT FROM jsonb_array_elements(d.editor_public_json#>'{summary,groups}') g WHERE
    (g->>'total')::numeric IS DISTINCT FROM (SELECT coalesce(sum((i->>'amount')::numeric),0) FROM jsonb_array_elements(d.editor_public_json->'items') i WHERE i->>'trade'=g->>'trade')) THEN
    RAISE EXCEPTION USING ERRCODE='22023',MESSAGE='공정 소계를 확인해 주세요.';
  END IF;
  fp:=encode(extensions.digest(jsonb_build_object('context',d.public_context_json,'editor',d.editor_public_json,'internal',d.editor_internal_json,'company',p_company)::text,'sha256'),'hex');
  doc:=jsonb_build_object('schemaVersion','detailed-issued-v1','title',h.title,'company',p_company,'context',d.public_context_json,
    'editor',d.editor_public_json,'calculation',jsonb_build_object('version','detailed-editor-v1','lineRounding','KRW_HALF_UP','supplyFloor',1000,'vatRate',0.1));
  IF p_action='preview' THEN RETURN jsonb_build_object('document',doc,'fingerprint',fp,'revision',d.revision); END IF;
  IF fp IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='견적이 변경됐습니다. 발행 미리보기를 다시 확인해 주세요.'; END IF;
  IF EXISTS(SELECT FROM public.detailed_estimate_versions WHERE detailed_estimate_id=h.id AND source_revision=d.revision) THEN
    RAISE EXCEPTION USING ERRCODE='23505',MESSAGE='현재 저장본은 이미 발행됐습니다.';
  END IF;
  SELECT coalesce(max(version_no),0)+1,min(quote_no) INTO n,qn FROM public.detailed_estimate_versions WHERE detailed_estimate_id=h.id;
  IF qn IS NULL THEN
    serial_no:=nextval('public.detailed_quote_number_seq');
    qn:='AND-Q-'||to_char(now(),'YYYY')||'-'||lpad(serial_no::text,greatest(6,length(serial_no::text)),'0');
  END IF;
  vid:=gen_random_uuid();at_time:=clock_timestamp();
  doc:=doc||jsonb_build_object('id',vid,'quoteNumber',qn,'version',n,'issuedAt',at_time,'issuedBy',actor_label);
  PERFORM set_config('request.and_os_5b_issue','on',true);
  INSERT INTO public.detailed_estimate_versions(id,detailed_estimate_id,project_id,version_no,quote_no,source_revision,issued_at,issued_by,issuer_label,public_snapshot,internal_snapshot,request_id,request_hash)
    VALUES(vid,h.id,h.project_id,n,qn,d.revision,at_time,p_actor,actor_label,doc,d.editor_internal_json,p_request_id,rh);
  RETURN doc;
END $$;
ALTER FUNCTION public.and_os_5b_version_guard() OWNER TO postgres;
ALTER FUNCTION public.and_os_5b_versions(uuid,uuid,text,text,uuid,bigint,uuid,text,jsonb) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.and_os_5b_version_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.and_os_5b_versions(uuid,uuid,text,text,uuid,bigint,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.and_os_5b_versions(uuid,uuid,text,text,uuid,bigint,uuid,text,jsonb) TO service_role;
COMMIT;
