-- Exact app-owned Production baseline; schema only, not a security upgrade.

-- Captured 2026-10-13T07:24:59.489571+00:00; managed Supabase PostgreSQL 17 required.

-- Existing Production must ADOPT this version, never replay this CREATE baseline.

-- Auth/storage schemas and platform default privileges remain managed prerequisites.

BEGIN;

SET LOCAL search_path = pg_catalog, public, extensions;

DO $$ BEGIN IF current_setting('server_version_num')::integer < 170000 THEN RAISE EXCEPTION 'PostgreSQL 17+ required'; END IF; END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

CREATE TABLE public."change_order_approvals" (
  "id" uuid NOT NULL,
  "change_order_id" uuid NOT NULL,
  "customer_name" text NOT NULL,
  "approval_method" text NOT NULL,
  "evidence_file_id" text,
  "evidence_url" text,
  "approved_document_hash" text NOT NULL,
  "approved_package_version" integer NOT NULL,
  "customer_signed_at" date NOT NULL,
  "original_contract_amount" numeric NOT NULL,
  "prior_approved_change_total" numeric NOT NULL,
  "amount_delta" numeric NOT NULL,
  "revised_contract_amount" numeric NOT NULL,
  "approval_snapshot" jsonb NOT NULL,
  "approval_hash" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."change_order_approvals" OWNER TO "postgres";

CREATE TABLE public."change_orders" (
  "id" uuid NOT NULL,
  "package_id" uuid NOT NULL,
  "estimate_id" uuid NOT NULL,
  "change_version" integer NOT NULL,
  "status" text NOT NULL,
  "title" text NOT NULL,
  "before_snapshot" jsonb NOT NULL,
  "after_snapshot" jsonb NOT NULL,
  "pending_package_id" uuid,
  "amount_delta" numeric NOT NULL,
  "schedule_impact" jsonb NOT NULL,
  "approval_snapshot" jsonb,
  "package_manifest_hash" text,
  "source_hash" text NOT NULL,
  "created_by" uuid,
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."change_orders" OWNER TO "postgres";

CREATE TABLE public."contract_document_versions" (
  "id" uuid NOT NULL,
  "package_id" uuid NOT NULL,
  "document_type" text NOT NULL,
  "package_version" integer NOT NULL,
  "generation_status" text NOT NULL,
  "content_json" jsonb NOT NULL,
  "content_hash" text NOT NULL,
  "file_path" text,
  "file_url" text,
  "mime_type" text,
  "created_by" uuid,
  "locked_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."contract_document_versions" OWNER TO "postgres";

CREATE TABLE public."contract_package_snapshots" (
  "id" uuid NOT NULL,
  "estimate_id" uuid NOT NULL,
  "estimate_revision" text NOT NULL,
  "package_version" integer NOT NULL,
  "contract_no" text NOT NULL,
  "parent_package_id" uuid,
  "originating_change_order_id" uuid,
  "status" text NOT NULL,
  "contract_info" jsonb NOT NULL,
  "parties_info" jsonb NOT NULL,
  "site_manager" jsonb NOT NULL,
  "estimate_snapshot" jsonb NOT NULL,
  "document_options_snapshot" jsonb NOT NULL,
  "spec_snapshot" jsonb NOT NULL,
  "clause_snapshot" jsonb NOT NULL,
  "payment_schedule" jsonb NOT NULL,
  "template_version" text NOT NULL,
  "rule_version" text NOT NULL,
  "source_hash" text NOT NULL,
  "package_manifest_hash" text,
  "original_contract_amount" numeric,
  "prior_approved_change_total" numeric NOT NULL,
  "amount_delta" numeric NOT NULL,
  "revised_contract_amount" numeric,
  "created_by" uuid,
  "confirmed_by" uuid,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."contract_package_snapshots" OWNER TO "postgres";

CREATE TABLE public."cost_item_history" (
  "id" uuid NOT NULL,
  "cost_item_id" uuid NOT NULL,
  "old_cost_price" numeric,
  "new_cost_price" numeric,
  "old_margin_rate" numeric,
  "new_margin_rate" numeric,
  "changed_by" uuid,
  "changed_at" timestamp with time zone NOT NULL,
  "reason" text,
  "cost_version" text,
  "old_is_active" boolean,
  "new_is_active" boolean
);

ALTER TABLE public."cost_item_history" OWNER TO "postgres";

CREATE TABLE public."cost_items" (
  "id" uuid NOT NULL,
  "category" text NOT NULL,
  "subcategory" text,
  "item_code" text NOT NULL,
  "item_name" text NOT NULL,
  "unit" text NOT NULL,
  "cost_price" numeric NOT NULL,
  "default_margin_rate" numeric NOT NULL,
  "customer_name" text,
  "order_name" text,
  "include_in_customer_quote" boolean NOT NULL,
  "include_in_internal_quote" boolean NOT NULL,
  "include_in_order_sheet" boolean NOT NULL,
  "is_material" boolean NOT NULL,
  "is_labor" boolean NOT NULL,
  "is_service" boolean NOT NULL,
  "supplier_name" text,
  "supplier_phone" text,
  "supplier_memo" text,
  "is_active" boolean NOT NULL,
  "sort_order" integer NOT NULL,
  "memo" text,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL,
  "updated_by" uuid,
  "draft_cost_price" numeric,
  "draft_margin_rate" numeric,
  "draft_is_active" boolean,
  "draft_updated_at" timestamp with time zone,
  "draft_updated_by" uuid,
  "calculation_basis" text NOT NULL,
  "calculation_multiplier" numeric NOT NULL,
  "min_quantity" numeric,
  "rounding_method" text NOT NULL,
  "is_pending_new" boolean NOT NULL,
  "source_cost_item_id" uuid
);

ALTER TABLE public."cost_items" OWNER TO "postgres";

CREATE TABLE public."cost_publish_log" (
  "id" uuid NOT NULL,
  "version" text NOT NULL,
  "reason" text NOT NULL,
  "published_by" uuid NOT NULL,
  "published_at" timestamp with time zone NOT NULL,
  "changed_item_count" integer NOT NULL,
  "price_change_count" integer NOT NULL,
  "margin_change_count" integer NOT NULL,
  "active_change_count" integer NOT NULL,
  "duration_ms" integer,
  "memo" text,
  "created_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."cost_publish_log" OWNER TO "postgres";

CREATE TABLE public."customers" (
  "id" uuid NOT NULL,
  "name" text,
  "phone" text,
  "memo" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

ALTER TABLE public."customers" OWNER TO "postgres";

CREATE TABLE public."estimate_document_options" (
  "id" uuid NOT NULL,
  "estimate_id" uuid NOT NULL,
  "contract_no" text,
  "contract_info" jsonb NOT NULL,
  "customer_info" jsonb NOT NULL,
  "contractor_info" jsonb NOT NULL,
  "site_manager" jsonb NOT NULL,
  "admin_tasks" jsonb NOT NULL,
  "protection_options" jsonb NOT NULL,
  "item_options" jsonb NOT NULL,
  "notes" text,
  "created_by" uuid,
  "updated_by" uuid,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."estimate_document_options" OWNER TO "postgres";

CREATE TABLE public."estimate_items" (
  "id" uuid NOT NULL,
  "estimate_id" uuid,
  "group_name" text,
  "item_name" text,
  "quantity" text,
  "unit_price" numeric,
  "cost" numeric,
  "customer_price" numeric,
  "memo" text,
  "sort_order" integer,
  "created_at" timestamp with time zone
);

ALTER TABLE public."estimate_items" OWNER TO "postgres";

CREATE TABLE public."estimates" (
  "id" uuid NOT NULL,
  "project_name" text NOT NULL,
  "client_name" text,
  "phone" text,
  "address" text,
  "area_pyeong" numeric,
  "total_price" numeric,
  "estimate_data" jsonb NOT NULL,
  "status" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone,
  "project_id" uuid,
  "cost_total" numeric,
  "margin_rate" numeric
);

ALTER TABLE public."estimates" OWNER TO "postgres";

CREATE TABLE public."os_audit_logs" (
  "id" uuid NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "actor_user_id" uuid,
  "actor_email" text,
  "actor_name" text,
  "actor_role" text,
  "action" text NOT NULL,
  "target_type" text,
  "target_id" text,
  "target_label" text,
  "before_data" jsonb,
  "after_data" jsonb,
  "result" text NOT NULL,
  "reason" text
);

ALTER TABLE public."os_audit_logs" OWNER TO "postgres";

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "name" text,
  "role" text NOT NULL,
  "created_at" timestamp with time zone,
  "email" text,
  "is_active" boolean NOT NULL,
  "must_change_password" boolean NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."profiles" OWNER TO "postgres";

CREATE TABLE public."projects" (
  "id" uuid NOT NULL,
  "customer_id" uuid,
  "project_name" text NOT NULL,
  "address" text,
  "area_pyeong" numeric,
  "status" text,
  "memo" text,
  "created_at" timestamp with time zone,
  "updated_at" timestamp with time zone
);

ALTER TABLE public."projects" OWNER TO "postgres";

CREATE TABLE public."standard_spec_catalog" (
  "id" uuid NOT NULL,
  "spec_code" text NOT NULL,
  "version" text NOT NULL,
  "effective_from" date NOT NULL,
  "effective_to" date,
  "work_category" text NOT NULL,
  "item_name" text NOT NULL,
  "default_grade" text NOT NULL,
  "spec_text" text NOT NULL,
  "applies_to" jsonb NOT NULL,
  "is_active" boolean NOT NULL,
  "sort_order" integer NOT NULL,
  "created_at" timestamp with time zone NOT NULL,
  "updated_at" timestamp with time zone NOT NULL
);

ALTER TABLE public."standard_spec_catalog" OWNER TO "postgres";

CREATE FUNCTION public.and_os_now()
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select (timezone('Asia/Seoul', now())::timestamp at time zone 'Asia/Seoul');
$function$;

ALTER FUNCTION public."and_os_now"() OWNER TO "postgres";

CREATE FUNCTION public.and_os_require_cost_rpc_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(current_setting('request.and_os_cost_rpc', true), '') <> 'on' then
    raise exception 'AND OS cost data mutation must use approved RPC';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$function$;

ALTER FUNCTION public."and_os_require_cost_rpc_mutation"() OWNER TO "postgres";

CREATE FUNCTION public.approve_contract_change_order(p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."approve_contract_change_order"(p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb) OWNER TO "postgres";

CREATE FUNCTION public.cancel_all_cost_drafts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_count integer;
  v_changed_count integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  delete from public.cost_items
  where is_pending_new = true;

  get diagnostics v_count = row_count;

  update public.cost_items
  set
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null
  where draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  get diagnostics v_changed_count = row_count;
  v_count := v_count + v_changed_count;
  return v_count;
end;
$function$;

ALTER FUNCTION public."cancel_all_cost_drafts"() OWNER TO "postgres";

CREATE FUNCTION public.cancel_cost_item_draft(p_cost_item_id uuid)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.cost_items;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  select * into v_row from public.cost_items where id = p_cost_item_id;
  if v_row.id is null then
    raise exception 'cost item not found';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  if v_row.is_pending_new then
    delete from public.cost_items where id = p_cost_item_id;
    return v_row;
  end if;

  update public.cost_items
  set
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$function$;

ALTER FUNCTION public."cancel_cost_item_draft"(p_cost_item_id uuid) OWNER TO "postgres";

CREATE FUNCTION public.confirm_contract_package_snapshot(p_package_id uuid, p_actor_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."confirm_contract_package_snapshot"(p_package_id uuid, p_actor_user_id uuid) OWNER TO "postgres";

CREATE FUNCTION public.create_contract_change_order(p_actor_user_id uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."create_contract_change_order"(p_actor_user_id uuid, p_payload jsonb) OWNER TO "postgres";

CREATE FUNCTION public.create_contract_package_snapshot(p_actor_user_id uuid, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

ALTER FUNCTION public."create_contract_package_snapshot"(p_actor_user_id uuid, p_payload jsonb) OWNER TO "postgres";

CREATE FUNCTION public.create_cost_item_pending(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false, p_source_cost_item_id uuid DEFAULT NULL::uuid)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.cost_items;
  v_item_code text;
  v_item_name text;
  v_category text;
  v_unit text;
  v_basis text;
  v_multiplier numeric;
  v_rounding text;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_item_code := public.validate_and_os_cost_item_code(p_item_code);
  v_item_name := nullif(trim(coalesce(p_item_name, '')), '');
  v_category := nullif(trim(coalesce(p_category, '')), '');
  v_unit := nullif(trim(coalesce(p_unit, '')), '');
  v_basis := nullif(trim(coalesce(p_calculation_basis, '')), '');
  v_multiplier := coalesce(p_calculation_multiplier, 1);
  v_rounding := coalesce(nullif(trim(p_rounding_method), ''), 'none');

  if v_item_name is null then raise exception 'item name is required'; end if;
  if v_category is null then raise exception 'category is required'; end if;
  if v_unit is null then raise exception 'unit is required'; end if;
  if v_basis is null then raise exception 'calculation basis is required'; end if;
  if p_cost_price is null or p_cost_price < 0 then raise exception 'cost price must be greater than or equal to zero'; end if;
  if p_margin_rate is null or p_margin_rate < 0 or p_margin_rate >= 1 then raise exception 'margin rate must be greater than or equal to zero and less than one'; end if;
  if v_multiplier < 0 then raise exception 'calculation multiplier must be greater than or equal to zero'; end if;
  if p_min_quantity is not null and p_min_quantity < 0 then raise exception 'minimum quantity must be greater than or equal to zero'; end if;
  if v_rounding not in ('none', 'ceil', 'floor', 'round') then raise exception 'rounding method is invalid'; end if;

  if exists (select 1 from public.cost_items where item_code = v_item_code) then
    raise exception 'cost item code already exists';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

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
    memo,
    updated_by,
    draft_is_active,
    draft_updated_at,
    draft_updated_by,
    calculation_basis,
    calculation_multiplier,
    min_quantity,
    rounding_method,
    is_pending_new,
    source_cost_item_id
  )
  values (
    v_category,
    nullif(trim(coalesce(p_subcategory, '')), ''),
    v_item_code,
    v_item_name,
    v_unit,
    p_cost_price,
    p_margin_rate,
    nullif(trim(coalesce(p_customer_name, '')), ''),
    nullif(trim(coalesce(p_order_name, '')), ''),
    coalesce(p_include_in_customer_quote, true),
    coalesce(p_include_in_internal_quote, true),
    coalesce(p_include_in_order_sheet, false),
    coalesce(p_is_material, false),
    coalesce(p_is_labor, false),
    coalesce(p_is_service, false),
    false,
    coalesce(p_sort_order, 0),
    nullif(trim(coalesce(p_memo, '')), ''),
    auth.uid(),
    coalesce(p_is_active, true),
    timezone('Asia/Seoul', now()),
    auth.uid(),
    v_basis,
    v_multiplier,
    p_min_quantity,
    v_rounding,
    true,
    p_source_cost_item_id
  )
  returning * into v_row;

  return v_row;
end;
$function$;

ALTER FUNCTION public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) OWNER TO "postgres";

CREATE FUNCTION public.current_and_os_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select lower(role) from public.profiles where id = auth.uid() limit 1), 'staff');
$function$;

ALTER FUNCTION public."current_and_os_role"() OWNER TO "postgres";

CREATE FUNCTION public.enforce_contract_package_state_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."enforce_contract_package_state_transition"() OWNER TO "postgres";

CREATE FUNCTION public.is_and_os_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.current_and_os_role() = 'admin';
$function$;

ALTER FUNCTION public."is_and_os_admin"() OWNER TO "postgres";

CREATE FUNCTION public.next_cost_publish_version()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_prefix text;
  v_last_suffix integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_prefix := to_char(timezone('Asia/Seoul', now()), 'YYYY.MM.DD');

  select coalesce(max(substring(version from 12 for 3)::integer), 0)
  into v_last_suffix
  from public.cost_publish_log
  where version like v_prefix || '-___';

  return v_prefix || '-' || lpad((v_last_suffix + 1)::text, 3, '0');
end;
$function$;

ALTER FUNCTION public."next_cost_publish_version"() OWNER TO "postgres";

CREATE FUNCTION public.prevent_approved_change_order_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."prevent_approved_change_order_mutation"() OWNER TO "postgres";

CREATE FUNCTION public.prevent_change_order_approval_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  raise exception 'change order approval records are immutable';
end;
$function$;

ALTER FUNCTION public."prevent_change_order_approval_mutation"() OWNER TO "postgres";

CREATE FUNCTION public.prevent_contract_no_cross_estimate()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."prevent_contract_no_cross_estimate"() OWNER TO "postgres";

CREATE FUNCTION public.prevent_locked_contract_document_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$;

ALTER FUNCTION public."prevent_locked_contract_document_change"() OWNER TO "postgres";

CREATE FUNCTION public.publish_cost_drafts(p_reason text, p_memo text DEFAULT NULL::text)
 RETURNS TABLE(version text, changed_item_count integer, price_change_count integer, margin_change_count integer, active_change_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_reason text;
  v_version text;
  v_changed_count integer;
  v_price_count integer;
  v_margin_count integer;
  v_active_count integer;
  v_memo text;
  v_started_at timestamptz;
  v_duration_ms integer;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  v_started_at := clock_timestamp();

  v_reason := nullif(trim(p_reason), '');
  if v_reason is null then raise exception 'publish reason is required'; end if;
  if char_length(v_reason) > 500 then raise exception 'publish reason must be 500 characters or fewer'; end if;

  v_memo := nullif(trim(p_memo), '');
  if v_memo is not null and char_length(v_memo) > 2000 then
    raise exception 'publish memo must be 2000 characters or fewer';
  end if;

  perform pg_advisory_xact_lock(hashtext('and_os_cost_publish'));
  perform set_config('request.and_os_cost_rpc', 'on', true);

  select count(*)
  into v_changed_count
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  if v_changed_count = 0 then raise exception 'no draft cost changes to publish'; end if;

  v_version := public.next_cost_publish_version();

  select
    count(*) filter (where draft_cost_price is not null or is_pending_new = true),
    count(*) filter (where draft_margin_rate is not null or is_pending_new = true),
    count(*) filter (where draft_is_active is not null or is_pending_new = true)
  into v_price_count, v_margin_count, v_active_count
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  insert into public.cost_item_history (
    cost_item_id,
    old_cost_price,
    new_cost_price,
    old_margin_rate,
    new_margin_rate,
    old_is_active,
    new_is_active,
    changed_by,
    changed_at,
    reason,
    cost_version
  )
  select
    id,
    case when is_pending_new then null else cost_price end,
    coalesce(draft_cost_price, cost_price),
    case when is_pending_new then null else default_margin_rate end,
    coalesce(draft_margin_rate, default_margin_rate),
    case when is_pending_new then false else is_active end,
    coalesce(draft_is_active, is_active),
    auth.uid(),
    timezone('Asia/Seoul', now()),
    v_reason,
    v_version
  from public.cost_items
  where is_pending_new = true
     or draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  update public.cost_items
  set
    cost_price = coalesce(draft_cost_price, cost_price),
    default_margin_rate = coalesce(draft_margin_rate, default_margin_rate),
    is_active = coalesce(draft_is_active, is_active),
    updated_by = auth.uid(),
    draft_cost_price = null,
    draft_margin_rate = null,
    draft_is_active = null,
    draft_updated_at = null,
    draft_updated_by = null,
    is_pending_new = false
  where is_pending_new = true
     or draft_cost_price is not null
     or draft_margin_rate is not null
     or draft_is_active is not null;

  v_duration_ms := greatest(0, floor(extract(epoch from (clock_timestamp() - v_started_at)) * 1000)::integer);

  insert into public.cost_publish_log (
    version,
    reason,
    published_by,
    published_at,
    changed_item_count,
    price_change_count,
    margin_change_count,
    active_change_count,
    duration_ms,
    memo,
    created_at
  ) values (
    v_version,
    v_reason,
    auth.uid(),
    timezone('Asia/Seoul', now()),
    v_changed_count,
    v_price_count,
    v_margin_count,
    v_active_count,
    v_duration_ms,
    v_memo,
    timezone('Asia/Seoul', now())
  );

  return query select v_version, v_changed_count, v_price_count, v_margin_count, v_active_count;
end;
$function$;

ALTER FUNCTION public."publish_cost_drafts"(p_reason text, p_memo text) OWNER TO "postgres";

CREATE FUNCTION public.save_cost_item_draft(p_cost_item_id uuid, p_draft_cost_price numeric DEFAULT NULL::numeric, p_draft_margin_rate numeric DEFAULT NULL::numeric, p_draft_is_active boolean DEFAULT NULL::boolean)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.cost_items;
  v_has_draft boolean;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  if p_draft_cost_price is not null and p_draft_cost_price < 0 then
    raise exception 'draft cost price must be greater than or equal to zero';
  end if;

  if p_draft_margin_rate is not null
     and (p_draft_margin_rate < 0 or p_draft_margin_rate >= 1) then
    raise exception 'draft margin rate must be greater than or equal to zero and less than one';
  end if;

  update public.cost_items
  set
    draft_cost_price = case
      when p_draft_cost_price is not null and p_draft_cost_price <> cost_price then p_draft_cost_price
      else null
    end,
    draft_margin_rate = case
      when p_draft_margin_rate is not null and p_draft_margin_rate <> default_margin_rate then p_draft_margin_rate
      else null
    end,
    draft_is_active = case
      when p_draft_is_active is not null and p_draft_is_active <> is_active then p_draft_is_active
      else null
    end
  where id = p_cost_item_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'cost item not found';
  end if;

  v_has_draft := v_row.draft_cost_price is not null
    or v_row.draft_margin_rate is not null
    or v_row.draft_is_active is not null;

  update public.cost_items
  set
    draft_updated_at = case when v_has_draft then now() else null end,
    draft_updated_by = case when v_has_draft then auth.uid() else null end
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$function$;

ALTER FUNCTION public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) OWNER TO "postgres";

CREATE FUNCTION public.set_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER FUNCTION public."set_profiles_updated_at"() OWNER TO "postgres";

CREATE FUNCTION public.set_rfc006_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = public.and_os_now();
  return new;
end;
$function$;

ALTER FUNCTION public."set_rfc006_updated_at"() OWNER TO "postgres";

CREATE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

ALTER FUNCTION public."set_updated_at"() OWNER TO "postgres";

CREATE FUNCTION public.update_cost_item_pending(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false)
 RETURNS cost_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.cost_items;
  v_category text;
  v_unit text;
  v_basis text;
  v_multiplier numeric;
  v_rounding text;
begin
  if not public.is_and_os_admin() then
    raise exception 'AND OS admin permission required';
  end if;

  select * into v_row from public.cost_items where id = p_cost_item_id;
  if v_row.id is null then raise exception 'cost item not found'; end if;
  if not v_row.is_pending_new then raise exception 'only pending new cost items can be edited here'; end if;

  if public.validate_and_os_cost_item_code(p_item_code) <> v_row.item_code then
    raise exception 'pending item code cannot be changed';
  end if;

  v_category := nullif(trim(coalesce(p_category, '')), '');
  v_unit := nullif(trim(coalesce(p_unit, '')), '');
  v_basis := nullif(trim(coalesce(p_calculation_basis, '')), '');
  v_multiplier := coalesce(p_calculation_multiplier, 1);
  v_rounding := coalesce(nullif(trim(p_rounding_method), ''), 'none');

  if nullif(trim(coalesce(p_item_name, '')), '') is null then raise exception 'item name is required'; end if;
  if v_category is null then raise exception 'category is required'; end if;
  if v_unit is null then raise exception 'unit is required'; end if;
  if v_basis is null then raise exception 'calculation basis is required'; end if;
  if p_cost_price is null or p_cost_price < 0 then raise exception 'cost price must be greater than or equal to zero'; end if;
  if p_margin_rate is null or p_margin_rate < 0 or p_margin_rate >= 1 then raise exception 'margin rate must be greater than or equal to zero and less than one'; end if;
  if v_multiplier < 0 then raise exception 'calculation multiplier must be greater than or equal to zero'; end if;
  if p_min_quantity is not null and p_min_quantity < 0 then raise exception 'minimum quantity must be greater than or equal to zero'; end if;
  if v_rounding not in ('none', 'ceil', 'floor', 'round') then raise exception 'rounding method is invalid'; end if;

  perform set_config('request.and_os_cost_rpc', 'on', true);

  update public.cost_items
  set
    category = v_category,
    subcategory = nullif(trim(coalesce(p_subcategory, '')), ''),
    item_name = nullif(trim(coalesce(p_item_name, '')), ''),
    unit = v_unit,
    cost_price = p_cost_price,
    default_margin_rate = p_margin_rate,
    customer_name = nullif(trim(coalesce(p_customer_name, '')), ''),
    order_name = nullif(trim(coalesce(p_order_name, '')), ''),
    include_in_customer_quote = coalesce(p_include_in_customer_quote, true),
    include_in_internal_quote = coalesce(p_include_in_internal_quote, true),
    include_in_order_sheet = coalesce(p_include_in_order_sheet, false),
    is_material = coalesce(p_is_material, false),
    is_labor = coalesce(p_is_labor, false),
    is_service = coalesce(p_is_service, false),
    sort_order = coalesce(p_sort_order, 0),
    memo = nullif(trim(coalesce(p_memo, '')), ''),
    updated_by = auth.uid(),
    draft_is_active = coalesce(p_is_active, true),
    draft_updated_at = timezone('Asia/Seoul', now()),
    draft_updated_by = auth.uid(),
    calculation_basis = v_basis,
    calculation_multiplier = v_multiplier,
    min_quantity = p_min_quantity,
    rounding_method = v_rounding
  where id = p_cost_item_id
  returning * into v_row;

  return v_row;
end;
$function$;

ALTER FUNCTION public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) OWNER TO "postgres";

CREATE FUNCTION public.validate_and_os_cost_item_code(p_item_code text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_code text;
begin
  v_code := upper(trim(coalesce(p_item_code, '')));
  if v_code = '' then
    raise exception 'item code is required';
  end if;
  if v_code !~ '^[A-Z0-9_]+$' then
    raise exception 'item code must contain only uppercase letters, numbers, and underscores';
  end if;
  return v_code;
end;
$function$;

ALTER FUNCTION public."validate_and_os_cost_item_code"(p_item_code text) OWNER TO "postgres";

ALTER TABLE public."change_order_approvals" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."change_order_approvals" ALTER COLUMN "prior_approved_change_total" SET DEFAULT 0;

ALTER TABLE public."change_order_approvals" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."change_orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."change_orders" ALTER COLUMN "status" SET DEFAULT 'CHANGE_PENDING'::text;

ALTER TABLE public."change_orders" ALTER COLUMN "amount_delta" SET DEFAULT 0;

ALTER TABLE public."change_orders" ALTER COLUMN "schedule_impact" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."change_orders" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."change_orders" ALTER COLUMN "updated_at" SET DEFAULT and_os_now();

ALTER TABLE public."contract_document_versions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."contract_document_versions" ALTER COLUMN "generation_status" SET DEFAULT 'GENERATED'::text;

ALTER TABLE public."contract_document_versions" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "site_manager" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "spec_snapshot" SET DEFAULT '[]'::jsonb;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "clause_snapshot" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "payment_schedule" SET DEFAULT '[]'::jsonb;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "prior_approved_change_total" SET DEFAULT 0;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "amount_delta" SET DEFAULT 0;

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."contract_package_snapshots" ALTER COLUMN "updated_at" SET DEFAULT and_os_now();

ALTER TABLE public."cost_item_history" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."cost_item_history" ALTER COLUMN "changed_at" SET DEFAULT now();

ALTER TABLE public."cost_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."cost_items" ALTER COLUMN "cost_price" SET DEFAULT 0;

ALTER TABLE public."cost_items" ALTER COLUMN "default_margin_rate" SET DEFAULT 0.35;

ALTER TABLE public."cost_items" ALTER COLUMN "include_in_customer_quote" SET DEFAULT true;

ALTER TABLE public."cost_items" ALTER COLUMN "include_in_internal_quote" SET DEFAULT true;

ALTER TABLE public."cost_items" ALTER COLUMN "include_in_order_sheet" SET DEFAULT false;

ALTER TABLE public."cost_items" ALTER COLUMN "is_material" SET DEFAULT false;

ALTER TABLE public."cost_items" ALTER COLUMN "is_labor" SET DEFAULT false;

ALTER TABLE public."cost_items" ALTER COLUMN "is_service" SET DEFAULT false;

ALTER TABLE public."cost_items" ALTER COLUMN "is_active" SET DEFAULT true;

ALTER TABLE public."cost_items" ALTER COLUMN "sort_order" SET DEFAULT 0;

ALTER TABLE public."cost_items" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."cost_items" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE public."cost_items" ALTER COLUMN "calculation_basis" SET DEFAULT 'manual_input'::text;

ALTER TABLE public."cost_items" ALTER COLUMN "calculation_multiplier" SET DEFAULT 1;

ALTER TABLE public."cost_items" ALTER COLUMN "rounding_method" SET DEFAULT 'none'::text;

ALTER TABLE public."cost_items" ALTER COLUMN "is_pending_new" SET DEFAULT false;

ALTER TABLE public."cost_publish_log" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."cost_publish_log" ALTER COLUMN "published_at" SET DEFAULT now();

ALTER TABLE public."cost_publish_log" ALTER COLUMN "changed_item_count" SET DEFAULT 0;

ALTER TABLE public."cost_publish_log" ALTER COLUMN "price_change_count" SET DEFAULT 0;

ALTER TABLE public."cost_publish_log" ALTER COLUMN "margin_change_count" SET DEFAULT 0;

ALTER TABLE public."cost_publish_log" ALTER COLUMN "active_change_count" SET DEFAULT 0;

ALTER TABLE public."cost_publish_log" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."customers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."customers" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."customers" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE public."estimate_document_options" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."estimate_document_options" ALTER COLUMN "contract_info" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "customer_info" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "contractor_info" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "site_manager" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "admin_tasks" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "protection_options" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "item_options" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."estimate_document_options" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."estimate_document_options" ALTER COLUMN "updated_at" SET DEFAULT and_os_now();

ALTER TABLE public."estimate_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."estimate_items" ALTER COLUMN "sort_order" SET DEFAULT 0;

ALTER TABLE public."estimate_items" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."estimates" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."estimates" ALTER COLUMN "status" SET DEFAULT '상담중'::text;

ALTER TABLE public."estimates" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."estimates" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE public."os_audit_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."os_audit_logs" ALTER COLUMN "created_at" SET DEFAULT timezone('Asia/Seoul'::text, now());

ALTER TABLE public."os_audit_logs" ALTER COLUMN "result" SET DEFAULT 'SUCCESS'::text;

ALTER TABLE public."profiles" ALTER COLUMN "role" SET DEFAULT 'staff'::text;

ALTER TABLE public."profiles" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."profiles" ALTER COLUMN "is_active" SET DEFAULT true;

ALTER TABLE public."profiles" ALTER COLUMN "must_change_password" SET DEFAULT false;

ALTER TABLE public."profiles" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE public."projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."projects" ALTER COLUMN "status" SET DEFAULT '상담중'::text;

ALTER TABLE public."projects" ALTER COLUMN "created_at" SET DEFAULT now();

ALTER TABLE public."projects" ALTER COLUMN "updated_at" SET DEFAULT now();

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "version" SET DEFAULT '2026.07.20-001'::text;

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "effective_from" SET DEFAULT CURRENT_DATE;

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "applies_to" SET DEFAULT '{}'::jsonb;

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "is_active" SET DEFAULT true;

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "sort_order" SET DEFAULT 0;

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "created_at" SET DEFAULT and_os_now();

ALTER TABLE public."standard_spec_catalog" ALTER COLUMN "updated_at" SET DEFAULT and_os_now();

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_amount_check" CHECK (revised_contract_amount = (original_contract_amount + prior_approved_change_total + amount_delta));

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_customer_name_not_empty" CHECK (length(TRIM(BOTH FROM customer_name)) > 0);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_document_hash_not_empty" CHECK (length(TRIM(BOTH FROM approved_document_hash)) > 0);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_evidence_required" CHECK (evidence_file_id IS NOT NULL OR evidence_url IS NOT NULL);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_hash_not_empty" CHECK (length(TRIM(BOTH FROM approval_hash)) > 0);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approval_method_not_empty" CHECK (length(TRIM(BOTH FROM approval_method)) > 0);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approvals_pkey" PRIMARY KEY (id);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_order_hash_not_empty" CHECK (length(TRIM(BOTH FROM source_hash)) > 0);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_order_manifest_hash_not_empty" CHECK (package_manifest_hash IS NULL OR length(TRIM(BOTH FROM package_manifest_hash)) > 0);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_order_status_check" CHECK (status = ANY (ARRAY['CHANGE_PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'CANCELLED'::text]));

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_order_title_not_empty" CHECK (length(TRIM(BOTH FROM title)) > 0);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_order_version_unique" UNIQUE (package_id, change_version);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_pkey" PRIMARY KEY (id);

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_content_object_check" CHECK (jsonb_typeof(content_json) = 'object'::text AND content_json <> '{}'::jsonb);

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_hash_not_empty" CHECK (length(TRIM(BOTH FROM content_hash)) > 0);

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_status_check" CHECK (generation_status = ANY (ARRAY['GENERATED'::text, 'FINAL'::text, 'FAILED'::text]));

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_type_check" CHECK (document_type = ANY (ARRAY['CONTRACT'::text, 'QUOTE'::text, 'SPEC'::text]));

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_unique" UNIQUE (package_id, package_version, document_type);

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_versions_pkey" PRIMARY KEY (id);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_amount_check" CHECK (revised_contract_amount IS NULL OR revised_contract_amount = (COALESCE(original_contract_amount, 0::numeric) + prior_approved_change_total + amount_delta));

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_contract_no_format" CHECK (contract_no ~ '^[A-Za-z0-9가-힣._-]{1,50}$'::text);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_hash_not_empty" CHECK (length(TRIM(BOTH FROM source_hash)) > 0);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_manifest_hash_not_empty" CHECK (package_manifest_hash IS NULL OR length(TRIM(BOTH FROM package_manifest_hash)) > 0);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_snapshots_pkey" PRIMARY KEY (id);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_status_check" CHECK (status = ANY (ARRAY['DRAFT'::text, 'PREVIEWED'::text, 'READY'::text, 'CONTRACTED'::text, 'CHANGE_PENDING'::text, 'SUPERSEDED'::text, 'CANCELLED'::text]));

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_version_unique" UNIQUE (estimate_id, package_version);

ALTER TABLE public."cost_item_history" ADD CONSTRAINT "cost_item_history_pkey" PRIMARY KEY (id);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_calculation_basis_check" CHECK (calculation_basis = ANY (ARRAY['fixed'::text, 'apartment_pyeong'::text, 'flooring_pyeong'::text, 'length_mm'::text, 'length_m'::text, 'area_sqm'::text, 'count'::text, 'bathroom_count'::text, 'lower_cabinet_length'::text, 'upper_cabinet_length'::text, 'homebar_length'::text, 'island_length'::text, 'partition_length'::text, 'manual_input'::text]));

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_calculation_multiplier_check" CHECK (calculation_multiplier >= 0::numeric);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_item_code_key" UNIQUE (item_code);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_min_quantity_check" CHECK (min_quantity IS NULL OR min_quantity >= 0::numeric);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_pkey" PRIMARY KEY (id);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_rounding_method_check" CHECK (rounding_method = ANY (ARRAY['none'::text, 'ceil'::text, 'floor'::text, 'round'::text]));

ALTER TABLE public."cost_publish_log" ADD CONSTRAINT "cost_publish_log_counts_check" CHECK (changed_item_count >= 0 AND price_change_count >= 0 AND margin_change_count >= 0 AND active_change_count >= 0 AND (duration_ms IS NULL OR duration_ms >= 0));

ALTER TABLE public."cost_publish_log" ADD CONSTRAINT "cost_publish_log_pkey" PRIMARY KEY (id);

ALTER TABLE public."cost_publish_log" ADD CONSTRAINT "cost_publish_log_version_key" UNIQUE (version);

ALTER TABLE public."customers" ADD CONSTRAINT "customers_pkey" PRIMARY KEY (id);

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_contract_no_format" CHECK (contract_no IS NULL OR contract_no ~ '^[A-Za-z0-9가-힣._-]{1,50}$'::text);

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_estimate_unique" UNIQUE (estimate_id);

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_pkey" PRIMARY KEY (id);

ALTER TABLE public."estimate_items" ADD CONSTRAINT "estimate_items_pkey" PRIMARY KEY (id);

ALTER TABLE public."estimates" ADD CONSTRAINT "estimates_pkey" PRIMARY KEY (id);

ALTER TABLE public."os_audit_logs" ADD CONSTRAINT "os_audit_logs_action_not_empty" CHECK (length(TRIM(BOTH FROM action)) > 0);

ALTER TABLE public."os_audit_logs" ADD CONSTRAINT "os_audit_logs_pkey" PRIMARY KEY (id);

ALTER TABLE public."os_audit_logs" ADD CONSTRAINT "os_audit_logs_result_not_empty" CHECK (length(TRIM(BOTH FROM result)) > 0);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text]));

ALTER TABLE public."projects" ADD CONSTRAINT "projects_pkey" PRIMARY KEY (id);

ALTER TABLE public."standard_spec_catalog" ADD CONSTRAINT "standard_spec_catalog_code_not_empty" CHECK (length(TRIM(BOTH FROM spec_code)) > 0);

ALTER TABLE public."standard_spec_catalog" ADD CONSTRAINT "standard_spec_catalog_code_version_unique" UNIQUE (spec_code, version);

ALTER TABLE public."standard_spec_catalog" ADD CONSTRAINT "standard_spec_catalog_effective_order" CHECK (effective_to IS NULL OR effective_to >= effective_from);

ALTER TABLE public."standard_spec_catalog" ADD CONSTRAINT "standard_spec_catalog_item_not_empty" CHECK (length(TRIM(BOTH FROM item_name)) > 0);

ALTER TABLE public."standard_spec_catalog" ADD CONSTRAINT "standard_spec_catalog_pkey" PRIMARY KEY (id);

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approvals_change_order_id_fkey" FOREIGN KEY (change_order_id) REFERENCES change_orders(id) ON DELETE RESTRICT;

ALTER TABLE public."change_order_approvals" ADD CONSTRAINT "change_order_approvals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE RESTRICT;

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_package_id_fkey" FOREIGN KEY (package_id) REFERENCES contract_package_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE public."change_orders" ADD CONSTRAINT "change_orders_pending_package_id_fkey" FOREIGN KEY (pending_package_id) REFERENCES contract_package_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_versions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public."contract_document_versions" ADD CONSTRAINT "contract_document_versions_package_id_fkey" FOREIGN KEY (package_id) REFERENCES contract_package_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_originating_change_order_fk" FOREIGN KEY (originating_change_order_id) REFERENCES change_orders(id) ON DELETE RESTRICT;

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_snapshots_confirmed_by_fkey" FOREIGN KEY (confirmed_by) REFERENCES auth.users(id);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_snapshots_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_snapshots_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE RESTRICT;

ALTER TABLE public."contract_package_snapshots" ADD CONSTRAINT "contract_package_snapshots_parent_package_id_fkey" FOREIGN KEY (parent_package_id) REFERENCES contract_package_snapshots(id) ON DELETE RESTRICT;

ALTER TABLE public."cost_item_history" ADD CONSTRAINT "cost_item_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id);

ALTER TABLE public."cost_item_history" ADD CONSTRAINT "cost_item_history_cost_item_id_fkey" FOREIGN KEY (cost_item_id) REFERENCES cost_items(id) ON DELETE CASCADE;

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_draft_updated_by_fkey" FOREIGN KEY (draft_updated_by) REFERENCES auth.users(id);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_source_cost_item_id_fkey" FOREIGN KEY (source_cost_item_id) REFERENCES cost_items(id);

ALTER TABLE public."cost_items" ADD CONSTRAINT "cost_items_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE public."cost_publish_log" ADD CONSTRAINT "cost_publish_log_published_by_fkey" FOREIGN KEY (published_by) REFERENCES auth.users(id);

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE RESTRICT;

ALTER TABLE public."estimate_document_options" ADD CONSTRAINT "estimate_document_options_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id);

ALTER TABLE public."estimate_items" ADD CONSTRAINT "estimate_items_estimate_id_fkey" FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE;

ALTER TABLE public."estimates" ADD CONSTRAINT "estimates_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX change_order_approvals_order_idx ON public.change_order_approvals USING btree (change_order_id, created_at DESC);

CREATE UNIQUE INDEX change_order_approvals_order_unique ON public.change_order_approvals USING btree (change_order_id);

CREATE TRIGGER change_order_approval_immutable_guard BEFORE DELETE OR UPDATE ON change_order_approvals FOR EACH ROW EXECUTE FUNCTION prevent_change_order_approval_mutation();

ALTER TABLE public."change_order_approvals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."change_order_approvals" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "change_order_approvals_select" ON public."change_order_approvals" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

REVOKE ALL ON TABLE public."change_order_approvals" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."change_order_approvals" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."change_order_approvals" TO "service_role";

CREATE INDEX change_orders_package_idx ON public.change_orders USING btree (package_id, change_version DESC);

CREATE UNIQUE INDEX change_orders_pending_one_idx ON public.change_orders USING btree (package_id) WHERE (status = 'CHANGE_PENDING'::text);

CREATE UNIQUE INDEX change_orders_pending_package_unique ON public.change_orders USING btree (pending_package_id) WHERE (pending_package_id IS NOT NULL);

CREATE TRIGGER change_order_lock_guard BEFORE DELETE OR UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION prevent_approved_change_order_mutation();

CREATE TRIGGER change_orders_updated_at BEFORE UPDATE ON change_orders FOR EACH ROW EXECUTE FUNCTION set_rfc006_updated_at();

ALTER TABLE public."change_orders" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."change_orders" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "change_orders_select" ON public."change_orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

REVOKE ALL ON TABLE public."change_orders" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."change_orders" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."change_orders" TO "service_role";

CREATE INDEX contract_document_package_idx ON public.contract_document_versions USING btree (package_id, package_version, document_type);

CREATE TRIGGER contract_document_lock_guard BEFORE DELETE OR UPDATE ON contract_document_versions FOR EACH ROW EXECUTE FUNCTION prevent_locked_contract_document_change();

ALTER TABLE public."contract_document_versions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."contract_document_versions" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "contract_document_versions_select" ON public."contract_document_versions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])));

REVOKE ALL ON TABLE public."contract_document_versions" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."contract_document_versions" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."contract_document_versions" TO "service_role";

CREATE UNIQUE INDEX contract_package_active_source_unique ON public.contract_package_snapshots USING btree (estimate_id, source_hash, template_version, rule_version) WHERE (status = ANY (ARRAY['DRAFT'::text, 'PREVIEWED'::text, 'READY'::text, 'CONTRACTED'::text, 'CHANGE_PENDING'::text]));

CREATE INDEX contract_package_contract_no_idx ON public.contract_package_snapshots USING btree (contract_no, estimate_id);

CREATE INDEX contract_package_estimate_idx ON public.contract_package_snapshots USING btree (estimate_id, package_version DESC);

CREATE INDEX contract_package_parent_idx ON public.contract_package_snapshots USING btree (parent_package_id, package_version DESC);

CREATE INDEX contract_package_status_idx ON public.contract_package_snapshots USING btree (status, created_at DESC);

CREATE TRIGGER contract_package_contract_no_guard BEFORE INSERT OR UPDATE ON contract_package_snapshots FOR EACH ROW EXECUTE FUNCTION prevent_contract_no_cross_estimate();

CREATE TRIGGER contract_package_snapshots_updated_at BEFORE UPDATE ON contract_package_snapshots FOR EACH ROW EXECUTE FUNCTION set_rfc006_updated_at();

CREATE TRIGGER contract_package_state_guard BEFORE DELETE OR UPDATE ON contract_package_snapshots FOR EACH ROW EXECUTE FUNCTION enforce_contract_package_state_transition();

ALTER TABLE public."contract_package_snapshots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."contract_package_snapshots" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "contract_package_snapshots_select" ON public."contract_package_snapshots" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])));

REVOKE ALL ON TABLE public."contract_package_snapshots" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."contract_package_snapshots" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."contract_package_snapshots" TO "service_role";

CREATE INDEX cost_item_history_item_idx ON public.cost_item_history USING btree (cost_item_id, changed_at DESC);

CREATE INDEX cost_item_history_version_idx ON public.cost_item_history USING btree (cost_version, changed_at DESC);

CREATE TRIGGER and_os_cost_item_history_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON cost_item_history FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();

ALTER TABLE public."cost_item_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."cost_item_history" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "cost_item_history_admin_manager_select" ON public."cost_item_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

REVOKE ALL ON TABLE public."cost_item_history" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_item_history" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_item_history" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_item_history" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_item_history" TO "service_role";

CREATE INDEX cost_items_active_sort_idx ON public.cost_items USING btree (is_active, sort_order, category);

CREATE INDEX cost_items_category_idx ON public.cost_items USING btree (category, subcategory);

CREATE INDEX cost_items_draft_idx ON public.cost_items USING btree (draft_updated_at DESC) WHERE (draft_updated_at IS NOT NULL);

CREATE INDEX cost_items_pending_idx ON public.cost_items USING btree (is_pending_new, draft_updated_at DESC) WHERE (is_pending_new = true);

CREATE TRIGGER and_os_cost_items_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON cost_items FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();

CREATE TRIGGER set_cost_items_updated_at BEFORE UPDATE ON cost_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public."cost_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."cost_items" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "cost_items_admin_manager_select" ON public."cost_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

REVOKE ALL ON TABLE public."cost_items" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_items" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_items" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_items" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_items" TO "service_role";

CREATE INDEX cost_publish_log_published_idx ON public.cost_publish_log USING btree (published_at DESC);

CREATE TRIGGER and_os_cost_publish_log_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON cost_publish_log FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();

ALTER TABLE public."cost_publish_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."cost_publish_log" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "cost_publish_log_admin_manager_select" ON public."cost_publish_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

REVOKE ALL ON TABLE public."cost_publish_log" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_publish_log" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_publish_log" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_publish_log" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."cost_publish_log" TO "service_role";

ALTER TABLE public."customers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."customers" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated customers access" ON public."customers" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public."customers" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."customers" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."customers" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."customers" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."customers" TO "service_role";

CREATE UNIQUE INDEX estimate_document_options_contract_no_unique ON public.estimate_document_options USING btree (contract_no) WHERE (contract_no IS NOT NULL);

CREATE INDEX estimate_document_options_estimate_idx ON public.estimate_document_options USING btree (estimate_id);

CREATE TRIGGER estimate_document_options_contract_no_guard BEFORE INSERT OR UPDATE ON estimate_document_options FOR EACH ROW EXECUTE FUNCTION prevent_contract_no_cross_estimate();

CREATE TRIGGER estimate_document_options_updated_at BEFORE UPDATE ON estimate_document_options FOR EACH ROW EXECUTE FUNCTION set_rfc006_updated_at();

ALTER TABLE public."estimate_document_options" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."estimate_document_options" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "estimate_document_options_select" ON public."estimate_document_options" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])));

REVOKE ALL ON TABLE public."estimate_document_options" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_document_options" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_document_options" TO "service_role";

ALTER TABLE public."estimate_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."estimate_items" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated estimate_items access" ON public."estimate_items" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public."estimate_items" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_items" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_items" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_items" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimate_items" TO "service_role";

ALTER TABLE public."estimates" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."estimates" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated estimates access" ON public."estimates" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public."estimates" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimates" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimates" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimates" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."estimates" TO "service_role";

CREATE INDEX os_audit_logs_action_idx ON public.os_audit_logs USING btree (action, created_at DESC);

CREATE INDEX os_audit_logs_actor_idx ON public.os_audit_logs USING btree (actor_user_id, created_at DESC);

CREATE INDEX os_audit_logs_created_idx ON public.os_audit_logs USING btree (created_at DESC);

ALTER TABLE public."os_audit_logs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."os_audit_logs" NO FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."os_audit_logs" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."os_audit_logs" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."os_audit_logs" TO "service_role";

CREATE UNIQUE INDEX profiles_email_lower_unique ON public.profiles USING btree (lower(email)) WHERE (email IS NOT NULL);

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_profiles_updated_at();

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."profiles" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((id = auth.uid()));

REVOKE ALL ON TABLE public."profiles" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."profiles" TO "postgres";

GRANT SELECT, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."profiles" TO "anon";

GRANT SELECT, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."profiles" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."profiles" TO "service_role";

ALTER TABLE public."projects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."projects" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "authenticated projects access" ON public."projects" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);

REVOKE ALL ON TABLE public."projects" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."projects" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."projects" TO "anon";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."projects" TO "authenticated";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."projects" TO "service_role";

CREATE INDEX standard_spec_catalog_active_idx ON public.standard_spec_catalog USING btree (is_active, sort_order, item_name);

CREATE UNIQUE INDEX standard_spec_catalog_one_active_idx ON public.standard_spec_catalog USING btree (spec_code) WHERE is_active;

CREATE TRIGGER standard_spec_catalog_updated_at BEFORE UPDATE ON standard_spec_catalog FOR EACH ROW EXECUTE FUNCTION set_rfc006_updated_at();

ALTER TABLE public."standard_spec_catalog" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."standard_spec_catalog" NO FORCE ROW LEVEL SECURITY;

CREATE POLICY "standard_spec_catalog_select" ON public."standard_spec_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text, 'staff'::text])));

REVOKE ALL ON TABLE public."standard_spec_catalog" FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."standard_spec_catalog" TO "postgres";

GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public."standard_spec_catalog" TO "service_role";

GRANT SELECT ON TABLE public."standard_spec_catalog" TO "authenticated";

REVOKE ALL ON FUNCTION public."and_os_now"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."and_os_now"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."and_os_now"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."and_os_now"() TO "anon";

GRANT EXECUTE ON FUNCTION public."and_os_now"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."and_os_now"() TO "service_role";

REVOKE ALL ON FUNCTION public."and_os_require_cost_rpc_mutation"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."and_os_require_cost_rpc_mutation"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."and_os_require_cost_rpc_mutation"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."and_os_require_cost_rpc_mutation"() TO "anon";

GRANT EXECUTE ON FUNCTION public."and_os_require_cost_rpc_mutation"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."and_os_require_cost_rpc_mutation"() TO "service_role";

REVOKE ALL ON FUNCTION public."approve_contract_change_order"(p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."approve_contract_change_order"(p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION public."approve_contract_change_order"(p_actor_user_id uuid, p_change_order_id uuid, p_payload jsonb) TO "service_role";

REVOKE ALL ON FUNCTION public."cancel_all_cost_drafts"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."cancel_all_cost_drafts"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."cancel_all_cost_drafts"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."cancel_all_cost_drafts"() TO "service_role";

REVOKE ALL ON FUNCTION public."cancel_cost_item_draft"(p_cost_item_id uuid) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."cancel_cost_item_draft"(p_cost_item_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."cancel_cost_item_draft"(p_cost_item_id uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."cancel_cost_item_draft"(p_cost_item_id uuid) TO "service_role";

REVOKE ALL ON FUNCTION public."confirm_contract_package_snapshot"(p_package_id uuid, p_actor_user_id uuid) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."confirm_contract_package_snapshot"(p_package_id uuid, p_actor_user_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."confirm_contract_package_snapshot"(p_package_id uuid, p_actor_user_id uuid) TO "service_role";

REVOKE ALL ON FUNCTION public."create_contract_change_order"(p_actor_user_id uuid, p_payload jsonb) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."create_contract_change_order"(p_actor_user_id uuid, p_payload jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION public."create_contract_change_order"(p_actor_user_id uuid, p_payload jsonb) TO "service_role";

REVOKE ALL ON FUNCTION public."create_contract_package_snapshot"(p_actor_user_id uuid, p_payload jsonb) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."create_contract_package_snapshot"(p_actor_user_id uuid, p_payload jsonb) TO "postgres";

GRANT EXECUTE ON FUNCTION public."create_contract_package_snapshot"(p_actor_user_id uuid, p_payload jsonb) TO "service_role";

REVOKE ALL ON FUNCTION public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) TO "postgres";

GRANT EXECUTE ON FUNCTION public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) TO "service_role";

REVOKE ALL ON FUNCTION public."current_and_os_role"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."current_and_os_role"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."current_and_os_role"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."current_and_os_role"() TO "anon";

GRANT EXECUTE ON FUNCTION public."current_and_os_role"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."current_and_os_role"() TO "service_role";

REVOKE ALL ON FUNCTION public."enforce_contract_package_state_transition"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."enforce_contract_package_state_transition"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."enforce_contract_package_state_transition"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."enforce_contract_package_state_transition"() TO "anon";

GRANT EXECUTE ON FUNCTION public."enforce_contract_package_state_transition"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."enforce_contract_package_state_transition"() TO "service_role";

REVOKE ALL ON FUNCTION public."is_and_os_admin"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."is_and_os_admin"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."is_and_os_admin"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."is_and_os_admin"() TO "anon";

GRANT EXECUTE ON FUNCTION public."is_and_os_admin"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."is_and_os_admin"() TO "service_role";

REVOKE ALL ON FUNCTION public."next_cost_publish_version"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."next_cost_publish_version"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."next_cost_publish_version"() TO "service_role";

REVOKE ALL ON FUNCTION public."prevent_approved_change_order_mutation"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."prevent_approved_change_order_mutation"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."prevent_approved_change_order_mutation"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."prevent_approved_change_order_mutation"() TO "anon";

GRANT EXECUTE ON FUNCTION public."prevent_approved_change_order_mutation"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."prevent_approved_change_order_mutation"() TO "service_role";

REVOKE ALL ON FUNCTION public."prevent_change_order_approval_mutation"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."prevent_change_order_approval_mutation"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."prevent_change_order_approval_mutation"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."prevent_change_order_approval_mutation"() TO "anon";

GRANT EXECUTE ON FUNCTION public."prevent_change_order_approval_mutation"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."prevent_change_order_approval_mutation"() TO "service_role";

REVOKE ALL ON FUNCTION public."prevent_contract_no_cross_estimate"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."prevent_contract_no_cross_estimate"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."prevent_contract_no_cross_estimate"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."prevent_contract_no_cross_estimate"() TO "anon";

GRANT EXECUTE ON FUNCTION public."prevent_contract_no_cross_estimate"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."prevent_contract_no_cross_estimate"() TO "service_role";

REVOKE ALL ON FUNCTION public."prevent_locked_contract_document_change"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."prevent_locked_contract_document_change"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."prevent_locked_contract_document_change"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."prevent_locked_contract_document_change"() TO "anon";

GRANT EXECUTE ON FUNCTION public."prevent_locked_contract_document_change"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."prevent_locked_contract_document_change"() TO "service_role";

REVOKE ALL ON FUNCTION public."publish_cost_drafts"(p_reason text, p_memo text) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."publish_cost_drafts"(p_reason text, p_memo text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."publish_cost_drafts"(p_reason text, p_memo text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."publish_cost_drafts"(p_reason text, p_memo text) TO "service_role";

REVOKE ALL ON FUNCTION public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) TO "service_role";

REVOKE ALL ON FUNCTION public."set_profiles_updated_at"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."set_profiles_updated_at"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."set_profiles_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."set_profiles_updated_at"() TO "anon";

GRANT EXECUTE ON FUNCTION public."set_profiles_updated_at"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."set_profiles_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION public."set_rfc006_updated_at"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."set_rfc006_updated_at"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."set_rfc006_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."set_rfc006_updated_at"() TO "anon";

GRANT EXECUTE ON FUNCTION public."set_rfc006_updated_at"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."set_rfc006_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION public."set_updated_at"() FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO "postgres";

GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO "anon";

GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."set_updated_at"() TO "service_role";

REVOKE ALL ON FUNCTION public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) TO "postgres";

GRANT EXECUTE ON FUNCTION public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) TO "service_role";

REVOKE ALL ON FUNCTION public."validate_and_os_cost_item_code"(p_item_code text) FROM PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION public."validate_and_os_cost_item_code"(p_item_code text) TO "postgres";

GRANT EXECUTE ON FUNCTION public."validate_and_os_cost_item_code"(p_item_code text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."validate_and_os_cost_item_code"(p_item_code text) TO "service_role";

COMMIT;
