import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { getCategoryBySlug } from '@/lib/queries';
import { PartsCatalogView } from '@/components/parts/PartsCatalogView';

interface CategorySlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategorySlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return { title: 'Part Category' };
  }
  return {
    title: `${category.name}`,
    description: category.description,
  };
}

export default async function CategoryDetailPage({
  params,
}: CategorySlugPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  return (
    <Suspense
      fallback={
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12">
          <div className="h-10 w-64 bg-neutral-200 rounded animate-pulse" />
        </div>
      }
    >
      <PartsCatalogView
        lockedCategorySlug={slug}
        heading={category ? category.name : 'Part Category'}
        subheading={
          category ? category.description : 'Browse automotive parts by system.'
        }
      />
    </Suspense>
  );
}
