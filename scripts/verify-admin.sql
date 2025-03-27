-- Function to set admin role
CREATE OR REPLACE FUNCTION set_admin_role(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN raw_user_meta_data IS NULL THEN 
                jsonb_build_object('role', 'admin')
            ELSE 
                raw_user_meta_data || jsonb_build_object('role', 'admin')
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check admin role
CREATE OR REPLACE FUNCTION check_admin_role(user_id uuid)
RETURNS TABLE (
    email text,
    is_admin boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.email,
        (au.raw_user_meta_data->>'role' = 'admin') as is_admin
    FROM auth.users au
    WHERE au.id = user_id;
END;
$$ LANGUAGE plpgsql;
