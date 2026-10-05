import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/components/shared/StoreProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Apex Auto Parts & Services PH — Car Parts Store & Service Booking',
    template: '%s | Apex Auto Parts & Services PH',
  },
  description:
    'Shop genuine OEM and performance car parts (brakes, oil filters, batteries, suspension, spark plugs) and book professional automotive maintenance services in the Philippines.',
  openGraph: {
    title: 'Apex Auto Parts & Services PH — Car Parts Store & Service Booking',
    description:
      'Shop genuine OEM and performance car parts and book professional automotive maintenance services in the Philippines.',
    type: 'website',
    siteName: 'Apex Auto Parts & Services PH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apex Auto Parts & Services PH — Car Parts Store & Service Booking',
    description:
      'Shop genuine OEM and performance car parts and book professional automotive maintenance services in the Philippines.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoPartsStore',
    name: 'Apex Auto Parts & Services PH',
    description:
      'E-commerce store for genuine automotive parts, maintenance kits, and professional automotive service appointments.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '38th Street, Bonifacio Global City',
      addressLocality: 'Taguig',
      addressRegion: 'Metro Manila',
      addressCountry: 'PH',
    },
  };

  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#141413] selection:bg-[#141413] selection:text-white"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
