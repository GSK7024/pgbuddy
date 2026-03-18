-- Migration for tracking security deposit payments

-- 1. Add payment_type to rent_payments to differentiate between 'rent' and 'deposit'
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent';

-- Backfill existing payments to be 'rent' (they would be by default anyway, but being explicit)
UPDATE public.rent_payments SET payment_type = 'rent' WHERE payment_type IS NULL;

-- 2. Add deposit_status to tenant_assignments to track if the deposit for that assignment was paid or still pending
ALTER TABLE public.tenant_assignments ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'pending';

-- Update the realtime webhook publication to ensure the new columns are broadcast securely
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rent_payments;
