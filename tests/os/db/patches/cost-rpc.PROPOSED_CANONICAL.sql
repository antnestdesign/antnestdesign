-- PROPOSED_CANONICAL / LOCAL TEST ONLY, NOT a production migration.
-- Source: AND_OS_PROD_COST_SCHEMA_2026-10-12.json (catalog capture, no business rows).
-- Decision: captured production behavior + explicit local hardening additions.
-- Requires captured support DDL and an account-state-aware is_and_os_admin().
do $$ begin
  if not exists (select 1 from public.and_os_2b_test_marker where project_id='and-os-security-test') then
    raise exception 'Owned local test DB required';
  end if;
end $$;

-- Captured trigger body retained; unnecessary EXECUTE privileges reduced locally.
create or replace function public.and_os_require_cost_rpc_mutation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('request.and_os_cost_rpc',true),'') <> 'on' then
    raise exception 'AND OS cost data mutation must use approved RPC';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.and_os_require_cost_rpc_mutation() from public,anon,authenticated,service_role;
-- Retire the earlier substitute trigger; captured guards cover all three tables.
drop trigger if exists test_cost_mutation_gate on public.cost_items;

create or replace function public.save_cost_item_draft(
  p_cost_item_id uuid, p_draft_cost_price numeric default null,
  p_draft_margin_rate numeric default null, p_draft_is_active boolean default null
) returns public.cost_items
language plpgsql security definer set search_path = public as $$
declare v_row public.cost_items; v_has_draft boolean;
begin
  if not public.is_and_os_admin() then raise exception 'AND OS admin permission required'; end if;
  if p_draft_cost_price is not null and
    (p_draft_cost_price < 0 or p_draft_cost_price::text in ('NaN','Infinity','-Infinity')) then
    raise exception 'invalid draft cost price';
  end if;
  if p_draft_margin_rate is not null and
    (p_draft_margin_rate < 0 or p_draft_margin_rate >= 1 or p_draft_margin_rate::text in ('NaN','Infinity','-Infinity')) then
    raise exception 'invalid draft margin rate';
  end if;
  select * into v_row from public.cost_items where id=p_cost_item_id for update;
  if not found then raise exception 'cost item not found'; end if;
  perform set_config('request.and_os_cost_rpc','on',true);
  -- Preserve production no-op semantics, including explicit false and null clears.
  update public.cost_items set
    draft_cost_price=case when p_draft_cost_price is not null and p_draft_cost_price <> cost_price then p_draft_cost_price else null end,
    draft_margin_rate=case when p_draft_margin_rate is not null and p_draft_margin_rate <> default_margin_rate then p_draft_margin_rate else null end,
    draft_is_active=case when p_draft_is_active is not null and p_draft_is_active <> is_active then p_draft_is_active else null end
    where id=p_cost_item_id returning * into v_row;
  v_has_draft := v_row.draft_cost_price is not null or v_row.draft_margin_rate is not null or v_row.draft_is_active is not null;
  update public.cost_items set
    draft_updated_at=case when v_has_draft then now() else null end,
    draft_updated_by=case when v_has_draft then auth.uid() else null end
    where id=p_cost_item_id returning * into v_row;
  return v_row;
end $$;
revoke all on function public.save_cost_item_draft(uuid,numeric,numeric,boolean) from public,anon,authenticated,service_role;
grant execute on function public.save_cost_item_draft(uuid,numeric,numeric,boolean) to authenticated,service_role;

create or replace function public.next_cost_publish_version() returns text
language plpgsql security definer set search_path = public as $$
declare v_day text; v_sequence integer;
begin
  if not public.is_and_os_admin() then raise exception 'AND OS admin permission required'; end if;
  -- Same transaction lock as the tracked publisher; no sequence consumed on rollback.
  perform pg_advisory_xact_lock(hashtext('and_os_cost_publish'));
  v_day := to_char(timezone('Asia/Seoul',now()),'YYYY.MM.DD');
  select coalesce(max(substring(version from 12)::integer),0)+1 into v_sequence
    from public.cost_publish_log where version like v_day || '-%'
      and version ~ '^\d{4}\.\d{2}\.\d{2}-\d{3}$';
  if v_sequence > 999 then raise exception 'daily publish version limit reached'; end if;
  return v_day || '-' || lpad(v_sequence::text,3,'0');
end $$;
revoke all on function public.next_cost_publish_version() from public,anon,authenticated,service_role;
grant execute on function public.next_cost_publish_version() to service_role;

-- Version rollback is NOT an independent app RPC: main.createRollbackDrafts()
-- calls save_cost_item_draft repeatedly with history.old_* then publishes normally.
-- Do not invent a rollback RPC or claim those multiple calls are atomic.
