"use client"

import Button from "@/components/ui/Button"
import useCart from "@/hooks/use-cart";
import useHydrated from "@/hooks/use-hydrated";
import { ShoppingBag } from "lucide-react"
import { useRouter } from "next/navigation";


const NavbarActions = () => {

    const cart = useCart()
    const router = useRouter()
    const hydrated = useHydrated()

    // The item count comes from localStorage; render it only after hydration.
    if (!hydrated) return null

    const count = cart.items.length

    return(
        <div className="ml-auto flex items-center gap-x-4" >
            <Button
            onClick={() => router.push('/cart')}
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="flex items-center rounded-full bg-black px-3 py-3">
                <ShoppingBag
                    size={20}
                    color="white"
                />
                <span className="ml-2 text-sm font-medium text-white">
                    {count}
                </span>

            </Button>
        </div>
    )
}

export default NavbarActions
