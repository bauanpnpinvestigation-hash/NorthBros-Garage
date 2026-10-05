import React from 'react';
import type { Metadata } from 'next';
import { getPartBySlug } from '@/lib/queries';
import { formatPHP } from '@/lib/utils/format';
import { PartDetailClient } from '@/components/parts/PartDetailClient';

interface PartDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PartDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const part = await getPartBySlug(slug);

  if (!part) {
    return {
      title: 'Car Part Detail | Apex Auto Parts PH',
    };
  }

  const title = `${part.name} (${part.sku}) — ${formatPHP(part.price)}`;
  return {
    title,
    description: part.description,
    openGraph: {
      title,
      description: part.description,
      images: [part.primary_image],
    },
  };
}

export default async function PartDetailPage({ params }: PartDetailPageProps) {
  const { slug } = await params;
  const part = await getPartBySlug(slug);

  return <PartDetailClient slug={slug} initialPart={part} />;
}
