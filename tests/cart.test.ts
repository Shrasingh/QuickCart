import { describe, expect, it } from "vitest";

import { cartTotal, toCents } from "@/lib/cart";

describe("toCents", () => {
  it("converts decimal strings and numbers to integer cents", () => {
    expect(toCents("19.99")).toBe(1999);
    expect(toCents(5)).toBe(500);
    expect(toCents("0.1")).toBe(10);
  });

  it("rounds half-cent artefacts from the API", () => {
    expect(toCents("1.005")).toBe(101);
    expect(toCents("2.675")).toBe(268);
  });

  it("treats invalid, negative or missing prices as 0", () => {
    expect(toCents("abc")).toBe(0);
    expect(toCents("")).toBe(0);
    expect(toCents(-3)).toBe(0);
    expect(toCents(null)).toBe(0);
    expect(toCents(undefined)).toBe(0);
    expect(toCents(Number.NaN)).toBe(0);
  });
});

describe("cartTotal", () => {
  it("is 0 for an empty cart", () => {
    expect(cartTotal([])).toBe(0);
  });

  it("sums prices exactly (no floating-point drift)", () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004
    expect(cartTotal([{ price: "0.1" }, { price: "0.2" }])).toBe(0.3);
    expect(cartTotal([{ price: "19.99" }, { price: "5.01" }, { price: "100" }])).toBe(125);
  });

  it("ignores items with unparseable prices rather than producing NaN", () => {
    expect(cartTotal([{ price: "10" }, { price: "n/a" }])).toBe(10);
  });
});
