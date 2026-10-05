import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroSearch } from '@/components/home/HeroSearch';
import { HomeCatalogSections } from '@/components/home/HomeCatalogSections';

export default function HomePage() {
  return (
    <div>
      {/* Section 1: Storefront Hero */}
      <section className="relative bg-[#141413] text-white overflow-hidden">
        <div className="relative min-h-[560px] lg:min-h-[600px] w-full flex items-center">
          <Image
            src="/images/hero_parts_workshop.jpg"
            alt="Apex Auto Parts Counter and Precision Service Workshop"
            fill
            priority
            sizes="100vw"
            referrerPolicy="no-referrer"
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />

          <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-8 py-16 w-full space-y-8">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs sm:text-sm font-medium text-neutral-300 tracking-wide">
                Genuine OEM & Performance Car Parts · Professional Service Bays
              </p>
              <h1
                className="font-display text-3xl sm:text-5xl lg:text-[52px] font-bold tracking-tight leading-[1.1] text-white"
                style={{ textWrap: 'balance' }}
              >
                Precision Car Parts & Automotive Services.
              </h1>
              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed max-w-xl">
                Shop verified brake kits, synthetic PMS oil bundles, AGM
                batteries, and Bilstein suspension parts—or book your next oil
                change, alignment, and diagnostic service online.
              </p>
            </div>

            <HeroSearch />

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-300">
              <span>Quick Links:</span>
              <Link
                href="/parts"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Browse All Car Parts
              </Link>
              <span>·</span>
              <Link
                href="/services"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Book Automotive Service
              </Link>
              <span>·</span>
              <Link
                href="/categories/brakes"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Brembo Brake Kits
              </Link>
              <span>·</span>
              <Link
                href="/categories/engine-filters"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Motul & Denso PMS Bundles
              </Link>
              <span>·</span>
              <Link
                href="/vlogs"
                className="text-white underline underline-offset-4 hover:text-neutral-300"
              >
                Daily Workshop Vlog
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeCatalogSections />
    </div>
  );
}
