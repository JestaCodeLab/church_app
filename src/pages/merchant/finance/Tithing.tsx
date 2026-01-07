import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, Search, Loader, TrendingUp, Download, MessageCircle, ChevronDown, Filter, CheckCircle2, Clock } from 'lucide-react';
import { financeAPI, memberAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/modals/ConfirmModal';

interface Tithe {
  _id: string;
  source: string;
  amount: number;
  date: string;
  category: 'tithe';
  status: 'verified' | 'pending' | 'failed';
  description?: string;
  notes?: string;
  monthPaid?: string;
  isGuest?: boolean;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

const TithingTransactions: React.FC = () => {
  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [resendingSmsId, setResendingSmsId] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMemberType, setSelectedMemberType] = useState<'member' | 'guest'>('member');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [filterType, setFilterType] = useState(''); // member or guest
  const [searchTimeoutId, setSearchTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    monthPaid: new Date().toISOString().split('T')[0].substring(0, 7),
    description: '',
  });

  useEffect(() => {
    fetchTithes();
  }, []);

  const fetchTithes = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.tithe.getAll({ page: 1, limit: 100 });
      setTithes(Array.isArray(response.data.data) ? response.data.data : response.data.data?.tithe || []);
    } catch (err) {
      toast.error('Failed to load tithe records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query.trim()) {
      setMembers([]);
      return;
    }
    
    try {
      setMembersLoading(true);
      const response = await memberAPI.getMembers({ 
        page: 1, 
        limit: 50,
        search: query 
      });
      const membersList = response.data?.data?.members || response.data?.members || [];
      setMembers(Array.isArray(membersList) ? membersList : []);
    } catch (err) {
      console.error('Failed to search members:', err);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleMemberSearchChange = (value: string) => {
    setMemberSearchQuery(value);
    
    // Clear existing timeout
    if (searchTimeoutId) {
      clearTimeout(searchTimeoutId);
    }

    if (value.trim() !== '') {
      setShowMemberDropdown(true);
      // Debounce search - wait 300ms before making API call
      const timeoutId = setTimeout(() => {
        searchMembers(value);
      }, 300);
      setSearchTimeoutId(timeoutId);
    } else {
      setShowMemberDropdown(false);
      setMembers([]);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setSelectedMemberType('member');
    setMemberSearchQuery('');
    setShowMemberDropdown(false);
    setMembers([]); // Clear any previous search results
    setSelectedMemberId(null); // Clear selected member ID
    setFormData({ source: '', amount: '', date: new Date().toISOString().split('T')[0], monthPaid: new Date().toISOString().split('T')[0].substring(0, 7), description: '' });
    setShowModal(true);
  };

  const handleEditClick = (tithe: Tithe) => {
    setEditingId(tithe._id);
    setSelectedMemberType(tithe.isGuest ? 'guest' : 'member');
    setMemberSearchQuery('');
    setShowMemberDropdown(false);
    setSelectedMemberId(null); // Clear selected member ID
    setFormData({
      source: tithe.source,
      amount: tithe.amount.toString(),
      date: tithe.date.split('T')[0],
      monthPaid: tithe.monthPaid || '',
      description: tithe.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        source: formData.source,
        amount: parseFloat(formData.amount),
        date: formData.date,
        monthPaid: formData.monthPaid,
        description: formData.description,
        isGuest: selectedMemberType === 'guest',
        ...(selectedMemberType === 'member' && selectedMemberId && { member: selectedMemberId })
      };

      if (editingId) {
        await financeAPI.tithe.update(editingId, payload);
        toast.success('Tithe updated successfully');
      } else {
        await financeAPI.tithe.create(payload);
        toast.success('Tithe recorded. SMS acknowledgment will be sent to member.');
      }
      setShowModal(false);
      setEditingId(null);
      setMemberSearchQuery('');
      setShowMemberDropdown(false);
      setSelectedMemberId(null);
      fetchTithes();
    } catch (err) {
      toast.error('Failed to save tithe');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendSms = async (id: string) => {
    try {
      setResendingSmsId(id);
      await financeAPI.tithe.resendSms(id);
      toast.success('SMS acknowledgment resent successfully');
      setResendingSmsId(null);
      fetchTithes(); // Refresh to update smsAcknowledged status
    } catch (err) {
      toast.error('Failed to resend SMS');
      console.error(err);
      setResendingSmsId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      await financeAPI.tithe.delete(id);
      toast.success('Tithe deleted successfully');
      setDeletingId(null);
      fetchTithes();
    } catch (err) {
      toast.error('Failed to delete tithe');
      console.error(err);
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><Loader className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const formatCurrencyValue = (value: number) => formatCurrency(value, getMerchantCurrency());

  const totalTithes = tithes.reduce((sum, t) => sum + t.amount, 0);
  const verifiedTithes = tithes.filter(t => t.status === 'verified').length;
  const pendingTithes = tithes.filter(t => t.status === 'pending').length;

  const filteredTithes = tithes.filter(t => {
    const matchesSearch = t.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !filterStatus || t.status === filterStatus;
    const matchesDateFrom = !filterDateFrom || new Date(t.date) >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || new Date(t.date) <= new Date(filterDateTo);
    const matchesAmountMin = !filterAmountMin || t.amount >= parseFloat(filterAmountMin);
    const matchesAmountMax = !filterAmountMax || t.amount <= parseFloat(filterAmountMax);
    const matchesType = !filterType || (filterType === 'guest' && t.isGuest) || (filterType === 'member' && !t.isGuest);
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax && matchesType;
  });

  return (
    <div className="space-y-3 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tithing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage tithe records and SMS acknowledgments</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button onClick={handleAddClick} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            <Plus className="h-4 w-4" />
            Record Tithe
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Tithes */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/25 dark:to-green-900/40 rounded-xl p-6 border border-green-200 dark:border-green-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">Total Tithes</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-2">{formatCurrencyValue(totalTithes)}</p>
              <p className="text-xs text-green-600 dark:text-green-300 mt-3 font-semibold">+15% from last month</p>
            </div>
            <div className="bg-green-200 dark:bg-green-800/50 p-4 rounded-xl">
              <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Verified Tithes */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/25 dark:to-blue-900/40 rounded-xl p-6 border border-blue-200 dark:border-blue-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wide">Verified Records</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">{verifiedTithes}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-3">Out of {tithes.length} total records</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-800/50 p-4 rounded-xl">
              <CheckCircle2 className="h-7 w-7 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Pending Tithes */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/25 dark:to-amber-900/40 rounded-xl p-6 border border-amber-200 dark:border-amber-800/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">Pending Review</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-2">{pendingTithes}</p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-3">Awaiting verification</p>
            </div>
            <div className="bg-amber-200 dark:bg-amber-800/50 p-4 rounded-xl">
              <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member or guest name..."
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
              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="member">Member</option>
                  <option value="guest">Guest</option>
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

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                <input 
                  type="date" 
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                <input 
                  type="date" 
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Amount Min */}
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

              {/* Amount Max */}
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
                  setFilterStatus('');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterAmountMin('');
                  setFilterAmountMax('');
                  setFilterType('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium transition-colors"
              >
                Clear All
              </button>
              <div className="flex-1" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 py-2 px-4">
                {filteredTithes.length} result{filteredTithes.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tithes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredTithes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">DATE</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">NAME / TYPE</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">MONTH PAID</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">STATUS</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">AMOUNT</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900 dark:text-white text-sm">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTithes.map((tithe) => (
                  <tr key={tithe._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{new Date(tithe.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{tithe.source}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          tithe.isGuest 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {tithe.isGuest ? 'Guest' : 'Member'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                      {tithe.monthPaid ? new Date(tithe.monthPaid + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tithe.status === 'verified' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        tithe.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {tithe.status === 'verified' ? '• Verified' : tithe.status === 'pending' ? '• Pending' : '• Failed'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrencyValue(tithe.amount)}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleResendSms(tithe._id)}
                          disabled={resendingSmsId === tithe._id}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                          title="Resend SMS acknowledgment"
                        >
                          {resendingSmsId === tithe._id ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button onClick={() => handleEditClick(tithe)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(tithe._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No tithe records found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg my-8 max-h-[90vh] flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex-shrink-0">{editingId ? 'Edit Tithe' : 'Record New Tithe'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type *</label>
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberType('member');
                      setMemberSearchQuery('');
                      setShowMemberDropdown(false);
                      setFormData({ ...formData, source: '' });
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      selectedMemberType === 'member'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberType('guest');
                      setMemberSearchQuery('');
                      setShowMemberDropdown(false);
                      setFormData({ ...formData, source: '' });
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                      selectedMemberType === 'guest'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    Guest
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{selectedMemberType === 'member' ? 'Member' : 'Guest Name'} *</label>
                {selectedMemberType === 'member' ? (
                  <div className="relative z-50">
                    <input
                      type="text"
                      value={memberSearchQuery || formData.source}
                      onChange={(e) => {
                        handleMemberSearchChange(e.target.value);
                      }}
                      onFocus={() => {
                        setMemberSearchQuery('');
                        setFormData({ ...formData, source: '' });
                        setShowMemberDropdown(true);
                      }}
                      onBlur={() => {
                        // Delay closing to allow click on dropdown items
                        setTimeout(() => setShowMemberDropdown(false), 150);
                      }}
                      placeholder="Search members..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />
                    {showMemberDropdown && memberSearchQuery.trim() !== '' && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
                        {membersLoading ? (
                          <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                            <Loader className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : members.length > 0 ? (
                          members.map((member) => (
                            <button
                              key={member._id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setFormData({ ...formData, source: `${member.firstName} ${member.lastName}` });
                                setSelectedMemberId(member._id);
                                setMemberSearchQuery('');
                                setShowMemberDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 last:border-b-0 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/30"
                            >
                              <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                              {member?.phone && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member?.phone}</p>}
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
                            No members found matching "{memberSearchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" step="0.01" required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month Paid *</label>
                  <input type="month" value={formData.monthPaid} onChange={(e) => setFormData({ ...formData, monthPaid: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Add any notes..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors" rows={3} />
              </div>
              {!editingId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">An SMS acknowledgment will be automatically sent to the member upon recording.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors order-2 sm:order-1 flex items-center justify-center gap-2 ${
                    isSubmitting 
                      ? 'bg-blue-400 text-white cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? (editingId ? 'Updating...' : 'Recording...') : (editingId ? 'Update' : 'Record')}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingId(null); }} 
                  disabled={isSubmitting}
                  className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors order-1 sm:order-2 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => confirmDelete(deletingId!)}
        title="Delete Tithe Record?"
        message="This action cannot be undone. The tithe record will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default TithingTransactions;
