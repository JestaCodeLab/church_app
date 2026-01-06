import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader,
  Search,
  Filter,
  Mail,
  Calendar,
  Building2,
  MessageSquare,
  Check,
  X
} from 'lucide-react';
import api from '../../../services/api';
import { showToast } from '../../../utils/toasts';

interface SenderIdRequest {
  merchantId: string;
  churchName: string;
  email: string;
  senderId: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  approvedAt: string | null;
  rejectionReason: string | null;
}

const AdminSenderIds = () => {
  const [senderIds, setSenderIds] = useState<SenderIdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState<{ merchantId: string; senderId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  useEffect(() => {
    fetchSenderIds();
  }, [statusFilter]);

  const fetchSenderIds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/sender-ids', {
        params: statusFilter !== 'all' ? { status: statusFilter } : {}
      });

      setSenderIds(response.data.data.senderIds);
      setStats({
        pending: response.data.data.pending,
        approved: response.data.data.approved,
        rejected: response.data.data.rejected
      });
    } catch (error: any) {
      showToast.error('Failed to load sender IDs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSenderId = async (merchantId: string) => {
    try {
      setApproving(merchantId);
      const response = await api.post(`/admin/sender-ids/${merchantId}/approve`);
      
      showToast.success(response.data.message);
      await fetchSenderIds();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to approve sender ID');
    } finally {
      setApproving(null);
    }
  };

  const handleOpenRejectModal = (merchantId: string, senderId: string) => {
    setRejectData({ merchantId, senderId });
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSenderId = async () => {
    if (!rejectData || !rejectReason.trim()) {
      showToast.error('Please provide a rejection reason');
      return;
    }

    try {
      setRejecting(rejectData.merchantId);
      const response = await api.post(`/admin/sender-ids/${rejectData.merchantId}/reject`, {
        reason: rejectReason.trim()
      });

      showToast.success(response.data.message);
      setShowRejectModal(false);
      await fetchSenderIds();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to reject sender ID');
    } finally {
      setRejecting(null);
    }
  };

  const filteredSenderIds = senderIds.filter(item =>
    searchTerm === '' ||
    item.churchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.senderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          SMS Sender IDs
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and approve custom sender ID requests from churches
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                {stats.pending}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.approved}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400 opacity-20" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.rejected}
              </p>
            </div>
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by church name, sender ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending ({stats.pending})</option>
              <option value="approved">Approved ({stats.approved})</option>
              <option value="rejected">Rejected ({stats.rejected})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredSenderIds.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm ? 'No sender IDs match your search' : 'No sender IDs to display'}
          </p>
        </div>
      ) : (
        /* Sender IDs Table */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Church Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Sender ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSenderIds.map((item) => (
                  <tr key={item.merchantId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {item.churchName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded font-mono text-sm font-medium">
                        {item.senderId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.registeredAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{item.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleApproveSenderId(item.merchantId)}
                            disabled={approving === item.merchantId}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm rounded font-medium flex items-center space-x-1 transition-colors"
                          >
                            {approving === item.merchantId ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(item.merchantId, item.senderId)}
                            disabled={rejecting === item.merchantId}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-sm rounded font-medium flex items-center space-x-1 transition-colors"
                          >
                            {rejecting === item.merchantId ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                      {item.status === 'approved' && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Active
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <div className="text-right">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Rejected</p>
                          {item.rejectionReason && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                              {item.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Reject Sender ID
              </h2>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to reject the sender ID <strong className="font-mono">"{rejectData?.senderId}"</strong>?
              </p>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this sender ID is being rejected..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {rejectReason.length}/500 characters
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting !== null}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSenderId}
                disabled={!rejectReason.trim() || rejecting !== null}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {rejecting !== null ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSenderIds;
