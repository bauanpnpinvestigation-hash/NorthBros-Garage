import type { NextConfig } from 'next';

const FALLBACK_SUPABASE_URL = 'https://yrbelimellocykhqjjyw.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyYmVsaW1lbGxvY3lraHFqanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExOTg3MTYsImV4cCI6MjEwNjc3NDcxNn0.FDD_ZE3K9WvgfLjKkxI_mZlD3McTofflW0Dm1I7fFkE';

function cleanSupabaseUrl(raw?: string): string {
  if (!raw) return FALLBACK_SUPABASE_URL;
  const trimmed = raw.trim();
  const match = trimmed.match(/https?:\/\/[^\s"'=]+/i);
  const candidate = match ? match[0] : trimmed;
  if (
    !candidate ||
    !/^https?:\/\//i.test(candidate) ||
    candidate === 'https://your-project-id.supabase.co'
  ) {
    return FALLBACK_SUPABASE_URL;
  }
  return candidate.replace(/\/+$/, '');
}

function cleanSupabaseKey(raw?: string): string {
  if (!raw) return FALLBACK_SUPABASE_ANON_KEY;
  let candidate = raw.trim();
  if (candidate.includes('=')) {
    const idx = candidate.indexOf('=');
    const after = candidate.slice(idx + 1).trim();
    if (after) candidate = after;
  }
  if (!candidate || candidate === 'your-supabase-anon-key') {
    return FALLBACK_SUPABASE_ANON_KEY;
  }
  return candidate;
}

const resolvedSupabaseUrl = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const resolvedSupabaseAnonKey = cleanSupabaseKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

process.env.NEXT_PUBLIC_SUPABASE_URL = resolvedSupabaseUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = resolvedSupabaseAnonKey;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolvedSupabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolvedSupabaseAnonKey,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default nextConfig;
