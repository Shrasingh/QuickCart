import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface PlacedOrder {
  id: string
  date: string
}

interface OrdersStore {
  orders: PlacedOrder[]
  /**
   * Remembers an order id placed from this device. Returns true the first
   * time an id is seen and false when it was already recorded, so callers
   * (the order-received page) can act once per order and not on every visit.
   */
  addOrder: (id: string) => boolean
  hasOrder: (id: string) => boolean
}

// Guest order history persisted to localStorage (the storefront has no auth,
// so orders placed on this device are remembered here).
const useOrders = create(
  persist<OrdersStore>(
    (set, get) => ({
      orders: [],
      hasOrder: (id: string) => get().orders.some((o) => o.id === id),
      addOrder: (id: string) => {
        if (!id || get().hasOrder(id)) return false
        set({ orders: [{ id, date: new Date().toISOString() }, ...get().orders] })
        return true
      },
    }),
    {
      name: "quickcart-orders",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useOrders
