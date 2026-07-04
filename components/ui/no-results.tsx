"use client"

import { PackageOpen } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface NoResultsProps {
  title?: string
  message?: string
  showReset?: boolean
}

const NoResults: React.FC<NoResultsProps> = ({
  title = "No products found",
  message = "We couldn't find anything matching your filters. Try adjusting or clearing them, or explore the full catalog.",
  showReset = true,
}) => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 rounded-xl border border-dashed border-gray-200 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <PackageOpen className="h-8 w-8 text-gray-400" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-gray-500">{message}</p>
      </div>
      <ul className="text-sm text-gray-400">
        <li>• Check your spelling or use fewer keywords</li>
        <li>• Remove a size, color or price filter</li>
        <li>• Browse a different category</li>
      </ul>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/products"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Browse All Products
        </Link>
        {showReset && (
          <button
            onClick={() => router.push(pathname)}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  )
}

export default NoResults
