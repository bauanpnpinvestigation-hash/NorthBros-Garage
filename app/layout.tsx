import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/components/shared/StoreProvider';
import { AppSettingsProvider } from '@/components/shared/AppSettingsProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function getPublicSetting(key:string, fallback:string) {
  const client = await createServerSupabaseClient();
  if (!client) return fallback;
  const { data } = await client.from('app_settings').select('setting_value').eq('setting_key',key).eq('is_public',true).maybeSingle();
  if (!data) return fallback;
  return typeof data.setting_value === 'string' ? data.setting_value : JSON.stringify(data.setting_value);
}

export async function generateMetadata(): Promise<Metadata> {
  const name = await getPublicSetting('branding.site_name','NorthBros Garage');
  const tagline = await getPublicSetting('branding.tagline','Professional automotive parts and workshop services.');
  return {
    title: { default: name, template: '%s | ' + name },
    description: tagline,
    openGraph: { title: name, description: tagline, type:'website', siteName:name },
    twitter: { card:'summary_large_image', title:name, description:tagline },
  };
}

export default async function RootLayout({children}:{children:React.ReactNode}) {
  const name = await getPublicSetting('branding.site_name','NorthBros Garage');
  const tagline = await getPublicSetting('branding.tagline','Professional automotive parts and workshop services.');
  const jsonLd = {'@context':'https://schema.org','@type':'AutoPartsStore',name,description:tagline};
  return <html lang="en"><body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413]"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><StoreProvider><AppSettingsProvider><Header/><main className="flex-1">{children}</main><Footer/></AppSettingsProvider></StoreProvider></body></html>;
}
