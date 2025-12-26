import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { showToast } from '../../../utils/toasts';

interface SMSHistoryItem {
  _id: string;
  message: string;
  category: string;
  overallStatus: string;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  creditsUsed: number;
  messageType: string;
  targetGroup?: string;
  sentBy: {
    firstName: string;
    lastName: string;
  };
  templateUsed?: {
    name: string;
  };
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

const SMSHistory: React.FC = () => {
  const [history, setHistory] = useState<SMSHistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSMS, setSelectedSMS] = useState<SMSHistoryItem | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [page, status, category, startDate, endDate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (status) params.append('status', status);
      if (category) params.append('category', category);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/sms/history?${params.toString()}`);
      setHistory(response.data.data.smsHistory);
      setPagination(response.data.data.pagination);
    } catch (error: any) {
      showToast.error('Failed to load SMS history');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStatus('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      completed: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400' },
      failed: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400' },
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400' },
      processing: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400' },
      partial: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-400' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  const getMessageTypeBadge = (type: string) => {
    const icons: Record<string, string> = {
      single: '📱',
      bulk: '📋',
      group: '👥',
      scheduled: '⏰',
      automated: '🤖'
    };

    return (
      <span className="text-sm">
        {icons[type] || '📨'} {type}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          SMS History
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your sent messages
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="general">General</option>
              <option value="welcome">Welcome</option>
              <option value="event_reminder">Event Reminder</option>
              <option value="event_confirmation">Event Confirmation</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="announcement">Announcement</option>
              <option value="invitation">Invitation</option>
              <option value="thank_you">Thank You</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>

        {(status || category || startDate || endDate) && (
          <div className="mt-4">
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No messages found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {status || category || startDate || endDate
                ? 'Try adjusting your filters'
                : 'Start sending SMS to see your history here'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {history.map((sms) => (
                    <tr key={sms._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(sms.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(sms.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                        <div className="truncate">{sms.message}</div>
                        {sms.templateUsed && (
                          <div className="text-xs text-gray-500 mt-1">
                            Template: {sms.templateUsed.name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 capitalize">
                          {sms.category.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getMessageTypeBadge(sms.messageType)}
                        {sms.targetGroup && (
                          <div className="text-xs text-gray-500 mt-1 capitalize">
                            {sms.targetGroup.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div>{sms.totalRecipients}</div>
                        {sms.successfulDeliveries > 0 && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            ✓ {sms.successfulDeliveries} sent
                          </div>
                        )}
                        {sms.failedDeliveries > 0 && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            ✗ {sms.failedDeliveries} failed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(sms.overallStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {sms.creditsUsed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedSMS(sms)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedSMS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  SMS Details
                </h2>
                <button
                  onClick={() => setSelectedSMS(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</label>
                  <div className="mt-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedSMS.message}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {selectedSMS.messageType}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                      {selectedSMS.category.replace(/_/g, ' ')}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedSMS.overallStatus)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Credits Used</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedSMS.creditsUsed}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Recipients</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedSMS.totalRecipients}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Successful</label>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                      {selectedSMS.successfulDeliveries}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Failed</label>
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {selectedSMS.failedDeliveries}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Sent By</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {selectedSMS.sentBy.firstName} {selectedSMS.sentBy.lastName}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedSMS.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedSMS.templateUsed && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Template</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedSMS.templateUsed.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedSMS(null)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSHistory;