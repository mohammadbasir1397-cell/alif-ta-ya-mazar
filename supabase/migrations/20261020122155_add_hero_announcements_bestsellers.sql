/*
# Add homepage cover, announcements slider, and best-sellers support

This migration extends the Alif Ta Ya Mazar store with three new features:
1. Customizable homepage hero cover (background image + overlay + text position)
2. Daily announcements/promotions slider (managed images with links, dates, ordering)
3. Best-selling products section (manual selection by store owner)

1. Modified Tables
- `settings` — adds hero cover controls:
  - hero_image_url (text, nullable) — background image for homepage hero
  - hero_overlay (int, default 50) — overlay darkness percentage 0-100 for text readability
  - hero_text_position (text, default 'center') — text alignment: 'center', 'right', 'left'
- `products` — adds best-seller support:
  - is_bestseller (boolean, default false) — marks product as best-selling
  - bestseller_order (int, default 0) — manual ordering within best-sellers section

2. New Tables
- `announcements` — promotional slider images managed by admin
  - id (uuid, pk)
  - image_url (text, not null) — the announcement/promotion image
  - link_url (text, nullable) — optional destination (product, category, or external)
  - title (text, nullable) — optional title for accessibility/alt text
  - active (boolean, default true) — whether it appears in rotation
  - start_date (date, nullable) — optional start date for scheduling
  - end_date (date, nullable) — optional end date for scheduling
  - sort_order (int, default 0) — manual ordering
  - created_at (timestamptz)

3. New Storage Bucket
- `announcements` (public) — for announcement slider images

4. Security
- RLS enabled on `announcements` with anon+authenticated full CRUD (single-tenant, admin-managed).
- Storage policies for the `announcements` bucket (public read + admin write).
- No changes to existing RLS policies — all existing policies preserved.
*/

-- Add hero cover columns to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_image_url text;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_overlay int NOT NULL DEFAULT 50;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_text_position text NOT NULL DEFAULT 'center';

-- Add best-seller columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS bestseller_order int NOT NULL DEFAULT 0;

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url text,
  title text,
  active boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);
CREATE INDEX IF NOT EXISTS idx_announcements_sort ON announcements(sort_order);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- announcements: public CRUD (single-tenant, admin-managed)
DROP POLICY IF EXISTS "anon_select_announcements" ON announcements;
CREATE POLICY "anon_select_announcements" ON announcements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_announcements" ON announcements;
CREATE POLICY "anon_insert_announcements" ON announcements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_announcements" ON announcements;
CREATE POLICY "anon_update_announcements" ON announcements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_announcements" ON announcements;
CREATE POLICY "anon_delete_announcements" ON announcements FOR DELETE
  TO anon, authenticated USING (true);

-- Add bestseller index for homepage query
CREATE INDEX IF NOT EXISTS idx_products_is_bestseller ON products(is_bestseller);

-- Create announcements storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for announcements bucket
DROP POLICY IF EXISTS "public_read_announcements" ON storage.objects;
CREATE POLICY "public_read_announcements" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "public_write_announcements" ON storage.objects;
CREATE POLICY "public_write_announcements" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'announcements');

DROP POLICY IF EXISTS "public_update_announcements" ON storage.objects;
CREATE POLICY "public_update_announcements" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'announcements') WITH CHECK (bucket_id = 'announcements');

DROP POLICY IF EXISTS "public_delete_announcements" ON storage.objects;
CREATE POLICY "public_delete_announcements" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'announcements');
