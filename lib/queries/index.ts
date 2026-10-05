import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSupabaseUrl } from '@/lib/supabase/client';
import {
  isVideoMediaUrl,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
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

function storageUrl(bucket: string, path?: string | null) {
  if (!path) return '/images/hero_parts_workshop.jpg';
  if (
    path.startsWith('/') ||
    /^https?:\/\//i.test(path) ||
    /^data:/i.test(path)
  ) {
    return path;
  }
  const u = getSupabaseUrl();
  return u ? `${u}/storage/v1/object/public/${bucket}/${path}` : path;
}

function mapProduct(row: any): PartProduct {
  const imgs = Array.isArray(row.product_images)
    ? [...row.product_images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : [];
  const primary = imgs.find((x: any) => x.is_primary) || imgs[0];
  const stock = (row.inventory || []).reduce(
    (n: number, x: any) =>
      n + Math.max(0, (x.quantity ?? 0) - (x.reserved_quantity ?? 0)),
    0
  );
  const status: Record<string, any> = {
    in_stock: 'Active',
    low_stock: 'Active',
    out_of_stock: 'Out of Stock',
    pre_order: 'Active',
    discontinued: 'Archived',
  };
  const compatibility = (row.product_vehicle_compatibility || []).map(
    (x: any) => {
      const v = x.vehicle_variants;
      const m = v?.vehicle_models;
      const k = m?.vehicle_makes;
      return {
        make: k?.name || '',
        model: m?.name || v?.name || '',
        years:
          v?.year_from && v?.year_to
            ? `${v.year_from}-${v.year_to}`
            : v?.year_from
            ? String(v.year_from)
            : '',
        engine: v?.engine || v?.engine_code || '',
      };
    }
  );
  const resolvedPrimary = resolveDisplayImageUrl(
    storageUrl('product-images', primary?.storage_path),
    '/images/part_brake_pad.jpg'
  );
  const resolvedGallery =
    imgs.length > 0
      ? imgs.map((x: any) =>
          resolveDisplayImageUrl(
            storageUrl('product-images', x.storage_path),
            resolvedPrimary
          )
        )
      : [resolvedPrimary];

  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku || '',
    name: row.name,
    brand_id: row.brand_id || '',
    brand_name: row.brands?.name || '',
    brand_slug: row.brands?.slug || '',
    category_id: row.category_id || '',
    category_name: row.categories?.name || '',
    category_slug: row.categories?.slug || '',
    price: Number(row.price || 0),
    compare_at_price:
      row.compare_at_price == null ? undefined : Number(row.compare_at_price),
    stock,
    status: status[row.stock_status] || 'Active',
    rating: 4.9,
    review_count: 0,
    is_featured: !!row.is_featured,
    primary_image: resolvedPrimary,
    gallery_images: resolvedGallery,
    description: row.description || row.short_description || '',
    specifications: {},
    compatibility,
    created_at: row.created_at,
  };
}

async function productQuery(s: any) {
  return s
    .from('products')
    .select(
      '*,brands(name,slug),categories(name,slug),product_images(storage_path,alt_text,sort_order,is_primary),inventory(quantity,reserved_quantity),product_vehicle_compatibility(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))'
    )
    .eq('is_active', true);
}

export async function getFeaturedParts(limit = 6): Promise<PartProduct[]> {
  const s = await createServerSupabaseClient();
  if (!s) return [];
  const query = await productQuery(s);
  const { data, error } = await query.eq('is_featured', true).limit(limit);
  return error ? [] : (data || []).map(mapProduct);
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

  const s = await createServerSupabaseClient();
  if (!s) return { parts: [], total: 0, page: 1, totalPages: 1 };

  const { data, error } = await productQuery(s);
  let list: PartProduct[] = error ? [] : (data || []).map(mapProduct);

  if (q?.trim()) {
    const x = q.toLowerCase().trim();
    list = list.filter(
      (p: PartProduct) =>
        [p.name, p.sku, p.brand_name, p.category_name].some((v) =>
          v.toLowerCase().includes(x)
        ) ||
        p.compatibility.some((v) =>
          [v.make, v.model].some((z) => z.toLowerCase().includes(x))
        )
    );
  }

  if (brand && brand !== 'all') {
    list = list.filter((p: PartProduct) => p.brand_slug === brand.toLowerCase());
  }

  if (category && category !== 'all') {
    list = list.filter(
      (p: PartProduct) => p.category_slug === category.toLowerCase()
    );
  }

  if (make && make !== 'all') {
    list = list.filter((p: PartProduct) =>
      p.compatibility.some((v) => v.make.toLowerCase() === make.toLowerCase())
    );
  }

  if (in_stock === 'true') {
    list = list.filter((p: PartProduct) => p.stock > 0 && p.status === 'Active');
  }

  if (typeof max_price === 'number' && max_price > 0) {
    list = list.filter((p: PartProduct) => p.price <= max_price);
  }

  if (sort === 'newest') {
    list.sort(
      (a: PartProduct, b: PartProduct) =>
        +new Date(b.created_at) - +new Date(a.created_at)
    );
  } else if (sort === 'price_asc') {
    list.sort((a: PartProduct, b: PartProduct) => a.price - b.price);
  } else if (sort === 'price_desc') {
    list.sort((a: PartProduct, b: PartProduct) => b.price - a.price);
  } else if (sort === 'rating_desc') {
    list.sort((a: PartProduct, b: PartProduct) => b.rating - a.rating);
  } else {
    list.sort(
      (a: PartProduct, b: PartProduct) =>
        Number(b.is_featured) - Number(a.is_featured)
    );
  }

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    parts: list.slice((safePage - 1) * limit, safePage * limit),
    total,
    page: safePage,
    totalPages,
  };
}

export async function getPartBySlug(
  slug: string
): Promise<PartProduct | null> {
  const s = await createServerSupabaseClient();
  if (!s) return null;
  const query = await productQuery(s);
  const { data, error } = await query.eq('slug', slug).maybeSingle();
  return error || !data ? null : mapProduct(data);
}

function mapService(row: any): AutomotiveService {
  const imgs = Array.isArray(row.service_images)
    ? [...row.service_images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : [];
  const primary = imgs.find((x: any) => x.is_primary) || imgs[0];
  return {
    id: row.id,
    slug: row.slug,
    service_code: row.slug,
    name: row.name,
    category: row.service_categories?.name || 'Periodic Maintenance',
    price: Number(row.price || 0),
    duration_minutes: Number(row.duration_minutes || 0),
    duration_label: row.duration_minutes
      ? `${row.duration_minutes} mins`
      : 'By inspection',
    availability:
      row.is_active && row.is_bookable ? 'Available' : 'Unavailable',
    description: row.description || row.short_description || '',
    included_operations: [],
    recommended_interval: '',
    image_url: resolveDisplayImageUrl(
      storageUrl('service-images', primary?.storage_path),
      '/images/hero_parts_workshop.jpg'
    ),
  } as AutomotiveService;
}

export async function getServices(): Promise<AutomotiveService[]> {
  const s = await createServerSupabaseClient();
  if (!s) return [];
  const { data, error } = await s
    .from('services')
    .select(
      '*,service_categories(name,slug),service_images(storage_path,is_primary,sort_order)'
    )
    .eq('is_active', true)
    .order('name');
  return error ? [] : (data || []).map(mapService);
}

export async function getServiceBySlug(
  slug: string
): Promise<AutomotiveService | null> {
  const s = await createServerSupabaseClient();
  if (!s) return null;
  const { data, error } = await s
    .from('services')
    .select(
      '*,service_categories(name,slug),service_images(storage_path,is_primary,sort_order)'
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return error || !data ? null : mapService(data);
}

export async function getBrands(): Promise<(Brand & { part_count: number })[]> {
  const s = await createServerSupabaseClient();
  if (!s) return [];
  const { data, error } = await s
    .from('brands')
    .select('*,products(id)')
    .eq('is_active', true)
    .order('name');
  return error
    ? []
    : (data || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        country: '',
        specialty: '',
        warranty_policy: '',
        description: b.description || '',
        image_url: b.logo_url
          ? resolveDisplayImageUrl(storageUrl('product-images', b.logo_url))
          : undefined,
        part_count: Array.isArray(b.products) ? b.products.length : 0,
      }));
}

export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  const s = await createServerSupabaseClient();
  if (!s) return null;
  const { data, error } = await s
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return error || !data
    ? null
    : {
        id: data.id,
        name: data.name,
        slug: data.slug,
        country: '',
        specialty: '',
        warranty_policy: '',
        description: data.description || '',
        image_url: data.logo_url
          ? resolveDisplayImageUrl(storageUrl('product-images', data.logo_url))
          : undefined,
      };
}

export async function getCategories(): Promise<
  (Category & { part_count: number })[]
> {
  const s = await createServerSupabaseClient();
  if (!s) return [];
  const { data, error } = await s
    .from('categories')
    .select('*,products(id)')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  return error
    ? []
    : (data || []).map((x: any) => ({
        id: x.id,
        name: x.name,
        slug: x.slug,
        description: x.description || '',
        common_parts: '',
        image_url: x.image_url
          ? resolveDisplayImageUrl(storageUrl('product-images', x.image_url))
          : undefined,
        part_count: Array.isArray(x.products) ? x.products.length : 0,
      }));
}

export async function getCategoryBySlug(
  slug: string
): Promise<Category | null> {
  const s = await createServerSupabaseClient();
  if (!s) return null;
  const { data, error } = await s
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return error || !data
    ? null
    : {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        common_parts: '',
        image_url: data.image_url
          ? resolveDisplayImageUrl(storageUrl('product-images', data.image_url))
          : undefined,
      };
}

export async function getVlogs(): Promise<VlogPost[]> {
  const s = await createServerSupabaseClient();
  if (!s) return [];
  const { data, error } = await s
    .from('daily_posts')
    .select(
      '*,daily_post_media(storage_path,thumbnail_path,media_type,sort_order),daily_post_likes(id),daily_post_comments(id,content,created_at,profiles(full_name))'
    )
    .eq('is_published', true)
    .order('published_at', { ascending: false });
  if (error) return [];
  return (data || []).map((x: any, i) => {
    const mediaList = Array.isArray(x.daily_post_media)
      ? [...x.daily_post_media].sort(
          (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
        )
      : [];
    const videoRow = mediaList.find((m: any) => m.media_type === 'video');
    const imageRow =
      mediaList.find((m: any) => m.media_type === 'image') || mediaList[0];

    const rawVideo =
      videoRow?.storage_path ||
      (imageRow?.storage_path && isVideoMediaUrl(imageRow.storage_path)
        ? imageRow.storage_path
        : undefined);
    const rawThumb =
      imageRow?.thumbnail_path ||
      (imageRow?.storage_path && !isVideoMediaUrl(imageRow.storage_path)
        ? imageRow.storage_path
        : undefined) ||
      videoRow?.thumbnail_path ||
      rawVideo;

    return {
      id: x.id,
      slug: x.id,
      episode_number: data.length - i,
      title: x.title || 'NorthBros Garage Workshop Update',
      published_at: x.published_at || x.created_at,
      duration: '14:30',
      author_name: 'NorthBros Garage',
      author_role: 'Workshop',
      category: 'Service Bay Vlog',
      summary: x.caption || '',
      content: x.caption ? [x.caption] : [],
      thumbnail_url: resolveDisplayImageUrl(
        storageUrl('daily-shop', rawThumb),
        '/images/hero_parts_workshop.jpg'
      ),
      video_url: rawVideo ? storageUrl('daily-shop', rawVideo) : undefined,
      media_type: rawVideo ? 'video' : 'image',
      video_highlights: [],
      views_count: 0,
      likes_count: x.daily_post_likes?.length || 0,
      comments: (x.daily_post_comments || []).map((c: any) => ({
        id: c.id,
        user_name: c.profiles?.full_name || 'Customer',
        created_at: c.created_at,
        text: c.content,
      })),
    } as VlogPost;
  });
}

export async function getInitialServiceBookings(): Promise<ServiceBooking[]> {
  return [];
}

export async function getInitialOrders(): Promise<Order[]> {
  return [];
}
