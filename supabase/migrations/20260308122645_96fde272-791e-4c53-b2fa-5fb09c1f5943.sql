-- Fix 1: Remove client INSERT policy on user_roles to prevent role escalation
-- Role assignment is handled by the handle_new_user_role trigger (SECURITY DEFINER)
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

-- Fix 2: Replace blanket tenant-documents storage policies with scoped ones
-- Drop existing blanket policies
DROP POLICY IF EXISTS "authenticated_insert_tenant_docs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_select_tenant_docs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_update_tenant_docs" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_delete_tenant_docs" ON storage.objects;

-- Tenants can upload to their own folder only
CREATE POLICY "tenants_upload_own_docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tenants can view their own documents
CREATE POLICY "tenants_view_own_docs" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM tenant_assignments ta
      JOIN properties p ON p.id = ta.property_id
      WHERE p.owner_id = auth.uid()
        AND ta.tenant_id::text = (storage.foldername(name))[1]
    )
  )
);

-- Owners can manage docs for their tenants
CREATE POLICY "owners_manage_tenant_docs" ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
      AND ta.tenant_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    JOIN properties p ON p.id = ta.property_id
    WHERE p.owner_id = auth.uid()
      AND ta.tenant_id::text = (storage.foldername(name))[1]
  )
);

-- Tenants can update their own docs (e.g. replace files)
CREATE POLICY "tenants_update_own_docs" ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Tenants can delete their own docs
CREATE POLICY "tenants_delete_own_docs" ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);