
-- Allow tenants to update their own rent_payments (for Razorpay transaction_id update)
CREATE POLICY "Tenants can update their own pending payments"
ON public.rent_payments
FOR UPDATE
TO authenticated
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);
