import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart2, 
  Briefcase, 
  Building2, 
  Bell, 
  LogOut,
  Calendar,
  ClipboardCheck,
  LineChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export function AdminPortal() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/admin') {
      navigate('/admin/dashboard');
    }
  }, [location.pathname, navigate]);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart2 },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Shifts', href: '/admin/shifts', icon: Calendar },
    { name: 'Shift Requests', href: '/admin/shift-requests', icon: ClipboardCheck },
    { name: 'Shift Statistics', href: '/admin/shift-stats', icon: LineChart },
    { name: 'Departments', href: '/admin/departments', icon: Building2 },
    { name: 'Positions', href: '/admin/positions', icon: Briefcase },
    { name: 'Announcements', href: '/admin/announcements', icon: Bell }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
              <div className="flex items-center flex-shrink-0 px-4">
                <img
                  className="h-8 w-auto"
                  src="/logo.png"
                  alt="Your Company"
                />
              </div>
              <div className="mt-5 flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`${
                          location.pathname.startsWith(item.href)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                      >
                        <Icon
                          className={`${
                            location.pathname.startsWith(item.href)
                              ? 'text-gray-500'
                              : 'text-gray-400 group-hover:text-gray-500'
                          } mr-3 flex-shrink-0 h-6 w-6`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 w-full group block"
                >
                  <div className="flex items-center">
                    <div>
                      <LogOut className="inline-block h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        Logout
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
