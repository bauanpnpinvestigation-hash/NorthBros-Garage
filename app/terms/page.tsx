import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Sale & Reservation | Apex Motors PH',
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-14 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#141413]">
        Terms of Sale & Vehicle Reservation
      </h1>
      <p className="text-xs text-[#6E6E68]">
        Standard showroom reservation and inspection guidelines.
      </p>
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-4 text-sm text-[#52524E] leading-relaxed">
        <p>
          1. <strong>Vehicle Reservations:</strong> Placing a reservation holds
          the selected vehicle exclusively for 72 hours pending physical
          showroom and hoist inspection at our Bonifacio Global City or Alabang
          facility.
        </p>
        <p>
          2. <strong>Inspection & Handover:</strong> Buyers are encouraged to
          inspect the vehicle on our two-post lift and review the accompanying
          111-point diagnostic report prior to final settlement.
        </p>
      </div>
    </div>
  );
}
