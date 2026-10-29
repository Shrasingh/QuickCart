"use client"

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Category } from "@/type";

 
interface MainNavProps {
    data : Category[]
}

const MainNav : React.FC<MainNavProps> = ({
    data
}) => {

    const pathname = usePathname();

    const routes = data.map((route) => ({
        href : `/category/${route.id}`,
        label : route.name, 
        active : pathname === `/category/${route.id}`
    }))
    // min-w-0 lets the nav shrink inside the navbar row instead of forcing the
    // whole page wider than the viewport; overflow-x-auto then scrolls the
    // category list sideways on narrow screens (scrollbar hidden).
    return (
        <nav
            aria-label="Categories"
            className="mx-6 flex min-w-0 items-center space-x-4 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:space-x-6"
        >
            {routes.map((route) => (
                <Link href={route.href} key={route.href} 
                className={cn("shrink-0 text-sm font-medium transition-colors hover:text-black", 
                route.active ? "text-black" : "dark:text-neutral-500")}
                >
                    {route.label}
                </Link>
            ))}
        </nav>
    )
}
export default MainNav