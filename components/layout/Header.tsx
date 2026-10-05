'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { isStaffRole } from '@/lib/auth/role';
import { Menu, X, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/parts', label: 'Car Parts' },
  { href: '/services', label: 'Services' },
  { href: '/categories', label: 'Categories' },
  { href: '/brands', label: 'Brands' },
  { href: '/vlogs', label: 'Daily Vlog' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { cart, favorites, user, isHydrated, refreshAuth, logout } = useStore();
  const { getString, getValue } = useAppSettings();
  const siteName = getString('branding.site_name', 'NorthBros Garage');
  const logoUrl = getString('branding.logo_url', '');
  const configuredNav = getValue('navigation.main_menu', null) as unknown;
  const navItems = Array.isArray(configuredNav) ? configuredNav.filter((item:any) => item && typeof item.href === 'string' && typeof item.label === 'string') as Array<{href:string;label:string}> : NAV_ITEMS;

  useEffect(() => {
    if (isHydrated && !user) {
      void refreshAuth();
    }
  }, [pathname, isHydrated, user, refreshAuth]);

  const qty = cart.reduce((s, i) => s + i.quantity, 0);
  const userName = user?.name
    ? user.name.split(' ')[0]
    : user?.email?.split('@')[0] || 'Account';

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await logout();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#E5E5E0]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-[#141413] whitespace-nowrap"
        >
          {logoUrl ? (
            <Image src={logoUrl} alt={siteName} width={34} height={34} className="h-8 w-8 object-contain" />
          ) : null}
          <span>{siteName}</span>
        </Link>
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52524E]"
        >
          {navItems.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`whitespace-nowrap py-1 border-b-2 ${
                pathname === i.href || pathname.startsWith(i.href + '/')
                  ? 'text-[#141413] border-[#141413] font-semibold'
                  : 'border-transparent hover:text-[#141413]'
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/favorites" className="px-3 py-2 text-xs font-medium hover:text-[#141413]">
            Saved ({favorites.length})
          </Link>
          <Link href="/cart" className="px-3 py-2 text-xs font-medium hover:text-[#141413]">
            Cart ({qty})
          </Link>
          {!isHydrated ? (
            <span className="px-4 py-2 text-xs font-semibold text-white bg-[#141413] rounded-lg">
              …
            </span>
          ) : user ? (
            <div className="flex items-center gap-2">
              {isStaffRole(user.role) && (
                <Link
                  href="/admin"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-neutral-800 rounded-lg"
                >
                  Staff Console ({userName})
                </Link>
              )}
              <Link
                href="/account"
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg ${
                  isStaffRole(user.role)
                    ? 'bg-white border border-[#E5E5E0] text-[#141413] hover:bg-neutral-100'
                    : 'bg-[#141413] text-white hover:bg-neutral-800'
                }`}
              >
                {isStaffRole(user.role) ? 'Account' : userName}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#141413] hover:bg-neutral-800 rounded-lg"
            >
              Sign In
            </Link>
          )}
        </div>
        <div className="flex md:hidden items-center gap-2">
          <Link href="/cart" className="px-3 py-1.5 text-xs bg-neutral-200/70 rounded-md">
            Cart ({qty})
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="p-2"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF9F6] border-b border-[#E5E5E0] px-4 pt-2 pb-5 space-y-3">
          <nav className="flex flex-col">
            {navItems.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm"
              >
                {i.label}
              </Link>
            ))}
            <Link
              href="/favorites"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm"
            >
              Saved Parts ({favorites.length})
            </Link>
            <Link
              href="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 text-sm"
            >
              My Orders & Service Bookings
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-semibold text-[#141413]"
              >
                Staff Console
              </Link>
            )}
          </nav>
          {user ? (
            <div className="space-y-2 pt-2 border-t border-[#E5E5E0]">
              <Link
                href={isStaffRole(user.role) ? '/admin' : '/account'}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 text-center text-xs font-semibold text-white bg-[#141413] rounded-lg"
              >
                {isStaffRole(user.role) ? `Staff Console (${userName})` : `Account (${userName})`}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 text-center text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center text-xs font-semibold text-white bg-[#141413] rounded-lg"
            >
              {!isHydrated ? 'Loading…' : 'Sign In / Register'}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
