"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, ShoppingBag, Home, ClipboardList, Truck } from "lucide-react"
import toast from "react-hot-toast"

import Container from "@/components/ui/container"
import useCart from "@/hooks/use-cart"
import useOrders from "@/hooks/use-orders"

const REDIRECT_SECONDS = 5

const OrderSuccessContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") ?? undefined

  const removeAll = useCart((state) => state.removeAll)
  const addOrder = useOrders((state) => state.addOrder)

  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)

  // Clear the cart, record the order, and greet the customer — once.
  useEffect(() => {
    removeAll()
    if (orderId) addOrder(orderId)
    toast.success("🎉 Order placed successfully! Thank you for shopping with QuickCart.")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown + auto-redirect to the catalog (interruptible by any button).
  useEffect(() => {
    if (seconds <= 0) {
      router.push("/products")
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, router])

  const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  )

  return (
    <Container>
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
        {/* Animated success icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600"
          >
            <Check className="h-9 w-9 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-8 space-y-3"
        >
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Order successfully placed
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for shopping with QuickCart. Your order has been confirmed.
          </p>
        </motion.div>

        {/* Order details card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 p-6 text-left"
        >
          {orderId && (
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <span className="text-sm text-gray-500">Order ID</span>
              <span className="font-mono text-sm font-medium text-gray-900">
                #{orderId.slice(0, 8).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-x-3 pt-3">
            <Truck className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Estimated delivery</p>
              <p className="text-sm text-gray-500">{deliveryDate} (3–5 business days)</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/products"
            className="inline-flex items-center gap-x-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ClipboardList className="h-4 w-4" /> View Orders
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Browse Products
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <Home className="h-4 w-4" /> Go to Home
          </Link>
        </motion.div>

        <p className="mt-6 text-sm text-gray-400">
          Redirecting to products in {seconds}s…
        </p>
      </div>
    </Container>
  )
}

export default OrderSuccessContent
