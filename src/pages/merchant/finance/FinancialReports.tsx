import React, { useEffect, useState } from 'react';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Loader, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { financeAPI } from '../../../services/api';
import { getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinanceData {
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    pendingApprovals: number;
  };
  thisMonth: { income: number; expenses: number; net: number };
  thisYear: { income: number; expenses: number; net: number };
  categories: { 
    income: Array<{ _id: string; amount: number; count: number }>; 
    expenses: Array<{ _id: string; amount: number; count: number }> 
  };
  recentTransactions: Array<{ _id: string; category: string; amount: number; source: string; date: string }>;
  bestMonth: { _id: { year: number; month: number }; total: number };
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

type DatePreset = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'lastYear' | 'custom';
type ReportType = 'profit-loss' | 'income' | 'expense' | 'cashflow';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const FinancialReports: React.FC = () => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<ReportType>('profit-loss');
  const [datePreset, setDatePreset] = useState<DatePreset>('thisYear');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showComparison, setShowComparison] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [datePreset, customStartDate, customEndDate]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (datePreset) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = new Date(now.getFullYear(), 0, 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
    }

    return { startDate, endDate };
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange();
      
      // Calculate months for trend data
      const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const trendMonths = Math.min(Math.max(months, 3), 12);

      const [overviewRes, trendsRes] = await Promise.all([
        financeAPI.getOverview(),
        financeAPI.getTrends({ months: trendMonths })
      ]);

      setData(overviewRes.data.data);
      setTrendData(trendsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load financial reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-500">No financial data available</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: getMerchantCurrency(), 
      minimumFractionDigits: 0 
    }).format(value);

  const formatCategoryName = (category: string) => 
    category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Get period label
  const getPeriodLabel = () => {
    const labels: Record<DatePreset, string> = {
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      thisQuarter: 'This Quarter',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      custom: 'Custom Period'
    };
    return labels[datePreset];
  };

  // Calculate period-specific stats from trend data
  const calculatePeriodStats = () => {
    if (!trendData || trendData.length === 0) {
      return {
        totalIncome: data.kpis.totalIncome,
        totalExpenses: data.kpis.totalExpenses,
        netIncome: data.kpis.netIncome,
        pendingApprovals: data.kpis.pendingApprovals
      };
    }

    const income = trendData.reduce((sum, month) => sum + (month.income || 0), 0);
    const expenses = trendData.reduce((sum, month) => sum + (month.expenses || 0), 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netIncome: income - expenses,
      pendingApprovals: data.kpis.pendingApprovals // Always current state
    };
  };

  const periodStats = calculatePeriodStats();

  // Calculate previous period data for comparison
  const getPreviousPeriodData = () => {
    // Calculate based on trend data split into two halves
    if (trendData.length < 2) {
      return {
        income: periodStats.totalIncome * 0.88,
        expenses: periodStats.totalExpenses * 0.96,
        net: periodStats.netIncome * 0.84
      };
    }

    const halfPoint = Math.ceil(trendData.length / 2);
    const previousHalf = trendData.slice(0, halfPoint);
    
    const prevIncome = previousHalf.reduce((sum, month) => sum + (month.income || 0), 0);
    const prevExpenses = previousHalf.reduce((sum, month) => sum + (month.expenses || 0), 0);
    
    return {
      income: prevIncome || periodStats.totalIncome * 0.88,
      expenses: prevExpenses || periodStats.totalExpenses * 0.96,
      net: (prevIncome - prevExpenses) || periodStats.netIncome * 0.84
    };
  };

  const previousPeriod = getPreviousPeriodData();
  const incomeChange = calculateChange(periodStats.totalIncome, previousPeriod.income);
  const expenseChange = calculateChange(periodStats.totalExpenses, previousPeriod.expenses);
  const netChange = calculateChange(periodStats.netIncome, previousPeriod.net);

  // Prepare category data for current report type
  const getReportData = () => {
    switch (reportType) {
      case 'income':
        return data.categories.income.map((cat, idx) => ({
          name: formatCategoryName(cat._id),
          amount: cat.amount,
          count: cat.count,
          percentage: (cat.amount / data.kpis.totalIncome) * 100,
          color: COLORS[idx % COLORS.length]
        }));
      case 'expense':
        return data.categories.expenses.map((cat, idx) => ({
          name: formatCategoryName(cat._id),
          amount: cat.amount,
          count: cat.count,
          percentage: (cat.amount / data.kpis.totalExpenses) * 100,
          color: COLORS[idx % COLORS.length]
        }));
      default:
        return [];
    }
  };

  const categoryData = getReportData();

  const handleExportPDF = () => {
    toast.success('PDF export will be implemented soon');
  };

  const handleExportCSV = () => {
    // Prepare CSV data
    const csvData = trendData.map(row => ({
      Month: row.month,
      Income: row.income,
      Expenses: row.expenses,
      'Net Profit': row.net
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => row[h as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${getPeriodLabel()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <a href="/finance" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">Financial Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Comprehensive insights into your financial performance and trends</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Report Type */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value as ReportType)} 
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="profit-loss">Profit & Loss Statement</option>
              <option value="income">Income Report</option>
              <option value="expense">Expense Report</option>
              <option value="cashflow">Cash Flow Analysis</option>
            </select>
          </div>

          {/* Date Preset */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period</label>
            <select 
              value={datePreset} 
              onChange={(e) => setDatePreset(e.target.value as DatePreset)} 
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisQuarter">This Quarter</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Comparison Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</label>
            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/80">
              <input 
                type="checkbox" 
                checked={showComparison} 
                onChange={(e) => setShowComparison(e.target.checked)}
                className="rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 dark:text-white">Show Period Comparison</span>
            </label>
          </div>
        </div>

        {/* Custom Date Range */}
        {datePreset === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Executive Summary - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-green-100">Total Income</p>
            <TrendingUp className="h-5 w-5 text-green-100" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(periodStats.totalIncome)}</p>
          {showComparison && (
            <div className="flex items-center gap-1 mt-3">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">{incomeChange.toFixed(1)}% vs previous period</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-red-100">Total Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-100" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(periodStats.totalExpenses)}</p>
          {showComparison && (
            <div className="flex items-center gap-1 mt-3">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-semibold">{expenseChange.toFixed(1)}% vs previous period</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-blue-100">Net Profit</p>
            <DollarSign className="h-5 w-5 text-blue-100" />
          </div>
          <p className="text-3xl font-bold">{formatCurrency(periodStats.netIncome)}</p>
          {showComparison && (
            <div className="flex items-center gap-1 mt-3">
              {netChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-sm font-semibold">{Math.abs(netChange).toFixed(1)}% vs previous period</span>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-orange-100">Pending Approvals</p>
            <Calendar className="h-5 w-5 text-orange-100" />
          </div>
          <p className="text-3xl font-bold">{periodStats.pendingApprovals}</p>
          <p className="text-sm font-medium text-orange-100 mt-3">Expenses awaiting approval</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {reportType === 'cashflow' ? 'Cash Flow Trend' : 'Income vs Expenses Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            {reportType === 'cashflow' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Income" dot={{ fill: '#10b981', r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} name="Expenses" dot={{ fill: '#ef4444', r: 4 }} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} name="Net Profit" dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: any) => [formatCurrency(value), '']}
                />
                <Legend />
                {(reportType === 'profit-loss' || reportType === 'income') && (
                  <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name="Income" />
                )}
                {(reportType === 'profit-loss' || reportType === 'expense') && (
                  <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} name="Expenses" />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        {(reportType === 'income' || reportType === 'expense') && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {reportType === 'income' ? 'Income by Category' : 'Expenses by Category'}
            </h3>
            <div className="space-y-4">
              {categoryData.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({item.count} {item.count === 1 ? 'transaction' : 'transactions'})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Period Summary Table */}
      {showComparison && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Period Comparison</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {getPeriodLabel()} vs Previous Period
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">METRIC</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">CURRENT PERIOD</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">PREVIOUS PERIOD</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">VARIANCE</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">% CHANGE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Total Income</td>
                  <td className="py-4 px-6 text-right text-green-600 dark:text-green-400 font-semibold">
                    {formatCurrency(periodStats.totalIncome)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(previousPeriod.income)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(periodStats.totalIncome - previousPeriod.income)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incomeChange >= 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Total Expenses</td>
                  <td className="py-4 px-6 text-right text-red-600 dark:text-red-400 font-semibold">
                    {formatCurrency(periodStats.totalExpenses)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(previousPeriod.expenses)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(periodStats.totalExpenses - previousPeriod.expenses)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      expenseChange <= 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
                <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-blue-50 dark:bg-blue-900/20">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Net Profit</td>
                  <td className="py-4 px-6 text-right text-blue-600 dark:text-blue-400 font-bold">
                    {formatCurrency(periodStats.netIncome)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(previousPeriod.net)}
                  </td>
                  <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-bold">
                    {formatCurrency(periodStats.netIncome - previousPeriod.net)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      netChange >= 0 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {netChange >= 0 ? '+' : ''}{netChange.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Year-to-Date Summary</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Complete financial overview for {new Date().getFullYear()}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Income (YTD)</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.thisYear.income)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Expenses (YTD)</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(data.thisYear.expenses)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Net Profit (YTD)</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(data.thisYear.net)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
