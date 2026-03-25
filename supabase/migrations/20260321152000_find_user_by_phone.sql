-- Create an RPC to find a user by phone (similar to find_user_by_email)
CREATE OR REPLACE FUNCTION public.find_user_by_phone(_phone TEXT)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.full_name
    FROM public.profiles p
    JOIN auth.users u ON p.user_id = u.id
    WHERE 
        RIGHT(REGEXP_REPLACE(u.phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(_phone, '\D', '', 'g'), 10)
        OR 
        RIGHT(REGEXP_REPLACE(p.phone, '\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(_phone, '\D', '', 'g'), 10)
    LIMIT 1;
END;
$$;
