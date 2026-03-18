-- Migration to allow assigning tenants by email before they register

-- 1. Alter tenant_assignments to add tenant_email and make tenant_id nullable
ALTER TABLE public.tenant_assignments 
ADD COLUMN tenant_email TEXT,
ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Add an index on tenant_email for faster lookups during registration
CREATE INDEX idx_tenant_assignments_email ON public.tenant_assignments(tenant_email);

-- 3. Create a function to link assignments by email when a new user signs up
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
        -- Update any pending assignments that match this email
        UPDATE public.tenant_assignments
        SET tenant_id = NEW.user_id
        WHERE tenant_email = user_email AND tenant_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 4. Create a trigger on public.profiles to trigger the linking
CREATE TRIGGER on_tenant_profile_created_link_assignment
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.link_tenant_assignment_on_signup();

-- 5. Update RLS policies for tenant_assignments to handle email-based assignments
-- Owners already have full access via property_id check.
-- We just need to make sure tenants can still see their assignments when a tenant_id is linked.
-- (Existing policy "Tenants can view their own assignments" uses auth.uid() = tenant_id, which is still correct).
