-- READ ONLY: inventory object classes not present in the baseline generator.
SELECT jsonb_build_object(
  'capture_kind', 'POSTGRES_APP_CATALOG_EXTRAS_ONLY',
  'captured_at', statement_timestamp(),
  'procedures', (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prokind<>'f' AND NOT EXISTS
    (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')),
  'foreign_tables', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='f'),
  'composite_types', (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='c'),
  'custom_rules', (SELECT count(*) FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND r.rulename<>'_RETURN'),
  'custom_collations', (SELECT count(*) FROM pg_collation c JOIN pg_namespace n ON n.oid=c.collnamespace WHERE n.nspname='public' AND NOT EXISTS
    (SELECT 1 FROM pg_depend d WHERE d.classid='pg_collation'::regclass AND d.objid=c.oid AND d.deptype='e')),
  'custom_operators', (SELECT count(*) FROM pg_operator o JOIN pg_namespace n ON n.oid=o.oprnamespace WHERE n.nspname='public' AND NOT EXISTS
    (SELECT 1 FROM pg_depend d WHERE d.classid='pg_operator'::regclass AND d.objid=o.oid AND d.deptype='e'))
) AS metadata_snapshot;
