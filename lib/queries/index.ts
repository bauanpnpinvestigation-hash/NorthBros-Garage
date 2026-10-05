import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PARTS,
  INITIAL_SERVICES,
  INITIAL_SERVICE_BOOKINGS,
  INITIAL_VLOGS,
} from '@/lib/store/initial-data';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  AutomotiveService,
  Brand,
  Category,
  Order,
  PartFilterParams,
  PartProduct,
  ServiceBooking,
  VlogPost,
} from '@/types/database';

export async function getFeaturedParts(limit = 6): Promise<PartProduct[]> {
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .limit(limit);
      if (!error && data && data.length > 0) {
        return data as PartProduct[];
      }
    }
  } catch {
    // Fallback to verified repository
  }
  return INITIAL_PARTS.filter((p) => p.is_featured).slice(0, limit);
}

export async function getParts(params: PartFilterParams = {}): Promise<{
  parts: PartProduct[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const {
    q,
    brand,
    category,
    make,
    in_stock,
    max_price,
    sort = 'recommended',
    page = 1,
    limit = 6,
  } = params;

  let list = [...INITIAL_PARTS];

  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        list = data as PartProduct[];
      }
    }
  } catch {
    // Fallback
  }

  if (q && q.trim() !== '') {
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

  if (brand && brand !== 'all') {
    list = list.filter((p) => p.brand_slug === brand.toLowerCase());
  }

  if (category && category !== 'all') {
    list = list.filter((p) => p.category_slug === category.toLowerCase());
  }

  if (make && make !== 'all') {
    list = list.filter((p) =>
      p.compatibility.some((c) => c.make.toLowerCase() === make.toLowerCase())
    );
  }

  if (in_stock === 'true') {
    list = list.filter((p) => p.stock > 0 && p.status === 'Active');
  }

  if (typeof max_price === 'number' && !isNaN(max_price) && max_price > 0) {
    list = list.filter((p) => p.price <= max_price);
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

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const paginated = list.slice(start, start + limit);

  return {
    parts: paginated,
    total,
    page: safePage,
    totalPages,
  };
}

export async function getPartBySlug(slug: string): Promise<PartProduct | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) {
        return data as PartProduct;
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_PARTS.find((p) => p.slug === slug) || null;
}

export async function getServices(): Promise<AutomotiveService[]> {
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.from('services').select('*');
      if (!error && data && data.length > 0) {
        return data as AutomotiveService[];
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_SERVICES;
}

export async function getServiceBySlug(
  slug: string
): Promise<AutomotiveService | null> {
  return INITIAL_SERVICES.find((s) => s.slug === slug) || null;
}

export async function getBrands(): Promise<(Brand & { part_count: number })[]> {
  return INITIAL_BRANDS.map((b) => ({
    ...b,
    part_count: INITIAL_PARTS.filter((p) => p.brand_slug === b.slug).length,
  }));
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  return INITIAL_BRANDS.find((b) => b.slug === slug) || null;
}

export async function getCategories(): Promise<
  (Category & { part_count: number })[]
> {
  return INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    part_count: INITIAL_PARTS.filter((p) => p.category_slug === cat.slug)
      .length,
  }));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return INITIAL_CATEGORIES.find((c) => c.slug === slug) || null;
}

export async function getVlogs(): Promise<VlogPost[]> {
  return [...INITIAL_VLOGS].sort((a, b) => b.episode_number - a.episode_number);
}

export async function getInitialServiceBookings(): Promise<ServiceBooking[]> {
  return INITIAL_SERVICE_BOOKINGS;
}

export async function getInitialOrders(): Promise<Order[]> {
  return INITIAL_ORDERS;
}
