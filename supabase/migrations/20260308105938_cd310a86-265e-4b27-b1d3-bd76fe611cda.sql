
ALTER TABLE public.utility_bills ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.utility_bills ADD COLUMN IF NOT EXISTS proof_uploaded_at TIMESTAMPTZ;

-- Allow tenants to update their own utility bills (for proof upload)
CREATE POLICY "Tenants can update their utility bills proof" ON public.utility_bills
  FOR UPDATE USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);
