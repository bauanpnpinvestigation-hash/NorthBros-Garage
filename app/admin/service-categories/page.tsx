'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaUploadInput } from '@/components/shared/MediaUploadInput';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/format';

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const blank = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  sort_order: '0',
  is_active: true,
};

export default function AdminServiceCategoriesPage() {
  const c = createClient();
  const { confirmAction } = useStore();
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!c) return;
    setLoading(true);
    const r = await c
      .from('service_categories')
      .select('*')
      .order('sort_order')
      .order('name');
    if (r.error) setError(r.error.message);
    else setRows((r.data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c) return;
    setError('');
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const r = editing
      ? await c.from('service_categories').update(payload).eq('id', editing)
      : await c.from('service_categories').insert(payload);
    if (r.error) setError(r.error.message);
    else {
      setForm(blank);
      setEditing(null);
      await load();
    }
  };

  const handleDelete = async (row: Row) => {
    if (!c) return;
    const ok = await confirmAction({
      title: 'Delete Service Category Permanently',
      message: `Are you sure you want to permanently delete "${row.name}"?`,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    await c
      .from('services')
      .update({ category_id: null })
      .eq('category_id', row.id);
    const r = await c.from('service_categories').delete().eq('id', row.id);
    if (r.error) setError(r.error.message);
    else {
      if (editing === row.id) {
        setEditing(null);
        setForm(blank);
      }
      await load();
    }
  };

  return (
    <AdminShell
      title="Service Categories"
      subtitle="Define the service groups used by the booking catalog."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={save}
          className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <h2 className="font-display text-base font-bold">
            {editing ? 'Edit Category' : 'Add Category'}
          </h2>
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
          <input
            type="number"
            min="0"
            placeholder="Sort order"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
          <MediaUploadInput
            label="Category Image (Optional)"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            cloudinaryFolder="services"
          />
          <label className="flex gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />{' '}
            Active
          </label>
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
            >
              {editing ? 'Save Changes' : 'Create Category'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(blank);
                }}
                className="px-4 text-xs font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6">
          <h2 className="font-display text-base font-bold mb-5">
            Service Categories ({rows.length})
          </h2>
          {loading ? (
            <p className="text-sm text-[#6E6E68]">Loading…</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="border border-[#E5E5E0] rounded-lg p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold">{r.name}</p>
                    <p className="text-[11px] text-[#6E6E68] font-mono">
                      {r.slug} · {r.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(r.id);
                        setForm({
                          name: r.name,
                          slug: r.slug,
                          description: r.description || '',
                          image_url: r.image_url || '',
                          sort_order: String(r.sort_order),
                          is_active: r.is_active,
                        });
                      }}
                      className="font-semibold hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(r)}
                      className="font-semibold text-red-700 hover:underline"
                    >
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
