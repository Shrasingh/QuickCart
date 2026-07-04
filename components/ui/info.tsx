"use client"

import { Product } from '@/type'
import Currency from './currency'
import Button from './Button'
import { ShoppingCart, Check, X } from 'lucide-react'
import useCart from '@/hooks/use-cart'

import { MouseEventHandler } from "react";

interface InfoProps {
    data : Product
}

const Info : React.FC<InfoProps> = ({
    data
}) => {
    const cart = useCart();

    const price = Number(data.price);
    const originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
    const hasDiscount = !!originalPrice && originalPrice > price;
    const discountPct = hasDiscount
        ? Math.round((1 - price / (originalPrice as number)) * 100)
        : 0;
    const outOfStock = data.isInStock === false;

    const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
        event.stopPropagation();
        if (outOfStock) return;
        cart.addItem(data)
      };

  return (
    <div>
        {data.brand && (
            <p className='text-sm font-medium uppercase tracking-wide text-gray-400'>{data.brand}</p>
        )}
        <h1 className='text-3xl font-bold text-gray-900'>{data.name}</h1>
        <div className='mt-3 flex items-end gap-x-3'>
            <p className='text-2xl text-gray-900'>
                <Currency value={data.price}/>
            </p>
            {hasDiscount && (
                <>
                    <Currency value={data.originalPrice as string} className='text-lg font-normal text-gray-400 line-through' />
                    <span className='rounded-full bg-red-600 px-2 py-0.5 text-sm font-semibold text-white'>
                        -{discountPct}%
                    </span>
                </>
            )}
        </div>
        <hr className='my-4'/>
        <div className='flex flex-col gap-y-6'>
            <div className='flex items-center gap-x-4'>
            <h3 className='font-semibold text-black'>Size:</h3>
            <div>
            {data?.size?.name}
            </div>
            </div>
            <div className='flex items-center gap-x-4'>
            <h3 className='font-semibold text-black'>Color:</h3>
            <p>{data?.color?.name}</p>
            <div className='h-6 w-6 rounded-full border border-gray-600 '
            style={{backgroundColor: data?.color?.value}}
            />
            </div>
            <div className='flex items-center gap-x-2'>
            {outOfStock ? (
                <span className='flex items-center gap-x-1 text-sm font-medium text-red-600'>
                    <X size={16} /> Out of stock
                </span>
            ) : (
                <span className='flex items-center gap-x-1 text-sm font-medium text-green-600'>
                    <Check size={16} /> In stock
                </span>
            )}
            </div>
        </div>
        {data.description && (
            <div className='mt-6'>
                <h3 className='mb-2 font-semibold text-black'>Description</h3>
                <p className='text-sm leading-relaxed text-gray-600'>{data.description}</p>
            </div>
        )}
        <div className='mt-10 flex items-center gap-x-3'>
        <Button className='flex items-center gap-x-2 disabled:cursor-not-allowed disabled:opacity-50'
            onClick={onAddToCart}
            disabled={outOfStock}
        >
            {outOfStock ? 'Out of stock' : 'Add to cart'}
            <ShoppingCart/>
        </Button>
        </div>
    </div>
  )
}

export default Info
