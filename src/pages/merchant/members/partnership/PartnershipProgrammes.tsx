import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, Download, RefreshCw, Users, Target, TrendingUp, HandHeart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { partnershipAPI } from '../../../../services/api';
import { showToast } from '../../../../utils/toasts';
import { formatCurrency, getMerchantCurrency } from '../../../../utils/currency';
import PermissionGuard from '../../../../components/guards/PermissionGuard';

interface Tier {
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
}

interface PartnershipProgramme {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
    publicId: string;
  };
  tiers: Tier[];
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  stats: {
    totalPartners: number;
    activePartners: number;
    totalTransactions: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  dates?: {
    startDate?: string;
    endDate?: string;
    createdAt: string;
  };
}

const PartnershipProgrammes = () => {
  const navigate = useNavigate();
  const merchantCurrency = getMerchantCurrency();

  const [programmes, setProgrammes] = useState<PartnershipProgramme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    paused: 0,
    completed: 0,
    totalPartners: 0,
    totalRaised: 0,
  });

  useEffect(() => {
    fetchProgrammes();
  }, [statusFilter, dateFilter, customStartDate, customEndDate]);

  const fetchProgrammes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      // Add date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date(now.setHours(23, 59, 59, 999));
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.setHours(0, 0, 0, 0));
            endDate = new Date(yesterday.setHours(23, 59, 59, 999));
            break;
          case 'thisWeek':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            startDate = new Date(weekStart.setHours(0, 0, 0, 0));
            endDate = new Date();
            break;
          case 'lastWeek':
            const lastWeekEnd = new Date(now);
            lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
            const lastWeekStart = new Date(lastWeekEnd);
            lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
            startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
            endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
            break;
          case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            break;
          case 'lastMonth':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            startDate = lastMonth;
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
          case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date();
            break;
          case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
            break;
          case 'custom':
            if (customStartDate) startDate = new Date(customStartDate);
            if (customEndDate) endDate = new Date(customEndDate);
            break;
        }

        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();
      }

      const response = await partnershipAPI.getAll(params);
      const data = response.data.data;
      setProgrammes(data.programmes || []);
      console.log('Partnership programmes fetched:', data.programmes);

      // Calculate stats
      const all = data.programmes || [];
      setStats({
        total: all.length,
        active: all.filter((p: PartnershipProgramme) => p.status === 'active').length,
        draft: all.filter((p: PartnershipProgramme) => p.status === 'draft').length,
        paused: all.filter((p: PartnershipProgramme) => p.status === 'paused').length,
        completed: all.filter((p: PartnershipProgramme) => p.status === 'completed').length,
        totalPartners: all.reduce((sum: number, p: PartnershipProgramme) => sum + (p.stats?.totalPartners || 0), 0),
        totalRaised: all.reduce((sum: number, p: PartnershipProgramme) => sum + (p.goal?.raisedAmount || 0), 0),
      });
    } catch (error: any) {
      showToast.error('Failed to load partnership programmes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await partnershipAPI.delete(id);
      showToast.success('Partnership programme deleted successfully');
      fetchProgrammes();
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to delete partnership programme');
    }
  };

  const filteredProgrammes = programmes.filter((programme) => {
    const matchesSearch = searchQuery === '' ||
      programme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      programme.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-4 py-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <HandHeart className="w-8 h-8 text-purple-600" />
            Partnership Programmes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage partnership programmes with tiered giving levels
          </p>
        </div>
        <PermissionGuard permission="members.create">
          <button
            onClick={() => navigate('/members/partnership/new')}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Programme
          </button>
        </PermissionGuard>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Programmes Card */}
        <div className="relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-200 dark:bg-purple-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Programmes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-600/10 dark:bg-purple-500/10 rounded-lg">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Partners Card */}
        <div className="relative overflow-hidden rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-green-200 dark:bg-green-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Partners</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPartners}</p>
              </div>
              <div className="p-3 bg-green-600/10 dark:bg-green-500/10 rounded-lg">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Raised Card */}
        <div className="relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-200 dark:bg-blue-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Raised</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stats.totalRaised, merchantCurrency)}
                </p>
              </div>
              <div className="p-3 bg-blue-600/10 dark:bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Programmes Card */}
        <div className="relative overflow-hidden rounded-xl border border-pink-200 dark:border-pink-800 bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/10 p-6 hover:shadow-lg transition-all duration-300 group">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-200 dark:bg-pink-900/30 opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Programmes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.active}</p>
              </div>
              <div className="p-3 bg-pink-600/10 dark:bg-pink-500/10 rounded-lg">
                <HandHeart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search programmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="thisWeek">This Week</option>
              <option value="lastWeek">Last Week</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="thisYear">This Year</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Programmes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading programmes...</p>
        </div>
      ) : filteredProgrammes.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <HandHeart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No partnership programmes</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new partnership programme.</p>
          <PermissionGuard permission="members.create">
            <div className="mt-6">
              <button
                onClick={() => navigate('/members/partnership/new')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Programme
              </button>
            </div>
          </PermissionGuard>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProgrammes.map((programme) => {
            const raisedAmount = programme.goal?.raisedAmount || 0;
            const targetAmount = programme.goal?.targetAmount || 0;
            const progress = calculateProgress(raisedAmount, targetAmount);

            return (
              <div key={programme._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/members/partnership/${programme._id}`)}>

                {/* Cover Image with Overlay */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600">
                  {programme.coverImage?.url ? (
                    <img
                      src={programme.coverImage.url}
                      alt={programme.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${programme.status === 'active' ? 'bg-green-500/90 text-white' :
                      programme.status === 'draft' ? 'bg-gray-500/90 text-white' :
                        programme.status === 'paused' ? 'bg-yellow-500/90 text-white' :
                          'bg-blue-500/90 text-white'
                      }`}>
                      {programme.status.charAt(0).toUpperCase() + programme.status.slice(1)}
                    </span>
                  </div>

                  {/* Icon Placeholder */}
                  {!programme.coverImage?.url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <HandHeart className="w-16 h-16 text-white opacity-30" />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Title and Description */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {programme.name}
                    </h3>
                    {programme.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {programme.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Section */}
                  <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">PROGRESS</span>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {formatCurrency(raisedAmount, programme.goal?.currency || merchantCurrency)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {formatCurrency(targetAmount, programme.goal?.currency || merchantCurrency)}
                      </span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tiers</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{programme.tiers?.length || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Partners</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{programme.stats?.totalPartners || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-3 text-center">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payments</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{programme.stats?.totalTransactions || 0}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/members/partnership/${programme._id}`)}
                      className="inline-flex items-center justify-center px-3 py-2.5 border border-purple-300 dark:border-purple-700 shadow-sm text-sm font-semibold rounded-lg text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </button>
                    <PermissionGuard permission="members.update">
                      <button
                        onClick={() => navigate(`/members/partnership/${programme._id}/edit`)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-semibold rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 mr-1.5" />
                        Edit
                      </button>
                    </PermissionGuard>
                    <PermissionGuard permission="members.delete">
                      <button
                        onClick={() => handleDelete(programme._id, programme.name)}
                        className="inline-flex items-center justify-center px-3 py-2.5 border border-red-300 dark:border-red-700 shadow-sm text-sm font-semibold rounded-lg text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PartnershipProgrammes;
