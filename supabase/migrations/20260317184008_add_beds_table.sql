-- ============================================================
-- Phase 1: Create beds table + auto-migrate existing room data
-- This is a NON-BREAKING migration. No existing tables/columns
-- are modified or removed. The app continues to work as before.
-- ============================================================

-- 1. Create the beds table
CREATE TABLE public.beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  bed_label TEXT NOT NULL DEFAULT '',
  sharing_type TEXT NOT NULL DEFAULT 'single',
  rent_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  is_vacant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_beds_room_id ON public.beds(room_id);

-- Updated_at trigger
CREATE TRIGGER update_beds_updated_at
BEFORE UPDATE ON public.beds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. RLS policies for beds
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Owners can manage beds of their properties
CREATE POLICY "Owners can manage beds" ON public.beds FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.properties p ON p.id = r.property_id
    WHERE r.id = beds.room_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    JOIN public.properties p ON p.id = r.property_id
    WHERE r.id = beds.room_id AND p.owner_id = auth.uid()
  )
);

-- Staff can view beds for assigned properties
CREATE POLICY "Staff can view beds" ON public.beds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = beds.room_id
    AND r.property_id IN (SELECT public.get_staff_property_ids(auth.uid()))
  )
);

-- Manager staff can manage beds
CREATE POLICY "Manager staff can manage beds" ON public.beds FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = beds.room_id
    AND public.is_staff_of_property(auth.uid(), r.property_id, ARRAY['manager']::staff_role[])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = beds.room_id
    AND public.is_staff_of_property(auth.uid(), r.property_id, ARRAY['manager']::staff_role[])
  )
);

-- Tenants can view beds in their assigned rooms
CREATE POLICY "Tenants can view assigned beds" ON public.beds FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    WHERE ta.room_id = beds.room_id
    AND ta.tenant_id = auth.uid()
    AND ta.is_active = true
  )
);

-- Anyone can view vacant beds (for public property pages)
CREATE POLICY "Anyone can view vacant beds" ON public.beds FOR SELECT
USING (is_vacant = true);

-- 3. Add optional bed_id to tenant_assignments
ALTER TABLE public.tenant_assignments
ADD COLUMN bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL;

-- 4. Auto-populate beds from existing rooms
-- For each existing room, create beds based on capacity
-- Each bed gets the same rent_amount and deposit_amount as the room
DO $$
DECLARE
  r RECORD;
  i INT;
  labels TEXT[] := ARRAY['A','B','C','D','E','F','G','H','I','J','K','L'];
BEGIN
  FOR r IN SELECT id, room_type, capacity, rent_amount, deposit_amount FROM public.rooms
  LOOP
    FOR i IN 1..r.capacity
    LOOP
      INSERT INTO public.beds (room_id, bed_label, sharing_type, rent_amount, deposit_amount, is_vacant)
      VALUES (
        r.id,
        CASE WHEN r.capacity = 1 THEN '' ELSE labels[i] END,
        r.room_type,
        r.rent_amount,
        COALESCE(r.deposit_amount, 0),
        true
      );
    END LOOP;
  END LOOP;
END $$;

-- 5. Link existing tenant_assignments to their beds
-- For active assignments, find a vacant bed in the same room and link it
DO $$
DECLARE
  ta RECORD;
  bed_uuid UUID;
BEGIN
  FOR ta IN
    SELECT id, room_id FROM public.tenant_assignments
    WHERE is_active = true AND bed_id IS NULL
    ORDER BY created_at ASC
  LOOP
    -- Pick the first vacant bed in this room
    SELECT b.id INTO bed_uuid
    FROM public.beds b
    WHERE b.room_id = ta.room_id AND b.is_vacant = true
    LIMIT 1;

    IF bed_uuid IS NOT NULL THEN
      UPDATE public.tenant_assignments SET bed_id = bed_uuid WHERE id = ta.id;
      UPDATE public.beds SET is_vacant = false WHERE id = bed_uuid;
    END IF;
  END LOOP;
END $$;
