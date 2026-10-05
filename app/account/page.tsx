'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { formatDate, formatCurrency } from '@/lib/utils/format';

export default function AccountDashboardPage() {
  const router = useRouter();
  const { user, favorites, orders, serviceBookings, customerVehicles, logout, isHydrated, refreshAuth } = useStore();
  const { getCurrency } = useAppSettings();
  const [authSyncCompleted, setAuthSyncCompleted] = React.useState(false);

  React.useEffect(() => {
    if (!isHydrated || user) return;
    let active = true;
    refreshAuth().finally(() => {
      if (active) setAuthSyncCompleted(true);
    });
    return () => {
      active = false;
    };
  }, [isHydrated, user, refreshAuth]);

  if (!isHydrated || (!user && !authSyncCompleted)) {
    return <div className="max-w-xl mx-auto px-4 sm:px-8 py-20 text-center text-sm text-[#6E6E68]">Loading account…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-8 py-20 text-center space-y-5">
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          Sign In Required
        </h1>
        <p className="text-sm text-[#6E6E68]">
          Please sign in to view your part orders, service bookings, and saved
          wishlist.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2.5 bg-white border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
        <div className="space-y-1">
          <p className="text-xs text-[#6E6E68]">
            Customer Account · {user.email}
          </p>
          <h1 className="font-display text-3xl font-bold text-[#141413]">
            Welcome back, {user?.name || user?.email || 'Customer'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
          <Link
          href="/account/vehicles"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">My Garage</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {customerVehicles.length} Vehicles
          </p>
          <p className="text-xs text-[#52524E]">Manage saved vehicles →</p>
        </Link>

          href="/account/profile"
            className="px-4 py-2 bg-white border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg hover:bg-neutral-100"
          >
            Edit Profile
          </Link>
          {user.role === 'admin' && (
            <Link
              href="/admin"
              className="px-4 py-2 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
            >
              Store Admin Console
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link
          href="/account/vehicles"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">My Garage</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {customerVehicles.length} Vehicles
          </p>
          <p className="text-xs text-[#52524E]">Manage saved vehicles →</p>
        </Link>

        <Link
          href="/account/profile"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">Shipping Address</p>
          <p className="font-display text-lg font-bold text-[#141413]">
            Profile & Garage
          </p>
          <p className="text-xs text-[#52524E] truncate">{user.address}</p>
        </Link>

        <Link
          href="/favorites"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">Saved Parts</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {favorites.length} Parts
          </p>
          <p className="text-xs text-[#52524E]">View wishlist →</p>
        </Link>

        <Link
          href="/orders"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">Parts Purchases</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {orders.length} Orders
          </p>
          <p className="text-xs text-[#52524E]">Track shipments →</p>
        </Link>

        <Link
          href="/orders"
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-2 hover:border-[#141413] transition-colors"
        >
          <p className="text-xs text-[#6E6E68]">Service Bay</p>
          <p className="font-display text-2xl font-bold text-[#141413] font-mono tabular-nums">
            {serviceBookings.length} Appointments
          </p>
          <p className="text-xs text-[#52524E]">View schedule →</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
            <h2 className="font-display text-lg font-bold text-[#141413]">
              Recent Car Parts Orders
            </h2>
            <Link
              href="/orders"
              className="text-xs font-semibold text-[#141413] hover:underline"
            >
              View All →
            </Link>
          </div>
          {orders.slice(0, 3).map((ord) => (
            <div
              key={ord.id}
              className="p-4 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <Link
                  href={`/orders/${ord.id}`}
                  className="text-xs font-mono font-bold text-[#141413] hover:underline"
                >
                  {ord.order_number} · {ord.fulfillment_status}
                </Link>
                <p className="text-xs text-[#52524E] line-clamp-1">
                  {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
                <p className="text-[11px] text-[#6E6E68]">
                  {formatDate(ord.created_at)} · {ord.payment_method}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#141413] tabular-nums shrink-0">
                {formatCurrency(ord.total_amount, getCurrency())}
              </span>
            </div>
          ))}
        </section>

        <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-3">
            <h2 className="font-display text-lg font-bold text-[#141413]">
              Upcoming Service Bookings
            </h2>
            <Link
              href="/services"
              className="text-xs font-semibold text-[#141413] hover:underline"
            >
              + Book Service
            </Link>
          </div>
          {serviceBookings.slice(0, 3).map((sb) => (
            <div
              key={sb.id}
              className="p-4 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[#141413]">
                  #{sb.booking_reference} · {sb.preferred_date} (
                  {sb.preferred_time})
                </span>
                <span className="font-semibold text-emerald-700">
                  {sb.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#141413]">
                {sb.service_name}
              </p>
              <p className="text-[11px] text-[#6E6E68]">
                Vehicle: {sb.vehicle_details}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
