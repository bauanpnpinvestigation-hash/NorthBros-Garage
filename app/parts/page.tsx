import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PartsCatalogView } from '@/components/parts/PartsCatalogView';

export const metadata: Metadata = {
  title: 'Shop Genuine Car Parts & Maintenance Kits',
  description:
    'Search and filter genuine OEM and performance car parts by category, brand, and vehicle compatibility.',
};

export default function PartsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12">
          <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse mb-6" />
        </div>
      }
    >
      <PartsCatalogView />
    </Suspense>
  );
}
