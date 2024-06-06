import { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { Autour_One } from "next/font/google"

export interface ButtonProps 
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = forwardRef <HTMLButtonElement, ButtonProps>(({
    
    className,
    children,
    disabled,
    type = "button",
    ...props
}, ref) => (
    <button ref={ref}
        className={cn(
           `w-auto 
            rounded-full
            bg-black 
            border-transparent 
            px-5
            py-3
            disabled:cursor-not-allowed
            disabled:opacity-50
            text-white
            font-semibold
            hover:opacity-75
            transition

            `,
            className
        )}
        {...props}
        disabled
        >
        {children}
    </button>
))
Button.displayName = "Button"
export default Button