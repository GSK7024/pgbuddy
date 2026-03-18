-- Grant staff access to tenant_documents table
CREATE POLICY "Staff can view tenant documents"
ON public.tenant_documents
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Manager staff can manage tenant documents"
ON public.tenant_documents
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]));

-- Grant staff access to manage tenant-documents storage bucket
CREATE POLICY "Manager staff can manage tenant docs storage" 
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM tenant_assignments ta
    WHERE public.is_staff_of_property(auth.uid(), ta.property_id, ARRAY['manager']::staff_role[])
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
    WHERE public.is_staff_of_property(auth.uid(), ta.property_id, ARRAY['manager']::staff_role[])
      AND (
        ta.tenant_id::text = (storage.foldername(name))[1]
        OR ta.id::text = (storage.foldername(name))[1]
      )
  )
);
