
-- Drop existing policies
DROP POLICY IF EXISTS "Owners can manage tenant documents" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can view their own documents" ON storage.objects;

-- Separate INSERT policy for owners
CREATE POLICY "Owners can upload tenant documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = ta.id::text
  )
);

-- SELECT policy for owners
CREATE POLICY "Owners can view tenant documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = ta.id::text
  )
);

-- UPDATE policy for owners
CREATE POLICY "Owners can update tenant documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = ta.id::text
  )
);

-- DELETE policy for owners
CREATE POLICY "Owners can delete tenant documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    JOIN public.properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = ta.id::text
  )
);

-- Tenants can view their own documents
CREATE POLICY "Tenants can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.tenant_assignments ta
    WHERE ta.tenant_id = auth.uid()
    AND (storage.foldername(name))[1] = ta.id::text
  )
);
