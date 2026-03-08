
-- Staff can view properties they're assigned to
CREATE POLICY "Staff can view assigned properties"
ON public.properties
FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_staff_property_ids(auth.uid())));

-- Manager staff can manage properties
CREATE POLICY "Manager staff can manage properties"
ON public.properties
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), id, ARRAY['manager']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), id, ARRAY['manager']::staff_role[]));

-- Staff can view rooms for assigned properties
CREATE POLICY "Staff can view rooms"
ON public.rooms
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

-- Manager staff can manage rooms
CREATE POLICY "Manager staff can manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]));

-- Staff (manager, accountant) can view tenant assignments
CREATE POLICY "Staff can view tenant assignments"
ON public.tenant_assignments
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

-- Manager staff can manage tenant assignments
CREATE POLICY "Manager staff can manage assignments"
ON public.tenant_assignments
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]));

-- Accountant + Manager can view/manage payments
CREATE POLICY "Staff can view payments"
ON public.rent_payments
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Accountant staff can manage payments"
ON public.rent_payments
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]));

-- Accountant + Manager can view/manage expenses
CREATE POLICY "Staff can view expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Accountant staff can manage expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]));

-- Caretaker + Manager can view/manage complaints
CREATE POLICY "Staff can view complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Caretaker staff can manage complaints"
ON public.complaints
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','caretaker']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','caretaker']::staff_role[]));

-- Caretaker + Manager can view/manage visitor logs
CREATE POLICY "Staff can view visitor logs"
ON public.visitor_logs
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Caretaker staff can manage visitors"
ON public.visitor_logs
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','caretaker']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','caretaker']::staff_role[]));

-- Staff can view audit logs for their properties
CREATE POLICY "Staff can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

-- Staff can view announcements
CREATE POLICY "Staff can view announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

-- Manager can manage announcements
CREATE POLICY "Manager staff can manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager']::staff_role[]));

-- Accountant + Manager can view utility bills
CREATE POLICY "Staff can view utility bills"
ON public.utility_bills
FOR SELECT
TO authenticated
USING (property_id IN (SELECT public.get_staff_property_ids(auth.uid())));

CREATE POLICY "Accountant staff can manage utility bills"
ON public.utility_bills
FOR ALL
TO authenticated
USING (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]))
WITH CHECK (public.is_staff_of_property(auth.uid(), property_id, ARRAY['manager','accountant']::staff_role[]));

-- Staff can view profiles of tenants in their properties
CREATE POLICY "Staff can view tenant profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tenant_assignments ta
    WHERE ta.tenant_id = profiles.user_id
    AND ta.property_id IN (SELECT public.get_staff_property_ids(auth.uid()))
  )
);
