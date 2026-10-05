'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useStore } from '@/components/shared/StoreProvider';

export function HeroSearch() {
  const router = useRouter();
  const { categories } = useStore();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [make, setMake] = useState('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (category !== 'all') params.set('category', category);
    if (make !== 'all') params.set('make', make);
    const qs = params.toString();
    router.push(qs ? `/parts?${qs}` : '/parts');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-[#141413] p-3 sm:p-4 rounded-xl border border-[#E5E5E0] shadow-xl max-w-4xl w-full"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <div className="lg:col-span-2 relative">
          <label htmlFor="hero-part-search" className="sr-only">
            Search part name, SKU, or brand
          </label>
          <Search className="w-4 h-4 text-[#6E6E68] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="hero-part-search"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Part name, SKU, or brand (e.g. Brembo, 5W-30, AGM)"
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
          />
        </div>

        <div>
          <label htmlFor="hero-category-select" className="sr-only">
            Part Category
          </label>
          <select
            id="hero-category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
          >
            <option value="all">All Part Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="hero-make-select" className="sr-only">
            Vehicle Compatibility Make
          </label>
          <select
            id="hero-make-select"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
          >
            <option value="all">All Vehicle Makes</option>
            <option value="Toyota">Fits Toyota</option>
            <option value="Honda">Fits Honda</option>
            <option value="Mitsubishi">Fits Mitsubishi</option>
            <option value="Ford">Fits Ford</option>
            <option value="Nissan">Fits Nissan</option>
            <option value="Mazda">Fits Mazda</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            className="w-full py-2.5 px-5 bg-[#141413] hover:bg-neutral-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Find Parts
          </button>
        </div>
      </div>
    </form>
  );
}
