-- Add payment_method to rent_payments if it doesn't exist
ALTER TABLE public.rent_payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Update existing records to have a default payment method if they are already paid
UPDATE public.rent_payments SET payment_method = 'unknown' WHERE status = 'paid' AND payment_method IS NULL;
