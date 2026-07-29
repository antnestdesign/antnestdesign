-- RFC-006 digest schema qualification hotfix
-- Fixes hosted Supabase pgcrypto resolution when SECURITY DEFINER search_path is public.
create extension if not exists pgcrypto with schema extensions;
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

