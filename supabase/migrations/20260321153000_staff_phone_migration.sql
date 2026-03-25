-- Add invited_phone to staff_members table
ALTER TABLE public.staff_members 
ADD COLUMN invited_phone TEXT;

-- Update the auto-linking trigger for staff when they sign up with phone
CREATE OR REPLACE FUNCTION public.link_staff_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    user_email TEXT;
    user_phone TEXT;
BEGIN
    SELECT email, phone INTO user_email, user_phone FROM auth.users WHERE id = NEW.user_id;
    
    IF user_phone IS NOT NULL THEN
        UPDATE public.staff_members
        SET staff_user_id = NEW.user_id, status = 'active'
        WHERE invited_phone = user_phone AND staff_user_id IS NULL;
    END IF;

    IF user_email IS NOT NULL THEN
        UPDATE public.staff_members
        SET staff_user_id = NEW.user_id, status = 'active'
        WHERE invited_email = user_email AND staff_user_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Trigger to run when profile is created
DROP TRIGGER IF EXISTS on_staff_profile_created_link ON public.profiles;
CREATE TRIGGER on_staff_profile_created_link
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_staff_on_signup();
