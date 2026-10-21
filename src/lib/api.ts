import { supabase } from './supabase';
import type { AnalyticsStats, Announcement, AnnouncementSettings, Category, Product, ProductImage, ProductWithImages, Settings } from './types';

const analyticsFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-analytics`;

async function postAnalytics(payload: Record<string, string>): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(analyticsFunctionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return data && typeof data === 'object' ? data as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

export async function trackLiveVisitor(sessionId: string): Promise<void> {
  await postAnalytics({ action: 'heartbeat', session_id: sessionId });
}

export async function trackPwaInstallation(installationId: string): Promise<void> {
  await postAnalytics({ action: 'pwa_install', installation_id: installationId });
}

export async function fetchAnalyticsStats(password: string, email?: string): Promise<AnalyticsStats | null> {
  const data = await postAnalytics({ action: 'stats', password, ...(email ? { email } : {}) });
  if (!data || typeof data.active_visitors !== 'number' || typeof data.pwa_installs !== 'number' || typeof data.registered_customers !== 'number' || typeof data.orders !== 'number') return null;
  return data as unknown as AnalyticsStats;
}

export async function fetchSettings(): Promise<Settings | null> {
  const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
  return data as Settings | null;
}

export async function updateSettings(
  patch: Partial<Pick<Settings, 'logo_url' | 'store_name' | 'whatsapp_number' | 'admin_password' | 'hero_text' | 'hero_image_url' | 'hero_overlay' | 'hero_text_position'>>
): Promise<Settings | null> {
  const { data } = await supabase.from('settings').update(patch).eq('id', 1).select().maybeSingle();
  return data as Settings | null;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
  return (data as Category[]) || [];
}

export async function createCategory(payload: Pick<Category, 'name' | 'slug' | 'image_url' | 'sort_order'>): Promise<Category | null> {
  const { data } = await supabase.from('categories').insert(payload).select().maybeSingle();
  return data as Category | null;
}

export async function updateCategory(id: string, patch: Partial<Pick<Category, 'name' | 'slug' | 'image_url' | 'sort_order'>>): Promise<Category | null> {
  const { data } = await supabase.from('categories').update(patch).eq('id', id).select().maybeSingle();
  return data as Category | null;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return !error;
}

export async function fetchProducts(filters?: {
  categoryId?: string;
  isNew?: boolean;
  isPopular?: boolean;
  isDiscounted?: boolean;
  isBestseller?: boolean;
  search?: string;
}): Promise<ProductWithImages[]> {
  let query = supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)')
    .order('created_at', { ascending: false });
  if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters?.isNew) query = query.eq('is_new', true);
  if (filters?.isPopular) query = query.eq('is_popular', true);
  if (filters?.isDiscounted) query = query.eq('is_discounted', true);
  if (filters?.isBestseller) query = query.eq('is_bestseller', true);
  if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
  const { data } = await query;
  return (data as ProductWithImages[]) || [];
}

export async function fetchBestsellers(): Promise<ProductWithImages[]> {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)')
    .eq('is_bestseller', true)
    .order('bestseller_order', { ascending: true });
  return (data as ProductWithImages[]) || [];
}

export async function toggleBestseller(productId: string, isBestseller: boolean, order: number): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ is_bestseller: isBestseller, bestseller_order: order })
    .eq('id', productId);
  return !error;
}

export async function fetchProductById(id: string): Promise<ProductWithImages | null> {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(*), product_images(*)')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const sorted = { ...data, product_images: (data.product_images || []).sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order) };
  return sorted as ProductWithImages;
}

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'category'>;

export async function createProduct(input: ProductInput): Promise<Product | null> {
  const { data } = await supabase.from('products').insert(input).select().maybeSingle();
  return data as Product | null;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<Product | null> {
  const { data } = await supabase.from('products').update(patch).eq('id', id).select().maybeSingle();
  return data as Product | null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
}

export async function addProductImage(productId: string, imageUrl: string, sortOrder = 0): Promise<ProductImage | null> {
  const { data } = await supabase
    .from('product_images')
    .insert({ product_id: productId, image_url: imageUrl, sort_order: sortOrder })
    .select()
    .maybeSingle();
  return data as ProductImage | null;
}

export async function deleteProductImage(id: string): Promise<boolean> {
  const { error } = await supabase.from('product_images').delete().eq('id', id);
  return !error;
}

export async function uploadImage(
  bucket: string,
  file: File,
  folder = ''
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder ? folder + '/' : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ── Announcements ──

export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('active', true)
    .or(`start_date.is.null,start_date.lte.${today}`)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .order('sort_order', { ascending: true });
  return (data as Announcement[]) || [];
}

export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data as Announcement[]) || [];
}

export async function createAnnouncement(
  payload: Pick<Announcement, 'image_url' | 'link_url' | 'title' | 'active' | 'start_date' | 'end_date' | 'sort_order'>
): Promise<Announcement | null> {
  const { data } = await supabase.from('announcements').insert(payload).select().maybeSingle();
  return data as Announcement | null;
}

export async function updateAnnouncement(
  id: string,
  patch: Partial<Pick<Announcement, 'image_url' | 'link_url' | 'title' | 'active' | 'start_date' | 'end_date' | 'sort_order'>>
): Promise<Announcement | null> {
  const { data } = await supabase.from('announcements').update(patch).eq('id', id).select().maybeSingle();
  return data as Announcement | null;
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  return !error;
}

// ── Announcement Display Settings ──

export async function fetchAnnouncementSettings(): Promise<AnnouncementSettings | null> {
  const { data } = await supabase.from('announcement_settings').select('*').eq('id', 1).maybeSingle();
  return data as AnnouncementSettings | null;
}

export async function updateAnnouncementSettings(
  patch: Partial<Pick<AnnouncementSettings, 'desktop_width' | 'desktop_height' | 'mobile_width' | 'mobile_height' | 'fit_mode' | 'image_position' | 'border_radius' | 'bg_color'>>
): Promise<AnnouncementSettings | null> {
  const { data } = await supabase.from('announcement_settings').update(patch).eq('id', 1).select().maybeSingle();
  return data as AnnouncementSettings | null;
}
