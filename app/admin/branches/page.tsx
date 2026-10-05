'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';

type Branch = {
  id:string; name:string; code:string; address:string|null; city:string|null; province:string|null;
  postal_code:string|null; phone:string|null; email:string|null; opening_time:string|null; closing_time:string|null; is_active:boolean;
};

const empty={name:'',code:'',address:'',city:'',province:'',postal_code:'',phone:'',email:'',opening_time:'09:00',closing_time:'18:00',is_active:true};

export default function AdminBranchesPage(){
  const [rows,setRows]=useState<Branch[]>([]); const [form,setForm]=useState(empty); const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const client=createClient();
  const { confirmAction } = useStore();

  const load=async()=>{ if(!client)return; setLoading(true); const {data,error}=await client.from('branches').select('*').order('name'); if(error)setError(error.message); else setRows((data||[]) as Branch[]); setLoading(false); };
  useEffect(()=>{void load()},[]);

  const save=async(e:React.FormEvent)=>{e.preventDefault();if(!client)return;setSaving(true);setError('');
    const payload={name:form.name.trim(),code:form.code.trim().toUpperCase(),address:form.address.trim()||null,city:form.city.trim()||null,province:form.province.trim()||null,postal_code:form.postal_code.trim()||null,phone:form.phone.trim()||null,email:form.email.trim()||null,opening_time:form.opening_time||null,closing_time:form.closing_time||null,is_active:form.is_active};
    const r=editing?await client.from('branches').update(payload).eq('id',editing):await client.from('branches').insert(payload);
    if(r.error)setError(r.error.message);else{setForm(empty);setEditing(null);await load();}setSaving(false);
  };
  const edit=(b:Branch)=>{setEditing(b.id);setForm({name:b.name,code:b.code,address:b.address||'',city:b.city||'',province:b.province||'',postal_code:b.postal_code||'',phone:b.phone||'',email:b.email||'',opening_time:(b.opening_time||'').slice(0,5),closing_time:(b.closing_time||'').slice(0,5),is_active:b.is_active});window.scrollTo({top:0,behavior:'smooth'})};
  const handleDelete=async(b:Branch)=>{if(!client)return;const ok=await confirmAction({title:'Delete Branch Permanently',message:`Are you sure you want to permanently delete "${b.name}" and its related records?`,confirmLabel:'Delete Permanently'});if(!ok)return;await client.from('inventory').delete().eq('branch_id',b.id);await client.from('service_slots').delete().eq('branch_id',b.id);await client.from('staff_profiles').update({branch_id:null}).eq('branch_id',b.id);await client.from('appointments').update({branch_id:null}).eq('branch_id',b.id);const r=await client.from('branches').delete().eq('id',b.id);if(r.error)setError(r.error.message);else await load()};

  return <AdminShell title="Branches & Locations" subtitle="Manage locations, contact details, hours, and active status for multi-branch businesses.">
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <form onSubmit={save} className="xl:col-span-5 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-base font-bold">{editing?'Edit Branch':'Add Branch'}</h2><p className="text-[11px] text-[#6E6E68]">All values are database-driven.</p></div>{editing&&<button type="button" onClick={()=>{setEditing(null);setForm(empty)}} className="text-xs font-semibold">Cancel</button>}</div>
        {(['name','code','address','city','province','postal_code','phone','email'] as const).map(k=><div key={k}><label className="block text-xs font-semibold mb-1">{k.replaceAll('_',' ')}</label><input required={k==='name'||k==='code'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"/></div>)}
        <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-semibold mb-1">Opening</label><input type="time" value={form.opening_time} onChange={e=>setForm({...form,opening_time:e.target.value})} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"/></div><div><label className="block text-xs font-semibold mb-1">Closing</label><input type="time" value={form.closing_time} onChange={e=>setForm({...form,closing_time:e.target.value})} className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"/></div></div>
        <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> Active branch</label>
        {error&&<p className="text-xs text-red-700">{error}</p>}<button disabled={saving} className="w-full py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg">{saving?'Saving…':editing?'Save Changes':'Create Branch'}</button>
      </form>
      <section className="xl:col-span-7 bg-white border border-[#E5E5E0] rounded-xl p-6"><h2 className="font-display text-base font-bold mb-5">Branches ({rows.length})</h2>{loading?<p className="text-sm text-[#6E6E68]">Loading…</p>:<div className="space-y-3">{rows.map(b=><div key={b.id} className="border border-[#E5E5E0] rounded-lg p-4 flex items-center justify-between gap-4"><div><p className="font-semibold text-sm">{b.name} <span className="font-mono text-[10px] text-[#6E6E68]">{b.code}</span></p><p className="text-xs text-[#52524E]">{[b.address,b.city,b.province].filter(Boolean).join(', ')||'No address'} · {b.opening_time?.slice(0,5)||'—'}–{b.closing_time?.slice(0,5)||'—'}</p><p className="text-[11px] text-[#6E6E68]">{b.is_active?'Active':'Inactive'}</p></div><div className="flex gap-3 text-xs"><button onClick={()=>edit(b)} className="font-semibold hover:underline">Edit</button><button onClick={()=>void handleDelete(b)} className="font-semibold text-red-700 hover:underline">Delete</button></div></div>)}</div>}</section>
    </div>
  </AdminShell>;
}
