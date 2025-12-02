import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

const PreferencesSettings = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any>({
    email: { enabled: true, newMember: true, eventReminders: true, donations: true, systemUpdates: true, weeklyDigest: false },
    inApp: { enabled: true, newMember: true, eventReminders: true, donations: true, mentions: true },
    push: { enabled: false },
    sms: { enabled: false, eventReminders: false, emergencyAlerts: true },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      if (response.data.data.settings?.preferences) {
        setLanguage(response.data.data.settings.preferences.language);
        setTheme(response.data.data.settings.preferences.theme);
      }
      if (response.data.data.settings?.notifications) {
        setNotifications(response.data.data.settings.notifications);
      }
    } catch (error) {
      showToast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (category: string, key: string, value: boolean) => {
    const updatedNotifications = {
      ...notifications,
      [category]: {
        ...notifications[category],
        [key]: value,
      },
    };
    setNotifications(updatedNotifications);

    try {
      await settingsAPI.updateNotifications(category, { [key]: value });
      showToast.success('Notification settings updated!');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || `Failed to update ${category} notifications`);
      // Revert if API call fails
      setNotifications(notifications);
    }
  };

  const languages = [
    { value: 'en', label: 'English (US)' },
    { value: 'fr', label: 'Français (France)' },
  ];

  if (loading) {
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Preferences
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Customize your application experience. Select your preferred language, theme, and notification settings.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* General Settings */}
        <div className="space-y-6">
          <h3 className="text-lg mb-1 font-semibold text-gray-900 dark:text-gray-100">General</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Set your language and theme preferences.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'fr')}
                  className="block w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pr-10 appearance-none text-gray-900 dark:text-gray-100"
                >
                  {languages.map((langOpt) => (
                    <option key={langOpt.value} value={langOpt.value}>
                      {langOpt.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <div className="flex bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'light' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Sun className="w-5 h-5 mr-2" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'dark' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Moon className="w-5 h-5 mr-2" /> Dark
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    theme === 'system' ? 'bg-white dark:bg-gray-800 shadow text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Monitor className="w-5 h-5 mr-2" /> System
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage how you receive notifications.</p>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates and alerts directly to your inbox.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.email.enabled}
                onChange={(e) => handleNotificationChange('email', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* In-app Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">In-app Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get notified within the application interface.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.inApp.enabled}
                onChange={(e) => handleNotificationChange('inApp', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications on your desktop or mobile device.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.push.enabled}
                onChange={(e) => handleNotificationChange('push', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesSettings;
