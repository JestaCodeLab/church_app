import React, { useState } from 'react';
import { User, CreditCard, Lock, Settings as SettingsIcon, Users2, Palette, MessageSquare } from 'lucide-react';
import ProfileSettings from '../../components/settings/ProfileSettings';
import BillingSettings from '../../components/settings/BillingSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';
import PreferencesSettings from '../../components/settings/PreferencesSettings';
import AppearanceSettings from '../../components/settings/AppearanceSettings';
import TeamManagement from '../../components/settings/TeamManagement';
import { usePermission } from '../../hooks/usePermission';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  // check the URL for a tab query parameter to set the active tab
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);


  const tabs = [
    { 
      id: 'profile', 
      label: 'Account', 
      icon: User, 
      component: <ProfileSettings />, 
      description: 'Manage your profile and personal information.',
      permission: 'settings.manageAccount' // All users can access their own profile
    },
    { 
      id: 'appearance', 
      label: 'Appearance', 
      icon: Palette, 
      component: <AppearanceSettings />, 
      description: 'Customize your church branding, logo, and colors.',
      permission: 'settings.manageAppearance'
    },  
    { 
      id: 'team', 
      label: 'Team Management', 
      icon: Users2, 
      component: <TeamManagement />, 
      description: 'Manage your team members and their roles.',
      permission: 'settings.manageTeamMembers' // or 'settings.manageTeamMembers'
    },
    { 
      id: 'preferences', 
      label: 'Preferences', 
      icon: SettingsIcon, 
      component: <PreferencesSettings />, 
      description: 'Customize your application experience and notification settings.',
      permission: 'settings.managePreferences'
    },
    { 
      id: 'billing', 
      label: 'Billing & Subscription', 
      icon: CreditCard, 
      component: <BillingSettings />, 
      description: 'View your current plan, upgrade, and manage billing.',
      permission: 'settings.manageBilling'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: Lock, 
      component: <SecuritySettings />, 
      description: 'Change your password and manage account security.',
      permission: 'settings.manageSecurity'
    },
    // { id: 'reports', label: 'Reports & Analytics', icon: BarChart2, component: <div>Reports & Analytics Coming Soon</div>, description: 'View and export your data.' },
  ];

  // Check permissions for each tab at the component level
  const accountPermission = usePermission('settings.manageAccount');
  const appearancePermission = usePermission('settings.manageAppearance');
  const teamPermission = usePermission('settings.manageTeamMembers');
  const preferencesPermission = usePermission('settings.managePreferences');
  const billingPermission = usePermission('settings.manageBilling');
  const securityPermission = usePermission('settings.manageSecurity');

  // Map permissions to tabs
  const tabPermissions: Record<string, boolean> = {
    profile: accountPermission.hasPermission || accountPermission.isSuperAdmin,
    appearance: appearancePermission.hasPermission || appearancePermission.isSuperAdmin,
    team: teamPermission.hasPermission || teamPermission.isSuperAdmin,
    preferences: preferencesPermission.hasPermission || preferencesPermission.isSuperAdmin,
    billing: billingPermission.hasPermission || billingPermission.isSuperAdmin,
    security: securityPermission.hasPermission || securityPermission.isSuperAdmin,
  };

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => {
    // If no permission specified, show the tab
    if (!tab.permission) return true;
    
    // Check if user has the required permission
    return tabPermissions[tab.id];
  });

  const activeTabDetails = visibleTabs.find(tab => tab.id === activeTab);

  // If active tab is not visible, default to first visible tab
  React.useEffect(() => {
    if (!activeTabDetails && visibleTabs.length > 0) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTabDetails, visibleTabs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Horizontal Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {visibleTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <main className="mt-8">
          {activeTabDetails && (
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {activeTabDetails.label}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 mb-6">
                  {activeTabDetails.description}
                </p>
                {activeTabDetails.component}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
