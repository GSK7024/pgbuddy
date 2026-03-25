-- Update handle_new_user to capture NEW.phone directly from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$;

-- Update the auto-linking trigger to link by phone OR email
CREATE OR REPLACE FUNCTION public.link_tenant_assignment_on_signup()
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
        -- Link assignments and rent payments by phone
        UPDATE public.tenant_assignments
        SET tenant_id = NEW.user_id
        WHERE tenant_phone = user_phone AND tenant_id IS NULL;

        UPDATE public.rent_payments
        SET tenant_id = NEW.user_id
        WHERE tenant_phone = user_phone AND tenant_id IS NULL;
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
