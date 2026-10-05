'use client';

import React, { useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaUploadInput } from '@/components/shared/MediaUploadInput';
import { slugify } from '@/lib/utils/format';

export default function AdminBrandsPage() {
  const { brands, parts, addBrand, updateBrand, deleteBrand, confirmAction } =
    useStore();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setEditingId(null);
    setError('');
  };

  const startEdit = (brand: (typeof brands)[number]) => {
    setEditingId(brand.id);
    setName(brand.name);
    setSlug(brand.slug);
    setDescription(brand.description || '');
    setImageUrl(brand.image_url || '');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Brand name is required.');
      return;
    }

    try {
      const payload = {
        name: cleanName,
        slug: slug.trim() || slugify(cleanName),
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
      };

      if (editingId) {
        await updateBrand(editingId, payload);
      } else {
        await addBrand(payload);
      }

      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save brand.');
    }
  };

  const handleDelete = async (brand: (typeof brands)[number]) => {
    const confirmed = await confirmAction({
      title: 'Delete Brand Permanently',
      message: `Are you sure you want to permanently delete "${brand.name}" and all of its nested catalog data? This action cannot be undone.`,
      confirmLabel: 'Delete Permanently',
    });
    if (!confirmed) return;
    setError('');
    try {
      await deleteBrand(brand.id);
      if (editingId === brand.id) reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete brand.');
    }
  };

  return (
    <AdminShell
      title="Automotive Parts Brands"
      subtitle="Add, edit, and remove manufacturers without hardcoding brands into the application."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">
                {editingId ? 'Edit Brand' : 'Add Brand'}
              </h2>
              <p className="text-[11px] text-[#6E6E68]">Only fields stored by the brands table are shown.</p>
            </div>
            {editingId && (
              <button type="button" onClick={reset} className="text-xs font-semibold hover:underline">
                Cancel
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Brand Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brembo"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={name ? slugify(name) : 'brembo'}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
            />
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
            label="Brand Logo"
            value={imageUrl}
            onChange={setImageUrl}
            cloudinaryFolder="brands"
            helperText="Uploads are stored under NorthBros Garage/brands."
          />

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
          >
            {editingId ? 'Save Brand Changes' : 'Create Brand'}
          </button>
        </form>

        <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6">
          <h2 className="font-display text-base font-bold mb-5">
            Active Brands ({brands.length})
          </h2>

          {brands.length === 0 ? (
            <p className="text-sm text-[#6E6E68] text-center py-10">No active brands yet.</p>
          ) : (
            <div className="space-y-3">
              {brands.map((brand) => {
                const count = parts.filter((part) => part.brand_slug === brand.slug).length;
                return (
                  <div
                    key={brand.id}
                    className="border border-[#E5E5E0] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{brand.name}</p>
                      <p className="text-[11px] text-[#6E6E68] font-mono">{brand.slug}</p>
                      {brand.description && (
                        <p className="text-xs text-[#52524E] mt-1">{brand.description}</p>
                      )}
                      <p className="text-[11px] text-[#6E6E68] mt-1">{count} parts in catalog</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button type="button" onClick={() => startEdit(brand)} className="text-xs font-semibold hover:underline">
                        Edit
                      </button>
                      <button type="button" onClick={() => void handleDelete(brand)} className="text-xs font-semibold text-red-700 hover:underline">
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
