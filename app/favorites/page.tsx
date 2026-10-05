'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { PartCard } from '@/components/parts/PartCard';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { parts, favorites } = useStore();
  const favoriteParts = parts.filter((p) => favorites.includes(p.id));

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Saved Automotive Parts & Maintenance Kits
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Saved Parts Wishlist ({favoriteParts.length})
        </h1>
      </div>

      {favoriteParts.length === 0 ? (
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E5E5E0] flex items-center justify-center mx-auto text-[#6E6E68]">
            <Heart className="w-5 h-5" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#141413]">
            No Saved Parts Yet
          </h2>
          <p className="text-sm text-[#6E6E68] max-w-md mx-auto">
            Click the heart icon on any brake kit, oil bundle, battery, or
            suspension part to save it for your next PMS schedule.
          </p>
          <div className="pt-2">
            <Link
              href="/parts"
              className="inline-block px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
            >
              Browse Car Parts
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {favoriteParts.map((part) => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}
