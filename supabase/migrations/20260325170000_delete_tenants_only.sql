-- Surgical deletion of all tenant-related data
-- Preserves properties, rooms, owners, and staff

DO $$
DECLARE
  tenant_user_ids UUID[];
BEGIN
  -- 1. Identify all tenant user IDs from user_roles
  SELECT array_agg(user_id) INTO tenant_user_ids
  FROM public.user_roles
  WHERE role = 'tenant';

  -- If no tenants, we are done
  IF tenant_user_ids IS NULL THEN
    RAISE NOTICE 'No tenants found to delete.';
    RETURN;
  END IF;

  -- 2. Set replication role to replica to bypass some triggers if necessary
  SET session_replication_role = 'replica';

  -- 3. Delete from tables referencing tenants
  DELETE FROM public.rent_payments WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.complaints WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.visitor_logs WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.tenant_documents WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.vacancy_notices WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.utility_bills WHERE tenant_id = ANY(tenant_user_ids);
  DELETE FROM public.notifications WHERE user_id = ANY(tenant_user_ids);
  DELETE FROM public.referrals WHERE referrer_id = ANY(tenant_user_ids) OR referred_user_id = ANY(tenant_user_ids);
  DELETE FROM public.community_messages WHERE sender_id = ANY(tenant_user_ids);
  
  -- 4. Delete tenant assignments (this frees up rooms/beds)
  DELETE FROM public.tenant_assignments WHERE tenant_id = ANY(tenant_user_ids);
  
  -- 5. Delete from public.profiles and public.user_roles
  DELETE FROM public.user_roles WHERE user_id = ANY(tenant_user_ids);
  DELETE FROM public.profiles WHERE user_id = ANY(tenant_user_ids);

  -- 6. Finally delete from auth.users (this will trigger cascade deletes if any were missed)
  DELETE FROM auth.users WHERE id = ANY(tenant_user_ids);

  -- 7. Also clear tenant invitations that might be pending
  DELETE FROM public.tenant_invitations;

  SET session_replication_role = 'origin';
  
  RAISE NOTICE 'Deleted % tenants and their associated records.', array_length(tenant_user_ids, 1);
END $$;
