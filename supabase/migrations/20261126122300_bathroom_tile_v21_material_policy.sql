BEGIN;

ALTER FUNCTION public.and_os_preliminary_policy_valid(jsonb)
  RENAME TO and_os_preliminary_policy_valid_base;

CREATE FUNCTION public.and_os_preliminary_policy_valid(p_config jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog AS $$
DECLARE
  v_price_keys constant text[] := ARRAY['BATH_TILE_CERAFIX','BATH_TILE_DRYFIX','BATH_TILE_GROUT_MATERIAL'];
  v_coverage_keys constant text[] := ARRAY['bathTileCerafixCoverage','bathTileDryfixCoverage'];
  v_value jsonb;
  v_number numeric;
  v_key text;
BEGIN
  IF jsonb_typeof(p_config) IS DISTINCT FROM 'object' OR pg_column_size(p_config) > 150000
     OR jsonb_typeof(p_config->'prices') IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_config->'parameters') IS DISTINCT FROM 'object' THEN
    RETURN false;
  END IF;

  -- Missing additions are allowed in pre-existing drafts and use the application defaults.
  FOREACH v_key IN ARRAY v_price_keys LOOP
    v_value := p_config->'prices'->v_key;
    IF v_value IS NULL THEN CONTINUE; END IF;
    IF jsonb_typeof(v_value) <> 'number' THEN RETURN false; END IF;
    v_number := (v_value::text)::numeric;
    IF v_number < 0 OR v_number > 1000000000 THEN RETURN false; END IF;
  END LOOP;
  FOREACH v_key IN ARRAY v_coverage_keys LOOP
    v_value := p_config->'parameters'->v_key;
    IF v_value IS NULL THEN CONTINUE; END IF;
    IF jsonb_typeof(v_value) <> 'number' THEN RETURN false; END IF;
    v_number := (v_value::text)::numeric;
    IF v_number < 0.001 OR v_number > 1000 OR v_number <> round(v_number, 3) THEN RETURN false; END IF;
  END LOOP;

  RETURN public.and_os_preliminary_policy_valid_base(
    p_config || jsonb_build_object(
      'prices', (p_config->'prices') - v_price_keys,
      'parameters', (p_config->'parameters') - v_coverage_keys
    )
  );
END $$;

REVOKE ALL ON FUNCTION public.and_os_preliminary_policy_valid(jsonb),
  public.and_os_preliminary_policy_valid_base(jsonb) FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
