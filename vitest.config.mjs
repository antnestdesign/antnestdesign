import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/os/**/*.test.js"],
    exclude: ["tests/os/db/**/*.db.test.js"],
    environment: "jsdom",
    maxWorkers: 1,
    environmentOptions: { jsdom: { url: "https://os.invalid", runScripts: "outside-only" } },
    setupFiles: ["tests/os/setup.js"],
    reporters: ["default", "./tests/os/helpers/regression-reporter.mjs"],
    clearMocks: true,
    env: {
      SUPABASE_URL: "https://supabase.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-service-key",
    },
  },
});
