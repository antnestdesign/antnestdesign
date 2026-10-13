-- Forward migration: account-state-aware helper before all dependent policies/RPCs
-- Not applied to Production; Phase 4C replay required.
BEGIN;
SET LOCAL search_path = pg_catalog, public, extensions;

create or replace function public.current_and_os_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()
    and is_active = true and must_change_password = false), '');
$$;

revoke all on function public.current_and_os_role() from public, anon;

grant execute on function public.current_and_os_role() to authenticated, service_role;

revoke all on function public.is_and_os_admin() from public, anon;

grant execute on function public.is_and_os_admin() to authenticated, service_role;

COMMIT;
