import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle, Loader, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import api, { messagingAPI } from '../../../services/api';
import FeatureGate from '../../../components/access/FeatureGate';

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

interface ScheduledMessage {
  _id: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  recipients: any;
  scheduledAt: string;
  createdAt: string;
  sentAt?: string;
  executionError?: string;
  recipientCount: number;
  successCount?: number;
  failureCount?: number;
  creditsUsed?: number;
  estimatedCreditsNeeded: number;
  category: string;
}

const SMSHistory = () => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SmsLog | ScheduledMessage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [hasSMSAccess, setHasSMSAccess] = useState<boolean | null>(null);
  const [messageType, setMessageType] = useState<'regular' | 'scheduled' | 'failed'>('regular');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [regularTotalPages, setRegularTotalPages] = useState(1);
  const [scheduledTotalPages, setScheduledTotalPages] = useState(1);
  const [regularTotalItems, setRegularTotalItems] = useState(0);
  const [scheduledTotalItems, setScheduledTotalItems] = useState(0);
  const [failedTotalItems, setFailedTotalItems] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const PAGE_SIZE = 20;
  const prevMessageTypeRef = useRef<'regular' | 'scheduled' | 'failed' | null>(null);

  useEffect(() => {
    checkSMSAccess();
    // Initial load on mount
    handleTabChange('regular');
  }, []);

  useEffect(() => {
    // Check if tab changed
    const isTabChange = prevMessageTypeRef.current !== null && prevMessageTypeRef.current !== messageType;
    prevMessageTypeRef.current = messageType;
    
    if (isTabChange) {
      // Tab switched - fetch without showing loading spinner
      fetchLogsQuietly();
    } else {
      // Initial load or page changed within same tab - show loading spinner
      setLoading(true);
      fetchLogs();
    }
  }, [currentPage, messageType]);

  const checkSMSAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsHistory', {
      showErrorToast: false
    });
    setHasSMSAccess(hasAccess);
  };

  const handleTabChange = (tab: 'regular' | 'scheduled' | 'failed') => {
    setMessageType(tab);
    setCurrentPage(1);
  };

  const fetchLogsQuietly = async () => {
    try {
      // Don't show loading spinner for tab changes
      if (messageType === 'regular') {
        const res = await messagingAPI.sms.getLogs({ page: currentPage, limit: PAGE_SIZE });
        const responseData = res.data?.data || {};
        setLogs(responseData.logs || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setRegularTotalPages(totalPagesValue);
        setRegularTotalItems(totalItemsValue);
      } else if (messageType === 'scheduled') {
        const res = await messagingAPI.sms.getScheduled({ page: currentPage, limit: PAGE_SIZE });
        const responseData = res.data?.data || {};
        setScheduledMessages(responseData.scheduled || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setScheduledTotalPages(totalPagesValue);
        setScheduledTotalItems(totalItemsValue);
      } else if (messageType === 'failed') {
        const res = await messagingAPI.sms.getLogs({ page: currentPage, limit: PAGE_SIZE, status: 'failed' });
        const responseData = res.data?.data || {};
        setLogs(responseData.logs || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setRegularTotalPages(totalPagesValue);
        setFailedTotalItems(totalItemsValue);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      showToast.error('Failed to load SMS history');
    }
  };

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      if (messageType === 'regular') {
        const res = await messagingAPI.sms.getLogs({ page: currentPage, limit: PAGE_SIZE });
        console.log('Regular SMS Response:', res);
        const responseData = res.data?.data || {};
        setLogs(responseData.logs || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setRegularTotalPages(totalPagesValue);
        setRegularTotalItems(totalItemsValue);
      } else if (messageType === 'scheduled') {
        const res = await messagingAPI.sms.getScheduled({ page: currentPage, limit: PAGE_SIZE });
        console.log('Scheduled SMS Response:', res);
        const responseData = res.data?.data || {};
        setScheduledMessages(responseData.scheduled || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setScheduledTotalPages(totalPagesValue);
        setScheduledTotalItems(totalItemsValue);
      } else if (messageType === 'failed') {
        const res = await messagingAPI.sms.getLogs({ page: currentPage, limit: PAGE_SIZE, status: 'failed' });
        console.log('Failed SMS Response:', res);
        const responseData = res.data?.data || {};
        setLogs(responseData.logs || []);
        const totalPagesValue = responseData.pagination?.totalPages || 1;
        const totalItemsValue = responseData.pagination?.totalItems || 0;
        setRegularTotalPages(totalPagesValue);
        setFailedTotalItems(totalItemsValue);
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      showToast.error('Failed to load SMS history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
      completed: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Delivered' },
      submitted: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Submitted' },
      sent: { icon: Clock, color: 'text-primary-600 bg-primary-100', label: 'Sent' },
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

  const viewDetails = async (log: SmsLog | ScheduledMessage) => {
    setSelectedLog(log);
    setShowDetails(true);
  };

  const handleCancelMessage = async (messageId: string) => {
    try {
      setCancelling(true);
      await messagingAPI.sms.cancelScheduled(messageId);
      showToast.success('Scheduled message cancelled successfully');
      setShowCancelConfirm(null);
      fetchLogs();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to cancel scheduled message');
    } finally {
      setCancelling(false);
    }
  };

  // Get current data based on type
  const currentData = (messageType === 'regular' || messageType === 'failed') ? logs : scheduledMessages;
  const totalPages = (messageType === 'regular' || messageType === 'failed') ? regularTotalPages : scheduledTotalPages;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const paginatedData = currentData;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <FeatureGate feature="smsHistory" showUpgrade={!hasSMSAccess}>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          SMS History
        </h2>
        <button
          onClick={fetchLogs}
          disabled={refreshing}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
            refreshing
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {refreshing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      {/* Message Type Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => handleTabChange('regular')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            messageType === 'regular'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Regular ({regularTotalItems})
        </button>
        <button
          onClick={() => handleTabChange('scheduled')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            messageType === 'scheduled'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Scheduled ({scheduledTotalItems})
        </button>
        <button
          onClick={() => handleTabChange('failed')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            messageType === 'failed'
              ? 'border-red-600 text-red-600 dark:text-red-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Failed ({failedTotalItems})
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
                {(messageType === 'regular' || messageType === 'failed') && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Sender ID
                    </th>
                  </>
                )}
                {messageType === 'scheduled' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Scheduled For
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Recipients
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                {(messageType === 'regular' || messageType === 'failed') && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Delivered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Credits
                    </th>
                  </>
                )}
                {messageType === 'scheduled' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Est. Credits
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={messageType === 'scheduled' ? 7 : 8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No {messageType} messages found
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const isScheduled = messageType === 'scheduled';
                  const log = item as SmsLog;
                  const scheduled = item as ScheduledMessage;
                  
                  return (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {isScheduled
                          ? new Date(scheduled.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {(messageType === 'regular' || messageType === 'failed') && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {log.messageType}
                          </td>
                          <td className="px-6 py-4 text-sm text-primary-600 dark:text-primary-400">
                            {log.senderID}
                          </td>
                        </>
                      )}
                      {isScheduled && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {new Date(scheduled.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {isScheduled ? scheduled.recipientCount : log.totalRecipients}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(isScheduled ? scheduled.status : log.overallStatus)}
                      </td>
                      {(messageType === 'regular' || messageType === 'failed') && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {log.successfulDeliveries} / {log.totalRecipients}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {log.creditsUsed}
                          </td>
                        </>
                      )}
                      {isScheduled && (
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {scheduled.estimatedCreditsNeeded}
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => viewDetails(item)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            View
                          </button>
                          {isScheduled && (scheduled as ScheduledMessage).status === 'pending' && (
                            <button
                              onClick={() => setShowCancelConfirm(item._id)}
                              className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages} • Showing {paginatedData.length} records
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show page numbers smartly: always show first page, last page, and pages around current page
                  if (i === 0) return 1;
                  if (totalPages <= 5) return i + 1;
                  if (i === 4) return totalPages;
                  return currentPage + (i - 2);
                }).filter((page, idx, arr) => page && arr.indexOf(page) === idx && page > 0 && page <= totalPages).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {messageType === 'scheduled' ? 'Scheduled SMS' : 'SMS'} Details
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
                  {(selectedLog as SmsLog | ScheduledMessage).message}
                </p>
              </div>

              {messageType === 'regular' && (
                <>
                  {/* Overall Stats - Regular */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Delivered</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {(selectedLog as SmsLog).successfulDeliveries}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">Failed</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {(selectedLog as SmsLog).failedDeliveries}
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                      <p className="text-sm text-primary-600 dark:text-primary-400">Credits Used</p>
                      <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                        {(selectedLog as SmsLog).creditsUsed}
                      </p>
                    </div>
                  </div>

                  {/* Recipients List - Regular */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Recipients ({(selectedLog as SmsLog).recipients.length})
                    </h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(selectedLog as SmsLog).recipients.map((recipient, index) => (
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
                </>
              )}

              {messageType === 'scheduled' && (
                <>
                  {/* Scheduled Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                      <p className="text-sm text-primary-600 dark:text-primary-400">Scheduled For</p>
                      <p className="text-base font-semibold text-primary-900 dark:text-primary-100">
                        {new Date((selectedLog as ScheduledMessage).scheduledAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <p className="text-sm text-primary-600 dark:text-primary-400">Status</p>
                      <p className="text-base font-semibold text-purple-900 dark:text-primary-100">
                        {(selectedLog as ScheduledMessage).status}
                      </p>
                    </div>
                  </div>

                  {/* Stats - Scheduled */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Recipients</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {(selectedLog as ScheduledMessage).recipientCount}
                      </p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400">Est. Credits</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {(selectedLog as ScheduledMessage).estimatedCreditsNeeded}
                      </p>
                    </div>
                    <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
                      <p className="text-sm text-primary-600 dark:text-primary-400">Category</p>
                      <p className="text-base font-semibold text-primary-900 dark:text-primary-100 capitalize">
                        {(selectedLog as ScheduledMessage).category || 'General'}
                      </p>
                    </div>
                  </div>

                  {(selectedLog as ScheduledMessage).executionError && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Execution Error</p>
                      <p className="text-sm text-red-900 dark:text-red-100">
                        {(selectedLog as ScheduledMessage).executionError}
                      </p>
                    </div>
                  )}

                  {(selectedLog as ScheduledMessage).sentAt && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-2">Sent At</p>
                      <p className="text-sm text-green-900 dark:text-green-100">
                        {new Date((selectedLog as ScheduledMessage).sentAt!).toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Cancel Scheduled Message?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel this scheduled message? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
                >
                  Keep It
                </button>
                <button
                  onClick={() => handleCancelMessage(showCancelConfirm)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {cancelling ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  );
};

export default SMSHistory;