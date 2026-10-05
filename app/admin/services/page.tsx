'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaUploadInput } from '@/components/shared/MediaUploadInput';
import { formatPHP, slugify } from '@/lib/utils/format';
import { AutomotiveService } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

export default function AdminServicesPage() {
  const { services, addService, updateService, deleteService } = useStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<AutomotiveService['category']>('');
  const [serviceCategories, setServiceCategories] = useState<Array<{id:string;name:string;slug:string;is_active:boolean}>>([]);
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const c = createClient();
    if (!c) return;
    void c.from('service_categories').select('id,name,slug,is_active').order('sort_order').order('name').then(({ data, error }) => {
      if (error) setError(error.message);
      const active = (data || []).filter((x: any) => x.is_active);
      setServiceCategories(active);
      if (!category && active[0]) setCategory(active[0].name);
    });
  }, []);

  const reset = () => {
    setName('');
    setSlug('');
    setCategory(serviceCategories[0]?.name || '');
    setPrice('');
    setDurationMinutes('');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
    setError('');
  };

  const startEdit = (service: (typeof services)[number]) => {
    setEditingId(service.id);
    setName(service.name);
    setSlug(service.slug);
    setCategory(service.category);
    setPrice(String(service.price));
    setDurationMinutes(service.duration_minutes ? String(service.duration_minutes) : '');
    setDescription(service.description || '');
    setImageUrl(service.image_url || '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Service name is required.');
      return;
    }

    const payload = {
      slug: slug.trim() || slugify(cleanName),
      service_code: slugify(cleanName).toUpperCase(),
      name: cleanName,
      category,
      price: Number(price) || 0,
      duration_minutes: Number(durationMinutes) || 0,
      duration_label: durationMinutes.trim() ? String(Number(durationMinutes)) + ' mins' : 'By inspection',
      availability: 'Available' as const,
      description: description.trim(),
      included_operations: [],
      recommended_interval: '',
      image_url: imageUrl.trim(),
      is_bookable: true,
      requires_inspection: false,
    };

    try {
      if (editingId) {
        await updateService(editingId, payload);
      } else {
        await addService(payload);
      }
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save service.');
    }
  };

  const handleDelete = async (service: (typeof services)[number]) => {
    if (!window.confirm(`Remove "${service.name}" from the active services?`)) return;
    setError('');
    try {
      await deleteService(service.id);
      if (editingId === service.id) reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove service.');
    }
  };

  return (
    <AdminShell
      title="Automotive Services Management"
      subtitle="Create, edit, and deactivate workshop services without hardcoded business data."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">
                {editingId ? 'Edit Service' : 'Add Service'}
              </h2>
            </div>
            {editingId && (
              <button type="button" onClick={reset} className="text-xs font-semibold hover:underline">
                Cancel
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Service Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Synthetic PMS"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={name ? slugify(name) : 'full-synthetic-pms'}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              <option value="">Choose service category</option>
              {serviceCategories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Price (PHP)</label>
              <input
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Duration (mins)</label>
              <input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <MediaUploadInput
            label="Service Image"
            value={imageUrl}
            onChange={setImageUrl}
            cloudinaryFolder="services"
            helperText="Uploads are stored under NorthBros Garage/services."
          />

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
          >
            {editingId ? 'Save Service Changes' : 'Create Service'}
          </button>
        </form>

        <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6">
          <h2 className="font-display text-base font-bold mb-5">
            Active Workshop Services ({services.length})
          </h2>

          {services.length === 0 ? (
            <p className="text-sm text-[#6E6E68] text-center py-10">No active services yet.</p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="border border-[#E5E5E0] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{service.name}</p>
                    <p className="text-[11px] text-[#6E6E68] font-mono">{service.slug}</p>
                    <p className="text-xs text-[#52524E]">
                      {service.category} · {service.duration_label}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono font-bold text-sm">{formatPHP(service.price)}</span>
                    <button type="button" onClick={() => startEdit(service)} className="text-xs font-semibold hover:underline">
                      Edit
                    </button>
                    <button type="button" onClick={() => void handleDelete(service)} className="text-xs font-semibold text-red-700 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
