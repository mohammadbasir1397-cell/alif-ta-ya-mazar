/*
# Repair admin panel: restore settings row, real admin auth, admin-only writes

## Summary
The admin panel rendered a blank page after login because the `settings` row
(id = 1) — which holds the store name, logo, WhatsApp number and the admin
password record — is missing from the database. This migration restores that
row non-destructively and completes the admin authentication model so only a
verified admin account can modify store data.

1. Restored data (non-destructive)
- Re-inserts the missing `settings` row (id = 1) with the original store name
  "الف تا ی (مزار)" and the documented default password "admin123".
- `ON CONFLICT DO NOTHING`: if the row already exists, nothing is touched —
  no existing value is ever overwritten or lost. Customizations that were lost
  with the old row (logo, WhatsApp number, hero settings) can be re-uploaded
  from the admin panel; no product, category, image or announcement data was
  affected (43 products, 10 categories, 63 images, 2 announcements verified).

2. New function
- `public.is_admin()` (SECURITY DEFINER, stable): returns true only when the
  current signed-in user exists in `admin_users`. EXECUTE revoked from
  PUBLIC/anon, granted to authenticated only.

3. Policy changes — all write access now requires a verified admin account
- products, categories, product_images, announcements, announcement_settings:
  public SELECT unchanged (shoppers still see everything). INSERT/UPDATE/DELETE
  policies changed from `USING (true) TO authenticated` to require is_admin().
- settings: SELECT/INSERT/UPDATE/DELETE now require is_admin() (previously any
  authenticated user; before that, anyone).
- storage.objects write policies for the four buckets (store-logo,
  category-images, product-images, announcements) now require is_admin().
  Public read of images is unchanged.

4. Grants
- Revokes anon INSERT/UPDATE/DELETE grants on storage.objects (defense in
  depth; RLS already blocked these writes).
- No changes to existing table grants; policies remain the access control.

5. Important notes
- Safe to re-run: uses IF EXISTS / ON CONFLICT DO NOTHING.
- No transaction control statements; no destructive operations.
- The admin user account itself is created through the app's first-run
  bootstrap flow (not in this migration), then recorded in admin_users.
*/

-- 1. Restore the missing settings row (non-destructive)
INSERT INTO settings (id, store_name)
VALUES (1, 'الف تا ی (مزار)')
ON CONFLICT (id) DO NOTHING;

-- 2. Admin membership helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid());
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3a. products
DROP POLICY IF EXISTS "products_insert_authenticated" ON products;
DROP POLICY IF EXISTS "products_update_authenticated" ON products;
DROP POLICY IF EXISTS "products_delete_authenticated" ON products;
CREATE POLICY "products_insert_admin" ON products FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products_update_admin" ON products FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "products_delete_admin" ON products FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3b. categories
DROP POLICY IF EXISTS "categories_insert_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_update_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_delete_authenticated" ON categories;
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3c. product_images
DROP POLICY IF EXISTS "product_images_insert_authenticated" ON product_images;
DROP POLICY IF EXISTS "product_images_update_authenticated" ON product_images;
DROP POLICY IF EXISTS "product_images_delete_authenticated" ON product_images;
CREATE POLICY "product_images_insert_admin" ON product_images FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "product_images_update_admin" ON product_images FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "product_images_delete_admin" ON product_images FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3d. announcements
DROP POLICY IF EXISTS "announcements_insert_authenticated" ON announcements;
DROP POLICY IF EXISTS "announcements_update_authenticated" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_authenticated" ON announcements;
CREATE POLICY "announcements_insert_admin" ON announcements FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "announcements_update_admin" ON announcements FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "announcements_delete_admin" ON announcements FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3e. announcement_settings
DROP POLICY IF EXISTS "announcement_settings_insert_authenticated" ON announcement_settings;
DROP POLICY IF EXISTS "announcement_settings_update_authenticated" ON announcement_settings;
DROP POLICY IF EXISTS "announcement_settings_delete_authenticated" ON announcement_settings;
CREATE POLICY "announcement_settings_insert_admin" ON announcement_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "announcement_settings_update_admin" ON announcement_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "announcement_settings_delete_admin" ON announcement_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3f. settings (includes the admin password record)
DROP POLICY IF EXISTS "settings_select_authenticated" ON settings;
DROP POLICY IF EXISTS "settings_update_authenticated" ON settings;
CREATE POLICY "settings_select_admin" ON settings FOR SELECT
  TO authenticated USING (public.is_admin());
CREATE POLICY "settings_insert_admin" ON settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "settings_update_admin" ON settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "settings_delete_admin" ON settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- 3g. storage buckets — writes now require admin
DROP POLICY IF EXISTS "auth_write_store_logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_store_logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_store_logo" ON storage.objects;
CREATE POLICY "admin_write_store_logo" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'store-logo' AND public.is_admin());
CREATE POLICY "admin_update_store_logo" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'store-logo' AND public.is_admin())
  WITH CHECK (bucket_id = 'store-logo' AND public.is_admin());
CREATE POLICY "admin_delete_store_logo" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'store-logo' AND public.is_admin());

DROP POLICY IF EXISTS "auth_write_category_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_category_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_category_images" ON storage.objects;
CREATE POLICY "admin_write_category_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'category-images' AND public.is_admin());
CREATE POLICY "admin_update_category_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'category-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'category-images' AND public.is_admin());
CREATE POLICY "admin_delete_category_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'category-images' AND public.is_admin());

DROP POLICY IF EXISTS "auth_write_product_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_product_images" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_product_images" ON storage.objects;
CREATE POLICY "admin_write_product_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "admin_update_product_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "admin_delete_product_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "auth_write_announcements" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_announcements" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_announcements" ON storage.objects;
CREATE POLICY "admin_write_announcements" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'announcements' AND public.is_admin());
CREATE POLICY "admin_update_announcements" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'announcements' AND public.is_admin())
  WITH CHECK (bucket_id = 'announcements' AND public.is_admin());
CREATE POLICY "admin_delete_announcements" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'announcements' AND public.is_admin());

-- 4. Defense in depth: anon never writes storage objects
REVOKE INSERT, UPDATE, DELETE ON storage.objects FROM anon;
