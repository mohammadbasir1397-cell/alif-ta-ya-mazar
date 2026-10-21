/*
# Create Alif Ta Ya Mazar store schema (single-tenant, admin-managed)

This is an online store for "الف تا ی (مزار)" — Alif Ta Ya Mazar.
The store has NO customer accounts/sign-in. All content is public (anon-readable).
The admin manages categories, products, logo, and store settings through a dashboard
gated by a simple admin password stored in the settings table (validated client-side).

1. New Tables
- `categories` — product categories (editable, reorderable, optional image)
  - id (uuid, pk)
  - name (text, not null) — Persian/Dari name
  - slug (text, unique) — url-friendly identifier
  - image_url (text, nullable) — optional category image
  - sort_order (int, default 0) — manual ordering
  - created_at (timestamptz)
- `products` — store products
  - id (uuid, pk)
  - name (text, not null) — Persian/Dari name
  - code (text, unique, not null) — unique product code
  - description (text, nullable)
  - price (numeric, not null) — regular price in AFN
  - discount_price (numeric, nullable) — optional discounted price in AFN
  - category_id (uuid, fk -> categories.id, nullable, on delete set null)
  - is_new (boolean, default false)
  - is_popular (boolean, default false)
  - is_discounted (boolean, default false)
  - in_stock (boolean, default true)
  - sort_order (int, default 0)
  - created_at (timestamptz)
- `product_images` — multiple images per product
  - id (uuid, pk)
  - product_id (uuid, fk -> products.id, on delete cascade)
  - image_url (text, not null)
  - sort_order (int, default 0)
  - created_at (timestamptz)
- `settings` — single-row store settings (logo, whatsapp number, etc.)
  - id (int, pk, always 1)
  - logo_url (text, nullable)
  - store_name (text, default 'الف تا ی (مزار)')
  - whatsapp_number (text, nullable) — for "خرید از واتساپ" button
  - admin_password (text, default 'admin123') — simple gate for dashboard
  - hero_text (text, nullable)
  - created_at (timestamptz)

2. Indexes
- products.category_id (frequent filtering)
- products.is_new, is_popular, is_discounted (homepage sections)
- products.code (unique lookup)
- categories.slug (unique)
- product_images.product_id (fetching a product's images)

3. Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD because this is a single-tenant
  store with no customer accounts — content is intentionally public/shared, and the
  admin dashboard is gated by a client-side password check against `settings.admin_password`.
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  discount_price numeric(12,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  is_new boolean NOT NULL DEFAULT false,
  is_popular boolean NOT NULL DEFAULT false,
  is_discounted boolean NOT NULL DEFAULT false,
  in_stock boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo_url text,
  store_name text NOT NULL DEFAULT 'الف تا ی (مزار)',
  whatsapp_number text,
  admin_password text NOT NULL DEFAULT 'admin123',
  hero_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure single settings row exists
INSERT INTO settings (id, store_name)
VALUES (1, 'الف تا ی (مزار)')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new);
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_is_discounted ON products(is_discounted);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- categories: public CRUD (single-tenant, admin-managed)
DROP POLICY IF EXISTS "anon_select_categories" ON categories;
CREATE POLICY "anon_select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_categories" ON categories;
CREATE POLICY "anon_insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_categories" ON categories;
CREATE POLICY "anon_update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_categories" ON categories;
CREATE POLICY "anon_delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- products: public CRUD
DROP POLICY IF EXISTS "anon_select_products" ON products;
CREATE POLICY "anon_select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_products" ON products;
CREATE POLICY "anon_insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_products" ON products;
CREATE POLICY "anon_update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_products" ON products;
CREATE POLICY "anon_delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- product_images: public CRUD
DROP POLICY IF EXISTS "anon_select_product_images" ON product_images;
CREATE POLICY "anon_select_product_images" ON product_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_product_images" ON product_images;
CREATE POLICY "anon_insert_product_images" ON product_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_product_images" ON product_images;
CREATE POLICY "anon_update_product_images" ON product_images FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_product_images" ON product_images;
CREATE POLICY "anon_delete_product_images" ON product_images FOR DELETE
  TO anon, authenticated USING (true);

-- settings: public CRUD (single row, contains admin password)
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
