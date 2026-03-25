-- Audit staff assignments and owners per user
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '--- Staff Assignment Audit ---';
    FOR r IN (
        SELECT staff_user_id, count(DISTINCT owner_id) as owner_count, array_agg(DISTINCT owner_id) as owner_ids
        FROM public.staff_members
        WHERE staff_user_id IS NOT NULL
        GROUP BY staff_user_id
        HAVING count(DISTINCT owner_id) > 1
    ) LOOP
        RAISE NOTICE 'User % is staff for % owners: %', r.staff_user_id, r.owner_count, r.owner_ids;
    END LOOP;

    RAISE NOTICE '--- Staff Profiles with Own Properties ---';
    FOR r IN (
        SELECT p.user_id, count(pr.id) as property_count
        FROM public.profiles p
        JOIN public.properties pr ON pr.owner_id = p.user_id
        WHERE p.user_id IN (SELECT staff_user_id FROM public.staff_members WHERE staff_user_id IS NOT NULL)
        GROUP BY p.user_id
    ) LOOP
        RAISE NOTICE 'User % is an Owner of % properties AND a Staff member for others.', r.user_id, r.property_count;
    END LOOP;
END $$;
