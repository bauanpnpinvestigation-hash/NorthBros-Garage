'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';

type PM = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  sort_order: number;
  public_config: Record<string, unknown>;
};

type PS = {
  id: string;
  currency: string;
  minimum_order_amount: number;
  maximum_order_amount: number | null;
  cod_enabled: boolean;
  cod_minimum_amount: number;
  cod_maximum_amount: number | null;
  online_payment_enabled: boolean;
  payment_expiration_minutes: number;
  allow_partial_payment: boolean;
};

export default function AdminPaymentsPage() {
  const c = createClient();
  const [methods, setMethods] = useState<PM[]>([]);
  const [settings, setSettings] = useState<PS | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    is_enabled: true,
    sort_order: '0',
    public_config: '{}',
  });
  const [error, setError] = useState('');

  const load = async () => {
    if (!c) return;
    const [a, b] = await Promise.all([
      c.from('payment_methods').select('*').order('sort_order').order('name'),
      c.from('payment_settings').select('*').order('created_at').limit(1).maybeSingle(),
    ]);
    if (a.error || b.error) {
      setError(a.error?.message || b.error?.message || 'Unable to load payment settings');
      return;
    }
    setMethods((a.data || []) as PM[]);
    setSettings((b.data || null) as PS | null);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!c) return;
    setError('');

    const code = form.code.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{1,63}$/.test(code)) {
      setError('Payment code must be 2–64 characters using letters, numbers, dots, underscores, or hyphens.');
      return;
    }

    let cfg: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(form.public_config || '{}');
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Configuration must be a JSON object.');
      }
      cfg = parsed as Record<string, unknown>;
    } catch {
      setError('public_config must be a valid JSON object.');
      return;
    }

    const payload = {
      code,
      name: form.name.trim() || code,
      description: form.description.trim() || null,
      is_enabled: form.is_enabled,
      sort_order: Number(form.sort_order) || 0,
      public_config: cfg,
    };

    const r = await c.from('payment_methods').upsert(payload, { onConflict: 'code' });
    if (r.error) {
      setError(r.error.message);
      return;
    }

    setForm({
      code: '',
      name: '',
      description: '',
      is_enabled: true,
      sort_order: '0',
      public_config: '{}',
    });
    await load();
  };

  const saveSettings = async () => {
    if (!c || !settings) return;
    setError('');

    const r = await c
      .from('payment_settings')
      .update({
        currency: settings.currency.trim().toUpperCase(),
        minimum_order_amount: Math.max(0, Number(settings.minimum_order_amount) || 0),
        maximum_order_amount:
          settings.maximum_order_amount == null
            ? null
            : Math.max(0, Number(settings.maximum_order_amount) || 0),
        cod_enabled: settings.cod_enabled,
        cod_minimum_amount: Math.max(0, Number(settings.cod_minimum_amount) || 0),
        cod_maximum_amount:
          settings.cod_maximum_amount == null
            ? null
            : Math.max(0, Number(settings.cod_maximum_amount) || 0),
        online_payment_enabled: settings.online_payment_enabled,
        payment_expiration_minutes: Math.max(
          1,
          Number(settings.payment_expiration_minutes) || 30
        ),
        allow_partial_payment: settings.allow_partial_payment,
      })
      .eq('id', settings.id);

    if (r.error) {
      setError(r.error.message);
      return;
    }

    const currencyCode = settings.currency.trim().toUpperCase();
    const existing = await c
      .from('app_settings')
      .select('id')
      .eq('setting_key', 'store.currency')
      .maybeSingle();

    const mirror = existing.data
      ? await c
          .from('app_settings')
          .update({
            category: 'store',
            setting_value: currencyCode,
            is_public: true,
            description: 'Three-letter ISO currency code used for storefront prices.',
          })
          .eq('id', existing.data.id)
      : await c.from('app_settings').insert({
          category: 'store',
          setting_key: 'store.currency',
          setting_value: currencyCode,
          is_public: true,
          description: 'Three-letter ISO currency code used for storefront prices.',
        });

    if (mirror.error) {
      setError(mirror.error.message);
      return;
    }

    await load();
  };

  return (
    <AdminShell
      title="Payments & Checkout Rules"
      subtitle="Manage any payment method supported by this business and the server-side checkout rules enforced by Supabase."
    >
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <form
          onSubmit={saveMethod}
          className="xl:col-span-2 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4"
        >
          <h2 className="font-display font-bold">Payment Method</h2>

          <input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Unique code, e.g. online_wallet"
            maxLength={64}
            className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6] font-mono"
          />

          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Display name"
            className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
          />

          <input
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            type="number"
            className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
          />

          <textarea
            value={form.public_config}
            onChange={(e) => setForm({ ...form, public_config: e.target.value })}
            rows={5}
            placeholder='{"instructions":"...","settlement_mode":"online"}'
            className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6] font-mono text-xs"
          />

          <p className="text-[11px] text-[#6E6E68]">
            Payment codes are data-driven. Do not use a provider name as a required code.
            Optional public_config values can describe provider-specific behavior or instructions.
          </p>

          <label className="flex gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={form.is_enabled}
              onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
            />
            Enabled
          </label>

          {error && <p className="text-xs text-red-700">{error}</p>}

          <button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">
            Save Payment Method
          </button>
        </form>

        <section className="xl:col-span-3 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
          <h2 className="font-display font-bold">Configured Methods</h2>

          <div className="space-y-2">
            {methods.map((m) => (
              <div
                key={m.id}
                className="border border-[#E5E5E0] rounded-lg p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-[#6E6E68] font-mono">
                    {m.code} · {m.is_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!c) return;
                    const r = await c
                      .from('payment_methods')
                      .update({ is_enabled: !m.is_enabled })
                      .eq('id', m.id);
                    if (r.error) setError(r.error.message);
                    else await load();
                  }}
                  className="font-semibold text-red-700"
                >
                  {m.is_enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>

          {settings && (
            <div className="border-t pt-5 space-y-3">
              <h3 className="font-display font-bold">Checkout Rules</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">
                  Currency
                  <input
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
                  />
                </label>

                <label className="text-xs">
                  Payment expiry (minutes)
                  <input
                    type="number"
                    min={1}
                    value={settings.payment_expiration_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment_expiration_minutes: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
                  />
                </label>

                <label className="text-xs">
                  Minimum order
                  <input
                    type="number"
                    min={0}
                    value={settings.minimum_order_amount}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minimum_order_amount: Number(e.target.value),
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
                  />
                </label>

                <label className="text-xs">
                  Maximum order
                  <input
                    type="number"
                    min={0}
                    value={settings.maximum_order_amount ?? ''}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        maximum_order_amount: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"
                  />
                </label>

                <label className="flex gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.cod_enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, cod_enabled: e.target.checked })
                    }
                  />
                  COD enabled
                </label>

                <label className="flex gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={settings.online_payment_enabled}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        online_payment_enabled: e.target.checked,
                      })
                    }
                  />
                  Online payments enabled
                </label>
              </div>

              <button
                onClick={() => void saveSettings()}
                className="px-4 py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold"
              >
                Save Checkout Rules
              </button>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
