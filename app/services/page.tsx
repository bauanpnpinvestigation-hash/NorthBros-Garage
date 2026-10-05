'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/components/shared/StoreProvider';
import { ServiceCard } from '@/components/services/ServiceCard';
import { createClient } from '@/lib/supabase/client';

export default function ServicesPage() {
  const { services } = useStore();
  const [serviceCategories, setServiceCategories] = useState<Array<{id:string;name:string;slug:string}>>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  useEffect(() => { const c=createClient(); if(!c) return; void c.from('service_categories').select('id,name,slug').eq('is_active',true).order('sort_order').order('name').then(({data}:any)=>setServiceCategories((data||[]) as Array<{id:string;name:string;slug:string}>)); }, []);

  const filtered =
    selectedCat === 'all'
      ? services
      : services.filter((s) => s.category === selectedCat);

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <p className="text-xs font-medium text-[#6E6E68]">
          Online Service Booking · Configured Workshop Availability
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          Automotive Maintenance & Repair Services
        </h1>
        <p className="text-sm text-[#6E6E68] max-w-2xl">
          Select an automotive service package below to view included operations
          and book your preferred service bay date and time slot.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-200/70 rounded-lg w-fit">
        {['all', ...serviceCategories.map((item) => item.name)].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCat === cat
                ? 'bg-white text-[#141413] font-semibold shadow-xs'
                : 'text-[#52524E] hover:text-[#141413]'
            }`}
          >
            {cat === 'all' ? `All Services (${services.length})` : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {filtered.map((srv) => (
          <ServiceCard key={srv.id} service={srv} />
        ))}
      </div>
    </div>
  );
}
