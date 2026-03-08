
CREATE TABLE public.meal_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL DEFAULT CURRENT_DATE,
  breakfast TEXT,
  lunch TEXT,
  dinner TEXT,
  snacks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (property_id, menu_date)
);

ALTER TABLE public.meal_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage meal menus"
ON public.meal_menus
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM properties WHERE properties.id = meal_menus.property_id AND properties.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM properties WHERE properties.id = meal_menus.property_id AND properties.owner_id = auth.uid()
));

CREATE POLICY "Tenants can view meal menus for their property"
ON public.meal_menus
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM tenant_assignments
  WHERE tenant_assignments.property_id = meal_menus.property_id
  AND tenant_assignments.tenant_id = auth.uid()
  AND tenant_assignments.is_active = true
));
