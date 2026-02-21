import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Clock, MessageSquare, Mail, Phone, Save, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import api  from '../../services/api';
import { showToast } from '../../utils/toasts';

const RegistrationSettingsPanel = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    isEnabled: true,
    status: 'active',
    startDate: '',
    endDate: '',
    autoExpire: true,
    customMessage: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [statistics, setStatistics] = useState({
    totalRegistrations: 0,
    currentWindowRegistrations: 0,
    lastActivated: null
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Use the api instance which already has interceptors
      const response = await api.get('/merchants/registration-settings');

      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          isEnabled: data.settings.isEnabled,
          status: data.settings.status,
          startDate: data.settings.startDate ? new Date(data.settings.startDate).toISOString().split('T')[0] : '',
          endDate: data.settings.endDate ? new Date(data.settings.endDate).toISOString().split('T')[0] : '',
          autoExpire: data.settings.autoExpire,
          customMessage: data.settings.customMessage || '',
          contactEmail: data.settings.contactEmail || '',
          contactPhone: data.settings.contactPhone || ''
        });
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast.error(error.response?.data?.message || 'Failed to load registration settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate dates
      if (settings.startDate && settings.endDate) {
        if (new Date(settings.endDate) <= new Date(settings.startDate)) {
          showToast.error('End date must be after start date');
          return;
        }
      }

      const payload = {
        isEnabled: settings.isEnabled,
        status: settings.status,
        startDate: settings.startDate || null,
        endDate: settings.endDate || null,
        autoExpire: settings.autoExpire,
        customMessage: settings.customMessage,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone
      };

      const response = await api.patch('/merchants/registration-settings', payload);

      if (response.data.success) {
        showToast.success('Settings updated successfully!');
        fetchSettings(); // Refresh settings
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async () => {
    try {
      const newStatus = settings.status === 'active' ? 'paused' : 'active';

      const response = await api.post('/merchants/registration/toggle', { status: newStatus });

      if (response.data.success) {
        setSettings(prev => ({ ...prev, status: newStatus }));
        showToast.success(`Registration ${newStatus === 'active' ? 'activated' : 'paused'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling registration:', error);
      showToast.error(error.response?.data?.message || 'Failed to toggle registration');
    }
  };

  const handleExtend = async (days) => {
    try {
      const response = await api.post('/merchants/registration/extend', { days });

      if (response.data.success) {
        showToast.success(`Registration extended by ${days} days!`);
        fetchSettings();
      }
    } catch (error) {
      console.error('Error extending registration:', error);
      showToast.error(error.response?.data?.message || 'Failed to extend registration');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center space-x-3">
            <Settings className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Public Registration Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">Total Registrations</p>
                <p className="text-2xl font-bold text-primary-700 dark:text-blue-300 mt-1">
                  {statistics.totalRegistrations}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Current Window</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {statistics.currentWindowRegistrations}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">Status</p>
                <p className="text-xl font-bold text-primary-700 dark:text-primary-300 mt-1 capitalize">
                  {settings.status}
                </p>
              </div>
            </div>

            {/* Quick Toggle */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Quick Toggle</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {settings.status === 'active' 
                      ? 'Registration is currently accepting submissions' 
                      : 'Registration is currently paused'}
                  </p>
                </div>
                <button
                  onClick={handleQuickToggle}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.status === 'active'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  {settings.status === 'active' ? (
                    <>
                      <ToggleRight className="h-5 w-5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-5 w-5" />
                      <span>Paused</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Registration Status
              </label>
              <select
                name="status"
                value={settings.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="active">Active - Accepting registrations</option>
                <option value="paused">Paused - Temporarily disabled</option>
                <option value="scheduled">Scheduled - Opens on start date</option>
                <option value="expired">Expired - Registration closed</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={settings.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty for immediate start
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={settings.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty for no expiration
                </p>
              </div>
            </div>

            {/* Quick Extend Buttons */}
            {settings.endDate && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Quick Extend
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleExtend(7)}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    7 Days
                  </button>
                  <button
                    onClick={() => handleExtend(14)}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    14 Days
                  </button>
                  <button
                    onClick={() => handleExtend(30)}
                    className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-3 w-3 inline mr-1" />
                    30 Days
                  </button>
                </div>
              </div>
            )}

            {/* Auto-Expire Toggle */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Auto-Expire</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatically expire when end date is reached
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="autoExpire"
                  checked={settings.autoExpire}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Custom Message (When Inactive)
              </label>
              <textarea
                name="customMessage"
                value={settings.customMessage}
                onChange={handleInputChange}
                rows={3}
                maxLength={500}
                placeholder="Message to show when registration is inactive..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings.customMessage.length}/500 characters
              </p>
            </div>

            {/* Contact Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  placeholder="admin@church.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationSettingsPanel;