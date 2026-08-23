import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Send, Calendar, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { checkAllPermissions } from '../../utils/permissionUtils';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { hasFeature } = useFeatureFlag();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const items = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: checkAllPermissions(user, ['dashboard.view']),
    },
    {
      name: 'Members',
      href: '/members/all',
      icon: Users,
      show: hasFeature('memberManagement') && checkAllPermissions(user, ['members.view', 'members.viewMembers']),
    },
    {
      name: 'Services',
      href: '/services',
      icon: Calendar,
      show: hasFeature('eventServices') && checkAllPermissions(user, ['events.view', 'events.viewServices']),
    },
    {
      name: 'Send SMS',
      href: '/messaging/send',
      icon: Send,
      show:
        hasFeature('smsCommunications') &&
        hasFeature('smsSend') &&
        checkAllPermissions(user, ['communications.view', 'communications.sendSMS']),
    },
  ].filter(item => item.show);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-stretch h-16"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(item => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium whitespace-nowrap transition-colors ${
              active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            {item.name}
          </Link>
        );
      })}
      <button
        onClick={onOpenMore}
        className="flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400"
      >
        <MoreHorizontal className="w-5 h-5" />
        More
      </button>
    </nav>
  );
};

export default MobileBottomNav;
