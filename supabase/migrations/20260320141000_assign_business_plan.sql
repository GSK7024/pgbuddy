-- Assign Business plan to gkute7024@gmail.com
DO $$
DECLARE
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'gkute7024@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User gkute7024@gmail.com not found';
  END IF;

  -- Get Business plan ID
  SELECT id INTO v_plan_id FROM subscription_plans WHERE slug = 'business';
  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Business plan not found';
  END IF;

  -- Insert active subscription (1 year)
  INSERT INTO subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
  VALUES (
    v_user_id,
    v_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = v_plan_id,
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year';

  RAISE NOTICE 'Business plan assigned to gkute7024@gmail.com (user %) until %', v_user_id, NOW() + INTERVAL '1 year';
END $$;
