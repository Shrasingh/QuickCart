import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SITE_URL, resolveSiteUrl } from "@/lib/site-url";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveSiteUrl", () => {
  it("returns the configured absolute http(s) URL", () => {
    expect(resolveSiteUrl("https://quick-cart-eta-ecru.vercel.app").href).toBe(
      "https://quick-cart-eta-ecru.vercel.app/"
    );
    expect(resolveSiteUrl("  http://localhost:3001/ ").origin).toBe("http://localhost:3001");
  });

  it("falls back to the default when unset or blank, without warning", () => {
    expect(resolveSiteUrl(undefined).href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(resolveSiteUrl("").href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(resolveSiteUrl("   ").href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("falls back (and warns once) on a bare hostname or non-http scheme instead of throwing", () => {
    // `new URL("quick-cart-eta-ecru.vercel.app")` throws; that used to fail `next build`.
    expect(() => resolveSiteUrl("quick-cart-eta-ecru.vercel.app")).not.toThrow();
    expect(resolveSiteUrl("quick-cart-eta-ecru.vercel.app").href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(resolveSiteUrl("javascript:alert(1)").href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(resolveSiteUrl("ftp://example.com").href).toBe(`${DEFAULT_SITE_URL}/`);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
