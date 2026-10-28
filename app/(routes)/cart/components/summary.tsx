"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import toast from "react-hot-toast"

import Button from "@/components/ui/Button"
import Currency from "@/components/ui/currency"
import useCart from "@/hooks/use-cart"
import { getApiBaseUrl } from "@/lib/api"
import { cartTotal } from "@/lib/cart"
import {
  CHECKOUT_UNAVAILABLE_MESSAGE,
  getCheckoutErrorMessage,
  isSafeCheckoutUrl,
  onBackForwardRestore,
} from "@/lib/checkout"

const CHECKOUT_TIMEOUT_MS = 15_000

const Summary = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const items = useCart((state) => state.items)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Successful payments are redirected to /order-success (which clears the
    // cart and shows the confirmation). Here we only handle cancellations.
    if (searchParams.get("canceled")) {
      toast.error("Payment canceled. Your cart is unchanged — you can try again when ready.")
      // Drop the flag from the URL so a reload or bookmark does not repeat
      // the message for a cancellation that already happened.
      router.replace("/cart")
    }
  }, [searchParams, router])

  // If the shopper presses Back on the Stripe page, the browser may restore
  // this page from the back-forward cache with `isSubmitting` still true.
  // Re-enable the button in that case; the listener is removed on unmount.
  useEffect(() => onBackForwardRestore(() => setIsSubmitting(false)), [])

  const totalPrice = cartTotal(items)

  const onCheckout = async () => {
    // Guard against double submission: every request creates a new (unpaid)
    // order and Stripe session on the server, so a second click must be a no-op.
    if (isSubmitting || items.length === 0) return

    // Same base URL (and trailing-slash handling) as the server-side data
    // client. Without it there is nothing to call; say so instead of POSTing
    // to a relative "undefined/checkout" on our own origin.
    const apiBaseUrl = getApiBaseUrl()
    if (!apiBaseUrl) {
      toast.error(CHECKOUT_UNAVAILABLE_MESSAGE)
      return
    }
    setIsSubmitting(true)

    try {
      const response = await axios.post(
        `${apiBaseUrl}/checkout`,
        { productIds: items.map((item) => item.id) },
        { timeout: CHECKOUT_TIMEOUT_MS }
      )

      const url: unknown = response.data?.url
      if (!isSafeCheckoutUrl(url)) {
        throw new Error("Checkout did not return a valid redirect URL")
      }

      // Leave the button disabled: the browser is navigating away to Stripe.
      window.location.assign(url)
    } catch (error) {
      toast.error(getCheckoutErrorMessage(error))
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="mt-16 rounded-lg bg-gray-50 px-4 py-6
      sm:p-6 lg:p-8 lg:col-span-5 lg:mt-0"
    >
      <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
      <div className="mt-6 space-y-4">
        <div
          className="flex items-center justify-between
          border-t border-gray-200 pt-4"
        >
          <div className="text-base font-medium text-gray-900">Order total</div>
          <Currency value={totalPrice} />
        </div>
        {/* The cart holds product snapshots; the admin re-prices from its
            database and re-checks availability when the order is created. */}
        <p className="text-xs text-gray-500">
          Prices and availability are confirmed at checkout.
        </p>
      </div>
      <Button
        disabled={items.length === 0 || isSubmitting}
        aria-busy={isSubmitting}
        onClick={onCheckout}
        className="w-full mt-6"
      >
        {isSubmitting ? "Redirecting to payment…" : "Checkout"}
      </Button>
    </div>
  )
}

export default Summary
