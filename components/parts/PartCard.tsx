'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PartProduct } from '@/types/database';
import { formatPHP } from '@/lib/utils/format';
import { useStore } from '@/components/shared/StoreProvider';
import { Heart, ShoppingCart } from 'lucide-react';

interface PartCardProps {
  part: PartProduct;
  priority?: boolean;
}

export function PartCard({ part, priority = false }: PartCardProps) {
  const { favorites, toggleFavorite, addToCart } = useStore();
  const isFavorited = favorites.includes(part.id);
  const inStock = part.stock > 0 && part.status === 'Active';

  const compatibilitySummary =
    part.compatibility.length > 0
      ? `Fits: ${part.compatibility
          .slice(0, 2)
          .map((c) => `${c.make} ${c.model.split(' ')[0]}`)
          .join(', ')}`
      : 'Universal Fitment';

  return (
    <article className="group bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-0.5">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] w-full bg-[#18181B] overflow-hidden">
        <Link href={`/parts/${part.slug}`} className="block w-full h-full">
          <Image
            src={part.primary_image}
            alt={`${part.brand_name} ${part.name} (${part.sku})`}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            referrerPolicy="no-referrer"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(part.id);
          }}
          aria-label={
            isFavorited ? 'Remove part from wishlist' : 'Save part to wishlist'
          }
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isFavorited
              ? 'bg-[#141413] text-red-400'
              : 'bg-black/60 text-white hover:bg-black/80'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-1.5">
          {/* Quiet unboxed metadata line */}
          <div className="flex items-center justify-between gap-2 text-xs text-[#6E6E68] tabular-nums">
            <span>
              {part.brand_name} · SKU: {part.sku}
            </span>
            <span
              className={
                inStock
                  ? 'text-emerald-700 font-medium'
                  : 'text-red-700 font-medium'
              }
            >
              {inStock ? `${part.stock} in stock` : 'Out of Stock'}
            </span>
          </div>

          {/* Product Name */}
          <Link href={`/parts/${part.slug}`} className="block">
            <h3 className="text-base font-semibold text-[#141413] group-hover:text-red-800 transition-colors line-clamp-2 leading-snug">
              {part.name}
            </h3>
          </Link>

          {/* Unboxed Compatibility & Rating Metadata */}
          <div className="pt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#52524E] tabular-nums">
            <span>{compatibilitySummary}</span>
            <span aria-hidden="true">·</span>
            <span>
              ★ {part.rating.toFixed(1)} ({part.review_count})
            </span>
          </div>
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 border-t border-[#E5E5E0] flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-[#141413] font-mono tabular-nums tracking-tight">
              {formatPHP(part.price)}
            </p>
            {part.compare_at_price && part.compare_at_price > part.price && (
              <p className="text-[11px] text-[#6E6E68] line-through font-mono tabular-nums">
                {formatPHP(part.compare_at_price)}
              </p>
            )}
          </div>

          <button
            type="button"
            disabled={!inStock}
            onClick={() => addToCart(part, 1)}
            className="px-3.5 py-2 bg-[#141413] hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
