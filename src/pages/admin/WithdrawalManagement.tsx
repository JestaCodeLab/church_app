import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
  Eye,
  Edit,
  RotateCw,
  Filter,
  Search,
  Loader,
  ChevronDown,
  Calendar,
  Inbox,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getMerchantCurrency } from '../../utils/currency';
import api from '../../services/api';
import ConfirmModal from '../../components/modals/ConfirmModal';

interface WithdrawalRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  amount: number;
  fee: number;
  totalAmount: number;
  paymentMethodId: {
    type: string;
    accountName: string;
    accountNumber: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  reason?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  transactionReference: string;
  retryCount: number;
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    name: string;
    email: string;
  };
}

interface DashboardStats {
  total: number;
  pending: { count: number; totalAmount: number };
  approved: { count: number; totalAmount: number };
  processing: { count: number; totalAmount: number };
  completed: { count: number; totalAmount: number };
  rejected: { count: number; totalAmount: number };
  totalAmount: number;
}

const WithdrawalManagement = () => {
  const merchantCurrency = getMerchantCurrency();
  
  const [loading, setLoading] = useState(true);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayStats, setTodayStats] = useState<DashboardStats | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [processingAction, setProcessingAction] = useState(false);

  const [showFeeModal, setShowFeeModal] = useState(false);
  const [withdrawalFee, setWithdrawalFee] = useState(1.5);
  const [feeInput, setFeeInput] = useState('1.5');
  const [savingFee, setSavingFee] = useState(false);

  useEffect(() => {
    loadData();
    loadWithdrawalFee();
  }, [filterStatus, page]);

  const loadWithdrawalFee = async () => {
    try {
      const res = await api.get('/admin/withdrawals/settings');
      if (res.data.success) {
        setWithdrawalFee(res.data.data.fee || 1.5);
        setFeeInput((res.data.data.fee || 1.5).toString());
      }
    } catch (error: any) {
      console.error('Failed to load withdrawal fee:', error);
    }
  };

  const handleSaveFee = async () => {
    const feeValue = parseFloat(feeInput);
    
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 100) {
      toast.error('Fee must be a number between 0 and 100');
      return;
    }

    try {
      setSavingFee(true);
      const res = await api.put('/admin/withdrawals/settings', {
        fee: feeValue
      });

      if (res.data.success) {
        setWithdrawalFee(feeValue);
        setShowFeeModal(false);
        toast.success('Withdrawal fee updated successfully');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update withdrawal fee');
    } finally {
      setSavingFee(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, requestsRes] = await Promise.all([
        api.get('/admin/withdrawals/stats'),
        api.get('/admin/withdrawals/requests', {
          params: {
            status: filterStatus === 'all' ? undefined : filterStatus,
            page,
            limit: 10
          }
        })
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data.allTime);
        setTodayStats(statsRes.data.data.today);
      }

      if (requestsRes.data.success) {
        setWithdrawalRequests(requestsRes.data.data);
        setTotalPages(requestsRes.data.pagination.pages);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      toast.error(error?.response?.data?.message || 'Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingAction(true);
      const res = await api.put(`/admin/withdrawals/requests/${selectedRequest._id}/approve`, {
        approvalNotes
      });

      if (res.data.success) {
        toast.success('Withdrawal approved successfully');
        setShowApprovalModal(false);
        setApprovalNotes('');
        await loadData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingAction(true);
      const res = await api.put(`/admin/withdrawals/requests/${selectedRequest._id}/reject`, {
        rejectionReason
      });

      if (res.data.success) {
        toast.success('Withdrawal rejected successfully');
        setShowRejectionModal(false);
        setRejectionReason('');
        await loadData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkProcessing = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingAction(true);
      const res = await api.put(`/admin/withdrawals/requests/${selectedRequest._id}/processing`);

      if (res.data.success) {
        toast.success('Withdrawal marked as processing');
        setShowProcessingModal(false);
        await loadData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update withdrawal');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!selectedRequest || !transactionRef) {
      toast.error('Please provide a transaction reference');
      return;
    }

    try {
      setProcessingAction(true);
      const res = await api.put(`/admin/withdrawals/requests/${selectedRequest._id}/completed`, {
        transactionReference: transactionRef
      });

      if (res.data.success) {
        toast.success('Withdrawal marked as completed');
        setShowCompletionModal(false);
        setTransactionRef('');
        await loadData();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to complete withdrawal');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1';
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`;
      case 'approved':
        return `${baseClasses} bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400`;
      case 'processing':
        return `${baseClasses} bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'approved': return <Check size={16} />;
      case 'processing': return <RotateCw size={16} />;
      case 'completed': return <Check size={16} />;
      case 'rejected': return <X size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && withdrawalRequests.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading withdrawal requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-2 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Withdrawal Management</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Process and manage merchant withdrawal requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Fee Settings Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                <Settings className="text-primary-600 dark:text-primary-400" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Withdrawal Service Fee</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Current fee: <span className="font-bold text-primary-600 dark:text-primary-400">{withdrawalFee}%</span></p>
              </div>
            </div>
            <button
              onClick={() => {
                setFeeInput(withdrawalFee.toString());
                setShowFeeModal(true);
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit size={16} />
              Edit Fee
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Pending</p>
                  <p className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {stats.pending.count}
                  </p>
                </div>
                <Clock className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Approved</p>
                  <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                    {stats.approved.count}
                  </p>
                </div>
                <Check className="text-primary-600 dark:text-primary-400" size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Processing</p>
                  <p className="text-lg sm:text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {stats.processing.count}
                  </p>
                </div>
                <RotateCw className="text-sky-600 dark:text-sky-400" size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Completed</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {stats.completed.count}
                  </p>
                </div>
                <Check className="text-green-600 dark:text-green-400" size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Rejected</p>
                  <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {stats.rejected.count}
                  </p>
                </div>
                <X className="text-red-600 dark:text-red-400" size={20} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">Total Amount</p>
                  <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                    {formatCurrency(stats.totalAmount, merchantCurrency)}
                  </p>
                </div>
                <TrendingUp className="text-primary-600 dark:text-primary-400" size={20} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by merchant name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {withdrawalRequests.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="rounded-full bg-slate-100 dark:bg-slate-700 p-4 mb-4">
                <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Withdrawal Requests</h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-sm">
                {filterStatus !== 'all' 
                  ? `No withdrawal requests found with status "${filterStatus}". Try a different filter.`
                  : 'No withdrawal requests yet. Merchants can submit requests once they have available balance.'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Merchant</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Method</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRequests.map((request) => (
                      <tr
                        key={request._id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{request.userId.name}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{request.userId.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {formatCurrency(request.totalAmount, merchantCurrency)}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Fee: {formatCurrency(request.fee, merchantCurrency)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700 dark:text-slate-300">
                        {request.paymentMethodId.accountName}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {request.paymentMethodId.accountNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className={getStatusBadge(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="capitalize">{request.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                      {formatDate(request.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Eye size={18} className="text-primary-600 dark:text-primary-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Fee Settings Modal */}
        {showFeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="border-b border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Withdrawal Fee</h3>
                <button
                  onClick={() => setShowFeeModal(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Withdrawal Fee Percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={feeInput}
                      onChange={(e) => setFeeInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0-100"
                    />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">%</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    This percentage will be deducted from each withdrawal request
                  </p>
                </div>

                {/* Validation Message */}
                {(isNaN(parseFloat(feeInput)) || parseFloat(feeInput) < 0 || parseFloat(feeInput) > 100) && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      Fee must be between 0 and 100%
                    </p>
                  </div>
                )}

                {/* Fee Preview */}
                {!isNaN(parseFloat(feeInput)) && parseFloat(feeInput) >= 0 && parseFloat(feeInput) <= 100 && (
                  <div className="p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
                    <p className="text-sm text-primary-700 dark:text-primary-400">
                      <strong>Example:</strong> A ${1000} withdrawal will have ${(1000 * parseFloat(feeInput) / 100).toFixed(2)} fee deducted
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowFeeModal(false)}
                  disabled={savingFee}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFee}
                  disabled={savingFee || isNaN(parseFloat(feeInput)) || parseFloat(feeInput) < 0 || parseFloat(feeInput) > 100}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingFee ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Save Fee
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Merchant Name</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.userId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Email</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.userId.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.userId.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Reference</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedRequest.transactionReference}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Amount Requested</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(selectedRequest.amount, merchantCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Fee (1.5%)</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(selectedRequest.fee, merchantCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Net Amount</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(selectedRequest.totalAmount, merchantCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
                  <p className={getStatusBadge(selectedRequest.status)}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="capitalize">{selectedRequest.status}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Payment Method</p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedRequest.paymentMethodId.accountName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {selectedRequest.paymentMethodId.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Requested Date</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{formatDate(selectedRequest.requestedAt)}</p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Reason</p>
                  <p className="text-slate-900 dark:text-white">{selectedRequest.reason}</p>
                </div>
              )}

              {selectedRequest.approvalNotes && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Approval Notes</p>
                  <p className="text-slate-900 dark:text-white">{selectedRequest.approvalNotes}</p>
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Rejection Reason</p>
                  <p className="text-red-600 dark:text-red-400">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
              >
                Close
              </button>

              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowApprovalModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowRejectionModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </>
              )}

              {selectedRequest.status === 'approved' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowProcessingModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} />
                  Mark Processing
                </button>
              )}

              {selectedRequest.status === 'processing' && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowCompletionModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Approve Withdrawal</h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Approval Notes (Optional)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes for the merchant..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reject Withdrawal</h3>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Rejection Reason <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this withdrawal is being rejected..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingAction || !rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <X size={18} />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {showProcessingModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mark as Processing</h3>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to mark this withdrawal as processing?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowProcessingModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkProcessing}
                  disabled={processingAction}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RotateCw size={18} />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-md w-full">
            <div className="border-b border-slate-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mark as Completed</h3>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Transaction Reference <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Enter transaction reference from bank/payment provider..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompletionModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkCompleted}
                  disabled={processingAction || !transactionRef}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {processingAction ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Complete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}


    </div>
  )};

export default WithdrawalManagement;
