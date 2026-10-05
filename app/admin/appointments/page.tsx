'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { ServiceBookingStatus } from '@/types/database';

export default function AdminAppointmentsPage() {
  const { serviceBookings, updateServiceBookingStatus, showToast } = useStore();
  const { getCurrency } = useAppSettings();
  const [staff, setStaff] = useState<Array<{id:string;name:string}>>([]);
  const [branches, setBranches] = useState<Array<{id:string;name:string}>>([]);
  useEffect(() => {
    const c = createClient();
    if (!c) return;
    void Promise.all([
      c.from('staff_profiles').select('id,profiles(full_name)').eq('is_active', true),
      c.from('branches').select('id,name').eq('is_active', true).order('name'),
    ]).then(([staffResult, branchResult]) => {
      if (!staffResult.error) setStaff((staffResult.data || []).map((row:any) => ({ id: row.id, name: row.profiles?.full_name || row.id })));
      if (!branchResult.error) setBranches((branchResult.data || []) as Array<{id:string;name:string}>);
    });
  }, []);

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
                      ({formatCurrency(booking.service_price, getCurrency())})
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
                  <div>
                    <label className="block text-[11px] text-[#6E6E68] mb-0.5">Branch</label>
                    <select
                      value={booking.branch_id || ''}
                      onChange={async (e) => {
                        const c = createClient();
                        if (!c || !e.target.value) return;
                        const result = await c.from('appointments').update({ branch_id: e.target.value }).eq('id', booking.id);
                        if (result.error) {
                          showToast(result.error.message, 'error');
                        } else {
                          showToast('Branch updated.');
                          window.location.reload();
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                    >
                      {booking.branch_id ? null : <option value="">Choose branch</option>}
                      {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#6E6E68] mb-0.5">Technician</label>
                    <select
                      value={booking.assigned_staff_id || ''}
                      onChange={async (e) => {
                        const c = createClient();
                        if (!c) return;
                        const result = await c.from('appointments').update({ assigned_staff_id: e.target.value || null }).eq('id', booking.id);
                        if (result.error) showToast(result.error.message, 'error');
                        else {
                          showToast('Technician updated.');
                          window.location.reload();
                        }
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                    >
                      <option value="">Unassigned</option>
                      {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                    </select>
                  </div>
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
