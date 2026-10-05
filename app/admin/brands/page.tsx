'use client';

import React, { useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { slugify } from '@/lib/utils/format';

export default function AdminBrandsPage() {
  const { brands, parts, addBrand } = useStore();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Japan');
  const [specialty, setSpecialty] = useState('OEM Ignition & Electronic Sensors');
  const [warranty, setWarranty] = useState('1 Year / 20,000 km Official Warranty');
  const [description, setDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    addBrand({
      name: name.trim(),
      slug: slugify(name),
      country: country.trim(),
      specialty: specialty.trim(),
      warranty_policy: warranty.trim(),
      description: description.trim(),
    });
    setName('');
    setDescription('');
  };

  return (
    <AdminShell
      title="Automotive Parts Manufacturers & Brands"
      subtitle="Configure OEM and aftermarket parts brands, warranties, and supplier specialties."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {brands.map((b) => {
            const count = parts.filter((p) => p.brand_slug === b.slug).length;
            return (
              <div
                key={b.id}
                className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-[#141413]">
                    {b.name}
                  </h3>
                  <span className="text-xs font-mono tabular-nums text-[#6E6E68]">
                    {count} parts in catalog
                  </span>
                </div>
                <p className="text-xs text-[#52524E]">{b.description}</p>
                <p className="text-[11px] text-[#6E6E68]">
                  {b.country} · {b.specialty} · {b.warranty_policy}
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
            Add Manufacturer Brand
          </h2>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Brand Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brembo / Denso"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Country of Origin
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Component Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Warranty Policy
            </label>
            <input
              type="text"
              value={warranty}
              onChange={(e) => setWarranty(e.target.value)}
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
            Save Brand
          </button>
        </form>
      </div>
    </AdminShell>
  );
}
