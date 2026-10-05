'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';

export default function ProfilePage() {
  const { user, updateProfile, isHydrated, refreshAuth } = useStore();
  const [authSyncCompleted, setAuthSyncCompleted] = useState(false);

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

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
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-sm text-[#6E6E68]">
        Loading profile…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#141413]">
          Please sign in to manage your profile
        </h1>
        <Link
          href="/auth/login"
          className="inline-block px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const resolvedName = name ?? user.name ?? '';
  const resolvedEmail = email ?? user.email ?? '';
  const resolvedPhone = phone ?? user.phone ?? '';
  const resolvedAddress = address ?? user.address ?? '';
  const resolvedCity = city ?? user.city ?? '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: resolvedName.trim(),
      email: resolvedEmail.trim(),
      phone: resolvedPhone.trim(),
      address: resolvedAddress.trim(),
      city: resolvedCity.trim(),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-5">
        <div>
          <p className="text-xs text-[#6E6E68]">Account Settings</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413]">
            Manage Profile
          </h1>
        </div>
        <Link
          href="/account"
          className="text-xs font-semibold text-[#141413] hover:underline"
        >
          ← Back to Account
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-5"
      >
        <div>
          <label
            htmlFor="prof-name"
            className="block text-xs font-semibold text-[#141413] mb-1"
          >
            Full Name
          </label>
          <input
            id="prof-name"
            type="text"
            value={resolvedName}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="prof-email"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Email Address
            </label>
            <input
              id="prof-email"
              type="email"
              value={resolvedEmail}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="prof-phone"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Phone Number
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={resolvedPhone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="prof-address"
            className="block text-xs font-semibold text-[#141413] mb-1"
          >
            Street Address
          </label>
          <input
            id="prof-address"
            type="text"
            value={resolvedAddress}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
        </div>

        <div>
          <label
            htmlFor="prof-city"
            className="block text-xs font-semibold text-[#141413] mb-1"
          >
            City / Region
          </label>
          <input
            id="prof-city"
            type="text"
            value={resolvedCity}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
