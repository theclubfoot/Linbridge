import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Clock, User, DollarSign, TrendingUp, LogOut, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export function EmployeePortal() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/employee') {
      navigate('/employee/dashboard');
    }
  }, [location.pathname, navigate]);

  const navigation = [
    { name: 'Dashboard', href: '/employee/dashboard', icon: User },
    { name: 'Attendance', href: '/employee/attendance', icon: Clock },
    { name: 'Shifts', href: '/employee/shifts', icon: Calendar },
    { name: 'Payslips', href: '/employee/payslips', icon: DollarSign },
    { name: 'Performance', href: '/employee/performance', icon: TrendingUp }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-white shadow-md">
          <div className="flex flex-col h-full">
            <div className="p-4">
              <h2 className="text-xl font-semibold text-gray-800">Employee Portal</h2>
            </div>
            <nav className="flex-1">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`flex items-center px-4 py-2 text-sm ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}