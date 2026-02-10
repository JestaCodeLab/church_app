import React, { useEffect, useState } from 'react';
import { Trash2, Edit2, Plus, Loader, Download, Search, Inbox, Check, AlertCircle, DollarSign, BarChart3, TrendingDown, ThumbsUp, X, Filter, ChevronDown, CheckCircle2, Clock, MessageSquare, AlertTriangle, History, Calendar } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { financeAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import PermissionGuard from '../../../components/guards/PermissionGuard';

interface Expense {
  _id: string;
  category: string;
  amount: number;
  vendor: string;
  date: string;
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  receipt?: string;
  notes?: string;
  approvalNotes?: string;
  approvalDate?: string;
}

const EXPENSE_CATEGORIES = ['utilities', 'maintenance', 'supplies', 'payroll', 'rent', 'insurance', 'transportation', 'events', 'ministry', 'facilities', 'professional_fees', 'technology', 'other'];
const PAYMENT_METHODS = ['cash', 'cheque', 'bank_transfer', 'mobile_money', 'card', 'other'];

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalApprovedAmount, setTotalApprovedAmount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [formData, setFormData] = useState({ category: '', amount: '', vendor: '', date: '', paymentMethod: 'bank_transfer', description: '', notes: '' });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.expenses.getAll();
      const data = response.data.data || [];
      setExpenses(Array.isArray(data) ? data : data.expenses || []);
      // Get total approved amount from API
      if (response.data.totalApprovedAmount !== undefined) {
        setTotalApprovedAmount(response.data.totalApprovedAmount);
      }
    } catch (err) {
      toast.error('Failed to fetch expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({ category: '', amount: '', vendor: '', date: '', paymentMethod: 'bank_transfer', description: '', notes: '' });
    setShowModal(true);
  };

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense._id);
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      vendor: expense.vendor,
      date: expense.date.split('T')[0],
      paymentMethod: expense.paymentMethod,
      description: expense.notes || '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.vendor || !formData.date || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const payload = { 
        category: formData.category, 
        amount: parseFloat(formData.amount), 
        vendor: formData.vendor, 
        date: formData.date, 
        paymentMethod: formData.paymentMethod, 
        description: formData.description,
        notes: formData.notes 
      };
      if (editingId) {
        await financeAPI.expenses.update(editingId, payload);
        toast.success('Expense updated');
      } else {
        await financeAPI.expenses.create(payload);
        toast.success('Expense created');
      }
      setShowModal(false);
      setSubmitting(false);
      fetchExpenses();
    } catch (err) {
      toast.error(editingId ? 'Failed to update expense' : 'Failed to create expense');
      console.error(err);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      await financeAPI.expenses.delete(id);
      toast.success('Expense deleted');
      setDeletingId(null);
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete expense');
      console.error(err);
      setDeletingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setIsApproving(true);
      await financeAPI.expenses.approve(id, approvalNotes);
      toast.success('Expense approved');
      setApprovingId(null);
      setApprovalNotes('');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to approve expense');
      console.error(err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setIsRejecting(true);
      await financeAPI.expenses.reject(id, approvalNotes);
      toast.success('Expense rejected');
      setRejectingId(null);
      setApprovalNotes('');
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to reject expense');
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Calculate metrics
  const thisMonthExpenses = expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    // Search filter
    const matchesSearch = e.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !filterCategory || e.category === filterCategory;
    
    // Status filter
    const matchesStatus = !filterStatus || e.status === filterStatus;
    
    // Payment method filter
    const matchesPaymentMethod = !filterPaymentMethod || e.paymentMethod === filterPaymentMethod;
    
    // Date range filter
    const expenseDate = new Date(e.date);
    const matchesDateFrom = !filterDateFrom || expenseDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || expenseDate <= new Date(filterDateTo);
    
    // Amount range filter
    const matchesAmountMin = !filterAmountMin || e.amount >= parseFloat(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || e.amount <= parseFloat(filterAmountMax);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPaymentMethod && 
           matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map(e => e._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmingBulkDelete(true);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(Array.from(selectedIds).map(id => financeAPI.expenses.delete(id)));
      toast.success(`Deleted ${selectedIds.size} expenses`);
      setSelectedIds(new Set());
      setConfirmingBulkDelete(false);
      fetchExpenses();
    } catch (err) {
      toast.error('Failed to delete some expenses');
      setConfirmingBulkDelete(false);
    }
  };

  const setQuickDateRange = (range: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (range) {
      case 'thisMonth':
        setFilterDateFrom(new Date(y, m, 1).toISOString().split('T')[0]);
        setFilterDateTo(new Date(y, m + 1, 0).toISOString().split('T')[0]);
        break;
      case 'lastMonth':
        setFilterDateFrom(new Date(y, m - 1, 1).toISOString().split('T')[0]);
        setFilterDateTo(new Date(y, m, 0).toISOString().split('T')[0]);
        break;
      case 'thisQuarter': {
        const qStart = Math.floor(m / 3) * 3;
        setFilterDateFrom(new Date(y, qStart, 1).toISOString().split('T')[0]);
        setFilterDateTo(now.toISOString().split('T')[0]);
        break;
      }
      case 'thisYear':
        setFilterDateFrom(new Date(y, 0, 1).toISOString().split('T')[0]);
        setFilterDateTo(now.toISOString().split('T')[0]);
        break;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const formatCurrencyValue = (value: number) => formatCurrency(value, getMerchantCurrency());

  // Chart data: monthly trend
  const monthlyData = (() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => {
        const [y, m] = key.split('-');
        return { month: new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount };
      });
  })();

  // Chart data: by category
  const categoryData = (() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => ({
        category: cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        amount,
      }));
  })();

  return (
    <div className="space-y-3 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage your spending</p>
        </div>
        <div className="flex gap-2">
          <PermissionGuard permissions={['finance.export']}>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
            <Download className="h-4 w-4" />
            Export
          </button>
          </PermissionGuard>
          <PermissionGuard permissions={['finance.addExpense']}>
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-gray-700">
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <div className="flex gap-1 ml-2">
          {[
            { label: 'This Month', key: 'thisMonth' },
            { label: 'Last Month', key: 'lastMonth' },
            { label: 'This Quarter', key: 'thisQuarter' },
            { label: 'This Year', key: 'thisYear' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setQuickDateRange(p.key)}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
            >
              {p.label}
            </button>
          ))}
        </div>
        {(filterDateFrom || filterDateTo) && (
          <button
            onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
            className="ml-auto px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Clear dates
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/25 dark:to-red-900/40 rounded-xl p-6 border border-red-200 dark:border-red-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400 uppercase tracking-wide">Total Spent</p>
              <p className="text-3xl font-bold text-red-900 dark:text-red-100 mt-2">{formatCurrencyValue(totalApprovedAmount)}</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-3 font-semibold">+8% vs last month</p>
            </div>
            <div className="bg-red-200 dark:bg-red-800/50 p-4 rounded-xl">
              <TrendingDown className="h-7 w-7 text-red-600 dark:text-red-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/25 dark:to-green-900/40 rounded-xl p-6 border border-green-200 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Approved</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{expenses.filter(e => e.status === 'approved').length}</p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-3">{((expenses.filter(e => e.status === 'approved').length / expenses.length) * 100 || 0).toFixed(0)}% of total</p>
            </div>
            <div className="bg-green-200 dark:bg-green-800/50 p-4 rounded-xl">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/25 dark:to-violet-900/40 rounded-xl p-6 border border-violet-200 dark:border-violet-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-violet-700 dark:text-violet-400 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-violet-900 dark:text-violet-100 mt-2">{expenses.filter(e => e.status === 'pending').length}</p>
              <p className="text-xs text-violet-600 dark:text-violet-300 mt-3">Awaiting approval</p>
            </div>
            <div className="bg-violet-200 dark:bg-violet-800/50 p-4 rounded-xl">
              <Clock className="h-7 w-7 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expense Trend</h3>
          {monthlyData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip formatter={(value: number) => [formatCurrencyValue(value), 'Expenses']} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }} />
                <Area type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">Not enough data for trend</div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">By Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="dark:opacity-20" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip formatter={(value: number) => [formatCurrencyValue(value), 'Amount']} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px' }} />
                <Bar dataKey="amount" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">No category data</div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search by vendor or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Categories</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                <select 
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Methods</option>
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={filterAmountMin}
                  onChange={(e) => setFilterAmountMin(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={filterAmountMax}
                  onChange={(e) => setFilterAmountMax(e.target.value)}
                  placeholder="9999.99"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => {
                  setFilterCategory('');
                  setFilterStatus('');
                  setFilterPaymentMethod('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterAmountMin('');
                  setFilterAmountMax('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium transition-colors"
              >
                Clear All
              </button>
              <div className="flex-1" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 py-2 px-4">
                {filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {filteredExpenses.length > 0 ? (
          <>
            {selectedIds.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-400">{selectedIds.size} selected</span>
                </div>
                <button 
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.size === filteredExpenses.length && filteredExpenses.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">EXPENSE DATE</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">CATEGORY</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">DETAILS</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">STATUS</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">APPROVAL DATE</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">AMOUNT</th>
                    <PermissionGuard permissions={['finance.approveExpense', 'finance.rejectExpense', 'finance.editExpense', 'finance.delete']}>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">ACTIONS</th>
                    </PermissionGuard>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <input 
                          type="checkbox"
                          checked={selectedIds.has(expense._id)}
                          onChange={() => toggleSelect(expense._id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                        />
                      </td>
                       <td className="py-4 px-6">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(expense.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {expense.category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900 dark:text-white">{expense.vendor}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{expense.paymentMethod.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                      </td>
                     
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          expense.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {expense.status === 'pending' && <History className="h-3 w-3" />}
                          {expense.status === 'approved' && <Check className="h-3 w-3" />}
                          {expense.status === 'rejected' && <X className="h-3 w-3" />}
                          {expense.status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                          <span>{expense.status === 'pending' ? 'Pending' : expense.status === 'approved' ? 'Approved' : expense.status === 'rejected' ? 'Rejected' : 'Paid'}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          {expense.approvalDate ? (
                            <>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {new Date(expense.approvalDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(expense.approvalDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-red-600 dark:text-red-400">{formatCurrencyValue(expense.amount)}</td>
                      <td className="py-4 px-6">
                        
                          <div className="flex justify-center gap-2">
                            {expense.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <PermissionGuard permission={'finance.approveExpense'}>
                                  <button 
                                    onClick={() => setApprovingId(expense._id)} 
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                                  >
                                    <ThumbsUp className="h-3.5 w-3.5" />
                                    Approve
                                  </button>
                                </PermissionGuard>
                                <PermissionGuard permission={'finance.rejectExpense'}>
                                  <button 
                                    onClick={() => setRejectingId(expense._id)} 
                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 text-xs font-semibold transition-all shadow-sm hover:shadow-md"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </PermissionGuard>
                              </div>
                            )}
                            {expense.status !== 'pending' && (
                              <div className="flex items-center gap-2">
                                {expense.approvalNotes  && (
                                  <button 
                                    onClick={() => setViewingNoteId(expense._id)}
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                    title="View approval note"
                                  >
                                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg" style={{ width: '36px', height: '36px' }} />
                                  </button>
                                )}
                                <PermissionGuard permission={'finance.editExpense'}>
                                <button 
                                  onClick={() => handleEditClick(expense)} 
                                  className="inline-flex items-center justify-center p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all hover:shadow-sm"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                </PermissionGuard>
                                <PermissionGuard permission={'finance.delete'}>
                                  <button 
                                    onClick={() => handleDelete(expense._id)} 
                                    className="inline-flex items-center justify-center p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all hover:shadow-sm"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </PermissionGuard>
                              </div>
                            )}
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No expenses found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor *</label>
                <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50">
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={submitting} placeholder="e.g., Office supplies purchase" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50">
                  {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} disabled={submitting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" rows={2} />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{submitting ? 'Saving...' : (editingId ? 'Update' : 'Add')}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  disabled={submitting} 
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {(approvingId || rejectingId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{approvingId ? 'Approve' : 'Reject'} Expense</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
              <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)} disabled={isApproving || isRejecting} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50" rows={3} />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => approvingId ? handleApprove(approvingId) : handleReject(rejectingId!)} 
                disabled={isApproving || isRejecting}
                className={`flex-1 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${approvingId ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400' : 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'} disabled:cursor-not-allowed transition-colors`}
              >
                {(isApproving || isRejecting) && <Loader className="h-4 w-4 animate-spin" />}
                {approvingId ? 'Approve' : 'Reject'}
              </button>
              <button 
                onClick={() => { setApprovingId(null); setRejectingId(null); setApprovalNotes(''); }} 
                disabled={isApproving || isRejecting}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-gray-400 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => confirmDelete(deletingId!)}
        title="Delete Expense?"
        message="This action cannot be undone. The expense record will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmingBulkDelete}
        onClose={() => setConfirmingBulkDelete(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Expenses?"
        message={`Are you sure you want to delete ${selectedIds.size} selected expense${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />

      {/* Approval Note Modal */}
      {viewingNoteId && expenses.find(e => e._id === viewingNoteId)?.approvalNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            {(() => {
              const expense = expenses.find(e => e._id === viewingNoteId);
              const isRejected = expense?.status === 'rejected';
              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className={`h-5 w-5 ${isRejected ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                    <h2 className={`text-xl font-bold ${isRejected ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
                      {isRejected ? 'Rejected Note' : 'Approved Note'}
                    </h2>
                  </div>
                  <div className={`${isRejected ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'} p-4 rounded-lg mb-6`}>
                    <p className="text-gray-900 dark:text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {expense?.approvalNotes}
                    </p>
                  </div>
                </>
              );
            })()}
            <button 
              onClick={() => setViewingNoteId(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
