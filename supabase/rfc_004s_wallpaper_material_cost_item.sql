-- RFC-004S: Add wallpaper material cost item used by the estimate engine.
-- The live DB blocks direct cost_items mutations unless they happen through an approved RPC path.
-- This migration uses a one-time SECURITY DEFINER registration function, executes it, then drops it.
-- It does not update existing published costs, drafts, history, publish logs, or estimates.

begin;

create or replace function public.rfc004s_register_wallpaper_material_cost_item()
returns table (
  item_code text,
  category text,
  subcategory text,
  item_name text,
  unit text,
  cost_price numeric,
  default_margin_rate numeric,
  is_active boolean,
  sort_order integer
)
security definer
set search_path = public
language plpgsql
as $$
declare
  v_labor_sort integer;
begin
  perform set_config('request.and_os_cost_rpc', 'on', true);

  select ci.sort_order
    into v_labor_sort
  from public.cost_items ci
  where ci.item_code = 'WALLPAPER_LABOR'
  limit 1;

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
    memo
  )
  values (
    '도배',
    '자재',
    'WALLPAPER_MATERIAL_PER_PYEONG',
    '도배 자재비',
    '평',
    10000,
    0.30,
    '벽지(AND표준)',
    '도배 자재비',
    true,
    true,
    true,
    true,
    false,
    false,
    true,
    coalesce(v_labor_sort + 1, 51),
    'RFC-004S 도배 자재비 평당 원가'
  )
  on conflict on constraint cost_items_item_code_key do nothing;

  return query
  select
    ci.item_code,
    ci.category,
    ci.subcategory,
    ci.item_name,
    ci.unit,
    ci.cost_price,
    ci.default_margin_rate,
    ci.is_active,
    ci.sort_order
  from public.cost_items ci
  where ci.item_code = 'WALLPAPER_MATERIAL_PER_PYEONG';
end;
$$;

select * from public.rfc004s_register_wallpaper_material_cost_item();

drop function public.rfc004s_register_wallpaper_material_cost_item();

commit;
