
CREATE TABLE public.rent_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.tenant_assignments(id) ON DELETE CASCADE,
  old_rent numeric,
  new_rent numeric NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.rent_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage rent history"
ON public.rent_history
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE ta.id = rent_history.assignment_id AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE ta.id = rent_history.assignment_id AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their rent history"
ON public.rent_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_assignments ta
    WHERE ta.id = rent_history.assignment_id AND ta.tenant_id = auth.uid()
  )
);
