'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { formatPHP } from '@/lib/utils/format';
import { Minus, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function CartPage() {
  const { cart, updateCartQuantity, removeFromCart } = useStore();
  const { getString } = useAppSettings();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const shippingThreshold = Number(getString('store.free_shipping_threshold', '5000')) || 5000;
  const configuredShippingFee = Number(getString('store.shipping_fee', '250')) || 0;
  const shippingFee = subtotal === 0 || subtotal >= shippingThreshold ? 0 : configuredShippingFee;
  const total = subtotal + shippingFee;


  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Order Summary & Quantity Review
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Shopping Cart
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-12 text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-[#141413]">
            Your Shopping Cart is Empty
          </h2>
          <p className="text-sm text-[#6E6E68] max-w-md mx-auto">
            Browse our car parts catalog to add brake kits, synthetic motor
            oils, filters, or batteries to your cart.
          </p>
          <div className="pt-2">
            <Link
              href="/parts"
              className="inline-block px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
            >
              Shop Car Parts
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 bg-white border border-[#E5E5E0] rounded-xl divide-y divide-[#E5E5E0]">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-24 aspect-[4/3] rounded-lg overflow-hidden bg-[#141413] shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="100px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#6E6E68] font-mono tabular-nums">
                      {item.brand_name} · SKU: {item.sku}
                    </p>
                    <Link
                      href={`/parts/${item.product_slug}`}
                      className="text-sm font-semibold text-[#141413] hover:underline block"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[#52524E] font-mono tabular-nums">
                      Unit Price: {formatPHP(item.unit_price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#E5E5E0]">
                  {/* Quantity Stepper */}
                  <div className="inline-flex items-center border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]">
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(item.product_id, item.quantity - 1)
                      }
                      className="p-2 text-[#141413] hover:bg-neutral-200/70 rounded-l-lg cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3.5 py-1 text-xs font-mono font-bold tabular-nums text-[#141413]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCartQuantity(item.product_id, item.quantity + 1)
                      }
                      className="p-2 text-[#141413] hover:bg-neutral-200/70 rounded-r-lg cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="text-right min-w-[95px]">
                    <p className="text-sm font-bold text-[#141413] font-mono tabular-nums">
                      {formatPHP(item.unit_price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-[11px] text-red-700 hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <aside className="lg:col-span-4 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-[#52524E]">
                <span>Parts Subtotal</span>
                <span className="font-mono font-semibold text-[#141413] tabular-nums">
                  {formatPHP(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#52524E]">
                <span>Shipping</span>
                <span className="font-mono font-semibold text-[#141413] tabular-nums">
                  {shippingFee === 0 ? 'FREE' : formatPHP(shippingFee)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E5E5E0] flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#141413]">Total</span>
                <span className="text-2xl font-bold text-[#141413] font-mono tabular-nums">
                  {formatPHP(total)}
                </span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full py-3 px-5 bg-[#141413] hover:bg-neutral-800 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/parts"
              className="block text-center text-xs font-medium text-[#6E6E68] hover:text-[#141413]"
            >
              ← Continue Shopping Parts
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
