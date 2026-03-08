
-- 1. Payment Info table (owner's UPI/bank details per property)
CREATE TABLE public.payment_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  upi_id TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder TEXT,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.payment_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage payment info" ON public.payment_info
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = payment_info.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = payment_info.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Tenants can view payment info for their property" ON public.payment_info
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenant_assignments WHERE tenant_assignments.property_id = payment_info.property_id AND tenant_assignments.tenant_id = auth.uid() AND tenant_assignments.is_active = true));

-- 2. Payment proofs column on rent_payments
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;

-- 3. Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = announcements.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = announcements.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Tenants can view announcements for their property" ON public.announcements
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenant_assignments WHERE tenant_assignments.property_id = announcements.property_id AND tenant_assignments.tenant_id = auth.uid() AND tenant_assignments.is_active = true));

-- 4. Tenant invitations table
CREATE TABLE public.tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  tenant_name TEXT,
  tenant_email TEXT,
  tenant_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  claimed_by UUID
);

ALTER TABLE public.tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage invitations" ON public.tenant_invitations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_invitations.property_id AND properties.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = tenant_invitations.property_id AND properties.owner_id = auth.uid()));

CREATE POLICY "Anyone can view invitation by code" ON public.tenant_invitations
  FOR SELECT TO authenticated
  USING (status = 'pending');

-- 5. Storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;

CREATE POLICY "Tenants can upload proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owners and tenants can view proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs');

-- 6. Trigger for updated_at on payment_info
CREATE TRIGGER update_payment_info_updated_at
  BEFORE UPDATE ON public.payment_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
