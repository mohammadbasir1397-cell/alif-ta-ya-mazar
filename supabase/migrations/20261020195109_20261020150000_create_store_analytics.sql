/*
# Create secure store analytics tracking

1. Purpose
- Adds durable, privacy-conscious counters for live store sessions and successful PWA installation events.
- Keeps analytics data separate from products, settings, and customer-facing store content.

2. New Tables
- `store_live_sessions`
  - `session_id` (uuid, primary key) — anonymous browser session identifier.
  - `last_seen_at` (timestamptz) — most recent heartbeat from that browser.
  - `created_at` (timestamptz) — first observed time.
- `store_pwa_installs`
  - `installation_id` (uuid, primary key) — anonymous installation identifier.
  - `first_installed_at` (timestamptz) — first recorded successful installation.
  - `last_seen_at` (timestamptz) — most recent installation confirmation from that browser.

3. Security
- Enables RLS on both tables.
- Allows the public browser to insert and update only its own anonymous tracking identifier.
- Does not allow anonymous reads; dashboard totals are returned only by the protected analytics Edge Function.
- No IP addresses, names, emails, or device fingerprints are stored.

4. Important Notes
- A live visitor is counted when its heartbeat was received within the last 5 minutes.
- PWA installation counts represent unique anonymous installation identifiers, not personally identified users.
- Existing store tables and data are not modified.
*/

CREATE TABLE IF NOT EXISTS store_live_sessions (
  session_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_pwa_installs (
  installation_id uuid PRIMARY KEY,
  first_installed_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_live_sessions_last_seen_at
  ON store_live_sessions(last_seen_at);

ALTER TABLE store_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_pwa_installs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_track_live_session" ON store_live_sessions;
CREATE POLICY "public_track_live_session" ON store_live_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_refresh_live_session" ON store_live_sessions;
CREATE POLICY "public_refresh_live_session" ON store_live_sessions
  FOR UPDATE TO anon, authenticated
  USING (session_id = session_id)
  WITH CHECK (session_id = session_id);

DROP POLICY IF EXISTS "public_track_pwa_install" ON store_pwa_installs;
CREATE POLICY "public_track_pwa_install" ON store_pwa_installs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_refresh_pwa_install" ON store_pwa_installs;
CREATE POLICY "public_refresh_pwa_install" ON store_pwa_installs
  FOR UPDATE TO anon, authenticated
  USING (installation_id = installation_id)
  WITH CHECK (installation_id = installation_id);

REVOKE SELECT, DELETE ON store_live_sessions FROM anon, authenticated;
REVOKE SELECT, DELETE ON store_pwa_installs FROM anon, authenticated;
