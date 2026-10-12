# AND OS Production Cost Schema Capture

Capture: 2026-10-12T01:28:28.929072+00:00
Project: lzsxboaqliuwjzwsnnwf / antnest-estimate / main

Source: user-authenticated Supabase Dashboard SQL Editor; one PostgreSQL catalog SELECT.
No business table rows, Auth users, prices, customer data or credentials were queried/exported.
Only catalog inspection helpers (pg_get_functiondef/pg_get_* etc.) were called; no application RPC was executed.
The SQL Editor created its platform query draft automatically; no explicit Save was requested.
Production business data/schema/ACLs/functions were not changed.

JSON is the exact captured metadata. Local replay SQL is generated and TEST ONLY; it is not a migration.

Snapshot SHA256: 082b363ff7e9f56a3930c906515ff12c17a0a7864c6c06348adabdc067e0fec1

## Function Definitions

### public.and_os_require_cost_rpc_mutation()

OID: 17921; returns: trigger; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: ``
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["=X/postgres", "postgres=X/postgres", "anon=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.and_os_require_cost_rpc_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(current_setting('request.and_os_cost_rpc', true), '') <> 'on' then
    raise exception 'AND OS cost data mutation must use approved RPC';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$
```

### public.cancel_all_cost_drafts()

OID: 17909; returns: integer; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: ``
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.cancel_all_cost_drafts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.cancel_cost_item_draft(p_cost_item_id uuid)

OID: 17908; returns: cost_items; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: `p_cost_item_id uuid`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.cancel_cost_item_draft(p_cost_item_id uuid)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.create_cost_item_pending(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid)

OID: 17997; returns: cost_items; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: `p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false, p_source_cost_item_id uuid DEFAULT NULL::uuid`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.create_cost_item_pending(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false, p_source_cost_item_id uuid DEFAULT NULL::uuid)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.current_and_os_role()

OID: 17851; returns: text; language: sql; volatility: s; SECURITY DEFINER: True; owner: postgres
Arguments: ``
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["=X/postgres", "postgres=X/postgres", "anon=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.current_and_os_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select lower(role) from public.profiles where id = auth.uid() limit 1), 'staff');
$function$
```

### public.is_and_os_admin()

OID: 17852; returns: boolean; language: sql; volatility: s; SECURITY DEFINER: True; owner: postgres
Arguments: ``
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["=X/postgres", "postgres=X/postgres", "anon=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.is_and_os_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.current_and_os_role() = 'admin';
$function$
```

### public.next_cost_publish_version()

OID: 17906; returns: text; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: ``
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.next_cost_publish_version()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.publish_cost_drafts(p_reason text, p_memo text)

OID: 17910; returns: TABLE(version text, changed_item_count integer, price_change_count integer, margin_change_count integer, active_change_count integer); language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: `p_reason text, p_memo text DEFAULT NULL::text`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.publish_cost_drafts(p_reason text, p_memo text DEFAULT NULL::text)
 RETURNS TABLE(version text, changed_item_count integer, price_change_count integer, margin_change_count integer, active_change_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.save_cost_item_draft(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean)

OID: 17907; returns: cost_items; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: `p_cost_item_id uuid, p_draft_cost_price numeric DEFAULT NULL::numeric, p_draft_margin_rate numeric DEFAULT NULL::numeric, p_draft_is_active boolean DEFAULT NULL::boolean`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.save_cost_item_draft(p_cost_item_id uuid, p_draft_cost_price numeric DEFAULT NULL::numeric, p_draft_margin_rate numeric DEFAULT NULL::numeric, p_draft_is_active boolean DEFAULT NULL::boolean)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.cost_items;
  v_has_draft boolean;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

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
    draft_updated_at = case when v_has_draft then now() else null end,
    draft_updated_by = case when v_has_draft then auth.uid() else null end
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$function$
```

### public.set_updated_at()

OID: 17846; returns: trigger; language: plpgsql; volatility: v; SECURITY DEFINER: False; owner: postgres
Arguments: ``
Config/search_path: `null`
EXECUTE ACL: `["=X/postgres", "postgres=X/postgres", "anon=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
```

### public.update_cost_item_pending(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean)

OID: 17999; returns: cost_items; language: plpgsql; volatility: v; SECURITY DEFINER: True; owner: postgres
Arguments: `p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.update_cost_item_pending(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

### public.validate_and_os_cost_item_code(p_item_code text)

OID: 17996; returns: text; language: plpgsql; volatility: s; SECURITY DEFINER: True; owner: postgres
Arguments: `p_item_code text`
Config/search_path: `["search_path=public"]`
EXECUTE ACL: `["postgres=X/postgres", "authenticated=X/postgres", "service_role=X/postgres"]`

```sql
CREATE OR REPLACE FUNCTION public.validate_and_os_cost_item_code(p_item_code text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
```

## Table Metadata

### public.cost_item_history

RLS enabled: True; forced: False; owner: postgres
ACL: `["postgres=arwdDxtm/postgres", "anon=arwdDxtm/postgres", "authenticated=arwdDxtm/postgres", "service_role=arwdDxtm/postgres"]`

```json
{
  "acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ],
  "oid": "17827",
  "name": "cost_item_history",
  "owner": "postgres",
  "schema": "public",
  "columns": [
    {
      "acl": null,
      "name": "id",
      "type": "uuid",
      "default": "gen_random_uuid()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "cost_item_id",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "old_cost_price",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "new_cost_price",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "old_margin_rate",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "new_margin_rate",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "changed_by",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "changed_at",
      "type": "timestamp with time zone",
      "default": "now()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "reason",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "cost_version",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "old_is_active",
      "type": "boolean",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "new_is_active",
      "type": "boolean",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    }
  ],
  "indexes": [
    {
      "name": "cost_item_history_item_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_item_history_item_idx ON public.cost_item_history USING btree (cost_item_id, changed_at DESC)"
    },
    {
      "name": "cost_item_history_pkey",
      "valid": true,
      "definition": "CREATE UNIQUE INDEX cost_item_history_pkey ON public.cost_item_history USING btree (id)"
    },
    {
      "name": "cost_item_history_version_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_item_history_version_idx ON public.cost_item_history USING btree (cost_version, changed_at DESC)"
    }
  ],
  "policies": [
    {
      "cmd": "SELECT",
      "qual": "(current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text]))",
      "roles": [
        "authenticated"
      ],
      "tablename": "cost_item_history",
      "permissive": "PERMISSIVE",
      "policyname": "cost_item_history_admin_manager_select",
      "schemaname": "public",
      "with_check": null
    }
  ],
  "triggers": [
    {
      "name": "and_os_cost_item_history_mutation_guard",
      "enabled": "O",
      "definition": "CREATE TRIGGER and_os_cost_item_history_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_item_history FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation()",
      "function_oid": "17921",
      "called_function": "and_os_require_cost_rpc_mutation()"
    }
  ],
  "rls_forced": false,
  "constraints": [
    {
      "name": "cost_item_history_changed_by_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (changed_by) REFERENCES auth.users(id)"
    },
    {
      "name": "cost_item_history_cost_item_id_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (cost_item_id) REFERENCES cost_items(id) ON DELETE CASCADE"
    },
    {
      "name": "cost_item_history_pkey",
      "type": "p",
      "validated": true,
      "definition": "PRIMARY KEY (id)"
    }
  ],
  "rls_enabled": true,
  "effective_acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ]
}
```

### public.cost_items

RLS enabled: True; forced: False; owner: postgres
ACL: `["postgres=arwdDxtm/postgres", "anon=arwdDxtm/postgres", "authenticated=arwdDxtm/postgres", "service_role=arwdDxtm/postgres"]`

```json
{
  "acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ],
  "oid": "17800",
  "name": "cost_items",
  "owner": "postgres",
  "schema": "public",
  "columns": [
    {
      "acl": null,
      "name": "id",
      "type": "uuid",
      "default": "gen_random_uuid()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "category",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "subcategory",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "item_code",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "item_name",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "unit",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "cost_price",
      "type": "numeric",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "default_margin_rate",
      "type": "numeric",
      "default": "0.35",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "customer_name",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "order_name",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "include_in_customer_quote",
      "type": "boolean",
      "default": "true",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "include_in_internal_quote",
      "type": "boolean",
      "default": "true",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "include_in_order_sheet",
      "type": "boolean",
      "default": "false",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "is_material",
      "type": "boolean",
      "default": "false",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "is_labor",
      "type": "boolean",
      "default": "false",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "is_service",
      "type": "boolean",
      "default": "false",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "supplier_name",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "supplier_phone",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "supplier_memo",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "is_active",
      "type": "boolean",
      "default": "true",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "sort_order",
      "type": "integer",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "memo",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "created_at",
      "type": "timestamp with time zone",
      "default": "now()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "updated_at",
      "type": "timestamp with time zone",
      "default": "now()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "updated_by",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "draft_cost_price",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "draft_margin_rate",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "draft_is_active",
      "type": "boolean",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "draft_updated_at",
      "type": "timestamp with time zone",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "draft_updated_by",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "calculation_basis",
      "type": "text",
      "default": "'manual_input'::text",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "calculation_multiplier",
      "type": "numeric",
      "default": "1",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "min_quantity",
      "type": "numeric",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "rounding_method",
      "type": "text",
      "default": "'none'::text",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "is_pending_new",
      "type": "boolean",
      "default": "false",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "source_cost_item_id",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    }
  ],
  "indexes": [
    {
      "name": "cost_items_active_sort_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_items_active_sort_idx ON public.cost_items USING btree (is_active, sort_order, category)"
    },
    {
      "name": "cost_items_category_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_items_category_idx ON public.cost_items USING btree (category, subcategory)"
    },
    {
      "name": "cost_items_draft_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_items_draft_idx ON public.cost_items USING btree (draft_updated_at DESC) WHERE (draft_updated_at IS NOT NULL)"
    },
    {
      "name": "cost_items_item_code_key",
      "valid": true,
      "definition": "CREATE UNIQUE INDEX cost_items_item_code_key ON public.cost_items USING btree (item_code)"
    },
    {
      "name": "cost_items_pending_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_items_pending_idx ON public.cost_items USING btree (is_pending_new, draft_updated_at DESC) WHERE (is_pending_new = true)"
    },
    {
      "name": "cost_items_pkey",
      "valid": true,
      "definition": "CREATE UNIQUE INDEX cost_items_pkey ON public.cost_items USING btree (id)"
    }
  ],
  "policies": [
    {
      "cmd": "SELECT",
      "qual": "(current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text]))",
      "roles": [
        "authenticated"
      ],
      "tablename": "cost_items",
      "permissive": "PERMISSIVE",
      "policyname": "cost_items_admin_manager_select",
      "schemaname": "public",
      "with_check": null
    }
  ],
  "triggers": [
    {
      "name": "and_os_cost_items_mutation_guard",
      "enabled": "O",
      "definition": "CREATE TRIGGER and_os_cost_items_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_items FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation()",
      "function_oid": "17921",
      "called_function": "and_os_require_cost_rpc_mutation()"
    },
    {
      "name": "set_cost_items_updated_at",
      "enabled": "O",
      "definition": "CREATE TRIGGER set_cost_items_updated_at BEFORE UPDATE ON public.cost_items FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
      "function_oid": "17846",
      "called_function": "set_updated_at()"
    }
  ],
  "rls_forced": false,
  "constraints": [
    {
      "name": "cost_items_calculation_basis_check",
      "type": "c",
      "validated": true,
      "definition": "CHECK ((calculation_basis = ANY (ARRAY['fixed'::text, 'apartment_pyeong'::text, 'flooring_pyeong'::text, 'length_mm'::text, 'length_m'::text, 'area_sqm'::text, 'count'::text, 'bathroom_count'::text, 'lower_cabinet_length'::text, 'upper_cabinet_length'::text, 'homebar_length'::text, 'island_length'::text, 'partition_length'::text, 'manual_input'::text])))"
    },
    {
      "name": "cost_items_calculation_multiplier_check",
      "type": "c",
      "validated": true,
      "definition": "CHECK ((calculation_multiplier >= (0)::numeric))"
    },
    {
      "name": "cost_items_draft_updated_by_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (draft_updated_by) REFERENCES auth.users(id)"
    },
    {
      "name": "cost_items_item_code_key",
      "type": "u",
      "validated": true,
      "definition": "UNIQUE (item_code)"
    },
    {
      "name": "cost_items_min_quantity_check",
      "type": "c",
      "validated": true,
      "definition": "CHECK (((min_quantity IS NULL) OR (min_quantity >= (0)::numeric)))"
    },
    {
      "name": "cost_items_pkey",
      "type": "p",
      "validated": true,
      "definition": "PRIMARY KEY (id)"
    },
    {
      "name": "cost_items_rounding_method_check",
      "type": "c",
      "validated": true,
      "definition": "CHECK ((rounding_method = ANY (ARRAY['none'::text, 'ceil'::text, 'floor'::text, 'round'::text])))"
    },
    {
      "name": "cost_items_source_cost_item_id_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (source_cost_item_id) REFERENCES cost_items(id)"
    },
    {
      "name": "cost_items_updated_by_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (updated_by) REFERENCES auth.users(id)"
    }
  ],
  "rls_enabled": true,
  "effective_acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ]
}
```

### public.cost_publish_log

RLS enabled: True; forced: False; owner: postgres
ACL: `["postgres=arwdDxtm/postgres", "anon=arwdDxtm/postgres", "authenticated=arwdDxtm/postgres", "service_role=arwdDxtm/postgres"]`

```json
{
  "acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ],
  "oid": "17877",
  "name": "cost_publish_log",
  "owner": "postgres",
  "schema": "public",
  "columns": [
    {
      "acl": null,
      "name": "id",
      "type": "uuid",
      "default": "gen_random_uuid()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "version",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "reason",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "published_by",
      "type": "uuid",
      "default": null,
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "published_at",
      "type": "timestamp with time zone",
      "default": "now()",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "changed_item_count",
      "type": "integer",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "price_change_count",
      "type": "integer",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "margin_change_count",
      "type": "integer",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "active_change_count",
      "type": "integer",
      "default": "0",
      "identity": "",
      "nullable": false,
      "generated": ""
    },
    {
      "acl": null,
      "name": "duration_ms",
      "type": "integer",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "memo",
      "type": "text",
      "default": null,
      "identity": "",
      "nullable": true,
      "generated": ""
    },
    {
      "acl": null,
      "name": "created_at",
      "type": "timestamp with time zone",
      "default": "now()",
      "identity": "",
      "nullable": false,
      "generated": ""
    }
  ],
  "indexes": [
    {
      "name": "cost_publish_log_pkey",
      "valid": true,
      "definition": "CREATE UNIQUE INDEX cost_publish_log_pkey ON public.cost_publish_log USING btree (id)"
    },
    {
      "name": "cost_publish_log_published_idx",
      "valid": true,
      "definition": "CREATE INDEX cost_publish_log_published_idx ON public.cost_publish_log USING btree (published_at DESC)"
    },
    {
      "name": "cost_publish_log_version_key",
      "valid": true,
      "definition": "CREATE UNIQUE INDEX cost_publish_log_version_key ON public.cost_publish_log USING btree (version)"
    }
  ],
  "policies": [
    {
      "cmd": "SELECT",
      "qual": "(current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text]))",
      "roles": [
        "authenticated"
      ],
      "tablename": "cost_publish_log",
      "permissive": "PERMISSIVE",
      "policyname": "cost_publish_log_admin_manager_select",
      "schemaname": "public",
      "with_check": null
    }
  ],
  "triggers": [
    {
      "name": "and_os_cost_publish_log_mutation_guard",
      "enabled": "O",
      "definition": "CREATE TRIGGER and_os_cost_publish_log_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_publish_log FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation()",
      "function_oid": "17921",
      "called_function": "and_os_require_cost_rpc_mutation()"
    }
  ],
  "rls_forced": false,
  "constraints": [
    {
      "name": "cost_publish_log_counts_check",
      "type": "c",
      "validated": true,
      "definition": "CHECK (((changed_item_count >= 0) AND (price_change_count >= 0) AND (margin_change_count >= 0) AND (active_change_count >= 0) AND ((duration_ms IS NULL) OR (duration_ms >= 0))))"
    },
    {
      "name": "cost_publish_log_pkey",
      "type": "p",
      "validated": true,
      "definition": "PRIMARY KEY (id)"
    },
    {
      "name": "cost_publish_log_published_by_fkey",
      "type": "f",
      "validated": true,
      "definition": "FOREIGN KEY (published_by) REFERENCES auth.users(id)"
    },
    {
      "name": "cost_publish_log_version_key",
      "type": "u",
      "validated": true,
      "definition": "UNIQUE (version)"
    }
  ],
  "rls_enabled": true,
  "effective_acl": [
    "postgres=arwdDxtm/postgres",
    "anon=arwdDxtm/postgres",
    "authenticated=arwdDxtm/postgres",
    "service_role=arwdDxtm/postgres"
  ]
}
```
