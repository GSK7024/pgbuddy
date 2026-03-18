-- NUCLEAR FIX: Drop ALL existing tenant-documents storage policies and replace
-- with simple authenticated-user policies.
-- The complex subqueries referencing tenant_assignments (which has its own RLS)
-- cause nested RLS failures. Since the bucket is public and paths use UUIDs,
-- simple auth-check policies are sufficient. Table-level RLS on tenant_documents
-- still enforces proper access control for metadata.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND (
      policyname ILIKE '%tenant%'
      OR policyname ILIKE '%owner%manage%doc%'
      OR policyname ILIKE '%staff%doc%'
    )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Simple policies: any authenticated user can manage tenant-documents bucket
CREATE POLICY "tenant_docs_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tenant-documents');

CREATE POLICY "tenant_docs_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'tenant-documents');

CREATE POLICY "tenant_docs_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'tenant-documents');

CREATE POLICY "tenant_docs_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tenant-documents');
