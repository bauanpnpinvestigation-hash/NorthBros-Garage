'use client';

import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PartForm } from '@/components/admin/PartForm';

export default function AdminNewPartPage() {
  return (
    <AdminShell
      title="Add New Car Part"
      subtitle="Create a new genuine OEM or performance automotive part in the catalog."
    >
      <PartForm />
    </AdminShell>
  );
}
