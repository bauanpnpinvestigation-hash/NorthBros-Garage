'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/parts', label: 'Car Parts' },
  { href: '/services', label: 'Services' },
  { href: '/categories', label: 'Categories' },
  { href: '/brands', label: 'Brands' },
  { href: '/vlogs', label: 'Daily Vlog' },
];

export function Header() {
  const pathname = usePathname();
  const { cart, favorites, user } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E5E0]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-[#141413] whitespace-nowrap shrink-0"
        >
          Apex Auto Parts
        </Link>

        {/* Zone 2: 5 clean text navigation links */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52524E]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap transition-colors py-1 border-b-2 ${
                  isActive
                    ? 'text-[#141413] border-[#141413] font-semibold'
                    : 'border-transparent hover:text-[#141413] hover:border-neutral-300'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <Link
            href="/cart"
            className="px-3.5 py-2 text-xs font-medium text-[#141413] hover:bg-neutral-200/60 rounded-lg transition-colors whitespace-nowrap tabular-nums"
          >
            Cart ({totalCartQty})
          </Link>
          <Link
            href={user ? '/account' : '/auth/login'}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-neutral-800 rounded-lg transition-colors whitespace-nowrap"
          >
            {user ? `Account · ${user.name.split(' ')[0]}` : 'Sign In'}
          </Link>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/cart"
            className="px-3 py-1.5 text-xs font-medium text-[#141413] bg-neutral-200/70 rounded-md whitespace-nowrap tabular-nums"
          >
            Cart ({totalCartQty})
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 text-[#141413] hover:bg-neutral-200/60 rounded-lg"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF9F6] border-b border-[#E5E5E0] px-4 pt-2 pb-5 space-y-3">
          <nav className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-[#141413] hover:bg-neutral-200/60 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-[#141413] hover:bg-neutral-200/60 rounded-lg tabular-nums"
            >
              Saved Parts ({favorites.length})
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-[#141413] hover:bg-neutral-200/60 rounded-lg"
            >
              My Orders & Service Bookings
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-[#141413] hover:bg-neutral-200/60 rounded-lg"
            >
              Admin Console
            </Link>
          </nav>
          <div className="pt-2 border-t border-[#E5E5E0] flex items-center gap-3">
            <Link
              href={user ? '/account' : '/auth/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-xs font-semibold text-white bg-[#141413] rounded-lg"
            >
              {user ? `Account (${user.name})` : 'Sign In / Register'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
