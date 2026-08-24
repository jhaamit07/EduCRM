/*
# EdTech CRM — Initial Schema

## Overview
Creates the database backbone for an EdTech CRM application with employee
authentication, role-based access (Admin vs. Sales/Counselor), leads management,
course catalog, and profit/conversion analytics.

## New Tables

### profiles
- `id` (uuid, PK, references auth.users) — one row per employee account
- `email` (text) — employee email
- `full_name` (text) — display name
- `role` (text, default 'sales', check admin|sales) — access level
- `created_at` (timestamptz)

### courses
- `id` (uuid, PK)
- `title` (text) — course name
- `description` (text) — what the course covers
- `duration_weeks` (int) — length of the course
- `price` (numeric) — enrollment price (revenue per conversion)
- `cost` (numeric, default 0) — internal delivery cost (for net profit)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

### leads
- `id` (uuid, PK)
- `name` (text) — prospective student name
- `email` (text)
- `phone` (text)
- `status` (text, default 'new', check new|contacted|converted|lost)
- `course_id` (uuid, FK → courses, nullable) — course of interest
- `assigned_to` (uuid, FK → profiles, nullable) — counselor responsible
- `notes` (text) — free-form notes
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security (RLS)
- profiles: all authenticated employees can read; inserts handled by trigger;
  updates/deletes restricted — role changes only via SECURITY DEFINER function.
- courses: all authenticated can read; only admins can write.
- leads: all authenticated employees can CRUD (shared CRM data).

## Functions
- `handle_new_user()` trigger — auto-creates a profile row (role 'sales')
  whenever a new auth.users account is created via sign-up.
- `set_user_role(target uuid, new_role text)` SECURITY DEFINER — allows an
  admin to promote/demote a user. Validates caller is admin and role value.
- `update_lead_timestamp()` trigger — keeps leads.updated_at current.

## Important Notes
1. The profile trigger runs as SECURITY DEFINER so it works during the
   auth sign-up flow regardless of RLS state.
2. The `set_user_role` function is the ONLY way to change a profile role;
   direct UPDATE on profiles.role is blocked by RLS (no UPDATE policy).
3. Admin checks in policies use a subquery against profiles — no
   user-editable metadata is trusted for authorization.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies: managed by trigger + SECURITY DEFINER fn

-- ============================================================
-- courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  duration_weeks int NOT NULL DEFAULT 4,
  price numeric(10,2) NOT NULL DEFAULT 0,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_authenticated" ON courses;
CREATE POLICY "courses_select_authenticated"
  ON courses FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "courses_insert_admin" ON courses;
CREATE POLICY "courses_insert_admin"
  ON courses FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "courses_update_admin" ON courses;
CREATE POLICY "courses_update_admin"
  ON courses FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "courses_delete_admin" ON courses;
CREATE POLICY "courses_delete_admin"
  ON courses FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================================
-- leads
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted','lost')),
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_authenticated" ON leads;
CREATE POLICY "leads_select_authenticated"
  ON leads FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "leads_insert_authenticated" ON leads;
CREATE POLICY "leads_insert_authenticated"
  ON leads FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "leads_update_authenticated" ON leads;
CREATE POLICY "leads_update_authenticated"
  ON leads FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "leads_delete_authenticated" ON leads;
CREATE POLICY "leads_delete_authenticated"
  ON leads FOR DELETE TO authenticated
  USING (true);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'sales'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update leads.updated_at
CREATE OR REPLACE FUNCTION public.update_lead_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.update_lead_timestamp();

-- ============================================================
-- SECURITY DEFINER: set_user_role (admin-only role changes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_user_role(target uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_role NOT IN ('admin', 'sales') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
