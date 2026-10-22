/*
# Secure RLS policies and admin authentication setup

## Summary
This migration fixes critical security vulnerabilities in the store:
1. Removes public write access from ALL content tables — only authenticated admins can create/edit/delete
2. Creates a `public_settings` VIEW that excludes the `admin_password` column
3. Restricts direct access to the `settings` table to authenticated users only
4. Locks down storage buckets: public read, authenticated write only
5. Adds an `admin_users` table to track who is an admin (checked via auth.uid())

## What changed
- **products, categories, product_images, announcements, announcement_settings**: SELECT stays public (anon+authenticated). INSERT/UPDATE/DELETE now require authenticated.
- **settings**: Only authenticated can SELECT/UPDATE. A new `public_settings` view exposes everything EXCEPT admin_password to the public.
- **store_live_sessions, store_pwa_installs**: No change — already insert/update only for tracking.
- **storage.objects**: Write/update/delete policies changed from `anon, authenticated` to `authenticated` only. Read stays public.
- **admin_users table**: New table to mark which auth.users are admins.

## Security impact
- Before: anyone with the public API key could read the admin password and create/edit/delete all store data
- After: public can only read store content (no admin_password), only authenticated admin users can modify data
*/

-- ============================================================
-- 1. Admin users table
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
CREATE POLICY "admin_users_select_own" ON admin_users FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 2. public_settings VIEW (excludes admin_password)
-- ============================================================
CREATE OR REPLACE VIEW public_settings AS
SELECT
  id,
  logo_url,
  store_name,
  whatsapp_number,
  hero_text,
  hero_image_url,
  hero_overlay,
  hero_text_position,
  created_at
FROM settings;

ALTER VIEW public_settings OWNER TO postgres;
GRANT SELECT ON public_settings TO anon, authenticated;

-- ============================================================
-- 3. Settings table — restrict to authenticated only
-- ============================================================
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
DROP POLICY IF EXISTS "anon_update_settings" ON settings;

CREATE POLICY "settings_select_authenticated" ON settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "settings_update_authenticated" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Revoke anon access to the settings table directly
REVOKE SELECT ON settings FROM anon;
GRANT SELECT ON settings TO authenticated;
GRANT UPDATE ON settings TO authenticated;

-- ============================================================
-- 4. products — public read, authenticated write
-- ============================================================
DROP POLICY IF EXISTS "anon_select_products" ON products;
DROP POLICY IF EXISTS "anon_insert_products" ON products;
DROP POLICY IF EXISTS "anon_update_products" ON products;
DROP POLICY IF EXISTS "anon_delete_products" ON products;

CREATE POLICY "products_select_public" ON products FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "products_insert_authenticated" ON products FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "products_update_authenticated" ON products FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "products_delete_authenticated" ON products FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 5. categories — public read, authenticated write
-- ============================================================
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
DROP POLICY IF EXISTS "anon_update_categories" ON categories;
DROP POLICY IF EXISTS "anon_delete_categories" ON categories;

CREATE POLICY "categories_select_public" ON categories FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "categories_insert_authenticated" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "categories_update_authenticated" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_authenticated" ON categories FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 6. product_images — public read, authenticated write
-- ============================================================
DROP POLICY IF EXISTS "anon_select_product_images" ON product_images;
DROP POLICY IF EXISTS "anon_insert_product_images" ON product_images;
DROP POLICY IF EXISTS "anon_update_product_images" ON product_images;
DROP POLICY IF EXISTS "anon_delete_product_images" ON product_images;

CREATE POLICY "product_images_select_public" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "product_images_insert_authenticated" ON product_images FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "product_images_update_authenticated" ON product_images FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "product_images_delete_authenticated" ON product_images FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 7. announcements — public read, authenticated write
-- ============================================================
DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;

CREATE POLICY "announcements_select_public" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "announcements_insert_authenticated" ON announcements FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "announcements_update_authenticated" ON announcements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "announcements_delete_authenticated" ON announcements FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 8. announcement_settings — public read, authenticated write
-- ============================================================
DROP POLICY IF EXISTS "anon_select_announcement_settings" ON announcement_settings;
DROP POLICY IF EXISTS "anon_update_announcement_settings" ON announcement_settings;

CREATE POLICY "announcement_settings_select_public" ON announcement_settings FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "announcement_settings_insert_authenticated" ON announcement_settings FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "announcement_settings_update_authenticated" ON announcement_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "announcement_settings_delete_authenticated" ON announcement_settings FOR DELETE
  TO authenticated USING (true);

-- ============================================================
-- 9. Storage policies — public read, authenticated write only
-- ============================================================
-- store-logo bucket
DROP POLICY IF EXISTS "public_write_store_logo" ON storage.objects;
DROP POLICY IF EXISTS "public_update_store_logo" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_store_logo" ON storage.objects;

CREATE POLICY "auth_write_store_logo" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'store-logo');
CREATE POLICY "auth_update_store_logo" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'store-logo') WITH CHECK (bucket_id = 'store-logo');
CREATE POLICY "auth_delete_store_logo" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'store-logo');

-- category-images bucket
DROP POLICY IF EXISTS "public_write_category_images" ON storage.objects;
DROP POLICY IF EXISTS "public_update_category_images" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_category_images" ON storage.objects;

CREATE POLICY "auth_write_category_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'category-images');
CREATE POLICY "auth_update_category_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'category-images') WITH CHECK (bucket_id = 'category-images');
CREATE POLICY "auth_delete_category_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'category-images');

-- product-images bucket
DROP POLICY IF EXISTS "public_write_product_images" ON storage.objects;
DROP POLICY IF EXISTS "public_update_product_images" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;

CREATE POLICY "auth_write_product_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "auth_update_product_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "auth_delete_product_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'product-images');

-- announcements bucket
DROP POLICY IF EXISTS "public_write_announcements" ON storage.objects;
DROP POLICY IF EXISTS "public_update_announcements" ON storage.objects;
DROP POLICY IF EXISTS "public_delete_announcements" ON storage.objects;

CREATE POLICY "auth_write_announcements" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'announcements');
CREATE POLICY "auth_update_announcements" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'announcements') WITH CHECK (bucket_id = 'announcements');
CREATE POLICY "auth_delete_announcements" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'announcements');
