import {Tab, TabGroup, TabList } from '@headlessui/react'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import { Image as ImageType } from '@/type'


interface GalleryTabProps {
    image : ImageType
    /** Accessible name: the thumbnail is an icon-only button, so it needs one. */
    label : string
}

const GalleryTab : React.FC<GalleryTabProps> = ({
    image,
    label
}) => {
  return (
    <Tab aria-label={label} className='relative flex aspect-square cursor-pointer 
    items-center justify-center rounded-md bg-white'>
        {({selected}) => (
            <div>
                <span className='absolute h-full w-full aspect-square inset-0
                overflow-hidden rounded-md '>
                    <Image
                        fill
                        src={image.url}
                        alt=""
                        className='object-cover object-center'
                        
                        
                    />
                </span>
                <span className={cn("absolute inset-0 rounded-md ring-2 ring-offset-2", selected ? "ring-black" : "ring-transparent")}
                    />
            </div>
        )}
    </Tab>
  )
}

export default GalleryTab