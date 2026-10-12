// @vitest-environment node
import { expect, test, vi } from "vitest";
import { assertTestUrl, createLocalFetch, TEST_ORIGIN } from "../db/guard.mjs";

test.each([
  "https://lzsxboaqliuwjzwsnnwf.supabase.co/rest/v1/estimates",
  "https://other-project.supabase.co/auth/v1/user",
  "http://127.0.0.1:54321/rest/v1/estimates",
  "http://localhost:55321/rest/v1/estimates",
  "http://user:pass@127.0.0.1:55321/rest/v1/estimates",
  "http://127.0.0.1:55321/storage/v1/object",
])("DB runner rejects non-test URL %s before fetch", async (url) => {
  const nativeFetch = vi.fn();
  const localFetch = createLocalFetch(nativeFetch);
  expect(() => localFetch(url)).toThrow("Blocked:");
  expect(nativeFetch).not.toHaveBeenCalled();
});

test("DB runner forces redirect rejection on its only allowed origin", async () => {
  expect(assertTestUrl(`${TEST_ORIGIN}/rest/v1/estimates`).origin).toBe(TEST_ORIGIN);
  const nativeFetch = vi.fn().mockResolvedValue(new Response("[]"));
  await createLocalFetch(nativeFetch)(`${TEST_ORIGIN}/rest/v1/estimates`, { redirect: "follow" });
  expect(nativeFetch.mock.calls[0][1].redirect).toBe("error");
});
