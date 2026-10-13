# AND OS Phase 4D Compatibility And App-first Runbook

Date: 2026-10-14. Application source checkpoint: `bdbe95f`.
Production reference: `522cbb8`, Vercel `dpl_FouB4fwc2chSVNMojmHkNzhZGiMt`.
Local functional rehearsal: **PASS**. Production GO status: **HOLD** pending
explicit URL environment configuration approval and fresh final preflight.
No bridge application change is required. No Production DB/settings mutation,
history repair, push or deployment was performed.

## Compatibility Matrix

| Case | Combination | Evidence / verdict |
|---|---|---|
| A | Old app + old baseline DB | Production reference; actual `522cbb8` storage module in isolated Chromium logs in and reads two saved fixtures. Not a full redeployment of the old backend. |
| B | Old app + canonical DB | Actual old storage module logs in, gets zero staff estimate rows and receives HTTP 403 on save. Fixture rows remain unchanged. DB-first staff failure reproduced. |
| C | Latest app + old baseline DB | PASS: real Next APIs and admin/manager/staff Chromium UI, create/update/reread, preview, account/cost/audit role boundary, actual admin three-document confirm. |
| D | Latest app + canonical DB | Same functional checks PASS, plus manager raw delete denied, staff raw internal REST denied, and full canonical security/integrity/staff suites. |

This separates functional compatibility from security compatibility. The old DB
still has its pre-existing broad estimates RLS: synthetic staff raw REST can read
internal fields and manager raw deletion is allowed. Latest application's staff
API responses are recursively projected and do not expose those fields. No new
grant/policy is added during the app-first stage. DB hardening remains necessary;
do not claim that deploying the app alone closes manual raw REST access.

## Environment And Isolation

The owned throwaway `and-os-migration-rebuild-test` stack was recreated with a new
volume, PG17.11, API 127.0.0.1:56321 and DB 127.0.0.1:56322. The older PG15 security
stack is not reset. Production credentials, business rows and hosted linking are
not used. Auth/profile/estimate/cost fixtures are synthetic only.

Official local history first contains baseline 000 only; then canonical forwards
001..004 are applied with Supabase CLI `migration up --local`. No history repair
or historical/archive/candidate SQL is used. All canonical file hashes are unchanged.

Verified fingerprints:

- Old baseline: `a83cc48fab2cff052ab1cd559b7291b9890a0787cb8b81375c301d73cf70d0cf`
- Canonical: `542532b3dd4099eb14b738a3ae9fcaac5ccb54db803284ed412edc2df26fc7c5`

After latest app creates/updates synthetic data on the old DB, per-table hashes of
all 15 app tables are recorded before and after forwards. All hashes are identical:
existing estimates, confirmed contract/documents, profiles and costs survive cutover
without backfill or re-save. Original saved estimate read also remains unchanged.

Browser URL/anon-key configuration is replaced only in memory with local values;
API/DB responses are not mocked. Actual server process is loaded with the Phase 4C
environment/network guard: no Production dotenv and no hosted Auth/REST fetch.
All required test processes are stopped after the run.

## Latest Application Dependencies

Targeted reads confirm the new estimate server API uses existing `profiles`,
`estimates` and `cost_items` through server-only `supabaseFetch`, then returns a
role-safe projection. It does not require `staff_estimates_view` or the new
`and_os_contract_manifest_guard` function to exist on the old DB.

Contract options/packages/documents/spec catalog tables and their columns already
exist in the baseline. Referenced contract/cost RPC signatures and return types
are unchanged between baseline and canonical. Account flags already exist in
baseline profiles. No capability-detection fallback or new bridge code is needed.

The same latest server process remains running while forwards are applied. Both
pre/post smoke checks use actual Auth, HTTP API, PostgREST and browser modules.
The old reference probe uses the exact Git storage source with local configuration
only, on a real server-served document; it is not a simulated permission denial.

## Verified Workflows

Both C and D verify:

- Admin/manager/staff login, list/read/create/update/reread of synthetic estimates.
- Staff list/detail/write response projection and internal-field injection rejection.
- Staff contract preview allowed, confirmation forbidden; manager preview/create
  remains forbidden under current read-only contract policy.
- Inactive/forced-password requests rejected by latest APIs on both schemas.
- Admin account/audit access, non-admin denial, cost-screen role visibility.
- Actual admin package creation and confirm with three FINAL locked documents.
- Draft/cancel RPC keeps operating cost unchanged; no price publish in core smoke.
- Original saved quote 3,770,000 retained, zero writes during browser read,
  zero browser page errors and zero hosted DB requests.

Canonical extended verification: Security 190/190, Integrity 64/64, Staff Boundary
23/23, failure/skip 0. Existing tests are not changed or skipped. This includes pipe
cost/customer +300,000 with unchanged profit, contract locks and cost atomicity.

Before those original suites, exactly five remaining `SYSTEM_COMPAT_*` synthetic
estimates and their own documents/options are disposed in the owned isolated DB.
Fixture-only locking triggers are temporarily disabled/re-enabled in one guarded
transaction, then canonical fingerprint equality is checked. This is test cleanup,
not a schema repair or Production runbook step. Existing approved fault-injection
tests are also local-only and their schema cleanup is checked afterward.

## Vercel Production Environment Audit

Authenticated UI audit, project `antnestdesign/antnestdesign`, Project and Shared
tabs, all environments/types/statuses visible. Values were never opened/copied.
Project tab has one variable; Shared tab has no linked variables.

| Name / input | Classification | Finding |
|---|---|---|
| SUPABASE_SERVICE_ROLE_KEY | PRESENT | Secret variable targeted to Production and Preview |
| SUPABASE_URL | MISSING | No explicit variable; existing server fallback is used |
| NEXT_PUBLIC_SUPABASE_URL | MISSING, optional alternative | No explicit alternative URL variable |
| SUPABASE_SERVICE_KEY | LEGACY, absent | Supported old alias, unnecessary when primary key exists |
| NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY | UNUSED, absent | OS browser uses its existing public configuration, not these env names |
| NEXT_PUBLIC_* server/service secret | Absent | No publicly prefixed service-secret variable observed |
| Other required OS server environment | None found | Targeted process.env search finds only the URL/key alternatives above |

The deployed/latest server contains the existing project URL fallback. That explains
functional operation despite absent URL environment variables; absence is not an
observed application runtime failure. Nevertheless this task explicitly forbids GO
when required environment configuration is missing. Use conservative HOLD until
the operator approves explicit `SUPABASE_URL` configuration for Production and a
read-only verification of its presence. Do not create redundant public keys or
copy a service key into a NEXT_PUBLIC variable.

Proposed minimum configuration, **not applied**:
`SUPABASE_URL=https://lzsxboaqliuwjzwsnnwf.supabase.co`, server-side Production target.
Keep the existing server key. Its value was not inspected or copied. Runtime
project/key binding will be confirmed by authorized login/API smoke after deployment,
not inferred from the secret variable name alone.

## Secret Boundary

Public OS source has no service/server environment references. A production Next
build was run with a synthetic server-only canary, no Production dotenv loading,
and hosted fetch blocked. All 76 compiled client/public OS files were scanned;
canary exposure is zero. No real Production secret value was required for this test.
Staff API/browser response projection and raw REST denial after migration are
tested separately, not substituted with the source-string scan.

Final gates: Regression 702/702 PASS, Security 190/190 PASS, Integrity 64/64 PASS,
Staff Boundary 23/23 PASS, syntax/diff/lint/build PASS. Lint retains the existing
five warnings, new warnings zero. Document renderers are unchanged; their Phase 4C
9/9 Chromium/PDF result remains reference evidence, not a new document-suite run.
Local unexpected failures and skips are zero after harness corrections. The old
client/new DB failure is an intentional reproduced incompatibility, not a skipped
or silently accepted failing latest-app test.

## Rehearsal Timing

| Local step | Seconds |
|---|---:|
| Latest app process start/readiness simulation | 3.88 |
| Old client baseline reference | 6.52 |
| Latest app on old DB: HTTP + browser smoke | 14.35 |
| Forward migrations + schema reload notification | 2.18 |
| Latest app on canonical DB: HTTP + browser smoke | 12.50 |
| Old client canonical failure probe | 3.42 |
| Extended canonical security/integrity/staff suites | 291.89 |

The development start is warm-cache and is not a Vercel deployment benchmark.
Current old Production deployment's displayed build duration is 28 seconds; that
does not guarantee the new release duration. Full automated suites are rehearsal
gates, not a proposed five-minute Production outage. Actual Production metadata
locks/traffic/network/build time must be rechecked at execution.

## Selected Strategy A: App First

Functional app-first is verified; separate bridge release is unnecessary. The
latest app can operate on either schema. Keep the old-DB interval bounded to
release smoke and proceed promptly to security migration after successful checks.
Do not leave the broad old RLS as a long-term operating state.

Before GO: resolve URL environment omission; approve release commit, operator
credentials/history adoption, short write pause and smoke scopes. No user/business
mutation smoke is implied by this local rehearsal authorization.

After a separate explicit Production GO:

1. Recheck exact Production identity, current remote/deployment SHA, schema drift,
   migration history, active transactions and provider health. Stop on any drift.
2. Save pre-change catalog/fingerprint/RPC/ACL/trigger/history/deployment evidence;
   verify backup/restore availability and approved environment configuration.
3. Deploy the verified latest app **while DB remains old**. Check expected SHA,
   module/cache versions and that safe estimate API routes now exist.
4. Authorize normal admin/manager/staff login/read/preview checks. Positive save
   checks require separately approved dedicated synthetic Production fixtures.
   Confirm staff actually uses the new safe API, not cached direct REST.
5. Keep old DB unchanged if app smoke fails: rollback the app to old deployment.
   Do not adopt history or begin forwards on an unsuccessful app-first release.
6. Announce a short DB-switch write pause; have open staff clients reload. Recheck
   transactions/locks immediately before DDL and stop on unresolved blockers.
7. Register baseline 20261013000000 as already applied using the approved official
   CLI procedure. Never execute baseline CREATE statements on populated Production.
8. Dry-run pending migrations; require exactly forwards 001,002,003,004. Apply in
   order, transaction per file, agreed lock/statement timeouts, no manual repairs.
9. Confirm expected final catalog/history, schema visibility, manager delete denial,
   staff raw internal REST denial, account/RPC/cost guards and new app availability.
10. Recheck the same latest app for admin/manager/staff and customer print views.
    Resume writes only after verified clients/workflows. No final app redeploy is
    required for a nonexistent bridge; it is the same dual-compatible release.
11. Observe errors/permission failures/locks for 15-30 minutes and the next business
    session. Unexpected failures or internal exposure trigger pause/fix-forward.

App deploy/smoke can occur with the old DB online. Only the short DDL switch needs
coordinated write quieting; it is not the former DB-first full app-deploy outage.
Budget a low-use operator window for release/checks, not a guaranteed downtime
number. Do not use local 2.18-second migration time as a Production lock guarantee.

## Rollback / Stop Conditions

- Before DB migration: app rollback to `522cbb8` remains functionally compatible
  because DB is still old. Preserve and verify that deployment before switching.
- If baseline registration alone succeeds: history adoption is recorded accurately;
  no business row repair is required. Inspect rather than blindly deleting history.
- If a migration transaction fails: confirm rollback/history consistency; earlier
  committed forwards remain applied. Stop on uncertain commit outcome.
- After DB migration: keep verified latest app. Rolling back to old app alone
  reintroduces empty/403 staff workflow; no broad RLS restoration as a shortcut.
- Contract/cost DB issues: fix-forward preferred; captured prior definitions are
  available for separately reviewed restoration, not automatic security rollback.
- Preserve confirmed contracts/documents/prices/history; no row deletion or re-save
  in the Production recovery plan.
- Stop on missing environment configuration, key/project mismatch, wrong release,
  unexpected schema/history drift, blocker/long transaction, API 404/500, broken
  role projection, stale direct-REST staff client or an unapproved mutation test.

## Harness Corrections And Scope

Resolved test-only issues: a synthetic fulfilled document had no loopback address-
space identity, so Chromium denied Auth fetch. The probe now uses a real served
document; no browser security/permission bypass is used. Rehearsal-created rows
initially broke existing suites' exact two-fixture expectation; only owned fixtures
are cleaned before those unchanged suites. A sandbox cache EPERM interrupted
regression collection; the same suite was rerun with normal approved local access.
None required changing app, API, auth policy or canonical SQL.

Run `npm run test:db:compatibility` to reproduce the complete isolated cutover.
Run `node tests/os/db/compatibility/bundle-boundary.mjs` for isolated build/canary QA.
Machine evidence: `db-baseline/AND_OS_PHASE4D_COMPATIBILITY_RESULTS_2026-10-14.json`.
Raw synthetic test artifacts are ignored under `tests/os/db/compatibility/artifacts/`.
No binary, credential or actual business record is committed. Archived SQL bytes
remain unchanged. Production URL variable was not added in this phase.

**Final Gate A re-evaluation: HOLD (environment configuration approval outstanding).**

WAITING FOR EXPLICIT PRODUCTION GO
