-- ============================================================
-- PharmaTrack — Seed: link a dashboard-created user to a pharmacy
-- Run this AFTER fix_trigger.sql, once per test user.
--
-- Replace the two values at the top before running:
--   TEST_USER_EMAIL  → the email you used when creating the user
--   DISPLAY_NAME     → the name to show in the sidebar
-- ============================================================

DO $$
DECLARE
  v_email        text := 'alexisluquet92@gmail.com';  -- ← change this
  v_display_name text := 'M.LUQUET';           -- ← change this

  v_user_id     uuid;
  v_pharmacy_id uuid;
BEGIN

  -- 1. Resolve the auth user id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email: %', v_email;
  END IF;

  -- 2. Create (or reuse) the demo pharmacy
  INSERT INTO pharmacies (name, city, plan)
  VALUES ('Pharmacie du Centre', 'Lyon', 'pro')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_pharmacy_id
  FROM pharmacies
  WHERE name = 'Pharmacie du Centre'
  LIMIT 1;

  -- 3. Create (or update) the profile
  INSERT INTO profiles (id, pharmacy_id, full_name, role)
  VALUES (v_user_id, v_pharmacy_id, v_display_name, 'owner')
  ON CONFLICT (id) DO UPDATE
    SET pharmacy_id = EXCLUDED.pharmacy_id,
        full_name   = EXCLUDED.full_name,
        role        = EXCLUDED.role,
        updated_at  = now();

  RAISE NOTICE 'Done — user % linked to pharmacy %', v_email, v_pharmacy_id;
END;
$$;
