
-- Staff role enum
CREATE TYPE public.staff_role AS ENUM ('manager', 'accountant', 'caretaker');

-- Staff members table
CREATE TABLE public.staff_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  staff_user_id uuid,
  invited_email text,
  role staff_role NOT NULL DEFAULT 'caretaker',
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_unique UNIQUE (owner_id, staff_user_id, property_id)
);

CREATE INDEX idx_staff_members_owner ON public.staff_members(owner_id);
CREATE INDEX idx_staff_members_staff ON public.staff_members(staff_user_id);

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Owners can manage their staff
CREATE POLICY "Owners can manage staff"
ON public.staff_members
FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Staff can view their own records
CREATE POLICY "Staff can view own records"
ON public.staff_members
FOR SELECT
TO authenticated
USING (auth.uid() = staff_user_id);

-- Security definer: check if user is staff for a property with specific roles
CREATE OR REPLACE FUNCTION public.is_staff_of_property(
  _user_id uuid,
  _property_id uuid,
  _allowed_roles staff_role[] DEFAULT ARRAY['manager','accountant','caretaker']::staff_role[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_members
    WHERE staff_user_id = _user_id
      AND status = 'active'
      AND role = ANY(_allowed_roles)
      AND (property_id = _property_id OR property_id IS NULL)
  )
$$;

-- Security definer: get the owner_id for a staff member
CREATE OR REPLACE FUNCTION public.get_staff_owner_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM staff_members
  WHERE staff_user_id = _user_id
    AND status = 'active'
  LIMIT 1
$$;

-- Security definer: get all property IDs a staff member can access
CREATE OR REPLACE FUNCTION public.get_staff_property_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- If property_id is NULL, they have access to ALL owner properties
  SELECT p.id FROM properties p
  WHERE p.owner_id IN (
    SELECT owner_id FROM staff_members 
    WHERE staff_user_id = _user_id AND status = 'active' AND property_id IS NULL
  )
  UNION
  -- Specific property assignments
  SELECT sm.property_id FROM staff_members sm
  WHERE sm.staff_user_id = _user_id AND sm.status = 'active' AND sm.property_id IS NOT NULL
$$;
