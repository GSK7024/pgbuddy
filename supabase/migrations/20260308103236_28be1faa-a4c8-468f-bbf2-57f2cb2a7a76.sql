
-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_code TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  referred_email TEXT,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own referrals"
ON public.referrals
FOR ALL
TO authenticated
USING (auth.uid() = referrer_id)
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Anyone can view referral by code"
ON public.referrals
FOR SELECT
USING (status = 'pending');

-- Community chat messages
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can send messages in their property"
ON public.community_messages
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM tenant_assignments
  WHERE tenant_assignments.property_id = community_messages.property_id
  AND tenant_assignments.tenant_id = auth.uid()
  AND tenant_assignments.is_active = true
));

CREATE POLICY "Tenants can view messages in their property"
ON public.community_messages
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM tenant_assignments
  WHERE tenant_assignments.property_id = community_messages.property_id
  AND tenant_assignments.tenant_id = auth.uid()
  AND tenant_assignments.is_active = true
));

CREATE POLICY "Owners can view messages in their properties"
ON public.community_messages
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = community_messages.property_id
  AND properties.owner_id = auth.uid()
));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
