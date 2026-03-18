-- Allow staff members to read their owner's subscription
CREATE POLICY "Staff can view owner subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT owner_id FROM public.staff_members
    WHERE staff_user_id = auth.uid() AND status = 'active'
  )
);
