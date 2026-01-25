import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  Filter,
  X,
  Loader,
  Check,
  AlertCircle,
  Phone,
  Building
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import api from '../../../services/api';
import ConfirmModal from '../../../components/modals/ConfirmModal';

interface PaymentMethod {
  _id: string;
  type: 'momo' | 'bank' | 'wallet';
  accountName: string;
  accountNumber: string;
  accountHolder?: string;
  bankName?: string;
  provider?: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
  amount: number;
  fee: number;
  totalAmount: number;
  method: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

interface WalletStats {
  availableBalance: number;
  totalCollected: number;
  campaignDonations: number;
  eventDonations: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  lastPayoutDate?: string;
}

const Wallet = () => {
  const navigate = useNavigate();
  const merchantCurrency = getMerchantCurrency();

  // States
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WalletStats>({
    availableBalance: 0,
    totalCollected: 0,
    campaignDonations: 0,
    eventDonations: 0,
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    lastPayoutDate: undefined
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showAddMethodModal, setShowAddMethodModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<string | null>(null);

  const [withdrawalStep, setWithdrawalStep] = useState(1); // 1: Select Method, 2: Enter Amount, 3: Review
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalReason, setWithdrawalReason] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  const [methodFormData, setMethodFormData] = useState({
    type: 'momo' as 'momo' | 'bank' | 'wallet',
    accountName: '',
    accountNumber: '',
    bankName: '',
    provider: 'MTN'
  });

  const [filterStatus, setFilterStatus] = useState('all');
  const [methodLoading, setMethodLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Helper function to get card styling based on payment method type and provider
  const getPaymentMethodStyles = (method: PaymentMethod) => {
    if (method.type === 'momo') {
      const provider = method.provider?.toUpperCase() || 'MTN';
      
      switch (provider) {
        case 'MTN':
          return {
            bg: 'bg-gradient-to-b from-yellow-200 to-yellow-500',
            border: 'border-yellow-400 dark:border-yellow-600',
            text: 'text-black',
            icon: 'text-black'
          };
        case 'VODAFONE':
          return {
            bg: 'bg-gradient-to-b from-red-400 to-red-700',
            border: 'border-red-500 dark:border-red-700',
            text: 'text-white',
            icon: 'text-white'
          };
        case 'AIRTELTIGO':
        case 'AIRTEL_TIGO':
          return {
            bg: 'bg-gradient-to-b from-blue-400 to-blue-700',
            border: 'border-blue-500 dark:border-blue-700',
            text: 'text-white',
            icon: 'text-white'
          };
        default: // Default to MTN colors
          return {
            bg: 'bg-gradient-to-b from-yellow-200 to-yellow-500',
            border: 'border-yellow-400 dark:border-yellow-600',
            text: 'text-black',
            icon: 'text-black'
          };
      }
    } else {
      // Bank card styling
      return {
        bg: 'bg-gradient-to-b from-blue-500 to-blue-800',
        border: 'border-blue-600 dark:border-blue-500',
        text: 'text-white',
        icon: 'text-white'
      };
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  useEffect(() => {
    loadWithdrawalHistory();
  }, [filterStatus, historyPage]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [statsRes, methodsRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/payment-methods')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }

      if (methodsRes.data.success) {
        setPaymentMethods(methodsRes.data.data);
      }
    } catch (error: any) {
      console.error('Failed to load wallet data:', error);
      toast.error(error?.response?.data?.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawalHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/wallet/withdrawal-history', {
        params: {
          status: filterStatus === 'all' ? undefined : filterStatus,
          page: historyPage,
          limit: 10
        }
      });

      if (res.data.success) {
        setWithdrawalHistory(res.data.data);
        setHistoryTotalPages(res.data.pagination.pages);
      }
    } catch (error: any) {
      console.error('Failed to load withdrawal history:', error);
      toast.error(error?.response?.data?.message || 'Failed to load withdrawal history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!methodFormData.accountName || !methodFormData.accountNumber) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (methodFormData.type === 'bank' && !methodFormData.bankName) {
      toast.error('Bank name is required for bank accounts');
      return;
    }

    try {
      setMethodLoading(true);
      const res = await api.post('/wallet/payment-methods', methodFormData);
      
      if (res.data.success) {
        setPaymentMethods([...paymentMethods, res.data.data]);
        toast.success('Payment method added successfully');
        setShowAddMethodModal(false);
        setMethodFormData({
          type: 'momo',
          accountName: '',
          accountNumber: '',
          bankName: '',
          provider: 'MTN'
        });
      }
    } catch (error: any) {
      console.error('Failed to add payment method:', error);
      toast.error(error?.response?.data?.message || 'Failed to add payment method');
    } finally {
      setMethodLoading(false);
    }
  };

  const handleDeleteMethod = (methodId: string) => {
    setMethodToDelete(methodId);
    setShowDeleteConfirm(true);
  };

  const handleSetPrimaryMethod = async (methodId: string) => {
    try {
      setMethodLoading(true);
      const res = await api.patch(`/wallet/payment-methods/${methodId}/set-primary`);
      
      if (res.data.success) {
        // Update local state
        setPaymentMethods(paymentMethods.map(m => ({
          ...m,
          isDefault: m._id === methodId
        })));
        toast.success('Primary payment method updated');
      }
    } catch (error: any) {
      console.error('Failed to set primary method:', error);
      toast.error(error?.response?.data?.message || 'Failed to set primary method');
    } finally {
      setMethodLoading(false);
    }
  };

  const confirmDeleteMethod = async () => {
    if (!methodToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await api.delete(`/wallet/payment-methods/${methodToDelete}`);
      
      if (res.data.success) {
        setPaymentMethods(paymentMethods.filter(m => m._id !== methodToDelete));
        toast.success('Payment method deleted');
        setShowDeleteConfirm(false);
        setMethodToDelete(null);
      }
    } catch (error: any) {
      console.error('Failed to delete payment method:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete payment method');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!selectedMethod || !withdrawalAmount) {
      toast.error('Please select a method and enter amount');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount > stats.availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }

    try {
      setWithdrawalLoading(true);
      const res = await api.post('/wallet/withdrawal-request', {
        amount,
        paymentMethodId: selectedMethod._id,
        reason: withdrawalReason
      });

      if (res.data.success) {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawalModal(false);
        resetWithdrawalForm();
        setHistoryPage(1);
        await loadWithdrawalHistory();
      }
    } catch (error: any) {
      console.error('Failed to request withdrawal:', error);
      toast.error(error?.response?.data?.message || 'Failed to submit withdrawal request');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const resetWithdrawalForm = () => {
    setWithdrawalStep(1);
    setSelectedMethod(null);
    setWithdrawalAmount('');
    setWithdrawalReason('');
  };

  const calculateFee = (amount: number) => {
    // 1.5% fee
    return amount * 0.015;
  };

  const withdrawalAmount_num = parseFloat(withdrawalAmount) || 0;
  const fee = calculateFee(withdrawalAmount_num);
  const totalToDisburse = withdrawalAmount_num - fee;

  const filteredHistory = withdrawalHistory;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'approved': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'processing': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'failed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Wallet & Payouts</h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Manage linked accounts and withdraw funds securely to your bank or mobile wallet.
              </p>
            </div>
            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="flex items-center gap-2 px-3 sm:px-3 py-2 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap flex-shrink-0 text-sm sm:text-base"
            >
              <Download size={18} className="hidden sm:block" />
              <Download size={16} className="sm:hidden" />
              <span className="hidden sm:inline">Withdrawal</span>
              <span className="sm:hidden">Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Balance Section - 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Available Balance Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800 p-6 sm:p-8">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
                Available Balance
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                {formatCurrency(stats.availableBalance, merchantCurrency)}
              </h2>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Ready to withdraw
              </p>
            </div>
          </div>

          {/* Total Withdrawn Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg sm:rounded-xl border border-green-200 dark:border-green-800 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">
                  Total Withdrawn
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                  {formatCurrency(stats.totalWithdrawn, merchantCurrency)}
                </h2>
                <p className="text-xs text-green-700 dark:text-green-300">
                  All-time withdrawals
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
              </div>
            </div>
          </div>

          {/* Pending Withdrawals Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg sm:rounded-xl border border-amber-200 dark:border-amber-800 p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                  Pending Withdrawals
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                  {formatCurrency(stats.pendingWithdrawals, merchantCurrency)}
                </h2>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Awaiting processing
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Linked Payment Methods</h2>
            <button
              onClick={() => setShowAddMethodModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Add Method</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paymentMethods.map(method => {
              const styles = getPaymentMethodStyles(method);
              return (
              <div
                key={method._id}
                className={`rounded-lg sm:rounded-xl border-2 p-4 sm:p-6 relative overflow-hidden group cursor-pointer transition-all ${styles.bg} ${styles.border}`}
              >
                {/* Top Action Buttons */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {/* Set as Primary Button */}
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetPrimaryMethod(method._id)}
                      disabled={methodLoading}
                      className={`p-2 rounded-lg transition-colors ${
                        styles.text === 'text-black'
                          ? 'bg-black/10 hover:bg-black/20 disabled:bg-black/5'
                          : 'bg-white/20 hover:bg-white/30 disabled:bg-white/10'
                      } disabled:cursor-not-allowed`}
                      title="Set as Primary"
                    >
                      {methodLoading ? (
                        <Loader size={16} className={`${styles.text} animate-spin`} />
                      ) : (
                        <Check size={16} className={styles.text} />
                      )}
                    </button>
                  )}
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteMethod(method._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      styles.text === 'text-black'
                        ? 'bg-black/10 hover:bg-black/20'
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title="Delete"
                  >
                    <X size={16} className={styles.text} />
                  </button>
                </div>

                {/* Icon */}
                <div className="mb-4">
                  {method.type === 'momo' ? (
                    <Phone size={32} className={styles.icon} />
                  ) : (
                    <Building size={32} className={styles.icon} />
                  )}
                </div>

                {/* Content */}
                <h3 className={`text-lg sm:text-xl font-bold ${styles.text} mb-1`}>{method.type === 'momo' ? 'MoMo' : 'BANK'}</h3>
                <p className={`text-lg font-bold sm:text-lg ${styles.text}/90 mb-0`}>{method.accountName}</p>
                <p className={`text-xs sm:text-sm ${styles.text}/80 mb-3`}>{method.accountNumber}</p>

                {/* Footer */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {method.isDefault && (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${styles.text} bg-green-500/30`}>
                        Primary Method
                      </span>
                    )}
                    <span className={`text-xs font-bold ${method.isVerified ? `${styles.text}` : `${styles.text}`}`}>
                      {method.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Add New Card */}
            <button
              onClick={() => setShowAddMethodModal(true)}
              className="rounded-lg sm:rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 sm:p-6 flex flex-col items-center justify-center gap-3 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20 transition-colors">
                <Plus className="text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" size={24} />
              </div>
              <div>
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Add New Method</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Connect a new account</p>
              </div>
            </button>
          </div>
        </div>

        {/* Withdrawal History */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Withdrawal History</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
              <button className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Download size={14} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            {historyLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Loading withdrawal history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">
                <Download size={32} className="mx-auto mb-2 opacity-50" />
                <p>No withdrawal requests found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                        <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">DATE</th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">REFERENCE ID</th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">METHOD</th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">AMOUNT</th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((withdrawal, idx) => (
                        <tr
                          key={withdrawal._id}
                          className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors last:border-b-0"
                        >
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                            <div className="text-slate-900 dark:text-white font-medium">
                              {new Date(withdrawal.requestedAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400">
                              {new Date(withdrawal.requestedAt).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-mono text-slate-900 dark:text-white">
                            {withdrawal._id}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                            {withdrawal.method}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(withdrawal.amount, merchantCurrency)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-xs sm:text-sm">
                            <span className={`inline-block px-2 py-1 rounded-full font-bold text-xs ${getStatusColor(withdrawal.status)}`}>
                              {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {historyTotalPages > 1 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      Page {historyPage} of {historyTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                        disabled={historyPage === 1 || historyLoading}
                        className="px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setHistoryPage(Math.min(historyTotalPages, historyPage + 1))}
                        disabled={historyPage === historyTotalPages || historyLoading}
                        className="px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Withdrawal Request Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl max-w-lg w-full shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Withdrawal Request
              </h2>
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  resetWithdrawalForm();
                }}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Step {withdrawalStep} of 3: {withdrawalStep === 1 ? 'Select Method' : withdrawalStep === 2 ? 'Enter Amount' : 'Review'}
              </p>
              <div className="flex gap-2">
                {[1, 2, 3].map(step => (
                  <div
                    key={step}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      step <= withdrawalStep ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="text-right mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                {Math.round((withdrawalStep / 3) * 100)}%
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              {withdrawalStep === 1 && (
                <div className="space-y-5">
                  {/* Header Section */}
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-0">
                      Choose Your Payment Method
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Select where you'd like to receive your withdrawal
                    </p>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-3">
                        <CreditCard size={24} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                        No payment methods added
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                        Add a payment method to start withdrawing funds
                      </p>
                      <button
                        onClick={() => {
                          setShowWithdrawalModal(false);
                          setShowAddMethodModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                      >
                        <Plus size={18} />
                        Add Payment Method
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Payment Methods Grid */}
                      <div className="grid grid-cols-1 gap-3">
                        {paymentMethods.map(method => (
                          <button
                            key={method._id}
                            onClick={() => setSelectedMethod(method)}
                            className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                              selectedMethod?._id === method._id
                                ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/20 dark:to-blue-900/10 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {/* Icon Container */}
                              <div className={`p-3 rounded-lg flex-shrink-0 transition-all ${
                                method.type === 'momo'
                                  ? selectedMethod?._id === method._id
                                    ? 'bg-yellow-200 dark:bg-yellow-900/40'
                                    : 'bg-yellow-100 dark:bg-yellow-900/30 group-hover:bg-yellow-150'
                                  : selectedMethod?._id === method._id
                                    ? 'bg-blue-200 dark:bg-blue-900/40'
                                    : 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-150'
                              }`}>
                                {method.type === 'momo' ? (
                                  <Phone size={24} className={method.type === 'momo' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'} />
                                ) : (
                                  <Building size={24} className="text-blue-600 dark:text-blue-400" />
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {method.accountName}
                                  </p>
                                  {method.isVerified && (
                                    <div className="flex-shrink-0">
                                      <Check size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  {method.type === 'momo' 
                                    ? `${method.provider || 'Mobile Money'} • ${method.accountNumber}` 
                                    : `${method.bankName} • ${method.accountNumber}`}
                                </p>
                                {method.isDefault && (
                                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                    Primary Method
                                  </span>
                                )}
                              </div>

                              {/* Checkmark */}
                              <div className="flex-shrink-0 transition-all">
                                {selectedMethod?._id === method._id && (
                                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                                    <Check size={16} className="text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Add New Method */}
                      <button
                        onClick={() => {
                          setShowWithdrawalModal(false);
                          setShowAddMethodModal(true);
                        }}
                        className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/30 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        <span className="font-semibold text-sm">Add Another Method</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {withdrawalStep === 2 && selectedMethod && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Payout Method</p>
                    <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedMethod.accountName}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{selectedMethod.accountNumber}</p>
                      <button
                        onClick={() => setWithdrawalStep(1)}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-2 hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white mb-2 block">
                      Enter Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 dark:text-slate-400 text-sm">₵</span>
                      <input
                        type="number"
                        min="0"
                        max={stats.availableBalance}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        className="w-full pl-7 pr-12 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <button
                        onClick={() => setWithdrawalAmount(stats.availableBalance.toString())}
                        className="absolute right-2 top-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      Available: {formatCurrency(stats.availableBalance, merchantCurrency)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-900 dark:text-white mb-2 block">
                      Reason for Withdrawal (Optional)
                    </label>
                    <textarea
                      value={withdrawalReason}
                      onChange={(e) => setWithdrawalReason(e.target.value)}
                      placeholder="e.g., Monthly utility payment for North Campus"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  {withdrawalAmount_num > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg space-y-2 border border-slate-200 dark:border-slate-700">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Withdrawal Amount</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(withdrawalAmount_num, merchantCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Transaction Fee (1.5%)</span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          -{formatCurrency(fee, merchantCurrency)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">Total to be Disbursed</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                          {formatCurrency(totalToDisburse, merchantCurrency)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                    <Check size={16} />
                    <span>Secure end-to-end encryption</span>
                  </div>
                </div>
              )}

              {withdrawalStep === 3 && selectedMethod && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-4">Review Withdrawal Details</p>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Payout Method:</span>
                        <span className="text-sm font-bold text-blue-900 dark:text-blue-100">{selectedMethod.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Account:</span>
                        <span className="text-sm font-mono text-blue-900 dark:text-blue-100">{selectedMethod.accountNumber}</span>
                      </div>
                      <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Amount:</span>
                          <span className="text-sm font-bold text-blue-900 dark:text-blue-100">
                            {formatCurrency(withdrawalAmount_num, merchantCurrency)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Fee:</span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            -{formatCurrency(fee, merchantCurrency)}
                          </span>
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                          <span className="text-sm font-bold text-blue-900 dark:text-blue-100">You'll receive:</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(totalToDisburse, merchantCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {withdrawalReason && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Reason</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">{withdrawalReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex gap-3">
              <button
                onClick={() => {
                  if (withdrawalStep > 1) {
                    setWithdrawalStep(withdrawalStep - 1);
                  } else {
                    setShowWithdrawalModal(false);
                    resetWithdrawalForm();
                  }
                }}
                disabled={withdrawalLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {withdrawalStep > 1 ? 'Back' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (withdrawalStep < 3) {
                    if (withdrawalStep === 1 && !selectedMethod) {
                      toast.error('Please select a payment method');
                      return;
                    }
                    if (withdrawalStep === 2 && !withdrawalAmount) {
                      toast.error('Please enter an amount');
                      return;
                    }
                    setWithdrawalStep(withdrawalStep + 1);
                  } else {
                    handleRequestWithdrawal();
                  }
                }}
                disabled={withdrawalLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {withdrawalLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {withdrawalStep < 3 ? 'Next' : 'Confirm Withdrawal'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddMethodModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Add Payment Method</h2>
              <button
                onClick={() => setShowAddMethodModal(false)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Payment Type *
                </label>
                <select
                  value={methodFormData.type}
                  onChange={(e) => setMethodFormData({ ...methodFormData, type: e.target.value as any })}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="momo">Mobile Money (MoMo)</option>
                  <option value="bank">Bank Account</option>
                </select>
              </div>

              {methodFormData.type === 'momo' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Mobile Money Provider *
                  </label>
                  <select
                    value={methodFormData.provider}
                    onChange={(e) => setMethodFormData({ ...methodFormData, provider: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="Vodafone">Vodafone Cash</option>
                    <option value="AirtelTigo">AirtelTigo Money</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={methodFormData.accountName}
                  onChange={(e) => setMethodFormData({ ...methodFormData, accountName: e.target.value })}
                  placeholder="Your name or business name"
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {methodFormData.type === 'momo' ? 'Phone Number' : 'Account Number'} *
                </label>
                <input
                  type="text"
                  value={methodFormData.accountNumber}
                  onChange={(e) => setMethodFormData({ ...methodFormData, accountNumber: e.target.value })}
                  placeholder={methodFormData.type === 'momo' ? '0XXXXXXXXX' : 'Account number'}
                  className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {methodFormData.type === 'bank' && (
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={methodFormData.bankName}
                    onChange={(e) => setMethodFormData({ ...methodFormData, bankName: e.target.value })}
                    placeholder="e.g., Zenith Bank"
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex gap-3">
              <button
                onClick={() => setShowAddMethodModal(false)}
                disabled={methodLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPaymentMethod}
                disabled={methodLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {methodLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Add Method</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setMethodToDelete(null);
        }}
        onConfirm={confirmDeleteMethod}
        title="Delete Payment Method"
        message="Are you sure you want to delete this payment method? You won't be able to withdraw to this account."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
};

export default Wallet;