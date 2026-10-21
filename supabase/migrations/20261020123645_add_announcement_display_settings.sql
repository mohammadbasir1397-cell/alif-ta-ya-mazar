/*
# Add announcement display settings table

This migration adds a new `announcement_settings` table that stores global display
preferences for the announcements/promotions slider on the homepage. This lets the
store owner control banner dimensions, image fit mode, image position, border radius,
and separate desktop/mobile dimensions — all without editing code.

1. New Tables
- `announcement_settings` — single-row settings (id=1) for the slider display
  - id (int, pk, always 1)
  - desktop_width (int, default 1152) — max banner width in px on desktop
  - desktop_height (int, default 300) — banner height in px on desktop
  - mobile_width (int, default 600) — max banner width in px on mobile
  - mobile_height (int, default 200) — banner height in px on mobile
  - fit_mode (text, default 'contain') — 'contain' | 'cover' | 'fill'
  - image_position (text, default 'center') — 'center' | 'top' | 'bottom' | 'left' | 'right'
  - border_radius (int, default 12) — rounded corners in px
  - bg_color (text, default '#0f1d38') — background color behind image (for contain mode)
  - created_at (timestamptz)

2. Security
- RLS enabled with anon+authenticated SELECT and UPDATE (single-tenant, admin-managed).
- No INSERT policy needed because the single row is seeded in this migration.
*/

CREATE TABLE IF NOT EXISTS announcement_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  desktop_width int NOT NULL DEFAULT 1152,
  desktop_height int NOT NULL DEFAULT 300,
  mobile_width int NOT NULL DEFAULT 600,
  mobile_height int NOT NULL DEFAULT 200,
  fit_mode text NOT NULL DEFAULT 'contain' CHECK (fit_mode IN ('contain', 'cover', 'fill')),
  image_position text NOT NULL DEFAULT 'center' CHECK (image_position IN ('center', 'top', 'bottom', 'left', 'right')),
  border_radius int NOT NULL DEFAULT 12,
  bg_color text NOT NULL DEFAULT '#0f1d38',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO announcement_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE announcement_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_announcement_settings" ON announcement_settings;
CREATE POLICY "anon_select_announcement_settings" ON announcement_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_update_announcement_settings" ON announcement_settings;
CREATE POLICY "anon_update_announcement_settings" ON announcement_settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
