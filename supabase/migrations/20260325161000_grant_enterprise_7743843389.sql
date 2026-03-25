-- =========================================================================
-- Permanent Auto-Enterprise Grant for specific Phone Number (7743843389)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.grant_enterprise_to_specific_phone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_id UUID;
BEGIN
  IF NEW.phone IS NOT NULL AND RIGHT(REGEXP_REPLACE(NEW.phone, '\D', '', 'g'), 10) = '7743843389' THEN
    SELECT id INTO plan_id FROM public.subscription_plans WHERE slug = 'enterprise';
    
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_end)
    VALUES (NEW.user_id, plan_id, 'active', now() + interval '100 years')
    ON CONFLICT (user_id) DO UPDATE 
    SET plan_id = EXCLUDED.plan_id, status = 'active', current_period_end = EXCLUDED.current_period_end;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_specific_phone_signup ON public.profiles;
CREATE TRIGGER on_specific_phone_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_enterprise_to_specific_phone();

-- Execute it instantly for existing records (if any already exist)
DO $$
DECLARE
  target_user_id UUID;
  plan_id UUID;
BEGIN
  SELECT user_id INTO target_user_id 
  FROM public.profiles 
  WHERE RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10) = '7743843389'
  LIMIT 1;

  IF target_user_id IS NOT NULL THEN
    SELECT id INTO plan_id FROM public.subscription_plans WHERE slug = 'enterprise';

    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_end)
    VALUES (target_user_id, plan_id, 'active', now() + interval '100 years')
    ON CONFLICT (user_id) DO UPDATE 
    SET plan_id = EXCLUDED.plan_id, status = 'active', current_period_end = EXCLUDED.current_period_end;
  END IF;
END $$;
