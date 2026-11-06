BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
CREATE TABLE public.estimate_item_detailed_uses (
  detailed_estimate_id uuid NOT NULL REFERENCES public.detailed_estimates(id) ON DELETE RESTRICT,
  line_id text NOT NULL,
  version_id uuid NOT NULL REFERENCES public.estimate_item_versions(id) ON DELETE RESTRICT,
  PRIMARY KEY(detailed_estimate_id,line_id)
);
ALTER TABLE public.estimate_item_detailed_uses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.estimate_item_detailed_uses FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION public.and_os_estimate_item_detailed_references() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r record; v public.estimate_item_versions; head_row public.estimate_item_templates;
BEGIN
  IF NOT EXISTS(SELECT FROM jsonb_each(coalesce(NEW.editor_internal_json->'items','{}')) x WHERE x.value ? 'templateVersion')
    AND NOT EXISTS(SELECT FROM public.estimate_item_detailed_uses WHERE detailed_estimate_id=NEW.detailed_estimate_id) THEN RETURN NEW; END IF;
  -- Removing a row from a draft is allowed. Issued snapshots remain immutable independently.
  DELETE FROM public.estimate_item_detailed_uses WHERE detailed_estimate_id=NEW.detailed_estimate_id;
  FOR r IN SELECT key,value FROM jsonb_each(NEW.editor_internal_json->'items') WHERE value ? 'templateVersion' LOOP
    SELECT * INTO v FROM public.estimate_item_versions WHERE id=(r.value#>>'{templateVersion,id}')::uuid;
    IF NOT FOUND OR v.frozen IS DISTINCT FROM r.value#>'{templateVersion,frozen}' OR NOT EXISTS(
      SELECT FROM jsonb_array_elements(NEW.editor_public_json->'items') i WHERE i->>'id'=r.key AND i->>'standardId'='tpl-'||v.id::text AND i->>'unit'=v.frozen#>>'{definition,unit}') THEN
      RAISE EXCEPTION '본견적의 게시 항목 참조가 일치하지 않습니다.' USING ERRCODE='23514';
    END IF;
    IF (TG_OP='INSERT' OR OLD.editor_internal_json#>>ARRAY['items',r.key,'templateVersion','id'] IS DISTINCT FROM v.id::text)
      AND NOT EXISTS(SELECT FROM public.detailed_estimate_references reference_row,
        jsonb_array_elements(coalesce(reference_row.reference_public_json->'itemBuilderRows','[]')) source_row
        WHERE reference_row.detailed_estimate_id=NEW.detailed_estimate_id AND source_row->>'versionId'=v.id::text) THEN
      SELECT * INTO head_row FROM public.estimate_item_templates WHERE id=v.template_id FOR SHARE;
      IF NOT head_row.is_active OR head_row.current_version IS DISTINCT FROM v.id THEN
        RAISE EXCEPTION '항목이 변경·비활성화되었습니다. 다시 선택해 주세요.' USING ERRCODE='23514';
      END IF;
    END IF;
    INSERT INTO public.estimate_item_detailed_uses VALUES(NEW.detailed_estimate_id,r.key,v.id);
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER estimate_item_detailed_references AFTER INSERT OR UPDATE OF editor_public_json,editor_internal_json ON public.detailed_estimate_drafts FOR EACH ROW EXECUTE FUNCTION public.and_os_estimate_item_detailed_references();
REVOKE ALL ON FUNCTION public.and_os_estimate_item_detailed_references() FROM PUBLIC,anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
