-- RFC-006: 견적·계약서·공사사양서 자동연동 1단계 보안 보완 SQL
-- 실행 전 검토용입니다. 승인 전 Supabase에 실행하지 않습니다.

create extension if not exists pgcrypto;

create or replace function public.and_os_now()
returns timestamptz
stable
set search_path = public
language sql
as $$
  select (timezone('Asia/Seoul', now())::timestamp at time zone 'Asia/Seoul');
$$;

create table if not exists public.estimate_document_options (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete restrict,
  contract_no text,
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
  constraint estimate_document_options_estimate_unique unique (estimate_id),
  constraint estimate_document_options_contract_no_format check (
    contract_no is null or contract_no ~ '^[A-Za-z0-9가-힣._-]{1,50}$'
  )
);

alter table public.estimate_document_options
  add column if not exists contract_no text;

create table if not exists public.standard_spec_catalog (
  id uuid primary key default gen_random_uuid(),
  spec_code text not null,
  version text not null default '2026.07.20-001',
  effective_from date not null default current_date,
  effective_to date,
  work_category text not null,
  item_name text not null,
  default_grade text not null,
  spec_text text not null,
  applies_to jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint standard_spec_catalog_code_version_unique unique (spec_code, version),
  constraint standard_spec_catalog_code_not_empty check (length(trim(spec_code)) > 0),
  constraint standard_spec_catalog_item_not_empty check (length(trim(item_name)) > 0),
  constraint standard_spec_catalog_effective_order check (effective_to is null or effective_to >= effective_from)
);

alter table public.standard_spec_catalog
  add column if not exists effective_from date not null default current_date,
  add column if not exists effective_to date;

create table if not exists public.contract_package_snapshots (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete restrict,
  estimate_revision text not null,
  package_version integer not null,
  contract_no text not null,
  parent_package_id uuid references public.contract_package_snapshots(id) on delete restrict,
  originating_change_order_id uuid,
  status text not null default 'DRAFT',
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
  package_manifest_hash text,
  original_contract_amount numeric,
  prior_approved_change_total numeric not null default 0,
  amount_delta numeric not null default 0,
  revised_contract_amount numeric,
  created_by uuid references auth.users(id),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint contract_package_version_unique unique (estimate_id, package_version),
  constraint contract_package_status_check check (
    status in ('DRAFT', 'PREVIEWED', 'READY', 'CONTRACTED', 'CHANGE_PENDING', 'SUPERSEDED', 'CANCELLED')
  ),
  constraint contract_package_contract_no_format check (contract_no ~ '^[A-Za-z0-9가-힣._-]{1,50}$'),
  constraint contract_package_hash_not_empty check (length(trim(source_hash)) > 0),
  constraint contract_package_manifest_hash_not_empty check (
    package_manifest_hash is null or length(trim(package_manifest_hash)) > 0
  ),
  constraint contract_package_amount_check check (
    revised_contract_amount is null
    or revised_contract_amount = coalesce(original_contract_amount, 0) + prior_approved_change_total + amount_delta
  )
);

alter table public.contract_package_snapshots
  add column if not exists contract_no text,
  add column if not exists parent_package_id uuid references public.contract_package_snapshots(id) on delete restrict,
  add column if not exists originating_change_order_id uuid,
  add column if not exists package_manifest_hash text,
  add column if not exists original_contract_amount numeric,
  add column if not exists prior_approved_change_total numeric not null default 0,
  add column if not exists amount_delta numeric not null default 0,
  add column if not exists revised_contract_amount numeric;

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
  constraint contract_document_content_object_check check (
    jsonb_typeof(content_json) = 'object' and content_json <> '{}'::jsonb
  ),
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
  pending_package_id uuid references public.contract_package_snapshots(id) on delete restrict,
  amount_delta numeric not null default 0,
  schedule_impact jsonb not null default '{}'::jsonb,
  approval_snapshot jsonb,
  package_manifest_hash text,
  source_hash text not null,
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default public.and_os_now(),
  updated_at timestamptz not null default public.and_os_now(),
  constraint change_order_version_unique unique (package_id, change_version),
  constraint change_order_status_check check (status in ('CHANGE_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  constraint change_order_title_not_empty check (length(trim(title)) > 0),
  constraint change_order_hash_not_empty check (length(trim(source_hash)) > 0),
  constraint change_order_manifest_hash_not_empty check (
    package_manifest_hash is null or length(trim(package_manifest_hash)) > 0
  )
);

alter table public.change_orders
  add column if not exists pending_package_id uuid references public.contract_package_snapshots(id) on delete restrict,
  add column if not exists package_manifest_hash text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contract_package_originating_change_order_fk'
      and conrelid = 'public.contract_package_snapshots'::regclass
  ) then
    alter table public.contract_package_snapshots
      add constraint contract_package_originating_change_order_fk
      foreign key (originating_change_order_id)
      references public.change_orders(id)
      on delete restrict;
  end if;
end;
$$;

create table if not exists public.change_order_approvals (
  id uuid primary key default gen_random_uuid(),
  change_order_id uuid not null references public.change_orders(id) on delete restrict,
  customer_name text not null,
  approval_method text not null,
  evidence_file_id text,
  evidence_url text,
  approved_document_hash text not null,
  approved_package_version integer not null,
  customer_signed_at date not null,
  original_contract_amount numeric not null,
  prior_approved_change_total numeric not null default 0,
  amount_delta numeric not null,
  revised_contract_amount numeric not null,
  approval_snapshot jsonb not null,
  approval_hash text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default public.and_os_now(),
  constraint change_order_approval_customer_name_not_empty check (length(trim(customer_name)) > 0),
  constraint change_order_approval_method_not_empty check (length(trim(approval_method)) > 0),
  constraint change_order_approval_evidence_required check (
    evidence_file_id is not null or evidence_url is not null
  ),
  constraint change_order_approval_hash_not_empty check (length(trim(approval_hash)) > 0),
  constraint change_order_approval_document_hash_not_empty check (length(trim(approved_document_hash)) > 0),
  constraint change_order_approval_amount_check check (
    revised_contract_amount = original_contract_amount + prior_approved_change_total + amount_delta
  )
);

create index if not exists estimate_document_options_estimate_idx
on public.estimate_document_options (estimate_id);

create unique index if not exists estimate_document_options_contract_no_unique
on public.estimate_document_options (contract_no)
where contract_no is not null;

create index if not exists standard_spec_catalog_active_idx
on public.standard_spec_catalog (is_active, sort_order, item_name);

create unique index if not exists standard_spec_catalog_one_active_idx
on public.standard_spec_catalog (spec_code)
where is_active;

create index if not exists contract_package_estimate_idx
on public.contract_package_snapshots (estimate_id, package_version desc);

create index if not exists contract_package_status_idx
on public.contract_package_snapshots (status, created_at desc);

create index if not exists contract_package_contract_no_idx
on public.contract_package_snapshots (contract_no, estimate_id);

create unique index if not exists contract_package_active_source_unique
on public.contract_package_snapshots (estimate_id, source_hash, template_version, rule_version)
where status in ('DRAFT', 'PREVIEWED', 'READY', 'CONTRACTED', 'CHANGE_PENDING');

create index if not exists contract_package_parent_idx
on public.contract_package_snapshots (parent_package_id, package_version desc);

create index if not exists contract_document_package_idx
on public.contract_document_versions (package_id, package_version, document_type);

create index if not exists change_orders_package_idx
on public.change_orders (package_id, change_version desc);

create unique index if not exists change_orders_pending_one_idx
on public.change_orders (package_id)
where status = 'CHANGE_PENDING';

create unique index if not exists change_orders_pending_package_unique
on public.change_orders (pending_package_id)
where pending_package_id is not null;

create index if not exists change_order_approvals_order_idx
on public.change_order_approvals (change_order_id, created_at desc);

create unique index if not exists change_order_approvals_order_unique
on public.change_order_approvals (change_order_id);

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

create or replace function public.prevent_contract_no_cross_estimate()
returns trigger
set search_path = public
language plpgsql
as $$
begin
  if new.contract_no is null then
    return new;
  end if;
  if exists (
    select 1
    from public.contract_package_snapshots p
    where p.contract_no = new.contract_no
      and p.estimate_id <> new.estimate_id
      and (tg_table_name <> 'contract_package_snapshots' or p.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid))
  ) then
    raise exception 'contract number is already used by another estimate';
  end if;
  if exists (
    select 1
    from public.estimate_document_options o
    where o.contract_no = new.contract_no
      and o.estimate_id <> new.estimate_id
      and (tg_table_name <> 'estimate_document_options' or o.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid))
  ) then
    raise exception 'contract number is already used by another estimate';
  end if;
  return new;
end;
$$;

drop trigger if exists estimate_document_options_contract_no_guard on public.estimate_document_options;
create trigger estimate_document_options_contract_no_guard
before insert or update on public.estimate_document_options
for each row execute function public.prevent_contract_no_cross_estimate();

drop trigger if exists contract_package_contract_no_guard on public.contract_package_snapshots;
create trigger contract_package_contract_no_guard
before insert or update on public.contract_package_snapshots
for each row execute function public.prevent_contract_no_cross_estimate();

create or replace function public.enforce_contract_package_state_transition()
returns trigger
set search_path = public
language plpgsql
as $$
declare
  protected_changed boolean;
begin
  if tg_op = 'DELETE' then
    if old.status in ('CONTRACTED', 'SUPERSEDED', 'CANCELLED') then
      raise exception 'locked contract package cannot be deleted';
    end if;
    return old;
  end if;

  protected_changed :=
    old.estimate_id is distinct from new.estimate_id or
    old.estimate_revision is distinct from new.estimate_revision or
    old.package_version is distinct from new.package_version or
    old.contract_no is distinct from new.contract_no or
    old.contract_info is distinct from new.contract_info or
    old.parties_info is distinct from new.parties_info or
    old.site_manager is distinct from new.site_manager or
    old.estimate_snapshot is distinct from new.estimate_snapshot or
    old.document_options_snapshot is distinct from new.document_options_snapshot or
    old.spec_snapshot is distinct from new.spec_snapshot or
    old.clause_snapshot is distinct from new.clause_snapshot or
    old.payment_schedule is distinct from new.payment_schedule or
    old.template_version is distinct from new.template_version or
    old.rule_version is distinct from new.rule_version or
    old.source_hash is distinct from new.source_hash;

  if old.status in ('SUPERSEDED', 'CANCELLED') then
    raise exception 'closed contract package cannot be updated';
  end if;

  if old.status = 'CONTRACTED' and protected_changed then
    raise exception 'contracted package snapshot cannot be changed';
  end if;

  if old.status = new.status then
    if old.status = 'CONTRACTED' and protected_changed then
      raise exception 'contracted package snapshot cannot be changed';
    end if;
    return new;
  end if;

  if not (
    (old.status = 'DRAFT' and new.status = 'PREVIEWED') or
    (old.status = 'PREVIEWED' and new.status in ('DRAFT', 'READY')) or
    (old.status = 'READY' and new.status in ('DRAFT', 'CONTRACTED')) or
    (old.status = 'CONTRACTED' and new.status in ('CHANGE_PENDING', 'CANCELLED')) or
    (old.status = 'CHANGE_PENDING' and new.status in ('CONTRACTED', 'SUPERSEDED', 'CANCELLED'))
  ) then
    raise exception 'invalid contract package status transition: % -> %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists contract_package_state_guard on public.contract_package_snapshots;
create trigger contract_package_state_guard
before update or delete on public.contract_package_snapshots
for each row execute function public.enforce_contract_package_state_transition();

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

revoke all on table public.estimate_document_options from anon, authenticated;
revoke all on table public.standard_spec_catalog from anon, authenticated;
revoke all on table public.contract_package_snapshots from anon, authenticated;
revoke all on table public.contract_document_versions from anon, authenticated;
revoke all on table public.change_orders from anon, authenticated;
revoke all on table public.change_order_approvals from anon, authenticated;

grant select on public.standard_spec_catalog to authenticated;

grant select, insert, update on table public.estimate_document_options to service_role;
grant select on table public.standard_spec_catalog to service_role;
grant select on table public.contract_package_snapshots to service_role;
grant select on table public.contract_document_versions to service_role;
grant select on table public.change_orders to service_role;
grant select on table public.change_order_approvals to service_role;

create or replace function public.create_contract_package_snapshot(
  p_actor_user_id uuid,
  p_payload jsonb
)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_role text;
  v_estimate_id uuid;
  v_contract_no text;
  v_package_id uuid;
  v_package_version integer;
  v_doc_count integer;
  v_manifest_hash text;
  v_result jsonb;
begin
  select lower(role) into v_role
  from public.profiles
  where id = p_actor_user_id and is_active = true;

  if v_role not in ('admin', 'staff') then
    raise exception 'contract package creation is not allowed';
  end if;

  v_estimate_id := (p_payload->>'estimate_id')::uuid;
  v_contract_no := nullif(trim(p_payload->>'contract_no'), '');
  if v_contract_no is null or v_contract_no !~ '^[A-Za-z0-9가-힣._-]{1,50}$' then
    raise exception 'valid contract number is required';
  end if;

  if not exists (select 1 from public.estimates where id = v_estimate_id) then
    raise exception 'estimate not found';
  end if;

  if exists (
    select 1 from public.contract_package_snapshots
    where contract_no = v_contract_no and estimate_id <> v_estimate_id
  ) or exists (
    select 1 from public.estimate_document_options
    where contract_no = v_contract_no and estimate_id <> v_estimate_id
  ) then
    raise exception 'contract number is already used by another estimate';
  end if;

  perform pg_advisory_xact_lock(hashtext('contract-package:' || v_estimate_id::text));

  if exists (
    select 1
    from public.contract_package_snapshots
    where estimate_id = v_estimate_id
      and source_hash = p_payload->>'source_hash'
      and template_version = p_payload->>'template_version'
      and rule_version = p_payload->>'rule_version'
      and status in ('DRAFT', 'PREVIEWED', 'READY', 'CONTRACTED', 'CHANGE_PENDING')
  ) then
    raise exception 'same contract package already exists';
  end if;

  select coalesce(max(package_version), 0) + 1
  into v_package_version
  from public.contract_package_snapshots
  where estimate_id = v_estimate_id;

  insert into public.contract_package_snapshots (
    estimate_id,
    estimate_revision,
    package_version,
    contract_no,
    parent_package_id,
    originating_change_order_id,
    status,
    contract_info,
    parties_info,
    site_manager,
    estimate_snapshot,
    document_options_snapshot,
    spec_snapshot,
    clause_snapshot,
    payment_schedule,
    template_version,
    rule_version,
    source_hash,
    original_contract_amount,
    prior_approved_change_total,
    amount_delta,
    revised_contract_amount,
    created_by
  ) values (
    v_estimate_id,
    p_payload->>'estimate_revision',
    v_package_version,
    v_contract_no,
    nullif(p_payload->>'parent_package_id', '')::uuid,
    nullif(p_payload->>'originating_change_order_id', '')::uuid,
    'DRAFT',
    p_payload->'contract_info',
    p_payload->'parties_info',
    coalesce(p_payload->'site_manager', '{}'::jsonb),
    p_payload->'estimate_snapshot',
    p_payload->'document_options_snapshot',
    coalesce(p_payload->'spec_snapshot', '[]'::jsonb),
    coalesce(p_payload->'clause_snapshot', '{}'::jsonb),
    coalesce(p_payload->'payment_schedule', '[]'::jsonb),
    p_payload->>'template_version',
    p_payload->>'rule_version',
    p_payload->>'source_hash',
    nullif(p_payload->>'original_contract_amount', '')::numeric,
    coalesce(nullif(p_payload->>'prior_approved_change_total', '')::numeric, 0),
    coalesce(nullif(p_payload->>'amount_delta', '')::numeric, 0),
    nullif(p_payload->>'revised_contract_amount', '')::numeric,
    p_actor_user_id
  )
  returning id into v_package_id;

  insert into public.contract_document_versions (
    package_id,
    document_type,
    package_version,
    generation_status,
    content_json,
    content_hash,
    file_path,
    file_url,
    mime_type,
    created_by
  )
  select
    v_package_id,
    doc->>'document_type',
    v_package_version,
    'GENERATED',
    doc->'content_json',
    doc->>'content_hash',
    nullif(doc->>'file_path', ''),
    nullif(doc->>'file_url', ''),
    nullif(doc->>'mime_type', ''),
    p_actor_user_id
  from jsonb_array_elements(coalesce(p_payload->'documents', '[]'::jsonb)) doc
  where doc->>'document_type' in ('CONTRACT', 'QUOTE', 'SPEC')
    and length(coalesce(doc->>'content_hash', '')) > 0
    and jsonb_typeof(doc->'content_json') = 'object'
    and doc->'content_json' <> '{}'::jsonb;

  select count(distinct document_type)
  into v_doc_count
  from public.contract_document_versions
  where package_id = v_package_id
    and package_version = v_package_version
    and generation_status = 'GENERATED'
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  if v_doc_count <> 3 then
    raise exception 'all three contract documents must be generated';
  end if;

  select encode(
    digest(string_agg(document_type || ':' || content_hash, '|' order by document_type), 'sha256'),
    'hex'
  )
  into v_manifest_hash
  from public.contract_document_versions
  where package_id = v_package_id
    and package_version = v_package_version
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  update public.contract_package_snapshots
  set status = 'PREVIEWED'
  where id = v_package_id;

  update public.contract_package_snapshots
  set status = 'READY',
      package_manifest_hash = v_manifest_hash
  where id = v_package_id;

  select to_jsonb(p.*) || jsonb_build_object(
    'contract_document_versions',
    coalesce((
      select jsonb_agg(to_jsonb(d) order by d.document_type)
      from public.contract_document_versions d
      where d.package_id = p.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.contract_package_snapshots p
  where p.id = v_package_id;

  return v_result;
end;
$$;

create or replace function public.confirm_contract_package_snapshot(
  p_package_id uuid,
  p_actor_user_id uuid
)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_role text;
  v_package public.contract_package_snapshots%rowtype;
  v_doc_count integer;
  v_now timestamptz := public.and_os_now();
  v_result jsonb;
begin
  select lower(role) into v_role
  from public.profiles
  where id = p_actor_user_id and is_active = true;

  if v_role <> 'admin' then
    raise exception 'contract confirmation is allowed only for admin';
  end if;

  select *
  into v_package
  from public.contract_package_snapshots
  where id = p_package_id
  for update;

  if not found then
    raise exception 'contract package not found';
  end if;

  if v_package.status <> 'READY' then
    raise exception 'only READY contract package can be confirmed';
  end if;

  select count(distinct document_type)
  into v_doc_count
  from public.contract_document_versions
  where package_id = p_package_id
    and package_version = v_package.package_version
    and generation_status = 'GENERATED'
    and length(content_hash) > 0
    and content_json is not null
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  if v_doc_count <> 3 then
    raise exception 'all three generated documents are required';
  end if;

  update public.contract_document_versions
  set generation_status = 'FINAL',
      locked_at = v_now
  where package_id = p_package_id
    and package_version = v_package.package_version
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  update public.contract_package_snapshots
  set status = 'CONTRACTED',
      confirmed_by = p_actor_user_id,
      confirmed_at = v_now
  where id = p_package_id;

  select to_jsonb(p.*) || jsonb_build_object(
    'contract_document_versions',
    coalesce((
      select jsonb_agg(to_jsonb(d) order by d.document_type)
      from public.contract_document_versions d
      where d.package_id = p.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.contract_package_snapshots p
  where p.id = p_package_id;

  return v_result;
end;
$$;

create or replace function public.create_contract_change_order(
  p_actor_user_id uuid,
  p_payload jsonb
)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_role text;
  v_package public.contract_package_snapshots%rowtype;
  v_package_id uuid;
  v_pending_package_id uuid;
  v_pending_package_version integer;
  v_change_version integer;
  v_change_order_id uuid;
  v_title text;
  v_amount_delta numeric;
  v_original_contract_amount numeric;
  v_prior_approved_change_total numeric;
  v_revised_contract_amount numeric;
  v_source_hash text;
  v_pending_source_hash text;
  v_manifest_hash text;
  v_doc_count integer;
  v_result jsonb;
begin
  select lower(role) into v_role
  from public.profiles
  where id = p_actor_user_id and is_active = true;

  if v_role <> 'admin' then
    raise exception 'change order creation is allowed only for admin';
  end if;

  v_package_id := (p_payload->>'package_id')::uuid;
  v_title := nullif(trim(coalesce(p_payload->>'title', '')), '');
  if v_title is null then
    v_title := '변경견적';
  end if;
  v_amount_delta := coalesce((p_payload->>'amount_delta')::numeric, 0);

  select *
  into v_package
  from public.contract_package_snapshots
  where id = v_package_id
  for update;

  if not found then
    raise exception 'contract package not found';
  end if;

  if v_package.status <> 'CONTRACTED' then
    raise exception 'only CONTRACTED package can create change order';
  end if;

  perform pg_advisory_xact_lock(hashtext('change-order:' || v_package_id::text));

  if exists (
    select 1
    from public.change_orders
    where package_id = v_package_id
      and status = 'CHANGE_PENDING'
  ) then
    raise exception 'pending change order already exists';
  end if;

  v_original_contract_amount := coalesce(
    v_package.original_contract_amount,
    (v_package.contract_info->>'total_amount')::numeric,
    0
  );

  select coalesce(sum(c.amount_delta), 0)
  into v_prior_approved_change_total
  from public.change_orders c
  join public.contract_package_snapshots p on p.id = c.package_id
  where p.estimate_id = v_package.estimate_id
    and p.contract_no = v_package.contract_no
    and c.status = 'APPROVED';

  v_revised_contract_amount := v_original_contract_amount + v_prior_approved_change_total + v_amount_delta;
  if v_revised_contract_amount < 0 then
    raise exception 'revised contract amount is invalid';
  end if;

  if jsonb_typeof(p_payload->'pending_snapshot') is distinct from 'object'
    or p_payload->'pending_snapshot' = '{}'::jsonb then
    raise exception 'pending package snapshot is required';
  end if;

  if coalesce((p_payload->'pending_snapshot'->'contract_info'->>'total_amount')::numeric, -1) <> v_revised_contract_amount then
    raise exception 'pending package total does not match revised contract amount';
  end if;

  select coalesce(max(change_version), 0) + 1
  into v_change_version
  from public.change_orders
  where package_id = v_package_id;

  if v_title = '변경견적' then
    v_title := '변경견적 ' || v_change_version::text;
  end if;

  v_source_hash := encode(
    digest(
      (v_package_id::text || ':' || v_change_version::text || ':' || coalesce((p_payload->'pending_snapshot')::text, '{}')),
      'sha256'
    ),
    'hex'
  );
  v_pending_source_hash := nullif(trim(coalesce(p_payload->>'pending_source_hash', '')), '');
  if v_pending_source_hash is null then
    raise exception 'pending source hash is required';
  end if;

  insert into public.change_orders (
    package_id,
    estimate_id,
    change_version,
    status,
    title,
    before_snapshot,
    after_snapshot,
    amount_delta,
    schedule_impact,
    approval_snapshot,
    source_hash,
    created_by
  ) values (
    v_package_id,
    v_package.estimate_id,
    v_change_version,
    'CHANGE_PENDING',
    v_title,
    to_jsonb(v_package),
    coalesce(p_payload->'after_snapshot', '{}'::jsonb),
    v_amount_delta,
    coalesce(p_payload->'schedule_impact', '{}'::jsonb),
    null,
    v_source_hash,
    p_actor_user_id
  )
  returning id into v_change_order_id;

  select coalesce(max(package_version), 0) + 1
  into v_pending_package_version
  from public.contract_package_snapshots
  where estimate_id = v_package.estimate_id;

  insert into public.contract_package_snapshots (
    estimate_id,
    estimate_revision,
    package_version,
    contract_no,
    parent_package_id,
    originating_change_order_id,
    status,
    contract_info,
    parties_info,
    site_manager,
    estimate_snapshot,
    document_options_snapshot,
    spec_snapshot,
    clause_snapshot,
    payment_schedule,
    template_version,
    rule_version,
    source_hash,
    original_contract_amount,
    prior_approved_change_total,
    amount_delta,
    revised_contract_amount,
    created_by
  ) values (
    v_package.estimate_id,
    coalesce(p_payload->'pending_snapshot'->>'estimate_revision', v_package.estimate_revision),
    v_pending_package_version,
    v_package.contract_no,
    v_package_id,
    v_change_order_id,
    'DRAFT',
    p_payload->'pending_snapshot'->'contract_info',
    p_payload->'pending_snapshot'->'parties_info',
    coalesce(p_payload->'pending_snapshot'->'site_manager', '{}'::jsonb),
    p_payload->'pending_snapshot'->'estimate_snapshot',
    p_payload->'pending_snapshot'->'document_options_snapshot',
    coalesce(p_payload->'pending_snapshot'->'spec_snapshot', '[]'::jsonb),
    coalesce(p_payload->'pending_snapshot'->'clause_snapshot', '{}'::jsonb),
    coalesce(p_payload->'pending_snapshot'->'payment_schedule', '[]'::jsonb),
    coalesce(p_payload->'pending_snapshot'->>'template_version', v_package.template_version),
    coalesce(p_payload->'pending_snapshot'->>'rule_version', v_package.rule_version),
    v_pending_source_hash,
    v_original_contract_amount,
    v_prior_approved_change_total,
    v_amount_delta,
    v_revised_contract_amount,
    p_actor_user_id
  )
  returning id into v_pending_package_id;

  insert into public.contract_document_versions (
    package_id,
    document_type,
    package_version,
    generation_status,
    content_json,
    content_hash,
    file_path,
    file_url,
    mime_type,
    created_by
  )
  select
    v_pending_package_id,
    doc->>'document_type',
    v_pending_package_version,
    'GENERATED',
    doc->'content_json',
    doc->>'content_hash',
    nullif(doc->>'file_path', ''),
    nullif(doc->>'file_url', ''),
    nullif(doc->>'mime_type', ''),
    p_actor_user_id
  from jsonb_array_elements(coalesce(p_payload->'documents', '[]'::jsonb)) doc
  where doc->>'document_type' in ('CONTRACT', 'QUOTE', 'SPEC')
    and length(coalesce(doc->>'content_hash', '')) > 0
    and jsonb_typeof(doc->'content_json') = 'object'
    and doc->'content_json' <> '{}'::jsonb;

  select count(distinct document_type)
  into v_doc_count
  from public.contract_document_versions
  where package_id = v_pending_package_id
    and package_version = v_pending_package_version
    and generation_status = 'GENERATED'
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  if v_doc_count <> 3 then
    raise exception 'all three pending contract documents must be generated';
  end if;

  select encode(
    digest(string_agg(document_type || ':' || content_hash, '|' order by document_type), 'sha256'),
    'hex'
  )
  into v_manifest_hash
  from public.contract_document_versions
  where package_id = v_pending_package_id
    and package_version = v_pending_package_version
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  update public.contract_package_snapshots
  set status = 'PREVIEWED'
  where id = v_pending_package_id;

  update public.contract_package_snapshots
  set status = 'READY',
      package_manifest_hash = v_manifest_hash
  where id = v_pending_package_id;

  update public.change_orders
  set pending_package_id = v_pending_package_id,
      package_manifest_hash = v_manifest_hash,
      after_snapshot = p_payload->'pending_snapshot'
  where id = v_change_order_id;

  update public.contract_package_snapshots
  set status = 'CHANGE_PENDING'
  where id = v_package_id;

  select to_jsonb(c) || jsonb_build_object(
    'pending_package', (
      select to_jsonb(p) || jsonb_build_object(
        'contract_document_versions',
        coalesce((
          select jsonb_agg(to_jsonb(d) order by d.document_type)
          from public.contract_document_versions d
          where d.package_id = p.id
        ), '[]'::jsonb)
      )
      from public.contract_package_snapshots p
      where p.id = c.pending_package_id
    )
  )
  into v_result
  from public.change_orders c
  where c.id = v_change_order_id;

  return v_result;
end;
$$;

create or replace function public.approve_contract_change_order(
  p_actor_user_id uuid,
  p_change_order_id uuid,
  p_payload jsonb
)
returns jsonb
security definer
set search_path = public
language plpgsql
as $$
declare
  v_role text;
  v_order public.change_orders%rowtype;
  v_package public.contract_package_snapshots%rowtype;
  v_pending_package public.contract_package_snapshots%rowtype;
  v_customer_name text;
  v_approval_method text;
  v_evidence_file_id text;
  v_evidence_url text;
  v_approved_document_hash text;
  v_approved_package_version integer;
  v_customer_signed_at date;
  v_doc_count integer;
  v_original_contract_amount numeric;
  v_prior_approved_change_total numeric;
  v_revised_contract_amount numeric;
  v_approval_snapshot jsonb;
  v_approval_hash text;
  v_approval_id uuid;
  v_result jsonb;
begin
  select lower(role) into v_role
  from public.profiles
  where id = p_actor_user_id and is_active = true;

  if v_role <> 'admin' then
    raise exception 'change order approval is allowed only for admin';
  end if;

  select *
  into v_order
  from public.change_orders
  where id = p_change_order_id
  for update;

  if not found then
    raise exception 'change order not found';
  end if;

  if v_order.status <> 'CHANGE_PENDING' then
    raise exception 'only pending change order can be approved';
  end if;

  select *
  into v_package
  from public.contract_package_snapshots
  where id = v_order.package_id
  for update;

  if not found then
    raise exception 'contract package not found';
  end if;

  if v_package.status <> 'CHANGE_PENDING' then
    raise exception 'contract package is not waiting for change approval';
  end if;

  if v_order.pending_package_id is null or v_order.package_manifest_hash is null then
    raise exception 'pending contract package is required';
  end if;

  select *
  into v_pending_package
  from public.contract_package_snapshots
  where id = v_order.pending_package_id
  for update;

  if not found then
    raise exception 'pending contract package not found';
  end if;

  if v_pending_package.status <> 'READY' then
    raise exception 'pending contract package is not ready';
  end if;

  if v_pending_package.parent_package_id is distinct from v_package.id
    or v_pending_package.originating_change_order_id is distinct from v_order.id
  then
    raise exception 'pending contract package relation is invalid';
  end if;

  if v_pending_package.package_manifest_hash is null
    or v_pending_package.package_manifest_hash <> v_order.package_manifest_hash
  then
    raise exception 'pending contract package manifest does not match change order';
  end if;

  v_customer_name := nullif(trim(coalesce(p_payload->>'customer_name', '')), '');
  v_approval_method := nullif(trim(coalesce(p_payload->>'approval_method', '')), '');
  v_evidence_file_id := nullif(trim(coalesce(p_payload->>'evidence_file_id', '')), '');
  v_evidence_url := nullif(trim(coalesce(p_payload->>'evidence_url', '')), '');
  v_approved_document_hash := nullif(trim(coalesce(p_payload->>'approved_document_hash', '')), '');
  v_approved_package_version := (p_payload->>'approved_package_version')::integer;
  v_customer_signed_at := (p_payload->>'customer_signed_at')::date;

  if v_customer_name is null
    or v_approval_method is null
    or v_approved_document_hash is null
    or v_approved_package_version is null
    or v_customer_signed_at is null
    or (v_evidence_file_id is null and v_evidence_url is null)
  then
    raise exception 'customer approval evidence is required';
  end if;

  if v_approved_package_version <> v_pending_package.package_version then
    raise exception 'approved package version does not match pending package version';
  end if;

  if v_approved_document_hash <> v_order.package_manifest_hash
    or v_approved_document_hash <> v_pending_package.package_manifest_hash
  then
    raise exception 'approved document hash does not match pending package manifest';
  end if;

  select count(distinct document_type)
  into v_doc_count
  from public.contract_document_versions
  where package_id = v_pending_package.id
    and package_version = v_pending_package.package_version
    and generation_status = 'GENERATED'
    and length(coalesce(content_hash, '')) > 0
    and jsonb_typeof(content_json) = 'object'
    and content_json <> '{}'::jsonb
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  if v_doc_count <> 3 then
    raise exception 'all three pending contract documents must be generated before approval';
  end if;

  v_original_contract_amount := coalesce(
    v_pending_package.original_contract_amount,
    v_package.original_contract_amount,
    (v_package.contract_info->>'total_amount')::numeric,
    0
  );
  v_prior_approved_change_total := coalesce(v_pending_package.prior_approved_change_total, 0);

  v_revised_contract_amount := v_original_contract_amount + v_prior_approved_change_total + v_order.amount_delta;
  if v_revised_contract_amount < 0 then
    raise exception 'revised contract amount is invalid';
  end if;

  if v_pending_package.revised_contract_amount is distinct from v_revised_contract_amount then
    raise exception 'pending contract package revised amount does not match change order';
  end if;

  v_approval_snapshot := jsonb_build_object(
    'customer_name', v_customer_name,
    'approval_method', v_approval_method,
    'evidence_file_id', v_evidence_file_id,
    'evidence_url', v_evidence_url,
    'approved_document_hash', v_approved_document_hash,
    'approved_package_version', v_approved_package_version,
    'customer_signed_at', v_customer_signed_at,
    'recorded_by', p_actor_user_id,
    'recorded_at', public.and_os_now(),
    'original_contract_amount', v_original_contract_amount,
    'prior_approved_change_total', v_prior_approved_change_total,
    'amount_delta', v_order.amount_delta,
    'revised_contract_amount', v_revised_contract_amount,
    'notes', nullif(trim(coalesce(p_payload->>'notes', '')), ''),
    'change_order_id', p_change_order_id,
    'change_version', v_order.change_version,
    'parent_package_id', v_package.id,
    'pending_package_id', v_pending_package.id,
    'package_manifest_hash', v_pending_package.package_manifest_hash
  );

  v_approval_hash := encode(digest(v_approval_snapshot::text, 'sha256'), 'hex');

  insert into public.change_order_approvals (
    change_order_id,
    customer_name,
    approval_method,
    evidence_file_id,
    evidence_url,
    approved_document_hash,
    approved_package_version,
    customer_signed_at,
    original_contract_amount,
    prior_approved_change_total,
    amount_delta,
    revised_contract_amount,
    approval_snapshot,
    approval_hash,
    created_by
  ) values (
    p_change_order_id,
    v_customer_name,
    v_approval_method,
    v_evidence_file_id,
    v_evidence_url,
    v_approved_document_hash,
    v_approved_package_version,
    v_customer_signed_at,
    v_original_contract_amount,
    v_prior_approved_change_total,
    v_order.amount_delta,
    v_revised_contract_amount,
    v_approval_snapshot,
    v_approval_hash,
    p_actor_user_id
  )
  returning id into v_approval_id;

  update public.change_orders
  set status = 'APPROVED',
      approval_snapshot = v_approval_snapshot,
      approved_by = p_actor_user_id,
      approved_at = public.and_os_now()
  where id = p_change_order_id;

  update public.contract_package_snapshots
  set status = 'SUPERSEDED'
  where id = v_package.id;

  update public.contract_document_versions
  set generation_status = 'FINAL',
      locked_at = public.and_os_now()
  where package_id = v_pending_package.id
    and package_version = v_pending_package.package_version
    and document_type in ('CONTRACT', 'QUOTE', 'SPEC');

  update public.contract_package_snapshots
  set status = 'CONTRACTED',
      confirmed_by = p_actor_user_id,
      confirmed_at = public.and_os_now()
  where id = v_pending_package.id;

  select to_jsonb(c) || jsonb_build_object(
    'change_order_approvals',
    coalesce((
      select jsonb_agg(to_jsonb(a) order by a.created_at)
      from public.change_order_approvals a
      where a.change_order_id = c.id
    ), '[]'::jsonb),
    'pending_package', (
      select to_jsonb(p) || jsonb_build_object(
        'contract_document_versions',
        coalesce((
          select jsonb_agg(to_jsonb(d) order by d.document_type)
          from public.contract_document_versions d
          where d.package_id = p.id
        ), '[]'::jsonb)
      )
      from public.contract_package_snapshots p
      where p.id = c.pending_package_id
    ),
    'approval_hash', v_approval_hash,
    'revised_contract_amount', v_revised_contract_amount
  )
  into v_result
  from public.change_orders c
  where c.id = p_change_order_id;

  return v_result;
end;
$$;

revoke all on function public.create_contract_package_snapshot(uuid, jsonb) from public;
revoke all on function public.create_contract_package_snapshot(uuid, jsonb) from anon;
revoke all on function public.create_contract_package_snapshot(uuid, jsonb) from authenticated;
grant execute on function public.create_contract_package_snapshot(uuid, jsonb) to service_role;

revoke all on function public.confirm_contract_package_snapshot(uuid, uuid) from public;
revoke all on function public.confirm_contract_package_snapshot(uuid, uuid) from anon;
revoke all on function public.confirm_contract_package_snapshot(uuid, uuid) from authenticated;
grant execute on function public.confirm_contract_package_snapshot(uuid, uuid) to service_role;

revoke all on function public.create_contract_change_order(uuid, jsonb) from public;
revoke all on function public.create_contract_change_order(uuid, jsonb) from anon;
revoke all on function public.create_contract_change_order(uuid, jsonb) from authenticated;
grant execute on function public.create_contract_change_order(uuid, jsonb) to service_role;

revoke all on function public.approve_contract_change_order(uuid, uuid, jsonb) from public;
revoke all on function public.approve_contract_change_order(uuid, uuid, jsonb) from anon;
revoke all on function public.approve_contract_change_order(uuid, uuid, jsonb) from authenticated;
grant execute on function public.approve_contract_change_order(uuid, uuid, jsonb) to service_role;

insert into public.standard_spec_catalog (
  spec_code, version, effective_from, effective_to, work_category, item_name, default_grade, spec_text, applies_to, is_active, sort_order
) values
  ('KITCHEN_FAUCET', '2026.07.20-001', date '2026-07-20', null, '가구', '주방수전', '라우체급', '주방수전은 라우체급 제품을 기본 사양으로 한다.', '{"keywords":["싱크수전","주방수전"]}'::jsonb, true, 10),
  ('KITCHEN_SINK', '2026.07.20-001', date '2026-07-20', null, '가구', '싱크볼', '깜포르테 960급', '싱크볼은 깜포르테 960급 제품을 기본 사양으로 한다.', '{"keywords":["싱크볼"]}'::jsonb, true, 20),
  ('KITCHEN_HOOD', '2026.07.20-001', date '2026-07-20', null, '가구', '주방후드', '하츠 스퀘어 아일랜드 후드급', '주방후드는 하츠 스퀘어 아일랜드 후드급 제품을 기본 사양으로 한다.', '{"keywords":["후드"]}'::jsonb, true, 30),
  ('KITCHEN_COUNTERTOP', '2026.07.20-001', date '2026-07-20', null, '가구', '주방 상판', '칸스톤 또는 세라믹 선택 사양', '주방 상판은 견적 선택값에 따라 칸스톤 또는 세라믹 계열로 적용한다.', '{"keywords":["상판","칸스톤","세라믹"]}'::jsonb, true, 35),
  ('FURNITURE_DOOR', '2026.07.20-001', date '2026-07-20', null, '가구', '가구도어', '도장 또는 LPM', '가구도어는 견적 기준에 따라 도장 또는 LPM을 적용한다.', '{"keywords":["도어","가구도어","문짝"]}'::jsonb, true, 40),
  ('FURNITURE_HARDWARE', '2026.07.20-001', date '2026-07-20', null, '가구', '가구 하드웨어', '댐퍼경첩·언더레일·슬라이드바 기본', '가구 하드웨어는 댐퍼경첩, 언더레일, 슬라이드바를 기본 적용한다.', '{"keywords":["경첩","언더레일","서랍","하드웨어"]}'::jsonb, true, 50),
  ('BATH_FIXTURE', '2026.07.20-001', date '2026-07-20', null, '욕실', '욕실 도기·수전·샤워기', '아메리칸스탠다드급', '욕실 도기, 수전, 샤워기는 아메리칸스탠다드급을 기본 사양으로 한다.', '{"keywords":["도기","수전","샤워기","욕실 기본기기"]}'::jsonb, true, 60),
  ('BATH_CABINET', '2026.07.20-001', date '2026-07-20', null, '욕실', '욕실장', '기본 거울장', '욕실장은 기본 거울장을 적용한다.', '{"keywords":["욕실장","장식장","거울장"]}'::jsonb, true, 70),
  ('BATH_FAN', '2026.07.20-001', date '2026-07-20', null, '욕실', '환풍기', '힘펠 일반 환풍기급', '환풍기는 힘펠 일반 환풍기급을 기본으로 하며 휴젠트는 견적 포함 시 별도 적용한다.', '{"keywords":["환풍기","휴젠트"]}'::jsonb, true, 80),
  ('BATH_DRAIN', '2026.07.20-001', date '2026-07-20', null, '욕실', '유가', '아무스급', '욕실 유가는 아무스급을 기본 사양으로 한다.', '{"keywords":["유가"]}'::jsonb, true, 90),
  ('BATH_WALL_TILE', '2026.07.20-001', date '2026-07-20', null, '욕실', '욕실 벽 타일', '1200x600 수입 포세린급', '욕실 벽은 1200x600 수입 포세린 타일을 기본 사양으로 한다.', '{"keywords":["욕실","타일","벽"]}'::jsonb, true, 100),
  ('BATH_FLOOR_TILE', '2026.07.20-001', date '2026-07-20', null, '욕실', '욕실 바닥 타일', '600x600 수입 포세린급', '욕실 바닥은 600x600 수입 포세린 타일을 기본 사양으로 한다.', '{"keywords":["욕실","바닥","타일"]}'::jsonb, true, 110),
  ('ENTRY_TILE', '2026.07.20-001', date '2026-07-20', null, '마감', '현관 타일', '600x600 포세린급', '현관은 600x600 포세린 타일을 기본 사양으로 한다.', '{"keywords":["현관","타일"]}'::jsonb, true, 120),
  ('FLOORING', '2026.07.20-001', date '2026-07-20', null, '바닥', '마루', 'LX 에디톤급', '마루는 LX 에디톤급을 기본 사양으로 한다.', '{"keywords":["마루","바닥"]}'::jsonb, true, 130),
  ('FILM', '2026.07.20-001', date '2026-07-20', null, '필름', '필름', '영림 182급', '필름은 영림 182급을 기본 사양으로 한다.', '{"keywords":["필름"]}'::jsonb, true, 140),
  ('SILICONE', '2026.07.20-001', date '2026-07-20', null, '마감', '실리콘', '아덱스급', '실리콘은 아덱스급을 기본 사양으로 한다.', '{"keywords":["실리콘"]}'::jsonb, true, 150),
  ('SWITCH_OUTLET', '2026.07.20-001', date '2026-07-20', null, '전기·조명', '스위치·콘센트', '르그랑 아펠라급', '스위치와 콘센트는 르그랑 아펠라급을 기본 사양으로 한다.', '{"keywords":["스위치","콘센트"]}'::jsonb, true, 160),
  ('DOWNLIGHT', '2026.07.20-001', date '2026-07-20', null, '전기·조명', '다운라이트', '2인치 COB 플리커프리 3500~4000K', '다운라이트는 2인치 COB, 플리커프리, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["다운라이트"]}'::jsonb, true, 170),
  ('SQUARE_LIGHT', '2026.07.20-001', date '2026-07-20', null, '전기·조명', '사각 매입등', '10구 COB 플리커프리 3500~4000K', '사각 매입등은 10구 COB, 플리커프리, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["사각","매입등"]}'::jsonb, true, 180),
  ('INDIRECT_LIGHT', '2026.07.20-001', date '2026-07-20', null, '전기·조명', '간접조명', 'T3 LED 3500~4000K', '간접조명은 T3 LED, 3500~4000K를 기본 사양으로 한다.', '{"keywords":["간접조명","T3"]}'::jsonb, true, 190),
  ('DOOR', '2026.07.20-001', date '2026-07-20', null, '도어·창호', '방문·문틀·목재문', 'ABS 방문·필름 문틀·아무스급 목재문', '방문, 문틀, 목재문은 ABS 방문, 필름 문틀, 아무스급 목재문을 기본 사양으로 한다.', '{"keywords":["방문","문틀","목재문","일반도어"]}'::jsonb, true, 200),
  ('MIDDLE_DOOR', '2026.07.20-001', date '2026-07-20', null, '도어·창호', '중문', '간살도어·슬림형 접합유리급', '중문은 견적 기준에 따라 간살도어, 슬림형 접합유리급을 기본 사양으로 한다.', '{"keywords":["중문"]}'::jsonb, true, 210),
  ('BUILT_IN_STORAGE', '2026.07.20-001', date '2026-07-20', null, '가구', '붙박이장·수납장', '자체공장 맞춤 제작', '붙박이장과 수납장은 자체공장 맞춤 제작을 기본 사양으로 한다.', '{"keywords":["붙박이장","수납장","제작"]}'::jsonb, true, 220)
on conflict (spec_code, version) do nothing;
