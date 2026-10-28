// Pure helpers for the checkout request, extracted from the cart summary so
// the error mapping, redirect guard and back-navigation handling can be
// unit-tested.

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

/** True when the response declares a plain-text body (`Content-Type: text/plain…`). */
function isPlainTextResponse(headers: unknown): boolean {
  if (!headers || typeof headers !== "object") return false
  const record = headers as Record<string, unknown>
  const contentType = record["content-type"] ?? record["Content-Type"]
  return typeof contentType === "string" && contentType.trim().toLowerCase().startsWith("text/plain")
}

/**
 * Maps a failed checkout request to a message the customer can act on.
 *
 * The admin API answers 4xx with a plain-text explanation that is written for
 * customers (e.g. "Some items in your cart are no longer available…"), so we
 * show it — but only when the response actually declares `text/plain`. A
 * misconfigured API URL yields an HTML 404 page, which must never reach a
 * toast. 5xx and network failures get a generic message so server internals
 * are never surfaced.
 */
export function getCheckoutErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response) {
    const { status, data, headers } = error.response
    if (status >= 400 && status < 500 && isPlainTextResponse(headers)) {
      const text = typeof data === "string" ? data.trim() : ""
      // Belt and braces: a mislabelled HTML document still starts with "<".
      if (text && !text.startsWith("<")) return text.slice(0, 200)
    }
    if (status === 503) return CHECKOUT_UNAVAILABLE_MESSAGE
  }
  return CHECKOUT_FALLBACK_MESSAGE
}

/**
 * Invokes `onRestore` when the page is restored from the browser's
 * back-forward cache — for example when the shopper presses Back on the
 * Stripe Checkout page. In that case React state survives, so any "submitting"
 * flag set before the navigation must be cleared or the button stays disabled.
 *
 * Returns the unsubscribe function, so it can be returned directly from a
 * React effect. Safe to call during SSR (no-op without `window`).
 */
export function onBackForwardRestore(onRestore: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (event: PageTransitionEvent) => {
    if (event.persisted) onRestore()
  }
  window.addEventListener("pageshow", handler)
  return () => window.removeEventListener("pageshow", handler)
}

/**
 * Maximum length of an order id accepted from the `/order-success` URL. The
 * admin issues UUIDs (36 characters); the bound only guards against junk.
 */
const ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

/**
 * Returns the order id from the `?orderId=` query parameter if it looks like
 * one, else null. Stripe appends the id the admin put in `success_url`, so a
 * missing or malformed value means the page was reached some other way
 * (bookmark, typed URL, crawler) and must not behave as if an order was
 * placed. The id is only ever used as a label; it authorises nothing.
 */
export function parseOrderId(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null
  const id = raw.trim()
  return ORDER_ID_PATTERN.test(id) ? id : null
}
