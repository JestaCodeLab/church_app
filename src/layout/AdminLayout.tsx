import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Building2, 
  Users, 
  BarChart3, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Merchants', href: '/admin/merchants', icon: Building2 },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-primary-900 shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-800"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Logo */}
              <div className="flex items-center ml-4 md:ml-0">
                <Shield className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">
                  Super Admin
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <p className="font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-primary-200">Platform Owner</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-800"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 pt-16">
        <div className="flex-1 flex flex-col min-h-0 bg-primary-800">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive(item.href)
                        ? 'bg-primary-900 text-white'
                        : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        mr-3 flex-shrink-0 h-6 w-6
                        ${isActive(item.href) ? 'text-white' : 'text-primary-300 group-hover:text-white'}
                      `}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 pt-16">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-800">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        group flex items-center px-2 py-2 text-base font-medium rounded-md
                        ${isActive(item.href)
                          ? 'bg-primary-900 text-white'
                          : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                        }
                      `}
                    >
                      <Icon
                        className={`
                          mr-4 flex-shrink-0 h-6 w-6
                          ${isActive(item.href) ? 'text-white' : 'text-primary-300 group-hover:text-white'}
                        `}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1 pt-16">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* This is where nested routes will render */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;