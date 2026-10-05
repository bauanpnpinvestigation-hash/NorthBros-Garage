import type { NextConfig } from 'next';

const DEFAULT_SUPABASE_URL = 'https://yrbelimellocykhqjjyw.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_-S3ldz7d1hqDP9reBoeXrg_RsRkhZtU';

function resolveSupabaseUrl(value?: string) {
  const candidate = value?.trim();
  if (!candidate) return DEFAULT_SUPABASE_URL;

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? candidate.replace(/\/$/, '')
      : DEFAULT_SUPABASE_URL;
  } catch {
    return DEFAULT_SUPABASE_URL;
  }
}

function resolveSupabaseKey(value?: string) {
  const candidate = value?.trim();
  if (
    candidate &&
    candidate !== 'your-supabase-anon-key' &&
    candidate !== 'MY_SUPABASE_ANON_KEY'
  ) {
    return candidate;
  }

  return DEFAULT_SUPABASE_PUBLISHABLE_KEY;
}

const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = resolveSupabaseKey(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = { ignored: /.*/ };
    }
    return config;
  },
};

export default nextConfig;
