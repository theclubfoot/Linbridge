import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AttendanceRecord, Employee } from '../types';

export function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, [selectedDate]);

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('employment_status', 'active');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }

  async function fetchAttendanceRecords() {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('check_in', `${selectedDate}T00:00:00`)
        .lte('check_in', `${selectedDate}T23:59:59`);
      
      if (error) throw error;
      setAttendanceRecords(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setLoading(false);
    }
  }

  async function handleCheckIn(employeeId: string) {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          employee_id: employeeId,
          check_in: new Date().toISOString(),
          status: 'present'
        }]);
      
      if (error) throw error;
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error recording check-in:', error);
    }
  }

  async function handleCheckOut(recordId: string) {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ check_out: new Date().toISOString() })
        .eq('id', recordId);
      
      if (error) throw error;
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Error recording check-out:', error);
    }
  }

  function getAttendanceStatus(employeeId: string) {
    const record = attendanceRecords.find(r => r.employee_id === employeeId);
    if (!record) return 'absent';
    if (record.check_in && !record.check_out) return 'checked-in';
    if (record.check_in && record.check_out) return 'checked-out';
    return 'absent';
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Attendance Tracking</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track employee attendance and manage check-in/check-out times.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Employee
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Check In
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Check Out
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {employees.map((employee) => {
                    const record = attendanceRecords.find(r => r.employee_id === employee.id);
                    const status = getAttendanceStatus(employee.id);
                    
                    return (
                      <tr key={employee.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </div>
                              <div className="text-gray-500">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            status === 'checked-in'
                              ? 'bg-green-100 text-green-800'
                              : status === 'checked-out'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record?.check_in ? format(new Date(record.check_in), 'HH:mm:ss') : '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {record?.check_out ? format(new Date(record.check_out), 'HH:mm:ss') : '-'}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {status === 'absent' && (
                            <button
                              onClick={() => handleCheckIn(employee.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Clock className="h-5 w-5" />
                            </button>
                          )}
                          {status === 'checked-in' && record && (
                            <button
                              onClick={() => handleCheckOut(record.id)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {status === 'checked-out' && (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}