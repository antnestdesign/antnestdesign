# Local Estimate Item Builder Checks

These checks require the existing owned PG17 synthetic stack (`and-os-migration-rebuild-test`, API `127.0.0.1:56321`). They never use hosted credentials, link a project, reset the stack, or mutate non-test estimates. Apply only the five new forward SQL files to an isolated database before use; do not run them against Production.

Start the isolated preview with `node tests/os/item-builder/preview.mjs ON`.

Run `api.mjs`, then `detailed.mjs`, then `concurrency.mjs`. Run `browser.mjs` for actual admin/staff/manager workflows at 1440/375/360px. `pdf.mjs` uses the existing print container and renderer. `modes.mjs` additionally expects separate isolated OFF/READ_ONLY preview processes on 3112/3113.

`direct-price-browser.mjs` checks direct per-unit cost entry, server-derived selling prices, publication, quote selection/save/reload, V1 price preservation and manager/staff boundaries. It preserves the user's `타일 테스트` template and versions.

Run `sale-prices.mjs` then `sale-price-browser.mjs` for explicit selling prices, unknown cost, manager price-only publication, staff price requests/approval and V1/V2 preservation. These checks never change the user's `타일 테스트` item or the cost master.

Artifacts default to the OS temporary `and-os-item-builder-checks` folder, outside the repository. `AND_OS_ITEM_TEST_OUTPUT` can select a local artifact folder. Credentials and tokens are never written to artifacts. Browser checks use the same bundled Playwright convention as the existing test tools.

The existing large rebuild harness still targets its signed ten-migration baseline. Do not run its reset workflow on a preview stack. The item-builder changes have a separate fresh-PG17 SQL-chain check; updating the full rebuild harness is a later release-preflight task.
