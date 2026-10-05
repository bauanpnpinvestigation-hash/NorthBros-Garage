import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/server';

export default async function AccountLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireUser();

  return children;
}
