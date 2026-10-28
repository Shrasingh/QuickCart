// Pure helpers for the checkout request, extracted from the cart summary so
// the error mapping and redirect guard can be unit-tested.

import axios from "axios"

export const CHECKOUT_FALLBACK_MESSAGE =
  "Checkout failed. Please try again in a moment."

export const CHECKOUT_UNAVAILABLE_MESSAGE =
  "Checkout is temporarily unavailable. Please try again later."

/**
 * The storefront navigates the browser to whatever URL the checkout endpoint
 * returns. That endpoint is our own admin API, but we still refuse anything
 * that is not an absolute https URL so a misconfigured or compromised backend
 * can't send customers to `javascript:` or plain-http destinations.
 */
export function isSafeCheckoutUrl(url: unknown): url is string {
  if (typeof url !== "string") return false
  try {
    return new URL(url).protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Maps a failed checkout request to a message the customer can act on.
 *
 * The admin API answers 4xx with a plain-text explanation that is written for
 * customers (e.g. "Some items in your cart are no longer available…"), so we
 * show it. 5xx and network failures get a generic message so server internals
 * are never surfaced.
 */
export function getCheckoutErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    const { status, data } = error.response
    if (status >= 400 && status < 500) {
      const text = typeof data === "string" ? data.trim() : ""
      if (text) return text.slice(0, 200)
    }
    if (status === 503) return CHECKOUT_UNAVAILABLE_MESSAGE
  }
  return CHECKOUT_FALLBACK_MESSAGE
}
