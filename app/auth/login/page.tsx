import React from 'react';
import Link from 'next/link';
import { loginAction } from './actions';

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error ? decodeURIComponent(params.error) : '';

  return (
    <div className="max-w-md mx-auto px-4 sm:px-8 py-16">
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-7 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[#6E6E68]">NorthBros Garage Account</p>
          <h1 className="font-display text-2xl font-bold text-[#141413]">Sign In</h1>
          <p className="text-xs text-[#6E6E68]">
            Access your saved parts, orders, service appointments, and account settings.
          </p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
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
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg"
          >
            Sign In
          </button>
        </form>

        <div className="pt-4 border-t border-[#E5E5E0] flex items-center justify-between text-xs text-[#6E6E68]">
          <span>New to NorthBros Garage?</span>
          <Link href="/auth/register" className="font-semibold text-[#141413] hover:underline">
            Create Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
