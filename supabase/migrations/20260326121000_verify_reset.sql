-- Final Verification: check all tables are empty
DO $$
DECLARE
  profile_count INT;
  prop_count INT;
  user_role_count INT;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO prop_count FROM public.properties;
  SELECT COUNT(*) INTO user_role_count FROM public.user_roles;

  RAISE NOTICE 'Profiles count: %', profile_count;
  RAISE NOTICE 'Properties count: %', prop_count;
  RAISE NOTICE 'User Roles count: %', user_role_count;

  IF profile_count = 0 AND prop_count = 0 AND user_role_count = 0 THEN
    RAISE NOTICE 'VERIFICATION PASSED: Database is empty.';
  ELSE
    RAISE EXCEPTION 'VERIFICATION FAILED: Database is not empty.';
  END IF;
END $$;
