'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/format';

type Make = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
};
type Model = {
  id: string;
  make_id: string;
  name: string;
  slug: string;
  is_active: boolean;
};
type Variant = {
  id: string;
  model_id: string;
  name: string | null;
  year_from: number | null;
  year_to: number | null;
  engine: string | null;
  engine_code: string | null;
  transmission: string | null;
  fuel_type: string | null;
  body_type: string | null;
  drive_type: string | null;
  is_active: boolean;
};

export default function AdminVehiclesPage() {
  const c = createClient();
  const { confirmAction } = useStore();
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [makeId, setMakeId] = useState('');
  const [modelId, setModelId] = useState('');
  const [makeName, setMakeName] = useState('');
  const [modelName, setModelName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [engine, setEngine] = useState('');
  const [editingMakeId, setEditingMakeId] = useState<string | null>(null);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    if (!c) return;
    const [a, b, d] = await Promise.all([
      c.from('vehicle_makes').select('*').order('name'),
      c.from('vehicle_models').select('*').order('name'),
      c.from('vehicle_variants').select('*').order('name'),
    ]);
    if (a.error || b.error || d.error)
      setError(
        a.error?.message ||
          b.error?.message ||
          d.error?.message ||
          'Unable to load vehicles'
      );
    else {
      setMakes((a.data || []) as Make[]);
      setModels((b.data || []) as Model[]);
      setVariants((d.data || []) as Variant[]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveMake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c || !makeName.trim()) return;
    const payload = {
      name: makeName.trim(),
      slug: slugify(makeName),
      is_active: true,
    };
    const r = editingMakeId
      ? await c.from('vehicle_makes').update(payload).eq('id', editingMakeId)
      : await c.from('vehicle_makes').insert(payload);
    if (r.error) setError(r.error.message);
    else {
      setMakeName('');
      setEditingMakeId(null);
      await load();
    }
  };

  const saveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c || !makeId || !modelName.trim()) return;
    const payload = {
      make_id: makeId,
      name: modelName.trim(),
      slug: slugify(modelName),
      is_active: true,
    };
    const r = editingModelId
      ? await c.from('vehicle_models').update(payload).eq('id', editingModelId)
      : await c.from('vehicle_models').insert(payload);
    if (r.error) setError(r.error.message);
    else {
      setModelName('');
      setEditingModelId(null);
      await load();
    }
  };

  const saveVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c || !modelId) return;
    const payload = {
      model_id: modelId,
      name: variantName.trim() || null,
      year_from: yearFrom ? Number(yearFrom) : null,
      year_to: yearTo ? Number(yearTo) : null,
      engine: engine.trim() || null,
      is_active: true,
    };
    const r = editingVariantId
      ? await c
          .from('vehicle_variants')
          .update(payload)
          .eq('id', editingVariantId)
      : await c.from('vehicle_variants').insert(payload);
    if (r.error) setError(r.error.message);
    else {
      setVariantName('');
      setYearFrom('');
      setYearTo('');
      setEngine('');
      setEditingVariantId(null);
      await load();
    }
  };

  const deleteVariantCascade = async (id: string) => {
    if (!c) return;
    await c
      .from('product_vehicle_compatibility')
      .delete()
      .eq('vehicle_variant_id', id);
    await c
      .from('customer_vehicles')
      .delete()
      .eq('vehicle_variant_id', id);
    const r = await c.from('vehicle_variants').delete().eq('id', id);
    if (r.error) throw r.error;
  };

  const deleteModelCascade = async (id: string) => {
    if (!c) return;
    const childVariants = variants.filter((v) => v.model_id === id);
    for (const v of childVariants) {
      await deleteVariantCascade(v.id);
    }
    const r = await c.from('vehicle_models').delete().eq('id', id);
    if (r.error) throw r.error;
  };

  const handleDeleteMake = async (m: Make) => {
    if (!c) return;
    const ok = await confirmAction({
      title: 'Delete Vehicle Make Permanently',
      message: `Are you sure you want to permanently delete "${m.name}" and all of its nested models, variants, and compatibility data?`,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    try {
      const childModels = models.filter((mod) => mod.make_id === m.id);
      for (const mod of childModels) {
        await deleteModelCascade(mod.id);
      }
      const r = await c.from('vehicle_makes').delete().eq('id', m.id);
      if (r.error) throw r.error;
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete make.');
    }
  };

  const handleDeleteModel = async (m: Model) => {
    if (!c) return;
    const ok = await confirmAction({
      title: 'Delete Vehicle Model Permanently',
      message: `Are you sure you want to permanently delete "${m.name}" and all of its nested variants and compatibility data?`,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    try {
      await deleteModelCascade(m.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete model.');
    }
  };

  const handleDeleteVariant = async (v: Variant) => {
    if (!c) return;
    const ok = await confirmAction({
      title: 'Delete Vehicle Variant Permanently',
      message: `Are you sure you want to permanently delete "${
        v.name || 'Base variant'
      }" and its compatibility records?`,
      confirmLabel: 'Delete Permanently',
    });
    if (!ok) return;
    try {
      await deleteVariantCascade(v.id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to delete variant.'
      );
    }
  };

  return (
    <AdminShell
      title="Vehicle Fitment Database"
      subtitle="Manage make → model → variant data used for customer vehicles and part compatibility."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <form
          onSubmit={saveMake}
          className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {editingMakeId ? 'Edit Make' : 'Vehicle Makes'}
            </h2>
            {editingMakeId && (
              <button
                type="button"
                onClick={() => {
                  setEditingMakeId(null);
                  setMakeName('');
                }}
                className="text-xs font-semibold hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
          <input
            value={makeName}
            onChange={(e) => setMakeName(e.target.value)}
            placeholder="e.g. Toyota"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          />
          <button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">
            {editingMakeId ? 'Save Make' : 'Add Make'}
          </button>
          <div className="space-y-2 max-h-80 overflow-auto">
            {makes.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center text-xs border-t border-[#E5E5E0] pt-2"
              >
                <span>{m.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMakeId(m.id);
                      setMakeName(m.name);
                    }}
                    className="font-semibold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteMake(m)}
                    className="font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={saveModel}
          className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {editingModelId ? 'Edit Model' : 'Vehicle Models'}
            </h2>
            {editingModelId && (
              <button
                type="button"
                onClick={() => {
                  setEditingModelId(null);
                  setModelName('');
                }}
                className="text-xs font-semibold hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
          <select
            required
            value={makeId}
            onChange={(e) => setMakeId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          >
            <option value="">Choose make</option>
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Model name"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          />
          <button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">
            {editingModelId ? 'Save Model' : 'Add Model'}
          </button>
          <div className="space-y-2 max-h-80 overflow-auto">
            {models.map((m) => (
              <div
                key={m.id}
                className="text-xs border-t border-[#E5E5E0] pt-2 flex justify-between items-center"
              >
                <span>
                  {makes.find((x) => x.id === m.make_id)?.name} {m.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModelId(m.id);
                      setMakeId(m.make_id);
                      setModelName(m.name);
                    }}
                    className="font-semibold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteModel(m)}
                    className="font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>

        <form
          onSubmit={saveVariant}
          className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold">
              {editingVariantId ? 'Edit Variant' : 'Vehicle Variants'}
            </h2>
            {editingVariantId && (
              <button
                type="button"
                onClick={() => {
                  setEditingVariantId(null);
                  setVariantName('');
                  setYearFrom('');
                  setYearTo('');
                  setEngine('');
                }}
                className="text-xs font-semibold hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
          <select
            required
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          >
            <option value="">Choose model</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {makes.find((x) => x.id === m.make_id)?.name} · {m.name}
              </option>
            ))}
          </select>
          <input
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="Variant / trim (optional)"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              placeholder="Year from"
              type="number"
              className="px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
            />
            <input
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              placeholder="Year to"
              type="number"
              className="px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
            />
          </div>
          <input
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            placeholder="Engine / engine code"
            className="w-full px-3 py-2 text-sm border border-[#E5E5E0] rounded-lg bg-[#FAF9F6]"
          />
          <button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">
            {editingVariantId ? 'Save Variant' : 'Add Variant'}
          </button>
          <div className="space-y-2 max-h-80 overflow-auto">
            {variants.map((v) => (
              <div
                key={v.id}
                className="text-xs border-t border-[#E5E5E0] pt-2 flex justify-between items-center"
              >
                <span>
                  {models.find((x) => x.id === v.model_id)?.name} ·{' '}
                  {v.name || 'Base variant'} · {v.year_from || ''}
                  {v.year_to ? '-' + v.year_to : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVariantId(v.id);
                      setModelId(v.model_id);
                      setVariantName(v.name || '');
                      setYearFrom(v.year_from ? String(v.year_from) : '');
                      setYearTo(v.year_to ? String(v.year_to) : '');
                      setEngine(v.engine || '');
                    }}
                    className="font-semibold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteVariant(v)}
                    className="font-semibold text-red-700 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </form>
      </div>
      {error && <p className="mt-5 text-xs text-red-700">{error}</p>}
    </AdminShell>
  );
}
