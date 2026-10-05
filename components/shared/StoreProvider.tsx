'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PARTS,
  INITIAL_SERVICES,
  INITIAL_SERVICE_BOOKINGS,
  INITIAL_USERS,
  INITIAL_VLOGS,
} from '@/lib/store/initial-data';
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
  user: UserProfile | null;
  isHydrated: boolean;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  toggleFavorite: (partId: string) => void;
  addToCart: (part: PartProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (
    payload: Omit<
      Order,
      'id' | 'order_number' | 'payment_status' | 'fulfillment_status' | 'created_at'
    >
  ) => Order;
  createServiceBooking: (
    payload: Omit<
      ServiceBooking,
      'id' | 'booking_reference' | 'status' | 'created_at'
    >
  ) => ServiceBooking;
  login: (email: string, password?: string) => boolean;
  register: (name: string, email: string, phone: string, password?: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  // Admin mutations
  addPart: (part: Omit<PartProduct, 'id' | 'created_at'>) => PartProduct;
  updatePart: (id: string, updates: Partial<PartProduct>) => void;
  deletePart: (id: string) => void;
  updatePartStatus: (id: string, status: ProductStatus) => void;
  addService: (srv: Omit<AutomotiveService, 'id'>) => AutomotiveService;
  updateServiceBookingStatus: (id: string, status: ServiceBookingStatus) => void;
  updateOrderStatus: (
    id: string,
    fulfillmentStatus: OrderFulfillmentStatus,
    paymentStatus?: PaymentStatus
  ) => void;
  addBrand: (brand: Omit<Brand, 'id'>) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  addVlog: (
    vlog: Omit<VlogPost, 'id' | 'views_count' | 'likes_count' | 'comments'>
  ) => VlogPost;
  likeVlog: (vlogId: string) => void;
  addVlogComment: (vlogId: string, userName: string, text: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PARTS: 'apex_parts_products_v2',
  BRANDS: 'apex_parts_brands_v2',
  CATEGORIES: 'apex_parts_categories_v2',
  SERVICES: 'apex_parts_services_v2',
  BOOKINGS: 'apex_parts_bookings_v2',
  VLOGS: 'apex_parts_vlogs_v2',
  FAVORITES: 'apex_parts_favorites_v2',
  CART: 'apex_parts_cart_v2',
  ORDERS: 'apex_parts_orders_v2',
  USER: 'apex_parts_user_v2',
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [parts, setParts] = useState<PartProduct[]>(INITIAL_PARTS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [services, setServices] = useState<AutomotiveService[]>(INITIAL_SERVICES);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>(
    INITIAL_SERVICE_BOOKINGS
  );
  const [vlogs, setVlogs] = useState<VlogPost[]>(INITIAL_VLOGS);
  const [favorites, setFavorites] = useState<string[]>(['part-1', 'part-2']);
  const [cart, setCart] = useState<CartItem[]>([
    {
      product_id: 'part-2',
      product_slug: 'motul-8100-xclean-5w30-synthetic-pms-bundle-denso-filters',
      sku: 'MTL-PMS-8100-7L',
      name: 'Motul 8100 X-Clean+ 5W-30 100% Synthetic (7L) + Denso OEM Oil & Air Filter PMS Kit',
      brand_name: 'Motul',
      unit_price: 5450,
      quantity: 1,
      max_stock: 38,
      image: '/images/part_oil_filter_kit.jpg',
    },
  ]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [user, setUser] = useState<UserProfile | null>(INITIAL_USERS[0]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    text: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const sp = localStorage.getItem(STORAGE_KEYS.PARTS);
        if (sp) setParts(JSON.parse(sp));

        const sb = localStorage.getItem(STORAGE_KEYS.BRANDS);
        if (sb) setBrands(JSON.parse(sb));

        const sc = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (sc) setCategories(JSON.parse(sc));

        const ss = localStorage.getItem(STORAGE_KEYS.SERVICES);
        if (ss) setServices(JSON.parse(ss));

        const sbk = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
        if (sbk) setServiceBookings(JSON.parse(sbk));

        const sv = localStorage.getItem(STORAGE_KEYS.VLOGS);
        if (sv) setVlogs(JSON.parse(sv));

        const sf = localStorage.getItem(STORAGE_KEYS.FAVORITES);
        if (sf) setFavorites(JSON.parse(sf));

        const scart = localStorage.getItem(STORAGE_KEYS.CART);
        if (scart) setCart(JSON.parse(scart));

        const so = localStorage.getItem(STORAGE_KEYS.ORDERS);
        if (so) setOrders(JSON.parse(so));

        const su = localStorage.getItem(STORAGE_KEYS.USER);
        if (su !== null) setUser(JSON.parse(su));
      } catch {
        // Ignore storage access issues
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const persist = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore
    }
  };

  const toggleFavorite = (partId: string) => {
    const exists = favorites.includes(partId);
    const updated = exists
      ? favorites.filter((id) => id !== partId)
      : [...favorites, partId];
    setFavorites(updated);
    persist(STORAGE_KEYS.FAVORITES, updated);

    const target = parts.find((p) => p.id === partId);
    showToast(
      exists
        ? `Removed ${target?.name || 'part'} from wishlist.`
        : `Saved ${target?.name || 'part'} to wishlist.`,
      'info'
    );
  };

  const addToCart = (part: PartProduct, quantity = 1) => {
    if (part.stock <= 0 || part.status !== 'Active') {
      showToast('This part is currently out of stock.', 'error');
      return;
    }
    const existingIndex = cart.findIndex((i) => i.product_id === part.id);
    let updated: CartItem[];

    if (existingIndex > -1) {
      updated = [...cart];
      const newQty = Math.min(
        part.stock,
        updated[existingIndex].quantity + quantity
      );
      updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
    } else {
      updated = [
        ...cart,
        {
          product_id: part.id,
          product_slug: part.slug,
          sku: part.sku,
          name: part.name,
          brand_name: part.brand_name,
          unit_price: part.price,
          quantity: Math.min(part.stock, quantity),
          max_stock: part.stock,
          image: part.primary_image,
        },
      ];
    }
    setCart(updated);
    persist(STORAGE_KEYS.CART, updated);
    showToast(`Added ${quantity}x ${part.brand_name} (${part.sku}) to cart.`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) =>
      item.product_id === productId
        ? { ...item, quantity: Math.min(item.max_stock, quantity) }
        : item
    );
    setCart(updated);
    persist(STORAGE_KEYS.CART, updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((i) => i.product_id !== productId);
    setCart(updated);
    persist(STORAGE_KEYS.CART, updated);
    showToast('Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    persist(STORAGE_KEYS.CART, []);
  };

  const createOrder = (
    payload: Omit<
      Order,
      'id' | 'order_number' | 'payment_status' | 'fulfillment_status' | 'created_at'
    >
  ): Order => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newOrder: Order = {
      ...payload,
      id: `ord-${Date.now()}`,
      order_number: `ORD-${randomNum}`,
      payment_status:
        payload.payment_method === 'Cash on Delivery (COD)'
          ? 'COD Pending'
          : 'Paid',
      fulfillment_status: 'Processing',
      created_at: new Date().toISOString(),
    };
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    persist(STORAGE_KEYS.ORDERS, updatedOrders);

    // Decrement stock for ordered parts
    const updatedParts = parts.map((p) => {
      const orderedItem = payload.items.find((i) => i.product_id === p.id);
      if (!orderedItem) return p;
      const nextStock = Math.max(0, p.stock - orderedItem.quantity);
      return {
        ...p,
        stock: nextStock,
        status: (nextStock === 0 ? 'Out of Stock' : p.status) as ProductStatus,
      };
    });
    setParts(updatedParts);
    persist(STORAGE_KEYS.PARTS, updatedParts);

    clearCart();
    showToast(`Order ${newOrder.order_number} placed successfully!`);
    return newOrder;
  };

  const createServiceBooking = (
    payload: Omit<
      ServiceBooking,
      'id' | 'booking_reference' | 'status' | 'created_at'
    >
  ): ServiceBooking => {
    const randomRef = Math.floor(10000 + Math.random() * 90000);
    const newBooking: ServiceBooking = {
      ...payload,
      id: `sb-${Date.now()}`,
      booking_reference: `SRV-${randomRef}`,
      status: 'Confirmed',
      created_at: new Date().toISOString(),
    };
    const updated = [newBooking, ...serviceBookings];
    setServiceBookings(updated);
    persist(STORAGE_KEYS.BOOKINGS, updated);
    showToast(
      `Service appointment ${newBooking.booking_reference} confirmed for ${newBooking.preferred_date}!`
    );
    return newBooking;
  };

  const login = (email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    const isAdminEmail =
      normalized.includes('admin') ||
      normalized === 'miguel.santos@example.ph' ||
      normalized === 'bauan.pnp.investigation@gmail.com';
    const loggedInUser: UserProfile = {
      id: `user-${Date.now()}`,
      name:
        normalized === 'miguel.santos@example.ph'
          ? 'Miguel Santos'
          : normalized.split('@')[0].replace(/[._]/g, ' '),
      email: normalized,
      phone: '+63 917 555 0192',
      address: '148 McKinley Parkway, Bonifacio Global City',
      city: 'Taguig City, Metro Manila',
      postal_code: '1634',
      garage_vehicle: '2021 Toyota Fortuner 2.8 LTD',
      role: isAdminEmail ? 'admin' : 'customer',
      created_at: new Date().toISOString(),
    };
    setUser(loggedInUser);
    persist(STORAGE_KEYS.USER, loggedInUser);
    showToast(`Signed in as ${loggedInUser.name}`);
    return true;
  };

  const register = (name: string, email: string, phone: string): boolean => {
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: 'Bonifacio Global City',
      city: 'Taguig City, Metro Manila',
      postal_code: '1634',
      garage_vehicle: '2022 Toyota Hilux Conquest',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    persist(STORAGE_KEYS.USER, newUser);
    showToast(`Account created for ${newUser.name}`);
    return true;
  };

  const logout = () => {
    setUser(null);
    persist(STORAGE_KEYS.USER, null);
    showToast('Signed out.', 'info');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    persist(STORAGE_KEYS.USER, updated);
    showToast('Account profile saved.');
  };

  const addPart = (partData: Omit<PartProduct, 'id' | 'created_at'>): PartProduct => {
    const newPart: PartProduct = {
      ...partData,
      id: `part-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const updated = [newPart, ...parts];
    setParts(updated);
    persist(STORAGE_KEYS.PARTS, updated);
    showToast(`Added ${newPart.name} (${newPart.sku}) to catalog.`);
    return newPart;
  };

  const updatePart = (id: string, updates: Partial<PartProduct>) => {
    const updated = parts.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setParts(updated);
    persist(STORAGE_KEYS.PARTS, updated);
    showToast('Part product updated.');
  };

  const deletePart = (id: string) => {
    const updated = parts.filter((p) => p.id !== id);
    setParts(updated);
    persist(STORAGE_KEYS.PARTS, updated);
    showToast('Part removed from catalog.', 'info');
  };

  const updatePartStatus = (id: string, status: ProductStatus) => {
    const updated = parts.map((p) => (p.id === id ? { ...p, status } : p));
    setParts(updated);
    persist(STORAGE_KEYS.PARTS, updated);
    showToast(`Part status updated to ${status}.`);
  };

  const addService = (
    srvData: Omit<AutomotiveService, 'id'>
  ): AutomotiveService => {
    const newSrv: AutomotiveService = {
      ...srvData,
      id: `srv-${Date.now()}`,
    };
    const updated = [...services, newSrv];
    setServices(updated);
    persist(STORAGE_KEYS.SERVICES, updated);
    showToast(`Added service: ${newSrv.name}`);
    return newSrv;
  };

  const updateServiceBookingStatus = (
    id: string,
    status: ServiceBookingStatus
  ) => {
    const updated = serviceBookings.map((sb) =>
      sb.id === id ? { ...sb, status } : sb
    );
    setServiceBookings(updated);
    persist(STORAGE_KEYS.BOOKINGS, updated);
    showToast(`Service booking status updated to ${status}.`);
  };

  const updateOrderStatus = (
    id: string,
    fulfillmentStatus: OrderFulfillmentStatus,
    paymentStatus?: PaymentStatus
  ) => {
    const updated = orders.map((ord) =>
      ord.id === id
        ? {
            ...ord,
            fulfillment_status: fulfillmentStatus,
            payment_status: paymentStatus || ord.payment_status,
          }
        : ord
    );
    setOrders(updated);
    persist(STORAGE_KEYS.ORDERS, updated);
    showToast(`Order updated to ${fulfillmentStatus}.`);
  };

  const addBrand = (brand: Omit<Brand, 'id'>) => {
    const newBrand: Brand = { ...brand, id: `brand-${Date.now()}` };
    const updated = [...brands, newBrand];
    setBrands(updated);
    persist(STORAGE_KEYS.BRANDS, updated);
    showToast(`Added manufacturer brand ${newBrand.name}.`);
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}` };
    const updated = [...categories, newCat];
    setCategories(updated);
    persist(STORAGE_KEYS.CATEGORIES, updated);
    showToast(`Added part category ${newCat.name}.`);
  };

  const addVlog = (
    vlogData: Omit<VlogPost, 'id' | 'views_count' | 'likes_count' | 'comments'>
  ): VlogPost => {
    const newVlog: VlogPost = {
      ...vlogData,
      id: `vlog-${Date.now()}`,
      views_count: 1,
      likes_count: 1,
      comments: [],
    };
    const updated = [newVlog, ...vlogs];
    setVlogs(updated);
    persist(STORAGE_KEYS.VLOGS, updated);
    showToast(`Published Daily Workshop Vlog #${newVlog.episode_number}!`);
    return newVlog;
  };

  const likeVlog = (vlogId: string) => {
    const updated = vlogs.map((v) =>
      v.id === vlogId ? { ...v, likes_count: v.likes_count + 1 } : v
    );
    setVlogs(updated);
    persist(STORAGE_KEYS.VLOGS, updated);
    showToast('Liked workshop vlog episode!');
  };

  const addVlogComment = (vlogId: string, userName: string, text: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      user_name: userName.trim() || 'Workshop Viewer',
      created_at: new Date().toISOString(),
      text: text.trim(),
    };
    const updated = vlogs.map((v) =>
      v.id === vlogId ? { ...v, comments: [newComment, ...v.comments] } : v
    );
    setVlogs(updated);
    persist(STORAGE_KEYS.VLOGS, updated);
    showToast('Comment posted to vlog.');
  };

  return (
    <StoreContext.Provider
      value={{
        parts,
        brands,
        categories,
        services,
        serviceBookings,
        vlogs,
        favorites,
        cart,
        orders,
        user,
        isHydrated,
        showToast,
        toggleFavorite,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        createOrder,
        createServiceBooking,
        login,
        register,
        logout,
        updateProfile,
        addPart,
        updatePart,
        deletePart,
        updatePartStatus,
        addService,
        updateServiceBookingStatus,
        updateOrderStatus,
        addBrand,
        addCategory,
        addVlog,
        likeVlog,
        addVlogComment,
      }}
    >
      {children}

      {/* Global Toast Notification Stack */}
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
              <span className="leading-snug">{t.text}</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((prev) => prev.filter((item) => item.id !== t.id))
              }
              className="text-neutral-400 hover:text-white transition-colors"
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
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
