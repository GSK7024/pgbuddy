
CREATE OR REPLACE FUNCTION public.claim_staff_invitation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _user_id uuid;
  _email text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RETURN; END IF;

  SELECT email INTO _email FROM auth.users WHERE id = _user_id;
  IF _email IS NULL THEN RETURN; END IF;

  UPDATE staff_members
  SET staff_user_id = _user_id, status = 'active', updated_at = now()
  WHERE invited_email = _email
    AND status = 'pending'
    AND staff_user_id IS NULL;
END;
$$;
