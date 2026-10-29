"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Check, ShoppingBag, Home, ClipboardList, Truck, ShoppingCart } from "lucide-react"
import toast from "react-hot-toast"

import Container from "@/components/ui/container"
import useCart from "@/hooks/use-cart"
import useOrders from "@/hooks/use-orders"
import { parseOrderId } from "@/lib/checkout"

const REDIRECT_SECONDS = 5

const OrderSuccessContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Stripe sends the shopper here with the id the admin placed in success_url.
  // Without a well-formed id this page was reached some other way, so it must
  // not clear the cart or announce an order. The id is a label only: payment
  // is confirmed admin-side by the Stripe webhook, never by this page.
  const orderId = parseOrderId(searchParams.get("orderId"))

  const removeAll = useCart((state) => state.removeAll)
  const addOrder = useOrders((state) => state.addOrder)

  const [seconds, setSeconds] = useState(REDIRECT_SECONDS)

  // Clear the cart, record the order, and greet the customer — once per id.
  // `addOrder` returns false when this device has already recorded the id
  // (a reload, a bookmark, Back from the catalog, or a re-shared link), in
  // which case the cart is left alone: it may already hold a new order.
  useEffect(() => {
    if (!orderId) return
    if (!addOrder(orderId)) return
    removeAll()
    toast.success("🎉 Order received! Thanks for shopping with QuickCart.")
  }, [orderId, removeAll, addOrder])

  // Countdown + auto-redirect to the catalog (interruptible by any button).
  useEffect(() => {
    if (!orderId) return
    if (seconds <= 0) {
      router.push("/products")
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [orderId, seconds, router])

  // Computed once on mount so re-renders (the countdown) don't recompute it.
  const [deliveryDate] = useState(() =>
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
      "en-US",
      { weekday: "long", month: "long", day: "numeric" }
    )
  )

  if (!orderId) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900">No order to show</h1>
          <p className="mt-2 max-w-md text-gray-500">
            This page is shown after a payment is submitted. Your cart has not been changed.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/cart"
              className="inline-flex items-center gap-x-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4" /> Go to cart
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </Container>
    )
  }

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
            Order received
          </h1>
          <p className="text-lg text-gray-600">
            Thanks for shopping with QuickCart. Your order has been received and your
            payment is being processed.
          </p>
        </motion.div>

        {/* Order details card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 p-6 text-left"
        >
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="text-sm text-gray-500">Order ID</span>
            <span className="font-mono text-sm font-medium text-gray-900">
              #{orderId.slice(0, 8).toUpperCase()}
            </span>
          </div>
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
