-- Quick diagnostic part 2
DO $$
BEGIN
  RAISE NOTICE 'Auth phone: %', (SELECT phone FROM auth.users WHERE id = 'eab3fac3-46ef-4ace-8786-93f5525ac622');
  RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Total auth.users: %', (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE 'Properties: %', (SELECT COUNT(*) FROM public.properties WHERE owner_id = 'eab3fac3-46ef-4ace-8786-93f5525ac622');
  RAISE NOTICE 'Orphaned auth (no profile): %', (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT user_id FROM public.profiles));
END $$;
