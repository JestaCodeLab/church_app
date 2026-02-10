import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api, { adminAPI } from '../../services/api';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';

interface Transaction {
  _id: string;
  type: string;
  transactionType: string;
  amount: number;
  currency: string;
  status: string;
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  memberId: string | null;
  paymentMethod: string;
  paymentReference: string;
  transactionId: string;
  campaign?: string;
  event?: string;
  programme?: string;
  tier?: string;
  plan?: string;
  transactionDate: string;
  createdAt: string;
  description?: string;
}

interface Summary {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  byType: Record<string, { count: number; amount: number }>;
  byPaymentMethod: Record<string, { count: number; amount: number }>;
  byStatus: Record<string, { count: number; amount: number }>;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const TransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [merchants, setMerchants] = useState<Array<{ _id: string; name: string; subdomain: string }>>([]);
  const [merchantFilter, setMerchantFilter] = useState('');

  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await adminAPI.getAllMerchants({ limit: 500, status: 'active' });
        setMerchants(res.data.data.merchants || []);
      } catch (error) {
        console.error('Failed to fetch merchants:', error);
      }
    };
    fetchMerchants();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, statusFilter, typeFilter, paymentMethodFilter, startDate, endDate, merchantFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { transactionType: typeFilter }),
        ...(paymentMethodFilter && { paymentMethod: paymentMethodFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(merchantFilter && { merchant: merchantFilter })
      });

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.data.transactions);
      setSummary(res.data.data.summary);
      setPagination(res.data.data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { transactionType: typeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(merchantFilter && { merchant: merchantFilter })
      });

      window.open(`${api.defaults.baseURL}/transactions/export?${params}`, '_blank');
    } catch (error) {
      console.error('Failed to export transactions:', error);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setPaymentMethodFilter('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setMerchantFilter('');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor all financial transactions across the platform
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchTransactions()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {summary.totalTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {summary.completedTransactions.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending/Failed</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {(summary.pendingTransactions + summary.failedTransactions).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <ArrowDownRight className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, reference, member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Church Filter */}
            {merchants.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Church
                </label>
                <select
                  value={merchantFilter}
                  onChange={(e) => {
                    setMerchantFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">All Churches (Platform-wide)</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.subdomain})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="campaign_donation">Campaign Donation</option>
                <option value="event_donation">Event Donation</option>
                <option value="partnership_payment">Partnership Payment</option>
                <option value="subscription">Subscription</option>
                <option value="sms_credit">SMS Credit</option>
                <option value="offering">Offering</option>
                <option value="tithe">Tithe</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">All Methods</option>
                <option value="paystack">Paystack</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="manual">Manual</option>
                <option value="cash">Cash</option>
                <option value="momo">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.paymentReference || transaction.transactionId}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.paymentMethod.toUpperCase()}
                          </p>
                          {transaction.campaign && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {transaction.campaign}
                            </p>
                          )}
                          {transaction.event && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              {transaction.event}
                            </p>
                          )}
                          {transaction.programme && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              {transaction.programme}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.payerName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.payerEmail}
                          </p>
                          {transaction.memberId && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {transaction.memberId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {getTypeLabel(transaction.transactionType)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.type.replace('_', ' ')}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(transaction.transactionDate), 'HH:mm')}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-1 text-sm text-gray-700 dark:text-gray-300">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.transactionId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Reference</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.paymentReference || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                      selectedTransaction.status
                    )}`}
                  >
                    {selectedTransaction.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payer Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.payerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payer Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.payerEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payer Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.payerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member ID</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.memberId || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {getTypeLabel(selectedTransaction.transactionType)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedTransaction.paymentMethod.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transaction Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(selectedTransaction.transactionDate), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Created At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {format(new Date(selectedTransaction.createdAt), 'PPpp')}
                  </p>
                </div>
                {selectedTransaction.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
