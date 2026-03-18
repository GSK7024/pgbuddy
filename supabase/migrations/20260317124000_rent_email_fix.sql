-- Migration to support rent payments for pending tenants

-- 1. Alter rent_payments to add tenant_email and make tenant_id nullable
ALTER TABLE public.rent_payments 
ADD COLUMN tenant_email TEXT,
ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Add index for performance
CREATE INDEX idx_rent_payments_email ON public.rent_payments(tenant_email);

-- 3. Update the registration trigger to also sync rent_payments
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
        -- Update pending assignments
        UPDATE public.tenant_assignments
        SET tenant_id = NEW.user_id
        WHERE (tenant_email = user_email OR tenant_id IS NULL AND id IN (
            -- This handles cases where maybe only user_id was set but email matches
            -- but primarily we care about matching the email
            SELECT id FROM public.tenant_assignments WHERE tenant_email = user_email
        )) AND tenant_id IS NULL;

        -- Update pending rent payments
        UPDATE public.rent_payments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;
