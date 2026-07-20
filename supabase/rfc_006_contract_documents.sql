-- RFC-006: 견적·계약서·공사사양서 자동연동 1단계
-- 실행 전 검토용 SQL입니다. 승인 전 Supabase에 실행하지 않습니다.

create extension if not exists pgcrypto;

create or replace function public.and_os_now()
returns timestamptz
language sql
stable
as $$
  select (timezone('Asia/Seoul', now())::timestamp at time zone 'Asia/Seoul');
$$;

create table if not exists public.estimate_document_options (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  contract_info jsonb not null default '{}'::jsonb,
  customer_info jsonb not null default '{}'::jsonb,
  contractor_info jsonb not null default '{}'::jsonb,
  site_manager jsonb not null default '{}'::jsonb,
  admin_tasks jsonb not null default '{}'::jsonb,
  protection_options jsonb not null default '{}'::jsonb,
  item_options jsonb not null default '{}'::jsonb,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint estimate_document_options_estimate_unique unique (estimate_id)
);

create table if not exists public.standard_spec_catalog (
  id uuid primary key default gen_random_uuid(),
  spec_code text not null unique,
  work_category text not null,
  item_name text not null,
  default_grade text not null,
  spec_text text not null,
  applies_to jsonb not null default '{}'::jsonb,
  version text not null default '2026.07.20-001',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint standard_spec_catalog_code_not_empty check (length(trim(spec_code)) > 0),
  constraint standard_spec_catalog_item_not_empty check (length(trim(item_name)) > 0)
);

create table if not exists public.contract_package_snapshots (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete restrict,
  estimate_revision text not null,
  package_version integer not null,
  status text not null default 'READY',
  contract_info jsonb not null,
  parties_info jsonb not null,
  site_manager jsonb not null default '{}'::jsonb,
  estimate_snapshot jsonb not null,
  document_options_snapshot jsonb not null,
  spec_snapshot jsonb not null default '[]'::jsonb,
  clause_snapshot jsonb not null default '{}'::jsonb,
  payment_schedule jsonb not null default '[]'::jsonb,
  template_version text not null,
  rule_version text not null,
  source_hash text not null,
  created_by uuid references auth.users(id),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint contract_package_version_unique unique (estimate_id, package_version),
  constraint contract_package_status_check check (
    status in ('DRAFT', 'PREVIEWED', 'READY', 'CONTRACTED', 'CHANGE_PENDING', 'SUPERSEDED', 'CANCELLED')
  ),
  constraint contract_package_hash_not_empty check (length(trim(source_hash)) > 0)
);

create table if not exists public.contract_document_versions (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.contract_package_snapshots(id) on delete restrict,
  document_type text not null,
  package_version integer not null,
  generation_status text not null default 'GENERATED',
  content_json jsonb not null,
  content_hash text not null,
  file_path text,
  file_url text,
  mime_type text,
  created_by uuid references auth.users(id),
  locked_at timestamptz,
  created_at timestamptz not null default public.and_os_now(),
  constraint contract_document_unique unique (package_id, package_version, document_type),
  constraint contract_document_type_check check (document_type in ('CONTRACT', 'QUOTE', 'SPEC')),
  constraint contract_document_status_check check (generation_status in ('GENERATED', 'FINAL', 'FAILED')),
  constraint contract_document_hash_not_empty check (length(trim(content_hash)) > 0)
);

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.contract_package_snapshots(id) on delete restrict,
  estimate_id uuid not null references public.estimates(id) on delete restrict,
  change_version integer not null,
  status text not null default 'CHANGE_PENDING',
  title text not null,
  before_snapshot jsonb not null,
  after_snapshot jsonb not null,
  amount_delta numeric not null default 0,
  schedule_impact jsonb not null default '{}'::jsonb,
  approval_snapshot jsonb,
  source_hash text not null,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint change_order_version_unique unique (package_id, change_version),
  constraint change_order_status_check check (status in ('CHANGE_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  constraint change_order_title_not_empty check (length(trim(title)) > 0),
  constraint change_order_hash_not_empty check (length(trim(source_hash)) > 0)
);

create table if not exists public.change_order_approvals (
  id uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders(id) on delete restrict,
  approval_method text not null,
  approved_by_name text,
  approved_at timestamptz not null default public.and_os_now(),
  approval_snapshot jsonb not null,
  approval_hash text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default public.and_os_now(),
  constraint change_order_approval_hash_not_empty check (length(trim(approval_hash)) > 0)
);

create index if not exists estimate_document_options_estimate_idx
on public.estimate_document_options (estimate_id);

create index if not exists standard_spec_catalog_active_idx
on public.standard_spec_catalog (is_active, sort_order, item_name);

create index if not exists contract_package_estimate_idx
on public.contract_package_snapshots (estimate_id, package_version desc);

create index if not exists contract_package_status_idx
on public.contract_package_snapshots (status, created_at desc);

create index if not exists contract_document_package_idx
on public.contract_document_versions (package_id, package_version, document_type);

create index if not exists change_orders_package_idx
on public.change_orders (package_id, change_version desc);

create index if not exists change_order_approvals_order_idx
on public.change_order_approvals (change_order_id, created_at desc);

create or replace function public.set_rfc006_updated_at()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  new.updated_at = public.and_os_now();
  return new;
end;
$$;

drop trigger if exists estimate_document_options_updated_at on public.estimate_document_options;
create trigger estimate_document_options_updated_at
before update on public.estimate_document_options
for each row execute function public.set_rfc006_updated_at();

drop trigger if exists standard_spec_catalog_updated_at on public.standard_spec_catalog;
create trigger standard_spec_catalog_updated_at
before update on public.standard_spec_catalog
for each row execute function public.set_rfc006_updated_at();

drop trigger if exists contract_package_snapshots_updated_at on public.contract_package_snapshots;
create trigger contract_package_snapshots_updated_at
before update on public.contract_package_snapshots
for each row execute function public.set_rfc006_updated_at();

drop trigger if exists change_orders_updated_at on public.change_orders;
create trigger change_orders_updated_at
before update on public.change_orders
for each row execute function public.set_rfc006_updated_at();

create or replace function public.prevent_locked_contract_package_change()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.status in ('CONTRACTED', 'SUPERSEDED', 'CANCELLED') then
    raise exception 'locked contract package cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status in ('CONTRACTED', 'SUPERSEDED', 'CANCELLED') then
    raise exception 'locked contract package cannot be updated';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists contract_package_lock_guard on public.contract_package_snapshots;
create trigger contract_package_lock_guard
before update or delete on public.contract_package_snapshots
for each row execute function public.prevent_locked_contract_package_change();

create or replace function public.prevent_locked_contract_document_change()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and (old.locked_at is not null or old.generation_status = 'FINAL') then
    raise exception 'locked contract document cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and (old.locked_at is not null or old.generation_status = 'FINAL') then
    raise exception 'locked contract document cannot be updated';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists contract_document_lock_guard on public.contract_document_versions;
create trigger contract_document_lock_guard
before update or delete on public.contract_document_versions
for each row execute function public.prevent_locked_contract_document_change();

create or replace function public.prevent_approved_change_order_mutation()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and old.status = 'APPROVED' then
    raise exception 'approved change order cannot be deleted';
  end if;
  if tg_op = 'UPDATE' and old.status = 'APPROVED' then
    raise exception 'approved change order cannot be updated';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists change_order_lock_guard on public.change_orders;
create trigger change_order_lock_guard
before update or delete on public.change_orders
for each row execute function public.prevent_approved_change_order_mutation();

create or replace function public.prevent_change_order_approval_mutation()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  raise exception 'change order approval records are immutable';
end;
$$;

drop trigger if exists change_order_approval_immutable_guard on public.change_order_approvals;
create trigger change_order_approval_immutable_guard
before update or delete on public.change_order_approvals
for each row execute function public.prevent_change_order_approval_mutation();

alter table public.estimate_document_options enable row level security;
alter table public.standard_spec_catalog enable row level security;
alter table public.contract_package_snapshots enable row level security;
alter table public.contract_document_versions enable row level security;
alter table public.change_orders enable row level security;
alter table public.change_order_approvals enable row level security;

drop policy if exists estimate_document_options_select on public.estimate_document_options;
drop policy if exists estimate_document_options_insert on public.estimate_document_options;
drop policy if exists estimate_document_options_update on public.estimate_document_options;
drop policy if exists standard_spec_catalog_select on public.standard_spec_catalog;
drop policy if exists contract_package_snapshots_select on public.contract_package_snapshots;
drop policy if exists contract_document_versions_select on public.contract_document_versions;
drop policy if exists change_orders_select on public.change_orders;
drop policy if exists change_order_approvals_select on public.change_order_approvals;

create policy estimate_document_options_select
on public.estimate_document_options
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager', 'staff'));

create policy estimate_document_options_insert
on public.estimate_document_options
for insert
to authenticated
with check (public.current_and_os_role() in ('admin', 'staff'));

create policy estimate_document_options_update
on public.estimate_document_options
for update
to authenticated
using (public.current_and_os_role() in ('admin', 'staff'))
with check (public.current_and_os_role() in ('admin', 'staff'));

create policy standard_spec_catalog_select
on public.standard_spec_catalog
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager', 'staff'));

create policy contract_package_snapshots_select
on public.contract_package_snapshots
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager', 'staff'));

create policy contract_document_versions_select
on public.contract_document_versions
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager', 'staff'));

create policy change_orders_select
on public.change_orders
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager'));

create policy change_order_approvals_select
on public.change_order_approvals
for select
to authenticated
using (public.current_and_os_role() in ('admin', 'manager'));

revoke all on table public.estimate_document_options from anon;
revoke all on table public.standard_spec_catalog from anon;
revoke all on table public.contract_package_snapshots from anon;
revoke all on table public.contract_document_versions from anon;
revoke all on table public.change_orders from anon;
revoke all on table public.change_order_approvals from anon;

grant select, insert, update on public.estimate_document_options to authenticated;
grant select on public.standard_spec_catalog to authenticated;
grant select on public.contract_package_snapshots to authenticated;
grant select on public.contract_document_versions to authenticated;
grant select on public.change_orders to authenticated;
grant select on public.change_order_approvals to authenticated;

revoke insert, update, delete on public.standard_spec_catalog from authenticated;
revoke insert, update, delete on public.contract_package_snapshots from authenticated;
revoke insert, update, delete on public.contract_document_versions from authenticated;
revoke insert, update, delete on public.change_orders from authenticated;
revoke insert, update, delete on public.change_order_approvals from authenticated;

insert into public.standard_spec_catalog (
  spec_code, work_category, item_name, default_grade, spec_text, applies_to, version, sort_order
) values
  ('KITCHEN_FAUCET', '가구', '주방수전', '라우체급', '주방수전은 라우체급 제품을 기본 사양으로 한다.', '{"keywords":["싱크수전","주방수전"]}'::jsonb, '2026.07.20-001', 10),
  ('KITCHEN_SINK', '가구', '싱크볼', '깜포르테 960급', '싱크볼은 깜포르테 960급 제품을 기본 사양으로 한다.', '{"keywords":["싱크볼"]}'::jsonb, '2026.07.20-001', 20),
  ('KITCHEN_HOOD', '가구', '주방후드', '하츠 스퀘어 아일랜드 후드급', '주방후드는 하츠 스퀘어 아일랜드 후드급 제품을 기본 사양으로 한다.', '{"keywords":["후드"]}'::jsonb, '2026.07.20-001', 30),
  ('KITCHEN_COUNTERTOP', '가구', '주방 상판', '칸스톤 또는 세라믹 선택 사양', '주방 상판은 견적 선택값에 따라 칸스톤 또는 세라믹 계열로 적용한다.', '{"keywords":["상판","칸스톤","세라믹"]}'::jsonb, '2026.07.20-001', 35),
  ('FURNITURE_DOOR', '가구', '가구도어', '도장 또는 LPM', '가구도어는 견적 기준에 따라 도장 또는 LPM을 적용한다.', '{"keywords":["도어","가구도어","문짝"]}'::jsonb, '2026.07.20-001', 40),
  ('FURNITURE_HARDWARE', '가구', '가구 하드웨어', '댐퍼경첩·언더레일·슬라이드바 기본', '가구 하드웨어는 댐퍼경첩, 언더레일, 슬라이드바를 기본 적용한다.', '{"keywords":["경첩","언더레일","서랍","하드웨어"]}'::jsonb, '2026.07.20-001', 50),
  ('BATH_FIXTURE', '욕실', '욕실 도기·수전·샤워기', '아메리칸스탠다드급', '욕실 도기, 수전, 샤워기는 아메리칸스탠다드급을 기본 사양으로 한다.', '{"keywords":["도기","수전","샤워기","욕실 기본기기"]}'::jsonb, '2026.07.20-001', 60),
  ('BATH_CABINET', '욕실', '욕실장', '기본 거울장', '욕실장은 기본 거울장을 적용한다.', '{"keywords":["욕실장","장식장","거울장"]}'::jsonb, '2026.07.20-001', 70),
  ('BATH_FAN', '욕실', '환풍기', '힘펠 일반 환풍기급', '환풍기는 힘펠 일반 환풍기급을 기본으로 하며 휴젠트는 견적 포함 시 별도 적용한다.', '{"keywords":["환풍기","휴젠트"]}'::jsonb, '2026.07.20-001', 80),
  ('BATH_DRAIN', '욕실', '유가', '아무스급', '욕실 유가는 아무스급을 기본 사양으로 한다.', '{"keywords":["유가"]}'::jsonb, '2026.07.20-001', 90),
  ('BATH_WALL_TILE', '욕실', '욕실 벽 타일', '1200x600 수입 포세린급', '욕실 벽은 1200x600 수입 포세린 타일을 기본 사양으로 한다.', '{"keywords":["욕실","타일","벽"]}'::jsonb, '2026.07.20-001', 100),
  ('BATH_FLOOR_TILE', '욕실', '욕실 바닥 타일', '600x600 수입 포세린급', '욕실 바닥은 600x600 수입 포세린 타일을 기본 사양으로 한다.', '{"keywords":["욕실","바닥","타일"]}'::jsonb, '2026.07.20-001', 110),
  ('ENTRY_TILE', '마감', '현관 타일', '600x600 포세린급', '현관은 600x600 포세린 타일을 기본 사양으로 한다.', '{"keywords":["현관","타일"]}'::jsonb, '2026.07.20-001', 120),
  ('FLOORING', '바닥', '마루', 'LX 에디톤급', '마루는 LX 에디톤급을 기본 사양으로 한다.', '{"keywords":["마루","바닥"]}'::jsonb, '2026.07.20-001', 130),
  ('FILM', '필름', '필름', '영림 182급', '필름은 영림 182급을 기본 사양으로 한다.', '{"keywords":["필름"]}'::jsonb, '2026.07.20-001', 140),
  ('SILICONE', '마감', '실리콘', '아덱스급', '실리콘은 아덱스급을 기본 사양으로 한다.', '{"keywords":["실리콘"]}'::jsonb, '2026.07.20-001', 150),
  ('SWITCH_OUTLET', '전기·조명', '스위치·콘센트', '르그랑 아펠라급', '스위치와 콘센트는 르그랑 아펠라급을 기본 사양으로 한다.', '{"keywords":["스위치","콘센트"]}'::jsonb, '2026.07.20-001', 160),
  ('DOWNLIGHT', '전기·조명', '다운라이트', '2인치 COB 플리커프리 3500~4000K', '다운라이트는 2인치 COB, 플리커프리, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["다운라이트"]}'::jsonb, '2026.07.20-001', 170),
  ('SQUARE_LIGHT', '전기·조명', '사각 매입등', '10구 COB 플리커프리 3500~4000K', '사각 매입등은 10구 COB, 플리커프리, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["사각","매입등"]}'::jsonb, '2026.07.20-001', 180),
  ('INDIRECT_LIGHT', '전기·조명', '간접조명', 'T3 LED 3500~4000K', '간접조명은 T3 LED, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["간접조명","T3"]}'::jsonb, '2026.07.20-001', 190),
  ('DOOR', '도어·창호', '방문·문틀·목재문', 'ABS 방문·필름 문틀·아무스급 목재문', '방문, 문틀, 목재문은 ABS 방문, 필름 문틀, 아무스급 목재문을 기본 사양으로 한다.', '{"keywords":["방문","문틀","목재문","일반도어"]}'::jsonb, '2026.07.20-001', 200),
  ('MIDDLE_DOOR', '도어·창호', '중문', '간살도어·슬림형 접합유리급', '중문은 견적 기준에 따라 간살도어, 슬림형 접합유리급을 기본 사양으로 한다.', '{"keywords":["중문"]}'::jsonb, '2026.07.20-001', 210),
  ('BUILT_IN_STORAGE', '가구', '붙박이장·수납장', '자체공장 맞춤 제작', '붙박이장과 수납장은 자체공장 맞춤 제작을 기본 사양으로 한다.', '{"keywords":["붙박이장","수납장","제작"]}'::jsonb, '2026.07.20-001', 220)
on conflict (spec_code) do nothing;
