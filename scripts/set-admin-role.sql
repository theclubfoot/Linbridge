-- First, let's check current role
SELECT 
    email,
    raw_user_meta_data->>'role' as current_role
FROM auth.users 
WHERE email = 'admin@company.com';

-- Set admin role for the user
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN 
            jsonb_build_object('role', 'admin')
        ELSE 
            raw_user_meta_data || jsonb_build_object('role', 'admin')
    END
WHERE email = 'admin@company.com';

-- Verify the update
SELECT 
    email,
    raw_user_meta_data->>'role' as new_role
FROM auth.users 
WHERE email = 'admin@company.com';
