import { describe, expect, it } from "vitest";

import {
  PRICE_RANGES,
  buildPriceQuery,
  buildSearchUrl,
  isPriceRangeActive,
  toggleFilterValue,
} from "@/lib/filters";

describe("buildSearchUrl", () => {
  it("builds /products?q=… for a term, trimming and encoding", () => {
    expect(buildSearchUrl("  red shoes  ")).toBe("/products?q=red%20shoes");
  });

  it("returns /products for an empty or whitespace term", () => {
    expect(buildSearchUrl("")).toBe("/products");
    expect(buildSearchUrl("   ")).toBe("/products");
  });
});

describe("isPriceRangeActive", () => {
  it("matches when the URL min/max equal the range (string vs number)", () => {
    expect(isPriceRangeActive("50", "100", 50, 100)).toBe(true);
  });

  it("treats an undefined bound as the empty string (open-ended ranges)", () => {
    expect(isPriceRangeActive(undefined, "50", undefined, 50)).toBe(true); // Under $50
    expect(isPriceRangeActive(undefined, undefined, undefined, 50)).toBe(false);
  });

  it("is false when the bounds differ", () => {
    expect(isPriceRangeActive("50", "100", 100, 250)).toBe(false);
  });
});

describe("buildPriceQuery", () => {
  it("sets both bounds for a new range and preserves other params", () => {
    expect(buildPriceQuery({ colorId: "c1" }, undefined, undefined, 50, 100)).toEqual({
      colorId: "c1",
      minPrice: 50,
      maxPrice: 100,
    });
  });

  it("clears the bounds when the clicked range is already active (toggle off)", () => {
    expect(buildPriceQuery({ colorId: "c1" }, "50", "100", 50, 100)).toEqual({
      colorId: "c1",
      minPrice: null,
      maxPrice: null,
    });
  });

  it("nulls an undefined bound for an open-ended range", () => {
    expect(buildPriceQuery({}, undefined, undefined, 500, undefined)).toEqual({
      minPrice: 500,
      maxPrice: null,
    });
  });
});

describe("toggleFilterValue", () => {
  it("selects a value, keeping other filters", () => {
    expect(toggleFilterValue({ sizeId: "s1" }, "colorId", "c1")).toEqual({
      sizeId: "s1",
      colorId: "c1",
    });
  });

  it("clears the value when it is already selected", () => {
    expect(toggleFilterValue({ colorId: "c1" }, "colorId", "c1")).toEqual({ colorId: null });
  });
});

describe("PRICE_RANGES", () => {
  it("defines the five price bands the UI renders", () => {
    expect(PRICE_RANGES).toHaveLength(5);
    expect(PRICE_RANGES[0]).toEqual({ label: "Under $50", max: 50 });
    expect(PRICE_RANGES[4]).toEqual({ label: "Over $500", min: 500 });
  });
});
