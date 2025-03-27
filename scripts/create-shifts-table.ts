import { supabase } from '../src/lib/supabase';

async function createShiftsTable() {
  const sql = `
    -- Create shifts table
    CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        shift_type TEXT NOT NULL CHECK (shift_type IN ('Morning', 'Afternoon', 'Evening')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        CONSTRAINT shifts_end_time_check CHECK (end_time > start_time),
        CONSTRAINT shifts_duration_check CHECK (
            EXTRACT(EPOCH FROM (end_time - start_time))/3600 BETWEEN 4 AND 12
        )
    );

    -- Add RLS policies
    ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

    -- Admins can do everything
    CREATE POLICY "Admins can do everything" ON shifts
        FOR ALL
        TO authenticated
        USING (auth.jwt() ->> 'role' = 'admin')
        WITH CHECK (auth.jwt() ->> 'role' = 'admin');

    -- Employees can view their own shifts
    CREATE POLICY "Employees can view their own shifts" ON shifts
        FOR SELECT
        TO authenticated
        USING (
            employee_id IN (
                SELECT id FROM employees 
                WHERE auth_id = auth.uid()
            )
        );

    -- Create updated_at trigger
    CREATE OR REPLACE FUNCTION update_shifts_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER shifts_updated_at
        BEFORE UPDATE ON shifts
        FOR EACH ROW
        EXECUTE FUNCTION update_shifts_updated_at();

    -- Create index for faster queries
    CREATE INDEX IF NOT EXISTS shifts_employee_id_idx ON shifts(employee_id);
    CREATE INDEX IF NOT EXISTS shifts_start_time_idx ON shifts(start_time);

    -- Enable realtime
    ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) throw error;
    console.log('Successfully created shifts table and related objects');
  } catch (error) {
    console.error('Error creating shifts table:', error);
  }
}

createShiftsTable();
