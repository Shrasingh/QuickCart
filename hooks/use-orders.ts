import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export interface PlacedOrder {
  id: string
  date: string
}

interface OrdersStore {
  orders: PlacedOrder[]
  addOrder: (id: string) => void
}

// Guest order history persisted to localStorage (the storefront has no auth,
// so orders placed on this device are remembered here).
const useOrders = create(
  persist<OrdersStore>(
    (set, get) => ({
      orders: [],
      addOrder: (id: string) => {
        if (!id || get().orders.some((o) => o.id === id)) return
        set({ orders: [{ id, date: new Date().toISOString() }, ...get().orders] })
      },
    }),
    {
      name: "quickcart-orders",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export default useOrders
