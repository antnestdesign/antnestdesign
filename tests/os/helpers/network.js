import { vi } from "vitest";

export const requestLog = { requests: [], unexpected: [] };
let handler = null;

export function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function resetNetworkMock() {
  handler = null;
  requestLog.requests.length = 0;
  requestLog.unexpected.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (input, init = {}) => {
    const url = new URL(String(input), "https://os.invalid");
    const request = {
      url,
      method: init.method || "GET",
      body: init.body ? JSON.parse(init.body) : null,
    };
    requestLog.requests.push(request);
    const response = handler ? await handler(request) : null;
    if (response) return response;
    const description = `${request.method} ${url.pathname}${url.search}`;
    requestLog.unexpected.push(description);
    throw new Error(`Network disabled: ${description}`);
  }));
}

export function setMockHandler(nextHandler) {
  handler = nextHandler;
}

export function clearRequestLog() {
  requestLog.requests.length = 0;
}

export function mutations() {
  return requestLog.requests.filter(({ method, url }) => !["GET", "HEAD"].includes(method)
    && !(method === "POST" && ["/api/os/estimates/calculate", "/api/os/estimates/preview", "/api/os/contract-packages/preview"].includes(url.pathname)));
}
