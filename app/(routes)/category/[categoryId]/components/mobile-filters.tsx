"use client"

import { useState } from "react"

import { Color, Size } from "@/type"
import Button from "@/components/ui/Button"
import { Plus, X } from "lucide-react"
import { Dialog, DialogPanel } from "@headlessui/react"
import IconButton from "@/components/ui/icon-button"
import Filter from "./filter"

interface MobileFiltersProps {
    sizes : Size[]
    colors : Color[]
}




const MobileFilters : React.FC<MobileFiltersProps> = ({
    sizes, colors
}) => {

    const [open, setOpen] = useState(false)

    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)

  return (
    <>
        <Button
            className='flex items-center gap-x-2 lg:hidden'
            onClick={onOpen}
        >
            Filters
            <Plus size={20}/>
        </Button>
        <Dialog open={open} onClose={onClose} as="div" className="relative z-40 lg:hidden">
            {/* Backgeound */}
            <div className="fixed inset-0 bg-black bg-opacity-20"/>

            {/* Dialog position */}
            <div className="fixed inset-0 z-40 flex">
            <DialogPanel className="relative ml-auto flex h-full w-full max-w-xs 
            flex-col overflow-y-auto bg-white py-4 pb-6 shadow-xl">

                {/* close button */}
                <div className="flex items-center justify-end px-4" onClick={onClose} >
                    <IconButton onClick={onClose} icon={<X size={15} />} />
                </div>

                {/* Render filter */}
                <div className="p-4">
                <Filter 
                    valueKey="sizeId"
                    name="Sizes"
                    data={sizes}
                            />
                <Filter 
                    valueKey="colorId"
                    name="Colors"
                    data={colors}
                  />
                </div>
            </DialogPanel>
            </div>
        </Dialog>
        
    </>
  )
}

export default MobileFilters