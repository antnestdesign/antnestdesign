# AND OS 2B isolated DB suites

**TEST ONLY. Verified 2026-10-12: Security 99 PASS x2; Integrity 56 PASS x2.**
Docker daemon 29.8.2, project-local Supabase CLI 2.120.0, Node 24.16.0.
The already-running dedicated stack was verified by container name, port and
ownership marker. Earlier Docker-blocked reports are preserved in the regression
document. Suites never use a hosted project. 2B-3 captured production catalog
metadata through a user-authenticated Dashboard, without business row reads or
mutations. Source reconciliation is CLOSED; KF-004 remains outside this stage.

## Requirements and commands

Install and start a Docker runtime, and run `npm ci` for the pinned project-local CLI.
Do not use a hosted project, `supabase link`, `db push`, `db pull`, remote DB URLs,
production keys, `.env.local` credentials or a different existing stack.
The runner deliberately rejects unverified CLI/status formats and non-test URLs.

```text
npm run test:run
npm run test:db:start
npm run test:db
npm run test:db:integrity
```

`test:db:start` captures CLI output without echoing local keys. It starts only the
`tests/os/db/supabase/config.toml` stack (`and-os-security-test`).
`test:db` requires its exact API origin `http://127.0.0.1:55321` and named Docker
container `supabase_db_and-os-security-test`. It does not install tools or use
Production as a fallback. Service/anon keys and synthetic JWTs remain in memory
and child environment; no credential files or token logs are written.

The runner invokes the installed package's bin through Node (npm-local equivalent),
not a global PATH CLI. CLI state is isolated under the ignored test `.supabase/`
directory, production Supabase environment variables and binary overrides are
removed from that CLI child environment, and its cwd is the test directory.
`npx --no-install supabase --version` is also available; no unpinned npx install is used.

CI can run the same three commands on a Node 24.16+ worker with Docker after
`npm ci`. No hosted Supabase account is needed.
Two-run repeatability and fixture cleanup were actually verified locally. A hosted
CI execution itself has not been performed.

## Setup / run / reset

1. Reject a nonempty estimates/profiles/cost DB without the test ownership marker.
2. Create reconstructed test-only profiles/estimates schema.
3. Load tracked cost DDL and original role helpers from `supabase/cost_items.sql`,
   stopping before its price seed. Neither untracked SQL file is loaded.
4. Load `production/cost-schema.CAPTURED.sql` generated from the metadata JSON.
   Verify the 12 original function definitions/signatures/config/EXECUTE ACLs
   against the capture, then apply merged `patches/cost-rpc.PROPOSED_CANONICAL.sql`.
   Retired `cost-support.sql` and the earlier mutation substitute are not used.
5. Load unchanged tracked cancel/publish and RFC-006 contract SQL, then the local
   `patches/contract-manifest-lock.PROPOSED.sql` integrity guard candidate.
6. Create eight local Auth fixture accounts, get real JWTs, seed test profiles.
7. Probe original role helpers for inactive/password-required admin. Observations
   are only emitted after actual execution; no current DB gap is claimed yet.
8. Apply `patches/role-boundaries.PROPOSED.sql` only to the owned isolated DB.
9. Seed two synthetic estimates and one cost fixture. Run the 99 candidate DB cases
   twice, resetting the fixtures before each case and each run.
10. Finally remove only the three reserved estimate UUIDs, fixture cost/history,
    fixture publish reason, and exact fixture Auth accounts. No DROP/TRUNCATE.

The schema/standard-spec seed stays in the dedicated stack for subsequent runs.
To abandon the candidate, stop/remove **only this disposable stack** via the
approved local CLI procedure and recreate it. Never run rollback against a
hosted project. Reset failure is fatal and reported, not ignored.

## Integrity mode

`test:db:integrity` loads the tracked audit DDL for real Next create/confirm routes,
then runs `vitest.integrity.config.mjs` twice with actual local JWTs.
The 56 cases cover create/confirm atomicity, locks, canonical hashes, change-order
evidence/transitions, cost draft/cancel/publish and failure rollback, and actual
frontend HTML rendering of confirmed snapshots.

Use only the dedicated stack. The integrity reset briefly disables lock triggers
inside its owned, transaction-scoped fixture cleanup, deletes only reserved fixture
relations, then re-enables them. Trigger protection tests run with guards enabled.
Auth cleanup sends explicit hard-delete JSON and closes parent CLI harness HTTP
connections; only exact fixture UUID DELETE can retry once for a transient socket
failure. Create, confirm and publish never silently retry.

The manifest guard PROPOSED file is installed only on the marked local stack.
Normal confirm/change approval remains allowed; locked manifest/amount changes
are denied. KF-008A/B, KF-009 and KF-010 now execute ordinary passing assertions.
No production schema is accessed or patched. Legacy missing-clause fallback is
read-only and cannot retroactively prove historical wording.

## Fidelity and limitations

- Real Supabase Auth/JWT/PostgREST/auth.uid()/RLS are required, not mocks.
- profiles/estimates DDL is reconstructed from storage/API usage, not a migration.
- Operating cost function/schema/ACL definitions were captured on 2026-10-12.
  Source replay is verified before local hardening candidates. Tracked publisher
  body exactly matches the capture. Save no-op/default/null/false semantics now
  match production, with explicit local row-lock/finite-value hardening additions.
  PG17 MAINTAIN table ACL is preserved in JSON but omitted only from PG15 replay.
  Hardened candidate PASS is not a claim that production was modified or tested
  with real business data. Full captured schema/provenance/comparison are in
  `docs/db-baseline/`. No test or CI command accesses production.
  Version rollback is the existing frontend history-to-draft workflow, not a new RPC.
- Contract confirmation RPC GRANTs use the tracked RFC-006 DDL. The security mode
  does not create/confirm packages; integrity mode verifies those transactions.
- Table GRANT, row visibility, EXECUTE, SECURITY DEFINER, search_path and role
  checks are separate checks. DELETE 200 with zero rows is denial, not success;
  service re-query confirms persistence for denied UPDATE/DELETE.
- The safe view models only a small nested whitelist. It is not wired into the
  current app, and is not a complete staff create/update solution.
- Candidate staff raw reads/writes are denied. A future server write API must
  preserve/recalculate internals, reject injection, and return safe JSON before
  production hardening can be proposed for rollout.
- No project/user membership source exists in this fixture. Cross-project
  ownership IDOR is not proven by the two-row fixture or role checks.
- Mock client deletion guard PASS does not mean DB enforcement PASS.
- Original production policy definitions/state are not fetched or duplicated.

## Sources

[Supabase local CLI](https://supabase.com/docs/guides/local-development/cli/getting-started),
[legacy Docker CLI workdir/status flags](https://github.com/supabase/cli/blob/develop/apps/cli/docs/go-cli-reference.md),
[PostgreSQL view privileges and security-barrier semantics](https://www.postgresql.org/docs/current/sql-createview.html).
