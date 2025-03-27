import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: {
    name: string;
  };
}

interface Shift {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  employee?: Employee;
}

interface ShiftFormData {
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
}

const SHIFT_TYPES = ['Morning', 'Afternoon', 'Evening'];

export function AdminShifts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    employee_id: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    shift_type: 'Morning'
  });

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }

    const { data: { role } } = await supabase.rpc('get_user_role');
    if (role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  };

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          department:departments!inner (name)
        `);

      if (employeesError) throw employeesError;

      // Transform employee data to match our interface
      const transformedEmployees: Employee[] = (employeesData || []).map(emp => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        department: { name: emp.department.name }
      }));
      setEmployees(transformedEmployees);

      // Fetch all shifts with employee details
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:employees!inner (
            id,
            first_name,
            last_name,
            department:departments!inner (name)
          )
        `)
        .order('start_time', { ascending: false });

      if (shiftsError) throw shiftsError;
      setShifts(shiftsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddShift = () => {
    setEditingShift(null);
    setFormData({
      employee_id: '',
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      shift_type: 'Morning'
    });
    setIsModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setFormData({
      employee_id: shift.employee_id,
      start_time: format(new Date(shift.start_time), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(shift.end_time), "yyyy-MM-dd'T'HH:mm"),
      shift_type: shift.shift_type
    });
    setIsModalOpen(true);
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;

    try {
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting shift:', error);
      setError('Failed to delete shift');
    }
  };

  const validateShiftTimes = (start: Date, end: Date): string | null => {
    // Check if end time is after start time
    if (end <= start) {
      return 'End time must be after start time';
    }

    // Check shift duration (4-12 hours)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours < 4 || durationHours > 12) {
      return 'Shift duration must be between 4 and 12 hours';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);

      // Validate shift times before submitting
      const validationError = validateShiftTimes(startTime, endTime);
      if (validationError) {
        throw new Error(validationError);
      }

      // Convert form times to ISO strings with timezone
      const formattedData = {
        ...formData,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      };

      if (editingShift) {
        const { error: updateError } = await supabase
          .from('shifts')
          .update(formattedData)
          .eq('id', editingShift.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase
          .from('shifts')
          .insert(formattedData);

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(insertError.message);
        }
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (error: any) {
      console.error('Error saving shift:', error);
      setError(error.message || 'Failed to save shift. Please check the shift duration (4-12 hours) and ensure end time is after start time.');
    }
  };

  const formatTime = (timeStr: string) => {
    return format(new Date(timeStr), 'MMM d, yyyy h:mm a');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Shifts</h1>
        <button
          onClick={handleAddShift}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Add New Shift
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {shift.employee?.first_name} {shift.employee?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shift.employee?.department?.name}
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditShift(shift)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding/editing shifts */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Employee
                      </label>
                      <select
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        required
                      >
                        <option value="">Select an employee</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Shift Type
                      </label>
                      <select
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.shift_type}
                        onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                        required
                      >
                        {SHIFT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingShift ? 'Update Shift' : 'Add Shift'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
