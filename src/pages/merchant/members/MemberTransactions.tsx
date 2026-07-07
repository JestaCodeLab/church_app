import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader,
  Coins,
  Download,
  Filter
} from 'lucide-react';
import { memberAPI } from '../../../services/api';
import { showToast } from '../../../utils/toasts';
import FeatureGate from '../../../components/access/FeatureGate';

const MemberTransactions = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [member, setMember] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchMember();
    if (id) {
      fetchTransactions();
    }
  }, [id]);

  const fetchMember = async () => {
    try {
      const response = await memberAPI.getMember(id);
      setMember(response.data.data?.member);
    } catch (error) {
      showToast.error('Failed to load member details');
      navigate('/members/all');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const response = await memberAPI.getMemberTransactions(id, {
        limit: 1000,
        page: 1
      });
      setTransactions(response.data.data?.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      showToast.error('Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleExportTransactions = () => {
    try {
      setIsExporting(true);

      const filtered = filterType === 'all'
        ? transactions
        : transactions.filter(tx => tx.transactionType === filterType);

      // Prepare CSV data
      const headers = ['Date', 'Type', 'Reference', 'Amount', 'Currency', 'Status', 'Payment Method'];
      const rows = filtered.map(tx => [
        new Date(tx.transactionDate).toLocaleDateString('en-US'),
        tx.transactionType?.replace(/_/g, ' ').toUpperCase() || 'N/A',
        tx.event?.title || tx.campaign?.name || tx.programme?.name || '-',
        tx.amount || 0,
        tx.currency || 'GHS',
        tx.status?.charAt(0).toUpperCase() + tx.status?.slice(1) || 'N/A',
        tx.paymentMethod || 'N/A'
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `member_transactions_${member.memberId || id}_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.success('Transactions exported successfully');
    } catch (error) {
      showToast.error('Failed to export transactions');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(tx => tx.transactionType === filterType);

  const transactionTypes = Array.from(
    new Set(transactions.map(tx => tx.transactionType))
  ).sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (!member) return null;

  return (
    <FeatureGate feature={'memberManagement'}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(`/members/${id}`)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Back to Member Details"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {member.firstName} {member.lastName} - Transactions
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    View all member transactions including offerings, tithes, and project funding
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {filteredTransactions.length > 0 && (
                <button
                  onClick={handleExportTransactions}
                  disabled={isExporting}
                  className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-8xl mx-auto px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {transactions.length}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {transactions.filter(tx => tx.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">
                    {transactions.filter(tx => tx.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'GHS'
                    }).format(
                      transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filter by Type</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Transactions
              </button>
              {transactionTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type?.replace(/_/g, ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Transactions ({filteredTransactions.length})
              </h3>
            </div>

            {transactionsLoading ? (
              <div className="p-6 flex items-center justify-center">
                <Loader className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTransactions.map((transaction: any) => (
                      <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                            {transaction.transactionType === 'partnership_contribution' && 'Partnership'}
                            {transaction.transactionType !== 'partnership_contribution' &&
                              transaction.transactionType?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            {transaction.event?.title && (
                              <p className="font-medium">{transaction.event.title}</p>
                            )}
                            {transaction.programme?.name && (
                              <p className="font-medium">{transaction.programme.name}</p>
                            )}
                            {transaction.tier?.name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Tier: {transaction.tier.name}</p>
                            )}
                            {!transaction.event?.title && !transaction.programme?.name && (
                              <p className="text-gray-500 dark:text-gray-400">-</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: transaction.currency || 'GHS'
                          }).format(transaction.amount || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : transaction.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : transaction.status === 'failed'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {transaction.paymentMethod || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Coins className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filterType === 'all' ? 'No transactions found' : `No ${filterType?.replace(/_/g, ' ')} transactions found`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FeatureGate>
  );
};

export default MemberTransactions;
