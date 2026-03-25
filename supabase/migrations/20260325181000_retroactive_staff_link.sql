-- Retroactive linking of staff members who were already signed up but not linked due to phone format
DO $$
BEGIN
    UPDATE public.staff_members sm
    SET staff_user_id = p.user_id, status = 'active'
    FROM public.profiles p
    WHERE sm.staff_user_id IS NULL 
      AND sm.invited_phone IS NOT NULL
      AND p.phone IS NOT NULL
      AND RIGHT(REGEXP_REPLACE(sm.invited_phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10);
END $$;
