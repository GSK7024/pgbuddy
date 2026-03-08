CREATE POLICY "Owners can update tenant profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE ta.tenant_id = profiles.user_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE ta.tenant_id = profiles.user_id AND p.owner_id = auth.uid()
  )
);