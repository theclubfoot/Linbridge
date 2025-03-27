import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface UserMetadata {
  role?: string;
}

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'admin' | 'employee';
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      // Check user role from metadata
      const metadata = session.user.user_metadata as UserMetadata;
      const userRole = metadata?.role;
      setHasAccess(userRole === role);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return hasAccess ? children : <Navigate to="/login" />;
}