'use client';

import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PartForm } from '@/components/admin/PartForm';

export default function AdminNewPartPage() {
  return (
    <AdminShell
      title="Add New Automotive Part"
      subtitle="Create a new car part SKU with fitment specifications, pricing, and stock limits."
    >
      <PartForm />
    </AdminShell>
  );
}
