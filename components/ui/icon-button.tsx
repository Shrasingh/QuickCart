import { cn } from "@/lib/utils"
import { MouseEventHandler } from "react"

interface IconButtonProps {
    onClick: MouseEventHandler<HTMLButtonElement>;
    icon: React.ReactNode;
    className?: string;
    /** Accessible name — icon-only buttons have no visible text, so this is required. */
    label: string;
    disabled?: boolean;
}

const IconButton : React.FC<IconButtonProps> = ({
    onClick,
    icon,
    className,
    label,
    disabled,
}) => {
    return (
        <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        disabled={disabled}
        className={cn(
            `rounded-full flex items-center justify-center p-2 bg-white border
             shadow-md hover:scale-110 transition disabled:cursor-not-allowed disabled:opacity-50`, className)
            }
        >
            {icon}

        </button>
    )
}

export default IconButton
