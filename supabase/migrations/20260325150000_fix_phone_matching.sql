CREATE OR REPLACE FUNCTION public.link_tenant_assignment_on_signup()
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
    
    IF user_phone IS NOT NULL THEN
        -- Clean the user_phone to just the last 10 digits (ignoring +91, spaces, dashes)
        clean_user_phone := RIGHT(REGEXP_REPLACE(user_phone, '\D', '', 'g'), 10);
        
        IF LENGTH(clean_user_phone) = 10 THEN
            -- Link assignments by matching the last 10 digits of tenant_phone
            UPDATE public.tenant_assignments
            SET tenant_id = NEW.user_id
            WHERE tenant_phone IS NOT NULL 
              AND RIGHT(REGEXP_REPLACE(tenant_phone, '\D', '', 'g'), 10) = clean_user_phone 
              AND tenant_id IS NULL;

            -- Link rent payments by matching the last 10 digits of tenant_phone
            UPDATE public.rent_payments
            SET tenant_id = NEW.user_id
            WHERE tenant_phone IS NOT NULL 
              AND RIGHT(REGEXP_REPLACE(tenant_phone, '\D', '', 'g'), 10) = clean_user_phone 
              AND tenant_id IS NULL;
        END IF;
    END IF;

    IF user_email IS NOT NULL THEN
        -- Link assignments and rent payments by email
        UPDATE public.tenant_assignments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;

        UPDATE public.rent_payments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Run this once to clean up any existing unlinked accounts!
UPDATE public.tenant_assignments ta
SET tenant_id = p.user_id
FROM public.profiles p
WHERE ta.tenant_id IS NULL
  AND ta.tenant_phone IS NOT NULL
  AND p.phone IS NOT NULL
  AND LENGTH(RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10)) = 10
  AND RIGHT(REGEXP_REPLACE(ta.tenant_phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10);
  
UPDATE public.rent_payments rp
SET tenant_id = p.user_id
FROM public.profiles p
WHERE rp.tenant_id IS NULL
  AND rp.tenant_phone IS NOT NULL
  AND p.phone IS NOT NULL
  AND LENGTH(RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10)) = 10
  AND RIGHT(REGEXP_REPLACE(rp.tenant_phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10);
