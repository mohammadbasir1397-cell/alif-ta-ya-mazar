export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  category_id: string | null;
  is_new: boolean;
  is_popular: boolean;
  is_discounted: boolean;
  in_stock: boolean;
  sort_order: number;
  is_bestseller: boolean;
  bestseller_order: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface ProductWithImages extends Product {
  category?: Category | null;
  product_images?: ProductImage[];
}

export interface Settings {
  id: number;
  logo_url: string | null;
  store_name: string;
  whatsapp_number: string | null;
  hero_text: string | null;
  hero_image_url: string | null;
  hero_overlay: number;
  hero_text_position: 'center' | 'right' | 'left';
  created_at: string;
}

export interface Announcement {
  id: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  created_at: string;
}

export type FitMode = 'contain' | 'cover' | 'fill';
export type ImagePosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

export interface AnalyticsStats {
  active_visitors: number;
  pwa_installs: number;
  registered_customers: number;
  orders: number;
  customer_tracking_available: boolean;
  order_tracking_available: boolean;
  generated_at: string;
}

export interface AnnouncementSettings {
  id: number;
  desktop_width: number;
  desktop_height: number;
  mobile_width: number;
  mobile_height: number;
  fit_mode: FitMode;
  image_position: ImagePosition;
  border_radius: number;
  bg_color: string;
  created_at: string;
}
