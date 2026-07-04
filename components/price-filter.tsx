"use client"

import { useSearchParams, useRouter } from "next/navigation"
import qs from "query-string"
import Button from "@/components/ui/Button"
import { cn } from "@/lib/utils"

const RANGES: { label: string; min?: number; max?: number }[] = [
  { label: "Under $50", max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $250", min: 100, max: 250 },
  { label: "$250 – $500", min: 250, max: 500 },
  { label: "Over $500", min: 500 },
]

const PriceFilter = () => {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentMin = searchParams.get("minPrice") ?? undefined
  const currentMax = searchParams.get("maxPrice") ?? undefined

  const isActive = (min?: number, max?: number) =>
    String(min ?? "") === (currentMin ?? "") &&
    String(max ?? "") === (currentMax ?? "")

  const onClick = (min?: number, max?: number) => {
    const current = qs.parse(searchParams.toString())
    const active = isActive(min, max)

    const query = {
      ...current,
      minPrice: active || min === undefined ? null : min,
      maxPrice: active || max === undefined ? null : max,
    }

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
        {RANGES.map((range) => (
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
