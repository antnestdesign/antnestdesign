-- AND OS V2-3 System Module + Draft Publish System
-- Scope: cost_items draft fields + publish log + publish RPC
-- IMPORTANT: Review before executing in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- 1. Extend existing cost_items with draft-only fields.
-- Current published values remain cost_price, default_margin_rate, is_active.
-- New estimates must continue to use only published values.
alter table public.cost_items
  add column if not exists draft_cost_price numeric,
  add column if not exists draft_margin_rate numeric,
  add column if not exists draft_is_active boolean,
  add column if not exists draft_updated_at timestamptz,
  add column if not exists draft_updated_by uuid references auth.users(id);

-- 2. Keep cost_item_history as item-level publish history.
alter table public.cost_item_history
  add column if not exists cost_version text,
  add column if not exists old_is_active boolean,
  add column if not exists new_is_active boolean;

-- 3. Publish log stores publish-unit version metadata.
create table if not exists public.cost_publish_log (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  reason text not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default timezone('Asia/Seoul', now()),
  changed_item_count integer not null default 0,
  price_change_count integer not null default 0,
  margin_change_count integer not null default 0,
  active_change_count integer not null default 0,
  duration_ms integer,
  memo text,
  created_at timestamptz not null default timezone('Asia/Seoul', now()),
  constraint cost_publish_log_counts_check check (
    changed_item_count >= 0
    and price_change_count >= 0
    and margin_change_count >= 0
    and active_change_count >= 0
    and (duration_ms is null or duration_ms >= 0)
  )
);

create index if not exists cost_items_draft_idx
on public.cost_items (draft_updated_at desc)
where draft_updated_at is not null;

create index if not exists cost_items_active_sort_idx
on public.cost_items (is_active, sort_order, category);

create index if not exists cost_item_history_version_idx
on public.cost_item_history (cost_version, changed_at desc);

create index if not exists cost_publish_log_published_idx
on public.cost_publish_log (published_at desc);

-- 4. Admin-only RLS for publish log. Existing cost_items/history RLS remains unchanged.
alter table public.cost_publish_log enable row level security;

drop policy if exists "cost_publish_log_admin_select" on public.cost_publish_log;
drop policy if exists "cost_publish_log_admin_insert" on public.cost_publish_log;
drop policy if exists "cost_publish_log_admin_update" on public.cost_publish_log;
drop policy if exists "cost_publish_log_admin_delete" on public.cost_publish_log;

create policy "cost_publish_log_admin_select"
on public.cost_publish_log for select to authenticated
using (public.is_and_os_admin());

create policy "cost_publish_log_admin_insert"
on public.cost_publish_log for insert to authenticated
with check (public.is_and_os_admin());

create policy "cost_publish_log_admin_update"
on public.cost_publish_log for update to authenticated
using (public.is_and_os_admin())
with check (public.is_and_os_admin());

create policy "cost_publish_log_admin_delete"
on public.cost_publish_log for delete to authenticated
using (public.is_and_os_admin());

-- 5. Utility: next publish version in YYYY.MM.DD-001 format.
-- Internal helper for publish_cost_drafts(). Do not grant external execute permission.
create or replace function public.next_cost_publish_version()
returns text
security definer
set search_path = public
language plpgsql
volatile
as $$
declare
  v_prefix text;
  v_last_suffix integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_prefix := to_char(timezone('Asia/Seoul', now()), 'YYYY.MM.DD');

  select coalesce(max(substring(version from 12 for 3)::integer), 0)
  into v_last_suffix
  from public.cost_publish_log
  where version like v_prefix || '-___';

  return v_prefix || '-' || lpad((v_last_suffix + 1)::text, 3, '0');
end;
$$;

-- 6. Save one item's draft values. Draft save does not create history and does not affect estimates.
create or replace function public.save_cost_item_draft(
  p_cost_item_id uuid,
  p_draft_cost_price numeric default null,
  p_draft_margin_rate numeric default null,
  p_draft_is_active boolean default null
)
returns public.cost_items
security definer
set search_path = public
language plpgsql
as $$
declare
  v_row public.cost_items;
  v_has_draft boolean;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  if p_draft_cost_price is not null and p_draft_cost_price < 0 then
    raise exception 'draft cost price must be greater than or equal to zero';
  end if;

  if p_draft_margin_rate is not null
     and (p_draft_margin_rate < 0 or p_draft_margin_rate >= 1) then
    raise exception 'draft margin rate must be greater than or equal to zero and less than one';
  end if;

  update public.cost_items
  set
    draft_cost_price = case
      when p_draft_cost_price is not null and p_draft_cost_price <> cost_price then p_draft_cost_price
      else null
    end,
    draft_margin_rate = case
      when p_draft_margin_rate is not null and p_draft_margin_rate <> default_margin_rate then p_draft_margin_rate
      else null
    end,
    draft_is_active = case
      when p_draft_is_active is not null and p_draft_is_active <> is_active then p_draft_is_active
      else null
    end
  where id = p_cost_item_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'cost item not found';
  end if;

  v_has_draft := v_row.draft_cost_price is not null
    or v_row.draft_margin_rate is not null
    or v_row.draft_is_active is not null;

  update public.cost_items
  set
    draft_updated_at = case when v_has_draft then timezone('Asia/Seoul', now()) else null end,
    draft_updated_by = case when v_has_draft then auth.uid() else null end
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$$;

-- 7. Cancel one draft item.
create or replace function public.cancel_cost_item_draft(
  p_cost_item_id uuid
)
returns public.cost_items
security definer
set search_path = public
language plpgsql
as $$
declare
  v_row public.cost_items;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  update public.cost_items
  set
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null
  where id = p_cost_item_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'cost item not found';
  end if;

  return v_row;
end;
$$;

-- 8. Cancel all draft changes.
create or replace function public.cancel_all_cost_drafts()
returns integer
security definer
set search_path = public
language plpgsql
as $$
declare
  v_count integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  update public.cost_items
  set
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- 9. Publish all drafts as one transaction. Failure rolls back everything.
create or replace function public.publish_cost_drafts(
  p_reason text,
  p_memo text default null
)
returns table (
  version text,
  changed_item_count integer,
  price_change_count integer,
  margin_change_count integer,
  active_change_count integer
)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_reason text;
  v_version text;
  v_changed_count integer;
  v_price_count integer;
  v_margin_count integer;
  v_active_count integer;
  v_memo text;
  v_started_at timestamptz;
  v_duration_ms integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_started_at := clock_timestamp();

  v_reason := nullif(trim(p_reason), '');
  if v_reason is null then
    raise exception 'publish reason is required';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'publish reason must be 500 characters or fewer';
  end if;

  v_memo := nullif(trim(p_memo), '');
  if v_memo is not null and char_length(v_memo) > 2000 then
    raise exception 'publish memo must be 2000 characters or fewer';
  end if;

  perform pg_advisory_xact_lock(hashtext('and_os_cost_publish'));

  select count(*)
  into v_changed_count
  from public.cost_items
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  if v_changed_count = 0 then
    raise exception 'no draft cost changes to publish';
  end if;

  v_version := public.next_cost_publish_version();

  select
    count(*) filter (where draft_cost_price is not null),
    count(*) filter (where draft_margin_rate is not null),
    count(*) filter (where draft_is_active is not null)
  into v_price_count, v_margin_count, v_active_count
  from public.cost_items
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  insert into public.cost_item_history (
    cost_item_id,
    old_cost_price,
    new_cost_price,
    old_margin_rate,
    new_margin_rate,
    old_is_active,
    new_is_active,
    changed_by,
    changed_at,
    reason,
    cost_version
  )
  select
    id,
    cost_price,
    coalesce(draft_cost_price, cost_price),
    default_margin_rate,
    coalesce(draft_margin_rate, default_margin_rate),
    is_active,
    coalesce(draft_is_active, is_active),
    auth.uid(),
    timezone('Asia/Seoul', now()),
    v_reason,
    v_version
  from public.cost_items
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  update public.cost_items
  set
    cost_price = coalesce(draft_cost_price, cost_price),
    default_margin_rate = coalesce(draft_margin_rate, default_margin_rate),
    is_active = coalesce(draft_is_active, is_active),
    updated_by = auth.uid(),
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  v_duration_ms := greatest(0, floor(extract(epoch from (clock_timestamp() - v_started_at)) * 1000)::integer);

  insert into public.cost_publish_log (
    version,
    reason,
    published_by,
    published_at,
    changed_item_count,
    price_change_count,
    margin_change_count,
    active_change_count,
    duration_ms,
    memo,
    created_at
  ) values (
    v_version,
    v_reason,
    auth.uid(),
    timezone('Asia/Seoul', now()),
    v_changed_count,
    v_price_count,
    v_margin_count,
    v_active_count,
    v_duration_ms,
    v_memo,
    timezone('Asia/Seoul', now())
  );

  return query
  select v_version, v_changed_count, v_price_count, v_margin_count, v_active_count;
end;
$$;

-- 10. Function execute permissions.
-- next_cost_publish_version() is internal only. Authenticated users must call publish_cost_drafts().
revoke all on function public.next_cost_publish_version() from public;
revoke all on function public.next_cost_publish_version() from anon;
revoke all on function public.next_cost_publish_version() from authenticated;

revoke all on function public.save_cost_item_draft(uuid, numeric, numeric, boolean) from public;
revoke all on function public.save_cost_item_draft(uuid, numeric, numeric, boolean) from anon;
grant execute on function public.save_cost_item_draft(uuid, numeric, numeric, boolean) to authenticated;

revoke all on function public.cancel_cost_item_draft(uuid) from public;
revoke all on function public.cancel_cost_item_draft(uuid) from anon;
grant execute on function public.cancel_cost_item_draft(uuid) to authenticated;

revoke all on function public.cancel_all_cost_drafts() from public;
revoke all on function public.cancel_all_cost_drafts() from anon;
grant execute on function public.cancel_all_cost_drafts() to authenticated;

revoke all on function public.publish_cost_drafts(text, text) from public;
revoke all on function public.publish_cost_drafts(text, text) from anon;
grant execute on function public.publish_cost_drafts(text, text) to authenticated;





