import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_TIMEOUT_MS, apiGet, fetchJson, getApiBaseUrl } from "@/lib/api";

const fetchMock = vi.fn();
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  // The helper logs on failure; keep test output clean.
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

describe("getApiBaseUrl", () => {
  it("returns the configured URL without a trailing slash", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://admin.example.com/api/store-1/";
    expect(getApiBaseUrl()).toBe("https://admin.example.com/api/store-1");
  });

  it("returns null (and logs once) when unset", () => {
    process.env.NEXT_PUBLIC_API_URL = "";
    expect(getApiBaseUrl()).toBeNull();
    expect(getApiBaseUrl()).toBeNull();
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});

describe("fetchJson", () => {
  it("returns parsed JSON on 2xx and passes a timeout signal", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: "p1" }) });

    await expect(fetchJson("https://api.example.com/products/p1", null)).resolves.toEqual({ id: "p1" });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(API_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it("returns the fallback on a non-2xx response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    await expect(fetchJson("https://api.example.com/x", [])).resolves.toEqual([]);
  });

  it("returns the fallback when the request throws (network error / timeout)", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError"));
    await expect(fetchJson("https://api.example.com/x", null)).resolves.toBeNull();
  });

  it("returns the fallback when the body is not valid JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    await expect(fetchJson("https://api.example.com/x", [])).resolves.toEqual([]);
  });
});

describe("apiGet", () => {
  it("resolves the path against the base URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

    await apiGet("/sizes", []);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.com/sizes");
  });

  it("returns the fallback without fetching when the API URL is unset", async () => {
    process.env.NEXT_PUBLIC_API_URL = "";
    await expect(apiGet("/sizes", [])).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
