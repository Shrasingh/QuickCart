import { beforeEach, describe, expect, it } from "vitest";

import useOrders from "@/hooks/use-orders";

beforeEach(() => {
  useOrders.setState({ orders: [] });
  localStorage.clear();
});

describe("useOrders", () => {
  it("records a new order id once and reports it as new", () => {
    expect(useOrders.getState().addOrder("o1")).toBe(true);
    expect(useOrders.getState().orders.map((o) => o.id)).toEqual(["o1"]);
    expect(useOrders.getState().hasOrder("o1")).toBe(true);
  });

  it("reports an already recorded id as not new, so a revisit of /order-success does nothing", () => {
    useOrders.getState().addOrder("o1");
    expect(useOrders.getState().addOrder("o1")).toBe(false);
    expect(useOrders.getState().orders).toHaveLength(1);
  });

  it("ignores an empty id", () => {
    expect(useOrders.getState().addOrder("")).toBe(false);
    expect(useOrders.getState().orders).toEqual([]);
  });

  it("keeps the most recent order first and persists under the documented key", () => {
    useOrders.getState().addOrder("o1");
    useOrders.getState().addOrder("o2");
    expect(useOrders.getState().orders.map((o) => o.id)).toEqual(["o2", "o1"]);
    const stored = JSON.parse(localStorage.getItem("quickcart-orders") ?? "{}");
    expect(stored.state.orders.map((o: { id: string }) => o.id)).toEqual(["o2", "o1"]);
  });
});
