-- Migration to support owner-level default payment info
ALTER TABLE public.payment_info ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.payment_info ALTER COLUMN property_id DROP NOT NULL;

-- Backfill owner_id for existing payment info rows
UPDATE public.payment_info pi
SET owner_id = p.owner_id
FROM public.properties p
WHERE pi.property_id = p.id AND pi.owner_id IS NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Owners can manage payment info for their properties" ON public.payment_info;
DROP POLICY IF EXISTS "Tenants can view payment info for their assigned property" ON public.payment_info;

-- Also drop new policies in case of partial run
DROP POLICY IF EXISTS "Owners can manage payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Tenants and staff can view payment info" ON public.payment_info;

-- Create new policies
CREATE POLICY "Owners can manage payment info" 
ON public.payment_info
FOR ALL
TO authenticated
USING (
  owner_id = auth.uid() 
  OR 
  property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
)
WITH CHECK (
  owner_id = auth.uid() 
  OR 
  property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid())
);

CREATE POLICY "Tenants and staff can view payment info" 
ON public.payment_info
FOR SELECT
TO authenticated
USING (
  -- tenants checking property specific
  EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    WHERE ta.tenant_id = auth.uid() 
      AND ta.property_id = payment_info.property_id
  )
  OR
  -- tenants checking owner default
  EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE ta.tenant_id = auth.uid()
      AND p.owner_id = payment_info.owner_id
  )
  OR
  -- staff checking property specific or owner default
  EXISTS (
    SELECT 1 FROM public.staff_members sm
    WHERE sm.staff_user_id = auth.uid()
      AND sm.status = 'active'
      AND (
        (payment_info.property_id IS NOT NULL AND sm.property_id = payment_info.property_id) OR
        (payment_info.property_id IS NOT NULL AND sm.property_id IS NULL AND payment_info.property_id IN (SELECT id FROM properties WHERE owner_id = sm.owner_id)) OR
        (payment_info.property_id IS NULL AND payment_info.owner_id = sm.owner_id)
      )
  )
);
