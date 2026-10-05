'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { PartProduct } from '@/types/database';
import { formatPHP } from '@/lib/utils/format';
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ShieldCheck,
  Wrench,
  Play,
} from 'lucide-react';

interface PartDetailClientProps {
  slug: string;
  initialPart: PartProduct | null;
}

export function PartDetailClient({ slug, initialPart }: PartDetailClientProps) {
  const router = useRouter();
  const { parts, vlogs, favorites, toggleFavorite, addToCart, user } = useStore();
  const part = parts.find((p) => p.slug === slug) || initialPart;

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!part) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-20 text-center space-y-5">
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          Part Not Found
        </h1>
        <p className="text-sm text-[#6E6E68] max-w-md mx-auto">
          The automotive part you are looking for may have been discontinued or
          moved.
        </p>
        <Link
          href="/parts"
          className="inline-block px-6 py-3 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Browse All Car Parts
        </Link>
      </div>
    );
  }

  const gallery =
    part.gallery_images && part.gallery_images.length > 0
      ? part.gallery_images
      : [part.primary_image];
  const activeImage = gallery[selectedImageIdx] || part.primary_image;
  const isFavorited = favorites.includes(part.id);
  const inStock = part.stock > 0 && part.status === 'Active';
  const linkedVlog = vlogs.find(
    (v) =>
      v.slug === part.vlog_episode_slug || v.featured_part_slug === part.slug
  );

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const added = await addToCart(part, quantity);
    if (added) router.push('/checkout');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-8 space-y-14">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E68]"
      >
        <Link href="/" className="hover:text-[#141413]">
          Home
        </Link>
        <span>/</span>
        <Link href="/parts" className="hover:text-[#141413]">
          Car Parts
        </Link>
        <span>/</span>
        <Link
          href={`/categories/${part.category_slug}`}
          className="hover:text-[#141413]"
        >
          {part.category_name}
        </Link>
        <span>/</span>
        <span className="text-[#141413] font-medium truncate max-w-xs">
          {part.sku}
        </span>
      </nav>

      {/* Main Split PDP Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (7 cols): Images, Description, Specs, Compatibility */}
        <div className="lg:col-span-7 space-y-10">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full bg-[#141413] rounded-xl overflow-hidden border border-[#E5E5E0]">
              <Image
                src={activeImage}
                alt={`${part.name} (${part.sku})`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer ${
                      idx === selectedImageIdx
                        ? 'border-[#141413] opacity-100'
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="140px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {linkedVlog && (
            <div className="bg-[#141413] text-white rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-red-400 font-medium">
                  Featured on Our Daily Workshop Vlog · Episode #
                  {linkedVlog.episode_number}
                </p>
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {linkedVlog.title}
                </h3>
                <p className="text-xs text-neutral-400">
                  Watch our master technicians unbox and install this exact part
                  in the service bay.
                </p>
              </div>
              <Link
                href={`/vlogs/${linkedVlog.slug}`}
                className="px-4 py-2.5 bg-white text-[#141413] text-xs font-semibold rounded-lg hover:bg-neutral-200 inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Watch Install Vlog
              </Link>
            </div>
          )}

          {/* Product Description */}
          <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#141413]">
              Product Overview
            </h2>
            <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
              {part.description}
            </p>
          </section>

          {/* Technical Specifications */}
          <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-bold text-[#141413]">
              Technical Specifications
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              {Object.entries(part.specifications).map(([key, val]) => (
                <div key={key} className="border-b border-[#E5E5E0] pb-3">
                  <dt className="text-xs text-[#6E6E68]">{key}</dt>
                  <dd className="font-semibold text-[#141413] font-mono tabular-nums mt-0.5">
                    {val}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Vehicle Compatibility Table */}
          <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <h2 className="font-display text-xl font-bold text-[#141413]">
                Vehicle Fitment & Compatibility
              </h2>
              <p className="text-xs text-[#6E6E68]">
                Verified direct-fit compatibility for the following vehicle
                makes, models, and engines:
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E0] text-[#6E6E68] bg-[#FAF9F6]">
                    <th className="py-2.5 px-3 font-semibold">Make</th>
                    <th className="py-2.5 px-3 font-semibold">Model</th>
                    <th className="py-2.5 px-3 font-semibold">Years</th>
                    <th className="py-2.5 px-3 font-semibold">Engine / Variant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E0]">
                  {part.compatibility.map((comp, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-semibold text-[#141413]">
                        {comp.make}
                      </td>
                      <td className="py-2.5 px-3 text-[#141413]">
                        {comp.model}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#52524E]">
                        {comp.years}
                      </td>
                      <td className="py-2.5 px-3 text-[#52524E]">
                        {comp.engine}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Sticky Contiguous Purchase Module */}
        <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#6E6E68] tabular-nums">
                <span>
                  {part.brand_name} · SKU: {part.sku}
                </span>
                <span
                  className={
                    inStock
                      ? 'text-emerald-700 font-semibold'
                      : 'text-red-700 font-semibold'
                  }
                >
                  {inStock
                    ? `In Stock (${part.stock} units available)`
                    : 'Out of Stock'}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] leading-tight">
                {part.name}
              </h1>

              <p className="text-xs text-[#52524E] tabular-nums">
                ★ {part.rating.toFixed(1)} Rating ({part.review_count} verified
                buyer reviews) · Category: {part.category_name}
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-1">
              <p className="text-xs text-[#6E6E68]">Unit Price (VAT Inclusive)</p>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl sm:text-3xl font-bold text-[#141413] font-mono tabular-nums">
                  {formatPHP(part.price)}
                </p>
                {part.compare_at_price && part.compare_at_price > part.price && (
                  <p className="text-sm text-[#6E6E68] line-through font-mono tabular-nums">
                    {formatPHP(part.compare_at_price)}
                  </p>
                )}
              </div>
              <p className="text-xs text-emerald-700 font-medium">
                {part.price >= 5000
                  ? '✓ Qualifies for Free Nationwide Courier Shipping'
                  : 'Standard Nationwide Shipping: ₱250 (Free over ₱5,000)'}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#141413]">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-[#141413] hover:bg-neutral-200/70 rounded-l-lg cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-5 py-2 text-sm font-mono font-bold tabular-nums text-[#141413]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(part.stock || 1, q + 1))
                    }
                    className="p-2.5 text-[#141413] hover:bg-neutral-200/70 rounded-r-lg cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-[#6E6E68] font-mono tabular-nums">
                  Subtotal: {formatPHP(part.price * quantity)}
                </span>
              </div>
            </div>

            {/* Primary Add to Cart & Buy Now Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!inStock}
                  onClick={() => addToCart(part, quantity)}
                  className="py-3 px-5 bg-[#141413] hover:bg-neutral-800 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>

                <button
                  type="button"
                  disabled={!inStock}
                  onClick={handleBuyNow}
                  className="py-3 px-5 bg-red-800 hover:bg-red-900 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

              <button
                type="button"
                onClick={() => toggleFavorite(part.id)}
                className={`w-full py-2.5 px-4 border text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  isFavorited
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-[#FAF9F6] border-[#E5E5E0] text-[#141413] hover:bg-neutral-200/70'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${isFavorited ? 'fill-current' : ''}`}
                />
                {isFavorited ? 'Saved in Wishlist' : 'Save to Wishlist'}
              </button>
            </div>

            <div className="pt-3 border-t border-[#E5E5E0] space-y-2 text-xs text-[#52524E]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  100% Authentic Sealed {part.brand_name} Product with Official
                  Warranty
                </span>
              </div>
            </div>
          </div>

          {/* Need Professional Installation? Service CTA */}
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-[#141413]">
              <Wrench className="w-4 h-4" />
              <h2 className="font-display text-base font-bold">
                Need Workshop Installation?
              </h2>
            </div>
            <p className="text-xs text-[#52524E] leading-relaxed">
              Have this part installed by our certified technicians at our BGC
              service bay with proper torque specifications and diagnostic
              calibration.
            </p>
            <Link
              href="/services"
              className="inline-block text-xs font-semibold text-[#141413] underline underline-offset-4 hover:text-red-800"
            >
              Book Installation Service Appointment →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
