'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function OrdersAndBookingsPage() {
  const { orders, serviceBookings } = useStore();
  const { getCurrency } = useAppSettings();

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-12">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Customer Purchases & Service Appointments
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          My Orders & Service Bookings
        </h1>
      </div>

      {/* Part Orders */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#141413]">
          Car Parts Orders ({orders.length})
        </h2>

        {orders.length === 0 ? (
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center">
            <p className="text-sm text-[#6E6E68]">No part orders placed yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <article
                key={ord.id}
                className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 bg-[#FAF9F6] border-b border-[#E5E5E0] flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-3 tabular-nums">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="font-mono font-bold text-[#141413] text-sm hover:underline"
                    >
                      {ord.order_number}
                    </Link>
                    <span>·</span>
                    <span className="text-[#6E6E68]">
                      {formatDate(ord.created_at)}
                    </span>
                    <span>·</span>
                    <span className="text-[#52524E]">
                      {ord.payment_method} ({ord.payment_status})
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-emerald-800">
                      Fulfillment: {ord.fulfillment_status}
                    </span>
                    <Link
                      href={`/orders/${ord.id}`}
                      className="font-semibold text-[#141413] underline"
                    >
                      Order Details →
                    </Link>
                  </div>
                </div>

                <div className="p-6 divide-y divide-[#E5E5E0]">
                  {ord.items.map((item) => (
                    <div
                      key={item.product_id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 aspect-[4/3] rounded overflow-hidden bg-[#141413] shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="64px"
                            referrerPolicy="no-referrer"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link
                            href={`/parts/${item.product_slug}`}
                            className="text-sm font-semibold text-[#141413] hover:underline"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-[#6E6E68] font-mono tabular-nums">
                            SKU: {item.sku} · Qty: {item.quantity} ×{' '}
                            {formatCurrency(item.unit_price, getCurrency())}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-mono font-bold text-[#141413] tabular-nums">
                        {formatCurrency(item.subtotal, getCurrency())}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Service Bookings */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-[#141413]">
          Workshop Service Appointments ({serviceBookings.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceBookings.map((sb) => (
            <div
              key={sb.id}
              className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[#141413]">
                  #{sb.booking_reference} · {sb.preferred_date} @{' '}
                  {sb.preferred_time}
                </span>
                <span className="font-semibold text-emerald-700">
                  {sb.status}
                </span>
              </div>
              <Link
                href={`/services/${sb.service_slug}`}
                className="text-sm font-semibold text-[#141413] hover:underline block"
              >
                {sb.service_name}
              </Link>
              <p className="text-xs text-[#52524E]">
                Vehicle: {sb.vehicle_details}
              </p>
              <p className="text-xs font-mono font-bold text-[#141413] tabular-nums pt-1">
                Package Rate: {formatCurrency(sb.service_price, getCurrency())}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
