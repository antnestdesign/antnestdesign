# AND OS DB Migration Baseline

Phase 4A/B checkpoint, 2026-10-13. App checkpoint: `faaf986`.
Scope: Production catalog READ ONLY; offline baseline/forward generation and
static review. No Production schema, ACL, function, business data or app change.
No blank replay, push, deployment or migration adoption performed.

## Evidence And Ownership

- User-authenticated Supabase Dashboard, project `lzsxboaqliuwjzwsnnwf` / antnest-estimate / main.
- Catalog capture: `2026-10-13T07:24:59.489571+00:00` (16:24:59 KST), PostgreSQL 17.6.
- Exact capture: `db-baseline/AND_OS_PROD_APP_SCHEMA_2026-10-13.json`.
- SHA256: `684e2be4bbac0f85276398ce9f3fdb7cc605a33f601d46f99bb69c2ed8eec7d4`.
- Inventory: `db-baseline/AND_OS_DB_OBJECT_INVENTORY_2026-10-13.json`.
- File hashes/order: `db-baseline/AND_OS_MIGRATION_MANIFEST_2026-10-13.json`.
- Static results: `db-baseline/AND_OS_MIGRATION_STATIC_REVIEW_2026-10-13.json`.
- Query sources: `scripts/db/capture-app-catalog*.sql`; catalog helpers only.
- An initial management API fetch failed. Reloaded Dashboard subsequently returned
  the catalog result; no application mutation RPC or business row was queried.
- SQL Editor's platform query draft is not an app schema/data mutation.

App ownership includes 15 non-extension public tables and 24 public functions,
229 columns, 80 constraints, 48 indexes (including constraint-backed indexes),
15 non-internal triggers and 14 policies. All tables have RLS enabled; none forced.
No app view, sequence, enum or domain exists in the captured baseline.
Supplemental `AND_OS_PROD_APP_EXTRAS_2026-10-13.json` captures procedures,
foreign tables, standalone composites, custom rules/collations/operators: all zero.
`customers`, `projects`, `estimate_items` are preserved legacy app relations even
though current app runtime has no references to them. Never drop them on that basis.
Auth/storage internals, extension members, public schema ownership/default ACLs
are managed-environment prerequisites, not copied internal Supabase schema.
The captured default ACLs/schema ACLs are retained in JSON for comparison.

## Object Inventory And Canonical Decisions

| Object family | Production / repo / candidate | Decision |
|---|---|---|
| customers, projects, estimates, estimate_items | Production exact; complete DDL absent from root SQL; test bootstrap is reconstructed | PROD_BASELINE from capture, never bootstrap; raw-REST closure in forward 002 |
| profiles | Production exact matches historical profile fields/index/trigger; leftover broad non-DML ACLs | PROD_BASELINE; archive old backfill; forward 001/002 account/ACL boundary |
| cost_items/history/publish_log | Captured exact DDL/guards/ACL; root files are partial/historical | PROD_BASELINE; no price seed; forward 002/004 hardening |
| six contract/spec/options tables | Production exact; RFC-006 broadly describes them | PROD_BASELINE, no re-run of RFC seed/DDL |
| os_audit_logs | Production has broader service_role ACL than historical SELECT/INSERT-only SQL | Preserve exact baseline, no invented ACL match |
| current_and_os_role / is_and_os_admin | Role helper bodies match cost_items.sql; account state absent | REPO_MATCH body; forward 001 uses verified account-aware candidate |
| and_os_require_cost_rpc_mutation | Production-only in root historical SQL | REPO_MISSING; exact baseline, verified body/ACL forward 004 |
| save_cost_item_draft | Historical draft differs; exact Production captured | REPO_MISSING exact body; forward 004 = Production semantics + verified finite/lock candidate |
| next_cost_publish_version | Archived historical body matches Production | REPO_MATCH historical body; forward 004 uses verified allocator guard/lock/limit |
| publish_cost_drafts / cancel RPCs | Exact captured publisher/cancel bodies match hardening hotfix | Baseline exact; no additional publisher rewrite |
| create/update pending cost + code validator | Bodies match RFC-004B | Baseline exact; account-aware helper governs authorization |
| contract snapshot/create-change/approve RPCs | Repo bodies differ only by qualified digest/type casts; create snapshot Production search_path includes extensions | Baseline exact; forward 003 promotes tested qualified bodies, preserves hash inputs |
| confirm + contract state/document/approval/no-cross-estimate guards | Bodies match RFC-006 | Baseline exact; existing locking retained |
| and_os_contract_manifest_guard | Absent Production; verified proposed test guard | LOCAL_CANDIDATE promoted in 003 with canonical name |
| staff_estimates_view | Absent Production; verified explicit staff whitelist view | LOCAL_CANDIDATE promoted in 002; not the full staff CRUD/runtime implementation |
| one-time wallpaper/recent registration functions | Historical create/call/drop; absent Production | OBSOLETE transient objects, no baseline seed or function |

Every column/index/constraint/trigger/policy has an explicit inventory entry and
exact metadata in the capture. Function `REPO_MATCH` in the machine inventory
means normalized BODY match, not an assertion that historical headers/ACLs match.
Signatures/owner/search_path/ACL always come from Production exact capture.
No unidentified app object is substituted with test bootstrap schema.

## Official Chain

Naming: `YYYYMMDDHHMMSS_description.sql`; timestamps identify order, not invented
historical application dates. All five files are one new checkpoint chain.

| File | Responsibility / dependency |
|---|---|
| 20261013000000_prod_baseline.sql | Exact captured current schema, including current imperfect security. Managed Supabase PG17+ prerequisite. No rows. |
| 20261013000100_auth_account_boundary.sql | Account-aware current role; helper EXECUTE restriction. Before dependent policies/cost RPCs. |
| 20261013000200_estimate_role_boundary.sql | Drop actual permissive Production policies; profiles self-read; estimates admin/manager read/write and admin-only delete; staff whitelist view; cost direct-write ACL restriction; legacy relation read boundary. |
| 20261013000300_contract_integrity.sql | Immutable manifest/amount/lineage guard including CHANGE_PENDING; existing state transitions and FINAL document guard retained; three tested digest-qualified RPC replacements. |
| 20261013000400_cost_rpc_canonical.sql | Approved mutation guard ACL, draft row lock/finite values/no-op/null/false semantics, version advisory lock/numeric suffix/999 limit; no price/history rewrite. |

Baseline ordering: required extensions -> all table row types (without defaults)
-> functions (SQL helper dependencies ordered) -> defaults -> PK/UNIQUE/CHECK ->
FK -> non-constraint indexes -> triggers -> RLS/policies/ACL. This handles
and_os_now defaults and table-returning RPCs without missing relation references.
Migration execution search_path is transaction-local pg_catalog/public/extensions;
stored function-specific search_path remains its captured or reviewed value.
Constraint-backed indexes are not recreated independently.
CREATE TABLE/CREATE FUNCTION/new policies fail on unexpected existing objects.
CREATE OR REPLACE is used only for intentional forward function replacement;
CREATE EXTENSION IF NOT EXISTS is a managed prerequisite, not schema drift masking.
PG17 MAINTAIN privileges are preserved, never silently omitted to fit PG15.

## RLS / GRANT And Definer Audit

All 15 SECURITY DEFINER functions are owned by postgres and have an explicit
search_path in the capture. public schema grants CREATE only to its managed owner;
public/anon/authenticated/service_role have USAGE, not CREATE.

| Functions | Baseline / forward boundary |
|---|---|
| current_and_os_role, is_and_os_admin | Public/anon EXECUTE existed. Forward removes it; authenticated/service_role retained. Current role now requires active and no forced password change; unknown actor returns empty role. |
| cost validator/create/update/save/cancel-all/cancel/publish | authenticated/service_role EXECUTE, admin check via shared helper. Table writes must pass transaction-local approved RPC guard. Forward adds finite draft checks and row lock; existing create/update validators unchanged. |
| next_cost_publish_version | service_role-only EXECUTE; internal publisher owner can invoke. Forward adds admin helper and shared transaction advisory lock; no persistent sequence/rollback consumption. |
| cost mutation trigger guard | Baseline public EXECUTE; ordinary trigger-returning function is not a free-standing REST mutation RPC. Forward revokes external EXECUTE including service_role; owner-owned triggers still enforce mutation gate. |
| four contract RPCs | service_role-only EXECUTE; trusted backend actor/profile validation, active-role checks. Hash qualification fixes search_path resolution without changing input. Password-state enforcement also relies on server session authorization; no new DB actor model invented. |

Non-definer set_updated_at has no explicit search_path in Production; preserve
baseline accurately. Other app trigger functions have public search_path.
Existing FINAL/locked document, approved change-order, approval immutable guards
remain, while 003 closes mutable integrity/amount/lineage fields in locked packages.
The service_role is intentionally trusted/BYPASSRLS and has broad table privileges;
RPC table triggers are the immutability boundary, not a claim that service credentials
can be disclosed or used by a client. Superuser trigger disabling is outside this boundary.

Production estimates originally has `authenticated estimates access` ALL/true.
002 drops that exact name; merely dropping test_estimate_* would leave an OR bypass.
Legacy customers/projects/estimate_items also have ALL/true; 002 drops these actual
policies and permits active admin/manager SELECT only, reserving writes to service_role.
These newly captured legacy closures are a reviewed extension, NOT covered by the
old simplified Test DB: Phase 4C must explicitly test all three real tables.
History/publish table ACLs lose raw DML/TRUNCATE/etc.; existing role-filtered SELECT
policies stay. Cost values, draft values and row content are not changed.
No new membership/IDOR model is created: active internal roles remain organizational
roles, and staff-safe view/API do not claim per-project ownership enforcement.

## Old SQL Mapping

| File | Classification / handling |
|---|---|
| cost_items.sql | historical baseline source, partially superseded; keep for existing tests, not deploy source; do not replay seeds |
| archive/cost_items_v2_3.sql | superseded/duplicate historical source; byte-exact archive; canonical save differs; next-version historical body match recorded |
| archive/rfc_003a_user_profiles.sql | historical profile schema source absorbed in exact baseline; archived row-backfill UPDATE must never become a forward migration |
| rfc_003f_audit_log.sql | historical baseline reference; captured current ACL wins |
| rfc_004b_cost_item_management.sql | historical DDL/pending RPC source; current capture + canonical forward wins |
| rfc_004s_wallpaper_material_cost_item.sql | historical one-time data registration; not schema migration/seed for this chain |
| rfc_006_contract_documents.sql | historical schema and tested forward digest-qualified RPC source; do not replay 23-spec seed |
| rfc_006_digest_hotfix.sql | duplicate historical hotfix; keep reference; 003 is active source |
| rfc_cost_draft_rpc_hardening_hotfix.sql | matches captured cancel/publish bodies; keep historical/test reference |
| rfc_recent_cost_items.sql | historical one-time 26-price registration; never replay as baseline |
| tests/os/db/bootstrap.sql | TEST ONLY reconstructed fixture, not Production baseline |
| tests/os/db/cost-support.sql | superseded TEST ONLY substitute, not canonical source |
| tests/os/db/production/cost-schema.CAPTURED.sql | TEST ONLY earlier cost capture replay/marker/PG15 compatibility, not official migration |
| tests/os/db/patches/*.sql | TEST ONLY verified candidate inputs; promoted self-contained forward statements have no test marker dependency |
| tests/os/db/reset.sql, integrity/reset.sql | TEST ONLY synthetic cleanup, never migration |

Both archived files retain original SHA256; no arbitrary deletion or business
backfill promotion. Existing tracked historical SQL is not edited or removed.
Scoped Git attributes preserve archive bytes; their pre-existing EOF blank line
is accepted only for archived SQL. Canonical migration/2026-10-13 capture JSON
checkouts use LF so recorded hashes remain reproducible on Windows.
Migrations become the ordered canonical source; historical/test duplicates are
deliberately retained with explicit provenance, not competing deployment choices.

## Forward Diff / Risks / Rollback

| Migration | Before -> after / risk / lock / rollback |
|---|---|
| 001 | Role-only -> active/password-state-aware. Existing forced-password accounts lose DB business access as intended. Function replace catalog lock, no row rewrite. Rollback only separately reviewed prior definition; never casually reopen inactive access. |
| 002 | Broad grants/ALL policy -> precise read/write boundary. Old staff direct raw REST must use Phase-2 safe server runtime; existing Production app has not deployed that runtime yet, so DB adoption and compatible app release must be coordinated in 4D. ALTER/RLS catalog locks can briefly block queries; no data rewrite. Policy rollback would reopen known exposure; prefer fix-forward. |
| 003 | Incomplete locked manifest fields/unqualified digest -> verified immutable fields/qualified digest. Trigger installation has a short table DDL lock; cannot rewrite old rows/hashes. Preserve normal confirm/change transitions. Separate reviewed trigger/function rollback only, never data repair. |
| 004 | Draft/version edge cases -> verified finite validation/row lock/transaction advisory lock. Function replacement only; row locks occur later when called. No migration-time business RPC calls, data changes or version allocation. Rollback restores captured definitions only under approval. |

All migration-time operations are schema/ACL definitions. Function bodies contain
normal future INSERT/UPDATE/DELETE behavior, but no function is invoked here.
No backfill or destructive data migration is required. Existing standard spec and
cost rows are intentionally omitted from schema-only replay; Phase 4C uses synthetic
fixtures. New environment production reference-data provisioning needs a separate
approved plan; do not copy customer rows or infer live prices from historical seed.

## Phase 3G Optional Requirements

| Requirement | Decision |
|---|---|
| Independent public quotation number | Defer Phase 5; no established field/source policy, no invented number from private IDs. |
| Standalone quotation customer identity | Existing estimates/customerQuote allowed projection can provide existing fields; no schema change now. Freeze new identity semantics only after approved design. |
| Persistent print-style revision | Existing contract template_version/rule_version, document package_version/content_json/hash already retained. Separate presentation revision/reproducibility retention decision deferred; do not change current hash targets. |

No new company/project/document field, table or seed is needed in this phase.

## Validation And Phase 4C Handoff

Offline tools require Python + pglast 8.5; pglast is installed outside the repo,
not a production app dependency. `validate-migration-chain.py` connects to no DB.
SQL parser + PL/pgSQL parser validate all 5 files and 32 function definitions
(baseline + intentional forward replacements). All 23 historical/test/migration
SQL files parse. Generator equality, ordering, duplicate signatures, known public
references, table-before-function and SQL helper dependencies, no top-level business
DML, no local test marker, credential pattern scan, archive byte hashes pass.
No unresolved named public reference was found; runtime type/overload/ACL resolution
is intentionally unproven until the blank replay. This is not a security-suite rerun.

| Migration | Required Phase 4C tests |
|---|---|
| 000 | Blank managed PG17 replay; exact schema/function/config/ACL/RLS/constraints/index/trigger comparison against capture; no business rows. |
| 001 | DB Security active/inactive/password-state/missing-profile accounts. |
| 002 | DB Security + Staff Boundary; exact Production ALL policy removal; legacy-table staff/anon denial and internal reads; raw cost/history/publish DML denial; safe view nested whitelist. |
| 003 | Integrity locked manifest/hash/amount/version/lineage, normal confirm/change states, document FINAL and immutable approvals; qualified digest execution. |
| 004 | Integrity draft null/false/no-op/finite/missing-row cases, pending-new cancel/publish, concurrent version lock/999/day rollover and rollback. |

Existing baseline evidence: Regression 702/702, Staff Boundary 23/23 x2, DB Security
99/99 x2 and Integrity 56/56 x2 from prior checkpoints. NOT rerun in 4A/B;
the final chain must be replayed/tested in 4C rather than claiming those counts
prove the new baseline/legacy closures already execute correctly.
Current owned Test DB config is PG15; Phase 4C must create a separate managed
PG17 isolated stack or explicitly upgrade its isolated setup before replay.
Never remove MAINTAIN grants just to make PG15 pass.

## Production Adoption (Phase 4D Only)

1. Complete Phase 4C replay/full suites and catalog drift comparison first.
2. Re-capture Production schema before adoption; stop on drift/unexpected objects.
3. Back up schema/business data under a separate approved procedure.
4. Mark only the exact baseline version adopted in Supabase migration history;
   do not execute its CREATE statements on populated Production. No fake old RFC history.
5. Coordinate Phase-2-compatible safe staff runtime with ACL forward changes.
6. Apply ordered forward migrations under separate explicit approval, transaction
   per migration; fail/rollback on any error, never bypass dependency failures.
7. Read-only post-check + approved isolated smoke checks; no silent row repair.

Migration history adoption, db push and app deployment are all unexecuted here.
Phase 4A/B verdict is a STATIC CHECKPOINT PASS, not Production-ready certification.
Phase 4C may begin with the PG17 requirement and mandatory legacy-policy tests above.
