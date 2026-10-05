'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Please confirm it, then sign in again.';
  }

  if (normalized.includes('rate limit')) {
    return 'Too many sign-in attempts. Please wait a moment and try again.';
  }

  return 'Unable to sign in right now. Please check your credentials and try again.';
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/auth/login?error=Email%20and%20password%20are%20required.');
  }

  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect('/auth/login?error=Supabase%20is%20not%20configured.');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(authErrorMessage(error.message))}`);
  }

  redirect('/account');
}
