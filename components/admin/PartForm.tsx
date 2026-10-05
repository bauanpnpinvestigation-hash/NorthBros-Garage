'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/components/shared/StoreProvider';
import { PartProduct, ProductStatus } from '@/types/database';
import { slugify } from '@/lib/utils/format';

const PART_IMAGE_PRESETS = [
  { label: 'Brembo Ceramic Brake Pads', url: '/images/part_brake_pad.jpg' },
  { label: 'Motul Synthetic Oil & Filter Kit', url: '/images/part_oil_filter_kit.jpg' },
  { label: 'NGK Iridium Spark Plugs Set', url: '/images/part_spark_plugs.jpg' },
  { label: 'Bilstein B6 Performance Shock Absorbers', url: '/images/part_suspension_shocks.jpg' },
  { label: 'Denso Direct-Fit Automotive Alternator', url: '/images/part_alternator.jpg' },
  { label: 'Michelin Pilot Sport 5 Performance Tires', url: '/images/part_performance_tire.jpg' },
];

interface PartFormProps {
  initialPart?: PartProduct;
}

export function PartForm({ initialPart }: PartFormProps) {
  const router = useRouter();
  const { brands, categories, addPart, updatePart } = useStore();

  const [brandSlug, setBrandSlug] = useState(
    initialPart?.brand_slug || brands[0]?.slug || 'brembo'
  );
  const [categorySlug, setCategorySlug] = useState(
    initialPart?.category_slug || categories[0]?.slug || 'brakes'
  );
  const [name, setName] = useState(initialPart?.name || '');
  const [sku, setSku] = useState(initialPart?.sku || '');
  const [price, setPrice] = useState(String(initialPart?.price || 4850));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialPart?.compare_at_price ? String(initialPart.compare_at_price) : ''
  );
  const [stock, setStock] = useState(String(initialPart?.stock ?? 24));
  const [status, setStatus] = useState<ProductStatus>(
    initialPart?.status || 'Active'
  );
  const [isFeatured, setIsFeatured] = useState(
    initialPart ? initialPart.is_featured : true
  );
  const [primaryImage, setPrimaryImage] = useState(
    initialPart?.primary_image || '/images/part_brake_pad.jpg'
  );
  const [description, setDescription] = useState(
    initialPart?.description ||
      'Genuine high-performance OEM replacement engineered for maximum heat dissipation, low dust, and immediate pedal bite.'
  );
  const [compatibilityMake, setCompatibilityMake] = useState('Toyota');
  const [compatibilityModel, setCompatibilityModel] = useState('Fortuner / Hilux / Prado');
  const [compatibilityYears, setCompatibilityYears] = useState('2016-2025');
  const [compatibilityEngine, setCompatibilityEngine] = useState('2.4L / 2.8L D-4D 1GD/2GD');

  const [specMaterial, setSpecMaterial] = useState(initialPart?.specifications?.Material || 'Carbon Ceramic Compound');
  const [specWarranty, setSpecWarranty] = useState(initialPart?.specifications?.Warranty || '1 Year / 20,000 km');
  const [specOrigin, setSpecOrigin] = useState(initialPart?.specifications?.['Country of Origin'] || 'Italy / Japan OEM');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!name.trim()) errs.name = 'Part name is required.';
    if (!sku.trim()) errs.sku = 'SKU / Part Number is required.';
    if (isNaN(parsedPrice) || parsedPrice <= 0)
      errs.price = 'Price must be greater than 0.';
    if (isNaN(parsedStock) || parsedStock < 0)
      errs.stock = 'Stock must be 0 or greater.';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const selectedBrand = brands.find((b) => b.slug === brandSlug) || brands[0];
    const selectedCategory = categories.find((c) => c.slug === categorySlug) || categories[0];

    const payload = {
      slug: initialPart?.slug || slugify(`${selectedBrand.name}-${name}-${sku}`),
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      brand_id: selectedBrand.id,
      brand_name: selectedBrand.name,
      brand_slug: selectedBrand.slug,
      category_id: selectedCategory.id,
      category_name: selectedCategory.name,
      category_slug: selectedCategory.slug,
      price: parsedPrice,
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : undefined,
      stock: parsedStock,
      status,
      rating: initialPart?.rating || 4.9,
      review_count: initialPart?.review_count || 18,
      is_featured: isFeatured,
      primary_image: primaryImage,
      gallery_images: [primaryImage],
      description: description.trim(),
      specifications: {
        Material: specMaterial,
        Warranty: specWarranty,
        'Country of Origin': specOrigin,
      },
      compatibility: [
        {
          make: compatibilityMake.trim(),
          model: compatibilityModel.trim(),
          years: compatibilityYears.trim(),
          engine: compatibilityEngine.trim(),
        },
      ],
    };

    if (initialPart) {
      updatePart(initialPart.id, payload);
    } else {
      addPart(payload);
    }
    router.push('/admin/parts');
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* Group 1: Basic Part Information */}
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
          1. Part Identification & Classification
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Manufacturer Brand
            </label>
            <select
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name} ({b.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Part Category
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Part Number / SKU
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. BRM-P83-145N"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono uppercase"
            />
            {errors.sku && <p className="text-xs text-red-700 mt-1">{errors.sku}</p>}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Part / Product Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Brembo Premium Ceramic Front Brake Pads Set"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
            {errors.name && <p className="text-xs text-red-700 mt-1">{errors.name}</p>}
          </div>
        </div>
      </section>

      {/* Group 2: Pricing & Inventory */}
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
          2. Pricing & Stock Inventory
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Selling Price (PHP ₱)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
            {errors.price && <p className="text-xs text-red-700 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Original / Compare-at Price (Optional)
            </label>
            <input
              type="number"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="e.g. 5800"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Current Available Stock
            </label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
            {errors.stock && <p className="text-xs text-red-700 mt-1">{errors.stock}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Catalog Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              <option value="Active">Active</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      {/* Group 3: Compatibility & Technical Specifications */}
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
          3. Vehicle Fitment & Technical Specs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Compatible Make
            </label>
            <input
              type="text"
              value={compatibilityMake}
              onChange={(e) => setCompatibilityMake(e.target.value)}
              placeholder="e.g. Toyota / Mitsubishi"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Compatible Models
            </label>
            <input
              type="text"
              value={compatibilityModel}
              onChange={(e) => setCompatibilityModel(e.target.value)}
              placeholder="e.g. Fortuner / Hilux / Montero"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Model Years
            </label>
            <input
              type="text"
              value={compatibilityYears}
              onChange={(e) => setCompatibilityYears(e.target.value)}
              placeholder="e.g. 2016-2025"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Engine / Trim Fitment
            </label>
            <input
              type="text"
              value={compatibilityEngine}
              onChange={(e) => setCompatibilityEngine(e.target.value)}
              placeholder="e.g. 2.4L / 2.8L Diesel"
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Material / Construction
            </label>
            <input
              type="text"
              value={specMaterial}
              onChange={(e) => setSpecMaterial(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Warranty Policy
            </label>
            <input
              type="text"
              value={specWarranty}
              onChange={(e) => setSpecWarranty(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Country of Origin
            </label>
            <input
              type="text"
              value={specOrigin}
              onChange={(e) => setSpecOrigin(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* Group 4: Product Description & Catalog Media */}
      <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-bold text-[#141413] border-b border-[#E5E5E0] pb-3">
          4. Detailed Description & Media
        </h2>
        <div>
          <label className="block text-xs font-semibold text-[#141413] mb-1">
            Part Overview & Technical Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141413] mb-1">
              Catalog Product Image
            </label>
            <select
              value={primaryImage}
              onChange={(e) => setPrimaryImage(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
            >
              {PART_IMAGE_PRESETS.map((preset) => (
                <option key={preset.url} value={preset.url}>
                  {preset.label} ({preset.url})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#141413] cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-neutral-300"
              />
              Feature on Homepage Storefront
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/parts')}
          className="px-5 py-2.5 bg-white border border-[#E5E5E0] text-[#141413] text-xs font-semibold rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          {initialPart ? 'Save Part Updates' : 'Publish Part to Catalog'}
        </button>
      </div>
    </form>
  );
}
