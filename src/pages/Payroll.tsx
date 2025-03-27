import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { DollarSign, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { PayrollRecord, Employee } from '../types';

export function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchPayrollRecords();
  }, [selectedMonth]);

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

  async function fetchPayrollRecords() {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from('payroll')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate);
      
      if (error) throw error;
      setPayrollRecords(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payroll records:', error);
      setLoading(false);
    }
  }

  async function generatePayroll() {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      for (const employee of employees) {
        // Check if payroll already exists for this employee and period
        const existingPayroll = payrollRecords.find(
          record => record.employee_id === employee.id &&
          record.period_start === startDate
        );

        if (!existingPayroll) {
          const payrollData = {
            employee_id: employee.id,
            period_start: startDate,
            period_end: endDate,
            base_pay: employee.base_salary,
            overtime_pay: 0, // Calculate based on attendance if needed
            bonuses: 0,
            total_deductions: 0,
            net_pay: employee.base_salary, // Simplified calculation
            status: 'pending'
          };

          const { error } = await supabase
            .from('payroll')
            .insert([payrollData]);

          if (error) throw error;
        }
      }

      fetchPayrollRecords();
    } catch (error) {
      console.error('Error generating payroll:', error);
    }
  }

  async function approvePayroll(recordId: string) {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({ status: 'approved' })
        .eq('id', recordId);
      
      if (error) throw error;
      fetchPayrollRecords();
    } catch (error) {
      console.error('Error approving payroll:', error);
    }
  }

  function getEmployeeName(employeeId: string) {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Payroll Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage employee payroll, process payments, and generate payslips.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            onClick={generatePayroll}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Generate Payroll
          </button>
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
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Base Pay
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Overtime
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Bonuses
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Deductions
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Net Pay
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {payrollRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="font-medium text-gray-900">
                          {getEmployeeName(record.employee_id)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {format(new Date(record.period_start), 'MMM d')} - {format(new Date(record.period_end), 'MMM d, yyyy')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        ${record.base_pay.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        ${record.overtime_pay?.toFixed(2) || '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        ${record.bonuses?.toFixed(2) || '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        ${record.total_deductions?.toFixed(2) || '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">
                        ${record.net_pay.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          record.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {record.status === 'pending' && (
                          <button
                            onClick={() => approvePayroll(record.id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => {/* Download payslip logic */}}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}