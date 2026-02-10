import React, { useEffect, useState, useMemo } from 'react';
import {
  Loader,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Search,
  Inbox,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { financeAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface OverviewData {
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    pendingApprovals: number;
  };
  thisMonth: { income: number; expenses: number; net: number };
  thisYear: { income: number; expenses: number; net: number };
  categories: {
    income: { _id: string; amount: number; count: number }[];
    expenses: { _id: string; amount: number; count: number }[];
  };
  recentTransactions: any[];
  bestMonth: { _id: { year: number; month: number }; total: number } | null;
}

interface TrendItem {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

const DATE_PRESETS = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: 'YTD', months: 0 },
  { label: '1Y', months: 12 },
  { label: 'All', months: 36 },
];

const CATEGORY_COLORS: Record<string, string> = {
  tithe: '#3B82F6',
  offering: '#10B981',
  fundraising: '#8B5CF6',
  donation: '#EC4899',
  grants: '#6366F1',
  utilities: '#F97316',
  maintenance: '#F59E0B',
  supplies: '#EAB308',
  payroll: '#EF4444',
  rent: '#06B6D4',
  insurance: '#14B8A6',
  transportation: '#84CC16',
  events: '#D946EF',
};

const FinanceOverview: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('1Y');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchOverview();
    fetchTrends(12);
    fetchTransactions();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await financeAPI.getOverview();
      setOverview(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch finance overview');
    }
  };

  const fetchTrends = async (months: number, startDate?: string, endDate?: string) => {
    try {
      setTrendsLoading(true);
      const params: any = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.months = months;
      }
      const res = await financeAPI.getTrends(params);
      setTrends(res.data.data);
    } catch (err) {
      console.error('Failed to fetch trends', err);
    } finally {
      setTrendsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const [incomeRes, expenseRes] = await Promise.all([
        financeAPI.income.getAll(),
        financeAPI.expenses.getAll(),
      ]);

      const incomeArray = Array.isArray(incomeRes.data.data) ? incomeRes.data.data : incomeRes.data.data?.income || [];
      const expenseArray = Array.isArray(expenseRes.data.data) ? expenseRes.data.data : expenseRes.data.data?.expenses || [];

      const incomeData = incomeArray.map((inc: any) => ({
        _id: inc._id,
        type: 'income' as const,
        amount: inc.amount,
        category: inc.category,
        date: inc.date,
        description: inc.source,
        status: inc.status,
      }));

      const expenseData = expenseArray.map((exp: any) => ({
        _id: exp._id,
        type: 'expense' as const,
        amount: exp.amount,
        category: exp.category,
        date: exp.date,
        description: exp.vendor,
        status: exp.status,
      }));

      const combined = [...incomeData, ...expenseData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(combined);
    } catch (err) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (label: string, months: number) => {
    setActivePreset(label);
    setCustomRange({ start: '', end: '' });

    if (label === 'YTD') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
      const now = new Date().toISOString();
      fetchTrends(0, yearStart, now);
    } else {
      fetchTrends(months);
    }
  };

  const handleCustomRange = () => {
    if (customRange.start && customRange.end) {
      setActivePreset('');
      fetchTrends(0, customRange.start, customRange.end);
    }
  };

  const currency = getMerchantCurrency();
  const fmt = (val: number) => formatCurrency(val, currency);

  // Compute effective date range from preset or custom range for transaction filtering
  const effectiveDates = useMemo(() => {
    if (customRange.start && customRange.end && !activePreset) {
      return { start: customRange.start, end: customRange.end };
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (activePreset) {
      case '3M': return { start: new Date(y, m - 3, 1).toISOString().split('T')[0], end: '' };
      case '6M': return { start: new Date(y, m - 6, 1).toISOString().split('T')[0], end: '' };
      case 'YTD': return { start: new Date(y, 0, 1).toISOString().split('T')[0], end: '' };
      case '1Y': return { start: new Date(y - 1, m, 1).toISOString().split('T')[0], end: '' };
      default: return { start: '', end: '' };
    }
  }, [activePreset, customRange]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        t =>
          t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (effectiveDates.start) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(effectiveDates.start));
    }
    if (effectiveDates.end) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(effectiveDates.end));
    }
    return filtered;
  }, [transactions, filterType, searchQuery, effectiveDates]);

  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Category bar data
  const incomeCategoryData = useMemo(() => {
    return (overview?.categories?.income || []).map(c => ({
      category: c._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: c.amount,
      count: c.count,
      color: CATEGORY_COLORS[c._id] || '#6B7280',
    }));
  }, [overview]);

  const expenseCategoryData = useMemo(() => {
    return (overview?.categories?.expenses || []).map(c => ({
      category: c._id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      amount: c.amount,
      count: c.count,
      color: CATEGORY_COLORS[c._id] || '#6B7280',
    }));
  }, [overview]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount', 'Status'],
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.description,
        t.category,
        t.type,
        t.amount,
        t.status,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const kpis = overview?.kpis;
  const thisMonth = overview?.thisMonth;
  const thisYear = overview?.thisYear;

  // Month-over-month change indicator (approximate from trend data)
  const lastTwoMonths = trends.slice(-2);
  const prevMonthIncome = lastTwoMonths.length === 2 ? lastTwoMonths[0].income : 0;
  const currMonthIncome = lastTwoMonths.length >= 1 ? lastTwoMonths[lastTwoMonths.length - 1].income : 0;
  const incomeChange = prevMonthIncome > 0 ? ((currMonthIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;

  const prevMonthExpense = lastTwoMonths.length === 2 ? lastTwoMonths[0].expenses : 0;
  const currMonthExpense = lastTwoMonths.length >= 1 ? lastTwoMonths[lastTwoMonths.length - 1].expenses : 0;
  const expenseChange = prevMonthExpense > 0 ? ((currMonthExpense - prevMonthExpense) / prevMonthExpense) * 100 : 0;

  const chartTooltipFormatter = (value: number) => fmt(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track income, expenses, and financial trends
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => navigate('/finance/tithing')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="h-4 w-4" />
            Record Income
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700">
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex gap-1">
          {DATE_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handlePresetChange(preset.label, preset.months)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activePreset === preset.label
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        <input
          type="date"
          value={customRange.start}
          onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={customRange.end}
          onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={handleCustomRange}
          className="px-2.5 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          Apply
        </button>
        {(customRange.start || customRange.end) && !activePreset && (
          <button
            onClick={() => { setCustomRange({ start: '', end: '' }); handlePresetChange('1Y', 12); }}
            className="ml-auto px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* This Month Income */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            {incomeChange !== 0 && (
              <span className={`flex items-center text-xs font-medium ${incomeChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(incomeChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(thisMonth?.income || 0)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Income this month</p>
        </div>

        {/* This Month Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            {expenseChange !== 0 && (
              <span className={`flex items-center text-xs font-medium ${expenseChange <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {expenseChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                {Math.abs(expenseChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(thisMonth?.expenses || 0)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Expenses this month</p>
        </div>

        {/* Net Balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${(thisMonth?.net || 0) >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {fmt(thisMonth?.net || 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Net this month</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpis?.pendingApprovals || 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pending approvals</p>
        </div>
      </div>

      {/* Year-to-Date Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white">
          <p className="text-sm font-medium text-green-100">YTD Income</p>
          <p className="text-xl font-bold mt-1">{fmt(thisYear?.income || 0)}</p>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-5 text-white">
          <p className="text-sm font-medium text-red-100">YTD Expenses</p>
          <p className="text-xl font-bold mt-1">{fmt(thisYear?.expenses || 0)}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <p className="text-sm font-medium text-blue-100">YTD Net</p>
          <p className="text-xl font-bold mt-1">{fmt(thisYear?.net || 0)}</p>
        </div>
      </div>

      {/* Revenue Trend Area Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trend</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Income vs Expenses over time</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 rounded-full inline-block" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-red-500 rounded-full inline-block" /> Expenses</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 rounded-full inline-block border-dashed" style={{ borderTop: '2px dashed #3B82F6', height: 0 }} /> Net</span>
          </div>
        </div>

        {trendsLoading ? (
          <div className="flex items-center justify-center h-[350px]">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={trends} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:opacity-20" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-gray-500"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
                  return v;
                }}
                className="text-gray-500"
              />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#expenseGradient)"
              />
              <Area
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#netGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-gray-400">
            <p>No trend data available for this period</p>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {(incomeCategoryData.length > 0 || expenseCategoryData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income by Category */}
          {incomeCategoryData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Income by Category (YTD)</h3>
              <div className="space-y-3">
                {incomeCategoryData.map((item, i) => {
                  const maxAmount = Math.max(...incomeCategoryData.map(c => c.amount));
                  const pct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmt(item.amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses by Category */}
          {expenseCategoryData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category (YTD)</h3>
              <div className="space-y-3">
                {expenseCategoryData.map((item, i) => {
                  const maxAmount = Math.max(...expenseCategoryData.map(c => c.amount));
                  const pct = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{item.category}</span>
                        <span className="font-medium text-gray-900 dark:text-white">{fmt(item.amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 w-48"
                />
              </div>
              {/* Filter pills */}
              <div className="flex gap-1">
                {(['all', 'income', 'expense'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => { setFilterType(type); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {paginatedTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</th>
                    <th className="text-right py-3 px-5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {paginatedTransactions.map(transaction => (
                    <tr key={`${transaction.type}-${transaction._id}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3.5 px-5 text-gray-600 dark:text-gray-300">
                        {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-5 text-gray-900 dark:text-white font-medium">
                        {transaction.description || '-'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[transaction.category] || '#6B7280'}15`,
                            color: CATEGORY_COLORS[transaction.category] || '#6B7280',
                          }}
                        >
                          {transaction.category?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{fmt(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center">
            <Inbox className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceOverview;
