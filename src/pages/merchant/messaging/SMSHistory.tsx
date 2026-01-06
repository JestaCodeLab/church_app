// src/pages/merchant/messaging/SMSHistory.tsx - ENHANCED

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, XCircle, AlertCircle, Loader } from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import LockedFeature from '../../../components/LockedFeature';
import api, { messagingAPI } from '../../../services/api';

interface Recipient {
  phoneNumber: string;
  status: 'pending' | 'submitted' | 'sent' | 'delivered' | 'failed';
  deliveredAt?: string;
  sentAt?: string;
  failureReason?: string;
}

interface SmsLog {
  _id: string;
  messageType: string;
  category: string;
  message: string;
  senderID: string;
  overallStatus: string;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  creditsUsed: number;
  recipients: Recipient[];
  createdAt: string;
}

const SMSHistory = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SmsLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSMSAccess, setHasSMSAccess] = useState<boolean | null>(null);

  useEffect(() => {
    checkSMSAccess();
    fetchLogs();
  }, []);

  const checkSMSAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsHistory', {
      showErrorToast: false
    });
    setHasSMSAccess(hasAccess);
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await messagingAPI.sms.getLogs();
      setLogs(response.data.data.logs || []);
    } catch (error: any) {
      showToast.error('Failed to load SMS history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
      completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
      submitted: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Submitted' },
      sent: { icon: Clock, color: 'text-blue-600 bg-blue-100', label: 'Sent' },
      failed: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Failed' },
      pending: { icon: Clock, color: 'text-gray-600 bg-gray-100', label: 'Pending' },
      partial: { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', label: 'Partial' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5 mr-1" />
        {config.label}
      </span>
    );
  };

  const viewDetails = async (log: SmsLog) => {
    try {
      // Fetch fresh data with delivery status
      const response = await api.get(`/sms/logs/${log._id}`);
      setSelectedLog(response.data.data.smsLog);
      setShowDetails(true);
    } catch (error: any) {
      showToast.error('Failed to load details');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <LockedFeature
      featureName="SMS History"
      description="View SMS messaging history and delivery status. Upgrade your plan to access this feature."
      isLocked={hasSMSAccess === false}
      variant="overlay"
      showUpgradeButton={true}
    >
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          SMS History
        </h2>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      {/* SMS Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Sender ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Delivered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {log.messageType}
                  </td>
                  <td className="px-6 py-4 text-sm text-primary-600 dark:text-primary-400">
                    {log.senderID}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {log.totalRecipients}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(log.overallStatus)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {log.successfulDeliveries} / {log.totalRecipients}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    {log.creditsUsed}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => viewDetails(log)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  SMS Details
                </h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Message Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Message</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {selectedLog.message}
                </p>
              </div>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">Delivered</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {selectedLog.successfulDeliveries}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {selectedLog.failedDeliveries}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Credits Used</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {selectedLog.creditsUsed}
                  </p>
                </div>
              </div>

              {/* Recipients List */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Recipients ({selectedLog.recipients.length})
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedLog.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {recipient.phoneNumber}
                        </p>
                        {recipient.deliveredAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Delivered: {new Date(recipient.deliveredAt).toLocaleString()}
                          </p>
                        )}
                        {recipient.failureReason && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {recipient.failureReason}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(recipient.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </LockedFeature>
  );
};

export default SMSHistory;