import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Apex Motors PH',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#141413]">
        Privacy Policy
      </h1>
      <p className="text-xs text-[#6E6E68]">
        Notice: This page is a placeholder for the dealership&apos;s official
        Data Privacy Act (RA 10173) compliance policy.
      </p>
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-4 text-sm text-[#52524E] leading-relaxed">
        <p>
          Apex Motors Philippines collects only the personal contact and
          verification details necessary to process showroom viewing
          appointments, vehicle reservations, financing applications, and LTO
          registration transfers.
        </p>
        <p>
          Customer inquiry records and reservation details are accessible only
          to authorized dealership personnel and are never sold to third-party
          marketing networks.
        </p>
      </div>
    </div>
  );
}
