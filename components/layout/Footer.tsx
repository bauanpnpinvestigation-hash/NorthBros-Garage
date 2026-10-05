'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  { title: 'Catalog', links: [
    { label: 'All Automotive Parts', href: '/parts' },
    { label: 'Part Categories', href: '/categories' },
    { label: 'Manufacturer Brands', href: '/brands' },
    { label: 'Daily Workshop Vlog', href: '/vlogs' },
  ]},
  { title: 'Services & Orders', links: [
    { label: 'Book Automotive Service', href: '/services' },
    { label: 'Shopping Cart', href: '/cart' },
    { label: 'Order & Service History', href: '/orders' },
    { label: 'Saved Parts Wishlist', href: '/favorites' },
    { label: 'Customer Account', href: '/account' },
  ]},
  { title: 'Information', links: [
    { label: 'About', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Warranty Policy', href: '/terms' },
  ]},
];

export function Footer() {
  const { user } = useStore();
  const { getString, getValue } = useAppSettings();
  const rawFooterColumns = getValue('footer.columns', DEFAULT_FOOTER_COLUMNS);
  const footerColumns: FooterColumn[] = Array.isArray(rawFooterColumns)
    ? rawFooterColumns.filter((column: any) => column && typeof column.title === 'string' && Array.isArray(column.links)).map((column: any) => ({
        title: column.title,
        links: column.links.filter((link: any) => link && typeof link.label === 'string' && typeof link.href === 'string'),
      }))
    : DEFAULT_FOOTER_COLUMNS;
  const siteName = getString('branding.site_name', 'NorthBros Garage');
  const tagline = getString(
    'footer.about',
    'Professional automotive parts and workshop services.'
  );
  const contactAddress = getString('contact.address', 'Business address not configured');
  const businessHours = getString('business.hours', 'Business hours not configured');
  const footerPayments = getString('footer.payments_label', 'Configured payment methods');
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

          {footerColumns.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-xs font-semibold text-white tracking-wide">
                {column.title}
              </h3>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {user?.role === 'admin' && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-white tracking-wide">
                Administration
              </h3>
              <ul className="space-y-2.5 text-sm text-neutral-400">
                <li>
                  <Link href="/admin" className="hover:text-white transition-colors">
                    Store Admin Console
                  </Link>
                </li>
              </ul>
            </div>
          )}        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-neutral-400">
          <p>
            {copyright}
          </p>
          <p className="tabular-nums">
            {footerPayments}
          </p>
        </div>
      </div>
    </footer>
  );
}
