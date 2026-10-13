export const REBUILD_MODE = process.env.AND_OS_DB_REBUILD === "1";
export const TEST_ORIGIN = REBUILD_MODE ? "http://127.0.0.1:56321" : "http://127.0.0.1:55321";
export const TEST_CONTAINER = REBUILD_MODE ? "supabase_db_and-os-migration-rebuild-test" : "supabase_db_and-os-security-test";

export function assertTestUrl(input) {
  const url = new URL(input);
  if (REBUILD_MODE && url.origin === "http://127.0.0.1:3044" && !url.username && !url.password
    && (url.pathname.startsWith("/api/os/") || url.pathname === "/os" || url.pathname.startsWith("/os-app/"))) return url;
  if (url.origin !== TEST_ORIGIN || url.username || url.password) {
    throw new Error("Blocked: only the dedicated loopback Test Supabase is allowed");
  }
  if (!url.pathname.startsWith("/auth/v1/") && !url.pathname.startsWith("/rest/v1/")) {
    throw new Error("Blocked: only local Auth/REST test endpoints are allowed");
  }
  return url;
}

export function createLocalFetch(nativeFetch) {
  return (input, init = {}) => {
    const url = assertTestUrl(input);
    // Do not follow even a localhost response redirect to a hosted project.
    return nativeFetch(url, { ...init, redirect: "error" });
  };
}
