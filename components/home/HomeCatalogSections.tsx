'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { PartCard } from '@/components/parts/PartCard';
import { ServiceCard } from '@/components/services/ServiceCard';
import { formatDate, formatNumber, formatPHP } from '@/lib/utils/format';
import { Play, ArrowRight } from 'lucide-react';

export function HomeCatalogSections() {
  const { parts, categories, services, vlogs } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredParts =
    activeCategory === 'all'
      ? parts.slice(0, 6)
      : parts.filter((p) => p.category_slug === activeCategory).slice(0, 6);

  const featuredVlog = vlogs[0];
  const recentVlogs = vlogs.slice(1, 3);

  return (
    <div className="space-y-24 py-16">
      {/* Section 2: Featured Car Parts Catalog */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-[#E5E5E0]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6E6E68]">
              Genuine OEM & Performance Replacement Parts · Ready to Ship
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
              Featured Car Parts & Maintenance Kits
            </h2>
          </div>

          {/* Interactive Segmented Category Filter Controls */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-white text-[#141413] shadow-xs font-semibold'
                  : 'text-[#52524E] hover:text-[#141413]'
              }`}
            >
              All Parts ({parts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  activeCategory === cat.slug
                    ? 'bg-white text-[#141413] shadow-xs font-semibold'
                    : 'text-[#52524E] hover:text-[#141413]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredParts.map((part, idx) => (
            <PartCard key={part.id} part={part} priority={idx < 3} />
          ))}
        </div>
      </section>

      {/* Section 3: Automotive Workshop Services */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6E6E68]">
              BGC Service Bays · Online Appointment Booking
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
              Professional Automotive Services
            </h2>
          </div>
          <Link
            href="/services"
            className="text-sm font-semibold text-[#141413] hover:text-red-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            View All Services & Book Bay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {services.slice(0, 3).map((srv) => (
            <ServiceCard key={srv.id} service={srv} />
          ))}
        </div>
      </section>

      {/* Section 4: Daily Workshop & Part Installation Vlog */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E5E5E0]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-800">
              Daily Workshop Series · Real Builds, Part Installs & Tool Guides
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
              Daily Service Bay Vlogs
            </h2>
          </div>
          <Link
            href="/vlogs"
            className="text-sm font-semibold text-[#141413] hover:text-red-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            Watch All {vlogs.length} Episodes <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredVlog && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <article className="lg:col-span-7 bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col">
              <Link
                href={`/vlogs/${featuredVlog.slug}`}
                className="relative aspect-[16/9] w-full bg-[#141413] block group overflow-hidden"
              >
                <Image
                  src={featuredVlog.thumbnail_url}
                  alt={featuredVlog.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-300 tabular-nums">
                      Episode #{featuredVlog.episode_number} ·{' '}
                      {featuredVlog.category} · {featuredVlog.duration}
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold leading-snug">
                      {featuredVlog.title}
                    </h3>
                  </div>
                  <span className="w-11 h-11 rounded-full bg-white text-[#141413] flex items-center justify-center shrink-0 shadow-md">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </span>
                </div>
              </Link>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E68] tabular-nums">
                  <span>Hosted by {featuredVlog.author_name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatDate(featuredVlog.published_at)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatNumber(featuredVlog.views_count)} views</span>
                </div>
                <p className="text-sm text-[#52524E] leading-relaxed">
                  {featuredVlog.summary}
                </p>

                {featuredVlog.featured_part_slug && (
                  <div className="pt-3 border-t border-[#E5E5E0] flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-[#6E6E68]">
                      Featured Part:{' '}
                      <span className="font-semibold text-[#141413]">
                        {featuredVlog.featured_part_name}
                      </span>{' '}
                      {featuredVlog.featured_part_price && (
                        <span className="font-mono tabular-nums text-[#141413]">
                          ({formatPHP(featuredVlog.featured_part_price)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/parts/${featuredVlog.featured_part_slug}`}
                        className="text-xs font-semibold text-[#141413] hover:text-red-800 transition-colors"
                      >
                        Shop Part →
                      </Link>
                      <Link
                        href={`/vlogs/${featuredVlog.slug}`}
                        className="text-xs font-semibold text-red-800 hover:underline"
                      >
                        Watch Episode →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>

            <div className="lg:col-span-5 space-y-4">
              {recentVlogs.map((vlog) => (
                <article
                  key={vlog.id}
                  className="bg-white border border-[#E5E5E0] rounded-xl p-4 flex gap-4 items-center hover:border-neutral-400 transition-colors"
                >
                  <Link
                    href={`/vlogs/${vlog.slug}`}
                    className="relative w-32 sm:w-36 aspect-[4/3] rounded-lg overflow-hidden bg-[#141413] shrink-0 group"
                  >
                    <Image
                      src={vlog.thumbnail_url}
                      alt={vlog.title}
                      fill
                      sizes="150px"
                      referrerPolicy="no-referrer"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded">
                      {vlog.duration}
                    </span>
                  </Link>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <p className="text-xs text-[#6E6E68] tabular-nums">
                      Ep #{vlog.episode_number} · {vlog.category} ·{' '}
                      {formatDate(vlog.published_at)}
                    </p>
                    <Link href={`/vlogs/${vlog.slug}`} className="block">
                      <h3 className="text-sm font-semibold text-[#141413] hover:text-red-800 transition-colors line-clamp-2 leading-snug">
                        {vlog.title}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between pt-1 text-xs text-[#6E6E68] tabular-nums">
                      <span>{formatNumber(vlog.views_count)} views</span>
                      {vlog.featured_part_slug && (
                        <Link
                          href={`/parts/${vlog.featured_part_slug}`}
                          className="font-medium text-[#141413] hover:underline truncate max-w-[160px]"
                        >
                          Shop Part →
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              ))}

              <div className="bg-[#141413] text-white rounded-xl p-6 space-y-3">
                <p className="text-xs text-neutral-400">
                  Buy Parts Online + Book Installation in One Place
                </p>
                <p className="text-sm leading-relaxed text-neutral-200">
                  Order genuine Brembo, Motul, Denso, Bosch, Bilstein, and NGK
                  parts for delivery anywhere in the Philippines, or book a
                  service bay at our BGC workshop for precision installation.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono tabular-nums text-neutral-300 border-t border-neutral-800">
                  <span>100% Genuine OEM Parts</span>
                  <span>·</span>
                  <span>GCash / Maya / QR Ph</span>
                  <span>·</span>
                  <span>Same-Day Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
