'use client';

import React, { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/format';

type Make={id:string;name:string;slug:string;logo_url:string|null;is_active:boolean};
type Model={id:string;make_id:string;name:string;slug:string;is_active:boolean};
type Variant={id:string;model_id:string;name:string|null;year_from:number|null;year_to:number|null;engine:string|null;engine_code:string|null;transmission:string|null;fuel_type:string|null;body_type:string|null;drive_type:string|null;is_active:boolean};

export default function AdminVehiclesPage(){
  const c=createClient();
  const [makes,setMakes]=useState<Make[]>([]),[models,setModels]=useState<Model[]>([]),[variants,setVariants]=useState<Variant[]>([]);
  const [makeId,setMakeId]=useState(''),[modelId,setModelId]=useState('');
  const [makeName,setMakeName]=useState(''),[modelName,setModelName]=useState(''),[variantName,setVariantName]=useState('');
  const [yearFrom,setYearFrom]=useState(''),[yearTo,setYearTo]=useState(''),[engine,setEngine]=useState('');
  const [engineCode,setEngineCode]=useState(''),[transmission,setTransmission]=useState(''),[fuelType,setFuelType]=useState('');
  const [bodyType,setBodyType]=useState(''),[driveType,setDriveType]=useState('');
  const [editMake,setEditMake]=useState<string|null>(null),[editModel,setEditModel]=useState<string|null>(null),[editVariant,setEditVariant]=useState<string|null>(null);
  const [error,setError]=useState('');

  const load=async()=>{if(!c)return;const [a,b,d]=await Promise.all([
    c.from('vehicle_makes').select('*').order('name'),
    c.from('vehicle_models').select('*').order('name'),
    c.from('vehicle_variants').select('*').order('name')
  ]);const e=a.error||b.error||d.error;if(e){setError(e.message);return}setMakes((a.data||[]) as Make[]);setModels((b.data||[]) as Model[]);setVariants((d.data||[]) as Variant[])};
  useEffect(()=>{void load()},[]);

  const saveMake=async(e:React.FormEvent)=>{e.preventDefault();if(!c||!makeName.trim())return;const p={name:makeName.trim(),slug:slugify(makeName),is_active:true};const r=editMake?await c.from('vehicle_makes').update(p).eq('id',editMake):await c.from('vehicle_makes').insert(p);if(r.error)setError(r.error.message);else{setEditMake(null);setMakeName('');await load()}};
  const saveModel=async(e:React.FormEvent)=>{e.preventDefault();if(!c||!makeId||!modelName.trim())return;const p={make_id:makeId,name:modelName.trim(),slug:slugify(modelName),is_active:true};const r=editModel?await c.from('vehicle_models').update(p).eq('id',editModel):await c.from('vehicle_models').insert(p);if(r.error)setError(r.error.message);else{setEditModel(null);setMakeId('');setModelName('');await load()}};
  const saveVariant=async(e:React.FormEvent)=>{e.preventDefault();if(!c||!modelId)return;const p={model_id:modelId,name:variantName.trim()||null,year_from:yearFrom?Number(yearFrom):null,year_to:yearTo?Number(yearTo):null,engine:engine.trim()||null,engine_code:engineCode.trim()||null,transmission:transmission.trim()||null,fuel_type:fuelType.trim()||null,body_type:bodyType.trim()||null,drive_type:driveType.trim()||null,is_active:true};const r=editVariant?await c.from('vehicle_variants').update(p).eq('id',editVariant):await c.from('vehicle_variants').insert(p);if(r.error)setError(r.error.message);else{setEditVariant(null);setModelId('');setVariantName('');setYearFrom('');setYearTo('');setEngine('');setEngineCode('');setTransmission('');setFuelType('');setBodyType('');setDriveType('');await load()}};
  const toggle=async(table:'vehicle_makes'|'vehicle_models'|'vehicle_variants',id:string,active:boolean)=>{if(!c)return;const r=await c.from(table).update({is_active:!active}).eq('id',id);if(r.error)setError(r.error.message);else await load()};

  return <AdminShell title="Vehicle Fitment Database" subtitle="Manage manufacturer, model, and variant data used for garages and product compatibility.">
    <div className="space-y-5">{error&&<p className="text-xs text-red-700">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold">{editMake?'Edit Make':'Add Make'}</h2>
          <form onSubmit={saveMake} className="space-y-3"><input required value={makeName} onChange={e=>setMakeName(e.target.value)} placeholder="Manufacturer name" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">{editMake?'Save Make':'Add Make'}</button>{editMake&&<button type="button" onClick={()=>{setEditMake(null);setMakeName('')}} className="w-full py-2 text-xs font-semibold border rounded-lg">Cancel</button>}</form>
          <div className="space-y-2 max-h-80 overflow-auto">{makes.map(m=><div key={m.id} className="flex justify-between text-xs border-t pt-2 gap-2"><span>{m.name}</span><div className="flex gap-2"><button type="button" onClick={()=>{setEditMake(m.id);setMakeName(m.name)}} className="font-semibold">Edit</button><button type="button" onClick={()=>void toggle('vehicle_makes',m.id,m.is_active)} className="text-red-700">{m.is_active?'Disable':'Enable'}</button></div></div>)}</div>
        </section>

        <section className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold">{editModel?'Edit Model':'Add Model'}</h2>
          <form onSubmit={saveModel} className="space-y-3"><select required value={makeId} onChange={e=>setMakeId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"><option value="">Choose manufacturer</option>{makes.filter(m=>m.is_active).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select><input required value={modelName} onChange={e=>setModelName(e.target.value)} placeholder="Model name" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">{editModel?'Save Model':'Add Model'}</button>{editModel&&<button type="button" onClick={()=>{setEditModel(null);setMakeId('');setModelName('')}} className="w-full py-2 text-xs font-semibold border rounded-lg">Cancel</button>}</form>
          <div className="space-y-2 max-h-80 overflow-auto">{models.map(m=><div key={m.id} className="flex justify-between text-xs border-t pt-2 gap-2"><span>{makes.find(x=>x.id===m.make_id)?.name||'Unknown'} · {m.name}</span><div className="flex gap-2"><button type="button" onClick={()=>{setEditModel(m.id);setMakeId(m.make_id);setModelName(m.name)}} className="font-semibold">Edit</button><button type="button" onClick={()=>void toggle('vehicle_models',m.id,m.is_active)} className="text-red-700">{m.is_active?'Disable':'Enable'}</button></div></div>)}</div>
        </section>

        <section className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-display font-bold">{editVariant?'Edit Variant':'Add Variant'}</h2>
          <form onSubmit={saveVariant} className="space-y-3"><select required value={modelId} onChange={e=>setModelId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"><option value="">Choose model</option>{models.filter(m=>m.is_active).map(m=><option key={m.id} value={m.id}>{makes.find(x=>x.id===m.make_id)?.name||'Unknown'} · {m.name}</option>)}</select><input value={variantName} onChange={e=>setVariantName(e.target.value)} placeholder="Variant / trim" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><div className="grid grid-cols-2 gap-2"><input type="number" value={yearFrom} onChange={e=>setYearFrom(e.target.value)} placeholder="Year from" className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input type="number" value={yearTo} onChange={e=>setYearTo(e.target.value)} placeholder="Year to" className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/></div><input value={engine} onChange={e=>setEngine(e.target.value)} placeholder="Engine" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input value={engineCode} onChange={e=>setEngineCode(e.target.value)} placeholder="Engine code" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input value={transmission} onChange={e=>setTransmission(e.target.value)} placeholder="Transmission" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input value={fuelType} onChange={e=>setFuelType(e.target.value)} placeholder="Fuel type" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input value={bodyType} onChange={e=>setBodyType(e.target.value)} placeholder="Body type" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input value={driveType} onChange={e=>setDriveType(e.target.value)} placeholder="Drive type" className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><button className="w-full py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">{editVariant?'Save Variant':'Add Variant'}</button>{editVariant&&<button type="button" onClick={()=>{setEditVariant(null);setModelId('');setVariantName('');setYearFrom('');setYearTo('');setEngine('');setEngineCode('');setTransmission('');setFuelType('');setBodyType('');setDriveType('')}} className="w-full py-2 text-xs font-semibold border rounded-lg">Cancel</button>}</form>
          <div className="space-y-2 max-h-80 overflow-auto">{variants.map(v=><div key={v.id} className="flex justify-between text-xs border-t pt-2 gap-2"><span>{models.find(x=>x.id===v.model_id)?.name||'Unknown'} · {v.name||'Base variant'} · {[v.year_from,v.year_to].filter(Boolean).join('–')||'Years open'}{v.engine?' · '+v.engine:''}</span><div className="flex gap-2"><button type="button" onClick={()=>{setEditVariant(v.id);setModelId(v.model_id);setVariantName(v.name||'');setYearFrom(v.year_from==null?'':String(v.year_from));setYearTo(v.year_to==null?'':String(v.year_to));setEngine(v.engine||'');setEngineCode(v.engine_code||'');setTransmission(v.transmission||'');setFuelType(v.fuel_type||'');setBodyType(v.body_type||'');setDriveType(v.drive_type||'')}} className="font-semibold">Edit</button><button type="button" onClick={()=>void toggle('vehicle_variants',v.id,v.is_active)} className="text-red-700">{v.is_active?'Disable':'Enable'}</button></div></div>)}</div>
        </section>
      </div>
    </div>
  </AdminShell>;
}
