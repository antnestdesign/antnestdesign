-- READ ONLY. Catalog metadata only; no business rows or application RPCs.
with targets as (
 select c.*,n.nspname as schema_name from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p','v','m','S')
 and not exists(select 1 from pg_depend d where d.classid='pg_class'::regclass and d.objid=c.oid and d.deptype='e')
), functions as (
 select p.*,n.nspname as schema_name from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prokind='f'
 and not exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
)
select jsonb_build_object(
 'capture_kind','POSTGRES_APP_CATALOG_ONLY','captured_at',statement_timestamp(),'server_version',current_setting('server_version'),
 'tables',coalesce((select jsonb_agg(jsonb_build_object(
  'name',t.relname,'schema',t.schema_name,'oid',t.oid,'kind',t.relkind,'owner',pg_get_userbyid(t.relowner),
  'rls_enabled',t.relrowsecurity,'rls_forced',t.relforcerowsecurity,'options',t.reloptions,
  'partition_key',case when t.relkind='p' then pg_get_partkeydef(t.oid) end,
  'partition_bound',case when t.relispartition then pg_get_expr(t.relpartbound,t.oid) end,
  'parents',(select jsonb_agg(i.inhparent::regclass::text) from pg_inherits i where i.inhrelid=t.oid),
  'effective_acl',coalesce(t.relacl,acldefault('r',t.relowner))::text[],
  'columns',coalesce((select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),
   'nullable',not a.attnotnull,'default',pg_get_expr(ad.adbin,ad.adrelid),'identity',a.attidentity,'generated',a.attgenerated,
   'acl',a.attacl::text[],'collation',case when a.attcollation<>0 and a.attcollation<>ty.typcollation then a.attcollation::regcollation::text end)
   order by a.attnum) from pg_attribute a join pg_type ty on ty.oid=a.atttypid
   left join pg_attrdef ad on ad.adrelid=a.attrelid and ad.adnum=a.attnum
   where a.attrelid=t.oid and a.attnum>0 and not a.attisdropped),'[]'::jsonb),
  'constraints',coalesce((select jsonb_agg(jsonb_build_object('name',c.conname,'type',c.contype,'validated',c.convalidated,
   'definition',pg_get_constraintdef(c.oid,true),'index_oid',c.conindid) order by c.conname) from pg_constraint c where c.conrelid=t.oid),'[]'::jsonb),
  'indexes',coalesce((select jsonb_agg(jsonb_build_object('name',ic.relname,'definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,
   'constraint_backed',exists(select 1 from pg_constraint co where co.conindid=i.indexrelid)) order by ic.relname)
   from pg_index i join pg_class ic on ic.oid=i.indexrelid where i.indrelid=t.oid),'[]'::jsonb),
  'triggers',coalesce((select jsonb_agg(jsonb_build_object('name',g.tgname,'enabled',g.tgenabled,
   'definition',pg_get_triggerdef(g.oid,true),'called_function',g.tgfoid::regprocedure::text) order by g.tgname)
   from pg_trigger g where g.tgrelid=t.oid and not g.tgisinternal),'[]'::jsonb),
  'policies',coalesce((select jsonb_agg(to_jsonb(q) order by q.policyname) from pg_policies q
   where q.schemaname=t.schema_name and q.tablename=t.relname),'[]'::jsonb)
 ) order by t.relname) from targets t where t.relkind in ('r','p')),'[]'::jsonb),
 'functions',coalesce((select jsonb_agg(jsonb_build_object('name',f.proname,'schema',f.schema_name,
  'identity_arguments',pg_get_function_identity_arguments(f.oid),'arguments',pg_get_function_arguments(f.oid),
  'return_type',pg_get_function_result(f.oid),'definition',pg_get_functiondef(f.oid),'owner',pg_get_userbyid(f.proowner),
  'language',(select lanname from pg_language where oid=f.prolang),'security_definer',f.prosecdef,'proconfig',f.proconfig,
  'volatility',f.provolatile,'effective_acl',coalesce(f.proacl,acldefault('f',f.proowner))::text[])
  order by f.proname,pg_get_function_identity_arguments(f.oid)) from functions f),'[]'::jsonb),
 'views',coalesce((select jsonb_agg(jsonb_build_object('name',v.relname,'schema',v.schema_name,'kind',v.relkind,
  'owner',pg_get_userbyid(v.relowner),'definition',pg_get_viewdef(v.oid,true),'options',v.reloptions,
  'effective_acl',coalesce(v.relacl,acldefault('r',v.relowner))::text[]) order by v.relname)
  from targets v where v.relkind in ('v','m')),'[]'::jsonb),
 'sequences',coalesce((select jsonb_agg(jsonb_build_object('name',s.relname,'schema',s.schema_name,
  'owner',pg_get_userbyid(s.relowner),'data_type',format_type(q.seqtypid,null),'start',q.seqstart,'increment',q.seqincrement,
  'min',q.seqmin,'max',q.seqmax,'cache',q.seqcache,'cycle',q.seqcycle,'effective_acl',coalesce(s.relacl,acldefault('s',s.relowner))::text[],
  'owned_by',(select format('%I.%I.%I',ns.nspname,c.relname,a.attname) from pg_depend d join pg_class c on c.oid=d.refobjid
   join pg_namespace ns on ns.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid and a.attnum=d.refobjsubid
   where d.classid='pg_class'::regclass and d.objid=s.oid and d.deptype in ('a','i') limit 1)) order by s.relname)
  from targets s join pg_sequence q on q.seqrelid=s.oid where s.relkind='S'),'[]'::jsonb),
 'types',coalesce((select jsonb_agg(jsonb_build_object('name',t.typname,'kind',t.typtype,'owner',pg_get_userbyid(t.typowner),
  'base_type',format_type(t.typbasetype,t.typtypmod),'not_null',t.typnotnull,'default',t.typdefault,
  'enum_labels',(select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid=t.oid),
  'constraints',(select jsonb_agg(jsonb_build_object('name',c.conname,'definition',pg_get_constraintdef(c.oid,true))) from pg_constraint c where c.contypid=t.oid))
  order by t.typname) from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typtype in ('e','d')
   and not exists(select 1 from pg_depend d where d.classid='pg_type'::regclass and d.objid=t.oid and d.deptype='e')),'[]'::jsonb),
 'extensions',(select jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'schema',n.nspname) order by e.extname)
  from pg_extension e join pg_namespace n on n.oid=e.extnamespace),
 'public_schema',(select jsonb_build_object('owner',pg_get_userbyid(n.nspowner),'acl',n.nspacl::text[]) from pg_namespace n where n.nspname='public'),
 'default_privileges',coalesce((select jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'schema',n.nspname,
  'type',d.defaclobjtype,'acl',d.defaclacl::text[])) from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace
  where n.nspname='public'),'[]'::jsonb)
) as metadata_snapshot;
