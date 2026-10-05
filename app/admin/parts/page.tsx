'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP } from '@/lib/utils/format';
import { ProductStatus } from '@/types/database';

export default function AdminPartsInventoryPage() {
  const { parts, updatePartStatus, deletePart } = useStore();
  const [search, setSearch] = useState('');

  const filtered = parts.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand_name.toLowerCase().includes(q) ||
      p.category_name.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell
      title="Parts & Inventory Management"
      subtitle="Manage OEM and performance car parts, SKU numbers, pricing, and stock levels."
      action={
        <Link
          href="/admin/parts/new"
          className="px-4 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
        >
          + Add New Part
        </Link>
      }
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by part name, SKU, brand, or category…"
            className="w-full sm:max-w-md px-3.5 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
          <p className="text-xs text-[#6E6E68] font-mono tabular-nums">
            Showing {filtered.length} of {parts.length} parts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E0] text-[#6E6E68]">
                <th className="py-3 px-2 font-semibold">Part</th>
                <th className="py-3 px-2 font-semibold">SKU</th>
                <th className="py-3 px-2 font-semibold">Category</th>
                <th className="py-3 px-2 font-semibold">Price</th>
                <th className="py-3 px-2 font-semibold">Stock</th>
                <th className="py-3 px-2 font-semibold">Status</th>
                <th className="py-3 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {filtered.map((part) => (
                <tr key={part.id} className="hover:bg-[#FAF9F6]/60">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 aspect-[4/3] rounded overflow-hidden bg-[#141413] shrink-0">
                        <Image
                          src={part.primary_image}
                          alt={part.name}
                          fill
                          sizes="48px"
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#141413]">{part.name}</p>
                        <p className="text-[11px] text-[#6E6E68]">{part.brand_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-2 font-mono text-[#52524E]">{part.sku}</td>
                  <td className="py-3 px-2 text-[#52524E]">{part.category_name}</td>
                  <td className="py-3 px-2 font-mono font-semibold text-[#141413] tabular-nums">
                    {formatPHP(part.price)}
                  </td>
                  <td className="py-3 px-2 font-mono tabular-nums">
                    <span
                      className={
                        part.stock === 0
                          ? 'text-red-700 font-semibold'
                          : part.stock <= 5
                          ? 'text-amber-700 font-semibold'
                          : 'text-emerald-700 font-semibold'
                      }
                    >
                      {part.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <select
                      value={part.status}
                      onChange={(e) =>
                        updatePartStatus(part.id, e.target.value as ProductStatus)
                      }
                      className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5E5E0] rounded text-xs font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </td>
                  <td className="py-3 px-2 text-right space-x-3 whitespace-nowrap">
                    <Link
                      href={`/admin/parts/${part.id}`}
                      className="font-semibold text-[#141413] hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to PERMANENTLY DELETE this part? This action cannot be undone and will remove all related data (inventory, images, compatibility, cart items).')) {
                          deletePart(part.id);
                        }
                      }}
                      className="font-semibold text-red-700 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
