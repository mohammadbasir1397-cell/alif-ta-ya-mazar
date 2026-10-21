/*
# Storage policies for store image buckets

1. Security
- Three public buckets: store-logo, category-images, product-images.
- Allow anon + authenticated to SELECT (read) and INSERT/UPDATE/DELETE (manage) objects.
- Single-tenant admin-managed store; the dashboard is gated client-side by an admin password.
*/

DROP POLICY IF EXISTS "public_read_store_logo" ON storage.objects;
CREATE POLICY "public_read_store_logo" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-logo');

DROP POLICY IF EXISTS "public_write_store_logo" ON storage.objects;
CREATE POLICY "public_write_store_logo" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'store-logo');

DROP POLICY IF EXISTS "public_update_store_logo" ON storage.objects;
CREATE POLICY "public_update_store_logo" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'store-logo') WITH CHECK (bucket_id = 'store-logo');

DROP POLICY IF EXISTS "public_delete_store_logo" ON storage.objects;
CREATE POLICY "public_delete_store_logo" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'store-logo');

DROP POLICY IF EXISTS "public_read_category_images" ON storage.objects;
CREATE POLICY "public_read_category_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "public_write_category_images" ON storage.objects;
CREATE POLICY "public_write_category_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'category-images');

DROP POLICY IF EXISTS "public_update_category_images" ON storage.objects;
CREATE POLICY "public_update_category_images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'category-images') WITH CHECK (bucket_id = 'category-images');

DROP POLICY IF EXISTS "public_delete_category_images" ON storage.objects;
CREATE POLICY "public_delete_category_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_write_product_images" ON storage.objects;
CREATE POLICY "public_write_product_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_update_product_images" ON storage.objects;
CREATE POLICY "public_update_product_images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;
CREATE POLICY "public_delete_product_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'product-images');
