import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from './client';

export async function createServerSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              path: options?.path || '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
            } as any)
          );
        } catch {
          // Ignored when called from a Server Component
        }
      },
    },
  });
}
