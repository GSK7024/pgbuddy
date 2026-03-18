-- =============================================
-- MESS MANAGEMENT SYSTEM
-- Standalone monthly meal subscription system
-- =============================================

-- Mess Plans: owner-defined meal plans
CREATE TABLE public.mess_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  meals_included text[] NOT NULL DEFAULT '{"lunch"}',
  monthly_price numeric NOT NULL DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mess_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their mess plans"
ON public.mess_plans FOR ALL TO authenticated
USING (owner_id = auth.uid() OR owner_id IN (
  SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
))
WITH CHECK (owner_id = auth.uid() OR owner_id IN (
  SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
));

-- Mess Members: people who subscribe to eat
CREATE TABLE public.mess_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  plan_id uuid REFERENCES public.mess_plans(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text,
  email text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.mess_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their mess members"
ON public.mess_members FOR ALL TO authenticated
USING (owner_id = auth.uid() OR owner_id IN (
  SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
))
WITH CHECK (owner_id = auth.uid() OR owner_id IN (
  SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
));

-- Mess Attendance: daily meal check-in
CREATE TABLE public.mess_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.mess_members(id) ON DELETE CASCADE,
  attendance_date date NOT NULL DEFAULT CURRENT_DATE,
  breakfast boolean DEFAULT false,
  lunch boolean DEFAULT false,
  dinner boolean DEFAULT false,
  marked_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (member_id, attendance_date)
);

ALTER TABLE public.mess_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage mess attendance"
ON public.mess_attendance FOR ALL TO authenticated
USING (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
)
WITH CHECK (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
);

-- Mess Off Days: pre-requested days off
CREATE TABLE public.mess_off_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.mess_members(id) ON DELETE CASCADE,
  off_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (member_id, off_date)
);

ALTER TABLE public.mess_off_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage mess off days"
ON public.mess_off_days FOR ALL TO authenticated
USING (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
)
WITH CHECK (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
);

-- Mess Payments: monthly billing
CREATE TABLE public.mess_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.mess_members(id) ON DELETE CASCADE,
  month text NOT NULL,
  base_amount numeric NOT NULL DEFAULT 0,
  off_day_deduction numeric DEFAULT 0,
  final_amount numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  payment_date date,
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (member_id, month)
);

ALTER TABLE public.mess_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage mess payments"
ON public.mess_payments FOR ALL TO authenticated
USING (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
)
WITH CHECK (
  member_id IN (SELECT id FROM public.mess_members WHERE owner_id = auth.uid())
  OR member_id IN (SELECT id FROM public.mess_members WHERE owner_id IN (
    SELECT owner_id FROM public.staff_members WHERE staff_user_id = auth.uid() AND status = 'active'
  ))
);
