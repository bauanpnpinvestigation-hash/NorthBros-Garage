'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatDate, formatPHP } from '@/lib/utils/format';

export default function AdminDashboardPage() {
  const { parts, services, serviceBookings, orders, vlogs } = useStore();

  const activePartsCount = parts.filter((p) => p.status === 'Active' && p.stock > 0).length;
  const lowStockCount = parts.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = parts.filter((p) => p.stock === 0 || p.status === 'Out of Stock').length;
  const pendingOrdersCount = orders.filter((o) => o.fulfillment_status === 'Processing').length;
  const pendingBookingsCount = serviceBookings.filter((b) => b.status === 'Confirmed' || b.status === 'Pending').length;

  return (
    <AdminShell
      title="Store Operations & Workshop Dashboard"
      subtitle="Real-time management for car parts inventory, customer orders, service bay appointments, and daily workshop vlogs."
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/parts/new"
            className="px-4 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
          >
            + Add New Part
          </Link>
        </div>
      }
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">Catalog Parts</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {parts.length}
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">In-Stock SKUs</p>
          <p className="font-display text-2xl font-bold text-emerald-700 font-mono tabular-nums">
            {activePartsCount}
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">Low / Out of Stock</p>
          <p className="font-display text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {lowStockCount} low · {outOfStockCount} out
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">Active Orders</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {pendingOrdersCount} pending
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">Service Appointments</p>
          <p className="font-display text-2xl font-bold text-blue-700 font-mono tabular-nums">
            {pendingBookingsCount} scheduled
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1">
          <p className="text-xs text-[#6E6E68]">Workshop Services</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {services.length} active
          </p>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-1 sm:col-span-2">
          <p className="text-xs text-[#6E6E68]">Daily Workshop Vlogs</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {vlogs.length} Episodes Published
          </p>
        </div>
      </div>

      {/* Recent Orders & Parts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
            <h2 className="font-display text-base font-bold text-[#141413]">
              Recent Customer Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#141413] hover:underline"
            >
              Manage Orders →
            </Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 4).map((ord) => (
              <div
                key={ord.id}
                className="flex items-center justify-between text-xs border-b border-[#E5E5E0] last:border-b-0 pb-2.5 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-[#141413]">
                    {ord.order_number} · {ord.customer_name}
                  </p>
                  <p className="text-[#6E6E68]">
                    {ord.items.length} items · {ord.payment_method} ({ord.payment_status})
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-[#141413] tabular-nums block">
                    {formatPHP(ord.total_amount)}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700">
                    {ord.fulfillment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
            <h2 className="font-display text-base font-bold text-[#141413]">
              Upcoming Service Bay Bookings
            </h2>
            <Link
              href="/admin/appointments"
              className="text-xs font-semibold text-[#141413] hover:underline"
            >
              Manage Bay Slots →
            </Link>
          </div>
          <div className="space-y-3">
            {serviceBookings.slice(0, 4).map((sb) => (
              <div
                key={sb.id}
                className="flex items-center justify-between text-xs border-b border-[#E5E5E0] last:border-b-0 pb-2.5 last:pb-0"
              >
                <div>
                  <p className="font-semibold text-[#141413]">
                    {sb.booking_reference} · {sb.customer_name}
                  </p>
                  <p className="text-[#6E6E68] truncate max-w-[220px]">
                    {sb.service_name} ({sb.vehicle_details})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#141413]">
                    {sb.preferred_date} {sb.preferred_time}
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium">
                    {sb.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
