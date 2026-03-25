-- Fix staff linking on signup to be robust with phone formats
CREATE OR REPLACE FUNCTION public.link_staff_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_email TEXT;
    user_phone TEXT;
    clean_user_phone TEXT;
BEGIN
    SELECT email, phone INTO user_email, user_phone FROM auth.users WHERE id = NEW.user_id;
    
    -- Robust phone matching (last 10 digits)
    IF user_phone IS NOT NULL THEN
        clean_user_phone := RIGHT(REGEXP_REPLACE(user_phone, '\D', '', 'g'), 10);
        
        UPDATE public.staff_members
        SET staff_user_id = NEW.user_id, status = 'active'
        WHERE staff_user_id IS NULL 
          AND invited_phone IS NOT NULL
          AND RIGHT(REGEXP_REPLACE(invited_phone, '\D', '', 'g'), 10) = clean_user_phone;
    END IF;

    -- Email matching
    IF user_email IS NOT NULL THEN
        UPDATE public.staff_members
        SET staff_user_id = NEW.user_id, status = 'active'
        WHERE invited_email = user_email AND staff_user_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;
