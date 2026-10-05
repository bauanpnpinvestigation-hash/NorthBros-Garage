'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, parts } = useStore();

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          OEM Replacement & Performance Systems
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Car Part Categories
        </h1>
        <p className="text-sm text-[#6E6E68] max-w-2xl">
          Browse replacement components, maintenance kits, and heavy-duty
          upgrades by vehicle system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const count = parts.filter(
            (p) => p.category_slug === cat.slug
          ).length;
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white border border-[#E5E5E0] rounded-xl p-7 flex flex-col justify-between gap-6 hover:border-[#141413] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#6E6E68] tabular-nums">
                  <span>{cat.common_parts.split(',')[0]}</span>
                  <span className="font-semibold text-[#141413]">
                    {count} {count === 1 ? 'part' : 'parts'}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#141413] group-hover:text-red-800 transition-colors">
                  {cat.name}
                </h2>
                <p className="text-sm text-[#52524E] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
                <span className="text-[#6E6E68] truncate max-w-[260px]">
                  Includes: {cat.common_parts}
                </span>
                <span className="font-semibold text-[#141413] inline-flex items-center gap-1 shrink-0 ml-2">
                  Shop Category <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
