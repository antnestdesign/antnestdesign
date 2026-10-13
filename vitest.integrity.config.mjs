import { defineConfig } from "vitest/config";
import { TEST_ORIGIN } from "./tests/os/db/guard.mjs";

export default defineConfig({
  test: {
    include: ["tests/os/db/integrity/**/*.db.test.js"], environment: "node",
    exclude: process.env.AND_OS_DB_REBUILD === "1" ? [] : ["tests/os/db/integrity/rebuild.db.test.js"],
    maxWorkers: 1, fileParallelism: false,
    environmentOptions: { jsdom: { url: "https://os.invalid", runScripts: "outside-only" } },
    setupFiles: ["tests/os/db/setup.mjs"], testTimeout: 30000, hookTimeout: 30000,
    reporters: ["default", "./tests/os/helpers/regression-reporter.mjs"],
    env: { SUPABASE_URL: TEST_ORIGIN, NEXT_PUBLIC_SUPABASE_URL: TEST_ORIGIN },
  },
});
