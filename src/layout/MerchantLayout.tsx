import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Church,
  FileVolume,
  HandCoins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import ThemeToggle from '../components/ui/ThemeToggle';
import UserMenu from '../components/ui/UserMenu';

const MerchantLayout = () => {
  const { user } = useAuth();
  const { hasFeature } = useFeatureFlag();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Navigation with feature requirements
  const allNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      requiresFeature: null // Always visible
    },
    { 
      name: 'Branches', 
      href: '/branches', 
      icon: Church,
      requiresFeature: 'branchManagement'
    },
    { 
      name: 'Members', 
      href: '/members', 
      icon: Users,
      requiresFeature: 'memberManagement'
    },
    { 
      name: 'Sermons', 
      href: '/sermons', 
      icon: FileVolume,
      requiresFeature: 'sermonManagement'
    },
    { 
      name: 'Events', 
      href: '/events', 
      icon: Calendar,
      requiresFeature: 'eventManagement'
    },
    { 
      name: 'Finance', 
      href: '/finance', 
      icon: HandCoins,
      requiresFeature: 'financialManagement'
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: MessageSquare,
      requiresFeature: 'smsCommunications'
    },
  ];

  // ✅ Filter navigation based on user's subscription features
  const navigation = allNavigation.filter(item => {
    // Always show items without feature requirements
    if (!item.requiresFeature) return true;
    
    // Check if user has the required feature
    return hasFeature(item.requiresFeature as any);
  });

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64
        bg-gray-900 dark:bg-gray-950
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        flex flex-col
      `}>
        {/* Logo/Church Name - Fixed at top */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800 dark:border-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {user?.merchant?.branding?.logo ? (
              <img 
                src={user.merchant.branding.logo} 
                alt={user.merchant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                {user?.merchant?.name?.charAt(0) || 'C'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-sm truncate">
                {user?.merchant?.name || 'Church'}
              </h2>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation - ✅ Only shows features user has access to */}
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
                    ? 'bg-primary-600 text-white shadow-primary-600/50'
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

        {/* Bottom Links - Fixed at bottom */}
        <div className="p-3 border-t border-gray-800 dark:border-gray-900 space-y-1 flex-shrink-0">
          <Link
            to="/settings"
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

      {/* Main Content - ✅ ADJUSTED: Add left margin on desktop */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header - White with search & user */}
        <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Mobile menu + Search */}
            <div className="flex items-center flex-1 space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Search Bar */}
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
              
              {/* Notification Bell */}
              <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="pl-3 border-l border-gray-200 dark:border-gray-700">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - This is where content scrolls */}
        <main className="flex-1 bg-gray-100 dark:bg-gray-900 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MerchantLayout;