/*
# Revoke anon write grants on content tables

The RLS policies already restrict writes to authenticated only, but the
default Postgres grants still give anon INSERT/UPDATE/DELETE privileges.
While RLS policies are checked first and will block anon writes, revoking
the grants removes the attack surface entirely (defense in depth).
*/

-- Revoke anon write privileges on all content tables
REVOKE INSERT, UPDATE, DELETE ON products FROM anon;
REVOKE INSERT, UPDATE, DELETE ON categories FROM anon;
REVOKE INSERT, UPDATE, DELETE ON product_images FROM anon;
REVOKE INSERT, UPDATE, DELETE ON announcements FROM anon;
REVOKE INSERT, UPDATE, DELETE ON announcement_settings FROM anon;

-- Revoke ALL anon access to settings table (including INSERT/UPDATE/DELETE)
REVOKE ALL ON settings FROM anon;

-- Revoke anon write on admin_users
REVOKE ALL ON admin_users FROM anon;
GRANT SELECT ON admin_users TO authenticated;

-- Ensure public_settings view only has SELECT for anon
REVOKE INSERT, UPDATE, DELETE ON public_settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public_settings FROM authenticated;
