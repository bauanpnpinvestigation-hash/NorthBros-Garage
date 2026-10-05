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
      title="Service Bay Appointments"
      subtitle="Manage customer service requests, scheduled bay times, and technician status."
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
        {serviceBookings.length === 0 ? (
          <p className="text-sm text-[#6E6E68] text-center py-8">
            No service appointments scheduled yet.
          </p>
        ) : (
          <div className="divide-y divide-[#E5E5E0]">
            {serviceBookings.map((booking) => (
              <div
                key={booking.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#141413]">
                      #{booking.booking_reference}
                    </span>
                    <span>·</span>
                    <span className="font-semibold text-[#141413]">
                      {booking.service_name}
                    </span>
                    <span className="font-mono text-[#52524E]">
                      ({formatPHP(booking.service_price)})
                    </span>
                  </div>
                  <p className="text-[#52524E]">
                    Customer: {booking.customer_name || 'Customer'} ({booking.customer_phone || booking.customer_email || 'N/A'})
                  </p>
                  <p className="text-[#6E6E68]">
                    Scheduled: {booking.preferred_date} at {booking.preferred_time} · Placed {formatDate(booking.created_at)}
                  </p>
                  {booking.notes && (
                    <p className="text-[#6E6E68]">Notes: {booking.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <select
                    value={booking.status}
                    onChange={(e) =>
                      updateServiceBookingStatus(
                        booking.id,
                        e.target.value as ServiceBookingStatus
                      )
                    }
                    className="px-3 py-1.5 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg text-xs font-semibold text-[#141413]"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="In Service Bay">In Service Bay</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
