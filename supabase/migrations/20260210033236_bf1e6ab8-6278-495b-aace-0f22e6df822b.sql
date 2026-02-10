
-- Role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'tenant');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role on signup"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Properties table (PG buildings)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  locality TEXT,
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  rules TEXT,
  gender_preference TEXT DEFAULT 'any',
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their properties"
ON public.properties FOR ALL TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Anyone can view active properties"
ON public.properties FOR SELECT
USING (is_active = true);

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rooms table
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL DEFAULT 'single',
  capacity INT NOT NULL DEFAULT 1,
  rent_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  is_vacant BOOLEAN DEFAULT true,
  amenities TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage rooms of their properties"
ON public.rooms FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rooms.property_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rooms.property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view vacant rooms"
ON public.rooms FOR SELECT
USING (is_vacant = true);

CREATE TRIGGER update_rooms_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tenants table (linking tenants to rooms)
CREATE TABLE public.tenant_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  move_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  move_out_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenant_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage tenant assignments"
ON public.tenant_assignments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = tenant_assignments.property_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = tenant_assignments.property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their own assignments"
ON public.tenant_assignments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- Rent payments
CREATE TABLE public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage rent payments"
ON public.rent_payments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rent_payments.property_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = rent_payments.property_id AND owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their own payments"
ON public.rent_payments FOR SELECT TO authenticated
USING (auth.uid() = tenant_id);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage expenses"
ON public.expenses FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = expenses.property_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = expenses.property_id AND owner_id = auth.uid()
  )
);

-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  status TEXT NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their complaints"
ON public.complaints FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update complaints"
ON public.complaints FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = complaints.property_id AND owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = complaints.property_id AND owner_id = auth.uid()
  )
);

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vacancy notices
CREATE TABLE public.vacancy_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  notice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_move_out DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vacancy_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their vacancy notices"
ON public.vacancy_notices FOR ALL TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view vacancy notices for their properties"
ON public.vacancy_notices FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE id = vacancy_notices.property_id AND owner_id = auth.uid()
  )
);
