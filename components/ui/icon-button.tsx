import { cn } from "@/lib/utils"
import { MouseEventHandler } from "react"



interface IconButtonProps {
    onClick: MouseEventHandler<HTMLButtonElement>;
    icon: React.ReactNode;
    className?: string;
}

const IconButton : React.FC<IconButtonProps> = ({
    onClick,
    icon,
    className
}) => {
    return (

        <button 
        onClick={onClick}
        className={cn(
            `rounded-full flex items-center justify-center p-2 bg-white border
             shadow-md hover:scale-110 transition`, className)
            }
        >
            {icon}

        </button>
    )
}

export default IconButton