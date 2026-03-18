-- Fix 1: Make tenant-documents bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'tenant-documents';

-- Fix 2: Replace owner management policy to accommodate both tenant_id and assignment_id uploads
DROP POLICY IF EXISTS "owners_manage_tenant_docs" ON storage.objects;
DROP POLICY IF EXISTS "Owners can manage tenant documents" ON storage.objects;

-- Owners can manage docs for their tenants, matching either by tenant_id or assignment_id (for pending tenants)
CREATE POLICY "owners_manage_tenant_docs" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
      AND (
        ta.tenant_id::text = (storage.foldername(name))[1]
        OR ta.id::text = (storage.foldername(name))[1]
      )
  )
)
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
      AND (
        ta.tenant_id::text = (storage.foldername(name))[1]
        OR ta.id::text = (storage.foldername(name))[1]
      )
  )
);
