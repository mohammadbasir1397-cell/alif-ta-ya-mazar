import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const STORAGE_BUCKETS = {
  logo: 'store-logo',
  categories: 'category-images',
  products: 'product-images',
  announcements: 'announcements',
} as const;
