import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isStaffRole, resolveUserRole, type UserRole } from './role';

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentProfile(userId?: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  let targetUserId = userId;
  if (!targetUserId) {
    const user = await getCurrentUser();
    if (!user) return null;
    targetUserId = user.id;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .maybeSingle();

  return profile ?? null;
}

export async function getCurrentRole(
  userOverride?: any,
  profileOverride?: any
): Promise<UserRole> {
  const user =
    userOverride !== undefined ? userOverride : await getCurrentUser();
  if (!user) return 'customer';

  if (user?.app_metadata?.role === 'admin') {
    return 'admin';
  }

  const profile =
    profileOverride !== undefined
      ? profileOverride
      : await getCurrentProfile(user.id);

  return resolveUserRole(user, profile);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const profile = await getCurrentProfile(user.id);
  const role = resolveUserRole(user, profile);

  return { user, profile, role };
}

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirect('/auth/login');
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect('/auth/login');
  }

  const user = data.user;
  const profile = await getCurrentProfile(user.id);
  const role = resolveUserRole(user, profile);

  if (!isStaffRole(role)) {
    redirect('/account');
  }

  return { user, profile, role };
}
