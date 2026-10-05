'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  clearLocalAuthCookieBackup,
  createClient,
} from '@/lib/supabase/client';
import { resolveUserRole } from '@/lib/auth/role';
import {
  isVideoMediaUrl,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
import {
  AutomotiveService,
  Brand,
  CartItem,
  Category,
  Order,
  OrderFulfillmentStatus,
  PartProduct,
  PaymentStatus,
  ProductStatus,
  ServiceBooking,
  ServiceBookingStatus,
  UserProfile,
  VlogPost,
} from '@/types/database';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StoreContextType {
  parts: PartProduct[];
  brands: Brand[];
  categories: Category[];
  services: AutomotiveService[];
  serviceBookings: ServiceBooking[];
  vlogs: VlogPost[];
  favorites: string[];
  cart: CartItem[];
  orders: Order[];
  customerVehicles: import('@/types/database').CustomerVehicle[];
  user: UserProfile | null;
  isHydrated: boolean;
  refreshAuth: () => Promise<void>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  toggleFavorite: (partId: string) => Promise<void>;
  addToCart: (part: PartProduct, quantity?: number) => Promise<boolean>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  createOrder: (payload: {
    recipient_name: string;
    phone: string;
    address_line: string;
    barangay?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    payment_method_code: string;
    customer_notes?: string;
    promotion_code?: string;
    idempotency_key: string;
    items: Array<{ product_id: string; quantity: number }>;
  }) => Promise<{
    id: string;
    order_number: string;
    subtotal: number;
    shipping_fee: number;
    total_amount: number;
    discount_amount?: number;
  }>;
  createServiceBooking: (payload: {
    service_id: string;
    branch_id?: string;
    customer_vehicle_id?: string;
    scheduled_start: string;
    scheduled_end?: string;
    notes?: string;
  }) => Promise<{
    id: string;
    appointment_number: string;
    service_name: string;
    service_price: number;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  }>;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addPart: (part: Omit<PartProduct, 'id' | 'created_at'>) => Promise<PartProduct>;
  updatePart: (id: string, updates: Partial<PartProduct>) => Promise<void>;
  deletePart: (id: string) => Promise<void>;
  updatePartStatus: (id: string, status: ProductStatus) => Promise<void>;
  addService: (srv: Omit<AutomotiveService, 'id'>) => Promise<AutomotiveService>;
  updateService: (
    id: string,
    updates: Partial<AutomotiveService>
  ) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  updateServiceBookingStatus: (
    id: string,
    status: ServiceBookingStatus
  ) => Promise<void>;
  updateOrderStatus: (
    id: string,
    fulfillmentStatus: OrderFulfillmentStatus,
    paymentStatus?: PaymentStatus
  ) => Promise<void>;
  addBrand: (brand: Omit<Brand, 'id'>) => Promise<void>;
  updateBrand: (id: string, updates: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addVlog: (
    vlog: Omit<VlogPost, 'id' | 'views_count' | 'likes_count' | 'comments'>
  ) => Promise<VlogPost>;
  updateVlog: (id: string, updates: Partial<VlogPost>) => Promise<void>;
  deleteVlog: (id: string) => Promise<void>;
  likeVlog: (vlogId: string) => Promise<void>;
  addVlogComment: (
    vlogId: string,
    userName: string,
    text: string
  ) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
const sb = () => createClient();

function publicStorageUrl(bucket: string, path: string | null | undefined) {
  if (!path) return '/images/hero_parts_workshop.jpg';
  if (
    /^https?:\/\//i.test(path) ||
    path.startsWith('/') ||
    /^data:/i.test(path)
  ) {
    return path;
  }
  const client = sb();
  return client
    ? client.storage.from(bucket).getPublicUrl(path).data.publicUrl
    : path;
}

async function resolveVehicleVariantId(
  client: any,
  compatibility: { make?: string; model?: string; years?: string; engine?: string }
): Promise<string | null> {
  const make = compatibility.make?.trim().toLowerCase();
  const model = compatibility.model?.trim().toLowerCase();
  const engine = compatibility.engine?.trim().toLowerCase();
  const years = compatibility.years?.trim() || '';
  if (!make && !model && !engine && !years) return null;

  const { data } = await client
    .from('vehicle_variants')
    .select('id,name,year_from,year_to,engine,engine_code,vehicle_models(name,vehicle_makes(name))')
    .eq('is_active', true);

  const parseYearRange = (value: string) => {
    const parts = value.match(/(\d{4}).*?(\d{4})/);
    return parts ? [Number(parts[1]), Number(parts[2])] : [Number(value) || 0, Number(value) || 0];
  };
  const [fromYear, toYear] = parseYearRange(years);

  const found = (data || []).find((v: any) => {
    const vMake = String(v.vehicle_models?.vehicle_makes?.name || '').toLowerCase();
    const vModel = String(v.vehicle_models?.name || '').toLowerCase();
    const vEngine = [v.engine, v.engine_code].filter(Boolean).join(' ').toLowerCase();
    const makeOk = !make || vMake === make || vMake.includes(make) || make.includes(vMake);
    const modelOk = !model || vModel === model || vModel.includes(model) || model.includes(vModel) || String(v.name || '').toLowerCase().includes(model);
    const engineOk = !engine || vEngine.includes(engine) || engine.includes(vEngine);
    const yearOk =
      !fromYear ||
      !v.year_from ||
      ((v.year_from ?? 0) <= toYear && (v.year_to ?? fromYear) >= fromYear);
    return makeOk && modelOk && engineOk && yearOk;
  });
  return found?.id || null;
}

function mapProduct(row: any): PartProduct {
  const images = Array.isArray(row.product_images)
    ? [...row.product_images].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )
    : [];
  const primary = images.find((x: any) => x.is_primary) || images[0];
  const inventories = Array.isArray(row.inventory) ? row.inventory : [];
  const stock = inventories.reduce(
    (n: number, x: any) =>
      n + Math.max(0, (x.quantity ?? 0) - (x.reserved_quantity ?? 0)),
    0
  );
  const reviews = Array.isArray(row.product_reviews) ? row.product_reviews : [];
  const averageRating = reviews.length > 0 ? reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const statusMap: any = {
    in_stock: 'Active',
    low_stock: 'Active',
    out_of_stock: 'Out of Stock',
    pre_order: 'Active',
    discontinued: 'Archived',
  };
  const compatibility = Array.isArray(row.product_vehicle_compatibility)
    ? row.product_vehicle_compatibility.map((x: any) => {
        const v = x.vehicle_variants,
          m = v?.vehicle_models,
          make = m?.vehicle_makes;
        return {
          make: make?.name || '',
          model: m?.name || v?.name || '',
          years:
            v?.year_from && v?.year_to
              ? String(v.year_from) + '-' + String(v.year_to)
              : '',
          engine: v?.engine || v?.engine_code || '',
        };
      })
    : [];

  const resolvedPrimary = resolveDisplayImageUrl(
    publicStorageUrl('product-images', primary?.storage_path),
    '/images/part_brake_pad.jpg'
  );
  const resolvedGallery =
    images.length > 0
      ? images.map((x: any) =>
          resolveDisplayImageUrl(
            publicStorageUrl('product-images', x.storage_path),
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
    status: statusMap[row.stock_status] || 'Active',
    rating: Number(averageRating.toFixed(1)),
    review_count: reviews.length,
    is_featured: !!row.is_featured,
    primary_image: resolvedPrimary,
    gallery_images: resolvedGallery,
    description: row.description || row.short_description || '',
    specifications: {},
    compatibility,
    created_at: row.created_at,
  };
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
    category: row.service_categories?.name || 'Uncategorized',
    price: Number(row.price || 0),
    price_type: row.price_type || 'fixed',
    duration_minutes: Number(row.duration_minutes || 0),
    is_bookable: !!row.is_bookable,
    requires_inspection: !!row.requires_inspection,
    duration_label: row.duration_minutes
      ? row.duration_minutes + ' mins'
      : 'By inspection',
    availability:
      row.is_active && row.is_bookable ? 'Available' : 'Unavailable',
    description: row.description || row.short_description || '',
    included_operations: [],
    recommended_interval: row.recommended_interval || '',
    image_url: resolveDisplayImageUrl(
      publicStorageUrl('service-images', primary?.storage_path),
      '/images/hero_parts_workshop.jpg'
    ),
  };
}

function mapOrder(row: any): Order {
  const addr = row.addresses || {};
  const items = Array.isArray(row.order_items)
    ? row.order_items.map((i: any) => ({
        product_id: i.product_id || '',
        product_slug: i.products?.slug || '',
        sku: i.sku || '',
        name: i.product_name,
        brand_name: i.products?.brands?.name || '',
        unit_price: Number(i.unit_price || 0),
        quantity: i.quantity,
        subtotal: Number(i.subtotal || 0),
        image: resolveDisplayImageUrl(
          publicStorageUrl(
            'product-images',
            i.products?.product_images?.find((x: any) => x.is_primary)
              ?.storage_path || i.products?.product_images?.[0]?.storage_path
          ),
          '/images/part_brake_pad.jpg'
        ),
      }))
    : [];
  const payment = Array.isArray(row.payments) ? row.payments[0] : row.payments;
  const pm: any = {
    gcash: 'GCash',
    maya: 'Maya',
    gotyme: 'GoTyme / QR Ph',
    cod: 'Cash on Delivery (COD)',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
  };
  const fs: any = {
    pending: 'Processing',
    confirmed: 'Processing',
    processing: 'Processing',
    ready_for_pickup: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Cancelled',
  };
  const ps: any = {
    pending: 'Pending Verification',
    paid: 'Paid',
    failed: 'Pending Verification',
    refunded: 'Pending Verification',
    partially_refunded: 'Pending Verification',
  };
  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.customer_id,
    customer_name: addr.recipient_name || '',
    customer_email: '',
    customer_phone: addr.phone || '',
    shipping_address: addr.address_line || '',
    shipping_city: [addr.city, addr.province].filter(Boolean).join(', '),
    shipping_postal_code: addr.postal_code || '',
    payment_method: payment?.payment_methods?.name || pm[payment?.method] || payment?.method || '',
    payment_status: ps[payment?.status] || 'Pending Verification',
    fulfillment_status: fs[row.status] || 'Processing',
    items,
    subtotal: Number(row.subtotal || 0),
    shipping_fee: Number(row.shipping_fee || 0),
    discount_amount: Number(row.discount_amount || 0),
    total_amount: Number(row.total_amount || 0),
    notes: row.customer_notes || undefined,
    created_at: row.created_at,
  };
}

async function syncServerCookies(session: any) {
  if (!session?.access_token || !session?.refresh_token) return;
  try {
    await fetch('/api/auth/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }),
    });
  } catch {
    // ignore background sync errors
  }
}

async function loadProfile(
  id: string,
  authUserOverride?: any
): Promise<UserProfile | null> {
  const c = sb();
  if (!c) return null;
  let authUser = authUserOverride;
  if (!authUser) {
    const {
      data: { session },
    } = await c.auth.getSession();
    authUser = session?.user;
    if (!authUser) {
      const {
        data: { user },
      } = await c.auth.getUser();
      authUser = user;
    }
  }
  const [{ data: profile }, { data: address }] = await Promise.all([
    c.from('profiles').select('*').eq('id', id).maybeSingle(),
    c
      .from('addresses')
      .select('*')
      .eq('customer_id', id)
      .eq('is_default', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!authUser || authUser.id !== id) return null;
  const role = resolveUserRole(authUser, profile);
  return {
    id,
    name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.email?.split('@')[0] ||
      '',
    email: profile?.email || authUser.email || '',
    phone: profile?.phone || authUser.user_metadata?.phone || '',
    address: address?.address_line || '',
    city: [address?.city, address?.province].filter(Boolean).join(', '),
    postal_code: address?.postal_code || '',
    role,
    created_at: profile?.created_at || authUser.created_at,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [parts, setParts] = useState<PartProduct[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<AutomotiveService[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
  const [vlogs, setVlogs] = useState<VlogPost[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerVehicles, setCustomerVehicles] = useState<import('@/types/database').CustomerVehicle[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    text: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = crypto.randomUUID();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3800);
  };

  const loadVlogs = async () => {
    const c = sb();
    if (!c) return;
    const { data, error } = await c
      .from('daily_posts')
      .select(
        '*,daily_post_media(storage_path,thumbnail_path,media_type,sort_order),daily_post_likes(id),daily_post_comments(id,content,created_at,profiles(full_name))'
      )
      .eq('is_published', true)
      .order('published_at', { ascending: false });
    if (error) return;
    setVlogs(
      (data || []).map((x: any, i: number) => {
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

        const postTypeMap: Record<string, VlogPost['category']> = {
          behind_the_scenes: 'Service Bay Vlog',
          installation: 'Part Install Guide',
          repair: 'Dyno & Diagnostics',
          new_arrival: 'Tool & Part Review',
          shop_update: 'Service Bay Vlog',
        };

        return {
          id: x.id,
          slug: x.id,
          episode_number: data!.length - i,
          title: x.title || 'NorthBros Garage Workshop Update',
          published_at: x.published_at || x.created_at,
          duration: '14:30',
          author_name: 'NorthBros Garage',
          author_role: 'Workshop',
          category: postTypeMap[x.post_type] || 'Service Bay Vlog',
          summary: x.caption || '',
          content: x.caption ? x.caption.split('\n\n') : [],
          thumbnail_url: resolveDisplayImageUrl(
            publicStorageUrl('daily-shop', rawThumb),
            '/images/hero_parts_workshop.jpg'
          ),
          video_url: rawVideo
            ? publicStorageUrl('daily-shop', rawVideo)
            : undefined,
          media_type: rawVideo ? 'video' : 'image',
          video_highlights: [
            {
              timestamp: '00:00',
              label: 'Workshop bay inspection & overview',
            },
            {
              timestamp: '04:30',
              label: 'Step-by-step installation & torque specs',
            },
          ],
          views_count: 0,
          likes_count: x.daily_post_likes?.length || 0,
          comments: (x.daily_post_comments || []).map((cm: any) => ({
            id: cm.id,
            user_name: cm.profiles?.full_name || 'Customer',
            created_at: cm.created_at,
            text: cm.content,
          })),
        };
      })
    );
  };

  const loadCatalog = async () => {
    const c = sb();
    if (!c) return;
    const [p, b, cat, s] = await Promise.all([
      c
        .from('products')
        .select(
          '*,brands(name,slug),categories(name,slug),product_images(storage_path,alt_text,sort_order,is_primary),inventory(quantity,reserved_quantity),product_vehicle_compatibility(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*)))),product_reviews(rating)'
        )
        .eq('is_active', true),
      c.from('brands').select('*').eq('is_active', true).order('name'),
      c
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .order('name'),
      c
        .from('services')
        .select(
          '*,service_categories(name,slug),service_images(storage_path,is_primary,sort_order)'
        )
        .eq('is_active', true)
        .order('name'),
    ]);
    if (!p.error) setParts((p.data || []).map(mapProduct));
    if (!b.error)
      setBrands(
        (b.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          slug: x.slug,
          country: 'OEM Authorized',
          specialty: 'Automotive Parts & Components',
          warranty_policy: 'Official Manufacturer Warranty',
          description: x.description || '',
          image_url: x.logo_url
            ? resolveDisplayImageUrl(
                publicStorageUrl('product-images', x.logo_url)
              )
            : undefined,
        }))
      );
    if (!cat.error)
      setCategories(
        (cat.data || []).map((x: any) => ({
          id: x.id,
          name: x.name,
          slug: x.slug,
          description: x.description || '',
          common_parts: 'OEM Replacement & Performance Components',
          image_url: x.image_url
            ? resolveDisplayImageUrl(
                publicStorageUrl('product-images', x.image_url)
              )
            : undefined,
        }))
      );
    if (!s.error) setServices((s.data || []).map(mapService));
  };

  const loadAdminData = async () => {
    const c = sb();
    if (!c) return;
    const [ord, ap] = await Promise.all([
      c
        .from('orders')
        .select(
          '*,profiles(full_name,email,phone),addresses(*),order_items(*,products(slug,brands(name),product_images(storage_path,is_primary))),payments(*,payment_methods(name))'
        )
        .order('created_at', { ascending: false }),
      c
        .from('appointments')
        .select(
          '*,profiles(full_name,email,phone),appointment_services(*,services(name,price,slug)),customer_vehicles(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))'
        )
        .order('scheduled_start', { ascending: false }),
    ]);
    if (!ord.error) setOrders((ord.data || []).map(mapOrder));
    if (!ap.error)
      setServiceBookings(
        (ap.data || []).map((x: any) => {
          const as = x.appointment_services?.[0],
            cv = x.customer_vehicles?.vehicle_variants,
            mm = cv?.vehicle_models,
            mk = mm?.vehicle_makes;
          const st: any = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            checked_in: 'Confirmed',
            in_progress: 'In Service Bay',
            completed: 'Completed',
            cancelled: 'Cancelled',
            no_show: 'Cancelled',
          };
          return {
            id: x.id,
            booking_reference: x.appointment_number,
            service_id: as?.service_id || '',
            service_slug: as?.services?.slug || '',
            service_name: as?.services?.name || '',
            service_price: Number(as?.unit_price || as?.services?.price || 0),
            user_id: x.customer_id,
            customer_name: x.profiles?.full_name || '',
            customer_email: x.profiles?.email || '',
            customer_phone: x.profiles?.phone || '',
            vehicle_details: [mk?.name, mm?.name, cv?.name]
              .filter(Boolean)
              .join(' '),
            preferred_date: new Date(x.scheduled_start).toLocaleDateString(
              'en-CA',
              { timeZone: 'Asia/Manila' }
            ),
            preferred_time: new Date(x.scheduled_start).toLocaleTimeString(
              'en-PH',
              {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Manila',
              }
            ),
            notes: x.customer_notes || '',
            status: st[x.status] || 'Pending',
            created_at: x.created_at,
          };
        })
      );
  };

  const loadCustomerVehicles = async (id: string) => {
    const c = sb();
    if (!c) return;
    const { data, error } = await c
      .from('customer_vehicles')
      .select('id,customer_id,vehicle_variant_id,nickname,plate_number,vin,current_mileage,notes,created_at,updated_at,vehicle_variants(name,year_from,year_to,engine,transmission,fuel_type,body_type,drive_type,vehicle_models(name,vehicle_makes(name)))')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setCustomerVehicles((data || []).map((row: any) => ({
      id: row.id,
      customer_id: row.customer_id,
      vehicle_variant_id: row.vehicle_variant_id,
      nickname: row.nickname || undefined,
      plate_number: row.plate_number || undefined,
      vin: row.vin || undefined,
      current_mileage: row.current_mileage == null ? undefined : Number(row.current_mileage),
      notes: row.notes || undefined,
      make_name: row.vehicle_variants?.vehicle_models?.vehicle_makes?.name || '',
      model_name: row.vehicle_variants?.vehicle_models?.name || '',
      variant_name: row.vehicle_variants?.name || '',
      year_from: row.vehicle_variants?.year_from || undefined,
      year_to: row.vehicle_variants?.year_to || undefined,
      engine: row.vehicle_variants?.engine || undefined,
      transmission: row.vehicle_variants?.transmission || undefined,
      fuel_type: row.vehicle_variants?.fuel_type || undefined,
      body_type: row.vehicle_variants?.body_type || undefined,
      drive_type: row.vehicle_variants?.drive_type || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })));
  };

  const loadCustomerData = async (id: string) => {
    const c = sb();
    if (!c) return;
    await loadCustomerVehicles(id);
    const [fav, ci, ord, ap] = await Promise.all([
      c.from('favorites').select('product_id').eq('customer_id', id),
      c
        .from('carts')
        .select(
          'id,cart_items(product_id,quantity,unit_price,products(id,slug,sku,name,price,brands(name),product_images(storage_path,is_primary)))'
        )
        .eq('customer_id', id)
        .eq('status', 'active')
        .maybeSingle(),
      c
        .from('orders')
        .select(
          '*,profiles(full_name,email,phone),addresses(*),order_items(*,products(slug,brands(name),product_images(storage_path,is_primary))),payments(*)'
        )
        .eq('customer_id', id)
        .order('created_at', { ascending: false }),
      c
        .from('appointments')
        .select(
          '*,profiles(full_name,email,phone),appointment_services(*,services(name,price,slug)),customer_vehicles(*,vehicle_variants(*,vehicle_models(*,vehicle_makes(*))))'
        )
        .eq('customer_id', id)
        .order('scheduled_start', { ascending: false }),
    ]);
    if (!fav.error) setFavorites((fav.data || []).map((x: any) => x.product_id));
    if (!ci.error && ci.data) {
      const raw = (ci.data as any).cart_items || [];
      setCart(
        raw.map((x: any) => ({
          product_id: x.product_id,
          product_slug: x.products?.slug || '',
          sku: x.products?.sku || '',
          name: x.products?.name || '',
          brand_name: x.products?.brands?.name || '',
          unit_price: Number(x.unit_price || x.products?.price || 0),
          quantity: x.quantity,
          max_stock: 999999,
          image: resolveDisplayImageUrl(
            publicStorageUrl(
              'product-images',
              x.products?.product_images?.find((i: any) => i.is_primary)
                ?.storage_path || x.products?.product_images?.[0]?.storage_path
            ),
            '/images/part_brake_pad.jpg'
          ),
        }))
      );
    } else setCart([]);
    if (!ord.error) setOrders((ord.data || []).map(mapOrder));
    if (!ap.error)
      setServiceBookings(
        (ap.data || []).map((x: any) => {
          const as = x.appointment_services?.[0];
          const cv = x.customer_vehicles?.vehicle_variants;
          const mm = cv?.vehicle_models;
          const mk = mm?.vehicle_makes;
          const st: any = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            checked_in: 'Confirmed',
            in_progress: 'In Service Bay',
            completed: 'Completed',
            cancelled: 'Cancelled',
            no_show: 'Cancelled',
          };
          return {
            id: x.id,
            booking_reference: x.appointment_number,
            service_id: as?.service_id || '',
            service_slug: as?.services?.slug || '',
            service_name: as?.services?.name || '',
            service_price: Number(as?.unit_price || as?.services?.price || 0),
            user_id: x.customer_id,
            customer_name: x.profiles?.full_name || '',
            customer_email: x.profiles?.email || '',
            customer_phone: x.profiles?.phone || '',
            vehicle_details: [mk?.name, mm?.name, cv?.name]
              .filter(Boolean)
              .join(' '),
            preferred_date: new Date(x.scheduled_start).toLocaleDateString(
              'en-CA',
              { timeZone: 'Asia/Manila' }
            ),
            preferred_time: new Date(x.scheduled_start).toLocaleTimeString(
              'en-PH',
              {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Manila',
              }
            ),
            notes: x.customer_notes || '',
            status: st[x.status] || 'Pending',
            created_at: x.created_at,
          };
        })
      );
  };

  useEffect(() => {
    let mounted = true;
    const c = sb();
    (async () => {
      if (c) {
        const {
          data: { session },
        } = await c.auth.getSession();
        let authUser = session?.user || null;
        if (!authUser) {
          const {
            data: { user: fetchedUser },
          } = await c.auth.getUser();
          authUser = fetchedUser;
        }
        if (mounted && authUser) {
          if (session) void syncServerCookies(session);
          const p = await loadProfile(authUser.id, authUser);
          if (mounted && p) setUser(p);
          await loadCustomerData(authUser.id);
          if (p?.role === 'admin') await loadAdminData();
        }
        await loadCatalog();
        await loadVlogs();
      }
      if (mounted) setIsHydrated(true);
    })();
    if (!c)
      return () => {
        mounted = false;
      };
    const {
      data: { subscription },
    } = c.auth.onAuthStateChange((event: any, session: any) => {
      if (!mounted) return;
      if (session?.user) {
        void syncServerCookies(session);
        setTimeout(async () => {
          const p = await loadProfile(session.user.id, session.user);
          if (mounted && p) setUser(p);
          await loadCustomerData(session.user.id);
          if (p?.role === 'admin') await loadAdminData();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFavorites([]);
        setCart([]);
        setOrders([]);
        setServiceBookings([]);
        setCustomerVehicles([]);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const ensureCart = async () => {
    if (!user)
      throw new Error('Please sign in before adding items to your cart.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    let { data } = await c
      .from('carts')
      .select('id')
      .eq('customer_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!data) {
      const r = await c
        .from('carts')
        .insert({ customer_id: user.id, status: 'active' })
        .select('id')
        .single();
      if (r.error) throw r.error;
      data = r.data;
    }
    return data.id;
  };

  const toggleFavorite = async (partId: string) => {
    if (!user) {
      showToast('Please sign in to save parts.', 'error');
      return;
    }
    const c = sb();
    if (!c) return;
    if (favorites.includes(partId)) {
      const r = await c
        .from('favorites')
        .delete()
        .eq('customer_id', user.id)
        .eq('product_id', partId);
      if (r.error) showToast(r.error.message, 'error');
      else setFavorites((p) => p.filter((x) => x !== partId));
    } else {
      const r = await c
        .from('favorites')
        .insert({ customer_id: user.id, product_id: partId });
      if (r.error) showToast(r.error.message, 'error');
      else setFavorites((p) => [...p, partId]);
    }
  };

  const addToCart = async (part: PartProduct, quantity = 1) => {
    if (part.stock <= 0 || part.status !== 'Active') {
      showToast('This part is currently out of stock.', 'error');
      return false;
    }
    try {
      const c = sb();
      if (!c) throw new Error('Supabase is not configured.');
      const cartId = await ensureCart();
      const { data: existing } = await c
        .from('cart_items')
        .select('id,quantity')
        .eq('cart_id', cartId)
        .eq('product_id', part.id)
        .maybeSingle();
      const next = Math.min(part.stock, (existing?.quantity || 0) + quantity);
      const r = existing
        ? await c
            .from('cart_items')
            .update({ quantity: next, unit_price: part.price })
            .eq('id', existing.id)
        : await c.from('cart_items').insert({
            cart_id: cartId,
            product_id: part.id,
            quantity: Math.min(part.stock, quantity),
            unit_price: part.price,
          });
      if (r.error) throw r.error;
      await loadCustomerData(user!.id);
      showToast('Added to cart.');
      return true;
    } catch (e: any) {
      showToast(e.message || 'Unable to update cart.', 'error');
      return false;
    }
  };

  const updateCartQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    const c = sb();
    if (!c) return;
    try {
      const cartId = await ensureCart();
      if (quantity <= 0)
        await c
          .from('cart_items')
          .delete()
          .eq('cart_id', cartId)
          .eq('product_id', productId);
      else
        await c
          .from('cart_items')
          .update({ quantity })
          .eq('cart_id', cartId)
          .eq('product_id', productId);
      await loadCustomerData(user.id);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const removeFromCart = async (productId: string) =>
    updateCartQuantity(productId, 0);

  const clearCart = async () => {
    if (!user) return;
    const c = sb();
    if (!c) return;
    const id = await ensureCart();
    const r = await c.from('cart_items').delete().eq('cart_id', id);
    if (r.error) showToast(r.error.message, 'error');
    else setCart([]);
  };

  const addCustomerVehicle = async (input: { vehicle_variant_id: string; nickname?: string; plate_number?: string; vin?: string; current_mileage?: number; notes?: string }) => {
    if (!user) throw new Error('Please sign in to manage vehicles.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const { error } = await c.from('customer_vehicles').insert({
      customer_id: user.id,
      vehicle_variant_id: input.vehicle_variant_id,
      nickname: input.nickname?.trim() || null,
      plate_number: input.plate_number?.trim() || null,
      vin: input.vin?.trim() || null,
      current_mileage: input.current_mileage == null ? null : input.current_mileage,
      notes: input.notes?.trim() || null,
    });
    if (error) throw error;
    await loadCustomerVehicles(user.id);
    showToast('Vehicle added.');
  };

  const updateCustomerVehicle = async (id: string, input: Partial<{ nickname: string; plate_number: string; vin: string; current_mileage: number | null; notes: string }>) => {
    if (!user) throw new Error('Please sign in to manage vehicles.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const { error } = await c.from('customer_vehicles').update({
      nickname: input.nickname?.trim() || null,
      plate_number: input.plate_number?.trim() || null,
      vin: input.vin?.trim() || null,
      current_mileage: input.current_mileage == null ? null : input.current_mileage,
      notes: input.notes?.trim() || null,
    }).eq('id', id).eq('customer_id', user.id);
    if (error) throw error;
    await loadCustomerVehicles(user.id);
    showToast('Vehicle updated.');
  };

  const deleteCustomerVehicle = async (id: string) => {
    if (!user) throw new Error('Please sign in to manage vehicles.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const { error } = await c.from('customer_vehicles').delete().eq('id', id).eq('customer_id', user.id);
    if (error) throw error;
    await loadCustomerVehicles(user.id);
    showToast('Vehicle removed.');
  };

  const createOrder = async (payload: any) => {
    if (!user) throw new Error('Please sign in before checkout.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const { data, error } = await c.rpc('create_customer_order', {
      p_payload: payload,
    });
    if (error) throw error;
    await loadCustomerData(user.id);
    showToast('Order created successfully.');
    return data;
  };

  const createServiceBooking = async (payload: any) => {
    if (!user) throw new Error('Please sign in before booking a service.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const { data, error } = await c.rpc('create_customer_appointment', {
      p_service_id: payload.service_id,
      p_branch_id: payload.branch_id || null,
      p_customer_vehicle_id: payload.customer_vehicle_id || null,
      p_scheduled_start: payload.scheduled_start,
      p_scheduled_end: payload.scheduled_end || null,
      p_notes: payload.notes || null,
    });
    if (error) throw error;
    await loadCustomerData(user.id);
    showToast('Service appointment request submitted.');
    return data;
  };

  const refreshAuth = useCallback(async () => {
    const c = sb();
    if (!c) return;
    const {
      data: { session },
    } = await c.auth.getSession();
    let authUser = session?.user || null;
    if (!authUser) {
      const {
        data: { user: fetched },
      } = await c.auth.getUser();
      authUser = fetched;
    }
    if (!authUser) {
      return;
    }
    if (session) void syncServerCookies(session);
    const p = await loadProfile(authUser.id, authUser);
    if (p) setUser(p);
    await loadCustomerData(authUser.id);
    if (p?.role === 'admin') await loadAdminData();
  }, []);

  const login = async (email: string, password: string) => {
    const c = sb();
    if (!c) {
      showToast('Supabase is not configured.', 'error');
      return false;
    }
    const { data, error } = await c.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.user) {
      showToast(error?.message || 'Invalid email or password.', 'error');
      return false;
    }
    if (data.session) {
      await syncServerCookies(data.session);
    }
    const p = await loadProfile(data.user.id, data.user);
    if (p) setUser(p);
    await loadCustomerData(data.user.id);
    if (p?.role === 'admin') {
      await loadAdminData();
      showToast('Signed in as Administrator.');
      router.push('/admin');
      router.refresh();
    } else {
      showToast('Signed in successfully.');
      router.push('/account');
      router.refresh();
    }
    return true;
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    const c = sb();
    if (!c) {
      showToast('Supabase is not configured.', 'error');
      return false;
    }
    const { data, error } = await c.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: name.trim(), phone: phone.trim() } },
    });
    if (error) {
      showToast(error.message, 'error');
      return false;
    }
    if (data.user && data.session) {
      await syncServerCookies(data.session);
      const p = await loadProfile(data.user.id, data.user);
      setUser(p);
      showToast('Account created.');
      return true;
    }
    showToast('Account created. Check your email to confirm.', 'info');
    return false;
  };

  const logout = async () => {
    const c = sb();
    if (c) await c.auth.signOut();
    clearLocalAuthCookieBackup();
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signout' }),
      });
    } catch {
      // ignore
    }
    setUser(null);
    setFavorites([]);
    setCart([]);
    setOrders([]);
    setServiceBookings([]);
    showToast('Signed out.');
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const c = sb();
    if (!c) return;
    const patch: any = {};
    if (updates.name !== undefined) patch.full_name = updates.name;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (Object.keys(patch).length) {
      const { error } = await c
        .from('profiles')
        .update(patch)
        .eq('id', user.id);
      if (error) {
        showToast(error.message, 'error');
        return;
      }
    }
    if (
      updates.address !== undefined ||
      updates.city !== undefined ||
      updates.postal_code !== undefined
    ) {
      const addressLine =
        updates.address !== undefined ? updates.address : user.address;
      const cityText = updates.city !== undefined ? updates.city : user.city;
      const partsList = cityText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const province =
        partsList.length > 1 ? partsList.slice(1).join(', ') : null;
      const city = partsList[0] || null;
      const current = (
        await c
          .from('addresses')
          .select('id')
          .eq('customer_id', user.id)
          .eq('is_default', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data;
      const payload: any = {
        customer_id: user.id,
        label: 'Default',
        recipient_name: updates.name !== undefined ? updates.name : user.name,
        phone: updates.phone !== undefined ? updates.phone : user.phone,
        address_line: addressLine || 'N/A',
        city,
        province,
        postal_code:
          updates.postal_code !== undefined
            ? updates.postal_code
            : user.postal_code,
        is_default: true,
      };
      const ar = current
        ? await c.from('addresses').update(payload).eq('id', current.id)
        : await c.from('addresses').insert(payload);
      if (ar.error) {
        showToast(ar.error.message, 'error');
        return;
      }
    }
    const refreshed = await loadProfile(user.id);
    if (refreshed) setUser(refreshed);
    else setUser({ ...user, ...updates });
    showToast('Profile saved.');
  };

  const addPart = async (part: any) => {
    if (!user?.role || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const stockStatus =
      part.stock <= 0
        ? 'out_of_stock'
        : part.stock <= 5
        ? 'low_stock'
        : 'in_stock';
    const { data, error } = await c
      .from('products')
      .insert({
        sku: part.sku,
        name: part.name,
        slug: part.slug,
        brand_id: part.brand_id || null,
        category_id: part.category_id || null,
        price: part.price,
        compare_at_price: part.compare_at_price ?? null,
        description: part.description,
        short_description: part.description,
        is_featured: part.is_featured,
        is_active: part.status !== 'Archived',
        stock_status: stockStatus,
      })
      .select('*')
      .single();
    if (error) throw error;

    const branch = (
      await c
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .order('id')
        .limit(1)
        .maybeSingle()
    ).data;
    if (branch) {
      await c.from('inventory').insert({
        product_id: data.id,
        branch_id: branch.id,
        quantity: part.stock,
        reserved_quantity: 0,
        reorder_level: 5,
      });
    }

    const compatibilityRows = Array.isArray(part.compatibility)
      ? part.compatibility.filter((item: any) => item && [item.make, item.model, item.years, item.engine].some(Boolean))
      : [];
    for (const item of compatibilityRows) {
      const variantId = await resolveVehicleVariantId(c, item);
      if (variantId) {
        const result = await c.from('product_vehicle_compatibility').insert({
          product_id: data.id,
          vehicle_variant_id: variantId,
          fitment_notes: item.engine?.trim() || null,
          is_confirmed: false,
        });
        if (result.error) throw result.error;
      }
    }

    const gallery =
      Array.isArray(part.gallery_images) && part.gallery_images.length > 0
        ? part.gallery_images.filter(Boolean)
        : part.primary_image
        ? [part.primary_image]
        : [];
    if (gallery.length > 0) {
      await c.from('product_images').insert(
        gallery.map((imgUrl: string, idx: number) => ({
          product_id: data.id,
          storage_path: imgUrl,
          alt_text: part.name,
          sort_order: idx,
          is_primary: idx === 0,
        }))
      );
    }

    await loadCatalog();
    showToast('Part added to catalog.');
    return mapProduct({
      ...data,
      product_images: gallery.map((imgUrl: string, idx: number) => ({
        storage_path: imgUrl,
        sort_order: idx,
        is_primary: idx === 0,
      })),
    });
  };

  const updatePart = async (id: string, updates: any) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const patch: any = {};
    for (const k of [
      'sku',
      'name',
      'slug',
      'brand_id',
      'category_id',
      'price',
      'compare_at_price',
      'description',
      'is_featured',
    ])
      if (updates[k] !== undefined) patch[k] = updates[k];
    if (updates.status)
      patch.stock_status =
        updates.status === 'Out of Stock'
          ? 'out_of_stock'
          : updates.status === 'Archived'
          ? 'discontinued'
          : 'in_stock';
    if (Object.keys(patch).length) {
      const r = await c.from('products').update(patch).eq('id', id);
      if (r.error) throw r.error;
    }
    if (updates.stock !== undefined) {
      const { data: i } = await c
        .from('inventory')
        .select('id')
        .eq('product_id', id)
        .order('id')
        .limit(1)
        .maybeSingle();
      if (i)
        await c
          .from('inventory')
          .update({ quantity: updates.stock })
          .eq('id', i.id);
    }

    if (updates.compatibility !== undefined) {
      const compatibilityRows = Array.isArray(updates.compatibility)
        ? updates.compatibility.filter((item: any) => item && [item.make, item.model, item.years, item.engine].some(Boolean))
        : [];
      const del = await c.from('product_vehicle_compatibility').delete().eq('product_id', id);
      if (del.error) throw del.error;
      for (const item of compatibilityRows) {
        const variantId = await resolveVehicleVariantId(c, item);
        if (variantId) {
          const result = await c.from('product_vehicle_compatibility').insert({
            product_id: id,
            vehicle_variant_id: variantId,
            fitment_notes: item.engine?.trim() || null,
            is_confirmed: false,
          });
          if (result.error) throw result.error;
        }
      }
    }

    if (updates.primary_image || updates.gallery_images) {
      const gallery =
        Array.isArray(updates.gallery_images) &&
        updates.gallery_images.length > 0
          ? updates.gallery_images.filter(Boolean)
          : updates.primary_image
          ? [updates.primary_image]
          : [];
      if (gallery.length > 0) {
        await c.from('product_images').delete().eq('product_id', id);
        await c.from('product_images').insert(
          gallery.map((imgUrl: string, idx: number) => ({
            product_id: id,
            storage_path: imgUrl,
            alt_text: updates.name || 'Part Image',
            sort_order: idx,
            is_primary: idx === 0,
          }))
        );
      }
    }

    await loadCatalog();
    showToast('Part updated.');
  };

  const deletePart = async (id: string) => {
    if (!user || user.role !== 'admin') {
      showToast('Administrator authorization required.', 'error');
      return;
    }

    const c = sb();
    if (!c) {
      showToast('Supabase is not configured.', 'error');
      return;
    }

    try {
      // These two relations use RESTRICT and must be removed before the product.
      const cartItemsDelete = await c
        .from('cart_items')
        .delete()
        .eq('product_id', id);
      if (cartItemsDelete.error) throw cartItemsDelete.error;

      const reservationsDelete = await c
        .from('inventory_reservations')
        .delete()
        .eq('product_id', id);
      if (reservationsDelete.error) throw reservationsDelete.error;

      // The remaining product relations use CASCADE/SET NULL where appropriate.
      const productDelete = await c
        .from('products')
        .delete()
        .eq('id', id);
      if (productDelete.error) throw productDelete.error;

      await loadCatalog();
      showToast('Part permanently deleted.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete the part.';
      showToast(message, 'error');
    }
  };

  const updatePartStatus = async (id: string, status: ProductStatus) =>
    updatePart(id, { status });

  const addService = async (srv: any) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const cat = (
      await c
        .from('service_categories')
        .select('id')
        .eq('name', srv.category)
        .eq('is_active', true)
        .maybeSingle()
    ).data;
    const r = await c
      .from('services')
      .insert({
        name: srv.name,
        slug: srv.slug,
        category_id: cat?.id || null,
        description: srv.description,
        short_description: srv.description,
        price: srv.price ?? 0,
        price_type: srv.price_type || 'fixed',
        duration_minutes: srv.duration_minutes || null,
        is_bookable: srv.is_bookable !== false,
        requires_inspection: srv.requires_inspection === true,
        is_active: true,
      })
      .select('*')
      .single();
    if (r.error) throw r.error;

    if (srv.image_url) {
      await c.from('service_images').insert({
        service_id: r.data.id,
        storage_path: srv.image_url,
        alt_text: srv.name,
        is_primary: true,
        sort_order: 0,
      });
    }

    await loadCatalog();
    showToast('Service package saved.');
    return mapService({
      ...r.data,
      service_images: srv.image_url
        ? [{ storage_path: srv.image_url, is_primary: true, sort_order: 0 }]
        : [],
    });
  };

  const updateService = async (
    id: string,
    updates: Partial<AutomotiveService>
  ) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.slug !== undefined) patch.slug = updates.slug;
    if (updates.price !== undefined) patch.price = updates.price;
    if (updates.price_type !== undefined) patch.price_type = updates.price_type;
    if (updates.is_bookable !== undefined) patch.is_bookable = updates.is_bookable;
    if (updates.requires_inspection !== undefined) patch.requires_inspection = updates.requires_inspection;
    if (updates.duration_minutes !== undefined)
      patch.duration_minutes = updates.duration_minutes || null;
    if (updates.category !== undefined) {
      const cat = (await c.from('service_categories').select('id').eq('name', updates.category).eq('is_active', true).maybeSingle()).data;
      patch.category_id = cat?.id || null;
    }
    if (updates.description !== undefined) {
      patch.description = updates.description;
      patch.short_description = updates.description;
    }
    if (Object.keys(patch).length > 0) {
      const r = await c.from('services').update(patch).eq('id', id);
      if (r.error) throw r.error;
    }
    if (updates.image_url) {
      await c.from('service_images').delete().eq('service_id', id);
      await c.from('service_images').insert({
        service_id: id,
        storage_path: updates.image_url,
        alt_text: updates.name || 'Service Image',
        is_primary: true,
        sort_order: 0,
      });
    }
    await loadCatalog();
    showToast('Service updated.');
  };

  const deleteService = async (id: string) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const r = await c
      .from('services')
      .update({ is_active: false })
      .eq('id', id);
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Service removed.');
  };

  const updateServiceBookingStatus = async (
    id: string,
    status: ServiceBookingStatus
  ) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const map: any = {
      Confirmed: 'confirmed',
      'In Service Bay': 'in_progress',
      Completed: 'completed',
      Cancelled: 'cancelled',
      Pending: 'pending',
    };
    const r = await c
      .from('appointments')
      .update({ status: map[status] || status })
      .eq('id', id);
    if (r.error) throw r.error;
    await loadAdminData();
    showToast('Booking status updated.');
  };

  const updateOrderStatus = async (
    id: string,
    fulfillmentStatus: OrderFulfillmentStatus,
    paymentStatus?: PaymentStatus
  ) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const om: any = {
      Processing: 'processing',
      Packed: 'ready_for_pickup',
      Shipped: 'shipped',
      Delivered: 'delivered',
      Cancelled: 'cancelled',
    };
    const r = await c
      .from('orders')
      .update({ status: om[fulfillmentStatus] || 'processing' })
      .eq('id', id);
    if (r.error) throw r.error;
    if (paymentStatus) {
      const pm: any = {
        Paid: 'paid',
        'Pending Verification': 'pending',
        'COD Pending': 'pending',
      };
      const pr = await c
        .from('payments')
        .update({ status: pm[paymentStatus] || 'pending' })
        .eq('order_id', id);
      if (pr.error) throw pr.error;
    }
    await loadAdminData();
    showToast('Order status updated.');
  };

  const addBrand = async (brand: any) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const r = await c.from('brands').insert({
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logo_url: brand.image_url || null,
      is_active: true,
    });
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Brand saved.');
  };

  const updateBrand = async (id: string, updates: Partial<Brand>) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.slug !== undefined) patch.slug = updates.slug;
    if (updates.description !== undefined)
      patch.description = updates.description;
    if (updates.image_url !== undefined)
      patch.logo_url = updates.image_url || null;
    const r = await c.from('brands').update(patch).eq('id', id);
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Brand updated.');
  };

  const deleteBrand = async (id: string) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const r = await c
      .from('brands')
      .update({ is_active: false })
      .eq('id', id);
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Brand removed from the active catalog.');
  };

  const addCategory = async (cat: any) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const r = await c.from('categories').insert({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image_url: cat.image_url || null,
      is_active: true,
    });
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Category saved.');
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) return;
    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.slug !== undefined) patch.slug = updates.slug;
    if (updates.description !== undefined)
      patch.description = updates.description;
    if (updates.image_url !== undefined)
      patch.image_url = updates.image_url || null;
    const r = await c.from('categories').update(patch).eq('id', id);
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Category updated.');
  };

  const deleteCategory = async (id: string) => {
    if (!user || user.role !== 'admin')
      throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const r = await c
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);
    if (r.error) throw r.error;
    await loadCatalog();
    showToast('Category removed from the active catalog.');
  };

  const addVlog = async (vlog: any): Promise<VlogPost> => {
    if (!user || user.role !== 'admin') throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const types: any = {
      'Service Bay Vlog': 'behind_the_scenes',
      'Part Install Guide': 'installation',
      'Dyno & Diagnostics': 'repair',
      'Tool & Part Review': 'new_arrival',
    };
    const r = await c
      .from('daily_posts')
      .insert({
        author_id: user.id,
        title: vlog.title,
        caption: vlog.summary,
        post_type: types[vlog.category] || 'shop_update',
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (r.error) throw r.error;

    const mediaRows: any[] = [];
    if (vlog.video_url) {
      mediaRows.push({
        post_id: r.data.id,
        storage_path: vlog.video_url,
        thumbnail_path: vlog.thumbnail_url || vlog.video_url,
        media_type: 'video',
        sort_order: 0,
      });
    }
    if (vlog.thumbnail_url) {
      mediaRows.push({
        post_id: r.data.id,
        storage_path: vlog.thumbnail_url,
        thumbnail_path: vlog.thumbnail_url,
        media_type: 'image',
        sort_order: vlog.video_url ? 1 : 0,
      });
    }
    if (mediaRows.length > 0) {
      await c.from('daily_post_media').insert(mediaRows);
    }

    await loadVlogs();
    showToast('Daily workshop vlog published!');
    return {
      ...vlog,
      id: r.data.id,
      slug: r.data.id,
      views_count: 0,
      likes_count: 0,
      comments: [],
    };
  };

  const updateVlog = async (id: string, updates: Partial<VlogPost>) => {
    if (!user || user.role !== 'admin') throw new Error('Administrator authorization required.');
    const c = sb();
    if (!c) throw new Error('Supabase is not configured.');
    const types: any = {
      'Service Bay Vlog': 'behind_the_scenes',
      'Part Install Guide': 'installation',
      'Dyno & Diagnostics': 'repair',
      'Tool & Part Review': 'new_arrival',
    };
    const patch: any = {};
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.summary !== undefined) patch.caption = updates.summary;
    if (updates.category !== undefined)
      patch.post_type = types[updates.category] || 'shop_update';

    if (Object.keys(patch).length > 0) {
      const r = await c.from('daily_posts').update(patch).eq('id', id);
      if (r.error) throw r.error;
    }

    if (updates.video_url !== undefined || updates.thumbnail_url !== undefined) {
      await c.from('daily_post_media').delete().eq('post_id', id);
      const mediaRows: any[] = [];
      if (updates.video_url) {
        mediaRows.push({
          post_id: id,
          storage_path: updates.video_url,
          thumbnail_path: updates.thumbnail_url || updates.video_url,
          media_type: 'video',
          sort_order: 0,
        });
      }
      if (updates.thumbnail_url) {
        mediaRows.push({
          post_id: id,
          storage_path: updates.thumbnail_url,
          thumbnail_path: updates.thumbnail_url,
          media_type: 'image',
          sort_order: updates.video_url ? 1 : 0,
        });
      }
      if (mediaRows.length > 0) {
        await c.from('daily_post_media').insert(mediaRows);
      }
    }

    await loadVlogs();
    showToast('Daily vlog updated!');
  };

  const deleteVlog = async (id: string) => {
    if (!user || user.role !== 'admin') {
      showToast('Administrator authorization required.', 'error');
      return;
    }
    const c = sb();
    if (!c) return;
    const r = await c
      .from('daily_posts')
      .update({ is_published: false })
      .eq('id', id);
    if (r.error) showToast(r.error.message, 'error');
    else {
      await loadVlogs();
      showToast('Vlog removed.');
    }
  };

  const likeVlog = async (vlogId: string) => {
    if (!user) {
      showToast('Please sign in to like posts.', 'error');
      return;
    }
    const c = sb();
    if (!c) return;
    const r = await c
      .from('daily_post_likes')
      .insert({ post_id: vlogId, user_id: user.id });
    if (r.error && (r.error as any).code !== '23505')
      showToast(r.error.message, 'error');
    else await loadVlogs();
  };

  const addVlogComment = async (
    vlogId: string,
    _userName: string,
    text: string
  ) => {
    if (!user) {
      showToast('Please sign in to comment.', 'error');
      return;
    }
    const c = sb();
    if (!c) return;
    const r = await c.from('daily_post_comments').insert({
      post_id: vlogId,
      user_id: user.id,
      content: text.trim(),
    });
    if (r.error) showToast(r.error.message, 'error');
    else await loadVlogs();
  };

  const value = useMemo(
    () => ({
      parts,
      brands,
      categories,
      services,
      serviceBookings,
      vlogs,
      favorites,
      cart,
      orders,
      customerVehicles,
      user,
      isHydrated,
      refreshAuth,
      showToast,
      toggleFavorite,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      createOrder,
      createServiceBooking,
      addCustomerVehicle,
      updateCustomerVehicle,
      deleteCustomerVehicle,
      login,
      register,
      logout,
      updateProfile,
      addPart,
      updatePart,
      deletePart,
      updatePartStatus,
      addService,
      updateService,
      deleteService,
      updateServiceBookingStatus,
      updateOrderStatus,
      addBrand,
      updateBrand,
      deleteBrand,
      addCategory,
      updateCategory,
      deleteCategory,
      addVlog,
      updateVlog,
      deleteVlog,
      likeVlog,
      addVlogComment,
    }),
    [
      parts,
      brands,
      categories,
      services,
      serviceBookings,
      vlogs,
      favorites,
      cart,
      orders,
      customerVehicles,
      user,
      isHydrated,
      refreshAuth,
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center justify-between gap-3 bg-[#141413] text-white px-4 py-3 rounded-lg shadow-lg border border-neutral-800 text-sm"
          >
            <div className="flex items-center gap-2.5">
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{t.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const c = useContext(StoreContext);
  if (!c) throw new Error('useStore must be used within a StoreProvider');
  return c;
}
