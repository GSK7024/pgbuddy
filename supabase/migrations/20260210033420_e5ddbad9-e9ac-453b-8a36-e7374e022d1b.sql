
-- Fix: All policies were created as RESTRICTIVE (default when using FOR ALL).
-- We need to drop and recreate them as PERMISSIVE so OR logic applies.

-- Properties: drop and recreate
DROP POLICY IF EXISTS "Owners can manage their properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

CREATE POLICY "Owners can manage their properties"
ON public.properties FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active properties"
ON public.properties FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Rooms
DROP POLICY IF EXISTS "Owners can manage rooms of their properties" ON public.rooms;
DROP POLICY IF EXISTS "Anyone can view vacant rooms" ON public.rooms;

CREATE POLICY "Owners can manage rooms of their properties"
ON public.rooms FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = rooms.property_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = rooms.property_id AND owner_id = auth.uid()));

CREATE POLICY "Anyone can view vacant rooms"
ON public.rooms FOR SELECT TO anon, authenticated
USING (is_vacant = true);

-- Tenant assignments
DROP POLICY IF EXISTS "Owners can manage tenant assignments" ON public.tenant_assignments;
DROP POLICY IF EXISTS "Tenants can view their own assignments" ON public.tenant_assignments;

CREATE POLICY "Owners can manage tenant assignments"
ON public.tenant_assignments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = tenant_assignments.property_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = tenant_assignments.property_id AND owner_id = auth.uid()));

CREATE POLICY "Tenants can view their own assignments"
ON public.tenant_assignments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- Rent payments
DROP POLICY IF EXISTS "Owners can manage rent payments" ON public.rent_payments;
DROP POLICY IF EXISTS "Tenants can view their own payments" ON public.rent_payments;

CREATE POLICY "Owners can manage rent payments"
ON public.rent_payments FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = rent_payments.property_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = rent_payments.property_id AND owner_id = auth.uid()));

CREATE POLICY "Tenants can view their own payments"
ON public.rent_payments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- Expenses
DROP POLICY IF EXISTS "Owners can manage expenses" ON public.expenses;

CREATE POLICY "Owners can manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = expenses.property_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = expenses.property_id AND owner_id = auth.uid()));

-- Complaints
DROP POLICY IF EXISTS "Tenants can manage their complaints" ON public.complaints;
DROP POLICY IF EXISTS "Owners can view and update complaints" ON public.complaints;

CREATE POLICY "Tenants can manage their complaints"
ON public.complaints FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update complaints"
ON public.complaints FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = complaints.property_id AND owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.properties WHERE id = complaints.property_id AND owner_id = auth.uid()));

-- Vacancy notices
DROP POLICY IF EXISTS "Tenants can manage their vacancy notices" ON public.vacancy_notices;
DROP POLICY IF EXISTS "Owners can view vacancy notices for their properties" ON public.vacancy_notices;

CREATE POLICY "Tenants can manage their vacancy notices"
ON public.vacancy_notices FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view vacancy notices for their properties"
ON public.vacancy_notices FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.properties WHERE id = vacancy_notices.property_id AND owner_id = auth.uid()));

-- User roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Profiles
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
