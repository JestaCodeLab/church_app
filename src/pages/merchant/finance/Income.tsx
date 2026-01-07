import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Search, Loader, Inbox, Check, TrendingUp, DollarSign, BarChart3, Target, Filter, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import { financeAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/modals/ConfirmModal';

interface Income {
  _id: string;
  category: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  status: 'verified' | 'pending' | 'failed';
}

const INCOME_CATEGORIES = [
  { value: 'tithe', label: 'Tithe' },
  { value: 'offering', label: 'Offering' },
  { value: 'fundraising', label: 'Fundraising' },
  { value: 'donation', label: 'Donation' },
  { value: 'grants', label: 'Grants' },
  { value: 'other', label: 'Other' },
];

const Income: React.FC = () => {
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchIncome();
  }, [page]);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.income.getAll({ page, limit: 20 });
      setIncomeList(Array.isArray(response.data.data) ? response.data.data : response.data.data?.income || []);
    } catch (err) {
      toast.error('Failed to load income records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await financeAPI.income.update(editingId, formData);
        toast.success('Income updated');
      } else {
        await financeAPI.income.create(formData);
        toast.success('Income created');
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ category: '', amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchIncome();
    } catch (err) {
      toast.error('Failed to save income');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredIncome.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIncome.map(i => i._id)));
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

  const handleBulkDelete = async () => {
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id => financeAPI.income.delete(id)));
      toast.success(`Deleted ${selectedIds.size} records`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      fetchIncome();
    } catch (err) {
      toast.error('Failed to delete some records');
    }
  };

  const formatCurrencyValue = (value: number) => formatCurrency(value, getMerchantCurrency());

  if (loading) return <div className="flex items-center justify-center h-96"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const filteredIncome = incomeList.filter(i => {
    // Search filter
    const matchesSearch = i.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = !filterCategory || i.category === filterCategory;
    
    // Status filter
    const matchesStatus = !filterStatus || i.status === filterStatus;
    
    // Date range filter
    const incomeDate = new Date(i.date);
    const matchesDateFrom = !filterDateFrom || incomeDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || incomeDate <= new Date(filterDateTo);
    
    // Amount range filter
    const matchesAmountMin = !filterAmountMin || i.amount >= parseFloat(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || i.amount <= parseFloat(filterAmountMax);
    
    return matchesSearch && matchesCategory && matchesStatus && 
           matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
  });

  return (
    <div className="space-y-3 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Income Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and track your revenue streams efficiently.</p>
        </div>
        <button onClick={() => { setEditingId(null); setFormData({ category: '', amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
          <Plus className="h-4 w-4" />
          Add Income
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Income */}
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/25 dark:to-emerald-900/40 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Total Income</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">{formatCurrencyValue(incomeList.reduce((sum, i) => sum + i.amount, 0))}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-3 font-semibold">+12% vs last month</p>
            </div>
            <div className="bg-emerald-200 dark:bg-emerald-800/50 p-4 rounded-xl">
              <TrendingUp className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Verified Records */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/25 dark:to-blue-900/40 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Verified</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{incomeList.filter(i => i.status === 'verified').length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">{((incomeList.filter(i => i.status === 'verified').length / incomeList.length) * 100 || 0).toFixed(0)}% of total</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800/50 p-4 rounded-xl">
              <CheckCircle2 className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Pending Records */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/25 dark:to-amber-900/40 rounded-xl p-6 border border-amber-200 dark:border-amber-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">{incomeList.filter(i => i.status === 'pending').length}</p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-3">Awaiting verification</p>
            </div>
            <div className="bg-amber-200 dark:bg-amber-800/50 p-4 rounded-xl">
              <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Search className="h-5 w-5 text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search by source or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
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
                  {INCOME_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                <input 
                  type="date" 
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                <input 
                  type="date" 
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
                {filteredIncome.length} result{filteredIncome.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Income Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {filteredIncome.length > 0 ? (
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
                        checked={selectedIds.size === filteredIncome.length && filteredIncome.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">DATE</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">SOURCE</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">CATEGORY</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">STATUS</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">AMOUNT</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncome.map((income) => (
                    <tr key={income._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <input 
                          type="checkbox"
                          checked={selectedIds.has(income._id)}
                          onChange={() => toggleSelect(income._id)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">{new Date(income.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">{income.source}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          {INCOME_CATEGORIES.find(c => c.value === income.category)?.label || income.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          income.status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                          income.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {income.status === 'verified' ? '• Cleared' : income.status === 'pending' ? '• Pending' : '• Failed'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-semibold text-green-600 dark:text-green-400">+{formatCurrencyValue(income.amount)}</td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => { setEditingId(income._id); setFormData({ category: income.category, amount: income.amount.toString(), source: income.source, description: income.description, date: new Date(income.date).toISOString().split('T')[0] }); setShowModal(true); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeletingId(income._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No income records found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{editingId ? 'Edit Income' : 'Add New Income'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Category</option>
                  {INCOME_CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" step="0.01" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} placeholder="e.g., Sunday Service" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add any notes..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">{editingId ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Income Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          try {
            if (deletingId) {
              await financeAPI.income.delete(deletingId);
              toast.success('Income record deleted');
              setDeletingId(null);
              fetchIncome();
            }
          } catch (err) {
            toast.error('Failed to delete income record');
          }
        }}
        title="Delete Income Record?"
        message="This action cannot be undone. The income record will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Income Records?"
        message={`Are you sure you want to delete ${selectedIds.size} selected income record${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Income;
