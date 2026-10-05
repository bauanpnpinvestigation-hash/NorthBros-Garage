'use client';

import React from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP } from '@/lib/utils/format';

export default function AdminCustomersPage() {
  const { orders, serviceBookings } = useStore();

  const customerMap = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string;
      orderCount: number;
      bookingCount: number;
      totalSpent: number;
    }
  >();

  for (const ord of orders) {
    const key = ord.user_id || ord.customer_name || ord.id;
    const existing = customerMap.get(key) || {
      id: key,
      name: ord.customer_name || 'Customer',
      email: ord.customer_email || '',
      phone: ord.customer_phone || '',
      orderCount: 0,
      bookingCount: 0,
      totalSpent: 0,
    };
    existing.orderCount += 1;
    existing.totalSpent += ord.total_amount;
    customerMap.set(key, existing);
  }

  for (const sb of serviceBookings) {
    const key = sb.user_id || sb.customer_name || sb.id;
    const existing = customerMap.get(key) || {
      id: key,
      name: sb.customer_name || 'Customer',
      email: sb.customer_email || '',
      phone: sb.customer_phone || '',
      orderCount: 0,
      bookingCount: 0,
      totalSpent: 0,
    };
    existing.bookingCount += 1;
    customerMap.set(key, existing);
  }

  const customers = Array.from(customerMap.values());

  return (
    <AdminShell
      title="Customers"
      subtitle="View customer accounts, order activity, and workshop service history."
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6">
        {customers.length === 0 ? (
          <p className="text-sm text-[#6E6E68] text-center py-8">
            No customer records found yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E0] text-[#6E6E68]">
                  <th className="py-3 px-2 font-semibold">Customer</th>
                  <th className="py-3 px-2 font-semibold">Contact</th>
                  <th className="py-3 px-2 font-semibold">Part Orders</th>
                  <th className="py-3 px-2 font-semibold">Service Bookings</th>
                  <th className="py-3 px-2 font-semibold text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E0]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF9F6]/60">
                    <td className="py-3 px-2 font-semibold text-[#141413]">{c.name}</td>
                    <td className="py-3 px-2 text-[#52524E]">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-3 px-2 font-mono tabular-nums">{c.orderCount}</td>
                    <td className="py-3 px-2 font-mono tabular-nums">{c.bookingCount}</td>
                    <td className="py-3 px-2 font-mono font-semibold text-[#141413] text-right tabular-nums">
                      {formatPHP(c.totalSpent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
