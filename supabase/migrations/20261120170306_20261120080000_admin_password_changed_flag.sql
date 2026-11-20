/*
# Admin password-change tracking

1. Purpose
- Adds a `password_changed` flag to `admin_users` so the panel can require a
  password change after the very first admin sign-in with the temporary
  credentials. The claim/setup flow creates the account with the flag false;
  after the admin sets their own password the flag becomes true and the
  prompt never appears again.

2. Schema changes
- `admin_users.password_changed` (boolean, not null, default false) — new column.

3. Security changes
- New policy: an authenticated admin may update ONLY their own admin_users row.
- Column-scoped grant: authenticated can only UPDATE the password_changed
  column of admin_users — no other column, no inserts outside the claim RPC.
- SELECT policy (own row) already exists.

4. Notes
- Idempotent (IF NOT EXISTS). No existing data is modified; all 43 products,
  10 categories, 63 images, 2 announcements and settings remain untouched.
*/

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "admin_users_update_own" ON admin_users;
CREATE POLICY "admin_users_update_own" ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON admin_users FROM authenticated;
GRANT UPDATE (password_changed) ON admin_users TO authenticated;
