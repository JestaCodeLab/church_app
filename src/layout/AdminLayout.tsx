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
  Crown,
  ChevronDown,
  ChevronRight,
  Percent,
  Sparkles,
  GitBranch,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Wallet,
  FileText // Added FileText icon
} from 'lucide-react';
import ThemeToggle from '../components/ui/ThemeToggle';
import UserMenu from '../components/ui/UserMenu';

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [plansMenuOpen, setPlansMenuOpen] = useState(false); // ✅ FIXED: Changed from true to false
  const [messagingMenuOpen, setMessagingMenuOpen] = useState(false); // ✅ NEW: Messaging submenu

  // Main navigation (no submenus)
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Churches', href: '/admin/churches', icon: Building2 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Branches', href: '/admin/branches', icon: GitBranch },
    {
      name: 'Departments',
      icon: Users,
      href: '/admin/departments',
    },
  ];

  // Plans submenu items
  const plansSubmenu = [
    { name: 'All Plans', href: '/admin/plans', icon: Crown },
    { name: 'Discounts', href: '/admin/discounts', icon: Percent },
    { name: 'Features', href: '/admin/features', icon: Sparkles },
  ];

  // ✅ NEW: Messaging submenu items
  const messagingSubmenu = [
    { name: 'SMS Packages', href: '/admin/sms-packages', icon: CreditCard },
    { name: 'SMS Statistics', href: '/admin/sms-statistics', icon: TrendingUp },
    { name: 'SMS Balance', href: '/admin/sms-balance', icon: Wallet },
    { name: 'SMS Sender IDs', href: '/admin/sender-ids', icon: MessageSquare },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isSubmenuActive = (items: any[]) => items.some(item => location.pathname.startsWith(item.href));

  // ✅ Auto-expand messaging menu if on messaging pages
  React.useEffect(() => {
    if (isSubmenuActive(messagingSubmenu)) {
      setMessagingMenuOpen(true);
    }
  }, [location.pathname]);

  // ✅ Auto-expand plans menu if on plans pages
  React.useEffect(() => {
    if (isSubmenuActive(plansSubmenu)) {
      setPlansMenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors">
      {/* Sidebar - Dark */}
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

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {/* Regular navigation items */}
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

          {/* Plans Menu with Submenu */}
          <div>
            <button
              onClick={() => setPlansMenuOpen(!plansMenuOpen)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                transition-all duration-200
                ${isSubmenuActive(plansSubmenu)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center">
                <Crown className="w-5 h-5 mr-3" />
                <span>Plans & Billing</span>
              </div>
              {plansMenuOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Plans Submenu Items */}
            {plansMenuOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-800">
                {plansSubmenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center pl-6 pr-3 py-2 text-sm font-medium rounded-r-lg
                        transition-all duration-200
                        ${location.pathname.startsWith(item.href)
                          ? 'bg-primary-600 text-white border-l-2 border-primary-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* ✅ NEW: Messaging Menu with Submenu */}
          <div>
            <button
              onClick={() => setMessagingMenuOpen(!messagingMenuOpen)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
                transition-all duration-200
                ${isSubmenuActive(messagingSubmenu)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-3" />
                <span>Messaging</span>
              </div>
              {messagingMenuOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Messaging Submenu Items */}
            {messagingMenuOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-800">
                {messagingSubmenu.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center pl-6 pr-3 py-2 text-sm font-medium rounded-r-lg
                        transition-all duration-200
                        ${location.pathname.startsWith(item.href)
                          ? 'bg-primary-600 text-white border-l-2 border-primary-400'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border-l-2 border-transparent'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Links - Fixed at bottom */}
        <div className="p-3 border-t border-gray-800 dark:border-gray-900 space-y-1 flex-shrink-0">
          {/* New Logs Link */}
          <Link
            to="/admin/logs"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
              transition-all duration-200
              ${isActive('/admin/logs')
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <FileText className="w-5 h-5 mr-3" />
            System Logs
          </Link>
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

        {/* Page Content - Scrollable */}
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