'use client';

import React from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatDate, formatPHP } from '@/lib/utils/format';
import { ServiceBookingStatus } from '@/types/database';

export default function AdminAppointmentsPage() {
  const { serviceBookings, updateServiceBookingStatus } = useStore();

  return (
    <AdminShell
      title="Workshop Bay Bookings & Appointments"
      subtitle="Manage scheduled vehicle servicing, diagnostics, brake replacements, and hoist allocations."
    >
      <div className="space-y-4">
        {serviceBookings.length === 0 ? (
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center text-xs text-[#6E6E68]">
            No workshop service bookings yet.
          </div>
        ) : (
          serviceBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E0] pb-4">
                <div>
                  <p className="text-sm font-mono font-bold text-[#141413]">
                    {b.booking_reference} · {b.customer_name}
                  </p>
                  <p className="text-xs text-[#6E6E68]">
                    {b.customer_email} · {b.customer_phone} · Booked {formatDate(b.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-[#141413]">
                    Bay Status:
                  </label>
                  <select
                    value={b.status}
                    onChange={(e) =>
                      updateServiceBookingStatus(
                        b.id,
                        e.target.value as ServiceBookingStatus
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Service Bay">In Service Bay</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[#6E6E68]">Requested Service</p>
                  <p className="font-bold text-[#141413] mt-0.5">{b.service_name}</p>
                  <p className="font-mono text-[#6E6E68]">{formatPHP(b.service_price)}</p>
                </div>

                <div>
                  <p className="text-[#6E6E68]">Customer Vehicle</p>
                  <p className="font-semibold text-[#141413] mt-0.5">{b.vehicle_details}</p>
                  {b.notes && <p className="text-[#52524E] text-[11px] mt-1">Notes: {b.notes}</p>}
                </div>

                <div className="sm:text-right">
                  <p className="text-[#6E6E68]">Scheduled Time Slot</p>
                  <p className="font-mono font-bold text-[#141413] text-sm mt-0.5">
                    {b.preferred_date}
                  </p>
                  <p className="text-[#6E6E68] text-[11px] font-medium">{b.preferred_time}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
