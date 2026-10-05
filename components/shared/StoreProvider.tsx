'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  AutomotiveService, Brand, CartItem, Category, Order, OrderFulfillmentStatus,
  PartProduct, PaymentStatus, ProductStatus, ServiceBooking, ServiceBookingStatus,
  UserProfile, VlogPost,
} from '@/types/database';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastMessage { id: string; type: 'success' | 'error' | 'info'; text: string; }
interface StoreContextType {
  parts: PartProduct[]; brands: Brand[]; categories: Category[]; services: AutomotiveService[];
  serviceBookings: ServiceBooking[]; vlogs: VlogPost[]; favorites: string[]; cart: CartItem[];
  orders: Order[]; user: UserProfile | null; isHydrated: boolean;
  showToast: (text: string, type?: 'success'|'error'|'info') => void;
  toggleFavorite: (partId: string) => Promise<void>;
  addToCart: (part: PartProduct, quantity?: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>; clearCart: () => Promise<void>;
  createOrder: (payload: {
    recipient_name:string; phone:string; address_line:string; barangay?:string;
    city?:string; province?:string; postal_code?:string; payment_method_code:string;
    customer_notes?:string; items:Array<{product_id:string;quantity:number}>;
  }) => Promise<{id:string;order_number:string;subtotal:number;shipping_fee:number;total_amount:number}>;
  createServiceBooking: (payload: {
    service_id:string; branch_id?:string; customer_vehicle_id?:string;
    scheduled_start:string; scheduled_end?:string; notes?:string;
  }) => Promise<{id:string;appointment_number:string;service_name:string;service_price:number;scheduled_start:string;scheduled_end:string;status:string}>;
  login: (email:string,password:string) => Promise<boolean>;
  register: (name:string,email:string,phone:string,password:string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addPart: (part: Omit<PartProduct,'id'|'created_at'>) => Promise<PartProduct>;
  updatePart: (id:string,updates:Partial<PartProduct>) => Promise<void>;
  deletePart: (id:string) => Promise<void>;
  updatePartStatus: (id:string,status:ProductStatus) => Promise<void>;
  addService: (srv: Omit<AutomotiveService,'id'>) => Promise<AutomotiveService>;
  updateServiceBookingStatus: (id:string,status:ServiceBookingStatus) => Promise<void>;
  updateOrderStatus: (id:string,fulfillmentStatus:OrderFulfillmentStatus,paymentStatus?:PaymentStatus) => Promise<void>;
  addBrand: (brand:Omit<Brand,'id'>) => Promise<void>;
  addCategory: (cat:Omit<Category,'id'>) => Promise<void>;
  addVlog: (vlog:Omit<VlogPost,'id'|'views_count'|'likes_count'|'comments'>) => Promise<VlogPost>;
  likeVlog: (vlogId:string) => Promise<void>;
  addVlogComment: (vlogId:string,userName:string,text:string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const sb = () => createClient();

function publicStorageUrl(bucket:string,path:string|null|undefined) {
  if (!path) return '/images/hero_parts_workshop.jpg';
  if (/^https?:\\/\\//i.test(path) || path.startsWith('/')) return path;
  const client = sb();
  return client ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl : path;
}

function mapProduct(row:any): PartProduct {
  const images = Array.isArray(row.product_images) ? [...row.product_images].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)) : [];
  const primary = images.find((x:any)=>x.is_primary) || images[0];
  const inventories = Array.isArray(row.inventory) ? row.inventory : [];
  const stock = inventories.reduce((n:number,x:any)=>n + Math.max(0,(x.quantity??0)-(x.reserved_quantity??0)),0);
  const statusMap:any = {in_stock:'Active',low_stock:'Active',out_of_stock:'Out of Stock',pre_order:'Active',discontinued:'Archived'};
  const compatibility = Array.isArray(row.product_vehicle_compatibility) ? row.product_vehicle_compatibility.map((x:any)=> {
    const v=x.vehicle_variants, m=v?.vehicle_models, make=m?.vehicle_makes;
    return {make:make?.name||'',model:m?.name||v?.name||'',years:v?.year_from&&v?.year_to?String(v.year_from)+'-'+String(v.year_to):'',engine:v?.engine||v?.engine_code||''};
  }) : [];
  return {
    id:row.id, slug:row.slug, sku:row.sku||'', name:row.name, brand_id:row.brand_id||'',
    brand_name:row.brands?.name||'', brand_slug:row.brands?.slug||'', category_id:row.category_id||'',
    category_name:row.categories?.name||'', category_slug:row.categories?.slug||'', price:Number(row.price||0),
    compare_at_price:row.compare_at_price==null?undefined:Number(row.compare_at_price), stock,
    status:statusMap[row.stock_status]||'Active', rating:4.9, review_count:0, is_featured:!!row.is_featured,
    primary_image:publicStorageUrl('product-images',primary?.storage_path), gallery_images:images.map((x:any)=>publicStorageUrl('product-images',x.storage_path)),
    description:row.description||row.short_description||'', specifications:{}, compatibility, created_at:row.created_at,
  };
}

function mapService(row:any): AutomotiveService {
  return {
    id:row.id, slug:row.slug, service_code:row.slug, name:row.name,
    category:row.service_categories?.name || 'Periodic Maintenance',
    price:Number(row.price||0), duration_minutes:Number(row.duration_minutes||0),
    duration_label:row.duration_minutes ? row.duration_minutes+' mins' : 'By inspection',
    availability:row.is_active&&row.is_bookable?'Available':'Unavailable',
    description:row.description||row.short_description||'', included_operations:[],
    recommended_interval:'', image_url:publicStorageUrl('service-images',row.service_images?.find((x:any)=>x.is_primary)?.storage_path),
  };
}

function mapOrder(row:any): Order {
  const addr=row.addresses||{}; const profile=row.profiles||{};
  const items=Array.isArray(row.order_items)?row.order_items.map((i:any)=>({
    product_id:i.product_id||'', product_slug:i.products?.slug||'', sku:i.sku||'', name:i.product_name,
    brand_name:i.products?.brands?.name||'', unit_price:Number(i.unit_price||0), quantity:i.quantity,
    subtotal:Number(i.subtotal||0), image:publicStorageUrl('product-images',i.products?.product_images?.find((x:any)=>x.is_primary)?.storage_path),
  })):[];
  const payment=Array.isArray(row.payments)?row.payments[0]:row.payments;
  const pm:any={gcash:'GCash',maya:'Maya',gotyme:'GoTyme / QR Ph',cod:'Cash on Delivery (COD)',cash:'Cash',bank_transfer:'Bank Transfer',card:'Card'};
  const fs:any={pending:'Processing',confirmed:'Processing',processing:'Processing',ready_for_pickup:'Packed',shipped:'Shipped',delivered:'Delivered',cancelled:'Cancelled',refunded:'Cancelled'};
  const ps:any={pending:'Pending Verification',paid:'Paid',failed:'Pending Verification',refunded:'Pending Verification',partially_refunded:'Pending Verification'};
  return {
    id:row.id, order_number:row.order_number, user_id:row.customer_id, customer_name:addr.recipient_name||'',
    customer_email:'', customer_phone:addr.phone||'', shipping_address:addr.address_line||'', shipping_city:[addr.city,addr.province].filter(Boolean).join(', '),
    shipping_postal_code:addr.postal_code||'', payment_method:pm[payment?.method]||payment?.method||'',
    payment_status:ps[payment?.status]||'Pending Verification', fulfillment_status:fs[row.status]||'Processing',
    items, subtotal:Number(row.subtotal||0), shipping_fee:Number(row.shipping_fee||0), discount_amount:Number(row.discount_amount||0),
    total_amount:Number(row.total_amount||0), notes:row.customer_notes||undefined, created_at:row.created_at,
  };
}

async function loadProfile(id:string):Promise<UserProfile|null> {
  const c=sb(); if(!c) return null;
  const {data}=await c.from('profiles').select('*').eq('id',id).maybeSingle();
  if(!data) return null;
  return {id:data.id,name:data.full_name||'',email:data.email||'',phone:data.phone||'',address:'',city:'',postal_code:'',role:data.role==='admin'?'admin':'customer',created_at:data.created_at};
}

export function StoreProvider({children}:{children:React.ReactNode}) {
  const [parts,setParts]=useState<PartProduct[]>([]), [brands,setBrands]=useState<Brand[]>([]),
    [categories,setCategories]=useState<Category[]>([]), [services,setServices]=useState<AutomotiveService[]>([]),
    [serviceBookings,setServiceBookings]=useState<ServiceBooking[]>([]), [vlogs,setVlogs]=useState<VlogPost[]>([]),
    [favorites,setFavorites]=useState<string[]>([]), [cart,setCart]=useState<CartItem[]>([]),
    [orders,setOrders]=useState<Order[]>([]), [user,setUser]=useState<UserProfile|null>(null),
    [isHydrated,setIsHydrated]=useState(false), [toasts,setToasts]=useState<ToastMessage[]>([]);

  const showToast=(text:string,type:'success'|'error'|'info'='success')=>{
    const id=crypto.randomUUID(); setToasts(p=>[...p,{id,text,type}]);
    setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3800);
  };

  const loadCatalog=async()=>{
    const c=sb(); if(!c) return;
    const [p,b,cat,s]=await Promise.all([
      c.from('products').select('*,brands(name,slug),categories(name,slug),product_images(storage_path,alt_text,sort_order,is_primary),inventory(quantity,reserved_quantity),product_vehicle_compatibility(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))').eq('is_active',true),
      c.from('brands').select('*').eq('is_active',true).order('name'),
      c.from('categories').select('*').eq('is_active',true).order('sort_order').order('name'),
      c.from('services').select('*,service_categories(name,slug),service_images(storage_path,is_primary,sort_order)').eq('is_active',true).order('name'),
    ]);
    if(!p.error) setParts((p.data||[]).map(mapProduct));
    if(!b.error) setBrands((b.data||[]).map((x:any)=>({id:x.id,name:x.name,slug:x.slug,country:'',specialty:'',warranty_policy:'',description:x.description||''})));
    if(!cat.error) setCategories((cat.data||[]).map((x:any)=>({id:x.id,name:x.name,slug:x.slug,description:x.description||'',common_parts:''})));
    if(!s.error) setServices((s.data||[]).map(mapService));
  };

  const loadAdminData=async()=>{const c=sb();if(!c)return;const [ord,ap]=await Promise.all([c.from('orders').select('*,profiles(full_name,email,phone),addresses(*),order_items(*,products(slug,brands(name),product_images(storage_path,is_primary))),payments(*)').order('created_at',{ascending:false}),c.from('appointments').select('*,profiles(full_name,email,phone),appointment_services(*,services(name,price,slug)),customer_vehicles(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))').order('scheduled_start',{ascending:false})]);if(!ord.error)setOrders((ord.data||[]).map(mapOrder));if(!ap.error)setServiceBookings((ap.data||[]).map((x:any)=>{const as=x.appointment_services?.[0],cv=x.customer_vehicles?.vehicle_variants,mm=cv?.vehicle_models,mk=mm?.vehicle_makes;const st:any={pending:'Pending',confirmed:'Confirmed',checked_in:'Confirmed',in_progress:'In Service Bay',completed:'Completed',cancelled:'Cancelled',no_show:'Cancelled'};return{id:x.id,booking_reference:x.appointment_number,service_id:as?.service_id||'',service_slug:as?.services?.slug||'',service_name:as?.services?.name||'',service_price:Number(as?.unit_price||as?.services?.price||0),user_id:x.customer_id,customer_name:x.profiles?.full_name||'',customer_email:x.profiles?.email||'',customer_phone:x.profiles?.phone||'',vehicle_details:[mk?.name,mm?.name,cv?.name].filter(Boolean).join(' '),preferred_date:new Date(x.scheduled_start).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'}),preferred_time:new Date(x.scheduled_start).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Manila'}),notes:x.customer_notes||'',status:st[x.status]||'Pending',created_at:x.created_at};}));};

  const loadCustomerData=async(id:string)=>{
    const c=sb(); if(!c) return;
    const [fav,ci,ord,ap]=await Promise.all([
      c.from('favorites').select('product_id').eq('customer_id',id),
      c.from('carts').select('id,cart_items(product_id,quantity,unit_price,products(id,slug,sku,name,price,brands(name),product_images(storage_path,is_primary)))').eq('customer_id',id).eq('status','active').maybeSingle(),
      c.from('orders').select('*,profiles(full_name,email,phone),addresses(*),order_items(*,products(slug,brands(name),product_images(storage_path,is_primary))),payments(*)').eq('customer_id',id).order('created_at',{ascending:false}),
      c.from('appointments').select('*,profiles(full_name,email,phone),appointment_services(*,services(name,price,slug)),customer_vehicles(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))').eq('customer_id',id).order('scheduled_start',{ascending:false}),
    ]);
    if(!fav.error) setFavorites((fav.data||[]).map((x:any)=>x.product_id));
    if(!ci.error && ci.data) {
      const raw=(ci.data as any).cart_items||[];
      setCart(raw.map((x:any)=>({product_id:x.product_id,product_slug:x.products?.slug||'',sku:x.products?.sku||'',name:x.products?.name||'',brand_name:x.products?.brands?.name||'',unit_price:Number(x.unit_price||x.products?.price||0),quantity:x.quantity,max_stock:999999,image:publicStorageUrl('product-images',x.products?.product_images?.find((i:any)=>i.is_primary)?.storage_path)})));
    } else setCart([]);
    if(!ord.error) setOrders((ord.data||[]).map(mapOrder));
    if(!ap.error) setServiceBookings((ap.data||[]).map((x:any)=>{const as=x.appointment_services?.[0];const cv=x.customer_vehicles?.vehicle_variants;const mm=cv?.vehicle_models;const mk=mm?.vehicle_makes;const st:any={pending:'Pending',confirmed:'Confirmed',checked_in:'Confirmed',in_progress:'In Service Bay',completed:'Completed',cancelled:'Cancelled',no_show:'Cancelled'};return {id:x.id,booking_reference:x.appointment_number,service_id:as?.service_id||'',service_slug:as?.services?.slug||'',service_name:as?.services?.name||'',service_price:Number(as?.unit_price||as?.services?.price||0),user_id:x.customer_id,customer_name:x.profiles?.full_name||'',customer_email:x.profiles?.email||'',customer_phone:x.profiles?.phone||'',vehicle_details:[mk?.name,mm?.name,cv?.name].filter(Boolean).join(' '),preferred_date:new Date(x.scheduled_start).toLocaleDateString('en-CA',{timeZone:'Asia/Manila'}),preferred_time:new Date(x.scheduled_start).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Manila'}),notes:x.customer_notes||'',status:st[x.status]||'Pending',created_at:x.created_at};}));
  };

  useEffect(()=>{
    let mounted=true; const c=sb();
    (async()=>{
      if(c){ const {data:{session}}=await c.auth.getSession(); if(mounted&&session){const p=await loadProfile(session.user.id);setUser(p);await loadCustomerData(session.user.id);if(p?.role==='admin')await loadAdminData();}
        await loadCatalog(); }
      if(mounted)setIsHydrated(true);
    })();
    if(!c) return ()=>{mounted=false};
    const {data:{subscription}}=c.auth.onAuthStateChange((_e,session)=>{
      if(!mounted)return;
      if(session){setTimeout(async()=>{const p=await loadProfile(session.user.id);if(mounted)setUser(p);await loadCustomerData(session.user.id);if(p?.role==='admin')await loadAdminData();},0);}
      else {setUser(null);setFavorites([]);setCart([]);setOrders([]);setServiceBookings([]);}
    });
    return ()=>{mounted=false;subscription.unsubscribe();};
  },[]);

  const ensureCart=async()=>{
    if(!user) throw new Error('Please sign in before adding items to your cart.');
    const c=sb(); if(!c) throw new Error('Supabase is not configured.');
    let {data}=await c.from('carts').select('id').eq('customer_id',user.id).eq('status','active').maybeSingle();
    if(!data){const r=await c.from('carts').insert({customer_id:user.id,status:'active'}).select('id').single();if(r.error)throw r.error;data=r.data;}
    return data.id;
  };

  const toggleFavorite=async(partId:string)=>{
    if(!user){showToast('Please sign in to save parts.','error');return;}
    const c=sb();if(!c)return;
    if(favorites.includes(partId)){const r=await c.from('favorites').delete().eq('customer_id',user.id).eq('product_id',partId);if(r.error)showToast(r.error.message,'error');else setFavorites(p=>p.filter(x=>x!==partId));}
    else {const r=await c.from('favorites').insert({customer_id:user.id,product_id:partId});if(r.error)showToast(r.error.message,'error');else setFavorites(p=>[...p,partId]);}
  };

  const addToCart=async(part:PartProduct,quantity=1)=>{
    if(part.stock<=0||part.status!=='Active'){showToast('This part is currently out of stock.','error');return;}
    try{const c=sb();if(!c)throw new Error('Supabase is not configured.');const cartId=await ensureCart();
      const {data:existing}=await c.from('cart_items').select('id,quantity').eq('cart_id',cartId).eq('product_id',part.id).maybeSingle();
      const next=Math.min(part.stock,(existing?.quantity||0)+quantity);
      const r=existing?await c.from('cart_items').update({quantity:next,unit_price:part.price}).eq('id',existing.id):await c.from('cart_items').insert({cart_id:cartId,product_id:part.id,quantity:Math.min(part.stock,quantity),unit_price:part.price});
      if(r.error)throw r.error;await loadCustomerData(user!.id);showToast('Added to cart.');
    }catch(e:any){showToast(e.message||'Unable to update cart.','error');}
  };

  const updateCartQuantity=async(productId:string,quantity:number)=>{
    if(!user)return;const c=sb();if(!c)return;try{const cartId=await ensureCart();if(quantity<=0)await c.from('cart_items').delete().eq('cart_id',cartId).eq('product_id',productId);else await c.from('cart_items').update({quantity}).eq('cart_id',cartId).eq('product_id',productId);await loadCustomerData(user.id);}catch(e:any){showToast(e.message,'error');}
  };
  const removeFromCart=async(productId:string)=>updateCartQuantity(productId,0);
  const clearCart=async()=>{if(!user)return;const c=sb();if(!c)return;const id=await ensureCart();const r=await c.from('cart_items').delete().eq('cart_id',id);if(r.error)showToast(r.error.message,'error');else setCart([]);};

  const createOrder=async(payload:any)=>{
    if(!user)throw new Error('Please sign in before checkout.');
    const c=sb();if(!c)throw new Error('Supabase is not configured.');
    const {data,error}=await c.rpc('create_customer_order',{p_payload:payload});if(error)throw error;
    await loadCustomerData(user.id);showToast('Order created successfully.');return data;
  };

  const createServiceBooking=async(payload:any)=>{
    if(!user)throw new Error('Please sign in before booking a service.');
    const c=sb();if(!c)throw new Error('Supabase is not configured.');
    const {data,error}=await c.rpc('create_customer_appointment',{p_service_id:payload.service_id,p_branch_id:payload.branch_id||null,p_customer_vehicle_id:payload.customer_vehicle_id||null,p_scheduled_start:payload.scheduled_start,p_scheduled_end:payload.scheduled_end||null,p_notes:payload.notes||null});
    if(error)throw error;await loadCustomerData(user.id);showToast('Service appointment request submitted.');return data;
  };

  const login=async(email:string,password:string)=>{
    const c=sb();if(!c){showToast('Supabase is not configured.','error');return false;}
    const {error}=await c.auth.signInWithPassword({email:email.trim(),password});if(error){showToast(error.message,'error');return false;}return true;
  };
  const register=async(name:string,email:string,phone:string,password:string)=>{
    const c=sb();if(!c){showToast('Supabase is not configured.','error');return false;}
    const {data,error}=await c.auth.signUp({email:email.trim().toLowerCase(),password,options:{data:{full_name:name.trim(),phone:phone.trim()}}});
    if(error){showToast(error.message,'error');return false;}
    if(data.user){const p=await loadProfile(data.user.id);setUser(p);}
    showToast(data.session?'Account created.':'Account created. Check your email to confirm.');return true;
  };
  const logout=async()=>{const c=sb();if(c)await c.auth.signOut();setUser(null);setFavorites([]);setCart([]);setOrders([]);setServiceBookings([]);};
  const updateProfile=async(updates:Partial<UserProfile>)=>{
    if(!user) return;const c=sb();if(!c)return;
    const patch:any={};if(updates.name!==undefined)patch.full_name=updates.name;if(updates.phone!==undefined)patch.phone=updates.phone;
    const {error}=await c.from('profiles').update(patch).eq('id',user.id);if(error){showToast(error.message,'error');return;}
    const next={...user,...updates};setUser(next);showToast('Profile saved.');
  };

  const addPart=async(part:any)=>{
    if(!user?.role||user.role!=='admin')throw new Error('Administrator authorization required.');
    const c=sb();if(!c)throw new Error('Supabase is not configured.');
    const stockStatus=part.stock<=0?'out_of_stock':part.stock<=5?'low_stock':'in_stock';
    const {data,error}=await c.from('products').insert({sku:part.sku,name:part.name,slug:part.slug,brand_id:part.brand_id,category_id:part.category_id,price:part.price,compare_at_price:part.compare_at_price??null,description:part.description,short_description:part.description,is_featured:part.is_featured,is_active:part.status!=='Archived',stock_status:stockStatus}).select('*').single();
    if(error)throw error;
    const branch=(await c.from('branches').select('id').eq('is_active',true).order('id').limit(1).maybeSingle()).data;
    if(branch)await c.from('inventory').insert({product_id:data.id,branch_id:branch.id,quantity:part.stock,reserved_quantity:0,reorder_level:5});
    await loadCatalog();return mapProduct(data);
  };
  const updatePart=async(id:string,updates:any)=>{
    if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)throw new Error('Supabase is not configured.');
    const patch:any={};for(const k of ['sku','name','slug','brand_id','category_id','price','compare_at_price','description','is_featured'])if(updates[k]!==undefined)patch[k]=updates[k];
    if(updates.status)patch.stock_status=updates.status==='Out of Stock'?'out_of_stock':updates.status==='Archived'?'discontinued':'in_stock';
    if(Object.keys(patch).length){const r=await c.from('products').update(patch).eq('id',id);if(r.error)throw r.error;}
    if(updates.stock!==undefined){const {data:i}=await c.from('inventory').select('id').eq('product_id',id).order('id').limit(1).maybeSingle();if(i)await c.from('inventory').update({quantity:updates.stock}).eq('id',i.id);}
    await loadCatalog();
  };
  const deletePart=async(id:string)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c) return;const r=await c.from('products').update({is_active:false,stock_status:'discontinued'}).eq('id',id);if(r.error)throw r.error;await loadCatalog();};
  const updatePartStatus=async(id:string,status:ProductStatus)=>updatePart(id,{status});
  const addService=async(srv:any)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)throw new Error('Supabase is not configured.');const cat=(await c.from('service_categories').select('id').eq('name',srv.category).maybeSingle()).data;const r=await c.from('services').insert({name:srv.name,slug:srv.slug,category_id:cat?.id||null,description:srv.description,short_description:srv.description,price:srv.price,duration_minutes:srv.duration_minutes,is_bookable:true,is_active:true}).select('*').single();if(r.error)throw r.error;await loadCatalog();return mapService(r.data);};
  const updateServiceBookingStatus=async(id:string,status:ServiceBookingStatus)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)return;const map:any={'Confirmed':'confirmed','In Service Bay':'in_progress','Completed':'completed','Cancelled':'cancelled','Pending':'pending'};const r=await c.from('appointments').update({status:map[status]||status}).eq('id',id);if(r.error)throw r.error;await loadCustomerData(user.id);};
  const updateOrderStatus=async(id:string,fulfillmentStatus:OrderFulfillmentStatus,paymentStatus?:PaymentStatus)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)return;const om:any={Processing:'processing',Packed:'ready_for_pickup',Shipped:'shipped',Delivered:'delivered',Cancelled:'cancelled'};const r=await c.from('orders').update({status:om[fulfillmentStatus]||'processing'}).eq('id',id);if(r.error)throw r.error;if(paymentStatus){const pm:any={'Paid':'paid','Pending Verification':'pending','COD Pending':'pending'};await c.from('payments').update({status:pm[paymentStatus]||'pending'}).eq('order_id',id);}await loadCustomerData(user.id);};
  const addBrand=async(brand:any)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)return;const r=await c.from('brands').insert({name:brand.name,slug:brand.slug,description:brand.description,is_active:true});if(r.error)throw r.error;await loadCatalog();};
  const addCategory=async(cat:any)=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)return;const r=await c.from('categories').insert({name:cat.name,slug:cat.slug,description:cat.description,is_active:true});if(r.error)throw r.error;await loadCatalog();};
  const addVlog=async(vlog:any):Promise<VlogPost>=>{if(!user||user.role!=='admin')throw new Error('Administrator authorization required.');const c=sb();if(!c)throw new Error('Supabase is not configured.');const types:any={'Service Bay Vlog':'behind_the_scenes','Part Install Guide':'installation','Dyno & Diagnostics':'repair','Tool & Part Review':'new_arrival'};const r=await c.from('daily_posts').insert({author_id:user.id,title:vlog.title,caption:vlog.summary,post_type:types[vlog.category]||'shop_update',is_published:true,published_at:new Date().toISOString()}).select('*').single();if(r.error)throw r.error;await loadCatalog();return {...vlog,id:r.data.id,views_count:0,likes_count:0,comments:[]};};
  const likeVlog=async(vlogId:string)=>{if(!user){showToast('Please sign in to like posts.','error');return;}const c=sb();if(!c)return;const r=await c.from('daily_post_likes').insert({post_id:vlogId,user_id:user.id});if(r.error&&r.code!=='23505')showToast(r.error.message,'error');};
  const addVlogComment=async(vlogId:string,_userName:string,text:string)=>{if(!user){showToast('Please sign in to comment.','error');return;}const c=sb();if(!c)return;const r=await c.from('daily_post_comments').insert({post_id:vlogId,user_id:user.id,content:text.trim()});if(r.error)showToast(r.error.message,'error');};

  const value=useMemo(()=>({parts,brands,categories,services,serviceBookings,vlogs,favorites,cart,orders,user,isHydrated,showToast,toggleFavorite,addToCart,updateCartQuantity,removeFromCart,clearCart,createOrder,createServiceBooking,login,register,logout,updateProfile,addPart,updatePart,deletePart,updatePartStatus,addService,updateServiceBookingStatus,updateOrderStatus,addBrand,addCategory,addVlog,likeVlog,addVlogComment}),[parts,brands,categories,services,serviceBookings,vlogs,favorites,cart,orders,user,isHydrated]);
  return <StoreContext.Provider value={value}>{children}<div aria-live="polite" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">{toasts.map(t=><div key={t.id} className="pointer-events-auto flex items-center justify-between gap-3 bg-[#141413] text-white px-4 py-3 rounded-lg shadow-lg border border-neutral-800 text-sm"><div className="flex items-center gap-2.5">{t.type==='error'?<AlertCircle className="w-4 h-4 text-red-400 shrink-0"/>:<CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0"}/><span>{t.text}</span></div><button type="button" onClick={()=>setToasts(p=>p.filter(x=>x.id!==t.id))} aria-label="Close notification"><X className="w-4 h-4"/></button></div>)}</div></StoreContext.Provider>;
}
export function useStore(){const c=useContext(StoreContext);if(!c)throw new Error('useStore must be used within a StoreProvider');return c;}
