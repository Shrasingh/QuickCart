"use client"

import useHydrated from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

export const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

interface CurrencyProps {
    value?: string | number
    className?: string
}

const  Currency : React.FC<CurrencyProps> = ({
    value,
    className
}) => {
    // Prices are often read from the localStorage-backed cart, which the
    // server can't see; render only after hydration to avoid a mismatch.
    const hydrated = useHydrated()
    if (!hydrated) {
        return null
    }

  return (
    <span className={cn('font-semibold', className)}>
        {formatter.format(Number(value))}
    </span>
  )
}

export default Currency
