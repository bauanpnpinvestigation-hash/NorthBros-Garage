import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return '';
  const trimmed = raw.trim();
  const match = trimmed.match(/https?:\/\/[^\s"'=]+/i);
  const candidate = match ? match[0] : trimmed;
  if (!candidate || !/^https?:\/\//i.test(candidate)) return '';
  return candidate.replace(/\/+$/, '');
}

export function getSupabaseAnonKey(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!raw) return '';
  let candidate = raw.trim();
  if (candidate.includes('=')) {
    const idx = candidate.indexOf('=');
    const after = candidate.slice(idx + 1).trim();
    if (after) candidate = after;
  }
  if (!candidate || candidate === 'your-supabase-anon-key') return '';
  return candidate;
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && /^https?:\/\//i.test(url));
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) return null;

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }

  if (browserClient) return browserClient;

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
}

// Kept as a compatibility no-op for callers from older auth flows.
// Supabase SSR manages its auth cookies directly; tokens are never copied to localStorage.
export function clearLocalAuthCookieBackup() {
  return;
}
