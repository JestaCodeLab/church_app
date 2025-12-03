import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Building2, 
  Users, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Search,
  Bell,
  Crown
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import UserMenu from '../components/ui/UserMenu';

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Merchants', href: '/admin/merchants', icon: Building2 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Features', href: '/admin/features', icon: Crown },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Sidebar - Dark - ✅ FIXED: Non-scrolling */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-gray-900 dark:bg-gray-950
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        flex flex-col
      `}>
        {/* Logo - Fixed at top */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800 dark:border-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">Super Admin</h2>
              <p className="text-gray-400 text-xs">Platform Owner</p>
            </div>
          </div>
        </div>

        {/* Navigation - ✅ FIXED: Only scrolls if content overflows */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                  transition-all duration-200
                  ${isActive(item.href)
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links - ✅ FIXED: Fixed at bottom */}
        <div className="p-3 border-t border-gray-800 dark:border-gray-900 space-y-1 flex-shrink-0">
          <Link
            to="/admin/settings"
            className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center flex-1 space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-0 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Right: Theme + Notification + User */}
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="pl-3 border-l border-gray-200 dark:border-gray-700">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - ✅ This is where content scrolls */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;