begin;

alter table public.profiles
  add column if not exists is_active boolean,
  add column if not exists must_change_password boolean,
  add column if not exists updated_at timestamptz;

alter table public.profiles
  alter column is_active set default true,
  alter column must_change_password set default false,
  alter column updated_at set default now();

update public.profiles
set
  is_active = coalesce(is_active, true),
  must_change_password = coalesce(must_change_password, false),
  updated_at = coalesce(updated_at, now());

alter table public.profiles
  alter column is_active set not null,
  alter column must_change_password set not null,
  alter column updated_at set not null;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role = any (array['admin'::text, 'manager'::text, 'staff'::text]));

create unique index if not exists profiles_email_lower_unique
on public.profiles (lower(email))
where email is not null;

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_email on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

revoke insert, update, delete on public.profiles from anon;
revoke insert, update, delete on public.profiles from authenticated;

grant select on public.profiles to authenticated;

commit;
