-- Add tenant_name column to tenant_assignments and rent_payments
ALTER TABLE public.tenant_assignments ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS tenant_name TEXT;
