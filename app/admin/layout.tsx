import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    redirect('/auth/login?error=Supabase%20is%20not%20configured.');
  }

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims as
    | {
        sub?: string;
        app_metadata?: { role?: string; is_admin?: boolean };
      }
    | null
    | undefined;

  if (!claims?.sub) {
    redirect('/auth/login?error=Please%20sign%20in%20to%20access%20the%20admin%20dashboard.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .maybeSingle();

  const isAdmin =
    profile?.role === 'admin' ||
    claims.app_metadata?.role === 'admin' ||
    claims.app_metadata?.is_admin === true;

  if (!isAdmin) {
    redirect('/account?error=Administrator%20authorization%20required.');
  }

  return children;
}
