import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveUserRole } from '@/lib/auth/role';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    if (body.action === 'signout') {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: true });
    }

    const { access_token, refresh_token } = body;
    if (!access_token || !refresh_token) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error || !data.user) {
      return NextResponse.json({ ok: false, error: error?.message }, { status: 401 });
    }

    let profile = null;
    if (data.user.app_metadata?.role !== 'admin') {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();
      profile = profileRow;
    }

    const role = resolveUserRole(data.user, profile);
    return NextResponse.json({ ok: true, role });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
