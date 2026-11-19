/*
# First-run admin claim function

1. Purpose
- The store had no admin account in its auth system. To avoid leaving an
  open door, this adds a SECURITY DEFINER function that lets the FIRST
  person who signs up claim admin status — but only if BOTH are true:
  a) no admin exists yet (admin_users is empty), AND
  b) they know the store's current admin password (settings.admin_password).
- After one admin exists, the function always returns false and no new
  admin can be added this way.

2. Security
- Function is SECURITY DEFINER so the emptiness check bypasses RLS safely
  (a plain policy subquery would be readable by any signed-in user).
- EXECUTE revoked from PUBLIC and anon; granted to authenticated only.
- No data is read, modified or deleted other than inserting one admin_users row.

3. Notes
- Idempotent and safe to re-run. No existing rows are touched.
*/

CREATE OR REPLACE FUNCTION public.claim_admin_if_none(store_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  admin_count int;
  expected_password text;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT count(*) INTO admin_count FROM admin_users;
  IF admin_count > 0 THEN
    RETURN false;
  END IF;

  SELECT admin_password INTO expected_password FROM settings WHERE id = 1;
  IF expected_password IS NULL OR store_password <> expected_password THEN
    RETURN false;
  END IF;

  INSERT INTO admin_users (user_id) VALUES (uid);
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_none(text) TO authenticated;
