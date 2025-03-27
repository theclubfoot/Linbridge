import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: { name: string };
}

interface Shift {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
}

interface Schedule {
  employee: Employee;
  shifts: Shift[];
}

export function EmployeeShifts() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setError(null);
      // First get all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          department:departments (name)
        `);

      console.log('Employees data:', employeesData);
      if (employeesError) {
        console.error('Employees error:', employeesError);
        throw employeesError;
      }

      // Then get their shifts
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .in('employee_id', employeesData?.map(e => e.id) || []);

      console.log('Shifts data:', shiftsData);
      if (shiftsError) {
        console.error('Shifts error:', shiftsError);
        throw shiftsError;
      }

      // Transform the data to match our Schedule interface
      const transformedData: Schedule[] = (employeesData || []).map(employee => ({
        employee: {
          id: employee.id,
          first_name: employee.first_name,
          last_name: employee.last_name,
          department: { name: employee.department?.name || 'Unknown' }
        },
        shifts: (shiftsData || []).filter(shift => shift.employee_id === employee.id)
      }));

      console.log('Transformed data:', transformedData);
      setSchedules(transformedData);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string) => {
    return format(new Date(timeStr), 'h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Employee Shifts</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shift Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(schedule => (
                schedule.shifts.map(shift => (
                  <tr key={shift.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.employee.first_name} {schedule.employee.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {schedule.employee.department.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {shift.shift_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(shift.start_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(shift.end_time)}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
