'use client';

import React from 'react';
import Link from 'next/link';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';

export default function AboutPage() {
  const { getString } = useAppSettings();
  const siteName = getString('branding.site_name', 'NorthBros Garage');
  const tagline = getString('branding.tagline', 'Professional automotive parts and workshop services.');
  const address = getString('contact.address', 'Business address not configured');
  const hours = getString('business.hours', 'Business hours not configured');
  const about = getString('about.content', tagline);
  const valueOne = getString('about.value_one', 'Products and services are managed from the same configurable system.');
  const valueTwo = getString('about.value_two', 'Workshop content, service availability, and catalog data stay connected to the database.');
  const valueThree = getString('about.value_three', 'Customers can shop, book services, save vehicles, and track activity in one account.');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-10">
      <div className="space-y-3 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">{siteName}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">{tagline}</h1>
        <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">{about}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-lg font-bold text-[#141413]">Catalog</p>
          <h2 className="text-sm font-semibold text-[#141413]">Products & services in one system</h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">{valueOne}</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-lg font-bold text-[#141413]">Operations</p>
          <h2 className="text-sm font-semibold text-[#141413]">Connected workshop management</h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">{valueTwo}</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-lg font-bold text-[#141413]">Customer Garage</p>
          <h2 className="text-sm font-semibold text-[#141413]">Vehicles, orders & bookings</h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">{valueThree}</p>
        </div>
      </div>
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-[#141413]">Visit {siteName}</h2>
          <p className="text-xs text-[#6E6E68]">{address} · {hours}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/parts" className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800">Shop Parts</Link>
          <Link href="/services" className="px-5 py-2.5 bg-[#FAF9F6] border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg hover:bg-neutral-100">Book Service</Link>
        </div>
      </div>
    </div>
  );
}