
-- Move-out requests table with deposit tracking
CREATE TABLE public.move_out_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  assignment_id uuid NOT NULL REFERENCES public.tenant_assignments(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  requested_move_out_date date NOT NULL,
  actual_move_out_date date,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  -- Deposit tracking
  deposit_amount numeric NOT NULL DEFAULT 0,
  deductions jsonb DEFAULT '[]'::jsonb,
  total_deductions numeric NOT NULL DEFAULT 0,
  refund_amount numeric NOT NULL DEFAULT 0,
  refund_status text NOT NULL DEFAULT 'pending',
  refund_date date,
  refund_notes text,
  -- Checkout checklist
  checklist jsonb DEFAULT '{"room_inspected": false, "keys_returned": false, "dues_cleared": false, "belongings_removed": false, "electricity_settled": false}'::jsonb,
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  processed_by uuid
);

-- Enable RLS
ALTER TABLE public.move_out_requests ENABLE ROW LEVEL SECURITY;

-- Owner can see move-out requests for their properties
CREATE POLICY "Owners can view move-out requests"
  ON public.move_out_requests FOR SELECT TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR tenant_id = auth.uid()
    OR property_id IN (SELECT get_staff_property_ids(auth.uid()))
  );

-- Tenants can create move-out requests
CREATE POLICY "Tenants can create move-out requests"
  ON public.move_out_requests FOR INSERT TO authenticated
  WITH CHECK (tenant_id = auth.uid());

-- Owners can update move-out requests
CREATE POLICY "Owners can update move-out requests"
  ON public.move_out_requests FOR UPDATE TO authenticated
  USING (
    property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid())
    OR is_staff_of_property(auth.uid(), property_id, ARRAY['manager'::staff_role])
  );

-- Tenants can update their own pending requests
CREATE POLICY "Tenants can update own pending requests"
  ON public.move_out_requests FOR UPDATE TO authenticated
  USING (tenant_id = auth.uid() AND status = 'pending');

-- Updated at trigger
CREATE TRIGGER update_move_out_requests_updated_at
  BEFORE UPDATE ON public.move_out_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
