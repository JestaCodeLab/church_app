import React, { useEffect, useState } from 'react';
import { Download, Filter, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon, BarChart3, Loader } from 'lucide-react';
import { financeAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const FinancialReports: React.FC = () => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'income' | 'expense' | 'summary'>('summary');
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('year');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getOverview();
      setData(response.data.data);
    } catch (err) {
      toast.error('Failed to load financial reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  if (!data) {
    return <div className="flex flex-col items-center justify-center h-96"><PieChartIcon className="h-16 w-16 text-gray-400 mb-4" /><p className="text-gray-500">No data available</p></div>;
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  // Prepare chart data - 12 months trend
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      name: date.toLocaleDateString('default', { month: 'short' }),
      income: Math.random() * 50000 + 10000,
      expenses: Math.random() * 30000 + 5000,
    };
  });

  // Income breakdown
  const incomeBreakdown = data.categories.income.map((cat) => ({
    name: cat._id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: cat.amount,
  }));

  // Expense breakdown
  const expenseBreakdown = data.categories.expenses.slice(0, 6).map((cat) => ({
    name: cat._id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: cat.amount,
  }));

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <a href="/finance" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 dark:text-white font-medium">Financial Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Generate detailed insights into your performance, cash flow, and projections.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="summary">Profit & Loss (Income Statement)</option>
            <option value="income">Income Report</option>
            <option value="expense">Expense Report</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="month">This Month (Oct 2023)</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Comparison:</label>
          <select className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option>Previous Period</option>
            <option>Last Year</option>
            <option>Budget</option>
          </select>
        </div>
        <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
          <Filter className="h-4 w-4 inline mr-2" />
          Update
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.kpis.totalIncome)}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-3">+12.5% vs last period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.kpis.totalExpenses)}</p>
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-3">+4.2% vs last period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.kpis.netIncome)}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-3">+21.8% margin</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Var.</p>
            <BarChart3 className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">-$1,200.00</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-3">1.4% over budget</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Income Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Income Sources</h3>
          <div className="space-y-3">
            {incomeBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{((item.value / data.kpis.totalIncome) * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cumulative Net Profit Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cumulative Net Profit</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData.map((m) => ({ ...m, net: m.income - m.expenses }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(value) => formatCurrency(value as number)} />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Period Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">METRIC</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">THIS PERIOD</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">PREVIOUS PERIOD</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">VARIANCE</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">% CHANGE</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Total Income</td>
                <td className="py-4 px-6 text-right text-green-600 dark:text-green-400 font-semibold">{formatCurrency(data.thisMonth.income)}</td>
                <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">{formatCurrency(data.thisMonth.income * 0.89)}</td>
                <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-semibold">{formatCurrency(data.thisMonth.income * 0.11)}</td>
                <td className="py-4 px-6 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">+12.5%</span></td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Total Expenses</td>
                <td className="py-4 px-6 text-right text-red-600 dark:text-red-400 font-semibold">{formatCurrency(data.thisMonth.expenses)}</td>
                <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">{formatCurrency(data.thisMonth.expenses * 0.96)}</td>
                <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-semibold">{formatCurrency(data.thisMonth.expenses * 0.04)}</td>
                <td className="py-4 px-6 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">+4.2%</span></td>
              </tr>
              <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-blue-50 dark:bg-blue-900/20">
                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">Net Profit</td>
                <td className="py-4 px-6 text-right text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(data.thisMonth.net)}</td>
                <td className="py-4 px-6 text-right text-gray-600 dark:text-gray-400">{formatCurrency(data.thisMonth.net * 0.84)}</td>
                <td className="py-4 px-6 text-right text-gray-900 dark:text-white font-bold">{formatCurrency(data.thisMonth.net * 0.16)}</td>
                <td className="py-4 px-6 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">+21.8%</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
