import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function PromoteToAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const promoteToAdmin = async () => {
    if (!currentUser) {
      setError('No user logged in');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update user's role in auth.users metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'admin' }
      });

      if (updateError) throw updateError;

      // Sign out the user so they can log back in with new role
      await supabase.auth.signOut();
      
      alert('Your account has been promoted to admin! Please log in again.');
      navigate('/login');
    } catch (error: any) {
      console.error('Error promoting to admin:', error);
      setError(error.message || 'Failed to promote to admin');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="text-center">Please log in first</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Promote to Admin
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">Current user: {currentUser.email}</p>
          </div>

          <button
            onClick={promoteToAdmin}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Promoting...' : 'Promote to Admin'}
          </button>

          <div className="mt-4 text-sm text-gray-600">
            <p>This will:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Update your role to admin</li>
              <li>Sign you out</li>
              <li>Require you to log in again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
