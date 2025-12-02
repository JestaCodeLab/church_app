import React, { useState } from 'react';
import { User, CreditCard, Lock, Settings as SettingsIcon, Users2, Puzzle, BarChart2 } from 'lucide-react';
import ProfileSettings from '../../components/settings/ProfileSettings';
import BillingSettings from '../../components/settings/BillingSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';
import PreferencesSettings from '../../components/settings/PreferencesSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Account', icon: User, component: <ProfileSettings />, description: 'Manage your profile and personal information.' },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon, component: <PreferencesSettings />, description: 'Customize your application experience and notification settings.' },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard, component: <BillingSettings />, description: 'View your current plan, upgrade, and manage billing.' },
    { id: 'security', label: 'Security', icon: Lock, component: <SecuritySettings />, description: 'Change your password and manage account security.' },
    // { id: 'integrations', label: 'Integrations', icon: Puzzle, component: <div>Integrations Coming Soon</div>, description: 'Connect with third-party applications.' },
    // { id: 'team', label: 'Team Management', icon: Users2, component: <div>Team Management Coming Soon</div>, description: 'Manage your team members and their roles.' },
    // { id: 'reports', label: 'Reports & Analytics', icon: BarChart2, component: <div>Reports & Analytics Coming Soon</div>, description: 'View and export your data.' },
  ];

  const activeTabDetails = tabs.find(tab => tab.id === activeTab);

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
            {tabs.map(tab => {
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
