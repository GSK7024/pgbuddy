
-- Fix all RLS policies: drop RESTRICTIVE ones and recreate as PERMISSIVE

-- ===== COMPLAINTS =====
DROP POLICY IF EXISTS "Tenants can manage their complaints" ON public.complaints;
DROP POLICY IF EXISTS "Owners can view and update complaints" ON public.complaints;

CREATE POLICY "Tenants can manage their complaints"
ON public.complaints FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update complaints"
ON public.complaints FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = complaints.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = complaints.property_id AND properties.owner_id = auth.uid()));

-- ===== EXPENSES =====
DROP POLICY IF EXISTS "Owners can manage expenses" ON public.expenses;

CREATE POLICY "Owners can manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.owner_id = auth.uid()));

-- ===== PROFILES =====
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Allow owners to read tenant profiles (needed for tenant management)
CREATE POLICY "Owners can view tenant profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE ta.tenant_id = profiles.user_id
    AND p.owner_id = auth.uid()
  )
);

-- ===== PROPERTIES =====
DROP POLICY IF EXISTS "Owners can manage their properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

CREATE POLICY "Owners can manage their properties"
ON public.properties FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active properties"
ON public.properties FOR SELECT
USING (is_active = true);

-- ===== RENT_PAYMENTS =====
DROP POLICY IF EXISTS "Owners can manage rent payments" ON public.rent_payments;
DROP POLICY IF EXISTS "Tenants can view their own payments" ON public.rent_payments;

CREATE POLICY "Owners can manage rent payments"
ON public.rent_payments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rent_payments.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = rent_payments.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Tenants can view their own payments"
ON public.rent_payments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- ===== ROOMS =====
DROP POLICY IF EXISTS "Owners can manage rooms of their properties" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view vacant rooms" ON public.rooms;

CREATE POLICY "Owners can manage rooms of their properties"
ON public.rooms FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Anyone can view vacant rooms"
ON public.rooms FOR SELECT
USING (is_vacant = true);

-- ===== TENANT_ASSIGNMENTS =====
DROP POLICY IF EXISTS "Owners can manage tenant assignments" ON public.tenant_assignments;
DROP POLICY IF EXISTS "Tenants can view their own assignments" ON public.tenant_assignments;

CREATE POLICY "Owners can manage tenant assignments"
ON public.tenant_assignments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_assignments.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_assignments.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Tenants can view their own assignments"
ON public.tenant_assignments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- ===== USER_ROLES =====
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ===== VACANCY_NOTICES =====
DROP POLICY IF EXISTS "Tenants can manage their vacancy notices" ON public.vacancy_notices;
DROP POLICY IF EXISTS "Owners can view and update vacancy notices" ON public.vacancy_notices;

CREATE POLICY "Tenants can manage their vacancy notices"
ON public.vacancy_notices FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update vacancy notices"
ON public.vacancy_notices FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = vacancy_notices.property_id AND properties.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = vacancy_notices.property_id AND properties.owner_id = auth.uid()));

-- Also allow owners to look up profiles by email for tenant assignment
-- Create a function to find user by email (security definer to access auth.users)
CREATE OR REPLACE FUNCTION public.find_user_by_email(_email text)
RETURNS TABLE(user_id uuid, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE u.email = _email
  LIMIT 1;
$$;
