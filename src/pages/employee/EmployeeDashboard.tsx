import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: { title: string };
  department: { name: string };
}

export function EmployeeDashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  useEffect(() => {
    fetchEmployeeData();
    fetchAnnouncements();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          email,
          position:positions(title),
          department:departments(name)
        `)
        .eq('auth_id', session.user.id)
        .single();

      if (error) throw error;
      setEmployee(data);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!employee) return <div>Error loading employee data</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome, {employee.first_name}!
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Employee Information Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Employee Information</h2>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {employee.first_name} {employee.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.position?.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Department</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.department?.name}</dd>
            </div>
          </dl>
        </div>

        {/* Recent Announcements Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Announcements</h2>
          <div className="space-y-4">
            {recentAnnouncements.map((announcement: any) => (
              <div key={announcement.id} className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-medium text-gray-900">{announcement.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{announcement.content}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
