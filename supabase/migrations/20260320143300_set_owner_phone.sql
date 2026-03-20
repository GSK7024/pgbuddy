-- Set phone number for gkute7024@gmail.com
UPDATE profiles
SET phone = '7743843389'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'gkute7024@gmail.com');

-- Fix the handle_new_user trigger to also save phone number from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  );
  RETURN NEW;
END;
$$;
