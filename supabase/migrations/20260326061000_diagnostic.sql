-- Diagnostic: check all owner data is intact
-- Run this via supabase db push to see what's there

DO $$
DECLARE
  owner_uid UUID;
  profile_count INT;
  role_count INT;
  sub_count INT;
  prop_count INT;
BEGIN
  SELECT user_id INTO owner_uid FROM public.profiles
  WHERE RIGHT(REPLACE(REPLACE(phone, '+', ''), ' ', ''), 10) = '7743843389' LIMIT 1;

  RAISE NOTICE 'Owner UID: %', owner_uid;

  -- Check profile
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE user_id = owner_uid;
  RAISE NOTICE 'Profiles: %', profile_count;

  -- Check phone stored correctly
  PERFORM phone FROM public.profiles WHERE user_id = owner_uid;
  RAISE NOTICE 'Phone in profile: %', (SELECT phone FROM public.profiles WHERE user_id = owner_uid);

  -- Check role
  SELECT COUNT(*) INTO role_count FROM public.user_roles WHERE user_id = owner_uid;
  RAISE NOTICE 'User roles: %', role_count;
  RAISE NOTICE 'Role: %', (SELECT role FROM public.user_roles WHERE user_id = owner_uid LIMIT 1);

  -- Check subscription
  SELECT COUNT(*) INTO sub_count FROM public.subscriptions WHERE user_id = owner_uid;
  RAISE NOTICE 'Subscriptions: %', sub_count;

  -- Check properties
  SELECT COUNT(*) INTO prop_count FROM public.properties WHERE owner_id = owner_uid;
  RAISE NOTICE 'Properties: %', prop_count;

  -- Check auth.users phone
  RAISE NOTICE 'Auth phone: %', (SELECT phone FROM auth.users WHERE id = owner_uid);
  RAISE NOTICE 'Auth email: %', (SELECT email FROM auth.users WHERE id = owner_uid);

  -- Total profiles in system
  RAISE NOTICE 'Total profiles: %', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE 'Total auth.users: %', (SELECT COUNT(*) FROM auth.users);
END $$;
