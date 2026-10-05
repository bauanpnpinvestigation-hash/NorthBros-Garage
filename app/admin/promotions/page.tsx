'use client';

import React,{useEffect,useState} from 'react';
import {AdminShell} from '@/components/admin/AdminShell';
import {createClient} from '@/lib/supabase/client';
import {useStore} from '@/components/shared/StoreProvider';

type Promo={id:string;name:string;description:string|null;code:string|null;discount_type:string;discount_value:number;minimum_order_amount:number|null;maximum_discount:number|null;starts_at:string|null;ends_at:string|null;usage_limit:number|null;usage_count:number;is_active:boolean};
const blank={name:'',description:'',code:'',discount_type:'fixed',discount_value:'0',minimum_order_amount:'',maximum_discount:'',starts_at:'',ends_at:'',usage_limit:'',is_active:true};
export default function AdminPromotionsPage(){const c=createClient();const {parts,confirmAction}=useStore();const [rows,setRows]=useState<Promo[]>([]);const [f,setF]=useState(blank);const [editing,setEditing]=useState<string|null>(null);const [error,setError]=useState('');const [selectedProducts,setSelectedProducts]=useState<string[]>([]);const [productLinks,setProductLinks]=useState<Record<string,string[]>>({});
 const load=async()=>{
   if(!c)return;
   const [a,b]=await Promise.all([
     c.from('promotions').select('*').order('created_at',{ascending:false}),
     c.from('promotion_products').select('promotion_id,product_id')
   ]);
   if(a.error||b.error)setError(a.error?.message||b.error?.message||'Unable to load promotions');
   else {
     setRows((a.data||[]) as Promo[]);
     const links:Record<string,string[]>={};
     for(const link of (b.data||[]) as Array<{promotion_id:string;product_id:string}>) (links[link.promotion_id] ||= []).push(link.product_id);
     setProductLinks(links);
   }
 };useEffect(()=>{void load()},[]);
 const save=async(e:React.FormEvent)=>{
   e.preventDefault();if(!c)return;setError('');
   const p={name:f.name.trim(),description:f.description.trim()||null,code:f.code.trim()||null,discount_type:f.discount_type,discount_value:Number(f.discount_value)||0,minimum_order_amount:f.minimum_order_amount?Number(f.minimum_order_amount):null,maximum_discount:f.maximum_discount?Number(f.maximum_discount):null,starts_at:f.starts_at?new Date(f.starts_at).toISOString():null,ends_at:f.ends_at?new Date(f.ends_at).toISOString():null,usage_limit:f.usage_limit?Number(f.usage_limit):null,is_active:f.is_active};
   const result=editing?await c.from('promotions').update(p).eq('id',editing).select('id').single():await c.from('promotions').insert(p).select('id').single();
   if(result.error){setError(result.error.message);return;}
   const promoId=result.data.id;
   const del=await c.from('promotion_products').delete().eq('promotion_id',promoId);
   if(del.error){setError(del.error.message);return;}
   if(selectedProducts.length){
     const linkResult=await c.from('promotion_products').insert(selectedProducts.map(product_id=>({promotion_id:promoId,product_id})));
     if(linkResult.error){setError(linkResult.error.message);return;}
   }
   setF(blank);setEditing(null);setSelectedProducts([]);await load();
 };
 return <AdminShell title="Promotions & Discounts" subtitle="Manage discount campaigns using the existing promotions table."><div className="grid grid-cols-1 xl:grid-cols-12 gap-6"><form onSubmit={save} className="xl:col-span-5 bg-white border rounded-xl p-6 space-y-3"><input required placeholder="Promotion name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input placeholder="Code" value={f.code} onChange={e=>setF({...f,code:e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6] font-mono"/><textarea placeholder="Description" value={f.description} onChange={e=>setF({...f,description:e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><select value={f.discount_type} onChange={e=>setF({...f,discount_type:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option></select><input type="number" min="0" value={f.discount_value} onChange={e=>setF({...f,discount_value:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><div className="grid grid-cols-2 gap-2"><input type="number" min="0" placeholder="Min order" value={f.minimum_order_amount} onChange={e=>setF({...f,minimum_order_amount:e.target.value})} className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input type="number" min="0" placeholder="Max discount" value={f.maximum_discount} onChange={e=>setF({...f,maximum_discount:e.target.value})} className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/></div><div className="grid grid-cols-2 gap-2"><input type="datetime-local" value={f.starts_at} onChange={e=>setF({...f,starts_at:e.target.value})} className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><input type="datetime-local" value={f.ends_at} onChange={e=>setF({...f,ends_at:e.target.value})} className="px-3 py-2 border rounded-lg bg-[#FAF9F6]"/></div><div>
 <label className="block text-xs font-semibold mb-1">Eligible Products</label>
 <p className="text-[10px] text-[#6E6E68] mb-2">Leave empty to apply to the whole order. Select products to restrict the promotion to those products.</p>
 <div className="max-h-40 overflow-auto border border-[#E5E5E0] rounded-lg divide-y">
 {parts.length===0?<p className="p-3 text-xs text-[#6E6E68]">No products in the active catalog.</p>:parts.map(part=><label key={part.id} className="flex items-center gap-2 p-2 text-xs cursor-pointer"><input type="checkbox" checked={selectedProducts.includes(part.id)} onChange={(e)=>setSelectedProducts(current=>e.target.checked?[...current,part.id]:current.filter(id=>id!==part.id))}/><span className="truncate">{part.name} <span className="font-mono text-[10px] text-[#6E6E68]">({part.sku})</span></span></label>)}
 </div>
 </div><input type="number" min="0" placeholder="Usage limit (optional)" value={f.usage_limit} onChange={e=>setF({...f,usage_limit:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-[#FAF9F6]"/><label className="flex gap-2 text-xs font-semibold"><input type="checkbox" checked={f.is_active} onChange={e=>setF({...f,is_active:e.target.checked})}/> Active</label>{error&&<p className="text-xs text-red-700">{error}</p>} <div className="flex gap-3"><button className="flex-1 py-2.5 bg-[#141413] text-white rounded-lg text-xs font-semibold">{editing?'Save Changes':'Create Promotion'}</button>{editing&&<button type="button" onClick={()=>{setEditing(null);setF(blank);setSelectedProducts([])}} className="px-4 text-xs font-semibold">Cancel</button>}</div></form><section className="xl:col-span-7 bg-white border rounded-xl p-6 space-y-3"><h2 className="font-display font-bold">Promotions ({rows.length})</h2>{rows.map(p=><div key={p.id} className="border rounded-lg p-4 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{p.name} {p.code&&<span className="font-mono text-[10px]">{p.code}</span>}</p><p className="text-xs text-[#6E6E68]">{p.discount_type} · {p.discount_value} · used {p.usage_count}</p></div><div className="flex gap-3 text-xs"><button onClick={()=>{setEditing(p.id);setSelectedProducts(productLinks[p.id] || []);setF({name:p.name,description:p.description||'',code:p.code||'',discount_type:p.discount_type,discount_value:String(p.discount_value),minimum_order_amount:p.minimum_order_amount==null?'':String(p.minimum_order_amount),maximum_discount:p.maximum_discount==null?'':String(p.maximum_discount),starts_at:p.starts_at?new Date(p.starts_at).toISOString().slice(0,16):'',ends_at:p.ends_at?new Date(p.ends_at).toISOString().slice(0,16):'',usage_limit:p.usage_limit==null?'':String(p.usage_limit),is_active:p.is_active});window.scrollTo({top:0,behavior:'smooth'})}} className="font-semibold hover:underline">Edit</button><button onClick={async()=>{if(!c)return;const ok=await confirmAction({title:'Delete Promotion Permanently',message:`Are you sure you want to permanently delete "${p.name}" and its product links?`,confirmLabel:'Delete Permanently'});if(!ok)return;await c.from('promotion_products').delete().eq('promotion_id',p.id);const r=await c.from('promotions').delete().eq('id',p.id);if(r.error)setError(r.error.message);else await load()}} className="font-semibold text-red-700 hover:underline">Delete</button></div></div>)}</section></div></AdminShell>
}
