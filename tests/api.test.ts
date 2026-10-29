import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_TIMEOUT_MS, CatalogUnavailableError, apiGet, apiGetOne, fetchJson, getApiBaseUrl, isArray, isRecord } from "@/lib/api";

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

describe("fetchJson with a shape guard", () => {
  it("returns the fallback when the body is JSON but not the expected shape", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ error: "boom" }) });
    await expect(fetchJson("https://api.example.com/categories", [], isArray)).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("unexpected response shape"));
  });

  it.each([null, "text", 42, {}])("treats %j as the wrong shape for a list", async (body) => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => body });
    await expect(fetchJson("https://api.example.com/sizes", [], isArray)).resolves.toEqual([]);
  });

  it("passes an array through", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [{ id: "s1" }] });
    await expect(fetchJson("https://api.example.com/sizes", [], isArray)).resolves.toEqual([{ id: "s1" }]);
  });
});

describe("isRecord", () => {
  it("accepts an object with a non-empty string id and nothing else", () => {
    expect(isRecord({ id: "p1" })).toBe(true);
    expect(isRecord({ id: "" })).toBe(false);
    expect(isRecord({})).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord([{ id: "p1" }])).toBe(false);
    expect(isRecord("p1")).toBe(false);
  });
});

describe("apiGetOne (single record)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("returns the record on 200", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "p1", name: "Lamp" }) });
    await expect(apiGetOne("/products/p1", isRecord)).resolves.toEqual({ id: "p1", name: "Lamp" });
  });

  it("returns null only for a 404, so the page can render 'not found'", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: async () => "Product not found" });
    await expect(apiGetOne("/products/missing", isRecord)).resolves.toBeNull();
  });

  it.each([
    ["a 500", { ok: false, status: 500, json: async () => "Internal error" }],
    ["a 503", { ok: false, status: 503, json: async () => "" }],
    ["an unexpected shape", { ok: true, status: 200, json: async () => ({}) }],
    ["invalid JSON", { ok: true, status: 200, json: async () => { throw new SyntaxError("<"); } }],
  ])("throws CatalogUnavailableError on %s instead of pretending the record is missing", async (_label, response) => {
    fetchMock.mockResolvedValue(response);
    await expect(apiGetOne("/products/p1", isRecord)).rejects.toBeInstanceOf(CatalogUnavailableError);
  });

  it("throws CatalogUnavailableError on a timeout or network failure", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError"));
    await expect(apiGetOne("/products/p1", isRecord)).rejects.toBeInstanceOf(CatalogUnavailableError);
  });

  it("throws CatalogUnavailableError when the API URL is not configured", async () => {
    process.env.NEXT_PUBLIC_API_URL = "";
    await expect(apiGetOne("/products/p1", isRecord)).rejects.toBeInstanceOf(CatalogUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never leaks the admin URL's host into the error message beyond the path", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => "" });
    await expect(apiGetOne("/products/p1", isRecord)).rejects.toThrow(/\(\/products\/p1\)/);
  });
});
