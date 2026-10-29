import { cn } from "@/lib/utils"

export const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

interface CurrencyProps {
    value?: string | number
    className?: string
}

/**
 * Formats a price. Rendered on the server too, so catalog prices are in the
 * HTML for crawlers and the first paint. Components whose value comes from
 * localStorage (the cart) gate themselves with `useHydrated` before rendering
 * this, which is where the hydration guard belongs.
 */
const Currency: React.FC<CurrencyProps> = ({ value, className }) => {
  const amount = typeof value === "string" ? Number(value.trim()) : value
  return (
    <span className={cn("font-semibold", className)}>
      {typeof amount === "number" && Number.isFinite(amount) ? formatter.format(amount) : "—"}
    </span>
  )
}

export default Currency
