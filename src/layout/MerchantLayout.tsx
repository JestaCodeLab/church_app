import React, { useEffect, useState, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
  HandCoins,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Mail,
  FileText,
  History,
  CreditCard,
  BarChart3,
  Cake,
  DollarSign,
  TrendingUp,
  Wallet,
  Receipt,
  PieChart,
  CheckCircle2,
  Lock,
  Send,
  FileChartColumn,
  HandHeart,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { useMerchant } from '../context/MerchantContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import UserMenu from '../components/ui/UserMenu';
import SubscriptionAlert from '../components/ui/SubscriptionAlert';
import ChurchSelector from '../components/selectors/ChurchSelector';

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  requiresFeature: string | null;
  lockedFeature?: string | null; // Feature required to unlock this menu item
  children?: NavigationItem[];
}

const MerchantLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasFeature } = useFeatureFlag();
  const location = useLocation();
  const { selectedMerchantId, setSelectedMerchantId, setSelectedMerchantSubdomain } = useMerchant();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlert, setShowAlert] = useState(true);

  // Get subscription details
  const subscription = user?.merchant?.subscription;
  const subscriptionStatus = subscription?.status;
  const planName = subscription?.planDetails?.name || subscription?.plan;
  const expiryDate = subscription?.currentPeriodEnd;

  // Calculate days until renewal
  const getDaysUntilRenewal = (): number => {
    if (!expiryDate) return 0;
    const now = new Date();
    const renewalDate = new Date(expiryDate);
    const diffTime = renewalDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilRenewal = getDaysUntilRenewal();

  // Determine which alert to show
  const getAlertStatus = (): 'expired' | 'cancelled' | 'expiring_soon' | null => {
    if (subscriptionStatus === 'expired') return 'expired';
    if (subscriptionStatus === 'cancelled') return 'cancelled';
    if (daysUntilRenewal <= 7 && daysUntilRenewal > 0) return 'expiring_soon';
    return null;
  };

  useEffect(() => {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }, []); 

  const alertStatus = getAlertStatus();

  // Reset alert visibility when status changes
  useEffect(() => {
    setShowAlert(true);
  }, [subscriptionStatus]);

  // For super admin: if no merchant is selected, redirect to church selector
  useEffect(() => {
    if (user?.role?.slug === 'super_admin' && !selectedMerchantId) {
      navigate('/select-church');
    }
  }, [user?.role?.slug, selectedMerchantId, navigate]);

  // Handle church selection for super admin
  const handleSelectChurch = (church: any) => {
    setSelectedMerchantId(church._id);
    setSelectedMerchantSubdomain(church.subdomain);
  };

  // ✅ Helper function to filter navigation based on features
  const filterNavigation = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter(item => {
        if (!item.requiresFeature) return true;
        return hasFeature(item.requiresFeature as any);
      })
      .map(item => {
        if (item.children) {
          return {
            ...item,
            children: filterNavigation(item.children)
          };
        }
        return item;
      });
  };

  // Navigation configuration based on user role
  const navigation = useMemo(() => {
    let allNavigation: NavigationItem[] = [];

    // Department Admin Navigation (Limited)
    if (user?.role?.slug === 'dept_admin') {
      allNavigation = [
        { 
          name: 'My Departments', 
          href: '/departments', 
          icon: FolderKanban,
          requiresFeature: null
        },
        { 
          name: 'Members', 
          href: '/members', 
          icon: Users,
          requiresFeature: 'memberManagement'
        },
        { 
          name: 'SMS', 
          icon: MessageSquare,
          requiresFeature: 'smsCommunications',
          children: [
            {
              name: 'Send SMS',
              href: '/messaging/send',
              icon: Mail,
              requiresFeature: 'smsCommunications'
            },
            {
              name: 'History',
              href: '/messaging/history',
              icon: History,
              requiresFeature: 'smsCommunications'
            }
          ]
        },
        { 
          name: 'Events', 
          href: '/events', 
          icon: Calendar,
          requiresFeature: 'eventManagement'
        },

      ];
    } 
    // Finance Admin Navigation
    else if (user?.role?.slug === 'finance_admin') {
      allNavigation = [
        { 
          name: 'Dashboard', 
          href: '/dashboard', 
          icon: LayoutDashboard,
          requiresFeature: null
        },
        { 
          name: 'Finance', 
          icon: HandCoins,
          requiresFeature: 'financialManagement',
          children: [
            {
              name: 'Overview',
              href: '/finance/overview',
              icon: PieChart,
              requiresFeature: 'financialManagement'
            },
            {
              name: 'Income',
              href: '/finance/income',
              icon: TrendingUp,
              requiresFeature: 'financialManagement'
            },
            {
              name: 'Expenses',
              href: '/finance/expenses',
              icon: Receipt,
              requiresFeature: 'financialManagement'
            },
            {
              name: 'Donations',
              href: '/finance/donations',
              icon: HandHeart,
              requiresFeature: 'financialManagement',
              lockedFeature: 'donationTracking'
            },
            {
              name: 'Reports',
              href: '/finance/reports',
              icon: BarChart3,
              requiresFeature: 'financialManagement'
            },
            {
              name: 'Transactions',
              href: '/finance/transactions',
              icon: Wallet,
              requiresFeature: 'financialManagement'
            }
          ]
        },
        { 
          name: 'Members', 
          href: '/members', 
          icon: Users,
          requiresFeature: 'memberManagement'
        },
        { 
          name: 'Events', 
          href: '/events', 
          icon: Calendar,
          requiresFeature: 'eventManagement'
        },
      ];
    }
    // Church Admin / Full Access Navigation
    else {
      allNavigation = [
        { 
          name: 'Dashboard', 
          href: '/dashboard', 
          icon: LayoutDashboard,
          requiresFeature: null
        },
        { 
          name: 'Branches', 
          href: '/branches', 
          icon: Church,
          requiresFeature: 'branchManagement'
        },
        { 
          name: 'Departments', 
          href: '/departments', 
          icon: FolderKanban,
          requiresFeature: 'departmentManagement'
        },
        { 
          name: 'Members', 
          icon: Users,
          requiresFeature: 'memberManagement',
          children: [
            {
              name: 'All Members',
              href: '/members/all',
              icon: Users,
              requiresFeature: 'memberManagement'
            },
            {
              name: 'Birthdays',
              href: '/members/birthdays',
              icon: Cake,
              requiresFeature: 'memberManagement'
            },
          ]
        },
        // { 
        //   name: 'Sermons', 
        //   href: '/sermons', 
        //   icon: FileVolume,
        //   requiresFeature: 'sermonManagement'
        // },
        { 
          name: 'Events', 
          href: '/events', 
          icon: Calendar,
          requiresFeature: 'eventManagement'
        },

        { 
          name: 'Finance', 
          icon: HandCoins,
          requiresFeature: 'financialManagement',
          children: [
            {
              name: 'Overview',
              href: '/finance/overview',
              icon: PieChart,
              requiresFeature: 'financialManagement',
              lockedFeature: null
            },
            {
              name: 'Income',
              href: '/finance/income',
              icon: TrendingUp,
              requiresFeature: 'financialManagement',
              lockedFeature: 'incomeTracking'
            },
            {
              name: 'Expenses',
              href: '/finance/expenses',
              icon: Receipt,
              requiresFeature: 'financialManagement',
              lockedFeature: 'expenseTracking'
            },
            {
              name: 'Tithing',
              href: '/finance/tithing',
              icon: Coins,
              requiresFeature: 'financialManagement',
              lockedFeature: 'tithingManagement'
            },
            {
              name: 'Reports',
              href: '/finance/reports',
              icon: FileChartColumn,
              requiresFeature: 'financialManagement',
              lockedFeature: 'financialReports'
            },
            {
              name: 'Donations',
              href: '/finance/donations',
              icon: HandHeart,
              requiresFeature: 'financialManagement',
              lockedFeature: 'eventDonationss'
            },
            {
              name: 'My Wallet',
              href: '/finance/wallet',
              icon: Wallet,
              requiresFeature: 'financialManagement',
              lockedFeature: 'transactionManagements'
            }
          ]
        },
        { 
          name: 'Messaging', 
          icon: MessageSquare,
          requiresFeature: 'smsCommunications',
          children: [
            {
              name: 'Analytics',
              href: '/messaging/analytics',
              icon: BarChart3,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsAnalytics'
            },
            {
              name: 'Send SMS',
              href: '/messaging/send',
              icon: Mail,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsSend'
            },
            {
              name: 'History',
              href: '/messaging/history',
              icon: History,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsHistory'
            },
            {
              name: 'Templates',
              href: '/messaging/templates',
              icon: FileText,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsTemplates'
            },
            {
              name: 'Credits',
              href: '/messaging/credits',
              icon: CreditCard,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsCredits'
            },
            {
              name: 'Sender ID',
              href: '/messaging/sender-id',
              icon: Send,
              requiresFeature: 'smsCommunications',
              lockedFeature: 'smsSenderID'
            }
          ]
        },
      ];
    }

    return filterNavigation(allNavigation);
  }, [user?.role?.slug, hasFeature]);

  //  Initialize expanded menus based on current route
  const getInitialExpandedMenus = (): string[] => {
    const expanded: string[] = [];
    navigation.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          child => child.href && location.pathname.startsWith(child.href)
        );
        if (hasActiveChild) {
          expanded.push(item.name);
        }
      }
    });
    return expanded;
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(getInitialExpandedMenus);

  // ✅ FIXED: Auto-expand menu without flickering
  useEffect(() => {
    const menusToExpand = navigation
      .filter(item => item.children && isParentActive(item))
      .map(item => item.name)
      .filter(name => !expandedMenus.includes(name));

    if (menusToExpand.length > 0) {
      setExpandedMenus(prev => Array.from(new Set([...prev, ...menusToExpand])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const isParentActive = (item: NavigationItem) => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some(child => child.href && isActive(child.href));
    }
    return false;
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.name);
    const parentActive = isParentActive(item);

    if (hasChildren) {
      return (
        <div key={item.name}>
          {/* Parent Menu Item */}
          <button
            onClick={() => toggleMenu(item.name)}
            className={`
              w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg
              transition-all duration-200
              ${parentActive
                ? 'bg-primary-600/10 text-primary-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Submenu Items */}
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-700 pl-4">
              {item.children?.map(child => {
                const ChildIcon = child.icon;
                const childActive = child.href && isActive(child.href);
                const isLocked = child.lockedFeature && !hasFeature(child.lockedFeature as any);

                if (isLocked) {
                  return (
                    <div
                      key={child.name}
                      className="group relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg opacity-50 text-gray-500 cursor-not-allowed hover:opacity-60 transition-opacity"
                    >
                      <div className="flex items-center">
                        <ChildIcon className="w-4 h-4 mr-3" />
                        {child.name}
                      </div>
                      <div className="relative flex items-center">
                        <Lock className="w-4 h-4 text-yellow-400 group-hover:scale-125 transition-transform cursor-help" />
                        
                        <div className="absolute right-0 bottom-full mb-3 hidden group-hover:block">
                          {/* Tooltip Container */}
                          <div className="bg-white rounded-lg px-2 py-1 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-xs bg-white text-black">
                              Upgrade to unlock
                            </div>
                          </div>
                          
                          {/* Arrow Pointer */}
                          <div className="absolute right-3 top-full w-2 h-2 bg-white transform rotate-45 -mt-1 border-r border-b border-gray-200"></div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={child.name}
                    to={child.href || '#'}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-lg
                      transition-all duration-200
                      ${childActive
                        ? 'bg-primary-600 text-white shadow-primary-600/50'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <ChildIcon className="w-4 h-4 mr-3" />
                    {child.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Single Menu Item (no children)
    return (
      <Link
        key={item.name}
        to={item.href || '#'}
        onClick={() => setSidebarOpen(false)}
        className={`
          flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
          transition-all duration-200
          ${isActive(item.href || '')
            ? 'bg-primary-600 text-white shadow-primary-600/50'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }
        `}
      >
        <Icon className="w-5 h-5 mr-3" />
        {item.name}
      </Link>
    );
  };

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
              <p className="text-gray-400 text-xs capitalize">
                {user?.role?.name || 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - ✅ With dropdown support */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {navigation.map(item => renderNavigationItem(item))}
        </nav>

        {/* Bottom Links - Fixed at bottom */}
        <div className="p-3 border-t border-gray-800 dark:border-gray-900 space-y-1 flex-shrink-0">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`
              flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
              transition-all duration-200
              ${isActive('/settings')
                ? 'bg-primary-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
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
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header - White with search & user */}
        <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
          <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Left: Mobile menu + Search + Church Selector */}
            <div className="flex items-center flex-1 space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Church Selector for Super Admin */}
              {user?.role?.slug === 'super_admin' && (
                <ChurchSelector
                  selectedChurchId={selectedMerchantId || undefined}
                  onSelectChurch={handleSelectChurch}
                  variant="dropdown"
                  className="hidden sm:block"
                />
              )}

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

        {/* Page Content */}
        <main className="flex-1 bg-gray-100 min-h-screen dark:bg-gray-900 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full mx-auto">
            {/* ✅ SUBSCRIPTION ALERT - Shows at top of page */}
            {alertStatus && showAlert && (
              <SubscriptionAlert
                status={alertStatus}
                planName={planName}
                expiryDate={expiryDate}
                daysUntilRenewal={daysUntilRenewal}
                onDismiss={() => setShowAlert(false)}
              />
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MerchantLayout;