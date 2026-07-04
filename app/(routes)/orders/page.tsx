"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardList } from "lucide-react"
import Container from "@/components/ui/container"
import useOrders from "@/hooks/use-orders"

const OrdersPage = () => {
  const orders = useOrders((state) => state.orders)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <Container>
      <div className="px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Orders placed on this device.
        </p>

        {orders.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-y-4 rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ClipboardList className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
              <p className="mx-auto max-w-md text-sm text-gray-500">
                When you place an order it will appear here.
              </p>
            </div>
            <Link
              href="/products"
              className="mt-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Confirmed
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  )
}

export default OrdersPage
