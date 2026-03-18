-- Improve the rent_payments audit trigger to capture proof rejections and approvals
CREATE OR REPLACE FUNCTION public.audit_rent_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _desc text;
  _user_id uuid;
BEGIN
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF TG_OP = 'INSERT' THEN
    _desc := 'Rent payment created for ' || NEW.month;
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, new_data)
    VALUES (_user_id, 'INSERT', 'rent_payments', NEW.id::text, NEW.property_id, _desc, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine the description based on what changed
    IF OLD.status != NEW.status AND NEW.status = 'paid' AND NEW.approved_by IS NOT NULL THEN
      _desc := 'Payment approved and marked paid for ' || NEW.month;
    ELSIF OLD.status != NEW.status THEN
      _desc := 'Payment status changed from ' || OLD.status || ' to ' || NEW.status || ' for ' || NEW.month;
    ELSIF OLD.proof_url IS NOT NULL AND NEW.proof_url IS NULL THEN
      _desc := 'Payment proof rejected for ' || NEW.month;
    ELSIF OLD.proof_url IS DISTINCT FROM NEW.proof_url AND NEW.proof_url IS NOT NULL THEN
      _desc := 'Payment proof submitted for ' || NEW.month;
    ELSE
      _desc := 'Payment record updated for ' || NEW.month;
    END IF;
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, old_data, new_data)
    VALUES (_user_id, 'UPDATE', 'rent_payments', NEW.id::text, NEW.property_id, _desc, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;
