import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { validateShift } from '../../utils/shiftValidation';

interface ShiftRequest {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  response_message?: string;
  employee: {
    first_name: string;
    last_name: string;
    department: { name: string };
  };
}

export function AdminShiftRequests() {
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ShiftRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('shift_requests')
        .select(`
          *,
          employee:employees!inner (
            first_name,
            last_name,
            department:departments!inner (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load shift requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (status === 'approved') {
        // Validate the shift before approving
        const { data: existingShifts } = await supabase
          .from('shifts')
          .select('*')
          .eq('employee_id', request.employee_id);

        const validation = validateShift(
          {
            employee_id: request.employee_id,
            start_time: request.start_time,
            end_time: request.end_time,
            shift_type: request.shift_type
          },
          existingShifts || []
        );

        if (!validation.isValid) {
          setError(validation.error);
          return;
        }

        // Create the shift
        const { error: shiftError } = await supabase
          .from('shifts')
          .insert({
            employee_id: request.employee_id,
            start_time: request.start_time,
            end_time: request.end_time,
            shift_type: request.shift_type
          });

        if (shiftError) throw shiftError;
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('shift_requests')
        .update({
          status,
          response_message: responseMessage || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      setResponseMessage('');
      setSelectedRequest(null);
      await fetchRequests();
    } catch (error) {
      console.error('Error handling request:', error);
      setError('Failed to process request');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading requests...</div>
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
        <h1 className="text-2xl font-semibold text-gray-900">Shift Requests</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.employee.first_name} {request.employee.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.employee.department.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {request.shift_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(request.start_time), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(request.end_time), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Respond
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900">Respond to Shift Request</h3>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Response Message
                  </label>
                  <textarea
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleResponse(selectedRequest.id, 'approved')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleResponse(selectedRequest.id, 'rejected')}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setResponseMessage('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
