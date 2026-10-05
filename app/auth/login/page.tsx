'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { isStaffRole } from '@/lib/auth/role';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error') || '';

  const { user, isHydrated, login, logout } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const ok = await login(email.trim(), password);
      if (!ok) {
        setError('Invalid email or password. Please check your credentials and try again.');
        setIsSubmitting(false);
        return;
      }
      // Redirect is handled inside login() or based on resolved role
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in right now.');
      setIsSubmitting(false);
    }
  };

  if (isHydrated && user) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-8 py-16">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 sm:p-8 space-y-6 text-center">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-emerald-700">Currently Signed In</p>
            <h1 className="font-display text-2xl font-bold text-[#141413]">
              Welcome, {user.name || user.email}
            </h1>
            <p className="text-xs text-[#6E6E68]">
              Signed in as <strong>{user.email}</strong> ({user.role})
            </p>
          </div>

          <div className="space-y-2.5">
            <Link
              href={isStaffRole(user.role) ? '/admin' : '/account'}
              className="block w-full py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg"
            >
              {isStaffRole(user.role) ? 'Go to Admin Dashboard →' : 'Go to My Account →'}
            </Link>
            <Link
              href="/vlogs"
              className="block w-full py-2.5 bg-[#FAF9F6] border border-[#E5E5E0] text-[#141413] hover:bg-neutral-100 text-xs font-semibold rounded-lg"
            >
              Go to Daily Workshop Vlogs →
            </Link>
            <button
              type="button"
              onClick={async () => {
                await logout();
                router.refresh();
              }}
              className="w-full py-2.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayError = error || urlError;

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-16">
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#6E6E68]">Business Account</p>
          <h1 className="font-display text-2xl font-bold text-[#141413]">Sign In</h1>
          <p className="text-xs text-[#6E6E68]">
            Access your saved parts, orders, service appointments, daily vlogs, and account settings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold mb-1">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          {displayError && (
            <p role="alert" className="text-xs text-red-700">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#141413] hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            {isSubmitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs text-[#6E6E68]">
          <span>New to this business?</span>
          <Link href="/auth/register" className="font-semibold text-[#141413] hover:underline">
            Create Account →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 sm:px-8 py-16 text-center text-xs text-[#6E6E68]">
          Loading sign in…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
