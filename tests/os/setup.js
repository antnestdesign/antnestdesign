import { afterEach, beforeEach, expect, vi } from "vitest";
import { requestLog, resetNetworkMock } from "./helpers/network.js";

beforeEach(() => {
  resetNetworkMock();
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
  vi.stubGlobal("alert", vi.fn());
  vi.stubGlobal("confirm", vi.fn(() => false));
  if (typeof window !== "undefined") {
    vi.spyOn(window, "print").mockImplementation(() => {});
  }
});

afterEach(() => {
  // This hook cannot be inverted by test.fails: unexpected I/O is a suite failure.
  expect(requestLog.unexpected, "Unregistered request; no real network is allowed").toEqual([]);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
