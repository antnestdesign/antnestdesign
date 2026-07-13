create extension if not exists pgcrypto;

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  subcategory text,
  item_code text not null unique,
  item_name text not null,
  unit text not null,
  cost_price numeric not null default 0,
  default_margin_rate numeric not null default 0.35,
  customer_name text,
  order_name text,
  include_in_customer_quote boolean not null default true,
  include_in_internal_quote boolean not null default true,
  include_in_order_sheet boolean not null default false,
  is_material boolean not null default false,
  is_labor boolean not null default false,
  is_service boolean not null default false,
  supplier_name text,
  supplier_phone text,
  supplier_memo text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.cost_item_history (
  id uuid primary key default gen_random_uuid(),
  cost_item_id uuid not null references public.cost_items(id) on delete cascade,
  old_cost_price numeric,
  new_cost_price numeric,
  old_margin_rate numeric,
  new_margin_rate numeric,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now(),
  reason text
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_cost_items_updated_at on public.cost_items;
create trigger set_cost_items_updated_at
before update on public.cost_items
for each row execute function public.set_updated_at();

create index if not exists cost_items_active_sort_idx on public.cost_items (is_active, sort_order, category);
create index if not exists cost_items_category_idx on public.cost_items (category, subcategory);
create index if not exists cost_item_history_item_idx on public.cost_item_history (cost_item_id, changed_at desc);

create or replace function public.current_and_os_role()
returns text
security definer
set search_path = public
language sql
stable
as $$
  select coalesce((select lower(role) from public.profiles where id = auth.uid() limit 1), 'staff');
$$;

create or replace function public.is_and_os_admin()
returns boolean
security definer
set search_path = public
language sql
stable
as $$
  select public.current_and_os_role() = 'admin';
$$;

alter table public.cost_items enable row level security;
alter table public.cost_item_history enable row level security;

drop policy if exists "cost_items_admin_select" on public.cost_items;
drop policy if exists "cost_items_admin_insert" on public.cost_items;
drop policy if exists "cost_items_admin_update" on public.cost_items;
drop policy if exists "cost_items_admin_delete" on public.cost_items;
drop policy if exists "cost_item_history_admin_select" on public.cost_item_history;
drop policy if exists "cost_item_history_admin_insert" on public.cost_item_history;
drop policy if exists "cost_item_history_admin_update" on public.cost_item_history;
drop policy if exists "cost_item_history_admin_delete" on public.cost_item_history;

create policy "cost_items_admin_select"
on public.cost_items for select to authenticated
using (public.is_and_os_admin());

create policy "cost_items_admin_insert"
on public.cost_items for insert to authenticated
with check (public.is_and_os_admin());

create policy "cost_items_admin_update"
on public.cost_items for update to authenticated
using (public.is_and_os_admin())
with check (public.is_and_os_admin());

create policy "cost_items_admin_delete"
on public.cost_items for delete to authenticated
using (public.is_and_os_admin());

create policy "cost_item_history_admin_select"
on public.cost_item_history for select to authenticated
using (public.is_and_os_admin());

create policy "cost_item_history_admin_insert"
on public.cost_item_history for insert to authenticated
with check (public.is_and_os_admin());

insert into public.cost_items (
  item_code, category, subcategory, item_name, unit, cost_price, default_margin_rate,
  include_in_customer_quote, include_in_internal_quote, include_in_order_sheet,
  is_material, is_labor, is_service, sort_order
) values
  ('CABINET_LOWER', '가구', '상하부장', '하부장 자당', '자', 120000, 0.35, true, true, true, true, false, false, 1),
  ('CABINET_UPPER', '가구', '상하부장', '상부장 자당', '자', 90000, 0.35, true, true, true, true, false, false, 2),
  ('CABINET_ISLAND', '가구', '아일랜드', '아일랜드 자당', '자', 180000, 0.35, true, true, true, true, false, false, 3),
  ('CABINET_HOMEBAR_BUILD', '가구', '홈바장', '홈바장 자당', '자', 210000, 0.35, true, true, true, true, false, false, 4),
  ('CABINET_TALL', '가구', '키큰장', '키큰장 자당', '자', 130000, 0.35, true, true, true, true, false, false, 5),
  ('CABINET_FRIDGE_LAUNDRY', '가구', '냉장고장', '냉장고 및 세탁기장 자당', '자', 90000, 0.35, true, true, true, true, false, false, 6),
  ('CABINET_SHOE', '가구', '신발장', '신발장 자당', '자', 80000, 0.35, true, true, true, true, false, false, 7),
  ('CABINET_PANTRY', '가구', '팬트리장', '팬트리장 자당', '자', 65000, 0.35, true, true, true, true, false, false, 8),
  ('CABINET_PANTRY_DRAWER', '가구', '팬트리장', '팬트리장 하부서랍장 1개', '개', 270000, 0.35, true, true, true, true, false, false, 9),
  ('CABINET_BUILT_IN_WARDROBE', '가구', '옷장', '옷장(붙박이장) 자당', '자', 160000, 0.35, true, true, true, true, false, false, 10),
  ('CABINET_HANGER_WARDROBE', '가구', '옷장', '옷장(헹거장) 자당', '자', 90000, 0.35, true, true, true, true, false, false, 11),
  ('CABINET_RICE', '가구', '옵션', '밥솥장 1통', '통', 560000, 0.35, true, true, true, true, false, false, 12),
  ('CABINET_EP_SHALLOW', '가구', 'EP', 'EP 400mm 이하', '개', 90000, 0.35, true, true, true, true, false, false, 13),
  ('CABINET_EP_DEEP', '가구', 'EP', 'EP 400mm 초과', '개', 130000, 0.35, true, true, true, true, false, false, 14),
  ('CABINET_DRAWER', '가구', '옵션', '서랍 1개', '개', 60000, 0.35, true, true, true, true, false, false, 15),
  ('ELEC_BACHMANN_OUTLET', '가구', '주방설비', '바흐만 2구 콘센트', '개', 160000, 0.35, true, true, true, true, false, false, 16),
  ('LIGHT_LINE_CABINET', '가구', '조명', '라인조명 1통', '통', 240000, 0.35, true, true, true, true, false, false, 17),
  ('LIGHT_T3_CABINET', '가구', '조명', '간접조명(T3) 1라인', '라인', 50000, 0.35, true, true, true, true, false, false, 18),
  ('ELEC_DOWNLIGHT', '전기', '조명', '다운라이트 1개', '개', 10000, 0.35, true, true, true, true, false, false, 19),
  ('ELEC_SQUARE_LIGHT', '전기', '조명', '사각매입등 1개', '개', 35000, 0.35, true, true, true, true, false, false, 20),
  ('ELEC_CYLINDER_LIGHT', '전기', '조명', '실린더등 1개', '개', 30000, 0.35, true, true, true, true, false, false, 21),
  ('ELEC_T3_PER_M', '전기', '조명', '간접조명(T3) 1m', 'm', 10000, 0.35, true, true, true, true, false, false, 22),
  ('ELEC_BED_WALL_LIGHT', '전기', '조명', '침대 벽등', '식', 200000, 0.35, true, true, true, true, false, false, 23),
  ('COUNTER_HIMACS_PER_M', '상판', '하이막스', '하이막스 1,000mm', 'm', 220000, 0.35, true, true, true, true, false, false, 24),
  ('COUNTER_KHANSTONE_SLAB', '상판', '칸스톤', '칸스톤 12T 1장', '장', 1500000, 0.35, true, true, true, true, false, false, 25),
  ('COUNTER_KHANSTONE_FACTORY', '상판', '칸스톤', '칸스톤 공장가공비', '식', 700000, 0.35, true, true, true, false, false, true, 26),
  ('COUNTER_KHANSTONE_INSTALL', '상판', '칸스톤', '칸스톤 현장시공비', '식', 900000, 0.35, true, true, false, false, true, false, 27),
  ('COUNTER_CERAMIC_SLAB', '상판', '세라믹', '세라믹 1장', '장', 1500000, 0.35, true, true, true, true, false, false, 28),
  ('COUNTER_CERAMIC_FACTORY', '상판', '세라믹', '세라믹 공장가공비', '식', 700000, 0.35, true, true, true, false, false, true, 29),
  ('COUNTER_CERAMIC_INSTALL', '상판', '세라믹', '세라믹 현장시공비', '식', 900000, 0.35, true, true, false, false, true, false, 30),
  ('COUNTER_EP_PANEL_PER_M', '상판', 'EP', 'EP 상판/미드웨이 1,000mm', 'm', 130000, 0.35, true, true, true, true, false, false, 31),
  ('DEMO_FLOOR_WOOD', '철거', '바닥', '마루철거 평당', '평', 30000, 0.35, true, true, false, false, true, false, 32),
  ('DEMO_FLOOR_DECOTILE', '철거', '바닥', '데코타일 철거 평당', '평', 15000, 0.35, true, true, false, false, true, false, 33),
  ('DEMO_CABINET_PER_JA', '철거', '가구', '가구철거 자당', '자', 25000, 0.35, true, true, false, false, true, false, 34),
  ('DEMO_BATHROOM_WATERPROOF', '철거', '욕실', '화장실 철거 및 방수', '칸', 800000, 0.35, true, true, false, false, true, false, 35),
  ('DEMO_CEILING_PER_PYEONG', '철거', '천장', '천장철거 평당', '평', 160000, 0.35, true, true, false, false, true, false, 36),
  ('DEMO_ELEVATOR_PROTECT', '철거', '보양', 'E/V 보양', '식', 150000, 0.35, true, true, false, false, false, true, 37),
  ('DEMO_ELEVATOR_PROTECT_REMOVAL', '철거', '보양', 'E/V 보양 철거', '식', 50000, 0.35, true, true, false, false, false, true, 38),
  ('PERMIT_CONSTRUCTION', '인허가', '행위허가', '행위허가', '식', 200000, 0.35, true, true, false, false, false, true, 39),
  ('PERMIT_CONSENT', '인허가', '동의서', '동의서', '식', 150000, 0.35, true, true, false, false, false, true, 40),
  ('ELEC_LABOR_WORKER', '전기', '인건비', '전기 기공 1품', '품', 300000, 0.35, true, true, false, false, true, false, 41),
  ('ELEC_LABOR_HELPER', '전기', '인건비', '전기 조공 1품', '품', 250000, 0.35, true, true, false, false, true, false, 42),
  ('ELEC_DAYS_UNDER10', '전기', '품수', '준공 10년 이하 품수', '품', 6, 0.35, false, true, false, false, false, true, 43),
  ('ELEC_DAYS_OVER10', '전기', '품수', '준공 10년 이상 품수', '품', 8, 0.35, false, true, false, false, false, true, 44),
  ('ELEC_WIRING', '전기', '자재', '전기 배선비', '식', 600000, 0.35, true, true, true, true, false, false, 45),
  ('ELEC_STANDARD_SWITCH', '전기', '기구', 'AND 표준 콘센트 스위치', '식', 400000, 0.35, true, true, true, true, false, false, 46),
  ('TILE_LABOR_WORKER', '욕실', '타일', '타일 기공 1품', '품', 350000, 0.35, true, true, false, false, true, false, 47),
  ('TILE_LABOR_HELPER', '욕실', '타일', '타일 조공 1품', '품', 280000, 0.35, true, true, false, false, true, false, 48),
  ('TILE_GROUT', '욕실', '타일', '타일 메지', '식', 350000, 0.35, true, true, false, false, false, true, 49),
  ('WALLPAPER_LABOR', '도배', '인건비', '도배 1품', '품', 300000, 0.35, true, true, false, false, true, false, 50),
  ('FILM_LABOR', '필름', '인건비', '필름 1품', '품', 280000, 0.35, true, true, false, false, true, false, 51),
  ('FLOORING_WOOD_PER_PYEONG', '바닥', '마루', '바닥(마루) 평단가', '평', 180000, 0.35, true, true, true, true, false, false, 52),
  ('FINISH_SILICONE', '마감', '실리콘', '실리콘 기본', '식', 350000, 0.35, true, true, false, false, false, true, 53),
  ('FINISH_ELASTIC_BASE', '마감', '탄성', '탄성 기본', '식', 650000, 0.35, true, true, false, false, false, true, 54),
  ('FINISH_ELASTIC_EXTRA_ROOM', '마감', '탄성', '탄성 추가 1개소', '개소', 250000, 0.35, true, true, false, false, false, true, 55),
  ('WOOD_LABOR_WORKER', '목공', '인건비', '목공 1품', '품', 300000, 0.35, true, true, false, false, true, false, 56),
  ('WOOD_MACHINE_DAY', '목공', '장비', '목공 기계품 1품', '품', 150000, 0.35, true, true, false, false, false, true, 57),
  ('WOOD_LIFTING', '목공', '양중', '목공 양중', '식', 200000, 0.35, true, true, false, false, false, true, 58),
  ('WOOD_SUBSIDIARY', '목공', '부자재', '목공 부자재', '식', 150000, 0.35, true, true, true, true, false, false, 59),
  ('WOOD_CEILING_FAN', '목공', '천장', '실링팬 1개소', '개소', 500000, 0.35, true, true, true, true, false, false, 60),
  ('WOOD_DRYWALL_SHEET', '목공', '자재', '석고보드 1장', '장', 4500, 0.35, false, true, true, true, false, false, 61),
  ('WOOD_MDF_SHEET', '목공', '자재', 'MDF 1장', '장', 12500, 0.35, false, true, true, true, false, false, 62),
  ('WOOD_PLYWOOD_SHEET', '목공', '자재', '합판 1장', '장', 30000, 0.35, false, true, true, true, false, false, 63),
  ('WOOD_STUD_BUNDLE', '목공', '자재', '다루끼 1묶음', '묶음', 22000, 0.35, false, true, true, true, false, false, 64)
on conflict (item_code) do update set
  category = excluded.category,
  subcategory = excluded.subcategory,
  item_name = excluded.item_name,
  unit = excluded.unit,
  include_in_customer_quote = excluded.include_in_customer_quote,
  include_in_internal_quote = excluded.include_in_internal_quote,
  include_in_order_sheet = excluded.include_in_order_sheet,
  is_material = excluded.is_material,
  is_labor = excluded.is_labor,
  is_service = excluded.is_service,
  is_active = true,
  sort_order = excluded.sort_order;
