
-- Add tenant detail fields to tenant_assignments
ALTER TABLE public.tenant_assignments
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS id_proof_type text,
  ADD COLUMN IF NOT EXISTS id_proof_number text,
  ADD COLUMN IF NOT EXISTS notes text;

-- Create storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenant-documents', 'tenant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: owners can upload/view docs for their tenants
CREATE POLICY "Owners can manage tenant documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND ta.id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND ta.id::text = (storage.foldername(name))[1]
  )
);

-- Tenants can view their own documents
CREATE POLICY "Tenants can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    WHERE ta.tenant_id = auth.uid()
    AND ta.id::text = (storage.foldername(name))[1]
  )
);
