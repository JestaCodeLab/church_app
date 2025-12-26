import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api, { branchAPI, departmentAPI, memberAPI, messagingAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import { Building, Globe, Landmark, NotepadText, Phone, Users } from 'lucide-react';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Department {
  _id: string;
  name: string;
  memberCount?: number;
}

interface Branch {
  _id: string;
  name: string;
  code: string;
}

interface Template {
  _id: string;
  name: string;
  message: string;
  category: string;
}

interface Credits {
  balance: number;
}

type SendType = 'single' | 'bulk' | 'members' | 'department' | 'branch' | 'all';

const SendSMS: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [sendType, setSendType] = useState<SendType>('single');
  const [phone, setPhone] = useState('');
  const [phones, setPhones] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sending, setSending] = useState(false);

  // Data state
  const [members, setMembers] = useState<Member[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [loading, setLoading] = useState(false);

  // Computed
  const characterCount = message.length;
  const hasUnicode = /[^\u0000-\u007F]/.test(message);
  const pageCount = calculatePageCount(message);
  const recipientCount = getRecipientCount();
  const creditsNeeded = pageCount * recipientCount;

  useEffect(() => {
    fetchData();
  }, []);

  function calculatePageCount(msg: string): number {
    if (!msg) return 0;
    const charCount = msg.length;
    const hasUnicode = /[^\u0000-\u007F]/.test(msg);

    if (hasUnicode) {
      if (charCount <= 70) return 1;
      return Math.ceil((charCount - 70) / 67) + 1;
    } else {
      if (charCount <= 160) return 1;
      return Math.ceil((charCount - 160) / 153) + 1;
    }
  }

  function getRecipientCount(): number {
    switch (sendType) {
      case 'single':
        return phone ? 1 : 0;
      case 'bulk':
        return phones.split('\n').filter(p => p.trim()).length;
      case 'members':
        return selectedMembers.length;
      case 'department':
        const dept = departments.find(d => d._id === selectedDepartment);
        return dept?.memberCount || 0;
      case 'branch':
        // Would need to fetch branch member count
        return 0;
      case 'all':
        return members.length;
      default:
        return 0;
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membersRes, deptsRes, branchesRes, templatesRes, creditsRes] = await Promise.all([
        memberAPI.getMembers({limit: 100}),
        departmentAPI.getDepartments(),
        branchAPI.getBranches({limit: 20}),
        messagingAPI.templates.getAll(),
        messagingAPI.credits.get()
      ]);

      setMembers(membersRes.data.data.members || []);
      setDepartments(deptsRes.data.data.departments || []);
      setBranches(branchesRes.data.data.branches || []);
      setTemplates(templatesRes.data.data.templates || []);
      setCredits(creditsRes.data.data.credits);
    } catch (error: any) {
      showToast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t._id === templateId);
    if (template) {
      setMessage(template.message);
      setCategory(template.category);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      showToast.error('Message is required');
      return;
    }

    // Check credits
    if (credits && creditsNeeded > credits.balance) {
      showToast.error(`Insufficient credits. You need ${creditsNeeded} but have ${credits.balance}`);
      return;
    }

    setSending(true);

    try {
      let response;

      switch (sendType) {
        case 'single':
          if (!phone) {
            showToast.error('Phone number is required');
            return;
          }
          response = await api.post('/sms/send', {
            phone,
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        case 'bulk':
          const phoneArray = phones.split('\n').filter(p => p.trim());
          if (phoneArray.length === 0) {
            showToast.error('At least one phone number is required');
            return;
          }
          response = await api.post('/sms/send-bulk', {
            phones: phoneArray,
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        case 'members':
          if (selectedMembers.length === 0) {
            showToast.error('Select at least one member');
            return;
          }
          response = await api.post('/sms/send-to-members', {
            memberIds: selectedMembers,
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        case 'department':
          if (!selectedDepartment) {
            showToast.error('Select a department');
            return;
          }
          response = await api.post('/sms/send-to-department', {
            departmentId: selectedDepartment,
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        case 'branch':
          if (!selectedBranch) {
            showToast.error('Select a branch');
            return;
          }
          response = await api.post('/sms/send-to-branch', {
            branchId: selectedBranch,
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        case 'all':
          const confirmed = window.confirm(
            `Are you sure you want to send SMS to all ${members.length} members? This will use ${creditsNeeded} credits.`
          );
          if (!confirmed) return;
          response = await api.post('/sms/send-to-all', {
            message,
            category,
            templateId: selectedTemplate || undefined
          });
          break;

        default:
          showToast.error('Invalid send type');
          return;
      }

      showToast.success(response.data.message);

      // Reset form
      setPhone('');
      setPhones('');
      setMessage('');
      setSelectedMembers([]);
      setSelectedDepartment('');
      setSelectedBranch('');
      setSelectedTemplate('');
      setCategory('general');

      // Refresh credits
      const creditsRes = await api.get('/sms/credits');
      setCredits(creditsRes.data.data.credits);

      // Navigate to history
      setTimeout(() => navigate('/sms/history'), 1500);

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to send SMS';
      showToast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Send SMS
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Compose and send SMS messages to your members
        </p>
      </div>

      {/* Credits Warning */}
      {credits && credits.balance < 50 && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ Low credits: You have {credits.balance} credits remaining.{' '}
            <button
              onClick={() => navigate('/messaging/credits')}
              className="underline font-medium hover:no-underline"
            >
              Buy more credits
            </button>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <form onSubmit={handleSendSMS} className="p-6 space-y-6">
              {/* Send Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Send To
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'single', label: 'Single Number', icon: Phone },
                    { value: 'bulk', label: 'Multiple Numbers', icon: NotepadText },
                    { value: 'members', label: 'Select Members', icon: Users },
                    { value: 'department', label: 'Department', icon: Building },
                    { value: 'branch', label: 'Branch', icon: Landmark },
                    { value: 'all', label: 'All Members', icon: Globe }
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSendType(type.value as SendType)}
                      className={`px-4 py-3 flex items-center rounded-lg text-sm font-medium transition-colors ${
                        sendType === type.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </button>
                  )})}
                </div>
              </div>

              {/* Template Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Use Template (Optional)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Input */}
              <div>
                {sendType === 'single' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0241234567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                )}

                {sendType === 'bulk' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Numbers (one per line)
                    </label>
                    <textarea
                      value={phones}
                      onChange={(e) => setPhones(e.target.value)}
                      placeholder="0241234567&#10;0551234567&#10;0201234567"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {phones.split('\n').filter(p => p.trim()).length} number(s) entered
                    </p>
                  </div>
                )}

                {sendType === 'members' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Members
                    </label>
                    <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-2">
                      {members.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No members available</p>
                      ) : (
                        members.map((member) => (
                          <label key={member._id} className="flex items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers([...selectedMembers, member._id]);
                                } else {
                                  setSelectedMembers(selectedMembers.filter(id => id !== member._id));
                                }
                              }}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {member.firstName} {member.lastName} - {member.phone}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {selectedMembers.length} member(s) selected
                    </p>
                  </div>
                )}

                {sendType === 'department' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Choose a department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.memberCount || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sendType === 'branch' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Choose a branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {sendType === 'all' && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ This will send the message to all {members.length} active members in your church.
                      This will use {creditsNeeded} credits.
                    </p>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="general">General</option>
                  <option value="welcome">Welcome</option>
                  <option value="event_reminder">Event Reminder</option>
                  <option value="event_confirmation">Event Confirmation</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="first_timer_followup">First Timer Follow-up</option>
                  <option value="announcement">Announcement</option>
                  <option value="invitation">Invitation</option>
                  <option value="thank_you">Thank You</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  maxLength={918}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>
                    {characterCount}/918 characters {hasUnicode && '(Unicode detected)'}
                  </span>
                  <span>{pageCount} SMS page{pageCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending || !message.trim() || (credits && creditsNeeded > credits.balance)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {sending ? 'Sending...' : `Send SMS (${creditsNeeded} credits)`}
              </button>
            </form>
          </div>
        </div>

        {/* Preview & Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* SMS Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Message Preview
            </h3>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  From: {user?.merchant?.name || 'Your Church'}
                </p>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {message || 'Your message will appear here...'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Characters:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {characterCount}/918
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">SMS Pages:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {pageCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Recipients:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {recipientCount}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Credits Needed:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {creditsNeeded}
                </span>
              </div>
              {credits && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Your Balance:</span>
                  <span className={`font-medium ${
                    credits.balance >= creditsNeeded 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {credits.balance}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Tips for Effective SMS
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Keep messages clear and concise</li>
              <li>• Include your church name</li>
              <li>• Add a call-to-action if needed</li>
              <li>• Avoid special characters to save credits</li>
              <li>• Use templates for consistency</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendSMS;