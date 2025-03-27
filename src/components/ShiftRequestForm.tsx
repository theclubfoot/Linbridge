import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { validateShift } from '../utils/shiftValidation';

interface ShiftRequestFormProps {
  employeeId: string;
  onSuccess?: () => void;
}

const SHIFT_TYPES = ['Morning', 'Afternoon', 'Evening'];

export function ShiftRequestForm({ employeeId, onSuccess }: ShiftRequestFormProps) {
  const [formData, setFormData] = useState({
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    shift_type: 'Morning',
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get existing shifts for validation
      const { data: existingShifts } = await supabase
        .from('shifts')
        .select('*')
        .eq('employee_id', employeeId);

      // Validate the shift request
      const validation = validateShift(
        {
          employee_id: employeeId,
          ...formData
        },
        existingShifts || []
      );

      if (!validation.isValid) {
        setError(validation.error);
        return;
      }

      // Submit the shift request
      const { error: submitError } = await supabase
        .from('shift_requests')
        .insert({
          employee_id: employeeId,
          start_time: formData.start_time,
          end_time: formData.end_time,
          shift_type: formData.shift_type,
          reason: formData.reason
        });

      if (submitError) throw submitError;

      // Reset form and notify parent
      setFormData({
        start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        shift_type: 'Morning',
        reason: ''
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting shift request:', error);
      setError('Failed to submit shift request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

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

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Reason
        </label>
        <textarea
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
