import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CHECKOUT_FALLBACK_MESSAGE,
  CHECKOUT_UNAVAILABLE_MESSAGE,
  getCheckoutErrorMessage,
  isSafeCheckoutUrl,
  onBackForwardRestore,
} from "@/lib/checkout";

/**
 * Builds the error axios throws for a non-2xx response. `contentType` mirrors
 * what the admin sends: `text/plain` for its deliberate error messages,
 * `text/html` for a framework 404 page, `application/json` for JSON bodies.
 */
function httpError(status: number, data: unknown, contentType?: string): AxiosError {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  return new AxiosError(`Request failed with status code ${status}`, "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: "",
    headers: contentType ? { "content-type": contentType } : {},
    config,
    data,
  });
}

const PLAIN = "text/plain;charset=UTF-8";
const HTML_404 = "<!DOCTYPE html><html><head><title>404: This page could not be found</title></head><body>…</body></html>";

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
  it("surfaces the admin's customer-facing 4xx text when the body is text/plain", () => {
    const msg = "Some items in your cart are no longer available. Please review your cart and try again.";
    expect(getCheckoutErrorMessage(httpError(400, msg, PLAIN))).toBe(msg);
  });

  it("accepts the content type case-insensitively and via a capitalised header key", () => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
    const err = new AxiosError("x", "ERR_BAD_REQUEST", config, undefined, {
      status: 400,
      statusText: "",
      headers: { "Content-Type": "TEXT/PLAIN" },
      config,
      data: "Order total must be at least $0.50.",
    });
    expect(getCheckoutErrorMessage(err)).toBe("Order total must be at least $0.50.");
  });

  it("truncates very long text/plain 4xx bodies", () => {
    expect(getCheckoutErrorMessage(httpError(400, "x".repeat(500), PLAIN))).toHaveLength(200);
  });

  it("never shows an HTML 4xx body (misconfigured API URL -> framework 404 page)", () => {
    expect(getCheckoutErrorMessage(httpError(404, HTML_404, "text/html; charset=utf-8"))).toBe(
      CHECKOUT_FALLBACK_MESSAGE
    );
  });

  it("never shows HTML even when it is mislabelled as text/plain", () => {
    expect(getCheckoutErrorMessage(httpError(404, HTML_404, PLAIN))).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });

  it("does not trust a 4xx string body that has no content type", () => {
    expect(getCheckoutErrorMessage(httpError(400, "Some message"))).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });

  it("falls back when a text/plain 4xx body is empty, or when the body is JSON", () => {
    expect(getCheckoutErrorMessage(httpError(400, "   ", PLAIN))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(httpError(400, { error: "x" }, "application/json"))).toBe(
      CHECKOUT_FALLBACK_MESSAGE
    );
  });

  it("never exposes 5xx bodies, even plain text", () => {
    expect(getCheckoutErrorMessage(httpError(500, "Internal error: stack trace", PLAIN))).toBe(
      CHECKOUT_FALLBACK_MESSAGE
    );
    expect(getCheckoutErrorMessage(httpError(502, HTML_404, "text/html"))).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });

  it("gives a specific message for 503 (admin misconfigured)", () => {
    expect(getCheckoutErrorMessage(httpError(503, "anything", PLAIN))).toBe(CHECKOUT_UNAVAILABLE_MESSAGE);
  });

  it("falls back for network errors and unknown values", () => {
    const network = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getCheckoutErrorMessage(network)).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(new Error("boom"))).toBe(CHECKOUT_FALLBACK_MESSAGE);
    expect(getCheckoutErrorMessage(undefined)).toBe(CHECKOUT_FALLBACK_MESSAGE);
  });
});

// These tests cover the listener wiring only (registration, the `persisted`
// check, and cleanup) against a stubbed `window`. Whether a real browser
// restores the cart page from its back-forward cache after Stripe is not
// something a unit test can establish.
describe("onBackForwardRestore", () => {
  type Listener = (event: { persisted: boolean }) => void;

  function stubWindow() {
    const listeners = new Map<string, Set<Listener>>();
    const fakeWindow = {
      addEventListener: vi.fn((type: string, fn: Listener) => {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type)!.add(fn);
      }),
      removeEventListener: vi.fn((type: string, fn: Listener) => {
        listeners.get(type)?.delete(fn);
      }),
      dispatch(type: string, event: { persisted: boolean }) {
        listeners.get(type)?.forEach((fn) => fn(event));
      },
    };
    vi.stubGlobal("window", fakeWindow);
    return fakeWindow;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a pageshow listener and calls back only for bfcache restores", () => {
    const win = stubWindow();
    const onRestore = vi.fn();

    onBackForwardRestore(onRestore);
    expect(win.addEventListener).toHaveBeenCalledWith("pageshow", expect.any(Function));

    win.dispatch("pageshow", { persisted: false }); // normal navigation / reload
    expect(onRestore).not.toHaveBeenCalled();

    win.dispatch("pageshow", { persisted: true }); // restored from bfcache
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it("removes the listener when the returned cleanup runs", () => {
    const win = stubWindow();
    const onRestore = vi.fn();

    const cleanup = onBackForwardRestore(onRestore);
    cleanup();

    expect(win.removeEventListener).toHaveBeenCalledWith("pageshow", expect.any(Function));
    win.dispatch("pageshow", { persisted: true });
    expect(onRestore).not.toHaveBeenCalled();
  });

  it("is a no-op without a window (server rendering)", () => {
    // The node test environment has no `window` unless stubbed.
    expect(typeof window).toBe("undefined");
    const cleanup = onBackForwardRestore(() => {
      throw new Error("must not be called");
    });
    expect(() => cleanup()).not.toThrow();
  });
});
