'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP } from '@/lib/utils/format';
import { Edit2, Trash2, Plus } from 'lucide-react';

export default function AdminPartsListPage() {
  const { parts, deletePart, updatePartStatus } = useStore();
  const [filterBrand, setFilterBrand] = useState('all');

  const filtered = parts.filter(
    (p) => filterBrand === 'all' || p.brand_slug === filterBrand
  );

  return (
    <AdminShell
      title="Car Parts & Inventory Management"
      subtitle="Manage automotive component listings, SKUs, inventory counts, and pricing."
      action={
        <Link
          href="/admin/parts/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" />
          Add New Part
        </Link>
      }
    >
      <div className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E0] flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F6]">
          <span className="text-xs font-bold text-[#141413]">
            {filtered.length} Parts Listed
          </span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#6E6E68]">Filter Brand:</label>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="text-xs px-2.5 py-1 bg-white border border-[#E5E5E0] rounded-lg font-medium"
            >
              <option value="all">All Brands</option>
              <option value="brembo">Brembo</option>
              <option value="bosch">Bosch</option>
              <option value="motul">Motul</option>
              <option value="denso">Denso</option>
              <option value="ngk">NGK</option>
              <option value="bilstein">Bilstein</option>
              <option value="michelin">Michelin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F6] border-b border-[#E5E5E0] text-[#6E6E68] font-semibold">
              <tr>
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-4">Brand & Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {filtered.map((part) => (
                <tr key={part.id} className="hover:bg-neutral-50/60">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-[#E5E5E0]">
                        <Image
                          src={part.primary_image}
                          alt={part.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/parts/${part.slug}`}
                          target="_blank"
                          className="font-bold text-[#141413] hover:underline line-clamp-1"
                        >
                          {part.name}
                        </Link>
                        <p className="font-mono text-[11px] text-[#6E6E68]">
                          SKU: {part.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-[#141413]">{part.brand_name}</p>
                    <p className="text-[#6E6E68] text-[11px]">{part.category_name}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#141413] tabular-nums">
                    {formatPHP(part.price)}
                  </td>
                  <td className="py-3.5 px-4 font-mono tabular-nums">
                    <span
                      className={`font-semibold ${
                        part.stock === 0
                          ? 'text-red-700'
                          : part.stock <= 5
                          ? 'text-amber-700'
                          : 'text-[#141413]'
                      }`}
                    >
                      {part.stock} units
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={part.status}
                      onChange={(e) =>
                        updatePartStatus(part.id, e.target.value as any)
                      }
                      className="text-[11px] px-2 py-1 bg-[#FAF9F6] border border-[#E5E5E0] rounded-md font-semibold"
                    >
                      <option value="Active">Active</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/parts/${part.id}`}
                        className="p-1.5 text-[#52524E] hover:text-[#141413] bg-[#FAF9F6] hover:bg-neutral-200 rounded"
                        title="Edit part"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove ${part.name} from catalog?`)) {
                            deletePart(part.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:text-red-800 bg-[#FAF9F6] hover:bg-red-50 rounded cursor-pointer"
                        title="Delete part"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
