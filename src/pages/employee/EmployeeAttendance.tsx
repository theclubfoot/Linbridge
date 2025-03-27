import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  check_in: string;
  check_out: string | null;
  status: string;
}

export function EmployeeAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to view attendance');
        return;
      }

      // Get employee ID
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (employeeError) throw employeeError;
      if (!employeeData) {
        setError('Employee record not found');
        return;
      }

      // Get attendance records
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('check_in', { ascending: false });

      if (error) throw error;
      
      // Get current record (any record from today without a check_out)
      const today = new Date().toISOString().split('T')[0];
      const current = data?.find(record => 
        record.check_in.startsWith(today) && !record.check_out
      );
      
      setCurrentRecord(current || null);
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to check in');
        return;
      }

      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();

      if (employeeError) throw employeeError;

      const { data, error } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: employeeData.id,
          check_in: new Date().toISOString(),
          status: 'present'
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentRecord(data);
      await fetchAttendance();
    } catch (error) {
      console.error('Error checking in:', error);
      setError('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    if (!currentRecord) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('attendance_records')
        .update({ 
          check_out: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', currentRecord.id);

      if (error) throw error;
      
      setCurrentRecord(null);
      await fetchAttendance();
    } catch (error) {
      console.error('Error checking out:', error);
      setError('Failed to check out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading attendance records...</div>
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

      {/* Check In/Out Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Attendance</h1>
          {currentRecord ? (
            <button
              onClick={handleCheckOut}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Check Out
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors"
            >
              Check In
            </button>
          )}
        </div>

        {currentRecord && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            Checked in at {format(new Date(currentRecord.check_in), 'h:mm a')}
          </div>
        )}
      </div>

      {/* Attendance History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Attendance History</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {attendance.length === 0 ? (
            <div className="px-6 py-4 text-gray-500 text-center">
              No attendance records found
            </div>
          ) : (
            attendance.map((record) => (
              <div key={record.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(record.check_in), 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Check in: {format(new Date(record.check_in), 'h:mm a')}
                      {record.check_out && (
                        <> • Check out: {format(new Date(record.check_out), 'h:mm a')}</>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      record.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}