
-- Tenant documents table
CREATE TABLE public.tenant_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'id_proof',
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own documents" ON public.tenant_documents
  FOR ALL USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can view and update tenant documents" ON public.tenant_documents
  FOR ALL USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = tenant_documents.property_id AND properties.owner_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = tenant_documents.property_id AND properties.owner_id = auth.uid()
  ));

-- Visitor log table
CREATE TABLE public.visitor_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_name TEXT NOT NULL,
  visitor_phone TEXT,
  purpose TEXT NOT NULL DEFAULT 'visit',
  tenant_id UUID,
  check_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visitor_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage visitor logs" ON public.visitor_logs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = visitor_logs.property_id AND properties.owner_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = visitor_logs.property_id AND properties.owner_id = auth.uid()
  ));

-- Utility bills table
CREATE TABLE public.utility_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  bill_type TEXT NOT NULL DEFAULT 'electricity',
  previous_reading NUMERIC,
  current_reading NUMERIC,
  units_consumed NUMERIC,
  rate_per_unit NUMERIC NOT NULL DEFAULT 8,
  amount NUMERIC NOT NULL DEFAULT 0,
  bill_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.utility_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage utility bills" ON public.utility_bills
  FOR ALL USING (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = utility_bills.property_id AND properties.owner_id = auth.uid()
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM properties WHERE properties.id = utility_bills.property_id AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Tenants can view their utility bills" ON public.utility_bills
  FOR SELECT USING (auth.uid() = tenant_id);
