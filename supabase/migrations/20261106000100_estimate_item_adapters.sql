-- Preserve extension references transactionally; no existing rows are backfilled.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
CREATE TABLE public.estimate_item_estimate_uses (
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  line_id uuid NOT NULL,
  version_id uuid NOT NULL REFERENCES public.estimate_item_versions(id) ON DELETE RESTRICT,
  PRIMARY KEY(estimate_id,line_id)
);
ALTER TABLE public.estimate_item_estimate_uses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.estimate_item_estimate_uses FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.and_os_estimate_item_references() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r jsonb; version_row public.estimate_item_versions; head_row public.estimate_item_templates;
BEGIN
  IF NOT (NEW.estimate_data ? 'itemBuilder') AND (TG_OP='INSERT' OR NOT (OLD.estimate_data ? 'itemBuilder')) THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.estimate_data ? 'itemBuilder' AND NOT (NEW.estimate_data ? 'itemBuilder') THEN
    RAISE EXCEPTION '추가 공사 저장 정보가 누락되었습니다.' USING ERRCODE='23514';
  END IF;
  IF TG_OP='INSERT' OR NEW.estimate_data->'itemBuilder' IS DISTINCT FROM OLD.estimate_data->'itemBuilder' THEN
    PERFORM 1 FROM public.profiles WHERE id=(NEW.estimate_data#>>'{itemBuilder,actor}')::uuid
      AND role IN('admin','manager','staff') AND is_active AND NOT must_change_password FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION '현재 견적 항목 저장 권한이 없습니다.' USING ERRCODE='42501'; END IF;
  END IF;
  DELETE FROM public.estimate_item_estimate_uses WHERE estimate_id=NEW.id;
  FOR r IN SELECT value FROM jsonb_array_elements(NEW.estimate_data#>'{itemBuilder,privateRows}') LOOP
    SELECT * INTO version_row FROM public.estimate_item_versions WHERE id=(r->>'versionId')::uuid;
    IF NOT FOUND OR version_row.frozen IS DISTINCT FROM r#>'{version,frozen}' THEN
      RAISE EXCEPTION '추가 공사 게시 출처가 일치하지 않습니다.' USING ERRCODE='23514';
    END IF;
    IF TG_OP='INSERT' OR NOT EXISTS(SELECT FROM jsonb_array_elements(coalesce(OLD.estimate_data#>'{itemBuilder,privateRows}','[]')) previous
      WHERE previous->>'id'=r->>'id' AND previous->>'versionId'=r->>'versionId') THEN
      SELECT * INTO head_row FROM public.estimate_item_templates WHERE id=version_row.template_id FOR SHARE;
      IF NOT head_row.is_active OR head_row.current_version IS DISTINCT FROM version_row.id THEN
        RAISE EXCEPTION '항목이 변경·비활성화되었습니다. 다시 선택해 주세요.' USING ERRCODE='23514';
      END IF;
    END IF;
    INSERT INTO public.estimate_item_estimate_uses(estimate_id,line_id,version_id) VALUES(NEW.id,(r->>'id')::uuid,version_row.id);
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER estimate_item_references AFTER INSERT OR UPDATE OF estimate_data ON public.estimates FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_references();
REVOKE ALL ON FUNCTION public.and_os_estimate_item_references() FROM PUBLIC,anon,authenticated,service_role;

-- Keep the deployed projection byte-for-byte for legacy estimates.
ALTER FUNCTION public.and_os_5b_source(uuid) RENAME TO and_os_5b_source_before_items;
CREATE FUNCTION public.and_os_5b_source(p_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; snapshot jsonb; extension_rows jsonb;
BEGIN
  result:=public.and_os_5b_source_before_items(p_id);
  SELECT estimate_data#>'{itemBuilder,publicRows}' INTO extension_rows FROM public.estimates WHERE id=p_id;
  IF extension_rows IS NULL OR extension_rows='[]'::jsonb THEN RETURN result; END IF;
  snapshot:=result->'snapshot'||jsonb_build_object('itemBuilderRows',
    (SELECT coalesce(jsonb_agg(public.and_os_5b_public_object(r,ARRAY['id','versionId','name','trade','spec','unit','quantity'])),'[]') FROM jsonb_array_elements(extension_rows) r));
  RETURN jsonb_build_object('snapshot',snapshot,'fingerprint',encode(extensions.digest(snapshot::text,'sha256'),'hex'));
END $$;
REVOKE ALL ON FUNCTION public.and_os_5b_source(uuid),public.and_os_5b_source_before_items(uuid) FROM PUBLIC,anon,authenticated,service_role;
COMMIT;
