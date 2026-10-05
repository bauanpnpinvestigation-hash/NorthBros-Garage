'use client';

import React from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { OrderFulfillmentStatus, PaymentStatus } from '@/types/database';

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();
  const { getCurrency } = useAppSettings();

  return (
    <AdminShell
      title="Customer Orders & Dispatch"
      subtitle="Track customer part orders, payment status, fulfillment, and dispatch."
    >
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center text-xs text-[#6E6E68]">
            No customer orders placed yet.
          </div>
        ) : (
          orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E0] pb-4">
                <div>
                  <p className="text-sm font-mono font-bold text-[#141413]">
                    {ord.order_number} · {ord.customer_name}
                  </p>
                  <p className="text-xs text-[#6E6E68]">
                    {ord.customer_email} · {ord.customer_phone} · {formatDate(ord.created_at)}
                  </p>
                  <p className="text-xs text-[#52524E] mt-0.5">
                    Shipping to: {ord.shipping_address}, {ord.shipping_city} ({ord.shipping_postal_code})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[11px] text-[#6E6E68] mb-0.5">
                      Fulfillment:
                    </label>
                    <select
                      value={ord.fulfillment_status}
                      onChange={(e) =>
                        updateOrderStatus(
                          ord.id,
                          e.target.value as OrderFulfillmentStatus,
                          ord.payment_status
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Packed">Packed</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6E6E68] mb-0.5">
                      Payment:
                    </label>
                    <select
                      value={ord.payment_status}
                      onChange={(e) =>
                        updateOrderStatus(
                          ord.id,
                          ord.fulfillment_status,
                          e.target.value as PaymentStatus
                        )
                      }
                      className="px-2.5 py-1 text-xs font-semibold bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                    >
                      <option value="Pending Verification">Pending Verification</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Partially Refunded">Partially Refunded</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#141413]">Ordered Items:</p>
                <div className="divide-y divide-neutral-100 text-xs">
                  {ord.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="py-1.5 flex items-center justify-between"
                    >
                      <span>
                        {item.quantity}x {item.name} ({item.sku})
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatCurrency(item.subtotal, getCurrency())}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#E5E5E0] text-xs">
                <div>
                  <span className="text-[#6E6E68]">Payment Method:</span>{' '}
                  <strong className="text-[#141413]">{ord.payment_method}</strong>
                </div>
                <div className="text-right">
                  <span className="text-[#6E6E68]">Total Order Amount:</span>{' '}
                  <span className="font-mono font-bold text-[#141413] text-sm tabular-nums">
                    {formatCurrency(ord.total_amount, getCurrency())}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminShell>
  );
}
