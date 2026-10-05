'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AutomotiveService } from '@/types/database';
import { formatCurrency } from '@/lib/utils/format';
import { ArrowRight, Clock } from 'lucide-react';

export function ServiceCard({ service }: { service: AutomotiveService }) {
  const { getCurrency } = useAppSettings();
  return (
    <article className="group bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5">
      <div>
        <div className="relative aspect-[16/9] w-full bg-[#18181B] overflow-hidden">
          <Link href={`/services/${service.slug}`} className="block w-full h-full">
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              referrerPolicy="no-referrer"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        <div className="p-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-[#6E6E68] tabular-nums">
            <span>
              {service.category} · Code: {service.service_code}
            </span>
            <span className="text-emerald-700 font-medium">
              {service.availability}
            </span>
          </div>

          <Link href={`/services/${service.slug}`} className="block">
            <h3 className="text-base font-semibold text-[#141413] group-hover:text-red-800 transition-colors leading-snug">
              {service.name}
            </h3>
          </Link>

          <p className="text-xs text-[#52524E] line-clamp-2 leading-relaxed">
            {service.description}
          </p>

          <div className="pt-1 flex items-center gap-2 text-xs text-[#6E6E68]">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{service.duration_label}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 bg-[#FAF9F6] border-t border-[#E5E5E0] flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-[#6E6E68]">Package Rate</p>
          <p className="text-lg font-bold text-[#141413] font-mono tabular-nums">
            {formatCurrency(service.price, getCurrency())}
          </p>
        </div>

        <Link
          href={`/services/${service.slug}`}
          className="px-4 py-2 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          Book Service <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
