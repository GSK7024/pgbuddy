-- Fix: Allow manager staff to INSERT new properties for their owner
-- The existing "Manager staff can manage properties" policy uses is_staff_of_property(id),
-- which fails on INSERT because the new property doesn't have a matching staff assignment yet.

-- Add a specific INSERT policy for staff managers based on owner_id matching
DROP POLICY IF EXISTS "Manager staff can insert properties" ON public.properties;
CREATE POLICY "Manager staff can insert properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = public.get_staff_owner_id(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.staff_members
    WHERE staff_user_id = auth.uid()
      AND status = 'active'
      AND role = 'manager'
  )
);
