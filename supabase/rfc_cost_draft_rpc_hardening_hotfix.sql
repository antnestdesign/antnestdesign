-- AND OS cost draft RPC hardening hotfix.
-- Replaces draft cancel/publish functions only so cost_items mutations happen
-- through the approved RPC path required by the hardening trigger.
-- This script does not update cost item data or publish/cancel existing drafts.

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

  select * into v_row from public.cost_items where id = p_cost_item_id;
  if v_row.id is null then
    raise exception 'cost item not found';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  if v_row.is_pending_new then
    delete from public.cost_items where id = p_cost_item_id;
    return v_row;
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

  return v_row;
end;
$$;

create or replace function public.cancel_all_cost_drafts()
returns integer
security definer
set search_path = public
language plpgsql
as $$
declare
  v_count integer;
  v_changed_count integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  delete from public.cost_items
  where is_pending_new = true;

  get diagnostics v_count = row_count;

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

  get diagnostics v_changed_count = row_count;
  v_count := v_count + v_changed_count;
  return v_count;
end;
$$;

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
  if v_reason is null then raise exception 'publish reason is required'; end if;
  if char_length(v_reason) > 500 then raise exception 'publish reason must be 500 characters or fewer'; end if;

  v_memo := nullif(trim(p_memo), '');
  if v_memo is not null and char_length(v_memo) > 2000 then
    raise exception 'publish memo must be 2000 characters or fewer';
  end if;

  perform pg_advisory_xact_lock(hashtext('and_os_cost_publish'));
  perform set_config('request.and_os_cost_rpc', 'on', true);

  select count(*)
  into v_changed_count
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  if v_changed_count = 0 then raise exception 'no draft cost changes to publish'; end if;

  v_version := public.next_cost_publish_version();

  select
    count(*) filter (where draft_cost_price is not null or is_pending_new = true),
    count(*) filter (where draft_margin_rate is not null or is_pending_new = true),
    count(*) filter (where draft_is_active is not null or is_pending_new = true)
  into v_price_count, v_margin_count, v_active_count
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
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
    case when is_pending_new then null else cost_price end,
    coalesce(draft_cost_price, cost_price),
    case when is_pending_new then null else default_margin_rate end,
    coalesce(draft_margin_rate, default_margin_rate),
    case when is_pending_new then false else is_active end,
    coalesce(draft_is_active, is_active),
    auth.uid(),
    timezone('Asia/Seoul', now()),
    v_reason,
    v_version
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
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
    draft_updated_by = null,
    is_pending_new = false
  where is_pending_new = true
     or draft_cost_price is not null
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

  return query select v_version, v_changed_count, v_price_count, v_margin_count, v_active_count;
end;
$$;

revoke all on function public.cancel_cost_item_draft(uuid) from public;
revoke all on function public.cancel_cost_item_draft(uuid) from anon;
grant execute on function public.cancel_cost_item_draft(uuid) to authenticated;

revoke all on function public.cancel_all_cost_drafts() from public;
revoke all on function public.cancel_all_cost_drafts() from anon;
grant execute on function public.cancel_all_cost_drafts() to authenticated;

revoke all on function public.publish_cost_drafts(text, text) from public;
revoke all on function public.publish_cost_drafts(text, text) from anon;
grant execute on function public.publish_cost_drafts(text, text) to authenticated;
