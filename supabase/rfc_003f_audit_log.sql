-- RFC-003F AND OS audit log
-- Records who performed important OS operations without storing secrets.

create extension if not exists pgcrypto;

create table if not exists public.os_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('Asia/Seoul', now()),
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  actor_role text,
  action text not null,
  target_type text,
  target_id text,
  target_label text,
  before_data jsonb,
  after_data jsonb,
  result text not null default 'SUCCESS',
  reason text,
  constraint os_audit_logs_action_not_empty check (length(trim(action)) > 0),
  constraint os_audit_logs_result_not_empty check (length(trim(result)) > 0)
);

create index if not exists os_audit_logs_created_idx
on public.os_audit_logs (created_at desc);

create index if not exists os_audit_logs_action_idx
on public.os_audit_logs (action, created_at desc);

create index if not exists os_audit_logs_actor_idx
on public.os_audit_logs (actor_user_id, created_at desc);

alter table public.os_audit_logs enable row level security;

drop policy if exists "os_audit_logs_authenticated_select" on public.os_audit_logs;
drop policy if exists "os_audit_logs_authenticated_insert" on public.os_audit_logs;
drop policy if exists "os_audit_logs_authenticated_update" on public.os_audit_logs;
drop policy if exists "os_audit_logs_authenticated_delete" on public.os_audit_logs;

revoke all on table public.os_audit_logs from anon;
revoke all on table public.os_audit_logs from authenticated;

grant select, insert on table public.os_audit_logs to service_role;
