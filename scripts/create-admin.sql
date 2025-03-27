-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create roles enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First, create a department if none exists
INSERT INTO departments (id, name)
SELECT gen_random_uuid(), 'Administration'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Administration')
RETURNING id;

-- Create admin position if it doesn't exist
INSERT INTO positions (id, title)
SELECT gen_random_uuid(), 'Administrator'
WHERE NOT EXISTS (SELECT 1 FROM positions WHERE title = 'Administrator')
RETURNING id;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
    DROP POLICY IF EXISTS "Employees can view their own data" ON employees;
    DROP POLICY IF EXISTS "Only admins can insert" ON employees;
    DROP POLICY IF EXISTS "Only admins can update" ON employees;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create policies for employees table
CREATE POLICY "Admins can view all employees"
    ON employees FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Employees can view their own data"
    ON employees FOR SELECT
    TO authenticated
    USING (auth_id = auth.uid());

CREATE POLICY "Only admins can insert"
    ON employees FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update"
    ON employees FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Enable realtime for employees table
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE employees;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create initial admin user directly
DO $$
DECLARE
    v_user_id uuid;
    v_dept_id uuid;
    v_pos_id uuid;
BEGIN
    -- Insert the admin user into auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@company.com',
        crypt('Admin123!', gen_salt('bf')),
        now(),
        jsonb_build_object('role', 'admin'),
        now(),
        now(),
        encode(gen_random_bytes(32), 'hex'),
        '',
        '',
        ''
    )
    RETURNING id INTO v_user_id;

    -- Get department and position IDs
    SELECT id INTO v_dept_id FROM departments WHERE name = 'Administration';
    SELECT id INTO v_pos_id FROM positions WHERE title = 'Administrator';

    -- Create employee record for admin
    INSERT INTO employees (
        id,
        auth_id,
        first_name,
        last_name,
        email,
        position_id,
        department_id,
        hire_date,
        base_salary
    ) VALUES (
        gen_random_uuid(),
        v_user_id,
        'System',
        'Administrator',
        'admin@company.com',
        v_pos_id,
        v_dept_id,
        CURRENT_DATE,
        100000  -- Setting a default admin salary
    );
END $$;

-- Create a trigger to automatically set role in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_employee()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM positions p 
                WHERE p.id = NEW.position_id 
                AND p.title = 'Administrator'
            ) THEN
                jsonb_build_object('role', 'admin')
            ELSE
                jsonb_build_object('role', 'employee')
        END
    WHERE id = NEW.auth_id;
    RETURN NEW;
END;
$$ language plpgsql security definer;

CREATE OR REPLACE TRIGGER on_employee_created
    AFTER INSERT ON employees
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_employee();

-- Function to create employee record (to be called after auth signup)
CREATE OR REPLACE FUNCTION public.create_employee(
    p_auth_id uuid,
    p_email text,
    p_first_name text,
    p_last_name text,
    p_position_id uuid,
    p_department_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_employee_id uuid;
BEGIN
    INSERT INTO employees (
        id,
        auth_id,
        email,
        first_name,
        last_name,
        position_id,
        department_id
    ) VALUES (
        gen_random_uuid(),
        p_auth_id,
        p_email,
        p_first_name,
        p_last_name,
        p_position_id,
        p_department_id
    )
    RETURNING id INTO v_employee_id;

    RETURN v_employee_id;
END;
$$;
