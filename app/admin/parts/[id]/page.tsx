'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { PartForm } from '@/components/admin/PartForm';

export default function AdminEditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { parts } = useStore();
  const part = parts.find((p) => p.id === id || p.slug === id);

  if (!part) {
    return (
      <AdminShell title="Part Not Found">
        <div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center space-y-4">
          <p className="text-sm text-[#6E6E68]">
            The requested automotive part could not be found.
          </p>
          <Link
            href="/admin/parts"
            className="inline-block px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
          >
            Back to Parts Inventory
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title={`Edit Part: ${part.name}`}
      subtitle={`SKU: ${part.sku} · ${part.brand_name}`}
    >
      <PartForm initialPart={part} />
    </AdminShell>
  );
}
