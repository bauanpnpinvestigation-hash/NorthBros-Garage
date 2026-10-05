'use client';

import React, { useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { slugify } from '@/lib/utils/format';

export default function AdminCategoriesPage() {
  const { categories, parts, addCategory } = useStore();
  const [name, setName] = useState('');
  const [commonParts, setCommonParts] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    addCategory({
      name: name.trim(),
      slug: slugify(name),
      common_parts: commonParts.trim() || 'Filters, Plugs, Belts',
      description: description.trim(),
    });
    setName('');
    setCommonParts('');
    setDescription('');
  };

  return (
    <AdminShell
      title="Car Part Categories"
      subtitle="Organize parts by vehicle mechanical and electrical systems."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {categories.map((cat) => {
            const count = parts.filter((p) => p.category_slug === cat.slug).length;
            return (
              <div
                key={cat.id}
                className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-[#141413]">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-[#6E6E68]">
                    {count} parts
                  </span>
                </div>
                <p className="text-xs text-[#52524E]">{cat.description}</p>
                <p className="text-[11px] text-[#6E6E68]">
                  Common items: {cat.common_parts}
                </p>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-[#141413]">
            Add Part Category
          </h2>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Braking Systems"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Common Components Included
            </label>
            <input
              type="text"
              value={commonParts}
              onChange={(e) => setCommonParts(e.target.value)}
              placeholder="Pads, Rotors, Calipers, Fluid"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Save Category
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
