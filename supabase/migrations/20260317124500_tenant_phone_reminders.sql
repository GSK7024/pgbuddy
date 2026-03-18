-- Migration to store phone numbers for pending tenants and reminders

-- 1. Alter tenant_assignments to add tenant_phone
ALTER TABLE public.tenant_assignments 
ADD COLUMN tenant_phone TEXT;

-- 2. Alter rent_payments to add tenant_phone
ALTER TABLE public.rent_payments 
ADD COLUMN tenant_phone TEXT;

-- 3. Update the registration trigger to sync rent_payments and optionally update profile phone
-- (Though registration usually handles the phone, this ensures data consistency)
CREATE OR REPLACE FUNCTION public.link_tenant_assignment_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get the email from the corresponding auth.users record
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    IF user_email IS NOT NULL THEN
        -- Link assignments and sync phone to profile if profile phone is null
        UPDATE public.tenant_assignments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;

        -- Update pending rent payments
        UPDATE public.rent_payments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;
        
        -- If the newly created profile has no phone but we have one in assignments, sync it
        IF NEW.phone IS NULL OR NEW.phone = '' THEN
            UPDATE public.profiles
            SET phone = (SELECT tenant_phone FROM public.tenant_assignments WHERE tenant_id = NEW.user_id LIMIT 1)
            WHERE user_id = NEW.user_id
            AND EXISTS (SELECT 1 FROM public.tenant_assignments WHERE tenant_id = NEW.user_id AND tenant_phone IS NOT NULL AND tenant_phone != '');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;
