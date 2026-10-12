-- PROPOSED / TEST ONLY. Not a production migration. Roll back by recreating
-- the isolated stack from bootstrap; never revert live production policies.
-- Staff direct writes are intentionally blocked until safe server CRUD exists.
-- Applying this to production now would break current staff estimate workflows.
create or replace function public.current_and_os_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()
    and is_active = true and must_change_password = false), '');
$$;
revoke all on function public.current_and_os_role() from public, anon;
grant execute on function public.current_and_os_role() to authenticated, service_role;
revoke all on function public.is_and_os_admin() from public, anon;
grant execute on function public.is_and_os_admin() to authenticated, service_role;

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
drop policy if exists test_profile_self_read on public.profiles;
create policy test_profile_self_read on public.profiles for select to authenticated
  using (id = auth.uid());

alter table public.estimates enable row level security;
revoke all on public.estimates from public, anon, authenticated;
grant select, insert, update, delete on public.estimates to authenticated;
grant all on public.estimates to service_role;
drop policy if exists test_estimate_read on public.estimates;
drop policy if exists test_estimate_insert on public.estimates;
drop policy if exists test_estimate_update on public.estimates;
drop policy if exists test_estimate_delete on public.estimates;
create policy test_estimate_read on public.estimates for select to authenticated
  using (public.current_and_os_role() in ('admin', 'manager'));
create policy test_estimate_insert on public.estimates for insert to authenticated
  with check (public.current_and_os_role() in ('admin', 'manager'));
create policy test_estimate_update on public.estimates for update to authenticated
  using (public.current_and_os_role() in ('admin', 'manager'))
  with check (public.current_and_os_role() in ('admin', 'manager'));
create policy test_estimate_delete on public.estimates for delete to authenticated
  using (public.current_and_os_role() = 'admin');

-- Deliberately owner-evaluated, security-barrier view: the explicit caller role
-- filter and nested whitelist are the boundary, not underlying estimates RLS.
-- Only a small customer input subset is modeled, not a full staff CRUD solution.
create or replace view public.staff_estimates_view with (security_barrier = true) as
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

-- Direct writes require both table grants and an approved definer RPC path.
revoke all on public.cost_items from public, anon, authenticated;
grant select on public.cost_items to authenticated;
grant all on public.cost_items, public.cost_item_history, public.cost_publish_log to service_role;
drop policy if exists cost_items_admin_select on public.cost_items;
create policy cost_items_admin_select on public.cost_items for select to authenticated
  using (public.current_and_os_role() in ('admin', 'manager'));
-- Mutation guard is defined by cost-rpc.PROPOSED_CANONICAL.sql, not duplicated here.
