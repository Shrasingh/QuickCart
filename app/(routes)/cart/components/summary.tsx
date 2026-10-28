"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import toast from "react-hot-toast"

import Button from "@/components/ui/Button"
import Currency from "@/components/ui/currency"
import useCart from "@/hooks/use-cart"
import { cartTotal } from "@/lib/cart"
import { getCheckoutErrorMessage, isSafeCheckoutUrl } from "@/lib/checkout"

const CHECKOUT_TIMEOUT_MS = 15_000

const Summary = () => {
  const searchParams = useSearchParams()
  const items = useCart((state) => state.items)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    // Successful payments are redirected to /order-success (which clears the
    // cart and shows the confirmation). Here we only handle cancellations.
    if (searchParams.get("canceled")) {
      toast.error("Payment canceled. Your cart is unchanged — you can try again when ready.")
    }
  }, [searchParams])

  const totalPrice = cartTotal(items)

  const onCheckout = async () => {
    // Guard against double submission: every request creates a new (unpaid)
    // order and Stripe session on the server, so a second click must be a no-op.
    if (isSubmitting || items.length === 0) return
    setIsSubmitting(true)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
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
