import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Download, Calendar, Loader } from 'lucide-react';
import { financeAPI, memberAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import { useBranch } from '../../../context/BranchContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import DatePicker from '../../../components/ui/DatePicker';

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
  member?: any;
  paymentMethod?: string;
  paystackReference?: string;
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface SummaryStats {
  total: number;
  count: number;
  average: number;
  verified: number;
}

const Tithes: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
  const currency = getMerchantCurrency();

  // Branch guard: redirect if no branch selected and multiple branches exist
  useEffect(() => {
    if (selectedBranch === undefined || selectedBranch === null) {
      // Will be handled by GivingBranchGate at route level
    }
  }, [selectedBranch, navigate]);

  // Data states
  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    total: 0,
    count: 0,
    average: 0,
    verified: 0
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // UI states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState<'week' | 'lastweek' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'paystack'>('cash');
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    monthPaid: new Date().toISOString().split('T')[0].substring(0, 7),
    description: '',
    notes: '',
    paystackReference: '',
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberType, setSelectedMemberType] = useState<'member' | 'guest'>('member');
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);

  // Debounce timer for member search
  const memberSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute date range for API calls
  const getDateRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(startOfWeek.getDate() - 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    switch (dateRange) {
      case 'week':
        return { start: startOfWeek.toISOString().split('T')[0], end: endOfWeek.toISOString().split('T')[0] };
      case 'lastweek':
        return { start: lastWeekStart.toISOString().split('T')[0], end: lastWeekEnd.toISOString().split('T')[0] };
      case 'month':
        return { start: startOfMonth.toISOString().split('T')[0], end: endOfMonth.toISOString().split('T')[0] };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: startOfMonth.toISOString().split('T')[0], end: endOfMonth.toISOString().split('T')[0] };
    }
  };

  // Fetch tithes and summary
  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const params: any = {
        category: 'tithe',
        page,
        limit: pageSize,
        startDate: start,
        endDate: end
      };

      // Fetch records
      const recordsResponse = await financeAPI.tithe.getAll(params);
      const recordsData = recordsResponse.data.data || [];
      setTithes(recordsData);
      setTotalPages(recordsResponse.data.pagination?.pages || 1);
      setCurrentPage(page);

      // Fetch summary
      const summaryParams: any = {
        category: 'tithe',
        startDate: start,
        endDate: end
      };

      const summaryResponse = await financeAPI.tithe.getSummary(summaryParams);
      setSummary(summaryResponse.data.data);
    } catch (error) {
      toast.error('Failed to load tithes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch members for dropdown
  const fetchMembers = async (query: string = '') => {
    try {
      const response = await memberAPI.getMembers({ search: query, limit: 20 });
      const memberList = Array.isArray(response.data.data) ? response.data.data : response.data.data?.members || [];
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    if (!showMemberDropdown) return;

    setMemberSearchLoading(true);

    // Clear existing timeout
    if (memberSearchTimeoutRef.current) {
      clearTimeout(memberSearchTimeoutRef.current);
    }

    // Set new debounced search
    memberSearchTimeoutRef.current = setTimeout(() => {
      fetchMembers(memberSearchQuery);
      setMemberSearchLoading(false);
    }, 400);

    // Cleanup on unmount
    return () => {
      if (memberSearchTimeoutRef.current) {
        clearTimeout(memberSearchTimeoutRef.current);
      }
    };
  }, [memberSearchQuery, showMemberDropdown]);

  useEffect(() => {
    if (showModal && !editingId) {
      // Fetch initial member list when modal opens for new tithe
      fetchMembers('');
    }
  }, [showModal, editingId]);

  const handleDateRangeChange = (range: 'week' | 'lastweek' | 'month' | 'custom') => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleAddTithe = async () => {
    // Validate based on payment method
    if (paymentMethod === 'cash') {
      if (!formData.source || !formData.amount) {
        toast.error('Please fill in all required fields');
        return;
      }
    } else {
      if (!formData.paystackReference) {
        toast.error('Please enter a Paystack reference');
        return;
      }
    }

    try {
      setSubmitting(true);

      if (paymentMethod === 'cash') {
        const payload = {
          source: formData.source,
          amount: parseFloat(formData.amount),
          date: formData.date,
          monthPaid: formData.monthPaid,
          description: formData.description,
          notes: formData.notes,
          category: 'tithe',
          paymentMethod: 'cash',
          member: selectedMemberId || undefined,
          isGuest: selectedMemberType === 'guest'
        };

        if (editingId) {
          await financeAPI.tithe.update(editingId, payload);
          toast.success('Tithe updated successfully');
        } else {
          await financeAPI.tithe.create(payload);
          toast.success('Tithe recorded successfully');
        }
      } else {
        // Paystack flow
        const verifyPayload = {
          reference: formData.paystackReference,
          memberId: selectedMemberId || undefined,
          monthPaid: formData.monthPaid,
          notes: formData.notes
        };

        const response = await financeAPI.tithe.verifyPaystack(verifyPayload);

        if (response.data.alreadyExists) {
          toast.success('This reference is already recorded');
        } else {
          toast.success('Paystack transaction verified and recorded');
        }
      }

      setShowModal(false);
      setFormData({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        monthPaid: new Date().toISOString().split('T')[0].substring(0, 7),
        description: '',
        notes: '',
        paystackReference: '',
      });
      setSelectedMemberId(null);
      setSelectedMember(null);
      setMemberSearchQuery('');
      setSelectedMemberType('member');
      setPaymentMethod('cash');
      setEditingId(null);
      fetchData(1);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save tithe';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTithe = async () => {
    if (!deletingId) return;
    try {
      await financeAPI.tithe.delete(deletingId);
      toast.success('Tithe deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      fetchData(currentPage);
    } catch (error) {
      toast.error('Failed to delete tithe');
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const { start, end } = getDateRange();
      const response = await financeAPI.tithe.getAll({
        category: 'tithe',
        startDate: start,
        endDate: end,
        limit: 9999
      });
      const records = Array.isArray(response.data.data) ? response.data.data : response.data.data?.tithe || [];

      // Convert to CSV
      const headers = ['Date', 'Source', 'Amount', 'Payment Method', 'Status', 'Month Paid'];
      const csvContent = [
        headers.join(','),
        ...records.map(r => [
          new Date(r.date).toLocaleDateString(),
          `"${r.source}"`,
          r.amount,
          r.paymentMethod || 'N/A',
          r.status,
          r.monthPaid || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tithes-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to export tithes');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Tithes</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              source: '',
              amount: '',
              date: new Date().toISOString().split('T')[0],
              monthPaid: new Date().toISOString().split('T')[0].substring(0, 7),
              description: '',
              notes: '',
              paystackReference: '',
            });
            setSelectedMemberId(null);
            setSelectedMember(null);
            setPaymentMethod('cash');
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Add Tithe
        </button>
      </div>

      {/* Global Date Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <div className="flex gap-2">
            <button
              onClick={() => handleDateRangeChange('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                dateRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleDateRangeChange('lastweek')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                dateRange === 'lastweek'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => handleDateRangeChange('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                dateRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleDateRangeChange('custom')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 font-medium text-sm transition"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Custom Date Range (if selected) */}
      {dateRange === 'custom' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
            <DatePicker
              value={customStartDate}
              onChange={setCustomStartDate}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
            <DatePicker
              value={customEndDate}
              onChange={setCustomEndDate}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Total Amount</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{formatCurrency(summary.total, currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Total Records</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{summary.count}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Cash Tithes</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{tithes.filter(t => t.paymentMethod !== 'paystack').length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manual recordings</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-2">Paystack Tithes</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{tithes.filter(t => t.paymentMethod === 'paystack').length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verified payments</p>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : tithes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
              <Calendar className="w-8 h-8 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">No tithes found for the selected period</p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Try adjusting your date range or add a new tithe</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Source</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Month Paid</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tithes.map((tithe) => (
                    <tr key={tithe._id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                        <div className="font-medium">{new Date(tithe.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{new Date(tithe.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{tithe.source}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(tithe.amount, currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {tithe.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tithe.status === 'verified'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : tithe.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                          {tithe.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {tithe.monthPaid ? new Date(tithe.monthPaid + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(tithe._id);
                            setFormData({
                              source: tithe.source,
                              amount: tithe.amount.toString(),
                              date: tithe.date.split('T')[0],
                              monthPaid: tithe.monthPaid || '',
                              description: tithe.description || '',
                              notes: tithe.notes || '',
                              paystackReference: tithe.paystackReference || '',
                            });
                            setPaymentMethod(tithe.paymentMethod === 'paystack' ? 'paystack' : 'cash');
                            if (tithe.member) {
                              setSelectedMemberId(tithe.member._id || tithe.member);
                              setSelectedMember(tithe.member);
                            }
                            setShowModal(true);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingId(tithe._id);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between bg-slate-50 dark:bg-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchData(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchData(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                {editingId ? 'Edit Tithe' : 'Add Tithe'}
              </h2>

              {/* Payment Method Tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('paystack')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    paymentMethod === 'paystack'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Paystack
                </button>
              </div>

              <div className="space-y-4">
                {/* Member Search (shared) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Member (optional)</label>
                  <div className="relative">
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={memberSearchQuery}
                        onChange={(e) => {
                          setMemberSearchQuery(e.target.value);
                          setShowMemberDropdown(true);
                        }}
                        onFocus={() => setShowMemberDropdown(true)}
                        placeholder="Search member..."
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      {memberSearchLoading && showMemberDropdown && (
                        <div className="absolute right-3">
                          <Loader className="w-4 h-4 animate-spin text-slate-500" />
                        </div>
                      )}
                    </div>
                    {showMemberDropdown && !memberSearchLoading && members.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {members.map(member => (
                          <button
                            key={member._id}
                            onClick={() => {
                              setSelectedMemberId(member._id);
                              setSelectedMember(member);
                              setMemberSearchQuery('');
                              setShowMemberDropdown(false);
                              setSelectedMemberType('member');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100"
                          >
                            {member.firstName} {member.lastName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedMember && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm">
                      <div className="text-blue-900 dark:text-blue-200 font-medium">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMemberId(null);
                          setSelectedMember(null);
                          setMemberSearchQuery('');
                          setSelectedMemberType('member');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 mt-1 hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                {/* Guest toggle (shown when no member selected) */}
                {!selectedMemberId && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isGuest"
                      checked={selectedMemberType === 'guest'}
                      onChange={(e) => setSelectedMemberType(e.target.checked ? 'guest' : 'member')}
                      className="rounded"
                    />
                    <label htmlFor="isGuest" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Record as guest
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date *</label>
                    <DatePicker
                      value={formData.date}
                      onChange={(date) => setFormData({ ...formData, date })}
                    />
                  </div>
                </div>

                {paymentMethod === 'cash' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source *</label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g., Sunday Service, Bank Transfer"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Paystack Reference *</label>
                    <input
                      type="text"
                      value={formData.paystackReference}
                      onChange={(e) => setFormData({ ...formData, paystackReference: e.target.value })}
                      placeholder="Enter the Paystack transaction reference"
                      className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">From member's Paystack SMS/email receipt</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Month Paid</label>
                  <input
                    type="month"
                    value={formData.monthPaid}
                    onChange={(e) => setFormData({ ...formData, monthPaid: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes..."
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      source: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0],
                      monthPaid: new Date().toISOString().split('T')[0].substring(0, 7),
                      description: '',
                      notes: '',
                      paystackReference: '',
                    });
                    setSelectedMemberId(null);
                    setSelectedMember(null);
                    setMemberSearchQuery('');
                    setSelectedMemberType('member');
                    setPaymentMethod('cash');
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTithe}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : paymentMethod === 'paystack' ? 'Verify & Record' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Tithe"
        message="Are you sure you want to delete this tithe record? This action cannot be undone."
        onConfirm={handleDeleteTithe}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Tithes;
