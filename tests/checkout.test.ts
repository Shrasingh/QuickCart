import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import {
  CHECKOUT_FALLBACK_MESSAGE,
  CHECKOUT_UNAVAILABLE_MESSAGE,
  getCheckoutErrorMessage,
  isSafeCheckoutUrl,
} from "@/lib/checkout";

/** Builds the error axios throws for a non-2xx response. */
function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("isSafeCheckoutUrl", () => {
  it("accepts absolute https URLs", () => {
    expect(isSafeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_123")).toBe(true);
  });

  it("rejects non-https, relative, javascript: and non-string values", () => {
    expect(isSafeCheckoutUrl("http://checkout.stripe.com/x")).toBe(false);
    expect(isSafeCheckoutUrl("/cart")).toBe(false);
    expect(isSafeCheckoutUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeCheckoutUrl("")).toBe(false);
    expect(isSafeCheckoutUrl(undefined)).toBe(false);
    expect(isSafeCheckoutUrl({ url: "https://x" })).toBe(false);
  });
});

describe("getCheckoutErrorMessage", () => {
  it("surfaces the admin's customer-facing 4xx text", () => {
    const msg = "Some items in your cart are no longer available. Please review your cart and try again.";
    expect(getCheckoutErrorMessage(httpError(400, msg))).toBe(msg);
  });

  it("truncates very long 4xx bodies", () => {
    expect(getCheckoutErrorMessage(httpError(400, "x".repeat(500)))).toHaveLength(200);
  });

  it("falls back when a 4xx body is empty or not text", () => {
    expect(getCheckoutErrorMessage(httpError(400, ""))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(httpError(400, { error: "x" }))).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });

  it("never exposes 5xx bodies", () => {
    expect(getCheckoutErrorMessage(httpError(500, "Internal error: stack trace"))).toBe(
      CHECKOUT_FALLBACK_MESSAGE
    );
  });

  it("gives a specific message for 503 (admin misconfigured)", () => {
    expect(getCheckoutErrorMessage(httpError(503, "anything"))).toBe(CHECKOUT_UNAVAILABLE_MESSAGE);
  });

  it("falls back for network errors and unknown values", () => {
    const network = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getCheckoutErrorMessage(network)).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(new Error("boom"))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(undefined)).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });
});
