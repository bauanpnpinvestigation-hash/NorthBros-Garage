'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useStore();
  const [email, setEmail] = useState('miguel.santos@example.ph');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    const ok = login(email, password);
    if (ok) {
      router.push('/account');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-16">
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#6E6E68]">
            Apex Motors Client & Dealer Portal
          </p>
          <h1 className="font-display text-2xl font-bold text-[#141413]">
            Sign In to Your Account
          </h1>
          <p className="text-xs text-[#6E6E68]">
            Access your saved vehicles, showroom inquiries, and reservation
            orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-[#141413] mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
            />
          </div>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 px-5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs text-[#6E6E68]">
          <span>New to Apex Motors?</span>
          <Link
            href="/auth/register"
            className="font-semibold text-[#141413] hover:underline"
          >
            Create an Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
