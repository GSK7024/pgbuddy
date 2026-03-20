-- Enable pg_cron and pg_net extensions (required for scheduled Edge Function calls)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule rent reminders to run daily at 9:00 AM IST (3:30 AM UTC)
-- Uses the anon key for authorization since rent-reminders is deployed with --no-verify-jwt
SELECT cron.schedule(
  'daily-rent-reminders',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vcpohetbsyyjqqkzuzxj.supabase.co/functions/v1/rent-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcG9oZXRic3l5anFxa3p1enhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MTc5NDUsImV4cCI6MjA4OTI5Mzk0NX0.gDpBVfaFfCulu1xDScm72PwFp6LwupukuIyJ3dJBh-k"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
