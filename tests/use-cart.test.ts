import { beforeEach, describe, expect, it, vi } from "vitest";

// The store toasts on add/remove; silence it in tests.
vi.mock("react-hot-toast", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

import useCart from "@/hooks/use-cart";
import type { Product } from "@/type";

const product = (id: string): Product => ({ id } as unknown as Product);

beforeEach(() => {
  useCart.getState().removeAll();
  localStorage.clear();
});

describe("useCart", () => {
  it("adds an item to the cart", () => {
    useCart.getState().addItem(product("p1"));
    expect(useCart.getState().items.map((i) => i.id)).toEqual(["p1"]);
  });

  it("does not add the same product twice", () => {
    useCart.getState().addItem(product("p1"));
    useCart.getState().addItem(product("p1"));
    expect(useCart.getState().items).toHaveLength(1);
  });

  it("removes an item by id, leaving the rest", () => {
    useCart.getState().addItem(product("p1"));
    useCart.getState().addItem(product("p2"));
    useCart.getState().removeItem("p1");
    expect(useCart.getState().items.map((i) => i.id)).toEqual(["p2"]);
  });

  it("clears the whole cart", () => {
    useCart.getState().addItem(product("p1"));
    useCart.getState().addItem(product("p2"));
    useCart.getState().removeAll();
    expect(useCart.getState().items).toEqual([]);
  });
});
