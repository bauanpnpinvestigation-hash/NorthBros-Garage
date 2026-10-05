'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { formatCurrency } from '@/lib/utils/format';
import { Order } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const { cart, createOrder, user } = useStore();
  const { getString, getCurrency } = useAppSettings();
  const [paymentMethods, setPaymentMethods] = useState<Array<{code:string;name:string;description:string|null}>>([]);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(
    user?.address || ''
  );
  const [shippingCity, setShippingCity] = useState(
    user?.city || ''
  );
  const [shippingPostalCode, setShippingPostalCode] = useState(
    user?.postal_code || ''
  );
  const [paymentMethod, setPaymentMethod] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutIdempotencyKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    const c = createClient();
    if (!c) { setPaymentLoading(false); return; }
    void c.from('payment_methods').select('code,name,description').eq('is_enabled', true).order('sort_order').then(({ data, error }) => {
      if (error) setErrors((current) => ({ ...current, submit: error.message }));
      else {
        const methods = (data || []) as Array<{code:string;name:string;description:string|null}>;
        setPaymentMethods(methods);
        if (methods[0]) setPaymentMethod(methods[0].code);
      }
      setPaymentLoading(false);
    });
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const shippingThreshold = Number(getString('store.free_shipping_threshold', '5000')) || 5000;
  const configuredShippingFee = Number(getString('store.shipping_fee', '250')) || 0;
  const shippingFee = subtotal === 0 || subtotal >= shippingThreshold ? 0 : configuredShippingFee;
  const totalAmount = subtotal + shippingFee;
  const selectedPayment = paymentMethods.find((method) => method.code === paymentMethod);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.name = 'Recipient full name is required.';
    if (!customerEmail.trim() || !customerEmail.includes('@'))
      errs.email = 'Valid email is required.';
    if (!customerPhone.trim()) errs.phone = 'Mobile phone number is required.';
    if (!shippingAddress.trim())
      errs.address = 'Shipping street address is required.';
    if (!shippingPostalCode.trim())
      errs.postal = 'Postal code is required.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (!paymentMethod || !selectedPayment) {
        setErrors({ submit: 'Choose an available payment method.' });
        return;
      }
      const result = await createOrder({
        recipient_name: customerName.trim(), phone: customerPhone.trim(), address_line: shippingAddress.trim(),
        city: shippingCity.trim(), postal_code: shippingPostalCode.trim(), payment_method_code: selectedPayment.code,
        promotion_code: promotionCode.trim() || undefined,
        customer_notes: notes.trim() || undefined, idempotency_key: checkoutIdempotencyKey,
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
      });
      setConfirmedOrder({
        id: result.id,
        order_number: result.order_number,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_postal_code: shippingPostalCode.trim(),
        payment_method: selectedPayment.name,
        payment_status: 'Pending Verification',
        fulfillment_status: 'Processing',
        items: cart.map((c) => ({
          product_id: c.product_id,
          product_slug: c.product_slug,
          sku: c.sku,
          name: c.name,
          brand_name: c.brand_name,
          unit_price: c.unit_price,
          quantity: c.quantity,
          subtotal: c.unit_price * c.quantity,
          image: c.image,
        })),
        subtotal: result.subtotal,
        shipping_fee: result.shipping_fee,
        discount_amount: Number(result.discount_amount || 0),
        total_amount: result.total_amount,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Unable to place the order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-16">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-bold text-[#141413]">
              Order Created
            </h1>
            <p className="text-sm text-[#6E6E68]">
              Thank you for your order. Your payment is still pending verification, and our parts warehouse will prepare the shipment after payment is confirmed.
            </p>
          </div>

          <div className="p-5 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-2 text-left text-xs">
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Order Number</span>
              <span className="font-mono font-bold text-[#141413] text-sm">
                Order #{confirmedOrder.order_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Recipient</span>
              <span className="font-semibold text-[#141413]">
                {confirmedOrder.customer_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E6E68]">Payment Method</span>
              <span className="font-semibold text-[#141413]">
                {confirmedOrder.payment_method}
              </span>
            </div>
            {confirmedOrder.discount_amount > 0 && (
              <div className="flex justify-between text-[#15803D]">
                <span>Promotion Discount</span>
                <span className="font-mono">-{formatCurrency(confirmedOrder.discount_amount, getCurrency())}</span>
              </div>
            )}
            <div className="pt-2 border-t border-[#E5E5E0] flex justify-between text-sm font-bold text-[#141413]">
              <span>Total Order Amount</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(confirmedOrder.total_amount, getCurrency())}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/orders/${confirmedOrder.id}`}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
            >
              View Order
            </Link>
            <Link
              href="/parts"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#FAF9F6] border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#141413]">
          No Items to Checkout
        </h1>
        <Link
          href="/parts"
          className="inline-block px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Browse Car Parts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Checkout & Payment
        </h1>
        <p className="text-sm text-[#6E6E68]">
          Enter your shipping address and select an available payment method.
        </p>
      </div>

      <form
        onSubmit={handlePlaceOrder}
        noValidate
        className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
      >
        <div className="lg:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
            1. Customer & Shipping Information
          </h2>

          <div>
            <label
              htmlFor="chk-name"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Full Name
            </label>
            <input
              id="chk-name"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
            {errors.name && (
              <p className="text-xs text-red-700 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="chk-email"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                Email Address
              </label>
              <input
                id="chk-email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
              />
              {errors.email && (
                <p className="text-xs text-red-700 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="chk-phone"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                Mobile Number
              </label>
              <input
                id="chk-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
              />
              {errors.phone && (
                <p className="text-xs text-red-700 mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="chk-addr"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Street Address / Barangay / Building
            </label>
            <input
              id="chk-addr"
              type="text"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
            {errors.address && (
              <p className="text-xs text-red-700 mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="chk-city"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                City / Province
              </label>
              <input
                id="chk-city"
                type="text"
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
              />
            </div>

            <div>
              <label
                htmlFor="chk-zip"
                className="block text-xs font-semibold text-[#141413] mb-1"
              >
                Postal Code
              </label>
              <input
                id="chk-zip"
                type="text"
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
              />
              {errors.postal && (
                <p className="text-xs text-red-700 mt-1">{errors.postal}</p>
              )}
            </div>
          </div>

          <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3 pt-4">
            2. Select Payment Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentLoading ? <p className="text-xs text-[#6E6E68]">Loading payment methods…</p> : paymentMethods.length === 0 ? <p className="text-xs text-red-700">No payment methods are currently enabled.</p> : paymentMethods.map((method) => (
              <button key={method.code} type="button" onClick={() => setPaymentMethod(method.code)} className={`p-3.5 rounded-lg border text-left text-xs font-semibold transition-colors cursor-pointer ${paymentMethod === method.code ? 'bg-[#141413] text-white border-[#141413]' : 'bg-[#FAF9F6] text-[#141413] border-[#E5E5E0] hover:bg-neutral-200/70'}`}>
                <span>{method.name}</span>{method.description && <span className={`block mt-1 text-[11px] font-normal ${paymentMethod === method.code ? 'text-neutral-300' : 'text-[#6E6E68]'}`}>{method.description}</span>}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor="chk-promo" className="block text-xs font-semibold text-[#141413] mb-1">
              Promotion Code (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="chk-promo"
                type="text"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value)}
                placeholder="Enter promotion code"
                className="flex-1 px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono uppercase"
              />
            </div>
            <p className="mt-1 text-[10px] text-[#6E6E68]">
              The server validates eligible products, timing, limits, and discount amount at checkout.
            </p>
          </div>

          {errors.submit && <p className="text-xs text-red-700">{errors.submit}</p>}

          <div>
            <label
              htmlFor="chk-notes"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Delivery Notes (Optional)
            </label>
            <textarea
              id="chk-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
        </div>

        <aside className="lg:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-7 space-y-5">
          <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
            Order Items ({cart.length})
          </h2>

          <div className="space-y-3 divide-y divide-[#E5E5E0]">
            {cart.map((item) => (
              <div
                key={item.product_id}
                className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#141413]">{item.name}</p>
                  <p className="text-[#6E6E68] font-mono tabular-nums">
                    SKU: {item.sku} · Qty: {item.quantity}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#141413] tabular-nums shrink-0">
                  {formatCurrency(item.unit_price * item.quantity, getCurrency())}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E5E0] space-y-2 text-xs">
            <div className="flex justify-between text-[#52524E]">
              <span>Parts Subtotal</span>
              <span className="font-mono tabular-nums">{formatCurrency(subtotal, getCurrency())}</span>
            </div>
            <div className="flex justify-between text-[#52524E]">
              <span>Shipping Fee</span>
              <span className="font-mono tabular-nums">
                {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee, getCurrency())}
              </span>
            </div>
            {promotionCode.trim() && (
              <div className="text-[10px] text-[#6E6E68]">
                Promotion code will be validated when the order is placed.
              </div>
            )}
            <div className="pt-3 border-t border-[#E5E5E0] flex items-baseline justify-between">
              <span className="text-sm font-bold text-[#141413]">
                Total Payable
              </span>
              <span className="text-2xl font-bold text-[#141413] font-mono tabular-nums">
                {formatCurrency(totalAmount, getCurrency())}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || paymentLoading || paymentMethods.length === 0}
            className="w-full py-3 px-5 bg-[#141413] hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {isSubmitting ? 'Processing Order…' : `Place Order${selectedPayment ? ` (${selectedPayment.name})` : ''}`}
          </button>

          <div className="flex items-center gap-2 text-[11px] text-[#6E6E68]">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Your order is securely recorded and will remain pending until payment is confirmed.
            </span>
          </div>
        </aside>
      </form>
    </div>
  );
}
