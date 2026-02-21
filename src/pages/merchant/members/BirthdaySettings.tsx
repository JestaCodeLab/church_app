import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Bell, 
  MessageSquare, 
  Clock,
  Send,
  Loader,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { messagingAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import FeatureGate from '../../../components/access/FeatureGate';
import { PermissionRoute } from '../../../components/guards/PermissionRoute';

interface AutomationSettings {
  enabled: boolean;
  sendDaysBefore: number;
  sendTime: string;
  customMessage: string;
  useTemplate: boolean;
  templateId?: string;
  sendToGroups: string[];
}

interface Template {
  _id: string;
  name: string;
  message: string;
  category: string;
}

const BirthdaySettings: React.FC = () => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  const [settings, setSettings] = useState<AutomationSettings>({
    enabled: false,
    sendDaysBefore: 0,
    sendTime: '09:00',
    customMessage: 'Happy Birthday {{firstName}}! 🎉 Wishing you a blessed year ahead filled with joy and God\'s favor. May all your dreams come true! 🎂',
    useTemplate: false,
    sendToGroups: ['all']
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsAutomation', {showErrorToast: false});
      if(hasAccess) {
        setHasAccess(true);
        fetchSettings();
        fetchTemplates();
      }else {
        setHasAccess(false);
        setLoading(false);
      }
  }

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/birthdays/automation/settings');
      if (response.data.data) {
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await messagingAPI.templates.getAll();
      setTemplates(response.data.data.templates || []);
    } catch (error) {
      console.error('Failed to load templates');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      await api.put('/birthdays/automation/settings', settings);
      
      showToast.success('Birthday automation settings saved successfully!');
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestMessage = async () => {
    try {
      setTestingSMS(true);
      
      await api.post('/birthdays/test-message', {
        message: settings.customMessage
      });
      
      showToast.success('Test message sent to your phone!');
      
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to send test message');
    } finally {
      setTestingSMS(false);
    }
  };

  const previewMessage = settings.customMessage
    .replace(/{{firstName}}/g, 'John')
    .replace(/{{lastName}}/g, 'Doe')
    .replace(/{{age}}/g, '25')
    .replace(/{{churchName}}/g, 'Your Church');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <FeatureGate feature={"smsAutomation"} showUpgrade={!hasAccess}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/members/birthdays')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Birthday Automation Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure automatic birthday messages for your members
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {/* Enable/Disable Automation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Enable Birthday Automation
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Automatically send birthday messages to members on their special day
                  </p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {settings.enabled && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Automation Active
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Birthday messages will be sent automatically based on your configuration below.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timing Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Timing Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Send Days Before */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Message
                </label>
                <select
                  value={settings.sendDaysBefore}
                  onChange={(e) => setSettings({ ...settings, sendDaysBefore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>On their birthday</option>
                  <option value={1}>1 day before</option>
                  <option value={2}>2 days before</option>
                  <option value={3}>3 days before</option>
                  <option value={7}>1 week before</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  When should the birthday message be sent?
                </p>
              </div>

              {/* Send Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send Time
                </label>
                <input
                  type="time"
                  value={settings.sendTime}
                  onChange={(e) => setSettings({ ...settings, sendTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  What time should messages be sent?
                </p>
              </div>
            </div>
          </div>

          {/* Message Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Configuration
              </h3>
            </div>

            {/* Use Template Toggle */}
            <div className="mb-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useTemplate}
                  onChange={(e) => setSettings({ ...settings, useTemplate: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Use SMS Template
                </span>
              </label>
            </div>

            {settings.useTemplate ? (
              /* Template Selector */
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Template
                </label>
                <select
                  value={settings.templateId}
                  onChange={(e) => setSettings({ ...settings, templateId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                    No birthday templates available. Create one in SMS Templates.
                  </p>
                )}
              </div>
            ) : (
              /* Custom Message */
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Birthday Message
                </label>
                <textarea
                  value={settings.customMessage}
                  onChange={(e) => setSettings({ ...settings, customMessage: e.target.value })}
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter your birthday message..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {settings.customMessage.length}/500 characters
                  </p>
                </div>

                {/* Available Variables */}
                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                  <p className="text-sm font-medium text-primary-900 dark:text-primary-100 mb-2">
                    Available Variables:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-primary-700 dark:text-blue-300">
                    <code className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">{'{{firstName}}'}</code>
                    <code className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">{'{{lastName}}'}</code>
                    <code className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">{'{{age}}'}</code>
                    <code className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded">{'{{churchName}}'}</code>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Preview
              </h3>
              <button
                onClick={handleTestMessage}
                disabled={testingSMS}
                className="flex items-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50"
              >
                {testingSMS ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {previewMessage}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This is how your message will look when sent to John Doe turning 25
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  How Birthday Automation Works:
                </p>
                <ul className="text-sm text-primary-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>System checks for birthdays daily at the configured time</li>
                  <li>Messages are sent automatically based on your settings</li>
                  <li>Only members with valid phone numbers will receive messages</li>
                  <li>SMS credits will be deducted for each message sent</li>
                  <li>You can still manually send birthday messages from the Birthdays page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Save Button (Bottom) */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => navigate('/members/birthdays')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
    </FeatureGate>
  );
};

export default BirthdaySettings;