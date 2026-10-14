import { expect, test, vi } from "vitest";
import { testProfile, testSession } from "../fixtures/estimates.js";
import { jsonResponse } from "../helpers/network.js";

const storageKey = "and-os.auth-session";

function session(role = "staff", overrides = {}) {
  return {
    ...testSession(role),
    refresh_token: "synthetic-refresh-original",
    expires_at: Math.floor(Date.now() / 1000) - 60,
    ...overrides,
  };
}

async function restore(value) {
  vi.resetModules();
  sessionStorage.setItem(storageKey, JSON.stringify(value));
  const storage = await import("../../../public/os-app/src/storage.js");
  storage.loadStoredSession();
  return storage;
}

function refreshed(role = "staff") {
  return session(role, {
    access_token: "synthetic-access-renewed",
    refresh_token: "synthetic-refresh-rotated",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
}

test.each(["admin", "manager", "staff"])("%s restores expired session by refreshing before /me", async (role) => {
  const storage = await restore(session(role));
  const calls = [];
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    calls.push(String(url));
    if (String(url).includes("grant_type=refresh_token")) {
      expect(JSON.parse(options.body)).toEqual({ refresh_token: "synthetic-refresh-original" });
      return jsonResponse(refreshed(role));
    }
    expect(options.headers.Authorization).toBe("Bearer synthetic-access-renewed");
    return jsonResponse(testProfile(role));
  }));
  expect(await storage.loadCurrentOsUser()).toEqual(testProfile(role));
  expect(calls).toHaveLength(2);
  expect(calls[0]).toContain("grant_type=refresh_token");
  expect(calls[1]).toBe("/api/os/me");
  expect(JSON.parse(sessionStorage.getItem(storageKey)).refresh_token).toBe("synthetic-refresh-rotated");
});

test("legacy session without expiry refreshes on 401 and retries only once", async () => {
  const storage = await restore(session("staff", { expires_at: undefined }));
  let meCalls = 0;
  let refreshCalls = 0;
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    if (String(url).includes("grant_type=refresh_token")) {
      refreshCalls += 1;
      return jsonResponse(refreshed());
    }
    meCalls += 1;
    if (meCalls === 1) return jsonResponse({ error: "Unauthorized" }, 401);
    expect(options.headers.Authorization).toBe("Bearer synthetic-access-renewed");
    return jsonResponse(testProfile("staff"));
  }));
  expect((await storage.loadCurrentOsUser()).role).toBe("staff");
  expect({ meCalls, refreshCalls }).toEqual({ meCalls: 2, refreshCalls: 1 });
});

test("persistent 401 does not loop or replay a mutation more than once", async () => {
  const storage = await restore(session("staff", { expires_at: undefined }));
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=refresh_token")
    ? jsonResponse(refreshed()) : jsonResponse({ error: "Unauthorized" }, 401)));
  await expect(storage.saveContractOptions("synthetic-id", {})).rejects.toThrow("로그인이 필요합니다.");
  expect(vi.mocked(fetch).mock.calls).toHaveLength(3);
});

test("403 permission denial never refreshes or retries", async () => {
  const storage = await restore(session("manager", { expires_at: undefined }));
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "접근 권한이 없습니다." }, 403)));
  await expect(storage.loadCurrentOsUser()).rejects.toThrow("접근 권한이 없습니다.");
  expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
});

test("invalid refresh ends local session without sending /me", async () => {
  const storage = await restore(session());
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "synthetic-invalid-refresh" }, 400)));
  await expect(storage.loadCurrentOsUser()).rejects.toThrow("로그인이 필요합니다.");
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
});

test("concurrent expired requests share one token rotation", async () => {
  const storage = await restore(session());
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=refresh_token")
    ? pending : jsonResponse(testProfile("staff"))));
  const requests = [storage.loadCurrentOsUser(), storage.loadCurrentOsUser()];
  await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls).toHaveLength(1));
  release(jsonResponse(refreshed()));
  await Promise.all(requests);
  expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("grant_type=refresh_token"))).toHaveLength(1);
});

test("logout during refresh cannot resurrect a session", async () => {
  const storage = await restore(session());
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=refresh_token")
    ? pending : jsonResponse({})));
  const loading = storage.loadCurrentOsUser();
  const rejected = expect(loading).rejects.toThrow("로그인이 필요합니다.");
  await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls).toHaveLength(1));
  await storage.signOut();
  release(jsonResponse(refreshed()));
  await rejected;
  expect(sessionStorage.getItem(storageKey)).toBeNull();
  expect(vi.mocked(fetch).mock.calls.some(([url]) => url === "/api/os/me")).toBe(false);
});

test("login derives expiry and logout clears the rotated session", async () => {
  vi.resetModules();
  const storage = await import("../../../public/os-app/src/storage.js");
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=password")
    ? jsonResponse(session("admin", { expires_at: undefined, expires_in: 3600 })) : jsonResponse({})));
  await storage.signIn("synthetic@example.invalid", "synthetic-password");
  const stored = JSON.parse(sessionStorage.getItem(storageKey));
  expect(stored.expires_at).toBeGreaterThan(Date.now() / 1000 + 3500);
  await storage.signOut();
  expect(sessionStorage.getItem(storageKey)).toBeNull();
});

test("temporary refresh failure preserves credentials and never sends a stale request", async () => {
  const original = session();
  const storage = await restore(original);
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 503)));
  await expect(storage.loadCurrentOsUser()).rejects.toThrow("로그인 세션을 갱신하지 못했습니다.");
  expect(JSON.parse(sessionStorage.getItem(storageKey))).toEqual(original);
  expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
});

test("admin REST read also uses the refreshed token", async () => {
  const storage = await restore(session("admin"));
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    if (String(url).includes("grant_type=refresh_token")) return jsonResponse(refreshed("admin"));
    expect(options.headers.Authorization).toBe("Bearer synthetic-access-renewed");
    return String(url) === "/api/os/me" ? jsonResponse(testProfile("admin")) : jsonResponse([]);
  }));
  await storage.loadCurrentOsUser();
  expect(await storage.loadEstimates()).toEqual([]);
});

test("session about to expire is renewed before the first protected request", async () => {
  const storage = await restore(session("manager", { expires_at: Math.floor(Date.now() / 1000) + 15 }));
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=refresh_token")
    ? jsonResponse(refreshed("manager")) : jsonResponse(testProfile("manager"))));
  await storage.loadCurrentOsUser();
  expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("grant_type=refresh_token");
});

test("concurrent legacy 401 responses share refresh and retry with the same new token", async () => {
  const storage = await restore(session("staff", { expires_at: undefined }));
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  vi.stubGlobal("fetch", vi.fn(async (url, options) => {
    if (String(url).includes("grant_type=refresh_token")) return pending;
    return options.headers.Authorization === "Bearer synthetic-access-renewed"
      ? jsonResponse(testProfile("staff")) : jsonResponse({}, 401);
  }));
  const requests = [storage.loadCurrentOsUser(), storage.loadCurrentOsUser()];
  await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("grant_type=refresh_token"))).toHaveLength(1));
  release(jsonResponse(refreshed()));
  await Promise.all(requests);
  expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("grant_type=refresh_token"))).toHaveLength(1);
});

test("new login is not overwritten by an older in-flight refresh", async () => {
  const storage = await restore(session());
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const newSession = session("admin", { access_token: "synthetic-new-login", expires_at: Math.floor(Date.now() / 1000) + 3600 });
  vi.stubGlobal("fetch", vi.fn(async (url) => String(url).includes("grant_type=refresh_token")
    ? pending : jsonResponse(newSession)));
  const loading = storage.loadCurrentOsUser();
  const rejected = expect(loading).rejects.toThrow("로그인이 필요합니다.");
  await vi.waitFor(() => expect(vi.mocked(fetch).mock.calls).toHaveLength(1));
  await storage.signIn("synthetic@example.invalid", "synthetic-password");
  release(jsonResponse(refreshed()));
  await rejected;
  expect(JSON.parse(sessionStorage.getItem(storageKey)).access_token).toBe("synthetic-new-login");
});

test("session without a refresh token fails closed on 401 without retry", async () => {
  const storage = await restore(testSession("staff"));
  vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 401)));
  await expect(storage.loadCurrentOsUser()).rejects.toThrow("로그인이 필요합니다.");
  expect(vi.mocked(fetch).mock.calls).toHaveLength(1);
});
