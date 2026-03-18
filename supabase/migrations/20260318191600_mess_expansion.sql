-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Mess One-time Meals (for guest entries)
CREATE TABLE IF NOT EXISTS public.mess_one_time_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snacks'
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mess Expenses (for tracking mess specific costs)
CREATE TABLE IF NOT EXISTS public.mess_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL, -- 'groceries', 'vegetables', 'dairy', 'gas', 'staff', 'other'
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mess_one_time_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for One-time Meals
CREATE POLICY "Owners can manage their mess one-time meals"
ON public.mess_one_time_meals
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Staff can manage their owner's mess one-time meals"
ON public.mess_one_time_meals
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_members s
        WHERE s.staff_user_id = auth.uid()
        AND s.owner_id = mess_one_time_meals.owner_id
        AND s.status = 'active'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff_members s
        WHERE s.staff_user_id = auth.uid()
        AND s.owner_id = mess_one_time_meals.owner_id
        AND s.status = 'active'
    )
);

-- RLS Policies for Mess Expenses
CREATE POLICY "Owners can manage their mess expenses"
ON public.mess_expenses
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Staff can manage their owner's mess expenses"
ON public.mess_expenses
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.staff_members s
        WHERE s.staff_user_id = auth.uid()
        AND s.owner_id = mess_expenses.owner_id
        AND s.status = 'active'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.staff_members s
        WHERE s.staff_user_id = auth.uid()
        AND s.owner_id = mess_expenses.owner_id
        AND s.status = 'active'
    )
);
