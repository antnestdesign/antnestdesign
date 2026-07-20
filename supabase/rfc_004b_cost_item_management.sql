-- RFC-004B: Cost item management draft workflow.
-- Purpose: allow AND OS admins to create/clone/edit pending cost items without
-- weakening RFC-001A direct mutation protection.

begin;

alter table public.cost_items
  add column if not exists calculation_basis text not null default 'manual_input',
  add column if not exists calculation_multiplier numeric not null default 1,
  add column if not exists min_quantity numeric,
  add column if not exists rounding_method text not null default 'none',
  add column if not exists is_pending_new boolean not null default false,
  add column if not exists source_cost_item_id uuid references public.cost_items(id);

alter table public.cost_items
  drop constraint if exists cost_items_calculation_basis_check,
  add constraint cost_items_calculation_basis_check check (
    calculation_basis in (
      'fixed',
      'apartment_pyeong',
      'flooring_pyeong',
      'length_mm',
      'length_m',
      'area_sqm',
      'count',
      'bathroom_count',
      'lower_cabinet_length',
      'upper_cabinet_length',
      'homebar_length',
      'island_length',
      'partition_length',
      'manual_input'
    )
  );

alter table public.cost_items
  drop constraint if exists cost_items_rounding_method_check,
  add constraint cost_items_rounding_method_check check (
    rounding_method in ('none', 'ceil', 'floor', 'round')
  );

alter table public.cost_items
  drop constraint if exists cost_items_calculation_multiplier_check,
  add constraint cost_items_calculation_multiplier_check check (calculation_multiplier >= 0);

alter table public.cost_items
  drop constraint if exists cost_items_min_quantity_check,
  add constraint cost_items_min_quantity_check check (min_quantity is null or min_quantity >= 0);

create index if not exists cost_items_pending_idx
on public.cost_items (is_pending_new, draft_updated_at desc)
where is_pending_new = true;

create or replace function public.validate_and_os_cost_item_code(p_item_code text)
returns text
security definer
set search_path = public
language plpgsql
stable
as $$
declare
  v_code text;
begin
  v_code := upper(trim(coalesce(p_item_code, '')));
  if v_code = '' then
    raise exception 'item code is required';
  end if;
  if v_code !~ '^[A-Z0-9_]+$' then
    raise exception 'item code must contain only uppercase letters, numbers, and underscores';
  end if;
  return v_code;
end;
$$;

create or replace function public.create_cost_item_pending(
  p_item_code text,
  p_category text,
  p_subcategory text,
  p_item_name text,
  p_unit text,
  p_calculation_basis text,
  p_cost_price numeric,
  p_margin_rate numeric,
  p_is_active boolean,
  p_sort_order integer,
  p_memo text default null,
  p_customer_name text default null,
  p_order_name text default null,
  p_calculation_multiplier numeric default 1,
  p_min_quantity numeric default null,
  p_rounding_method text default 'none',
  p_include_in_customer_quote boolean default true,
  p_include_in_internal_quote boolean default true,
  p_include_in_order_sheet boolean default false,
  p_is_material boolean default false,
  p_is_labor boolean default false,
  p_is_service boolean default false,
  p_source_cost_item_id uuid default null
)
returns public.cost_items
security definer
set search_path = public
language plpgsql
as $$
declare
  v_row public.cost_items;
  v_item_code text;
  v_item_name text;
  v_category text;
  v_unit text;
  v_basis text;
  v_multiplier numeric;
  v_rounding text;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_item_code := public.validate_and_os_cost_item_code(p_item_code);
  v_item_name := nullif(trim(coalesce(p_item_name, '')), '');
  v_category := nullif(trim(coalesce(p_category, '')), '');
  v_unit := nullif(trim(coalesce(p_unit, '')), '');
  v_basis := nullif(trim(coalesce(p_calculation_basis, '')), '');
  v_multiplier := coalesce(p_calculation_multiplier, 1);
  v_rounding := coalesce(nullif(trim(p_rounding_method), ''), 'none');

  if v_item_name is null then raise exception 'item name is required'; end if;
  if v_category is null then raise exception 'category is required'; end if;
  if v_unit is null then raise exception 'unit is required'; end if;
  if v_basis is null then raise exception 'calculation basis is required'; end if;
  if p_cost_price is null or p_cost_price < 0 then raise exception 'cost price must be greater than or equal to zero'; end if;
  if p_margin_rate is null or p_margin_rate < 0 or p_margin_rate >= 1 then raise exception 'margin rate must be greater than or equal to zero and less than one'; end if;
  if v_multiplier < 0 then raise exception 'calculation multiplier must be greater than or equal to zero'; end if;
  if p_min_quantity is not null and p_min_quantity < 0 then raise exception 'minimum quantity must be greater than or equal to zero'; end if;
  if v_rounding not in ('none', 'ceil', 'floor', 'round') then raise exception 'rounding method is invalid'; end if;

  if exists (select 1 from public.cost_items where item_code = v_item_code) then
    raise exception 'cost item code already exists';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  insert into public.cost_items (
    category,
    subcategory,
    item_code,
    item_name,
    unit,
    cost_price,
    default_margin_rate,
    customer_name,
    order_name,
    include_in_customer_quote,
    include_in_internal_quote,
    include_in_order_sheet,
    is_material,
    is_labor,
    is_service,
    is_active,
    sort_order,
    memo,
    updated_by,
    draft_is_active,
    draft_updated_at,
    draft_updated_by,
    calculation_basis,
    calculation_multiplier,
    min_quantity,
    rounding_method,
    is_pending_new,
    source_cost_item_id
  )
  values (
    v_category,
    nullif(trim(coalesce(p_subcategory, '')), ''),
    v_item_code,
    v_item_name,
    v_unit,
    p_cost_price,
    p_margin_rate,
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_order_name, '')), ''),
    coalesce(p_include_in_customer_quote, true),
    coalesce(p_include_in_internal_quote, true),
    coalesce(p_include_in_order_sheet, false),
    coalesce(p_is_material, false),
    coalesce(p_is_labor, false),
    coalesce(p_is_service, false),
    false,
    coalesce(p_sort_order, 0),
    nullif(trim(coalesce(p_memo, '')), ''),
    auth.uid(),
    coalesce(p_is_active, true),
    timezone('Asia/Seoul', now()),
    auth.uid(),
    v_basis,
    v_multiplier,
    p_min_quantity,
    v_rounding,
    true,
    p_source_cost_item_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.update_cost_item_pending(
  p_cost_item_id uuid,
  p_item_code text,
  p_category text,
  p_subcategory text,
  p_item_name text,
  p_unit text,
  p_calculation_basis text,
  p_cost_price numeric,
  p_margin_rate numeric,
  p_is_active boolean,
  p_sort_order integer,
  p_memo text default null,
  p_customer_name text default null,
  p_order_name text default null,
  p_calculation_multiplier numeric default 1,
  p_min_quantity numeric default null,
  p_rounding_method text default 'none',
  p_include_in_customer_quote boolean default true,
  p_include_in_internal_quote boolean default true,
  p_include_in_order_sheet boolean default false,
  p_is_material boolean default false,
  p_is_labor boolean default false,
  p_is_service boolean default false
)
returns public.cost_items
security definer
set search_path = public
language plpgsql
as $$
declare
  v_row public.cost_items;
  v_category text;
  v_unit text;
  v_basis text;
  v_multiplier numeric;
  v_rounding text;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  select * into v_row from public.cost_items where id = p_cost_item_id;
  if v_row.id is null then raise exception 'cost item not found'; end if;
  if not v_row.is_pending_new then raise exception 'only pending new cost items can be edited here'; end if;

  if public.validate_and_os_cost_item_code(p_item_code) <> v_row.item_code then
    raise exception 'pending item code cannot be changed';
  end if;

  v_category := nullif(trim(coalesce(p_category, '')), '');
  v_unit := nullif(trim(coalesce(p_unit, '')), '');
  v_basis := nullif(trim(coalesce(p_calculation_basis, '')), '');
  v_multiplier := coalesce(p_calculation_multiplier, 1);
  v_rounding := coalesce(nullif(trim(p_rounding_method), ''), 'none');

  if nullif(trim(coalesce(p_item_name, '')), '') is null then raise exception 'item name is required'; end if;
  if v_category is null then raise exception 'category is required'; end if;
  if v_unit is null then raise exception 'unit is required'; end if;
  if v_basis is null then raise exception 'calculation basis is required'; end if;
  if p_cost_price is null or p_cost_price < 0 then raise exception 'cost price must be greater than or equal to zero'; end if;
  if p_margin_rate is null or p_margin_rate < 0 or p_margin_rate >= 1 then raise exception 'margin rate must be greater than or equal to zero and less than one'; end if;
  if v_multiplier < 0 then raise exception 'calculation multiplier must be greater than or equal to zero'; end if;
  if p_min_quantity is not null and p_min_quantity < 0 then raise exception 'minimum quantity must be greater than or equal to zero'; end if;
  if v_rounding not in ('none', 'ceil', 'floor', 'round') then raise exception 'rounding method is invalid'; end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  update public.cost_items
  set
    category = v_category,
    subcategory = nullif(trim(coalesce(p_subcategory, '')), ''),
    item_name = nullif(trim(coalesce(p_item_name, '')), ''),
    unit = v_unit,
    cost_price = p_cost_price,
    default_margin_rate = p_margin_rate,
    customer_name = nullif(trim(coalesce(p_customer_name, '')), ''),
    order_name = nullif(trim(coalesce(p_order_name, '')), ''),
    include_in_customer_quote = coalesce(p_include_in_customer_quote, true),
    include_in_internal_quote = coalesce(p_include_in_internal_quote, true),
    include_in_order_sheet = coalesce(p_include_in_order_sheet, false),
    is_material = coalesce(p_is_material, false),
    is_labor = coalesce(p_is_labor, false),
    is_service = coalesce(p_is_service, false),
    sort_order = coalesce(p_sort_order, 0),
    memo = nullif(trim(coalesce(p_memo, '')), ''),
    updated_by = auth.uid(),
    draft_is_active = coalesce(p_is_active, true),
    draft_updated_at = timezone('Asia/Seoul', now()),
    draft_updated_by = auth.uid(),
    calculation_basis = v_basis,
    calculation_multiplier = v_multiplier,
    min_quantity = p_min_quantity,
    rounding_method = v_rounding
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$$;

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

  perform set_config('request.and_os_cost_rpc', 'on', true);

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

revoke all on function public.validate_and_os_cost_item_code(text) from public;
revoke all on function public.validate_and_os_cost_item_code(text) from anon;
grant execute on function public.validate_and_os_cost_item_code(text) to authenticated;

revoke all on function public.create_cost_item_pending(text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean, uuid) from public;
revoke all on function public.create_cost_item_pending(text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean, uuid) from anon;
grant execute on function public.create_cost_item_pending(text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean, uuid) to authenticated;

revoke all on function public.update_cost_item_pending(uuid, text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean) from public;
revoke all on function public.update_cost_item_pending(uuid, text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean) from anon;
grant execute on function public.update_cost_item_pending(uuid, text, text, text, text, text, text, numeric, numeric, boolean, integer, text, text, text, numeric, numeric, text, boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;

commit;
