'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email address is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Mobile phone number is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    const ok = register(name, email, phone, password);
    if (ok) {
      router.push('/account');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-16">
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#6E6E68]">
            Client Registration
          </p>
          <h1 className="font-display text-2xl font-bold text-[#141413]">
            Create Your Account
          </h1>
          <p className="text-xs text-[#6E6E68]">
            Save vehicles across devices, book showroom test drives, and track
            your reservations.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="juan@example.ph"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Mobile Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 917 555 0192"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 px-5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs text-[#6E6E68]">
          <span>Already have an account?</span>
          <Link
            href="/auth/login"
            className="font-semibold text-[#141413] hover:underline"
          >
            Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}
