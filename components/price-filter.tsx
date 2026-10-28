"use client"

import { useSearchParams, useRouter } from "next/navigation"
import qs from "query-string"
import Button from "@/components/ui/Button"
import { cn } from "@/lib/utils"
import { PRICE_RANGES, buildPriceQuery, isPriceRangeActive } from "@/lib/filters"

const PriceFilter = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentMin = searchParams.get("minPrice") ?? undefined
  const currentMax = searchParams.get("maxPrice") ?? undefined

  const isActive = (min?: number, max?: number) =>
    isPriceRangeActive(currentMin, currentMax, min, max)

  const onClick = (min?: number, max?: number) => {
    const current = qs.parse(searchParams.toString())
    const query = buildPriceQuery(current, currentMin, currentMax, min, max)

    const url = qs.stringifyUrl(
      { url: window.location.href, query },
      { skipNull: true }
    )
    router.push(url)
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold">Price</h3>
      <hr className="my-4" />
      <div className="flex flex-wrap gap-2">
        {PRICE_RANGES.map((range) => (
          <div key={range.label} className="flex items-center">
            <Button
              className={cn(
                "rounded-md text-sm text-gray-800 p-2 bg-white border border-gray-300",
                isActive(range.min, range.max) && "bg-black text-white"
              )}
              onClick={() => onClick(range.min, range.max)}
            >
              {range.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PriceFilter
