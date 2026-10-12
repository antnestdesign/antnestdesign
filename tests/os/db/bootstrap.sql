-- TEST ONLY: reconstructed estimates/profiles DDL, not a production baseline.
-- Requires real local Supabase auth.uid(), auth.users and JWT infrastructure.
do $$
begin
  if to_regclass('auth.users') is null then raise exception 'LOCAL SUPABASE REQUIRED'; end if;
  if to_regclass('public.and_os_2b_test_marker') is null and
     (to_regclass('public.estimates') is not null or to_regclass('public.profiles') is not null
      or to_regclass('public.cost_items') is not null) then
    raise exception 'Refusing an unowned/nonempty database';
  end if;
end $$;

create table if not exists public.and_os_2b_test_marker (
  singleton boolean primary key check (singleton),
  project_id text not null check (project_id = 'and-os-security-test')
);
insert into public.and_os_2b_test_marker values (true, 'and-os-security-test') on conflict do nothing;
revoke all on public.and_os_2b_test_marker from public, anon, authenticated, service_role;

-- Column types reconstructed from storage/API usage. No source estimates DDL exists.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, email text unique,
  role text not null check (role in ('admin', 'manager', 'staff')),
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_name text not null, client_name text, phone text, address text,
  area_pyeong numeric, total_price numeric, cost_total numeric, margin_rate numeric,
  estimate_data jsonb not null default '{}'::jsonb, status text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
