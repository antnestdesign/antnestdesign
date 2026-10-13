# AND OS Phase 4C Rebuild Verification

Date: 2026-10-13. Starting checkpoint: `16d7040`.
Verdict: **PASS**. Phase 4D preparation readiness: **YES**; Production adoption
still requires separate approval, current drift checks and a coordinated app release.

## Environment And Safety

| Setting | Verified value |
|---|---|
| Owned stack | `and-os-migration-rebuild-test` |
| PostgreSQL | 17.11, managed Supabase local bootstrap |
| API / DB | `http://127.0.0.1:56321` / `127.0.0.1:56322` |
| Shadow DB / application | 56320 / `http://127.0.0.1:3044` |
| Hosted link | Absent; CLI rejects a hosted `project-ref` |
| Original security stack | Separate PG15 stack on 55321/55322; not reset or modified |
| Test credentials | Local synthetic accounts; keys/tokens held in memory only |
| App environment | Test preload prevents Next from loading ignored environment files |
| Outbound app fetch | Only owned local Auth/REST origins; redirects rejected |
| Browser networking | Only owned app/API origins; service workers blocked |
| Actual customer data | Not used; all runtime rows and screenshots are synthetic |

The normal final `npm run build` uses the repository's usual `.env.local` loading,
as reported by Next. No values are printed or committed, and this is not the
rebuilt application's isolated runtime configuration. No Production query,
migration, mutation, push or deployment was performed in this phase.

The browser test supplies only the local URL/anon-key pair in its in-memory
`storage.js` response because the existing static client has fixed configuration.
No application source is changed; Auth, PostgREST and application API responses
are real, not mocked. No service credential is supplied to the browser.

## Reproduction

Run `npm run test:db:rebuild` from the repository with Docker running. It performs
two complete rebuilds and all three DB suites plus actual browser smoke each time.
The runner requires the repository Supabase CLI, bundled Python/pglast and
Playwright/Edge dependencies identified in the test scripts. These are tooling
prerequisites, not hidden database object dependencies.

For each run:

1. Verify ownership of the dedicated PG17 container before stopping it.
2. Use CLI `stop --no-backup`; verify no owned volume remains.
3. Remove only generated copies of the five known migration files.
4. Start a fresh managed stack with no app migration/seed input.
5. Capture blank public app catalog: zero app tables/functions/views/types/sequences.
6. Copy baseline bytes from canonical migrations; CLI `migration up --local`.
7. Compare full baseline metadata against the captured Production app catalog.
8. Copy the four forwards byte-exact; CLI `migration up --local`.
9. Verify official history, final catalog, and zero rows across all 15 app tables.
10. Create synthetic Auth/profile/business fixtures, then run runtime suites.
11. Run actual Next APIs and headless Chromium UI for admin/manager/staff.
12. Clean test-only fault injection; compare catalog fingerprint again.

The tests do not use archived/historical/candidate SQL to bootstrap or repair
the schema. Existing fault-injection functions/triggers are explicitly permitted
by the user **only in the isolated DB after fixtures**. Fixture cleanup temporarily
disables/re-enables canonical locking triggers to remove synthetic locked rows.
It is not a migration repair or Production procedure. Post-test fingerprints
prove that no temporary test schema object remains.

## Fresh Rebuild Evidence

Both runs begin with zero app objects and end migration replay with zero business
rows before fixtures. The owned volume name is reused only after its previous
volume is removed; this is not a truncate-only replay.

| Evidence | RUN 1 | RUN 2 |
|---|---|---|
| Fresh container | `8d2cf83e48de745802a8b92b6263885dddff5d744abcd56ac051b30cb16fca2a` | `66bd120b1f7a75ac875103ad2e9de17b8bc20d02e08d27f28f1d9fce1e7a7934` |
| Migration replay | PASS | PASS |
| Security | 190/190 | 190/190 |
| Integrity | 64/64 | 64/64 |
| Staff Boundary | 23/23 | 23/23 |
| Browser admin/manager/staff | PASS | PASS |
| Hosted DB attempts / browser errors | 0 / 0 | 0 / 0 |
| Schema fingerprint after tests | Unchanged | Unchanged |

Exact official history in both runs:

```text
20261013000000_prod_baseline.sql
20261013000100_auth_account_boundary.sql
20261013000200_estimate_role_boundary.sql
20261013000300_contract_integrity.sql
20261013000400_cost_rpc_canonical.sql
```

## Catalog Comparison And Fingerprint

`scripts/db/compare-rebuilt-catalog.py` compares identities and definitions, not
counts alone: columns/defaults/types/nullability, constraints, indexes, functions,
owners, search paths, ACLs, RLS/policies, triggers and views. OIDs/environment
versions/timestamps are excluded; line endings and ACL ordering are normalized.
Baseline comparison is against the existing exact Production catalog capture;
final comparison includes intentional canonical forward definitions and ACL changes.

| App object | Baseline | Final |
|---|---:|---:|
| Tables | 15 | 15 |
| Functions | 24 | 25 |
| Columns | 229 | 229 |
| Constraints | 80 | 80 |
| Indexes | 48 | 48 |
| Triggers | 15 | 16 |
| Policies | 14 | 17 |
| Views | 0 | 1 |

Explained additions: manifest guard function/trigger, staff-safe view, and one
estimates ALL policy replaced by four operation-specific policies. No unexplained
app object or unresolved runtime relation/type/function reference was observed.

Baseline fingerprint:
`a83cc48fab2cff052ab1cd559b7291b9890a0787cb8b81375c301d73cf70d0cf`

Final fingerprint, both runs and both post-test captures:
`542532b3dd4099eb14b738a3ae9fcaac5ccb54db803284ed412edc2df26fc7c5`

The final catalog is not expected to have the old baseline fingerprint. The two
final rebuild fingerprints are expected to match each other, and do.

## Reproduced Failure And Canonical Fix

Nine new actor-boundary cases initially failed. Contract RPCs selected an active
profile's role but did not require `must_change_password = false`. For an inactive
or missing profile, `v_role` was NULL; SQL `IF v_role NOT IN (...)` / `<> 'admin'`
evaluated NULL and did not reject the caller before payload resolution.

Forward 003 now checks both account flags and uses `coalesce(v_role, '')` to reject
unknown/inactive actors. Applied to all four service-only contract RPCs:

- `create_contract_package_snapshot`
- `confirm_contract_package_snapshot`
- `create_contract_change_order`
- `approve_contract_change_order`

The generator and manifest reflect this change. Confirm is now an explicit fourth
replacement in 003. Qualified digest calls, hashes, payment inputs, snapshots,
document semantics and valid state transitions are unchanged. Baseline 000 and
all historical/archive SQL remain byte-exact. After fixing the canonical migration,
the final evidence comes from two full fresh replays, not manual patches.

Other failures were corrected in new test assumptions only: the safe API has no
DELETE handler (405; admin deletion uses REST), pending-new item price is stored in
its unpublished `cost_price`, publish-limit fixture requires `published_by`, and
read-only estimate preview POST must not be counted as an estimate write.

## Security And Runtime Coverage

All 24 baseline functions and the added guard are created/resolved on PG17.
Existing Security/Integrity/Staff suites exercise role/time helpers, mutation guard,
draft/pending/cancel/publish/version RPCs, four contract RPCs, state/lock/approval
triggers; the new profile update case covers timestamp trigger resolution.
Fifteen SECURITY DEFINER functions have verified owner, explicit search_path and
role ACLs. PUBLIC/anon EXECUTE is absent; service-only RPC and authenticated helper
access are asserted individually. Trigger function execution restrictions remain.

Legacy matrix applies separately to `customers`, `projects`, `estimate_items`:

| Role | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| anon | Deny | Deny | Deny | Deny |
| staff | No rows | Deny | Deny | Deny |
| manager | Allow | Deny | Deny | Deny |
| admin | Allow | Deny | Deny | Deny |

Authenticated SELECT grant plus account-aware RLS governs internal reads; DML and
anon grants are revoked. Actual JWT/PostgREST probes and catalog assertions
distinguish intended RLS denial from missing GRANT. Service_role remains trusted.

Estimate boundary: admin intended CRUD; manager create/read/update but no delete;
staff safe server create/read/update with raw internal REST and unsafe writes
denied. Real HTTP APIs confirm anonymous/inactive/password-state denial, role
projection, contract options/preview and admin atomic confirm. Real UI login,
project load, cost/account/audit visibility and contract panel run without API mocks.

Contract integrity covers atomic three-document creation/confirmation, duplicate
and concurrent confirmation, FINAL document UPDATE/DELETE rejection, manifest,
hash/version/amount/lineage protection, approval immutability and change order
3,770,000 + 130,000 = 3,900,000 with original/successor history preserved.
Existing allowed metadata updates are preserved; this is protected-field integrity,
not a claim that every package column is unconditionally immutable.

Cost runtime covers normal/null/false/same-value drafts, invalid/missing rows,
NaN/Infinity/-Infinity, actual row lock waits, concurrent drafts, advisory-locked
versions, one winning concurrent publish, daily 999 cap, history/log atomicity,
failed publish rollback and raw INSERT/UPDATE/DELETE rejection.

Old saved estimate UI reads retain 3,770,000, produce zero estimate writes, and
leave the full saved row unchanged for all three roles. Read-only preview POST is
permitted and checked separately; no automatic target-margin repair is performed.

Pipe policy is unchanged and covered by regression/Staff Boundary:

| State | Direct cost | Customer | Profit |
|---|---:|---:|---:|
| OFF | 2,900,000 | 3,770,000 | 870,000 |
| ON | 3,200,000 | 4,070,000 | 870,000 |

Repeated application is idempotent. No actual customer rows or prices are seeded.

New DB tests: 99 total (Security +91, Integrity +8). Security additions comprise
51 legacy matrix/catalog cases, 12 contract actor cases, 11 real HTTP cases and
17 routine/account cases. Original 99/56/23 tests are retained, not skipped.

## Final Gates

| Gate | Result |
|---|---|
| Regression | 702/702 PASS; Known Failure/Unexpected Fail/Skip all 0 |
| Documents | 9/9 PASS, actual Chromium/PDF; layout defect counters all 0 |
| DB Security | 190/190 PASS x2 on two fresh PG17 rebuilds |
| Integrity | 64/64 PASS x2 on two fresh PG17 rebuilds |
| Staff Boundary | 23/23 PASS x2 on rebuilt DB |
| Syntax | 14 JavaScript files PASS |
| SQL static | Five migrations / 33 function definitions PASS; archive hashes unchanged |
| lint | PASS; existing five main.js warnings, new warnings 0 |
| build | PASS |
| diff | PASS |

Document page counts: quote small/normal/large 1/3/21; contract full/long 13/15;
spec small/large 1/25; combined normal 20; standalone estimate small 1.

Machine evidence: `db-baseline/AND_OS_PHASE4C_REBUILD_RESULTS_2026-10-13.json`.
Raw catalog/Vitest JSON and synthetic screenshots are generated under ignored
`tests/os/db/rebuild/artifacts/`; PDF output under ignored document artifacts.
No binary artifacts or credentials are checkpointed.

## Production Diff, Locks And Rollback

This uses the Phase 4A/B captured Production schema, not a new live drift assertion.
Current Production row counts/long transactions were not queried in 4C, so no
measured Production downtime promise is made.

| Forward | Expected change | Lock / data rewrite | Rollback position |
|---|---|---|---|
| 001 | Account-aware role function, helper EXECUTE restrictions | Function catalog replacement; no row rewrite | Prefer fix-forward; restoring old guard reopens account-state gap |
| 002 | Estimates/profile/legacy RLS, direct-write GRANT closure, staff whitelist view | Table/policy/ACL DDL may block queries; no new index or row rewrite | App rollback alone cannot restore old raw staff access; coordinate compatible safe runtime, do not casually restore permissive policy |
| 003 | Protected manifest trigger; four contract RPC guards and qualified digest | Trigger/table DDL plus function catalog locks; no old snapshot/hash rewrite | Keep locked data untouched; separately reviewed function/trigger rollback only |
| 004 | Cost guard ACL, finite/row-locked draft, advisory-locked version allocator | Function/ACL changes only at adoption; row/advisory locks on future calls | Reviewed prior function definitions or fix-forward; no history deletion or version reset |

No backfill, seed, destructive table operation or migration-time business RPC call
is required. Short definition changes can still wait behind long transactions.
Phase 4D must set approved lock/statement timeouts and a maintenance window based
on fresh Production observations; rollback the migration transaction on timeout.

Phase 4D prerequisites:

1. Re-capture Production metadata; stop on drift against the captured baseline.
2. Take approved schema/data backup and preserve exact pre-change ACL/functions.
3. Adopt only exact baseline `20261013000000` in official migration history. Do not
   run baseline CREATE statements against existing Production objects.
4. Coordinate Phase-2 safe staff application rollout with forward 002 ACL changes.
5. Apply forwards in order, transaction per migration, with no manual repair.
6. Read-only post-check and separately approved smoke; rollback only under approval.

Organizational internal roles are not a new per-project customer membership/IDOR
model. The tests do not certify superuser resistance, customer portal authorization,
all possible payloads or measured Production concurrency/downtime.

## Archive And Git Scope

Archived SQL is tracked historical reference, never executed or changed:

- `cost_items_v2_3.sql`: `2d8e57d464a5a1a942d816b8f419ec98cc4f8a78ef83eb8293c732af5c3e3ccf`
- `rfc_003a_user_profiles.sql`: `fb2d2249a6271cb8f8f90aaf89b832770ece52b43ef57531c2864e56e6f11fdf`

Checkpoint contains only migration guard/generator/manifest, isolated test tooling,
tests/configuration and evidence documentation. No app/API/storage/print behavior
change. One local commit; no push, deployment or Production mutation.
