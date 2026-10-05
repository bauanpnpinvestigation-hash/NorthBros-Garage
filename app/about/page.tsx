import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Apex Auto Parts & Services PH — Daily Workshop Vlog',
  description:
    'Learn about our genuine OEM car parts catalog, certified service bays, and daily installation guide vlog series.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-14 space-y-10">
      <div className="space-y-3 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Bonifacio Global City & Taguig Workshop Hub
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Genuine Automotive Parts & Certified Workshop Services.
        </h1>
        <p className="text-sm sm:text-base text-[#52524E] leading-relaxed">
          Apex Auto Parts PH connects automotive enthusiasts, daily commuters, and fleet owners with 100% authentic replacement parts, performance upgrades, and professional installation bays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-2xl font-bold text-[#141413] tabular-nums">
            100% Genuine
          </p>
          <h2 className="text-sm font-semibold text-[#141413]">
            Direct Manufacturer Sourcing
          </h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">
            All brake pads, fluids, ignition coils, spark plugs, filters, and suspension parts are sourced directly from authorized brand distributors with verified warranties.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-2xl font-bold text-[#141413] tabular-nums">
            Daily Vlog
          </p>
          <h2 className="text-sm font-semibold text-[#141413]">
            Workshop Bay DIY & Install Guides
          </h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">
            Watch our master technicians demonstrate real-world part installations, periodic maintenance service (PMS) breakdowns, and diagnostic teardowns on camera every morning.
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2">
          <p className="font-mono text-2xl font-bold text-[#141413] tabular-nums">
            Nationwide
          </p>
          <h2 className="text-sm font-semibold text-[#141413]">
            Fast Dispatch & Bay Bookings
          </h2>
          <p className="text-xs text-[#6E6E68] leading-relaxed">
            Order online with GCash, Maya, GoTyme QR Ph, or Cash on Delivery, or schedule an express installation slot in our modern diagnostic workshop bay.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-lg font-bold text-[#141413]">
            Visit Our BGC Workshop & Parts Depot
          </h2>
          <p className="text-xs text-[#6E6E68]">
            38th Street, Bonifacio Global City, Taguig · Open Monday–Saturday 8:00 AM – 6:00 PM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/parts"
            className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
          >
            Shop Car Parts
          </Link>
          <Link
            href="/services"
            className="px-5 py-2.5 bg-[#FAF9F6] border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg hover:bg-neutral-100"
          >
            Book Bay Service
          </Link>
        </div>
      </div>
    </div>
  );
}
