-- Forward migration: actual Production policies + verified staff whitelist and legacy raw-REST closure
-- Not applied to Production; Phase 4C replay required.
BEGIN;
SET LOCAL search_path = pg_catalog, public, extensions;

DROP POLICY "authenticated estimates access" ON public."estimates";

DROP POLICY "profiles_select_own" ON public."profiles";

alter table public.profiles enable row level security;

revoke all on public.profiles from public, anon, authenticated;

grant select on public.profiles to authenticated;

grant all on public.profiles to service_role;

create policy and_os_profile_self_read on public.profiles for select to authenticated
  using (id = auth.uid());

alter table public.estimates enable row level security;

revoke all on public.estimates from public, anon, authenticated;

grant select, insert, update, delete on public.estimates to authenticated;

grant all on public.estimates to service_role;

create policy and_os_estimate_read on public.estimates for select to authenticated
  using (public.current_and_os_role() in ('admin', 'manager'));

create policy and_os_estimate_insert on public.estimates for insert to authenticated
  with check (public.current_and_os_role() in ('admin', 'manager'));

create policy and_os_estimate_update on public.estimates for update to authenticated
  using (public.current_and_os_role() in ('admin', 'manager'))
  with check (public.current_and_os_role() in ('admin', 'manager'));

create policy and_os_estimate_delete on public.estimates for delete to authenticated
  using (public.current_and_os_role() = 'admin');

create view public.staff_estimates_view with (security_barrier = true) as
select e.id, e.project_name, e.client_name, e.phone, e.address, e.area_pyeong,
  e.total_price, e.status, e.created_at, e.updated_at,
  jsonb_build_object(
    'inputs', jsonb_build_object(
      'projectName', e.estimate_data #> '{inputs,projectName}',
      'clientName', e.estimate_data #> '{inputs,clientName}',
      'clientPhone', e.estimate_data #> '{inputs,clientPhone}',
      'areaPyeong', e.estimate_data #> '{inputs,areaPyeong}',
      'existingPipeCleaningEnabled', e.estimate_data #> '{inputs,existingPipeCleaningEnabled}'
    ),
    'customerQuote', jsonb_build_object(
      'projectName', e.project_name, 'clientName', e.client_name, 'phone', e.phone,
      'total', e.total_price, 'totalText', e.estimate_data #> '{customerQuote,totalText}',
      'groups', coalesce((select jsonb_agg(jsonb_build_object(
        'label', g->'label', 'total', g->'total', 'totalText', g->'totalText',
        'items', coalesce((select jsonb_agg(jsonb_build_object(
          'name', i->'name', 'amount', i->'amount', 'amountText', i->'amountText'))
          from jsonb_array_elements(g->'items') i), '[]'::jsonb)))
        from jsonb_array_elements(e.estimate_data #> '{customerQuote,groups}') g), '[]'::jsonb)
    )
  ) as estimate_data
from public.estimates e where public.current_and_os_role() = 'staff';

revoke all on public.staff_estimates_view from public, anon, authenticated;

grant select on public.staff_estimates_view to authenticated;

revoke all on public.cost_items from public, anon, authenticated;

grant select on public.cost_items to authenticated;

grant all on public.cost_items, public.cost_item_history, public.cost_publish_log to service_role;

ALTER VIEW public.staff_estimates_view OWNER TO postgres;

REVOKE ALL ON public.cost_item_history, public.cost_publish_log FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.cost_item_history, public.cost_publish_log TO authenticated;

DROP POLICY "authenticated customers access" ON public.customers;

REVOKE ALL ON public.customers FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.customers TO authenticated;

GRANT ALL ON public.customers TO service_role;

CREATE POLICY and_os_customers_internal_read ON public.customers FOR SELECT TO authenticated USING (public.current_and_os_role() IN ('admin','manager'));

DROP POLICY "authenticated estimate_items access" ON public.estimate_items;

REVOKE ALL ON public.estimate_items FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.estimate_items TO authenticated;

GRANT ALL ON public.estimate_items TO service_role;

CREATE POLICY and_os_estimate_items_internal_read ON public.estimate_items FOR SELECT TO authenticated USING (public.current_and_os_role() IN ('admin','manager'));

DROP POLICY "authenticated projects access" ON public.projects;

REVOKE ALL ON public.projects FROM PUBLIC, anon, authenticated;

GRANT SELECT ON public.projects TO authenticated;

GRANT ALL ON public.projects TO service_role;

CREATE POLICY and_os_projects_internal_read ON public.projects FOR SELECT TO authenticated USING (public.current_and_os_role() IN ('admin','manager'));

COMMIT;
