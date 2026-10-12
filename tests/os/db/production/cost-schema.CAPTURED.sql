-- CAPTURED PRODUCTION METADATA; LOCAL TEST INSTALL ONLY. NO PRICE SEEDS OR BUSINESS ROWS.

-- Generated from the JSON baseline; not a production migration.

do $$ begin if not exists(select 1 from public.and_os_2b_test_marker where project_id='and-os-security-test') then raise exception 'Owned local test DB required'; end if; end $$;

create table if not exists public."cost_item_history" (
  "id" uuid default gen_random_uuid() not null,
  "cost_item_id" uuid not null,
  "old_cost_price" numeric,
  "new_cost_price" numeric,
  "old_margin_rate" numeric,
  "new_margin_rate" numeric,
  "changed_by" uuid,
  "changed_at" timestamp with time zone default now() not null,
  "reason" text,
  "cost_version" text,
  "old_is_active" boolean,
  "new_is_active" boolean
);

alter table public."cost_item_history" add column if not exists "id" uuid default gen_random_uuid() not null;

alter table public."cost_item_history" alter column "id" set not null;

alter table public."cost_item_history" alter column "id" set default gen_random_uuid();

alter table public."cost_item_history" add column if not exists "cost_item_id" uuid not null;

alter table public."cost_item_history" alter column "cost_item_id" set not null;

alter table public."cost_item_history" alter column "cost_item_id" drop default;

alter table public."cost_item_history" add column if not exists "old_cost_price" numeric;

alter table public."cost_item_history" alter column "old_cost_price" drop not null;

alter table public."cost_item_history" alter column "old_cost_price" drop default;

alter table public."cost_item_history" add column if not exists "new_cost_price" numeric;

alter table public."cost_item_history" alter column "new_cost_price" drop not null;

alter table public."cost_item_history" alter column "new_cost_price" drop default;

alter table public."cost_item_history" add column if not exists "old_margin_rate" numeric;

alter table public."cost_item_history" alter column "old_margin_rate" drop not null;

alter table public."cost_item_history" alter column "old_margin_rate" drop default;

alter table public."cost_item_history" add column if not exists "new_margin_rate" numeric;

alter table public."cost_item_history" alter column "new_margin_rate" drop not null;

alter table public."cost_item_history" alter column "new_margin_rate" drop default;

alter table public."cost_item_history" add column if not exists "changed_by" uuid;

alter table public."cost_item_history" alter column "changed_by" drop not null;

alter table public."cost_item_history" alter column "changed_by" drop default;

alter table public."cost_item_history" add column if not exists "changed_at" timestamp with time zone default now() not null;

alter table public."cost_item_history" alter column "changed_at" set not null;

alter table public."cost_item_history" alter column "changed_at" set default now();

alter table public."cost_item_history" add column if not exists "reason" text;

alter table public."cost_item_history" alter column "reason" drop not null;

alter table public."cost_item_history" alter column "reason" drop default;

alter table public."cost_item_history" add column if not exists "cost_version" text;

alter table public."cost_item_history" alter column "cost_version" drop not null;

alter table public."cost_item_history" alter column "cost_version" drop default;

alter table public."cost_item_history" add column if not exists "old_is_active" boolean;

alter table public."cost_item_history" alter column "old_is_active" drop not null;

alter table public."cost_item_history" alter column "old_is_active" drop default;

alter table public."cost_item_history" add column if not exists "new_is_active" boolean;

alter table public."cost_item_history" alter column "new_is_active" drop not null;

alter table public."cost_item_history" alter column "new_is_active" drop default;

create table if not exists public."cost_items" (
  "id" uuid default gen_random_uuid() not null,
  "category" text not null,
  "subcategory" text,
  "item_code" text not null,
  "item_name" text not null,
  "unit" text not null,
  "cost_price" numeric default 0 not null,
  "default_margin_rate" numeric default 0.35 not null,
  "customer_name" text,
  "order_name" text,
  "include_in_customer_quote" boolean default true not null,
  "include_in_internal_quote" boolean default true not null,
  "include_in_order_sheet" boolean default false not null,
  "is_material" boolean default false not null,
  "is_labor" boolean default false not null,
  "is_service" boolean default false not null,
  "supplier_name" text,
  "supplier_phone" text,
  "supplier_memo" text,
  "is_active" boolean default true not null,
  "sort_order" integer default 0 not null,
  "memo" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "updated_by" uuid,
  "draft_cost_price" numeric,
  "draft_margin_rate" numeric,
  "draft_is_active" boolean,
  "draft_updated_at" timestamp with time zone,
  "draft_updated_by" uuid,
  "calculation_basis" text default 'manual_input'::text not null,
  "calculation_multiplier" numeric default 1 not null,
  "min_quantity" numeric,
  "rounding_method" text default 'none'::text not null,
  "is_pending_new" boolean default false not null,
  "source_cost_item_id" uuid
);

alter table public."cost_items" add column if not exists "id" uuid default gen_random_uuid() not null;

alter table public."cost_items" alter column "id" set not null;

alter table public."cost_items" alter column "id" set default gen_random_uuid();

alter table public."cost_items" add column if not exists "category" text not null;

alter table public."cost_items" alter column "category" set not null;

alter table public."cost_items" alter column "category" drop default;

alter table public."cost_items" add column if not exists "subcategory" text;

alter table public."cost_items" alter column "subcategory" drop not null;

alter table public."cost_items" alter column "subcategory" drop default;

alter table public."cost_items" add column if not exists "item_code" text not null;

alter table public."cost_items" alter column "item_code" set not null;

alter table public."cost_items" alter column "item_code" drop default;

alter table public."cost_items" add column if not exists "item_name" text not null;

alter table public."cost_items" alter column "item_name" set not null;

alter table public."cost_items" alter column "item_name" drop default;

alter table public."cost_items" add column if not exists "unit" text not null;

alter table public."cost_items" alter column "unit" set not null;

alter table public."cost_items" alter column "unit" drop default;

alter table public."cost_items" add column if not exists "cost_price" numeric default 0 not null;

alter table public."cost_items" alter column "cost_price" set not null;

alter table public."cost_items" alter column "cost_price" set default 0;

alter table public."cost_items" add column if not exists "default_margin_rate" numeric default 0.35 not null;

alter table public."cost_items" alter column "default_margin_rate" set not null;

alter table public."cost_items" alter column "default_margin_rate" set default 0.35;

alter table public."cost_items" add column if not exists "customer_name" text;

alter table public."cost_items" alter column "customer_name" drop not null;

alter table public."cost_items" alter column "customer_name" drop default;

alter table public."cost_items" add column if not exists "order_name" text;

alter table public."cost_items" alter column "order_name" drop not null;

alter table public."cost_items" alter column "order_name" drop default;

alter table public."cost_items" add column if not exists "include_in_customer_quote" boolean default true not null;

alter table public."cost_items" alter column "include_in_customer_quote" set not null;

alter table public."cost_items" alter column "include_in_customer_quote" set default true;

alter table public."cost_items" add column if not exists "include_in_internal_quote" boolean default true not null;

alter table public."cost_items" alter column "include_in_internal_quote" set not null;

alter table public."cost_items" alter column "include_in_internal_quote" set default true;

alter table public."cost_items" add column if not exists "include_in_order_sheet" boolean default false not null;

alter table public."cost_items" alter column "include_in_order_sheet" set not null;

alter table public."cost_items" alter column "include_in_order_sheet" set default false;

alter table public."cost_items" add column if not exists "is_material" boolean default false not null;

alter table public."cost_items" alter column "is_material" set not null;

alter table public."cost_items" alter column "is_material" set default false;

alter table public."cost_items" add column if not exists "is_labor" boolean default false not null;

alter table public."cost_items" alter column "is_labor" set not null;

alter table public."cost_items" alter column "is_labor" set default false;

alter table public."cost_items" add column if not exists "is_service" boolean default false not null;

alter table public."cost_items" alter column "is_service" set not null;

alter table public."cost_items" alter column "is_service" set default false;

alter table public."cost_items" add column if not exists "supplier_name" text;

alter table public."cost_items" alter column "supplier_name" drop not null;

alter table public."cost_items" alter column "supplier_name" drop default;

alter table public."cost_items" add column if not exists "supplier_phone" text;

alter table public."cost_items" alter column "supplier_phone" drop not null;

alter table public."cost_items" alter column "supplier_phone" drop default;

alter table public."cost_items" add column if not exists "supplier_memo" text;

alter table public."cost_items" alter column "supplier_memo" drop not null;

alter table public."cost_items" alter column "supplier_memo" drop default;

alter table public."cost_items" add column if not exists "is_active" boolean default true not null;

alter table public."cost_items" alter column "is_active" set not null;

alter table public."cost_items" alter column "is_active" set default true;

alter table public."cost_items" add column if not exists "sort_order" integer default 0 not null;

alter table public."cost_items" alter column "sort_order" set not null;

alter table public."cost_items" alter column "sort_order" set default 0;

alter table public."cost_items" add column if not exists "memo" text;

alter table public."cost_items" alter column "memo" drop not null;

alter table public."cost_items" alter column "memo" drop default;

alter table public."cost_items" add column if not exists "created_at" timestamp with time zone default now() not null;

alter table public."cost_items" alter column "created_at" set not null;

alter table public."cost_items" alter column "created_at" set default now();

alter table public."cost_items" add column if not exists "updated_at" timestamp with time zone default now() not null;

alter table public."cost_items" alter column "updated_at" set not null;

alter table public."cost_items" alter column "updated_at" set default now();

alter table public."cost_items" add column if not exists "updated_by" uuid;

alter table public."cost_items" alter column "updated_by" drop not null;

alter table public."cost_items" alter column "updated_by" drop default;

alter table public."cost_items" add column if not exists "draft_cost_price" numeric;

alter table public."cost_items" alter column "draft_cost_price" drop not null;

alter table public."cost_items" alter column "draft_cost_price" drop default;

alter table public."cost_items" add column if not exists "draft_margin_rate" numeric;

alter table public."cost_items" alter column "draft_margin_rate" drop not null;

alter table public."cost_items" alter column "draft_margin_rate" drop default;

alter table public."cost_items" add column if not exists "draft_is_active" boolean;

alter table public."cost_items" alter column "draft_is_active" drop not null;

alter table public."cost_items" alter column "draft_is_active" drop default;

alter table public."cost_items" add column if not exists "draft_updated_at" timestamp with time zone;

alter table public."cost_items" alter column "draft_updated_at" drop not null;

alter table public."cost_items" alter column "draft_updated_at" drop default;

alter table public."cost_items" add column if not exists "draft_updated_by" uuid;

alter table public."cost_items" alter column "draft_updated_by" drop not null;

alter table public."cost_items" alter column "draft_updated_by" drop default;

alter table public."cost_items" add column if not exists "calculation_basis" text default 'manual_input'::text not null;

alter table public."cost_items" alter column "calculation_basis" set not null;

alter table public."cost_items" alter column "calculation_basis" set default 'manual_input'::text;

alter table public."cost_items" add column if not exists "calculation_multiplier" numeric default 1 not null;

alter table public."cost_items" alter column "calculation_multiplier" set not null;

alter table public."cost_items" alter column "calculation_multiplier" set default 1;

alter table public."cost_items" add column if not exists "min_quantity" numeric;

alter table public."cost_items" alter column "min_quantity" drop not null;

alter table public."cost_items" alter column "min_quantity" drop default;

alter table public."cost_items" add column if not exists "rounding_method" text default 'none'::text not null;

alter table public."cost_items" alter column "rounding_method" set not null;

alter table public."cost_items" alter column "rounding_method" set default 'none'::text;

alter table public."cost_items" add column if not exists "is_pending_new" boolean default false not null;

alter table public."cost_items" alter column "is_pending_new" set not null;

alter table public."cost_items" alter column "is_pending_new" set default false;

alter table public."cost_items" add column if not exists "source_cost_item_id" uuid;

alter table public."cost_items" alter column "source_cost_item_id" drop not null;

alter table public."cost_items" alter column "source_cost_item_id" drop default;

create table if not exists public."cost_publish_log" (
  "id" uuid default gen_random_uuid() not null,
  "version" text not null,
  "reason" text not null,
  "published_by" uuid not null,
  "published_at" timestamp with time zone default now() not null,
  "changed_item_count" integer default 0 not null,
  "price_change_count" integer default 0 not null,
  "margin_change_count" integer default 0 not null,
  "active_change_count" integer default 0 not null,
  "duration_ms" integer,
  "memo" text,
  "created_at" timestamp with time zone default now() not null
);

alter table public."cost_publish_log" add column if not exists "id" uuid default gen_random_uuid() not null;

alter table public."cost_publish_log" alter column "id" set not null;

alter table public."cost_publish_log" alter column "id" set default gen_random_uuid();

alter table public."cost_publish_log" add column if not exists "version" text not null;

alter table public."cost_publish_log" alter column "version" set not null;

alter table public."cost_publish_log" alter column "version" drop default;

alter table public."cost_publish_log" add column if not exists "reason" text not null;

alter table public."cost_publish_log" alter column "reason" set not null;

alter table public."cost_publish_log" alter column "reason" drop default;

alter table public."cost_publish_log" add column if not exists "published_by" uuid not null;

alter table public."cost_publish_log" alter column "published_by" set not null;

alter table public."cost_publish_log" alter column "published_by" drop default;

alter table public."cost_publish_log" add column if not exists "published_at" timestamp with time zone default now() not null;

alter table public."cost_publish_log" alter column "published_at" set not null;

alter table public."cost_publish_log" alter column "published_at" set default now();

alter table public."cost_publish_log" add column if not exists "changed_item_count" integer default 0 not null;

alter table public."cost_publish_log" alter column "changed_item_count" set not null;

alter table public."cost_publish_log" alter column "changed_item_count" set default 0;

alter table public."cost_publish_log" add column if not exists "price_change_count" integer default 0 not null;

alter table public."cost_publish_log" alter column "price_change_count" set not null;

alter table public."cost_publish_log" alter column "price_change_count" set default 0;

alter table public."cost_publish_log" add column if not exists "margin_change_count" integer default 0 not null;

alter table public."cost_publish_log" alter column "margin_change_count" set not null;

alter table public."cost_publish_log" alter column "margin_change_count" set default 0;

alter table public."cost_publish_log" add column if not exists "active_change_count" integer default 0 not null;

alter table public."cost_publish_log" alter column "active_change_count" set not null;

alter table public."cost_publish_log" alter column "active_change_count" set default 0;

alter table public."cost_publish_log" add column if not exists "duration_ms" integer;

alter table public."cost_publish_log" alter column "duration_ms" drop not null;

alter table public."cost_publish_log" alter column "duration_ms" drop default;

alter table public."cost_publish_log" add column if not exists "memo" text;

alter table public."cost_publish_log" alter column "memo" drop not null;

alter table public."cost_publish_log" alter column "memo" drop default;

alter table public."cost_publish_log" add column if not exists "created_at" timestamp with time zone default now() not null;

alter table public."cost_publish_log" alter column "created_at" set not null;

alter table public."cost_publish_log" alter column "created_at" set default now();

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_item_history"'::regclass and conname='cost_item_history_changed_by_fkey') then alter table public."cost_item_history" add constraint "cost_item_history_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_item_history"'::regclass and conname='cost_item_history_cost_item_id_fkey') then alter table public."cost_item_history" add constraint "cost_item_history_cost_item_id_fkey" FOREIGN KEY (cost_item_id) REFERENCES cost_items(id) ON DELETE CASCADE; end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_item_history"'::regclass and conname='cost_item_history_pkey') then alter table public."cost_item_history" add constraint "cost_item_history_pkey" PRIMARY KEY (id); end if; end $$;

CREATE INDEX IF NOT EXISTS cost_item_history_item_idx ON public.cost_item_history USING btree (cost_item_id, changed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS cost_item_history_pkey ON public.cost_item_history USING btree (id);

CREATE INDEX IF NOT EXISTS cost_item_history_version_idx ON public.cost_item_history USING btree (cost_version, changed_at DESC);

alter table public."cost_item_history" enable row level security;

alter table public."cost_item_history" no force row level security;

do $$ declare p record; begin for p in select polname from pg_policy where polrelid='public."cost_item_history"'::regclass loop execute format('drop policy %I on public."cost_item_history"',p.polname); end loop; end $$;

drop policy if exists "cost_item_history_admin_manager_select" on public."cost_item_history";

create policy "cost_item_history_admin_manager_select" on public."cost_item_history" as PERMISSIVE for SELECT to "authenticated" using ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

revoke all on table public."cost_item_history" from public, anon, authenticated, service_role;

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_item_history" to "postgres";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_item_history" to "anon";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_item_history" to "authenticated";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_item_history" to "service_role";

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_calculation_basis_check') then alter table public."cost_items" add constraint "cost_items_calculation_basis_check" CHECK ((calculation_basis = ANY (ARRAY['fixed'::text, 'apartment_pyeong'::text, 'flooring_pyeong'::text, 'length_mm'::text, 'length_m'::text, 'area_sqm'::text, 'count'::text, 'bathroom_count'::text, 'lower_cabinet_length'::text, 'upper_cabinet_length'::text, 'homebar_length'::text, 'island_length'::text, 'partition_length'::text, 'manual_input'::text]))); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_calculation_multiplier_check') then alter table public."cost_items" add constraint "cost_items_calculation_multiplier_check" CHECK ((calculation_multiplier >= (0)::numeric)); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_draft_updated_by_fkey') then alter table public."cost_items" add constraint "cost_items_draft_updated_by_fkey" FOREIGN KEY (draft_updated_by) REFERENCES auth.users(id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_item_code_key') then alter table public."cost_items" add constraint "cost_items_item_code_key" UNIQUE (item_code); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_min_quantity_check') then alter table public."cost_items" add constraint "cost_items_min_quantity_check" CHECK (((min_quantity IS NULL) OR (min_quantity >= (0)::numeric))); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_pkey') then alter table public."cost_items" add constraint "cost_items_pkey" PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_rounding_method_check') then alter table public."cost_items" add constraint "cost_items_rounding_method_check" CHECK ((rounding_method = ANY (ARRAY['none'::text, 'ceil'::text, 'floor'::text, 'round'::text]))); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_source_cost_item_id_fkey') then alter table public."cost_items" add constraint "cost_items_source_cost_item_id_fkey" FOREIGN KEY (source_cost_item_id) REFERENCES cost_items(id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_items"'::regclass and conname='cost_items_updated_by_fkey') then alter table public."cost_items" add constraint "cost_items_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id); end if; end $$;

CREATE INDEX IF NOT EXISTS cost_items_active_sort_idx ON public.cost_items USING btree (is_active, sort_order, category);

CREATE INDEX IF NOT EXISTS cost_items_category_idx ON public.cost_items USING btree (category, subcategory);

CREATE INDEX IF NOT EXISTS cost_items_draft_idx ON public.cost_items USING btree (draft_updated_at DESC) WHERE (draft_updated_at IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS cost_items_item_code_key ON public.cost_items USING btree (item_code);

CREATE INDEX IF NOT EXISTS cost_items_pending_idx ON public.cost_items USING btree (is_pending_new, draft_updated_at DESC) WHERE (is_pending_new = true);

CREATE UNIQUE INDEX IF NOT EXISTS cost_items_pkey ON public.cost_items USING btree (id);

alter table public."cost_items" enable row level security;

alter table public."cost_items" no force row level security;

do $$ declare p record; begin for p in select polname from pg_policy where polrelid='public."cost_items"'::regclass loop execute format('drop policy %I on public."cost_items"',p.polname); end loop; end $$;

drop policy if exists "cost_items_admin_manager_select" on public."cost_items";

create policy "cost_items_admin_manager_select" on public."cost_items" as PERMISSIVE for SELECT to "authenticated" using ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

revoke all on table public."cost_items" from public, anon, authenticated, service_role;

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_items" to "postgres";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_items" to "anon";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_items" to "authenticated";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_items" to "service_role";

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_publish_log"'::regclass and conname='cost_publish_log_counts_check') then alter table public."cost_publish_log" add constraint "cost_publish_log_counts_check" CHECK (((changed_item_count >= 0) AND (price_change_count >= 0) AND (margin_change_count >= 0) AND (active_change_count >= 0) AND ((duration_ms IS NULL) OR (duration_ms >= 0)))); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_publish_log"'::regclass and conname='cost_publish_log_pkey') then alter table public."cost_publish_log" add constraint "cost_publish_log_pkey" PRIMARY KEY (id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_publish_log"'::regclass and conname='cost_publish_log_published_by_fkey') then alter table public."cost_publish_log" add constraint "cost_publish_log_published_by_fkey" FOREIGN KEY (published_by) REFERENCES auth.users(id); end if; end $$;

do $$ begin if not exists(select 1 from pg_constraint where conrelid='public."cost_publish_log"'::regclass and conname='cost_publish_log_version_key') then alter table public."cost_publish_log" add constraint "cost_publish_log_version_key" UNIQUE (version); end if; end $$;

CREATE UNIQUE INDEX IF NOT EXISTS cost_publish_log_pkey ON public.cost_publish_log USING btree (id);

CREATE INDEX IF NOT EXISTS cost_publish_log_published_idx ON public.cost_publish_log USING btree (published_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS cost_publish_log_version_key ON public.cost_publish_log USING btree (version);

alter table public."cost_publish_log" enable row level security;

alter table public."cost_publish_log" no force row level security;

do $$ declare p record; begin for p in select polname from pg_policy where polrelid='public."cost_publish_log"'::regclass loop execute format('drop policy %I on public."cost_publish_log"',p.polname); end loop; end $$;

drop policy if exists "cost_publish_log_admin_manager_select" on public."cost_publish_log";

create policy "cost_publish_log_admin_manager_select" on public."cost_publish_log" as PERMISSIVE for SELECT to "authenticated" using ((current_and_os_role() = ANY (ARRAY['admin'::text, 'manager'::text])));

revoke all on table public."cost_publish_log" from public, anon, authenticated, service_role;

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_publish_log" to "postgres";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_publish_log" to "anon";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_publish_log" to "authenticated";

-- PG17 MAINTAIN ACL remains in captured JSON; isolated PG15 has no MAINTAIN privilege.

grant insert, select, update, delete, truncate, references, trigger on table public."cost_publish_log" to "service_role";

CREATE OR REPLACE FUNCTION public.and_os_require_cost_rpc_mutation()
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

revoke all on function public."and_os_require_cost_rpc_mutation"() from public, anon, authenticated, service_role;

grant execute on function public."and_os_require_cost_rpc_mutation"() to public;

grant execute on function public."and_os_require_cost_rpc_mutation"() to "postgres";

grant execute on function public."and_os_require_cost_rpc_mutation"() to "anon";

grant execute on function public."and_os_require_cost_rpc_mutation"() to "authenticated";

grant execute on function public."and_os_require_cost_rpc_mutation"() to "service_role";

CREATE OR REPLACE FUNCTION public.cancel_all_cost_drafts()
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

revoke all on function public."cancel_all_cost_drafts"() from public, anon, authenticated, service_role;

grant execute on function public."cancel_all_cost_drafts"() to "postgres";

grant execute on function public."cancel_all_cost_drafts"() to "authenticated";

grant execute on function public."cancel_all_cost_drafts"() to "service_role";

CREATE OR REPLACE FUNCTION public.cancel_cost_item_draft(p_cost_item_id uuid)
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

revoke all on function public."cancel_cost_item_draft"(p_cost_item_id uuid) from public, anon, authenticated, service_role;

grant execute on function public."cancel_cost_item_draft"(p_cost_item_id uuid) to "postgres";

grant execute on function public."cancel_cost_item_draft"(p_cost_item_id uuid) to "authenticated";

grant execute on function public."cancel_cost_item_draft"(p_cost_item_id uuid) to "service_role";

CREATE OR REPLACE FUNCTION public.create_cost_item_pending(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false, p_source_cost_item_id uuid DEFAULT NULL::uuid)
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

revoke all on function public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) from public, anon, authenticated, service_role;

grant execute on function public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) to "postgres";

grant execute on function public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) to "authenticated";

grant execute on function public."create_cost_item_pending"(p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean, p_source_cost_item_id uuid) to "service_role";

CREATE OR REPLACE FUNCTION public.current_and_os_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select lower(role) from public.profiles where id = auth.uid() limit 1), 'staff');
$function$;

revoke all on function public."current_and_os_role"() from public, anon, authenticated, service_role;

grant execute on function public."current_and_os_role"() to public;

grant execute on function public."current_and_os_role"() to "postgres";

grant execute on function public."current_and_os_role"() to "anon";

grant execute on function public."current_and_os_role"() to "authenticated";

grant execute on function public."current_and_os_role"() to "service_role";

CREATE OR REPLACE FUNCTION public.is_and_os_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.current_and_os_role() = 'admin';
$function$;

revoke all on function public."is_and_os_admin"() from public, anon, authenticated, service_role;

grant execute on function public."is_and_os_admin"() to public;

grant execute on function public."is_and_os_admin"() to "postgres";

grant execute on function public."is_and_os_admin"() to "anon";

grant execute on function public."is_and_os_admin"() to "authenticated";

grant execute on function public."is_and_os_admin"() to "service_role";

CREATE OR REPLACE FUNCTION public.next_cost_publish_version()
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

revoke all on function public."next_cost_publish_version"() from public, anon, authenticated, service_role;

grant execute on function public."next_cost_publish_version"() to "postgres";

grant execute on function public."next_cost_publish_version"() to "service_role";

CREATE OR REPLACE FUNCTION public.publish_cost_drafts(p_reason text, p_memo text DEFAULT NULL::text)
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

revoke all on function public."publish_cost_drafts"(p_reason text, p_memo text) from public, anon, authenticated, service_role;

grant execute on function public."publish_cost_drafts"(p_reason text, p_memo text) to "postgres";

grant execute on function public."publish_cost_drafts"(p_reason text, p_memo text) to "authenticated";

grant execute on function public."publish_cost_drafts"(p_reason text, p_memo text) to "service_role";

CREATE OR REPLACE FUNCTION public.save_cost_item_draft(p_cost_item_id uuid, p_draft_cost_price numeric DEFAULT NULL::numeric, p_draft_margin_rate numeric DEFAULT NULL::numeric, p_draft_is_active boolean DEFAULT NULL::boolean)
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

revoke all on function public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) from public, anon, authenticated, service_role;

grant execute on function public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) to "postgres";

grant execute on function public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) to "authenticated";

grant execute on function public."save_cost_item_draft"(p_cost_item_id uuid, p_draft_cost_price numeric, p_draft_margin_rate numeric, p_draft_is_active boolean) to "service_role";

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function public."set_updated_at"() from public, anon, authenticated, service_role;

grant execute on function public."set_updated_at"() to public;

grant execute on function public."set_updated_at"() to "postgres";

grant execute on function public."set_updated_at"() to "anon";

grant execute on function public."set_updated_at"() to "authenticated";

grant execute on function public."set_updated_at"() to "service_role";

CREATE OR REPLACE FUNCTION public.update_cost_item_pending(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text DEFAULT NULL::text, p_customer_name text DEFAULT NULL::text, p_order_name text DEFAULT NULL::text, p_calculation_multiplier numeric DEFAULT 1, p_min_quantity numeric DEFAULT NULL::numeric, p_rounding_method text DEFAULT 'none'::text, p_include_in_customer_quote boolean DEFAULT true, p_include_in_internal_quote boolean DEFAULT true, p_include_in_order_sheet boolean DEFAULT false, p_is_material boolean DEFAULT false, p_is_labor boolean DEFAULT false, p_is_service boolean DEFAULT false)
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

revoke all on function public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) from public, anon, authenticated, service_role;

grant execute on function public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) to "postgres";

grant execute on function public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) to "authenticated";

grant execute on function public."update_cost_item_pending"(p_cost_item_id uuid, p_item_code text, p_category text, p_subcategory text, p_item_name text, p_unit text, p_calculation_basis text, p_cost_price numeric, p_margin_rate numeric, p_is_active boolean, p_sort_order integer, p_memo text, p_customer_name text, p_order_name text, p_calculation_multiplier numeric, p_min_quantity numeric, p_rounding_method text, p_include_in_customer_quote boolean, p_include_in_internal_quote boolean, p_include_in_order_sheet boolean, p_is_material boolean, p_is_labor boolean, p_is_service boolean) to "service_role";

CREATE OR REPLACE FUNCTION public.validate_and_os_cost_item_code(p_item_code text)
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

revoke all on function public."validate_and_os_cost_item_code"(p_item_code text) from public, anon, authenticated, service_role;

grant execute on function public."validate_and_os_cost_item_code"(p_item_code text) to "postgres";

grant execute on function public."validate_and_os_cost_item_code"(p_item_code text) to "authenticated";

grant execute on function public."validate_and_os_cost_item_code"(p_item_code text) to "service_role";

drop trigger if exists "and_os_cost_item_history_mutation_guard" on public."cost_item_history";

CREATE TRIGGER and_os_cost_item_history_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_item_history FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();

drop trigger if exists "and_os_cost_items_mutation_guard" on public."cost_items";

CREATE TRIGGER and_os_cost_items_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_items FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();

drop trigger if exists "set_cost_items_updated_at" on public."cost_items";

CREATE TRIGGER set_cost_items_updated_at BEFORE UPDATE ON public.cost_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

drop trigger if exists "and_os_cost_publish_log_mutation_guard" on public."cost_publish_log";

CREATE TRIGGER and_os_cost_publish_log_mutation_guard BEFORE INSERT OR DELETE OR UPDATE ON public.cost_publish_log FOR EACH ROW EXECUTE FUNCTION and_os_require_cost_rpc_mutation();
