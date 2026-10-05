'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppSetting } from '@/types/database';
import { createClient } from '@/lib/supabase/client';

interface AppSettingsContextValue {
  settings: AppSetting[];
  loading: boolean;
  getValue: (key: string, fallback?: unknown) => unknown;
  getString: (key: string, fallback?: string) => string;
  getCurrency: () => string;
  refreshSettings: (includePrivate?: boolean) => Promise<void>;
  createSetting: (input: Omit<AppSetting, 'id' | 'created_at' | 'updated_at'>) => Promise<AppSetting>;
  updateSetting: (id: string, input: Partial<Omit<AppSetting, 'id' | 'created_at' | 'updated_at'>>) => Promise<AppSetting>;
  deleteSetting: (id: string) => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

function valueToString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

async function fetchSettings(includePrivate = false): Promise<AppSetting[]> {
  const client = createClient();
  if (!client) return [];

  let query = client
    .from('app_settings')
    .select('id,category,setting_key,setting_value,is_public,description,created_at,updated_at')
    .order('category')
    .order('setting_key');

  if (!includePrivate) query = query.eq('is_public', true);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as AppSetting[];
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async (includePrivate = false) => {
    try {
      setLoading(true);
      const next = await fetchSettings(includePrivate);
      setSettings(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings(false);

    const client = createClient();
    if (!client) return;

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event: any) => {
      if (event === 'SIGNED_OUT') {
        void refreshSettings(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshSettings]);

  const getValue = useCallback(
    (key: string, fallback?: unknown) => {
      const found = settings.find((item) => item.setting_key === key);
      return found ? found.setting_value : fallback;
    },
    [settings]
  );

  const getString = useCallback(
    (key: string, fallback = '') => valueToString(getValue(key, fallback), fallback),
    [getValue]
  );

  const getCurrency = useCallback(() => {
    const value = getString('store.currency', 'PHP').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(value) ? value : 'PHP';
  }, [getString]);

  const createSetting = useCallback(
    async (input: Omit<AppSetting, 'id' | 'created_at' | 'updated_at'>) => {
      const client = createClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client
        .from('app_settings')
        .insert(input)
        .select('id,category,setting_key,setting_value,is_public,description,created_at,updated_at')
        .single();
      if (error) throw error;
      await refreshSettings(false);
      return data as AppSetting;
    },
    [refreshSettings]
  );

  const updateSetting = useCallback(
    async (
      id: string,
      input: Partial<Omit<AppSetting, 'id' | 'created_at' | 'updated_at'>>
    ) => {
      const client = createClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client
        .from('app_settings')
        .update(input)
        .eq('id', id)
        .select('id,category,setting_key,setting_value,is_public,description,created_at,updated_at')
        .single();
      if (error) throw error;
      await refreshSettings(false);
      return data as AppSetting;
    },
    [refreshSettings]
  );

  const deleteSetting = useCallback(async (id: string) => {
    const client = createClient();
    if (!client) throw new Error('Supabase is not configured.');
    const { error } = await client.from('app_settings').delete().eq('id', id);
    if (error) throw error;
    setSettings((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      getValue,
      getString,
      getCurrency,
      refreshSettings,
      createSetting,
      updateSetting,
      deleteSetting,
    }),
    [
      settings,
      loading,
      getValue,
      getString,
      getCurrency,
      refreshSettings,
      createSetting,
      updateSetting,
      deleteSetting,
    ]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
