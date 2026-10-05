import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getBrandBySlug } from '@/lib/queries';
import { PartsCatalogView } from '@/components/parts/PartsCatalogView';

interface BrandSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BrandSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) {
    return { title: 'Brand Catalog' };
  }
  return {
    title: `${brand.name} Car Parts & Products`,
    description: brand.description,
  };
}

export default async function BrandDetailPage({ params }: BrandSlugPageProps) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  return (
    <Suspense
      fallback={
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12">
          <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse" />
        </div>
      }
    >
      <PartsCatalogView
        lockedBrandSlug={slug}
        heading={brand ? `${brand.name} Automotive Parts` : 'Brand Parts'}
        subheading={
          brand
            ? `${brand.description || 'Explore products from this manufacturer.'`
            : 'Explore genuine automotive parts by brand.'
        }
      />
    </Suspense>
  );
}
