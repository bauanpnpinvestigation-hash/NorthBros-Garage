'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { resolveDisplayImageUrl } from '@/lib/utils/media';
import { ArrowRight } from 'lucide-react';

export default function BrandsPage() {
  const { brands, parts } = useStore();

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Official OEM & Aftermarket Manufacturers
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Shop Car Parts by Brand
        </h1>
        <p className="text-sm text-[#6E6E68] max-w-2xl">
          Every manufacturer brand in our catalog is sourced directly from
          authorized Philippine distributors with verified batch numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const count = parts.filter((p) => p.brand_slug === brand.slug).length;
          const imgUrl = brand.image_url
            ? resolveDisplayImageUrl(brand.image_url, '')
            : '';

          return (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col justify-between hover:border-[#141413] transition-colors"
            >
              {imgUrl && (
                <div className="relative aspect-[16/9] w-full bg-[#141413] overflow-hidden">
                  <Image
                    src={imgUrl}
                    alt={brand.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    referrerPolicy="no-referrer"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#6E6E68] tabular-nums">
                    <span>{brand.country || 'OEM Authorized'}</span>
                    <span className="font-semibold text-[#141413]">
                      {count} {count === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#141413] group-hover:text-red-800 transition-colors">
                    {brand.name}
                  </h2>
                  <p className="text-xs font-medium text-[#52524E]">
                    {brand.specialty || 'Automotive Parts & Components'}
                  </p>
                  <p className="text-sm text-[#6E6E68] leading-relaxed">
                    {brand.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
                  <span className="text-[#6E6E68] truncate max-w-[200px]">
                    {brand.warranty_policy || 'Official Manufacturer Warranty'}
                  </span>
                  <span className="font-semibold text-[#141413] inline-flex items-center gap-1 shrink-0">
                    Shop Brand <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
