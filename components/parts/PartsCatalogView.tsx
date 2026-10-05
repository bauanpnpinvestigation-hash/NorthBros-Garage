'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { createClient } from '@/lib/supabase/client';
import { PartCard } from '@/components/parts/PartCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface PartsCatalogViewProps {
  lockedBrandSlug?: string;
  lockedCategorySlug?: string;
  heading?: string;
  subheading?: string;
}

export function PartsCatalogView({
  lockedBrandSlug,
  lockedCategorySlug,
  heading = 'Car Parts & Maintenance Catalog',
  subheading = 'Shop products configured by the business, with filtering by category, manufacturer, and vehicle compatibility.',
}: PartsCatalogViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { parts, brands, categories } = useStore();
  const [vehicleMakes, setVehicleMakes] = useState<Array<{id:string;name:string;slug:string}>>([]);
  useEffect(() => { const c=createClient(); if(!c) return; void c.from('vehicle_makes').select('id,name,slug').eq('is_active',true).order('name').then(({data}:any)=>setVehicleMakes((data||[]) as Array<{id:string;name:string;slug:string}>)); }, []);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const brand = lockedBrandSlug || searchParams.get('brand') || 'all';
  const category = lockedCategorySlug || searchParams.get('category') || 'all';
  const make = searchParams.get('make') || 'all';
  const inStockOnly = searchParams.get('in_stock') === 'true';
  const maxPrice = searchParams.get('max_price') || 'all';
  const sort = searchParams.get('sort') || 'recommended';
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const PAGE_SIZE = 6;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || value === 'false') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!('page' in updates)) {
      params.delete('page');
    }
    const basePath = lockedBrandSlug
      ? `/brands/${lockedBrandSlug}`
      : lockedCategorySlug
      ? `/categories/${lockedCategorySlug}`
      : '/parts';
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const clearAllFilters = () => {
    const basePath = lockedBrandSlug
      ? `/brands/${lockedBrandSlug}`
      : lockedCategorySlug
      ? `/categories/${lockedCategorySlug}`
      : '/parts';
    router.push(basePath);
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...parts];

    if (q.trim()) {
      const query = q.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.brand_name.toLowerCase().includes(query) ||
          p.category_name.toLowerCase().includes(query) ||
          p.compatibility.some(
            (c) =>
              c.make.toLowerCase().includes(query) ||
              c.model.toLowerCase().includes(query)
          )
      );
    }

    if (brand !== 'all') {
      list = list.filter((p) => p.brand_slug === brand.toLowerCase());
    }

    if (category !== 'all') {
      list = list.filter((p) => p.category_slug === category.toLowerCase());
    }

    if (make !== 'all') {
      list = list.filter((p) =>
        p.compatibility.some((c) => c.make.toLowerCase() === make.toLowerCase())
      );
    }

    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0 && p.status === 'Active');
    }

    if (maxPrice !== 'all') {
      const cap = Number(maxPrice);
      if (!isNaN(cap) && cap > 0) {
        list = list.filter((p) => p.price <= cap);
      }
    }

    switch (sort) {
      case 'newest':
        list.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'price_asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating_desc':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'recommended':
      default:
        list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
        break;
    }

    return list;
  }, [parts, q, brand, category, make, inStockOnly, maxPrice, sort]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSorted.length / PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedParts = filteredAndSorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasActiveFilters =
    Boolean(q) ||
    (!lockedBrandSlug && brand !== 'all') ||
    (!lockedCategorySlug && category !== 'all') ||
    make !== 'all' ||
    inStockOnly ||
    maxPrice !== 'all';

  const FilterControls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="filter-part-q"
          className="block text-xs font-semibold text-[#141413]"
        >
          Part Name or SKU Search
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#6E6E68] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="filter-part-q"
            type="text"
            value={q}
            onChange={(e) => updateParams({ q: e.target.value })}
            placeholder="Part name, SKU, model..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg focus:outline-none focus:border-[#141413]"
          />
          {q && (
            <button
              type="button"
              onClick={() => updateParams({ q: null })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6E6E68] hover:text-[#141413]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!lockedCategorySlug && (
        <div className="space-y-2">
          <label
            htmlFor="filter-part-cat"
            className="block text-xs font-semibold text-[#141413]"
          >
            Part Category
          </label>
          <select
            id="filter-part-cat"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!lockedBrandSlug && (
        <div className="space-y-2">
          <label
            htmlFor="filter-part-brand"
            className="block text-xs font-semibold text-[#141413]"
          >
            Manufacturer Brand
          </label>
          <select
            id="filter-part-brand"
            value={brand}
            onChange={(e) => updateParams({ brand: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="filter-part-make"
          className="block text-xs font-semibold text-[#141413]"
        >
          Vehicle Compatibility (Make)
        </label>
        <select
          id="filter-part-make"
          value={make}
          onChange={(e) => updateParams({ make: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
        >
          <option value="all">All Compatible Makes</option>
          {vehicleMakes.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="filter-part-price"
          className="block text-xs font-semibold text-[#141413]"
        >
          Maximum Price
        </label>
        <select
          id="filter-part-price"
          value={maxPrice}
          onChange={(e) => updateParams({ max_price: e.target.value })}
          className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
        >
          <option value="all">Any Price</option>
          <option value="5000">Under ₱5,000</option>
          <option value="15000">Under ₱15,000</option>
          <option value="25000">Under ₱25,000</option>
          <option value="50000">Under ₱50,000</option>
        </select>
      </div>

      <div className="pt-1">
        <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#141413] cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) =>
              updateParams({ in_stock: e.target.checked ? 'true' : null })
            }
            className="rounded border-neutral-300"
          />
          In-Stock Parts Only
        </label>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full py-2 px-4 text-xs font-semibold text-[#141413] bg-neutral-200/80 hover:bg-neutral-300/80 rounded-lg transition-colors cursor-pointer"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-8">
      <div className="space-y-2 border-b border-[#E5E5E0] pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
          {heading}
        </h1>
        <p className="text-sm text-[#6E6E68] max-w-2xl">{subheading}</p>
      </div>

      <div className="flex lg:hidden items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
          className="flex-1 py-2.5 px-4 bg-white border border-[#E5E5E0] rounded-lg text-xs font-semibold text-[#141413] flex items-center justify-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {mobileFiltersOpen ? 'Hide Filters' : 'Filters'}
        </button>

        <div className="flex-1">
          <select
            aria-label="Sort parts"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="w-full py-2.5 px-3 bg-white border border-[#E5E5E0] rounded-lg text-xs font-semibold text-[#141413]"
          >
            <option value="recommended">Sort: Featured</option>
            <option value="newest">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Highest Rated</option>
          </select>
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="lg:hidden bg-white border border-[#E5E5E0] rounded-xl p-5">
          {FilterControls}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="hidden lg:block lg:col-span-3 bg-white border border-[#E5E5E0] rounded-xl p-6 sticky top-24">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#E5E5E0]">
            <h2 className="text-sm font-semibold text-[#141413]">
              Filter Parts
            </h2>
            <span className="text-xs text-[#6E6E68] font-mono tabular-nums">
              {filteredAndSorted.length} items
            </span>
          </div>
          {FilterControls}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          <div className="hidden lg:flex items-center justify-between bg-white border border-[#E5E5E0] rounded-xl px-5 py-3.5">
            <p className="text-xs text-[#52524E] tabular-nums">
              Showing{' '}
              <span className="font-semibold text-[#141413]">
                {paginatedParts.length}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-[#141413]">
                {filteredAndSorted.length}
              </span>{' '}
              automotive parts
            </p>

            <div className="flex items-center gap-3">
              <label
                htmlFor="desktop-part-sort"
                className="text-xs text-[#6E6E68]"
              >
                Sort by:
              </label>
              <select
                id="desktop-part-sort"
                value={sort}
                onChange={(e) => updateParams({ sort: e.target.value })}
                className="px-3 py-1.5 text-xs font-semibold text-[#141413] bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
              >
                <option value="recommended">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>
          </div>

          {paginatedParts.length === 0 ? (
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-12 text-center space-y-4">
              <h3 className="font-display text-xl font-bold text-[#141413]">
                No parts match your filter
              </h3>
              <p className="text-sm text-[#6E6E68] max-w-md mx-auto">
                Try clearing your vehicle compatibility or price filters to view
                all available parts.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedParts.map((part) => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pt-6 flex items-center justify-between border-t border-[#E5E5E0]">
                  <p className="text-xs text-[#6E6E68] tabular-nums">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        updateParams({ page: String(currentPage - 1) })
                      }
                      className="px-3.5 py-2 text-xs font-semibold border border-[#E5E5E0] bg-white rounded-lg disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        updateParams({ page: String(currentPage + 1) })
                      }
                      className="px-3.5 py-2 text-xs font-semibold border border-[#E5E5E0] bg-white rounded-lg disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
