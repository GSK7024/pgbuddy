
-- Drop ALL existing policies on storage.objects for tenant-documents
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname ILIKE '%tenant%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Simple policy: any authenticated user can upload to tenant-documents
CREATE POLICY "authenticated_insert_tenant_docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tenant-documents');

-- Any authenticated user can read from tenant-documents
CREATE POLICY "authenticated_select_tenant_docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant-documents');

-- Any authenticated user can update in tenant-documents
CREATE POLICY "authenticated_update_tenant_docs"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'tenant-documents');

-- Any authenticated user can delete from tenant-documents
CREATE POLICY "authenticated_delete_tenant_docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tenant-documents');
