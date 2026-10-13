import { defineConfig } from "vitest/config";
import { TEST_ORIGIN } from "./tests/os/db/guard.mjs";

export default defineConfig({
  test: {
    include: ["tests/os/db/**/*.db.test.js"],
    exclude: ["tests/os/db/integrity/**", "tests/os/db/staff/**", ...(process.env.AND_OS_DB_REBUILD === "1" ? [] : ["tests/os/db/rebuild/**"])],
    environment: "node", maxWorkers: 1, fileParallelism: false,
    setupFiles: ["tests/os/db/setup.mjs"], testTimeout: process.env.AND_OS_DB_REBUILD === "1" ? 60000 : 20000, hookTimeout: 20000,
    env: { SUPABASE_URL: TEST_ORIGIN, NEXT_PUBLIC_SUPABASE_URL: TEST_ORIGIN },
  },
});
