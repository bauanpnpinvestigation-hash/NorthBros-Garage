'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { MediaUploadInput } from '@/components/shared/MediaUploadInput';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { AppSetting } from '@/types/database';

type KnownField = {
  key: string;
  label: string;
  category: string;
  description: string;
  type?: 'text' | 'textarea' | 'number';
};

const KNOWN_FIELDS: KnownField[] = [
  { key:'branding.site_name', label:'Business / Store Name', category:'Branding', description:'The primary business name used throughout the storefront.' },
  { key:'branding.tagline', label:'Business Tagline', category:'Branding', description:'Short identity line shown in the storefront.' },
  { key:'branding.logo_url', label:'Logo URL', category:'Branding', description:'Primary logo media URL.', type:'text' },
  { key:'contact.address', label:'Business Address', category:'Contact', description:'Primary business or branch address.' },
  { key:'contact.phone', label:'Business Phone', category:'Contact', description:'Primary contact phone.' },
  { key:'contact.email', label:'Business Email', category:'Contact', description:'Primary contact email.' },
  { key:'contact.facebook', label:'Facebook URL', category:'Contact', description:'Public Facebook page URL.' },
  { key:'business.hours', label:'Business Hours', category:'Business', description:'Human-readable operating hours.' },
  { key:'business.timezone', label:'Business Timezone', category:'Business', description:'Timezone used when displaying business schedules.' },
  { key:'store.shipping_fee', label:'Default Shipping Fee', category:'Store', description:'Default storefront shipping fee before free-shipping threshold.', type:'number' },
  { key:'store.free_shipping_threshold', label:'Free Shipping Threshold', category:'Store', description:'Order subtotal that qualifies for free shipping.', type:'number' },
  { key:'homepage.eyebrow', label:'Homepage Eyebrow', category:'Homepage', description:'Small introductory line above the homepage title.' },
  { key:'homepage.title', label:'Homepage Title', category:'Homepage', description:'Primary homepage headline.' },
  { key:'homepage.description', label:'Homepage Description', category:'Homepage', description:'Homepage supporting description.' },
  { key:'homepage.hero_image', label:'Homepage Hero Image URL', category:'Homepage', description:'Primary hero background image URL.' },
  { key:'footer.about', label:'Footer About Text', category:'Footer', description:'Footer business description.' },
  { key:'footer.payments_label', label:'Footer Payment Label', category:'Footer', description:'Payment summary text displayed in the footer.' },
  { key:'footer.copyright', label:'Footer Copyright', category:'Footer', description:'Custom copyright line. Leave blank to generate it automatically.' },
];

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try { return JSON.stringify(value); } catch { return String(value); }
}

function parseValue(value: string, type?: KnownField['type']): unknown {
  if (type === 'number') return Number(value) || 0;
  return value;
}

const defaultMainMenu = [
  { href:'/parts', label:'Car Parts' },
  { href:'/services', label:'Services' },
  { href:'/categories', label:'Categories' },
  { href:'/brands', label:'Brands' },
  { href:'/vlogs', label:'Daily Vlog' },
];

export default function AdminSettingsPage() {
  const { settings, loading, refreshSettings, createSetting, updateSetting, deleteSetting } = useAppSettings();
  const [values, setValues] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState<string|null>(null);
  const [error, setError] = useState('');
  const [advancedCategory, setAdvancedCategory] = useState('general');
  const [advancedKey, setAdvancedKey] = useState('');
  const [advancedValue, setAdvancedValue] = useState('');
  const [advancedPublic, setAdvancedPublic] = useState(true);
  const [editingAdvancedId, setEditingAdvancedId] = useState<string|null>(null);

  useEffect(() => {
    const next: Record<string,string> = {};
    for (const field of KNOWN_FIELDS) {
      const item = settings.find((x) => x.setting_key === field.key);
      next[field.key] = item ? displayValue(item.setting_value) : '';
    }
    setValues(next);
  }, [settings]);

  const grouped = useMemo(() => settings.reduce<Record<string,AppSetting[]>>((acc,item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {}), [settings]);

  const initializeDefaults = async () => {
    const c = (await import('@/lib/supabase/client')).createClient();
    if (!c) { setError('Supabase is not configured.'); return; }
    setError('');
    const defaults: Record<string, unknown> = {
      'branding.site_name':'NorthBros Garage',
      'branding.tagline':'Professional automotive parts and workshop services.',
      'branding.logo_url':'',
      'contact.address':'Business address not configured',
      'contact.phone':'',
      'contact.email':'',
      'contact.facebook':'',
      'business.hours':'Business hours not configured',
      'business.timezone':'Asia/Manila',
      'store.shipping_fee':250,
      'store.free_shipping_threshold':5000,
      'homepage.eyebrow':'Automotive Parts & Services',
      'homepage.title':'Parts, service, and workshop care in one place.',
      'homepage.description':'Browse the catalog, choose a service, and manage your vehicle needs from one storefront.',
      'homepage.hero_image':'/images/hero_parts_workshop.jpg',
      'footer.about':'A configurable automotive storefront for parts, services, and workshop operations.',
      'footer.payments_label':'Configured payment methods',
      'footer.copyright':'',
      'navigation.main_menu':defaultMainMenu,
    };
    const rows = Object.entries(defaults).map(([setting_key,setting_value]) => ({
      category: setting_key.split('.')[0],
      setting_key,
      setting_value,
      is_public: true,
      description: KNOWN_FIELDS.find((field) => field.key === setting_key)?.description || 'Default storefront configuration',
    }));
    const { error: upsertError } = await c.from('app_settings').upsert(rows, { onConflict:'setting_key' });
    if (upsertError) { setError(upsertError.message); return; }
    await refreshSettings(false);
  };

  const saveKnown = async (field: KnownField) => {
    setError(''); setSaving(field.key);
    try {
      const value = parseValue(values[field.key] || '', field.type);
      const existing = settings.find((x) => x.setting_key === field.key);
      if (existing) {
        await updateSetting(existing.id, { category: field.category.toLowerCase(), setting_value:value, is_public:true, description:field.description });
      } else {
        await createSetting({ category:field.category.toLowerCase(), setting_key:field.key, setting_value:value, is_public:true, description:field.description });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save setting.');
    } finally {
      setSaving(null);
    }
  };

  const saveAdvanced = async (e:React.FormEvent) => {
    e.preventDefault(); setError('');
    const key = advancedKey.trim(); if (!key) { setError('Setting key is required.'); return; }
    let parsed: unknown = advancedValue;
    try { if (advancedValue.trim()) parsed = JSON.parse(advancedValue); } catch { /* plain text is allowed */ }
    try {
      if (editingAdvancedId) await updateSetting(editingAdvancedId, { category:advancedCategory.trim()||'general', setting_value:parsed, is_public:advancedPublic });
      else await createSetting({ category:advancedCategory.trim()||'general', setting_key:key, setting_value:parsed, is_public:advancedPublic, description:null });
      setAdvancedKey(''); setAdvancedValue(''); setEditingAdvancedId(null); setAdvancedPublic(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save setting.'); }
  };

  const editAdvanced = (item:AppSetting) => {
    setEditingAdvancedId(item.id); setAdvancedCategory(item.category); setAdvancedKey(item.setting_key); setAdvancedValue(displayValue(item.setting_value)); setAdvancedPublic(item.is_public);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  return <AdminShell title="Global Business Configuration" subtitle="Configure business identity, storefront behavior, navigation, homepage copy, contact details, and footer content without changing application code.">
    <div className="space-y-6">
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div><h2 className="font-display text-lg font-bold">Quick Business Setup</h2><p className="text-xs text-[#6E6E68]">The fields below are the main settings a new business owner should configure first.</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void initializeDefaults()} className="px-3 py-2 text-xs font-semibold border border-[#E5E5E0] rounded-lg">Initialize Defaults</button>
            <button type="button" onClick={() => void refreshSettings(false)} className="px-3 py-2 text-xs font-semibold border border-[#E5E5E0] rounded-lg">Refresh</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {KNOWN_FIELDS.filter(f => f.key !== 'branding.logo_url').map(field => (
            <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <div className="flex items-center justify-between mb-1"><label className="text-xs font-semibold">{field.label}</label><button type="button" disabled={saving===field.key} onClick={() => void saveKnown(field)} className="text-[11px] font-semibold text-[#141413] hover:underline">{saving===field.key?'Saving…':'Save'}</button></div>
              {field.key.includes('description') || field.key==='footer.about' || field.key==='branding.tagline' ? <textarea rows={3} value={values[field.key]||''} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"/> : <input type={field.type==='number'?'number':'text'} value={values[field.key]||''} onChange={e=>setValues(v=>({...v,[field.key]:e.target.value}))} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"/>}
              <p className="mt-1 text-[10px] text-[#6E6E68]">{field.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 max-w-xl"><MediaUploadInput label="Business Logo" value={values['branding.logo_url']||''} onChange={(url)=>setValues(v=>({...v,'branding.logo_url':url}))} cloudinaryFolder="branding" helperText="Upload the business logo to Cloudinary, then save the branding.logo_url setting with the button below."/><div className="flex justify-end mt-2"><button type="button" disabled={saving==='branding.logo_url'} onClick={()=>void saveKnown(KNOWN_FIELDS.find(f=>f.key==='branding.logo_url')!)} className="px-4 py-2 bg-[#141413] text-white rounded-lg text-xs font-semibold">{saving==='branding.logo_url'?'Saving…':'Save Logo'}</button></div></div>
      </section>

      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6">
        <h2 className="font-display text-lg font-bold mb-2">Main Navigation</h2>
        <p className="text-xs text-[#6E6E68] mb-4">Use Advanced Settings to replace navigation.main_menu with a JSON array such as [{'"'}{"'"}href{"'"'}:{'"'}/parts{"'"'},{"'"'}label{"'"'}:{'"'"}Car Parts{"'"'}{"}"}].</p>
        <button type="button" onClick={()=>{setAdvancedCategory('navigation');setAdvancedKey('navigation.main_menu');setAdvancedValue(JSON.stringify(defaultMainMenu,null,2));setAdvancedPublic(true);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}} className="px-4 py-2 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg text-xs font-semibold">Load Default Menu into Advanced Editor</button>
      </section>

      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5"><div><h2 className="font-display text-lg font-bold">Advanced Settings</h2><p className="text-xs text-[#6E6E68]">Add reusable settings for future modules without modifying schema or code.</p></div></div>
        <form onSubmit={saveAdvanced} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <input value={advancedCategory} onChange={e=>setAdvancedCategory(e.target.value)} placeholder="Category" className="px-3 py-2 text-sm border rounded-lg bg-[#FAF9F6]"/>
          <input value={advancedKey} onChange={e=>setAdvancedKey(e.target.value)} placeholder="setting.key" disabled={Boolean(editingAdvancedId)} className="px-3 py-2 text-sm border rounded-lg bg-[#FAF9F6] font-mono"/>
          <textarea value={advancedValue} onChange={e=>setAdvancedValue(e.target.value)} rows={2} placeholder='Value or JSON' className="px-3 py-2 text-sm border rounded-lg bg-[#FAF9F6] font-mono"/>
          <div className="space-y-2"><label className="flex gap-2 text-xs font-semibold"><input type="checkbox" checked={advancedPublic} onChange={e=>setAdvancedPublic(e.target.checked)}/> Public</label><div className="flex gap-2"><button className="flex-1 py-2 bg-[#141413] text-white rounded-lg text-xs font-semibold">{editingAdvancedId?'Save':'Create'}</button>{editingAdvancedId&&<button type="button" onClick={()=>{setEditingAdvancedId(null);setAdvancedKey('');setAdvancedValue('')}} className="px-3 text-xs font-semibold">Cancel</button>}</div></div>
        </form>
        {error&&<p className="text-xs text-red-700 mb-4">{error}</p>}
        {loading?<p className="text-sm text-[#6E6E68]">Loading settings…</p>:settings.length===0?<p className="text-sm text-[#6E6E68]">No settings yet. Use Quick Business Setup above.</p>:<div className="space-y-5">{Object.entries(grouped).map(([group,items])=><div key={group}><h3 className="text-xs font-bold uppercase tracking-wide text-[#6E6E68] mb-2">{group}</h3><div className="divide-y border border-[#E5E5E0] rounded-lg overflow-hidden">{items.map(item=><div key={item.id} className="p-4 flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-mono font-semibold break-all">{item.setting_key}</p><pre className="mt-1 text-[11px] whitespace-pre-wrap break-words text-[#52524E] bg-[#FAF9F6] rounded p-2">{displayValue(item.setting_value)}</pre><p className="text-[10px] text-[#6E6E68]">{item.is_public?'Public':'Private'}</p></div><div className="flex gap-3 text-xs shrink-0"><button onClick={()=>editAdvanced(item)} className="font-semibold hover:underline">Edit</button><button onClick={async()=>{if(window.confirm('Delete this setting permanently?')){try{await deleteSetting(item.id)}catch(err){setError(err instanceof Error?err.message:'Unable to delete setting.')}}}} className="font-semibold text-red-700">Delete</button></div></div>)}</div></div>)}</div>}
      </section>
    </div>
  </AdminShell>;
}
