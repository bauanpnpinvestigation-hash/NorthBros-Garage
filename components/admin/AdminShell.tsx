'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/parts', label: 'Parts & Inventory' },
  { href: '/admin/parts/new', label: '+ Add Part' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/appointments', label: 'Service Bookings' },
  { href: '/admin/customers', label: 'Customers' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/vlogs', label: 'Daily Vlogs' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isHydrated, refreshAuth, logout } = useStore();
  const { getString } = useAppSettings();
  const siteName = getString('branding.site_name', 'NorthBros Garage');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (user) {
      setAuthChecked(true);
      if (user.role !== 'admin') {
        router.replace('/account');
      }
      return;
    }
    let active = true;
    refreshAuth().finally(() => {
      if (active) setAuthChecked(true);
    });
    return () => {
      active = false;
    };
  }, [isHydrated, user, refreshAuth, router]);

  useEffect(() => {
    if (isHydrated && authChecked) {
      if (!user) {
        router.replace('/auth/login');
      } else if (user.role !== 'admin') {
        router.replace('/account');
      }
    }
  }, [isHydrated, authChecked, user, router]);

  if (!isHydrated || (!user && !authChecked)) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-20 text-center text-xs text-[#6E6E68]">
        Loading administrator console…
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const displayName = user?.name || user?.email || 'Admin';
  const roleName = user?.role || 'admin';

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-4 lg:sticky lg:top-24">
          <div className="pb-3 border-b border-[#E5E5E0]">
            <p className="text-[11px] text-[#6E6E68]">{siteName}</p>
            <p className="font-display text-base font-bold">Parts & Workshop Admin</p>
          </div>
          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {ADMIN_LINKS.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                  pathname === i.href ||
                  (i.href === '/admin/parts' && pathname.startsWith('/admin/products'))
                    ? 'bg-[#141413] text-white font-semibold'
                    : 'text-[#52524E] hover:bg-[#FAF9F6]'
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#E5E5E0] flex items-center justify-between gap-2 text-[11px] text-[#6E6E68]">
            <span className="truncate">
              Signed in as <strong className="text-[#141413]">{displayName}</strong> ({roleName})
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.push('/auth/login');
                router.refresh();
              }}
              className="text-red-700 font-semibold hover:underline shrink-0 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </aside>
        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-5">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs text-[#6E6E68]">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
