'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';

export function Footer() {
  const { user } = useStore();
  const { getString } = useAppSettings();
  const siteName = getString('branding.site_name', 'NorthBros Garage');
  const tagline = getString(
    'footer.about',
    'Professional automotive parts and workshop services.'
  );
  const contactAddress = getString('contact.address', 'Business address not configured');
  const businessHours = getString('business.hours', 'Business hours not configured');
  const copyright = getString(
    'footer.copyright',
    `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`
  );
  return (
    <footer className="bg-[#141413] text-[#FAF9F6] border-t border-neutral-800 mt-20">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-neutral-800">
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="font-display text-xl font-bold tracking-tight text-white inline-block"
            >
              {siteName}
            </Link>
            <p className="text-sm text-neutral-400 max-w-sm leading-relaxed">
              {tagline}
            </p>
            <p className="text-xs text-neutral-400 tabular-nums">
              {contactAddress} · {businessHours}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Car Parts Catalog
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/parts" className="hover:text-white transition-colors">
                  All Automotive Parts
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-white transition-colors">
                  Part Categories
                </Link>
              </li>
              <li>
                <Link href="/brands" className="hover:text-white transition-colors">
                  Manufacturer Brands
                </Link>
              </li>
              <li>
                <Link href="/vlogs" className="hover:text-white transition-colors">
                  Daily Workshop Vlog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Services & Orders
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Book Automotive Service
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Order & Service History
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="hover:text-white transition-colors">
                  Saved Parts Wishlist
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  Customer Account
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Store & Administration
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Our Workshop
                </Link>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <Link href="/admin" className="hover:text-white transition-colors">
                    Store Admin Console
                  </Link>
                </li>
              )}
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Warranty Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400">
          <p>
            {copyright}
          </p>
          <p className="tabular-nums">
            Payments Supported: GCash · Maya · GoTyme / QR Ph · Cash on Delivery
          </p>
        </div>
      </div>
    </footer>
  );
}
