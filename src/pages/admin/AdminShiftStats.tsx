import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ShiftStats {
  totalShifts: number;
  shiftsPerType: Record<string, number>;
  shiftsPerEmployee: Array<{
    employee_name: string;
    total_shifts: number;
  }>;
  shiftsPerDepartment: Array<{
    department: string;
    total_shifts: number;
  }>;
  requestStats: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export function AdminShiftStats() {
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');
  const [stats, setStats] = useState<ShiftStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [timeframe]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = timeframe === 'week' 
        ? startOfWeek(new Date()) 
        : startOfMonth(new Date());
      const endDate = timeframe === 'week'
        ? endOfWeek(new Date())
        : endOfMonth(new Date());

      // Fetch shifts data
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select(`
          *,
          employee:employees!inner (
            first_name,
            last_name,
            department:departments!inner (name)
          )
        `)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (shiftsError) throw shiftsError;

      // Fetch request stats
      const { data: requestsData, error: requestsError } = await supabase
        .from('shift_requests')
        .select('status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (requestsError) throw requestsError;

      // Process shifts data
      const shiftsPerType: Record<string, number> = {};
      const employeeShifts: Record<string, number> = {};
      const departmentShifts: Record<string, number> = {};

      shiftsData?.forEach(shift => {
        // Count shifts per type
        shiftsPerType[shift.shift_type] = (shiftsPerType[shift.shift_type] || 0) + 1;

        // Count shifts per employee
        const employeeName = `${shift.employee.first_name} ${shift.employee.last_name}`;
        employeeShifts[employeeName] = (employeeShifts[employeeName] || 0) + 1;

        // Count shifts per department
        const department = shift.employee.department.name;
        departmentShifts[department] = (departmentShifts[department] || 0) + 1;
      });

      // Process request stats
      const requestStats = {
        total: requestsData?.length || 0,
        approved: requestsData?.filter(r => r.status === 'approved').length || 0,
        rejected: requestsData?.filter(r => r.status === 'rejected').length || 0,
        pending: requestsData?.filter(r => r.status === 'pending').length || 0,
      };

      setStats({
        totalShifts: shiftsData?.length || 0,
        shiftsPerType,
        shiftsPerEmployee: Object.entries(employeeShifts).map(([name, count]) => ({
          employee_name: name,
          total_shifts: count,
        })),
        shiftsPerDepartment: Object.entries(departmentShifts).map(([dept, count]) => ({
          department: dept,
          total_shifts: count,
        })),
        requestStats,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load shift statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading statistics...</div>
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
        <h1 className="text-2xl font-semibold text-gray-900">Shift Statistics</h1>
        <select
          className="mt-1 block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'week' | 'month')}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Summary Cards */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600">Total Shifts</div>
              <div className="text-2xl font-semibold text-blue-900">
                {stats?.totalShifts}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600">Approved Requests</div>
              <div className="text-2xl font-semibold text-green-900">
                {stats?.requestStats.approved}
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600">Pending Requests</div>
              <div className="text-2xl font-semibold text-yellow-900">
                {stats?.requestStats.pending}
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600">Rejected Requests</div>
              <div className="text-2xl font-semibold text-red-900">
                {stats?.requestStats.rejected}
              </div>
            </div>
          </div>
        </div>

        {/* Shifts by Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shifts by Type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats?.shiftsPerType || {}).map(([type, value]) => ({
                    name: type,
                    value,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) => 
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats?.shiftsPerType || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shifts per Employee */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shifts per Employee</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.shiftsPerEmployee}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="employee_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_shifts" fill="#8884d8" name="Total Shifts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shifts per Department */}
        <div className="bg-white shadow rounded-lg p-6 md:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Shifts per Department</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.shiftsPerDepartment}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_shifts" fill="#82ca9d" name="Total Shifts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
