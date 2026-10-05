'use client';

import React,{useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {useStore} from '@/components/shared/StoreProvider';
import {createClient} from '@/lib/supabase/client';

type Variant={id:string;name:string|null;year_from:number|null;year_to:number|null;engine:string|null;transmission:string|null;vehicle_models:{name:string;vehicle_makes:{name:string}}|null};

export default function AccountVehiclesPage(){
 const {user,customerVehicles,addCustomerVehicle,updateCustomerVehicle,deleteCustomerVehicle,isHydrated,refreshAuth,confirmAction}=useStore();
 const [variants,setVariants]=useState<Variant[]>([]);
 const [variantId,setVariantId]=useState('');
 const [nickname,setNickname]=useState('');
 const [plate,setPlate]=useState('');
 const [vin,setVin]=useState('');
 const [mileage,setMileage]=useState('');
 const [notes,setNotes]=useState('');
 const [editingId,setEditingId]=useState<string|null>(null);
 const [error,setError]=useState('');
 const [saving,setSaving]=useState(false);

 useEffect(()=>{if(isHydrated&&!user)void refreshAuth()},[isHydrated,user,refreshAuth]);

 useEffect(()=>{
   const c=createClient(); if(!c) return;
   void c.from('vehicle_variants').select('id,name,year_from,year_to,engine,transmission,vehicle_models(name,vehicle_makes(name))').eq('is_active',true).order('created_at',{ascending:false}).then(({data,error}:any)=>{
     if(error)setError(error.message); else setVariants((data||[]) as unknown as Variant[]);
   });
 },[]);

 const variantLabel=(v:Variant)=>[v.vehicle_models?.vehicle_makes?.name,v.vehicle_models?.name,v.name,v.year_from&&v.year_to?String(v.year_from)+'-'+String(v.year_to):v.year_from||v.year_to,v.engine].filter(Boolean).join(' · ');
 const reset=()=>{setVariantId('');setNickname('');setPlate('');setVin('');setMileage('');setNotes('');setEditingId(null);setError('')};
 const edit=(v:(typeof customerVehicles)[number])=>{setEditingId(v.id);setVariantId(v.vehicle_variant_id);setNickname(v.nickname||'');setPlate(v.plate_number||'');setVin(v.vin||'');setMileage(v.current_mileage==null?'':String(v.current_mileage));setNotes(v.notes||'');window.scrollTo({top:0,behavior:'smooth'})};
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!user)return;setError('');setSaving(true);try{
   if(!editingId && !variantId){setError('Choose your vehicle variant.');return;}
   const currentMileage=mileage.trim()?Number(mileage):undefined;
   if(currentMileage!==undefined && (!Number.isFinite(currentMileage)||currentMileage<0)){setError('Mileage must be a valid non-negative number.');return;}
   if(editingId) await updateCustomerVehicle(editingId,{nickname,plate_number:plate,vin,current_mileage:currentMileage??null,notes});
   else await addCustomerVehicle({vehicle_variant_id:variantId,nickname,plate_number:plate,vin,current_mileage:currentMileage,notes});
   reset();
 }catch(err){setError(err instanceof Error?err.message:'Unable to save vehicle.')}finally{setSaving(false)}};
 if(!isHydrated||(!user&&!isHydrated))return <div className="max-w-xl mx-auto px-4 py-20 text-center text-sm text-[#6E6E68]">Loading vehicles…</div>;
 if(!user)return <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4"><h1 className="font-display text-2xl font-bold">Please sign in</h1><Link href="/auth/login" className="inline-block px-5 py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">Sign In</Link></div>;

 return <div className="max-w-[1100px] mx-auto px-4 sm:px-8 py-12 space-y-8">
   <div className="flex items-end justify-between gap-4 border-b border-[#E5E5E0] pb-5"><div><p className="text-xs text-[#6E6E68]">Customer Garage</p><h1 className="font-display text-3xl font-bold">My Vehicles</h1><p className="text-sm text-[#6E6E68] mt-1">Save vehicles once so service bookings and part fitment can use real vehicle records.</p></div><Link href="/account" className="text-xs font-semibold hover:underline">Back to Account</Link></div>
   <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
     <form onSubmit={save} className="lg:col-span-2 bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-4 h-fit">
       <h2 className="font-display text-lg font-bold">{editingId?'Edit Vehicle':'Add Vehicle'}</h2>
       {!editingId&&<div><label className="block text-xs font-semibold mb-1">Vehicle Variant</label><select required value={variantId} onChange={e=>setVariantId(e.target.value)} className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"><option value="">Choose vehicle</option>{variants.map(v=><option key={v.id} value={v.id}>{variantLabel(v)}</option>)}</select></div>}
       <input value={nickname} onChange={e=>setNickname(e.target.value)} placeholder="Nickname (optional)" className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"/>
       <input value={plate} onChange={e=>setPlate(e.target.value)} placeholder="Plate number (optional)" className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"/>
       <input value={vin} onChange={e=>setVin(e.target.value)} placeholder="VIN (optional)" className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm font-mono"/>
       <input type="number" min="0" value={mileage} onChange={e=>setMileage(e.target.value)} placeholder="Current mileage (optional)" className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm font-mono"/>
       <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Vehicle notes (optional)" className="w-full px-3 py-2 border border-[#E5E5E0] rounded-lg bg-[#FAF9F6] text-sm"/>
       {error&&<p className="text-xs text-red-700">{error}</p>}
       <div className="flex gap-3"><button disabled={saving} className="flex-1 py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">{saving?'Saving…':editingId?'Save Changes':'Add Vehicle'}</button>{editingId&&<button type="button" onClick={reset} className="px-4 py-2.5 text-xs font-semibold border border-[#E5E5E0] rounded-lg">Cancel</button>}</div>
     </form>
     <section className="lg:col-span-3 space-y-3">
       {customerVehicles.length===0?<div className="bg-white border border-[#E5E5E0] rounded-xl p-8 text-center text-sm text-[#6E6E68]">No vehicles saved yet.</div>:customerVehicles.map(v=><article key={v.id} className="bg-white border border-[#E5E5E0] rounded-xl p-5 space-y-3">
         <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-lg font-bold">{v.nickname||[v.make_name,v.model_name,v.variant_name].filter(Boolean).join(' ')}</h3><p className="text-xs text-[#6E6E68]">{[v.make_name,v.model_name,v.variant_name].filter(Boolean).join(' · ')}</p></div><div className="flex gap-3 text-xs"><button onClick={()=>edit(v)} className="font-semibold hover:underline">Edit</button><button onClick={async()=>{const ok=await confirmAction({title:'Delete Vehicle',message:'Remove this vehicle from your garage permanently?',confirmLabel:'Delete Vehicle'});if(ok){try{await deleteCustomerVehicle(v.id)}catch(err){setError(err instanceof Error?err.message:'Unable to remove vehicle')}}}} className="font-semibold text-red-700 hover:underline">Delete</button></div></div>
         <div className="grid grid-cols-2 gap-3 text-xs"><div><span className="text-[#6E6E68]">Plate</span><p className="font-mono">{v.plate_number||'—'}</p></div><div><span className="text-[#6E6E68]">Mileage</span><p className="font-mono">{v.current_mileage==null?'—':v.current_mileage.toLocaleString()}</p></div><div><span className="text-[#6E6E68]">Engine</span><p>{v.engine||'—'}</p></div><div><span className="text-[#6E6E68]">Years</span><p>{v.year_from&&v.year_to?String(v.year_from)+'–'+String(v.year_to):v.year_from||v.year_to||'—'}</p></div></div>
         {v.notes&&<p className="text-xs text-[#52524E] bg-[#FAF9F6] rounded-lg p-3">{v.notes}</p>}
       </article>)}
     </section>
   </div>
 </div>;
}
