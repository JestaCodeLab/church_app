import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  Settings, 
  HelpCircle,
  LogOut,
  CreditCard,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserMenuProps {
  showEmail?: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ showEmail = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
    {
      icon: HelpCircle,
      label: 'Get help',
      onClick: () => {
        navigate('/');
        setIsOpen(false);
      },
    },
    {
      divider: true,
    },
    {
      icon: CreditCard,
      label: 'Upgrade plan',
      onClick: () => {
        navigate('/settings?tab=billing');
        setIsOpen(false);
      },
    },
    {
      divider: true,
    },
    {
      icon: LogOut,
      label: 'Log out',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <img
          src={user?.photo || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=4F46E5&color=fff`}
          alt="User"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
        />
        {showEmail && (
          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
              {user?.email}
            </p>
          </div>
        )}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          {/* Menu Items */}
          <div className="py-1">
            {menuItems.map((item, index) => {
              // Divider
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-2 border-t border-gray-200 dark:border-gray-700"
                  />
                );
              }

              // Regular Menu Item
              const Icon = item.icon!;

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    item.danger
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
