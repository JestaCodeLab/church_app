import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Download, Calendar, Loader, X, ChevronDown } from 'lucide-react';
import { financeAPI, memberAPI, eventAPI } from '../../../services/api';
import { formatCurrency, getMerchantCurrency } from '../../../utils/currency';
import { useBranch } from '../../../context/BranchContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import DatePicker from '../../../components/ui/DatePicker';

interface Offering {
  _id: string;
  event?: { _id: string; title: string };
  offeringType?: { _id: string; name: string };
  offeringCategory: 'collection' | 'member';
  amount: number;
  date: string;
  serviceDate?: string;
  category: 'offering';
  status: 'verified' | 'pending' | 'failed';
  paymentMethod?: string;
  member?: { _id: string; firstName: string; lastName: string };
}

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface OfferingType {
  _id: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Event {
  _id: string;
  title: string;
  isRecurring?: boolean;
  recurrence?: any;
}

interface SummaryStats {
  total: number;
  count: number;
  cashCount?: number;
  digitalCount?: number;
}

const Offerings: React.FC = () => {
  const navigate = useNavigate();
  const { selectedBranch } = useBranch();
  const currency = getMerchantCurrency();

  // Data states
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({ total: 0, count: 0, cashCount: 0, digitalCount: 0 });
  const [offeringTypes, setOfferingTypes] = useState<OfferingType[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // UI states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showOfferingTypeDropdown, setShowOfferingTypeDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter states
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedOfferingType, setSelectedOfferingType] = useState<OfferingType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'collection' | 'member' | 'all'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'lastweek' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [eventSearchQuery, setEventSearchQuery] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);

  // Form states
  const [category, setCategory] = useState<'collection' | 'member'>('collection');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'paystack'>('cash');
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paystackReference: '',
    source: '',
    notes: '',
  });
  const [selectedEvent_Form, setSelectedEvent_Form] = useState<Event | null>(null);
  const [selectedOfferingType_Form, setSelectedOfferingType_Form] = useState<OfferingType | null>(null);
  const [selectedServiceDate, setSelectedServiceDate] = useState('');

  // Member form states
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);

  // Manage Types modal states
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [showAddTypeInline, setShowAddTypeInline] = useState(false);
  const [inlineNewTypeName, setInlineNewTypeName] = useState('');

  // Debounce timer for member search
  const memberSearchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute date range
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

  // Fetch offerings data
  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const params: any = {
        page,
        limit: pageSize,
        startDate: start,
        endDate: end,
      };

      if (selectedEvent) {
        params.event = selectedEvent._id;
      }
      if (selectedOfferingType) {
        params.offeringType = selectedOfferingType._id;
      }
      if (selectedCategory !== 'all') {
        params.offeringCategory = selectedCategory;
      }

      const recordsResponse = await financeAPI.offering.getAll(params);
      const recordsData = recordsResponse.data.data || [];
      setOfferings(recordsData);
      setTotalPages(recordsResponse.data.pagination?.pages || 1);
      setCurrentPage(page);

      const summaryParams: any = {
        startDate: start,
        endDate: end,
      };
      if (selectedEvent) summaryParams.event = selectedEvent._id;
      if (selectedOfferingType) summaryParams.offeringType = selectedOfferingType._id;
      if (selectedCategory !== 'all') summaryParams.offeringCategory = selectedCategory;

      const summaryResponse = await financeAPI.offering.getSummary(summaryParams);
      setSummary(summaryResponse.data.data);
    } catch (error) {
      toast.error('Failed to load offerings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch offering types
  const fetchOfferingTypes = async () => {
    try {
      const response = await financeAPI.offeringTypes.getAll();
      setOfferingTypes(response.data.data);
      // Auto-select first type if none selected
      if (!selectedOfferingType_Form && response.data.data.length > 0) {
        setSelectedOfferingType_Form(response.data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch offering types:', error);
    }
  };

  // Fetch events
  const fetchEvents = async (query: string = '') => {
    try {
      const response = await eventAPI.getEvents({ search: query, limit: 50 });
      const eventsList = Array.isArray(response.data.data) ? response.data.data : response.data.data?.events || [];
      setEvents(eventsList);
    } catch (error) {
      console.error('Failed to fetch events:', error);
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
  }, [dateRange, customStartDate, customEndDate, selectedEvent, selectedOfferingType, selectedCategory]);

  useEffect(() => {
    fetchOfferingTypes();
    fetchEvents();
  }, []);

  // Auto-set default offering type when modal opens
  useEffect(() => {
    if (showModal && !selectedOfferingType_Form && offeringTypes.length > 0) {
      const defaultType = offeringTypes.find((t) => t.isDefault) || offeringTypes[0];
      setSelectedOfferingType_Form(defaultType);
    }
  }, [showModal, offeringTypes, selectedOfferingType_Form]);

  useEffect(() => {
    if (!showMemberDropdown) return;

    setMemberSearchLoading(true);
    if (memberSearchTimeoutRef.current) clearTimeout(memberSearchTimeoutRef.current);

    memberSearchTimeoutRef.current = setTimeout(() => {
      fetchMembers(memberSearchQuery);
      setMemberSearchLoading(false);
    }, 400);

    return () => {
      if (memberSearchTimeoutRef.current) clearTimeout(memberSearchTimeoutRef.current);
    };
  }, [memberSearchQuery, showMemberDropdown]);

  useEffect(() => {
    if (!showEventDropdown) return;
    if (eventSearchQuery) {
      fetchEvents(eventSearchQuery);
    } else {
      fetchEvents();
    }
  }, [eventSearchQuery, showEventDropdown]);

  const handleAddOffering = async () => {
    if (!selectedEvent_Form || !formData.amount || !selectedOfferingType_Form) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (category === 'member' && !selectedMemberId) {
      toast.error('Please select a member');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        event: selectedEvent_Form._id,
        offeringType: selectedOfferingType_Form._id,
        offeringCategory: category,
        source: formData.source || 'Offering',
        notes: formData.notes,
      };

      if (selectedServiceDate) {
        payload.serviceDate = selectedServiceDate;
      } else if (selectedEvent_Form.isRecurring) {
        payload.serviceDate = formData.date;
      }

      if (category === 'member' && selectedMemberId) {
        payload.member = selectedMemberId;
      }

      if (paymentMethod === 'paystack') {
        if (!formData.paystackReference) {
          toast.error('Please enter Paystack reference');
          return;
        }
        const response = await financeAPI.offering.verifyPaystack(payload);
        toast.success('Offering verified and recorded');
      } else {
        await financeAPI.offering.create(payload);
        toast.success('Offering recorded');
      }

      // Reset form
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], paystackReference: '', source: '', notes: '' });
      setSelectedEvent_Form(null);
      setSelectedOfferingType_Form(null);
      setSelectedServiceDate('');
      setSelectedMemberId(null);
      setSelectedMember(null);
      setMemberSearchQuery('');
      setPaymentMethod('cash');
      setCategory('collection');
      setShowModal(false);

      await fetchData(1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record offering');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOfferingType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setTypeSubmitting(true);
      await financeAPI.offeringTypes.create({ name: newTypeName.trim() });
      toast.success('Offering type created');
      setNewTypeName('');
      await fetchOfferingTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create offering type');
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleAddOfferingTypeInline = async () => {
    if (!inlineNewTypeName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setTypeSubmitting(true);
      const response = await financeAPI.offeringTypes.create({ name: inlineNewTypeName.trim() });
      toast.success('Offering type created');
      setInlineNewTypeName('');
      setShowAddTypeInline(false);
      await fetchOfferingTypes();
      // Auto-select the newly created type
      setSelectedOfferingType_Form(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create offering type');
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleToggleOfferingType = async (type: OfferingType) => {
    try {
      await financeAPI.offeringTypes.update(type._id, { isActive: !type.isActive });
      toast.success(type.isActive ? 'Offering type deactivated' : 'Offering type activated');
      await fetchOfferingTypes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update offering type');
    }
  };

  const handleDeleteOffering = async () => {
    if (!deletingId) return;
    try {
      await financeAPI.offering.delete(deletingId);
      toast.success('Offering deleted');
      setShowDeleteConfirm(false);
      setDeletingId(null);
      await fetchData(currentPage);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete offering');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dayOfWeek}, ${formatted}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offerings</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage congregation offerings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowManageTypes(true)}
            className="px-4 py-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 font-medium"
          >
            Manage Types
          </button>
          <button
            onClick={() => {
              setShowModal(true);
              setEditingId(null);
              setCategory(null);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            <Plus size={18} /> Add Offering
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Event Picker */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event/Service</label>
            <button
              onClick={() => setShowEventDropdown(!showEventDropdown)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left text-sm flex justify-between items-center hover:border-gray-400"
            >
              <span>{selectedEvent?.title || 'Select event...'}</span>
              <ChevronDown size={16} />
            </button>
            {showEventDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <div className="max-h-48 overflow-y-auto">
                  {events.map((event) => (
                    <button
                      key={event._id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventDropdown(false);
                        setEventSearchQuery('');
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      {event.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Offering Type Filter */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <button
              onClick={() => setShowOfferingTypeDropdown(!showOfferingTypeDropdown)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left text-sm flex justify-between items-center hover:border-gray-400"
            >
              <span>{selectedOfferingType?.name || 'All types'}</span>
              <ChevronDown size={16} />
            </button>
            {showOfferingTypeDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20">
                <button
                  onClick={() => {
                    setSelectedOfferingType(null);
                    setShowOfferingTypeDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600"
                >
                  All types
                </button>
                {offeringTypes.filter((type) => type.isActive).map((type) => (
                  <button
                    key={type._id}
                    onClick={() => {
                      setSelectedOfferingType(type);
                      setShowOfferingTypeDropdown(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600 last:border-b-0 flex justify-between items-center"
                  >
                    <span>{type.name}</span>
                    {type.isDefault && <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">Default</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Categories</option>
              <option value="collection">Collection</option>
              <option value="member">Member Offering</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="week">This Week</option>
              <option value="lastweek">Last Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range - Full Width */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
              <DatePicker
                value={customStartDate}
                onChange={setCustomStartDate}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
              <DatePicker
                value={customEndDate}
                onChange={setCustomEndDate}
              />
            </div>
          </div>
        )}

        {selectedEvent && (
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear event filter
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Amount</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(summary.total, currency)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Records</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{summary.count}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cash</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.cashCount || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Digital</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.digitalCount || 0}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="animate-spin text-gray-400" size={32} />
          </div>
        ) : offerings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Calendar className="w-8 h-8 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No offerings found for the selected period</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Try adjusting your filters or add a new offering</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Event</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Member</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Method</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offerings.map((offering) => (
                    <tr key={offering._id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatDate(offering.date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{offering.event?.title || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{offering.offeringType?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {offering.offeringCategory === 'collection' ? 'Collection' : 'Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {offering.member ? `${offering.member.firstName} ${offering.member.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                        {formatCurrency(offering.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          offering.paymentMethod === 'paystack'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {offering.paymentMethod === 'paystack' ? 'Digital' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <button
                          onClick={() => {
                            setDeletingId(offering._id);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchData(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchData(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Offering Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Offering</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Step 1: Category Selection */}
              {!category && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Select offering category</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setCategory('collection')}
                      className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Collection</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Church gathering total offering</div>
                    </button>
                    <button
                      onClick={() => setCategory('member')}
                      className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">Member Offering</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Individual member's personal offering</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Offering Details */}
              {category && (
                <div className="space-y-4">
                  {/* Offering Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Offering Type *</label>
                    {!showAddTypeInline ? (
                      <div className="space-y-2">
                        <select
                          value={selectedOfferingType_Form?._id || ''}
                          onChange={(e) => {
                            if (e.target.value === 'add_new') {
                              setShowAddTypeInline(true);
                            } else {
                              const type = offeringTypes.find((t) => t._id === e.target.value);
                              setSelectedOfferingType_Form(type || null);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {!selectedOfferingType_Form && <option value="">Select type...</option>}
                          {offeringTypes.filter((type) => type.isActive).map((type) => (
                            <option key={type._id} value={type._id}>
                              {type.name} {type.isDefault ? '(Default)' : ''}
                            </option>
                          ))}
                          <option value="add_new" className="font-semibold bg-blue-50 dark:bg-blue-900/20">
                            + Add new type
                          </option>
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={inlineNewTypeName}
                          onChange={(e) => setInlineNewTypeName(e.target.value)}
                          placeholder="Type name..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowAddTypeInline(false);
                              setInlineNewTypeName('');
                            }}
                            disabled={typeSubmitting}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddOfferingTypeInline}
                            disabled={typeSubmitting}
                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {typeSubmitting && <Loader size={14} className="animate-spin" />}
                            Create
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event/Service *</label>
                    <select
                      value={selectedEvent_Form?._id || ''}
                      onChange={(e) => {
                        const evt = events.find((event) => event._id === e.target.value);
                        setSelectedEvent_Form(evt || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select event...</option>
                      {events.map((evt) => (
                        <option key={evt._id} value={evt._id}>
                          {evt.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Service Date for Recurring */}
                  {selectedEvent_Form?.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Date *</label>
                      <DatePicker
                        value={selectedServiceDate}
                        onChange={setSelectedServiceDate}
                      />
                    </div>
                  )}

                  {/* Member Selection (for member offerings) */}
                  {category === 'member' && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member *</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search member..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          onFocus={() => setShowMemberDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {memberSearchLoading && <Loader className="absolute right-3 top-3 animate-spin text-gray-400" size={18} />}
                      </div>
                      {showMemberDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {members.map((member) => (
                            <button
                              key={member._id}
                              onClick={() => {
                                setSelectedMemberId(member._id);
                                setSelectedMember(member);
                                setMemberSearchQuery('');
                                setShowMemberDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                            >
                              {member.firstName} {member.lastName}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedMember && (
                        <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-700 dark:text-blue-300 flex justify-between items-center">
                          <span>{selectedMember.firstName} {selectedMember.lastName}</span>
                          <button onClick={() => {
                            setSelectedMemberId(null);
                            setSelectedMember(null);
                          }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800">
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Amount and Date on same row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount ({currency}) *</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
                      <DatePicker
                        value={formData.date}
                        onChange={(date) => setFormData({ ...formData, date })}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                    <div className="flex gap-4">
                      {['cash', 'paystack'].map((method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method as any)}
                          className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                            paymentMethod === method
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {method === 'cash' ? 'Cash' : 'Paystack'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Paystack Reference */}
                  {paymentMethod === 'paystack' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Paystack Reference *</label>
                      <input
                        type="text"
                        value={formData.paystackReference}
                        onChange={(e) => setFormData({ ...formData, paystackReference: e.target.value })}
                        placeholder="Enter Paystack reference"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Source */}
                  {paymentMethod === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Source</label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                        placeholder="e.g., Sunday Service, Special Event"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {category && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setCategory(null);
                      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], paystackReference: '', source: '', notes: '' });
                      setSelectedEvent_Form(null);
                      setSelectedOfferingType_Form(null);
                      setSelectedServiceDate('');
                      setSelectedMemberId(null);
                      setSelectedMember(null);
                      setMemberSearchQuery('');
                      setPaymentMethod('cash');
                      setShowAddTypeInline(false);
                      setInlineNewTypeName('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddOffering}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader className="animate-spin" size={16} />}
                    Save Offering
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Types Modal */}
      {showManageTypes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Offering Types</h2>
              <button onClick={() => setShowManageTypes(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
              {/* Add New Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Add New Type</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="Type name..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={handleAddOfferingType}
                    disabled={typeSubmitting}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Existing Types</h3>
                {offeringTypes.map((type) => (
                  <div key={type._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{type.name}</div>
                      {type.isDefault && <div className="text-xs text-gray-500 dark:text-gray-400">Default</div>}
                    </div>
                    {!type.isDefault && (
                      <button
                        onClick={() => handleToggleOfferingType(type)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          type.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300'
                        }`}
                      >
                        {type.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowManageTypes(false)}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteOffering}
        title="Delete Offering"
        message="Are you sure you want to delete this offering record? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Offerings;
