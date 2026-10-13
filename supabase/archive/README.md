# Historical SQL References

These files are NOT migrations and must not be executed by the canonical chain.
Phase 4A/B explicitly resolved the two previously untracked files on 2026-10-13.
They were moved without changing a byte; SHA256 values are in the object inventory.

| File | Identity and decision |
|---|---|
| cost_items_v2_3.sql | Historical draft/publish implementation. Its version allocator body matches Production, but draft/cancel/publish bodies predate the approved mutation guard and pending-new behavior. Superseded; preserve for reference, never replay. |
| rfc_003a_user_profiles.sql | Historical profile/account migration. Production has its fields/defaults/check/index/self-select/update trigger and matching trigger-function body. It also contains a business-row UPDATE backfill and incomplete privilege revocation compared with the forward boundary. Baseline absorbs current schema, not the backfill. Preserve for reference, never replay. |

Neither file supplies the final canonical implementation. See `../migrations/`
and `../../docs/AND_OS_DB_MIGRATION_BASELINE.md` for ordered sources.
