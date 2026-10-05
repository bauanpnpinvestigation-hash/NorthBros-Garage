'use client';

import React, { useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { AppSetting } from '@/types/database';

function formatEditorValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value ?? '');
  }
}

function parseEditorValue(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

export default function AdminSettingsPage() {
  const {
    settings,
    loading,
    refreshSettings,
    createSetting,
    updateSetting,
    deleteSetting,
  } = useAppSettings();

  const [category, setCategory] = useState('branding');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const grouped = useMemo(() => {
    return settings.reduce<Record<string, AppSetting[]>>((acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    }, {});
  }, [settings]);

  const resetForm = () => {
    setEditingId(null);
    setCategory('branding');
    setKey('');
    setValue('');
    setDescription('');
    setIsPublic(true);
    setError('');
  };

  const startEdit = (item: AppSetting) => {
    setEditingId(item.id);
    setCategory(item.category);
    setKey(item.setting_key);
    setValue(formatEditorValue(item.setting_value));
    setDescription(item.description || '');
    setIsPublic(item.is_public);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const cleanKey = key.trim();
    if (!cleanKey) {
      setError('Setting key is required.');
      return;
    }

    const payload = {
      category: category.trim() || 'general',
      setting_key: cleanKey,
      setting_value: parseEditorValue(value),
      is_public: isPublic,
      description: description.trim() || null,
    };

    try {
      if (editingId) {
        await updateSetting(editingId, payload);
      } else {
        await createSetting(payload);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this setting.');
    }
  };

  const handleDelete = async (item: AppSetting) => {
    if (!window.confirm(`Delete setting "${item.setting_key}" permanently?`)) return;
    setError('');
    try {
      await deleteSetting(item.id);
      if (editingId === item.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete this setting.');
    }
  };

  return (
    <AdminShell
      title="Global Application Settings"
      subtitle="Configure the business identity, branding, content, contact information, theme, and footer without changing code."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold">
                {editingId ? 'Edit Setting' : 'Add Setting'}
              </h2>
              <p className="text-[11px] text-[#6E6E68]">
                Values may be plain text or valid JSON.
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-[#52524E] hover:text-[#141413]"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="branding"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Setting Key</label>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="branding.site_name"
              disabled={Boolean(editingId)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Value</label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={7}
              placeholder={'"NorthBros Garage"'}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What this setting controls"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public storefront setting
          </label>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800"
          >
            {editingId ? 'Save Changes' : 'Create Setting'}
          </button>
        </form>

        <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-bold">Configured Settings</h2>
              <p className="text-[11px] text-[#6E6E68]">
                {settings.length} setting{settings.length === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshSettings(true)}
              className="px-3 py-1.5 text-xs font-semibold border border-[#E5E5E0] rounded-lg hover:bg-[#FAF9F6]"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#6E6E68] py-10 text-center">
              Loading settings…
            </p>
          ) : settings.length === 0 ? (
            <p className="text-sm text-[#6E6E68] py-10 text-center">
              No settings configured yet.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#6E6E68]">
                    {group}
                  </h3>
                  <div className="divide-y divide-[#E5E5E0] border border-[#E5E5E0] rounded-lg overflow-hidden">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-mono font-semibold break-all">
                            {item.setting_key}
                          </p>
                          <pre className="text-[11px] whitespace-pre-wrap break-words text-[#52524E] bg-[#FAF9F6] rounded p-2">
                            {formatEditorValue(item.setting_value)}
                          </pre>
                          {item.description && (
                            <p className="text-[11px] text-[#6E6E68]">{item.description}</p>
                          )}
                          <p className="text-[10px] text-[#6E6E68]">
                            {item.is_public ? 'Public' : 'Private'}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-xs font-semibold hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            className="text-xs font-semibold text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
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
