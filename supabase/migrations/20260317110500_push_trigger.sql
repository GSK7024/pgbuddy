-- Enable the pg_net extension to allow making HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a trigger function to send push notification
CREATE OR REPLACE FUNCTION public.on_new_notification_send_push()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- We recommend setting these as secrets in your vault or simply hardcoding them if they are static
  -- For this migration, we assume they are available or the user will replace them
  -- Alternatively, we can use the internal URL for edge functions if running in the same project
  
  PERFORM
    net.http_post(
      url := 'https://smcdsmwrtrwxdlmrndhk.supabase.co/functions/v1/push-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'YOUR_SERVICE_ROLE_KEY' -- User needs to replace this
      ),
      body := jsonb_build_object(
        'action', 'send',
        'target_user_ids', ARRAY[NEW.user_id],
        'title', NEW.title,
        'message', NEW.message,
        'url', COALESCE((NEW.metadata->>'url'), '/')
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_on_new_notification_send_push ON public.notifications;
CREATE TRIGGER tr_on_new_notification_send_push
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_notification_send_push();
