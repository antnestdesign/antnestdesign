import { createLocalFetch } from "./guard.mjs";

if (process.env.AND_OS_DB_TEST !== "1") throw new Error("BLOCKED — LOCAL SUPABASE REQUIRED");
globalThis.fetch = createLocalFetch(globalThis.fetch);
