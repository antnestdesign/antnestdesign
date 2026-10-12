-- RETIRED TEST ONLY: old reconstructed DDL, no longer loaded by run.mjs.
-- 2B-3 uses production/cost-schema.CAPTURED.sql from catalog metadata instead.
-- save/version functions come only from cost-rpc.PROPOSED_CANONICAL.sql.
-- cancel/publish bodies are loaded unchanged from repository hotfix SQL instead.
alter table public.cost_items
  add column if not exists draft_cost_price numeric,
  add column if not exists draft_margin_rate numeric,
  add column if not exists draft_is_active boolean,
  add column if not exists draft_updated_at timestamptz,
  add column if not exists draft_updated_by uuid references auth.users(id),
  add column if not exists is_pending_new boolean not null default false;
alter table public.cost_item_history
  add column if not exists old_is_active boolean,
  add column if not exists new_is_active boolean,
  add column if not exists cost_version text;
create table if not exists public.cost_publish_log (
  id uuid primary key default gen_random_uuid(), version text unique not null,
  reason text, published_by uuid references auth.users(id), published_at timestamptz,
  changed_item_count integer, price_change_count integer, margin_change_count integer,
  active_change_count integer, duration_ms integer, memo text, created_at timestamptz
);
