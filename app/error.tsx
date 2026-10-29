"use client"

// Route-level error boundary (Next.js App Router). Rendered inside the root
// layout, so the navbar and footer stay in place. Reached when a server
// component throws, including `CatalogUnavailableError` from lib/api.ts when
// the admin API is down while a product or category page is requested.

import { useEffect } from "react"
import Link from "next/link"
import { RefreshCw } from "lucide-react"

import Container from "@/components/ui/container"

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Server-side details are already in the server logs; this only helps
    // when debugging in the browser. The message never reaches the markup.
    console.error("[route-error]", error.digest ?? error.name)
  }, [error])

  return (
    <Container>
      <div className="flex flex-col items-center justify-center gap-y-5 px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-neutral-800">We couldn&apos;t load this page</h1>
        <p className="max-w-md text-neutral-500">
          The catalog is temporarily unavailable. Your cart is unchanged. Please try again in a moment.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-x-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Back to home
          </Link>
        </div>
        {error.digest && <p className="text-xs text-neutral-400">Reference: {error.digest}</p>}
      </div>
    </Container>
  )
}
