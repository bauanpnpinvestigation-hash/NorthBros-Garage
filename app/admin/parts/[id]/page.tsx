'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { PartForm } from '@/components/admin/PartForm';

interface AdminEditPartPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditPartPage({ params }: AdminEditPartPageProps) {
  const { id } = use(params);
  const { parts } = useStore();
  const part = parts.find((p) => p.id === id);

  if (!part) {
    return (
      <AdminShell title="Part Not Found">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-[#6E6E68]">The requested part ID was not found in catalog.</p>
          <Link
            href="/admin/parts"
            className="inline-block px-4 py-2 bg-[#141413] text-white text-xs font-semibold rounded-lg"
          >
            Return to Parts List
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={`Edit Part: ${part.name}`}
      subtitle={`SKU: ${part.sku} · Brand: ${part.brand_name}`}
    >
      <PartForm initialPart={part} />
    </AdminShell>
  );
}
