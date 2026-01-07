import React, { useEffect, useState } from 'react';
import { Loader, TrendingUp, TrendingDown, Download, Plus, Search, MoreVertical, Eye, EyeOff, Inbox } from 'lucide-react';
import { financeAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';

interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  vendor?: string;
  source?: string;
  status: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  tithe: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-400', dot: 'bg-blue-500' },
  offering: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-400', dot: 'bg-green-500' },
  fundraising: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-800 dark:text-purple-400', dot: 'bg-purple-500' },
  donation: { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-800 dark:text-pink-400', dot: 'bg-pink-500' },
  grants: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-800 dark:text-indigo-400', dot: 'bg-indigo-500' },
  utilities: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-400', dot: 'bg-orange-500' },
  maintenance: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-800 dark:text-amber-400', dot: 'bg-amber-500' },
  supplies: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-400', dot: 'bg-yellow-500' },
  payroll: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-400', dot: 'bg-red-500' },
  rent: { bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-800 dark:text-cyan-400', dot: 'bg-cyan-500' },
  insurance: { bg: 'bg-teal-100 dark:bg-teal-900/20', text: 'text-teal-800 dark:text-teal-400', dot: 'bg-teal-500' },
  transportation: { bg: 'bg-lime-100 dark:bg-lime-900/20', text: 'text-lime-800 dark:text-lime-400', dot: 'bg-lime-500' },
  events: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/20', text: 'text-fuchsia-800 dark:text-fuchsia-400', dot: 'bg-fuchsia-500' },
};

const Transactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'donation'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      if (filterType === 'donation') {
        filtered = filtered.filter(t => (t.type === 'income' && t.category === 'donation') || (t.type === 'expense' && t.category === 'donation'));
      } else {
        filtered = filtered.filter(t => t.type === filterType);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(dateRange.end));
    }

    setFilteredTransactions(filtered);
    setPage(1);
  }, [transactions, searchQuery, filterType, dateRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([financeAPI.income.getAll(), financeAPI.expenses.getAll()]);

      const incomeArray = Array.isArray(incomeRes.data.data) ? incomeRes.data.data : incomeRes.data.data?.income || [];
      const expenseArray = Array.isArray(expenseRes.data.data) ? expenseRes.data.data : expenseRes.data.data?.expenses || [];

      const incomeData = incomeArray.map((inc: any) => ({
        _id: inc._id,
        type: 'income' as const,
        amount: inc.amount,
        category: inc.category,
        date: inc.date,
        description: inc.source,
        source: inc.source,
        status: inc.status,
      }));

      const expenseData = expenseArray.map((exp: any) => ({
        _id: exp._id,
        type: 'expense' as const,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        description: exp.vendor,
        vendor: exp.vendor,
        status: exp.status,
      }));

      const combined = [...incomeData, ...expenseData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(combined);

      const incomeTotal = incomeData.reduce((sum, t) => sum + t.amount, 0);
      const expenseTotal = expenseData.reduce((sum, t) => sum + t.amount, 0);
      setTotalIncome(incomeTotal);
      setTotalExpenses(expenseTotal);
    } catch (err) {
      toast.error('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const formatCurrencyValue = (value: number) => formatCurrency(value, getMerchantCurrency());
  const netBalance = totalIncome - totalExpenses;
  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] || { bg: 'bg-gray-100 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-400', dot: 'bg-gray-500' };

  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleExport = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status'],
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.amount,
        t.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View, filter, and manage all your financial activity.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Income</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">{formatCurrencyValue(totalIncome)}</p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-2 font-semibold">+12%</p>
            </div>
            <div className="bg-green-200 dark:bg-green-800/40 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-2">{formatCurrencyValue(totalExpenses)}</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-2 font-semibold">+5%</p>
            </div>
            <div className="bg-red-200 dark:bg-red-800/40 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Net Savings</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">{formatCurrencyValue(netBalance)}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2 font-semibold">+22%</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800/40 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Donations */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Donations</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">${filteredTransactions.filter(t => t.category === 'donation').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
              <p className="text-xs text-purple-600 dark:text-purple-300 mt-2 font-semibold">0%</p>
            </div>
            <div className="bg-purple-200 dark:bg-purple-800/40 p-3 rounded-lg">
              <Plus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          {/* Search Bar */}
          <div className="flex-1 min-w-0 relative max-w-sm">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by description, merchant..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
            />
          </div>

          {/* Date Range Filter */}
          <div className="flex gap-2 items-center">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <button 
              onClick={() => setDateRange({ start: '', end: '' })}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
            >
              Reset
            </button>
          </div>

          {/* Filter Type Buttons */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'income', 'expense', 'donation'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {paginatedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold"><input type="checkbox" className="rounded" /></th>
                    <th className="text-left py-4 px-4 font-semibold">DATE</th>
                    <th className="text-left py-4 px-4 font-semibold">DESCRIPTION</th>
                    <th className="text-left py-4 px-4 font-semibold">CATEGORY</th>
                    <th className="text-left py-4 px-4 font-semibold">TYPE</th>
                    <th className="text-right py-4 px-4 font-semibold">AMOUNT</th>
                    <th className="text-center py-4 px-4 font-semibold">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => {
                    const colors = getCategoryColor(transaction.category);
                    return (
                      <tr key={`${transaction.type}-${transaction._id}`} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-4"><input type="checkbox" className="rounded" /></td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-gray-900 dark:text-white font-medium">{transaction.description}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                            <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
                            {transaction.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrencyValue(transaction.amount)}
                        </td>
                        <td className="py-4 px-4 text-center relative">
                          <button 
                            onClick={() => setActionMenuId(actionMenuId === transaction._id ? null : transaction._id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </button>
                          {actionMenuId === transaction._id && (
                            <div className="absolute right-0 top-8 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">View Details</button>
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600">Edit</button>
                              <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
