import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import getProducts from "@/actions/get-products";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  // The shared client logs failed requests; keep test output clean.
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getProducts", () => {
  it("includes provided filters in the query string and omits unset ones", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => [] });

    await getProducts({ categoryId: "c1", search: "lamp", minPrice: 10, maxPrice: 50 });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url.startsWith("https://api.example.com/products?")).toBe(true);
    expect(url).toContain("categoryId=c1");
    expect(url).toContain("search=lamp");
    expect(url).toContain("minPrice=10");
    expect(url).toContain("maxPrice=50");
    // Unset filters must not appear in the query.
    expect(url).not.toContain("colorId");
    expect(url).not.toContain("sizeId");
  });

  it("returns the parsed products on a 200 response", async () => {
    const products = [{ id: "p1" }, { id: "p2" }];
    fetchMock.mockResolvedValue({ ok: true, json: async () => products });
    await expect(getProducts({})).resolves.toEqual(products);
  });

  it("returns an empty list on a non-ok response instead of throwing", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    await expect(getProducts({})).resolves.toEqual([]);
  });

  it("returns an empty list when the request throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(getProducts({})).resolves.toEqual([]);
  });
});
