'use client';

import React, { useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP, slugify } from '@/lib/utils/format';
import { AutomotiveService } from '@/types/database';

export default function AdminServicesPage() {
  const { services, addService } = useStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AutomotiveService['category']>('Periodic Maintenance');
  const [price, setPrice] = useState('3500');
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addService({
      slug: slugify(name),
      service_code: slugify(name).toUpperCase(),
      name: name.trim(),
      category,
      price: Number(price) || 0,
      duration_minutes: Number(durationMinutes) || 60,
      duration_label: `${durationMinutes || 60} mins`,
      availability: 'Available',
      description: description.trim(),
      included_operations: [],
      recommended_interval: 'Every 10,000 km or 6 months',
      image_url: '/images/hero_parts_workshop.jpg',
    });
    setName('');
    setDescription('');
  };

  return (
    <AdminShell
      title="Automotive Services Management"
      subtitle="Manage workshop service packages, pricing, and estimated bay durations."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-[#141413]">
            Add New Service Package
          </h2>
          <div>
            <label className="block text-xs font-semibold mb-1">Service Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Synthetic PMS Package"
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AutomotiveService['category'])}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              <option value="Periodic Maintenance">Periodic Maintenance</option>
              <option value="Brakes & Chassis">Brakes & Chassis</option>
              <option value="Diagnostics & A/C">Diagnostics & A/C</option>
              <option value="Tires & Alignment">Tires & Alignment</option>
              <option value="Electrical & Battery">Electrical & Battery</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Price (PHP)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Duration (mins)</label>
              <input
                type="number"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Save Service
          </button>
        </form>

        <div className="lg:col-span-2 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#141413]">
            Active Workshop Services ({services.length})
          </h2>
          <div className="divide-y divide-[#E5E5E0]">
            {services.map((srv) => (
              <div
                key={srv.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#141413]">{srv.name}</p>
                  <p className="text-[#6E6E68]">
                    {srv.category} · {srv.duration_label}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#141413] tabular-nums">
                  {formatPHP(srv.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
