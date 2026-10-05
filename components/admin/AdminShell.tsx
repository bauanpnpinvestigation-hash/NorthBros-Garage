'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/parts', label: 'Parts & Inventory' },
  { href: '/admin/parts/new', label: '+ Add Part' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/appointments', label: 'Service Bookings' },
  { href: '/admin/brands', label: 'Brands' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/vlogs', label: 'Daily Vlogs' },
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
  const { user, login } = useStore();

  // Authorization check
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-8 py-20 text-center space-y-5">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413]">
          Administrator Authorization Required
        </h1>
        <p className="text-sm text-[#6E6E68]">
          This area is restricted to authorized Apex Motors inventory managers, parts specialists, and workshop administrators.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => login('miguel.santos@example.ph')}
            className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            Sign In as Demo Admin (Miguel Santos)
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-4 lg:sticky lg:top-24">
          <div className="pb-3 border-b border-[#E5E5E0]">
            <p className="text-[11px] font-medium text-[#6E6E68]">
              Automotive Commerce Console
            </p>
            <p className="font-display text-base font-bold text-[#141413]">
              Apex Parts & Services Admin
            </p>
          </div>

          <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {ADMIN_LINKS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#141413] text-white font-semibold'
                      : 'text-[#52524E] hover:bg-[#FAF9F6] hover:text-[#141413]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block pt-3 border-t border-[#E5E5E0] text-[11px] text-[#6E6E68]">
            Signed in as <strong className="text-[#141413]">{user.name}</strong> ({user.role})
          </div>
        </aside>

        {/* Main Admin Content */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-5">
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs text-[#6E6E68]">{subtitle}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
