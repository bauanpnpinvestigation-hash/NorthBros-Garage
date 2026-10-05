'use client';

import React, { useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatPHP, slugify } from '@/lib/utils/format';
import { ServiceAvailability } from '@/types/database';

export default function AdminServicesPage() {
  const { services, addService } = useStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('1850');
  const [duration, setDuration] = useState('60');
  const [durationLabel, setDurationLabel] = useState('60 mins (Express Bay)');
  const [category, setCategory] = useState<'Periodic Maintenance' | 'Brakes & Chassis' | 'Electrical & Battery' | 'Diagnostics & A/C' | 'Tires & Alignment'>('Periodic Maintenance');
  const [description, setDescription] = useState('');
  const [operations, setOperations] = useState('Comprehensive inspection\nFluid replacement\nDiagnostic scan');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    addService({
      name: name.trim(),
      slug: slugify(name),
      service_code: `SRV-${Math.floor(100 + Math.random() * 900)}`,
      category,
      price: Number(price) || 1500,
      duration_minutes: Number(duration) || 60,
      duration_label: durationLabel.trim() || '60 mins',
      availability: 'Available' as ServiceAvailability,
      description: description.trim(),
      included_operations: operations.split('\n').map((s) => s.trim()).filter(Boolean),
      recommended_interval: 'Every 10,000 km or 6 months',
      image_url: '/images/hero_showroom_gt.jpg',
    });
    setName('');
    setDescription('');
  };

  return (
    <AdminShell
      title="Automotive Workshop Services"
      subtitle="Configure preventive maintenance packages, brake services, diagnostic bays, and pricing."
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-bold text-[#141413]">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-[#6E6E68]">
                    {srv.category} · {srv.duration_label}
                  </p>
                </div>
                <span className="font-mono font-bold text-[#141413] text-sm tabular-nums">
                  {formatPHP(srv.price)}
                </span>
              </div>
              <p className="text-xs text-[#52524E]">{srv.description}</p>
              <div className="text-[11px] text-[#6E6E68] bg-[#FAF9F6] p-2.5 rounded-lg">
                <strong>Included:</strong> {srv.included_operations.join(' · ')}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold text-[#141413]">
            Add Workshop Service
          </h2>
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Service Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Complete Brake Disc & Caliper Overhaul"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1">
                Labor & Package Price (₱)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              <option value="Periodic Maintenance">Periodic Maintenance</option>
              <option value="Brakes & Chassis">Brakes & Chassis</option>
              <option value="Electrical & Battery">Electrical & Battery</option>
              <option value="Diagnostics & A/C">Diagnostics & A/C</option>
              <option value="Tires & Alignment">Tires & Alignment</option>
            </select>
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

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Included Operations (One per line)
            </label>
            <textarea
              rows={3}
              value={operations}
              onChange={(e) => setOperations(e.target.value)}
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
      </div>
    </AdminShell>
  );
}
