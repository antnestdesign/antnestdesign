# AND OS Database Sources

`migrations/` is the ordered source of truth for future schema changes.
Phase 4A/B has generated but NOT executed/adopted this chain.
It is not Production-ready until Phase 4C blank managed-Supabase replay passes.

Root RFC/cost SQL files are historical references and local test input, NOT an
alternative deployment chain. Do not batch-run them with the new migrations.
`archive/` resolves the two former untracked SQL references; do not execute them.
`tests/os/db/` remains isolated test support, never a Production migration source
at execution time. Forward files contain self-contained promoted statements.

Existing Production must not run `20261013000000_prod_baseline.sql`:
reconcile exact metadata, then adopt the baseline version in Phase 4D under
separate approval. Only forward migrations are candidates for live application.

No customer/Auth/storage rows or cost/spec seeds are included in this chain.
Reference catalog/price provisioning for a new environment is a separate task.
