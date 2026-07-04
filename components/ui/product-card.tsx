"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MouseEventHandler } from "react";

import IconButton from "./icon-button";
import Currency from "./currency";
import { Product } from "@/type";
import { Expand, ShoppingCart } from "lucide-react";
import usePreviewModal from "@/hooks/use-preview-model";
import useCart from "@/hooks/use-cart";

interface ProductCardProps {
  data: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ data }) => {
  const cart = useCart();
  const router = useRouter();
  const previewModel = usePreviewModal();

  const price = Number(data.price);
  const originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
  const hasDiscount = !!originalPrice && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / (originalPrice as number)) * 100)
    : 0;
  const outOfStock = data.isInStock === false;

  const handleClick = () => {
    router.push(`/product/${data?.id}`);
  };

  const onPreview: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    previewModel.onOpen(data);
  };

  const onAddToCart: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    if (outOfStock) return;
    cart.addItem(data);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white group cursor-pointer rounded-xl border p-3 space-y-4 transition hover:shadow-md"
    >
      {/* Images and Actions */}
      <div className="aspect-square rounded-xl bg-gray-100 relative">
        <Image
          src={data?.images?.[0]?.url ?? "/placeholder.svg"}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          alt={data.name ?? "Product image"}
          className="aspect-square object-cover rounded-md"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
              -{discountPct}%
            </span>
          )}
          {data.isFeatured && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
              Featured
            </span>
          )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60">
            <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
              Out of stock
            </span>
          </div>
        )}

        <div className="opacity-0 group-hover:opacity-100 transition absolute w-full px-6 bottom-3">
          <div className="flex gap-x-6 justify-center">
            <IconButton
              onClick={onPreview}
              icon={<Expand size={20} className="text-gray-600" />}
            />
            <IconButton
              onClick={onAddToCart}
              icon={
                <ShoppingCart
                  size={20}
                  className={outOfStock ? "text-gray-300" : "text-gray-600"}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Details */}
      <div>
        {data.brand && (
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {data.brand}
          </p>
        )}
        <p className="font-semibold text-lg line-clamp-1">{data.name}</p>
        <p className="text-sm text-gray-500">{data.category?.name}</p>
      </div>

      {/* Price */}
      <div className="flex items-center gap-x-2">
        <Currency value={data.price} />
        {hasDiscount && (
          <Currency
            value={data.originalPrice as string}
            className="text-sm font-normal text-gray-400 line-through"
          />
        )}
      </div>
    </div>
  );
};

export default ProductCard;
