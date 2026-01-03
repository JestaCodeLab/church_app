import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Users, Clock, ChevronDown, X, Check, Bell } from 'lucide-react';
import {  departmentAPI, messagingAPI, branchAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';

interface SmsNotification {
  timeValue: number;
  timeUnit: 'hours' | 'days' | 'weeks';
  sendTime?: string; // HH:mm format
  templateId?: string;
  customMessage?: string;
  recipientFilter: {
    type: 'all_members' | 'filtered';
    departments?: string[];
    branches?: string[];
    gender?: 'male' | 'female';
    ageRange?: {
      min?: number;
      max?: number;
    };
    membershipTypes?: string[];
  };
}

interface ExternalRecipient {
  name: string;
  phone: string;
}

interface SmsAutomationData {
  enabled: boolean;
  notifications: SmsNotification[];
  externalRecipients: ExternalRecipient[];
}

interface Props {
  value: SmsAutomationData;
  onChange: (value: SmsAutomationData) => void;
}

const SmsAutomationSettings: React.FC<Props> = ({ value, onChange }) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null);

  useEffect(() => {
    loadTemplates();
    loadDepartments();
    loadBranches();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await messagingAPI.templates.getAll();
      setTemplates(response.data.data?.templates || []);
    } catch (error) {
      console.error('Failed to load SMS templates:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentAPI.getDepartments();
      setDepartments(response.data.data?.departments || []);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await branchAPI.getBranches({ limit: 100, status: 'active' });
      setBranches(response.data.data?.branches || []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const addNotification = () => {
    const newNotification: SmsNotification = {
      timeValue: 1,
      timeUnit: 'days',
      sendTime: '09:00',
      customMessage: '',
      recipientFilter: {
        type: 'all_members'
      }
    };

    onChange({
      ...value,
      notifications: [...value.notifications, newNotification]
    });
    setExpandedNotification(value.notifications.length);
  };

  const removeNotification = (index: number) => {
    onChange({
      ...value,
      notifications: value.notifications.filter((_, i) => i !== index)
    });
  };

  const updateNotification = (index: number, updates: Partial<SmsNotification>) => {
    const updated = [...value.notifications];
    updated[index] = { ...updated[index], ...updates };
    onChange({ ...value, notifications: updated });
  };

  const addExternalRecipient = () => {
    onChange({
      ...value,
      externalRecipients: [...value.externalRecipients, { name: '', phone: '' }]
    });
  };

  const removeExternalRecipient = (index: number) => {
    onChange({
      ...value,
      externalRecipients: value.externalRecipients.filter((_, i) => i !== index)
    });
  };

  const updateExternalRecipient = (index: number, field: 'name' | 'phone', newValue: string) => {
    const updated = [...value.externalRecipients];
    updated[index][field] = newValue;
    onChange({ ...value, externalRecipients: updated });
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700/50">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-blue-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">SMS Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Automatically send reminders and notifications to event attendees
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-12 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {value.enabled && (
        <>
          {/* Scheduled Notifications Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">Scheduled Notifications</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Set up automated messages before your event</p>
                </div>
              </div>
              <button
                type="button"
                onClick={addNotification}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Notification</span>
              </button>
            </div>

            {value.notifications.length === 0 ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700/50 rounded-xl p-8 text-center">
                <Bell className="w-12 h-12 text-blue-300 dark:text-blue-700 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No notifications configured yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Click "Add Notification" to create your first automated reminder</p>
              </div>
            ) : (
              <div className="space-y-3">
                {value.notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Notification Card Header */}
                    <button
                      type="button"
                      onClick={() => setExpandedNotification(expandedNotification === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1 text-left">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Send {notification.timeValue} {notification.timeUnit === 'hours' ? 'hour' : notification.timeUnit === 'days' ? 'day' : 'week'}{notification.timeValue !== 1 ? 's' : ''} before
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            At <span className="font-medium">{notification.sendTime}</span> • 
                            {notification.recipientFilter.type === 'all_members' 
                              ? ' All members' 
                              : ` ${(notification.recipientFilter.departments?.length || 0) + (notification.recipientFilter.branches?.length || 0)} filter(s)`}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedNotification === index ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {/* Notification Expanded Content */}
                    {expandedNotification === index && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-4 space-y-5">
                        {/* Timing Configuration */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>Timing</span>
                          </h5>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Value
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={notification.timeValue}
                                onChange={(e) => updateNotification(index, { timeValue: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Unit
                              </label>
                              <select
                                value={notification.timeUnit}
                                onChange={(e) => updateNotification(index, { timeUnit: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                                <option value="weeks">Weeks</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Send Time
                              </label>
                              <input
                                type="time"
                                value={notification.sendTime || '09:00'}
                                onChange={(e) => updateNotification(index, { sendTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Message Configuration */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                            <span>Message</span>
                          </h5>
                          <select
                            value={notification.templateId || ''}
                            onChange={(e) => updateNotification(index, {
                              templateId: e.target.value || undefined,
                              customMessage: e.target.value ? undefined : notification.customMessage
                            })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Custom Message</option>
                            {templates.map(t => (
                              <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                          </select>

                          {!notification.templateId && (
                            <textarea
                              value={notification.customMessage || ''}
                              onChange={(e) => updateNotification(index, { customMessage: e.target.value })}
                              placeholder="Enter custom message. Use {{eventName}}, {{eventDate}}, {{eventTime}}, {{donationLink}}..."
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                          )}
                        </div>

                        {/* Recipient Filters */}
                        <div>
                          <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Recipients</span>
                          </h5>
                          
                          <div className="space-y-3">
                            {/* All Members Option */}
                            <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              notification.recipientFilter.type === 'all_members'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}>
                              <input
                                type="radio"
                                checked={notification.recipientFilter.type === 'all_members'}
                                onChange={() => updateNotification(index, {
                                  recipientFilter: { type: 'all_members' }
                                })}
                                className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  All Members
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  Send to everyone in your member database
                                </div>
                              </div>
                            </label>

                            {/* Filtered Option */}
                            <div className={`rounded-lg border-2 transition-all ${
                              notification.recipientFilter.type === 'filtered'
                                ? 'border-blue-500'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              <label className="flex items-start space-x-3 p-3 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={notification.recipientFilter.type === 'filtered'}
                                  onChange={() => updateNotification(index, {
                                    recipientFilter: { ...notification.recipientFilter, type: 'filtered' }
                                  })}
                                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    Specific Groups
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Target specific departments or branches
                                  </div>
                                </div>
                              </label>

                              {notification.recipientFilter.type === 'filtered' && (
                                <div className="px-3 pb-4 space-y-4 border-t border-gray-300 dark:border-gray-600 pt-4 mt-2">
                                  {/* Departments */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                      Departments
                                    </label>
                                    {departments.length > 0 ? (
                                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                                        {departments.map(dept => {
                                          const isSelected = (notification.recipientFilter.departments || []).includes(dept._id);
                                          return (
                                            <label
                                              key={dept._id}
                                              className={`flex items-center space-x-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors text-sm ${
                                                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const currentDepts = notification.recipientFilter.departments || [];
                                                  const newDepts = e.target.checked
                                                    ? [...currentDepts, dept._id]
                                                    : currentDepts.filter(id => id !== dept._id);
                                                  updateNotification(index, {
                                                    recipientFilter: {
                                                      ...notification.recipientFilter,
                                                      departments: newDepts
                                                    }
                                                  });
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                              />
                                              <span className="flex-1 text-gray-700 dark:text-gray-300">
                                                {dept.name}
                                              </span>
                                              {isSelected && (
                                                <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                              )}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        No departments available
                                      </div>
                                    )}
                                    {notification.recipientFilter.departments && notification.recipientFilter.departments.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {notification.recipientFilter.departments.map(deptId => {
                                          const dept = departments.find(d => d._id === deptId);
                                          return dept ? (
                                            <span key={deptId} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                              {dept.name}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newDepts = (notification.recipientFilter.departments || []).filter(id => id !== deptId);
                                                  updateNotification(index, {
                                                    recipientFilter: {
                                                      ...notification.recipientFilter,
                                                      departments: newDepts
                                                    }
                                                  });
                                                }}
                                                className="hover:opacity-70 transition-opacity"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </span>
                                          ) : null;
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Branches */}
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                      Branches
                                    </label>
                                    {branches.length > 0 ? (
                                      <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                                        {branches.map(branch => {
                                          const isSelected = (notification.recipientFilter.branches || []).includes(branch._id);
                                          return (
                                            <label
                                              key={branch._id}
                                              className={`flex items-center space-x-3 px-3 py-2.5 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors text-sm ${
                                                isSelected ? 'bg-green-50 dark:bg-green-900/20' : ''
                                              }`}
                                            >
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                  const currentBranches = notification.recipientFilter.branches || [];
                                                  const newBranches = e.target.checked
                                                    ? [...currentBranches, branch._id]
                                                    : currentBranches.filter(id => id !== branch._id);
                                                  updateNotification(index, {
                                                    recipientFilter: {
                                                      ...notification.recipientFilter,
                                                      branches: newBranches
                                                    }
                                                  });
                                                }}
                                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                              />
                                              <span className="flex-1 text-gray-700 dark:text-gray-300">
                                                {branch.name}
                                              </span>
                                              {isSelected && (
                                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                              )}
                                            </label>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        No branches available
                                      </div>
                                    )}
                                    {notification.recipientFilter.branches && notification.recipientFilter.branches.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {notification.recipientFilter.branches.map(branchId => {
                                          const branch = branches.find(b => b._id === branchId);
                                          return branch ? (
                                            <span key={branchId} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                                              {branch.name}
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const newBranches = (notification.recipientFilter.branches || []).filter(id => id !== branchId);
                                                  updateNotification(index, {
                                                    recipientFilter: {
                                                      ...notification.recipientFilter,
                                                      branches: newBranches
                                                    }
                                                  });
                                                }}
                                                className="hover:opacity-70 transition-opacity"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </span>
                                          ) : null;
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeNotification(index)}
                          className="w-full py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Remove Notification
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Recipients Section */}
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-base flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span>External Recipients</span>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add non-member phone numbers to receive notifications</p>
              </div>
              <button
                type="button"
                onClick={addExternalRecipient}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>

            {value.externalRecipients.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center border border-dashed border-gray-300 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">No external recipients added yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {value.externalRecipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={recipient.name}
                      onChange={(e) => updateExternalRecipient(index, 'name', e.target.value)}
                      placeholder="Name"
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="tel"
                      value={recipient.phone}
                      onChange={(e) => updateExternalRecipient(index, 'phone', e.target.value)}
                      placeholder="+233201234567"
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeExternalRecipient(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SmsAutomationSettings;
