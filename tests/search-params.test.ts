import { describe, expect, it } from "vitest";

import { firstParam, priceParam } from "@/lib/search-params";

describe("firstParam", () => {
  it("returns a trimmed single value", () => {
    expect(firstParam("  lamp ")).toBe("lamp");
  });

  it("takes the first value when the key is repeated (?q=a&q=b) instead of throwing", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(() => firstParam(["a", "b"])).not.toThrow();
  });

  it("treats blank, empty-array and missing values as unset", () => {
    expect(firstParam("   ")).toBeUndefined();
    expect(firstParam([])).toBeUndefined();
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe("priceParam", () => {
  it("accepts non-negative decimals as strings", () => {
    expect(priceParam("50")).toBe("50");
    expect(priceParam("19.99")).toBe("19.99");
    expect(priceParam(["250", "999"])).toBe("250");
  });

  it.each(["abc", "-1", "1e999", "Infinity", "NaN", "$5", "5,00", ""])("drops %s rather than forwarding it", (value) => {
    expect(priceParam(value)).toBeUndefined();
  });
});
