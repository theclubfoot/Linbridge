-- First, disable RLS temporarily
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can do everything" ON shifts;
DROP POLICY IF EXISTS "Employees can view their own shifts" ON shifts;

-- Enable RLS again
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Create a simple admin policy first
CREATE POLICY admin_all_access ON shifts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_id = auth.uid()
            AND e.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.auth_id = auth.uid()
            AND e.is_admin = true
        )
    );

-- Create employee view policy
CREATE POLICY employee_view_own ON shifts
    FOR SELECT
    TO authenticated
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE auth_id = auth.uid()
        )
    );

-- Let's also verify your admin status in employees table
UPDATE employees 
SET is_admin = true 
WHERE auth_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@company.com'
);
