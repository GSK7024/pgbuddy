
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name text NOT NULL,
  record_id text,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  description text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast property-based queries
CREATE INDEX idx_audit_logs_property_id ON public.audit_logs(property_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Owners can view audit logs for their properties
CREATE POLICY "Owners can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = audit_logs.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Allow inserts from triggers (service role / security definer)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Security definer function to log audit entries
CREATE OR REPLACE FUNCTION public.log_audit(
  _user_id uuid,
  _action text,
  _table_name text,
  _record_id text,
  _property_id uuid,
  _description text,
  _old_data jsonb DEFAULT NULL,
  _new_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, property_id, description, old_data, new_data)
  VALUES (_user_id, _action, _table_name, _record_id, _property_id, _description, _old_data, _new_data);
END;
$$;

-- Auto-audit trigger for tenant_assignments
CREATE OR REPLACE FUNCTION public.audit_tenant_assignments()
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
    _desc := 'Tenant assigned to room';
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, new_data)
    VALUES (_user_id, 'INSERT', 'tenant_assignments', NEW.id::text, NEW.property_id, _desc, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = true AND NEW.is_active = false THEN
      _desc := 'Tenant moved out';
    ELSIF OLD.room_id != NEW.room_id THEN
      _desc := 'Tenant transferred to different room';
    ELSIF OLD.custom_rent IS DISTINCT FROM NEW.custom_rent THEN
      _desc := 'Tenant rent updated';
    ELSE
      _desc := 'Tenant assignment updated';
    END IF;
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, old_data, new_data)
    VALUES (_user_id, 'UPDATE', 'tenant_assignments', NEW.id::text, NEW.property_id, _desc, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    _desc := 'Tenant assignment deleted';
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, old_data)
    VALUES (_user_id, 'DELETE', 'tenant_assignments', OLD.id::text, OLD.property_id, _desc, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_tenant_assignments
AFTER INSERT OR UPDATE OR DELETE ON public.tenant_assignments
FOR EACH ROW EXECUTE FUNCTION public.audit_tenant_assignments();

-- Auto-audit trigger for rent_payments
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
    IF OLD.status != NEW.status THEN
      _desc := 'Payment status changed from ' || OLD.status || ' to ' || NEW.status || ' for ' || NEW.month;
    ELSIF OLD.proof_url IS DISTINCT FROM NEW.proof_url THEN
      _desc := 'Payment proof uploaded for ' || NEW.month;
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

CREATE TRIGGER trg_audit_rent_payments
AFTER INSERT OR UPDATE ON public.rent_payments
FOR EACH ROW EXECUTE FUNCTION public.audit_rent_payments();

-- Auto-audit trigger for complaints
CREATE OR REPLACE FUNCTION public.audit_complaints()
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
    _desc := 'Complaint filed: ' || NEW.title;
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, new_data)
    VALUES (_user_id, 'INSERT', 'complaints', NEW.id::text, NEW.property_id, _desc, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      _desc := 'Complaint "' || NEW.title || '" status changed to ' || NEW.status;
    ELSE
      _desc := 'Complaint "' || NEW.title || '" updated';
    END IF;
    INSERT INTO audit_logs (user_id, action, table_name, record_id, property_id, description, old_data, new_data)
    VALUES (_user_id, 'UPDATE', 'complaints', NEW.id::text, NEW.property_id, _desc, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_complaints
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.audit_complaints();
