'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { formatDate, formatPHP } from '@/lib/utils/format';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id || o.order_number === id);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#141413]">
          Order Not Found
        </h1>
        <Link
          href="/orders"
          className="inline-block px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-5">
        <div>
          <p className="text-xs text-[#6E6E68]">
            Placed on {formatDate(order.created_at)}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] font-mono">
            Order #{order.order_number}
          </h1>
        </div>
        <Link
          href="/orders"
          className="text-xs font-semibold text-[#141413] hover:underline"
        >
          ← All Orders
        </Link>
      </div>

      <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-b border-[#E5E5E0] pb-5">
          <div>
            <p className="text-[#6E6E68]">Shipping Recipient</p>
            <p className="font-semibold text-[#141413] mt-0.5">
              {order.customer_name}
            </p>
            <p className="text-[#52524E]">
              {order.shipping_address}, {order.shipping_city}{' '}
              {order.shipping_postal_code}
            </p>
          </div>
          <div>
            <p className="text-[#6E6E68]">Payment</p>
            <p className="font-semibold text-[#141413] mt-0.5">
              {order.payment_method}
            </p>
            <p className="text-[#52524E]">{order.payment_status}</p>
          </div>
          <div>
            <p className="text-[#6E6E68]">Fulfillment Status</p>
            <p className="font-semibold text-emerald-700 mt-0.5">
              {order.fulfillment_status}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div
              key={item.product_id}
              className="flex items-center justify-between text-xs border-b border-[#E5E5E0] last:border-b-0 pb-3 last:pb-0"
            >
              <div>
                <p className="font-semibold text-[#141413]">{item.name}</p>
                <p className="text-[#6E6E68] font-mono tabular-nums">
                  SKU: {item.sku} · Qty: {item.quantity} ×{' '}
                  {formatPHP(item.unit_price)}
                </p>
              </div>
              <span className="font-mono font-bold text-[#141413] tabular-nums">
                {formatPHP(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-[#E5E5E0] space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[#6E6E68]">Subtotal</span>
            <span className="font-mono tabular-nums">
              {formatPHP(order.subtotal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6E6E68]">Shipping</span>
            <span className="font-mono tabular-nums">
              {order.shipping_fee === 0
                ? 'FREE'
                : formatPHP(order.shipping_fee)}
            </span>
          </div>
          <div className="pt-2 border-t border-[#E5E5E0] flex justify-between text-base font-bold text-[#141413]">
            <span>Total</span>
            <span className="font-mono tabular-nums">
              {formatPHP(order.total_amount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
