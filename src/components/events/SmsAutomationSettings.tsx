import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Users, Filter, Clock, ChevronDown, X, Check } from 'lucide-react';
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
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">SMS Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically send reminders to members
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {value.enabled && (
        <>
          {/* Notifications List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-white">Scheduled Notifications</h4>
              <button
                type="button"
                onClick={addNotification}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Notification</span>
              </button>
            </div>

            {value.notifications.length === 0 && (
              <p className="text-sm bg-gray-100 p-3 text-gray-500 dark:text-gray-400 text-center py-4">
                No notifications configured. Click "Add Notification" to create one.
              </p>
            )}

            {value.notifications.map((notification, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                {/* Notification Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setExpandedNotification(expandedNotification === index ? null : index)}
                    className="flex-1 text-left font-medium text-gray-900 dark:text-white"
                  >
                    Send {notification.timeValue} {notification.timeUnit} before event
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNotification(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedNotification === index && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Timing */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Time Value
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={notification.timeValue}
                          onChange={(e) => updateNotification(index, { timeValue: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Time Unit
                        </label>
                        <select
                          value={notification.timeUnit}
                          onChange={(e) => updateNotification(index, { timeUnit: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Send Time
                        </label>
                        <input
                          type="time"
                          value={notification.sendTime || '09:00'}
                          onChange={(e) => updateNotification(index, { sendTime: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message Template
                      </label>
                      <select
                        value={notification.templateId || ''}
                        onChange={(e) => updateNotification(index, {
                          templateId: e.target.value || undefined,
                          customMessage: e.target.value ? undefined : notification.customMessage
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white mb-2"
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
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      )}
                    </div>

                    {/* Recipient Filters */}
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                      <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Who Should Receive This?
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* All Members Option */}
                        <label className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          notification.recipientFilter.type === 'all_members'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}>
                          <input
                            type="radio"
                            checked={notification.recipientFilter.type === 'all_members'}
                            onChange={() => updateNotification(index, {
                              recipientFilter: { type: 'all_members' }
                            })}
                            className="mt-1 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              All Members
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Send to everyone in your church database
                            </div>
                          </div>
                          <Users className="w-5 h-5 text-gray-400" />
                        </label>

                        {/* Filtered Option */}
                        <div className={`rounded-lg border-2 transition-all ${
                          notification.recipientFilter.type === 'filtered'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600'
                        }`}>
                          <label className="flex items-start space-x-3 p-3 cursor-pointer">
                            <input
                              type="radio"
                              checked={notification.recipientFilter.type === 'filtered'}
                              onChange={() => updateNotification(index, {
                                recipientFilter: { ...notification.recipientFilter, type: 'filtered' }
                              })}
                              className="mt-1 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                Specific Groups
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Target specific departments, branches, or demographics
                              </div>
                            </div>
                            <Filter className="w-5 h-5 text-gray-400" />
                          </label>

                          {notification.recipientFilter.type === 'filtered' && (
                            <div className="px-3 pb-3 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                              {/* Departments */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Departments
                                </label>
                                {departments.length > 0 ? (
                                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                                    {departments.map(dept => {
                                      const isSelected = (notification.recipientFilter.departments || []).includes(dept._id);
                                      return (
                                        <label
                                          key={dept._id}
                                          className={`flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors ${
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
                                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                            {dept.name}
                                          </span>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-blue-600" />
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    No departments available
                                  </div>
                                )}
                                {notification.recipientFilter.departments && notification.recipientFilter.departments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {notification.recipientFilter.departments.map(deptId => {
                                      const dept = departments.find(d => d._id === deptId);
                                      return dept ? (
                                        <span key={deptId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
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
                                            className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Branches
                                </label>
                                {branches.length > 0 ? (
                                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                                    {branches.map(branch => {
                                      const isSelected = (notification.recipientFilter.branches || []).includes(branch._id);
                                      return (
                                        <label
                                          key={branch._id}
                                          className={`flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors ${
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
                                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                            {branch.name}
                                          </span>
                                          {isSelected && (
                                            <Check className="w-4 h-4 text-green-600" />
                                          )}
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    No branches available
                                  </div>
                                )}
                                {notification.recipientFilter.branches && notification.recipientFilter.branches.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {notification.recipientFilter.branches.map(branchId => {
                                      const branch = branches.find(b => b._id === branchId);
                                      return branch ? (
                                        <span key={branchId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
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
                                            className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Gender */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Gender
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => updateNotification(index, {
                                      recipientFilter: {
                                        ...notification.recipientFilter,
                                        gender: undefined
                                      }
                                    })}
                                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                      !notification.recipientFilter.gender
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    Any
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateNotification(index, {
                                      recipientFilter: {
                                        ...notification.recipientFilter,
                                        gender: 'male'
                                      }
                                    })}
                                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                      notification.recipientFilter.gender === 'male'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    Male
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateNotification(index, {
                                      recipientFilter: {
                                        ...notification.recipientFilter,
                                        gender: 'female'
                                      }
                                    })}
                                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                      notification.recipientFilter.gender === 'female'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    Female
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* External Recipients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">External Recipients</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add non-member phone numbers</p>
              </div>
              <button
                type="button"
                onClick={addExternalRecipient}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recipient</span>
              </button>
            </div>

            {value.externalRecipients.map((recipient, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={recipient.name}
                  onChange={(e) => updateExternalRecipient(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="tel"
                  value={recipient.phone}
                  onChange={(e) => updateExternalRecipient(index, 'phone', e.target.value)}
                  placeholder="Phone"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => removeExternalRecipient(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SmsAutomationSettings;
