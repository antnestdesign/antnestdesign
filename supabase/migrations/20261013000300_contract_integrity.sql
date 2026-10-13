-- Forward migration: verified immutable manifest guard and qualified pgcrypto RPC bodies
-- Not applied to Production; Phase 4C replay required.
BEGIN;
SET LOCAL search_path = pg_catalog, public, extensions;

create function public.and_os_contract_manifest_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status in ('CONTRACTED','CHANGE_PENDING','SUPERSEDED','CANCELLED')
    and (
      old.package_manifest_hash is distinct from new.package_manifest_hash or
      old.source_hash is distinct from new.source_hash or
      old.package_version is distinct from new.package_version or
      old.original_contract_amount is distinct from new.original_contract_amount or
      old.prior_approved_change_total is distinct from new.prior_approved_change_total or
      old.amount_delta is distinct from new.amount_delta or
      old.revised_contract_amount is distinct from new.revised_contract_amount or
      old.parent_package_id is distinct from new.parent_package_id or
      old.originating_change_order_id is distinct from new.originating_change_order_id or
      old.estimate_id is distinct from new.estimate_id or
      old.estimate_revision is distinct from new.estimate_revision or
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
      old.rule_version is distinct from new.rule_version
    ) then
    raise exception 'locked contract integrity fields cannot be changed';
  end if;
  return new;
end $$;

revoke all on function public.and_os_contract_manifest_guard() from public, anon, authenticated;

create trigger and_os_contract_manifest_guard before update on public.contract_package_snapshots
  for each row execute function public.and_os_contract_manifest_guard();

ALTER FUNCTION public.and_os_contract_manifest_guard() OWNER TO postgres;

REVOKE ALL ON FUNCTION public.and_os_contract_manifest_guard() FROM service_role;

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
  where id = p_actor_user_id and is_active = true and must_change_password = false;

  if coalesce(v_role, '') not in ('admin', 'staff') then
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
    extensions.digest(string_agg(document_type || ':' || content_hash, '|' order by document_type), 'sha256'::text),
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
  where id = p_actor_user_id and is_active = true and must_change_password = false;

  if coalesce(v_role, '') <> 'admin' then
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
  where id = p_actor_user_id and is_active = true and must_change_password = false;

  if coalesce(v_role, '') <> 'admin' then
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
    extensions.digest(
      (v_package_id::text || ':' || v_change_version::text || ':' || coalesce((p_payload->'pending_snapshot')::text, '{}')),
      'sha256'::text
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
    extensions.digest(string_agg(document_type || ':' || content_hash, '|' order by document_type), 'sha256'::text),
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
  where id = p_actor_user_id and is_active = true and must_change_password = false;

  if coalesce(v_role, '') <> 'admin' then
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

  v_approval_hash := encode(extensions.digest(v_approval_snapshot::text, 'sha256'::text), 'hex');

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

COMMIT;
