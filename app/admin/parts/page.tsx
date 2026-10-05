'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP } from '@/lib/utils/format';
import { PartProduct, ProductStatus } from '@/types/database';
import { Edit3, Trash2, Plus, Minus, Check } from 'lucide-react';

export default function AdminPartsInventoryPage() {
  const { parts, updatePart, updatePartStatus, deletePart, confirmAction } =
    useStore();
  const [search, setSearch] = useState('');
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState<string>('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const handleAdjustStock = async (part: PartProduct, nextStock: number) => {
    const clamped = Math.max(0, Math.floor(nextStock));
    setBusyId(part.id);
    try {
      await updatePart(part.id, {
        stock: clamped,
        status: clamped === 0 ? 'Out of Stock' : 'Active',
      });
      setEditingStockId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePart = async (part: PartProduct) => {
    const confirmed = await confirmAction({
      title: 'Delete Part & Inventory Permanently',
      message: `Are you sure you want to permanently delete "${part.name}" (${part.sku})? This will completely delete the part and all nested data (inventory records, images, compatibility fitment, reviews, and cart items). This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
    });
    if (!confirmed) return;

    setBusyId(part.id);
    try {
      await deletePart(part.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell
      title="Parts & Inventory Management"
      subtitle="Add, edit, and permanently delete OEM & performance car parts, SKU numbers, pricing, and branch stock levels."
      action={
        <Link
          href="/admin/parts/new"
          className="px-4 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Part
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
                <th className="py-3 px-2 font-semibold">Inventory Stock</th>
                <th className="py-3 px-2 font-semibold">Status</th>
                <th className="py-3 px-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E0]">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-sm text-[#6E6E68]"
                  >
                    No parts found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((part) => (
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
                          <p className="font-semibold text-[#141413]">
                            {part.name}
                          </p>
                          <p className="text-[11px] text-[#6E6E68]">
                            {part.brand_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono text-[#52524E]">
                      {part.sku}
                    </td>
                    <td className="py-3 px-2 text-[#52524E]">
                      {part.category_name}
                    </td>
                    <td className="py-3 px-2 font-mono font-semibold text-[#141413] tabular-nums">
                      {formatPHP(part.price)}
                    </td>
                    <td className="py-3 px-2 font-mono tabular-nums">
                      {editingStockId === part.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={stockDraft}
                            onChange={(e) => setStockDraft(e.target.value)}
                            className="w-20 px-2 py-1 text-xs bg-[#FAF9F6] border border-[#141413] rounded font-mono"
                          />
                          <button
                            type="button"
                            disabled={busyId === part.id}
                            onClick={() =>
                              void handleAdjustStock(
                                part,
                                Number(stockDraft) || 0
                              )
                            }
                            className="p-1 bg-[#141413] text-white rounded hover:bg-neutral-800 cursor-pointer"
                            title="Save stock"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStockId(null)}
                            className="text-[11px] text-[#6E6E68] hover:text-[#141413] px-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyId === part.id || part.stock <= 0}
                            onClick={() =>
                              void handleAdjustStock(part, part.stock - 1)
                            }
                            className="w-6 h-6 rounded border border-[#E5E5E0] bg-[#FAF9F6] hover:bg-neutral-200/70 disabled:opacity-40 inline-flex items-center justify-center cursor-pointer"
                            title="Decrease stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStockId(part.id);
                              setStockDraft(String(part.stock));
                            }}
                            className={`min-w-[64px] text-center px-2 py-0.5 rounded hover:bg-neutral-100 cursor-pointer ${
                              part.stock === 0
                                ? 'text-red-700 font-semibold'
                                : part.stock <= 5
                                ? 'text-amber-700 font-semibold'
                                : 'text-emerald-700 font-semibold'
                            }`}
                            title="Click to edit stock quantity"
                          >
                            {part.stock} units
                          </button>
                          <button
                            type="button"
                            disabled={busyId === part.id}
                            onClick={() =>
                              void handleAdjustStock(part, part.stock + 1)
                            }
                            className="w-6 h-6 rounded border border-[#E5E5E0] bg-[#FAF9F6] hover:bg-neutral-200/70 disabled:opacity-40 inline-flex items-center justify-center cursor-pointer"
                            title="Increase stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={
                          part.status === 'Out of Stock'
                            ? 'Out of Stock'
                            : 'Active'
                        }
                        onChange={(e) =>
                          void updatePartStatus(
                            part.id,
                            e.target.value as ProductStatus
                          )
                        }
                        className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E5E5E0] rounded text-xs font-medium"
                      >
                        <option value="Active">Active</option>
                        <option value="Out of Stock">Out of Stock</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-right space-x-3 whitespace-nowrap">
                      <Link
                        href={`/admin/parts/${part.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[#141413] hover:underline"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === part.id}
                        onClick={() => void handleDeletePart(part)}
                        className="inline-flex items-center gap-1 font-semibold text-red-700 hover:underline disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
