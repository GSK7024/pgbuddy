
-- ============================================================
-- FIX 1: Recreate ALL RLS policies as PERMISSIVE
-- ============================================================

-- COMPLAINTS
DROP POLICY IF EXISTS "Tenants can manage their complaints" ON complaints;
DROP POLICY IF EXISTS "Owners can view and update complaints" ON complaints;

CREATE POLICY "Tenants can manage their complaints" ON complaints FOR ALL TO authenticated
  USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update complaints" ON complaints FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = complaints.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = complaints.property_id AND properties.owner_id = auth.uid()));

-- EXPENSES
DROP POLICY IF EXISTS "Owners can manage expenses" ON expenses;

CREATE POLICY "Owners can manage expenses" ON expenses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = expenses.property_id AND properties.owner_id = auth.uid()));

-- PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Owners can view tenant profiles" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view tenant profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenant_assignments ta JOIN properties p ON p.id = ta.property_id WHERE ta.tenant_id = profiles.user_id AND p.owner_id = auth.uid()));

-- PROPERTIES
DROP POLICY IF EXISTS "Owners can manage their properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;

CREATE POLICY "Owners can manage their properties" ON properties FOR ALL TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active properties" ON properties FOR SELECT TO authenticated
  USING (is_active = true);

-- RENT PAYMENTS
DROP POLICY IF EXISTS "Tenants can view their own payments" ON rent_payments;
DROP POLICY IF EXISTS "Owners can manage rent payments" ON rent_payments;

CREATE POLICY "Tenants can view their own payments" ON rent_payments FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id);

CREATE POLICY "Owners can manage rent payments" ON rent_payments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rent_payments.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = rent_payments.property_id AND properties.owner_id = auth.uid()));

-- ROOMS
DROP POLICY IF EXISTS "Owners can manage rooms of their properties" ON rooms;
DROP POLICY IF EXISTS "Anyone can view vacant rooms" ON rooms;

CREATE POLICY "Owners can manage rooms of their properties" ON rooms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = rooms.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Anyone can view vacant rooms" ON rooms FOR SELECT TO authenticated
  USING (is_vacant = true);

-- Tenants can view their assigned room
CREATE POLICY "Tenants can view their assigned room" ON rooms FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenant_assignments WHERE tenant_assignments.room_id = rooms.id AND tenant_assignments.tenant_id = auth.uid() AND tenant_assignments.is_active = true));

-- TENANT ASSIGNMENTS
DROP POLICY IF EXISTS "Owners can manage tenant assignments" ON tenant_assignments;
DROP POLICY IF EXISTS "Tenants can view their own assignments" ON tenant_assignments;

CREATE POLICY "Owners can manage tenant assignments" ON tenant_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_assignments.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_assignments.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Tenants can view their own assignments" ON tenant_assignments FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id);

-- USER ROLES
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON user_roles;

CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup" ON user_roles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- VACANCY NOTICES
DROP POLICY IF EXISTS "Tenants can manage their vacancy notices" ON vacancy_notices;
DROP POLICY IF EXISTS "Owners can view and update vacancy notices" ON vacancy_notices;

CREATE POLICY "Tenants can manage their vacancy notices" ON vacancy_notices FOR ALL TO authenticated
  USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update vacancy notices" ON vacancy_notices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = vacancy_notices.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = vacancy_notices.property_id AND properties.owner_id = auth.uid()));

-- ============================================================
-- FIX 2: Create missing triggers for auto profile & role creation
-- ============================================================

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();
