
-- Drop existing broken policies
DROP POLICY IF EXISTS "Owners can manage tenant documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can view their own documents" ON storage.objects;

-- Recreate with correct path matching
CREATE POLICY "Owners can manage tenant documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND name LIKE ta.id::text || '/%'
  )
)
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND name LIKE ta.id::text || '/%'
  )
);

CREATE POLICY "Tenants can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    WHERE ta.tenant_id = auth.uid()
    AND name LIKE ta.id::text || '/%'
  )
);
