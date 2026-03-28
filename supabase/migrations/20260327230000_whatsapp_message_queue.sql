-- WhatsApp Message Queue Table
-- Used by the whatsapp-server bulk worker

CREATE TABLE IF NOT EXISTS public.whatsapp_message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  template_type TEXT DEFAULT 'announcement',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Index for the worker to quickly pick pending messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status 
  ON public.whatsapp_message_queue(status, created_at);

-- RLS: only service role can access this table
ALTER TABLE public.whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by the whatsapp-server backend)
CREATE POLICY "service_role_all" ON public.whatsapp_message_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);
