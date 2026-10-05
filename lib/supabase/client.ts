import { createBrowserClient } from '@supabase/ssr';

const AUTH_COOKIE_STORAGE_KEY = 'nb_supabase_auth_cookies';

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

function parseDocumentCookies(): Record<string, string> {
  if (typeof document === 'undefined' || !document.cookie) return {};
  const map: Record<string, string> = {};
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (name) {
      try {
        map[name] = decodeURIComponent(val);
      } catch {
        map[name] = val;
      }
    }
  }
  return map;
}

function readLocalCookieBackup(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(AUTH_COOKIE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalCookieBackup(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_COOKIE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function clearLocalAuthCookieBackup() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_COOKIE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabaseAnonKey();

  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseKey);
  }

  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        const docCookies = parseDocumentCookies();
        const backupCookies = readLocalCookieBackup();
        const merged: Record<string, string> = {
          ...backupCookies,
          ...docCookies,
        };
        let updatedBackup = false;
        for (const [k, v] of Object.entries(docCookies)) {
          if (k.startsWith('sb-') && backupCookies[k] !== v) {
            backupCookies[k] = v;
            updatedBackup = true;
          }
        }
        if (updatedBackup) {
          writeLocalCookieBackup(backupCookies);
        }
        return Object.entries(merged).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        const backup = readLocalCookieBackup();
        const isHttps =
          typeof window !== 'undefined' &&
          window.location.protocol === 'https:';

        for (const { name, value, options } of cookiesToSet) {
          const maxAge = options?.maxAge;
          if (!value || maxAge === 0 || (typeof maxAge === 'number' && maxAge < 0)) {
            delete backup[name];
            if (typeof document !== 'undefined') {
              document.cookie = `${name}=; path=/; max-age=0; ${
                isHttps ? 'SameSite=None; Secure; Partitioned' : 'SameSite=Lax'
              }`;
            }
          } else {
            backup[name] = value;
            if (typeof document !== 'undefined') {
              const ageAttr =
                typeof maxAge === 'number'
                  ? `; max-age=${maxAge}`
                  : '; max-age=31536000';
              const securityAttr = isHttps
                ? '; SameSite=None; Secure; Partitioned'
                : '; SameSite=Lax';
              document.cookie = `${name}=${encodeURIComponent(
                value
              )}; path=/${ageAttr}${securityAttr}`;
            }
          }
        }
        writeLocalCookieBackup(backup);
      },
    },
  });

  return browserClient;
}
