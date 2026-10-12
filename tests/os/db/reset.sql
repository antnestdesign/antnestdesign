-- Dedicated owned Test DB only; remove synthetic fixtures, never arbitrary data.
select set_config('request.and_os_cost_rpc', 'on', true);
delete from public.cost_item_history where cost_item_id = '40000000-0000-4000-8000-000000000002';
delete from public.cost_publish_log where reason = 'SYSTEM_DB_2B_PERMISSION_TEST';
delete from public.cost_items where item_code = 'SYSTEM_DB_2B_COST';
delete from public.estimates where id in (
  '10000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000012',
  '10000000-0000-4000-8000-000000000013'
);
