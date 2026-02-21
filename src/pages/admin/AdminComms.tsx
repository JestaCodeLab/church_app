import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  Users,
  Loader,
  CheckCircle,
  AlertCircle,
  Search,
  X
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Recipient {
  id: string;
  type: string;
  name: string;
  email?: string;
  phone?: string;
  church?: string;
  subdomain?: string;
  contactName?: string;
}

const AdminComms = () => {
  const [activeTab, setActiveTab] = useState<'sms' | 'email'>('sms');
  const [sending, setSending] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    smsMessage: ''
  });

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    // Filter recipients based on search query
    if (searchQuery.trim() === '') {
      setFilteredRecipients(recipients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = recipients.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.phone?.includes(query) ||
        r.church?.toLowerCase().includes(query)
      );
      setFilteredRecipients(filtered);
    }
  }, [searchQuery, recipients]);

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const response = await adminAPI.getRecipients('merchants');
      setRecipients(response.data.data.recipients);
      setFilteredRecipients(response.data.data.recipients);
    } catch (error: any) {
      toast.error('Failed to load recipients');
      console.error(error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const toggleRecipient = (id: string) => {
    setSelectedRecipients(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
    setSendToAll(false);
  };

  const toggleSelectAll = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(filteredRecipients.map(r => r.id));
    }
    setSendToAll(false);
  };

  const handleSendSMS = async () => {
    if (!formData.smsMessage.trim()) {
      toast.error('Please enter an SMS message');
      return;
    }

    if (formData.smsMessage.length > 160) {
      toast.error('SMS message cannot exceed 160 characters');
      return;
    }

    if (!sendToAll && selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient or choose "Send to All"');
      return;
    }

    try {
      setSending(true);
      const response = await adminAPI.sendBulkSMS({
        message: formData.smsMessage,
        recipientIds: sendToAll ? undefined : selectedRecipients,
        sendToAll
      });
      
      toast.success(response.data.message || 'SMS sent successfully');
      setFormData({ ...formData, smsMessage: '' });
      setSelectedRecipients([]);
      setSendToAll(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please enter both subject and message');
      return;
    }

    if (!sendToAll && selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient or choose "Send to All"');
      return;
    }

    try {
      setSending(true);
      const response = await adminAPI.sendBulkEmail({
        subject: formData.subject,
        message: formData.message,
        recipientIds: sendToAll ? undefined : selectedRecipients,
        sendToAll
      });
      
      toast.success(response.data.message || 'Email sent successfully');
      setFormData({ ...formData, subject: '', message: '' });
      setSelectedRecipients([]);
      setSendToAll(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const smsCharCount = formData.smsMessage.length;
  const smsRemaining = 160 - smsCharCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Communications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Send SMS or Email to selected merchants or all at once
          </p>
        </div>
      </div>

      {/* Recipient Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Recipients
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={(e) => {
                  setSendToAll(e.target.checked);
                  if (e.target.checked) setSelectedRecipients([]);
                }}
                className="rounded text-primary-600 focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Send to All ({recipients.length})
              </span>
            </label>
          </div>

          {!sendToAll && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, church, email, or phone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-primary-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Select All Toggle */}
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRecipients.length} of {filteredRecipients.length} selected
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {selectedRecipients.length === filteredRecipients.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Recipients List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {loadingRecipients ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-primary-600" />
                  </div>
                ) : filteredRecipients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No recipients found
                  </div>
                ) : (
                  filteredRecipients.map(recipient => (
                    <label
                      key={recipient.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => toggleRecipient(recipient.id)}
                        className="rounded text-primary-600 focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {recipient.contactName || recipient.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {recipient.church || recipient.name} {recipient.subdomain && `(${recipient.subdomain})`}
                        </p>
                        <div className="flex gap-4 mt-1">
                          {recipient.email && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {recipient.email}
                            </span>
                          )}
                          {recipient.phone && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {recipient.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800 dark:text-blue-300">
              Using Platform Sender ID
            </h3>
            <p className="mt-1 text-sm text-primary-700 dark:text-primary-400">
              SMS messages will be sent using the platform sender ID. 
              {sendToAll 
                ? ` Messages will be sent to all ${recipients.length} merchant admins.`
                : selectedRecipients.length > 0 
                  ? ` Messages will be sent to ${selectedRecipients.length} selected recipient(s).`
                  : ' Please select recipients above.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sms')}
            className={`
              flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'sms'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            SMS
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`
              flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'email'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }
            `}
          >
            <Mail className="w-5 h-5 mr-2" />
            Email
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {activeTab === 'sms' ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SMS Message
              </label>
              <textarea
                value={formData.smsMessage}
                onChange={(e) => setFormData({ ...formData, smsMessage: e.target.value })}
                rows={6}
                maxLength={160}
                placeholder="Type your SMS message here... (Max 160 characters)"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 inline mr-1" />
                  {sendToAll 
                    ? `Will be sent to all ${recipients.length} merchant admins`
                    : `Will be sent to ${selectedRecipients.length} selected recipient(s)`
                  }
                </p>
                <p className={`text-sm font-medium ${smsRemaining < 20 ? 'text-orange-600' : 'text-gray-500 dark:text-gray-400'}`}>
                  {smsCharCount} / 160 characters ({smsRemaining} remaining)
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendSMS}
                disabled={sending || !formData.smsMessage.trim()}
                className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg
                         hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors font-medium"
              >
                {sending ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send SMS
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Enter email subject"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={12}
                placeholder="Type your email message here..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         placeholder-gray-400 dark:placeholder-gray-500"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Users className="w-4 h-4 inline mr-1" />
                {sendToAll 
                  ? `Will be sent to all ${recipients.length} merchant admins`
                  : `Will be sent to ${selectedRecipients.length} selected recipient(s)`
                }
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSendEmail}
                disabled={sending || !formData.subject.trim() || !formData.message.trim()}
                className="flex items-center px-6 py-2.5 bg-primary-600 text-white rounded-lg
                         hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors font-medium"
              >
                {sending ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Email
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Usage Guidelines */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Communication Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Use clear, professional language</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Include important dates, deadlines, or action items</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Provide contact information for follow-up questions</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span>Review your message before sending to avoid errors</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminComms;
