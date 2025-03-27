import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // Create user in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@lsi.com',
      password: 'admin123',
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (authError) throw authError;

    // Create employee record
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        auth_id: authData.user?.id,
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@lsi.com'
      });

    if (employeeError) throw employeeError;

    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();
