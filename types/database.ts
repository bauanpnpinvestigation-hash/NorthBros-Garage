
export interface AppSetting {
  id: string;
  category: string;
  setting_key: string;
  setting_value: unknown;
  is_public: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'Active' | 'Out of Stock' | 'Archived';
export type OrderFulfillmentStatus = 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending Verification' | 'Paid' | 'COD Pending';
export type PaymentMethodType = string;
export type ServiceAvailability = 'Available' | 'Limited Slots' | 'Unavailable';
export type ServiceBookingStatus = 'Pending' | 'Confirmed' | 'In Service Bay' | 'Completed' | 'Cancelled';

export interface VehicleCompatibility {
  make: string;
  model: string;
  years: string;
  engine: string;
}

export interface PartProduct {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  price: number;
  compare_at_price?: number;
  stock: number;
  status: ProductStatus;
  rating: number;
  review_count: number;
  is_featured: boolean;
  primary_image: string;
  gallery_images: string[];
  description: string;
  specifications: Record<string, string>;
  compatibility: VehicleCompatibility[];
  vlog_episode_slug?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  country?: string;
  specialty?: string;
  warranty_policy?: string;
  description: string;
  image_url?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  common_parts?: string;
  image_url?: string;
}

export interface AutomotiveService {
  id: string;
  slug: string;
  service_code: string;
  name: string;
  category: string;
  price: number;
  price_type?: 'fixed' | 'starting_at' | 'quote';
  duration_minutes: number;
  is_bookable?: boolean;
  requires_inspection?: boolean;
  duration_label: string;
  availability: ServiceAvailability;
  description: string;
  included_operations: string[];
  recommended_interval: string;
  image_url: string;
}

export interface ServiceBooking {
  id: string;
  booking_reference: string;
  service_id: string;
  service_slug: string;
  service_name: string;
  service_price: number;
  branch_id?: string;
  branch_name?: string;
  customer_vehicle_id?: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  vehicle_details: string;
  preferred_date: string;
  preferred_time: string;
  notes?: string;
  status: ServiceBookingStatus;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  product_slug: string;
  sku: string;
  name: string;
  brand_name: string;
  unit_price: number;
  quantity: number;
  max_stock: number;
  image: string;
}

export interface OrderItem {
  product_id: string;
  product_slug: string;
  sku: string;
  name: string;
  brand_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  payment_method: PaymentMethodType;
  payment_status: PaymentStatus;
  fulfillment_status: OrderFulfillmentStatus;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
}

export interface VlogComment {
  id: string;
  user_name: string;
  created_at: string;
  text: string;
}

export interface VlogPost {
  id: string;
  slug: string;
  episode_number: number;
  title: string;
  published_at: string;
  duration: string;
  author_name: string;
  author_role: string;
  category: 'Service Bay Vlog' | 'Part Install Guide' | 'Dyno & Diagnostics' | 'Tool & Part Review';
  summary: string;
  content: string[];
  thumbnail_url: string;
  video_url?: string;
  media_type?: 'image' | 'video';
  video_highlights: { timestamp: string; label: string }[];
  featured_part_slug?: string;
  featured_part_name?: string;
  featured_part_price?: number;
  featured_service_slug?: string;
  views_count: number;
  likes_count: number;
  comments: VlogComment[];
}

export interface CustomerVehicle {
  id: string;
  customer_id: string;
  vehicle_variant_id: string;
  nickname?: string;
  plate_number?: string;
  vin?: string;
  current_mileage?: number;
  notes?: string;
  make_name: string;
  model_name: string;
  variant_name: string;
  year_from?: number;
  year_to?: number;
  engine?: string;
  transmission?: string;
  fuel_type?: string;
  body_type?: string;
  drive_type?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  garage_vehicle?: string;
  role: 'customer' | 'admin';
  created_at: string;
}

export interface PartFilterParams {
  q?: string;
  brand?: string;
  category?: string;
  make?: string;
  in_stock?: string;
  max_price?: number;
  sort?: 'recommended' | 'newest' | 'price_asc' | 'price_desc' | 'rating_desc';
  page?: number;
  limit?: number;
}
