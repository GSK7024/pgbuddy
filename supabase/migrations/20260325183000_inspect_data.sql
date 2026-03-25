-- Inspect staff + rooms data
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '--- Active Staff Members ---';
    FOR rec IN (
        SELECT sm.id, sm.owner_id, sm.staff_user_id, sm.invited_phone, sm.property_id as assigned_prop,
               p.full_name as staff_name, o.full_name as owner_name
        FROM public.staff_members sm
        LEFT JOIN public.profiles p ON p.user_id = sm.staff_user_id
        LEFT JOIN public.profiles o ON o.user_id = sm.owner_id
        WHERE sm.status = 'active'
    ) LOOP
        RAISE NOTICE 'StaffID=% Owner=%(%) Staff=%(%) Phone=% AssignedProp=%', 
            rec.id, rec.owner_id, rec.owner_name, rec.staff_user_id, rec.staff_name, rec.invited_phone, rec.assigned_prop;
    END LOOP;

    RAISE NOTICE '--- All Rooms ---';
    FOR rec IN (
        SELECT rm.id, rm.room_number, rm.property_id as prop_id, pr.name as prop_name, pr.owner_id
        FROM public.rooms rm
        JOIN public.properties pr ON pr.id = rm.property_id
    ) LOOP
        RAISE NOTICE 'Room=% Prop=%(%) Owner=%', rec.room_number, rec.prop_name, rec.prop_id, rec.owner_id;
    END LOOP;

    RAISE NOTICE '--- All Properties ---';
    FOR rec IN (
        SELECT pr.id, pr.name, pr.owner_id, o.full_name as owner_name
        FROM public.properties pr
        LEFT JOIN public.profiles o ON o.user_id = pr.owner_id
    ) LOOP
        RAISE NOTICE 'Prop=%(%) Owner=%(%) ', rec.name, rec.id, rec.owner_id, rec.owner_name;
    END LOOP;
END $$;
